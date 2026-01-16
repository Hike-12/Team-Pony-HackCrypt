const { 
  generateRegistrationOptions, 
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse 
} = require('@simplewebauthn/server');
const Student = require('../../models/Student');
const User = require('../../models/User');
const WebAuthnCredential = require('../../models/WebAuthnCredential');
const webauthnConfig = require('../../config/webauthn');

// Store challenges temporarily (use Redis in production)
const challenges = new Map();

/**
 * Generate registration options for enrolling biometric
 */
exports.generateRegistrationOptions = async (req, res) => {
  try {
    console.log('===== WEBAUTHN REGISTER OPTIONS =====');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    
    const { student_id } = req.body;
    
    if (!student_id) {
      return res.status(400).json({ message: 'student_id is required in request body' });
    }
    
    console.log('Looking for student with ID:', student_id);
    
    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    console.log('Found student:', { id: student._id, name: student.full_name, roll: student.roll_no });

    const user = await User.findById(student.user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingCredentials = await WebAuthnCredential.find({ 
      student_id: student._id, 
      is_active: true 
    });

    const options = await generateRegistrationOptions({
      rpName: webauthnConfig.rpName,
      rpID: webauthnConfig.rpID,
      userID: Buffer.from(student._id.toString()), // Convert ObjectId to Buffer
      userName: student.roll_no,
      userDisplayName: student.full_name,
      timeout: webauthnConfig.timeout,
      attestationType: 'none',
      excludeCredentials: existingCredentials.map(cred => ({
        id: Buffer.from(cred.credential_id, 'base64'),
        type: 'public-key',
        transports: cred.transports,
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: false,
        userVerification: 'required',
      },
    });

    // Store challenge temporarily with student's _id
    challenges.set(student._id.toString(), options.challenge);

    res.json(options);
  } catch (error) {
    console.error('Registration options error:', error);
    res.status(500).json({ message: 'Failed to generate registration options', error: error.message });
  }
};

/**
 * Verify registration response and store credential
 */
exports.verifyRegistration = async (req, res) => {
  try {
    const { student_id, credential } = req.body;

    const expectedChallenge = challenges.get(student_id);
    if (!expectedChallenge) {
      return res.status(400).json({ message: 'Challenge not found or expired' });
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: webauthnConfig.origin,
      expectedRPID: webauthnConfig.rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ message: 'Registration verification failed' });
    }

    console.log('Registration info:', verification.registrationInfo);

    // Extract credential data from the new structure
    const regInfo = verification.registrationInfo;
    const credentialData = regInfo.credential;
    
    // Validate we have the required data
    if (!credentialData || !credentialData.id || !credentialData.publicKey) {
      console.error('Missing credential data:', { 
        hasCredential: !!credentialData,
        hasId: !!credentialData?.id,
        hasPublicKey: !!credentialData?.publicKey 
      });
      return res.status(400).json({ message: 'Invalid credential data received from registration' });
    }

    // Store credential in database
    const webauthnCredential = new WebAuthnCredential({
      student_id, // This is the student's MongoDB _id
      credential_id: Buffer.from(credentialData.id).toString('base64'),
      public_key: Buffer.from(credentialData.publicKey).toString('base64'),
      counter: credentialData.counter || 0,
      device_type: credentialData.transports?.includes('internal') ? 'internal' : 'external',
      transports: credentialData.transports || [],
    });

    await webauthnCredential.save();

    // Clean up challenge
    challenges.delete(student_id);

    res.json({ 
      success: true, 
      message: 'Biometric enrolled successfully',
      credential_id: webauthnCredential._id 
    });
  } catch (error) {
    console.error('Registration verification error:', error);
    res.status(500).json({ message: 'Failed to verify registration', error: error.message });
  }
};

/**
 * Generate authentication options for attendance verification
 */
exports.generateAuthenticationOptions = async (req, res) => {
  try {
    const { student_id } = req.body;

    // Get student's credentials
    const credentials = await WebAuthnCredential.find({ 
      student_id,
      is_active: true 
    });

    if (credentials.length === 0) {
      return res.status(404).json({ message: 'No biometric credentials found. Please enroll first.' });
    }

    const options = await generateAuthenticationOptions({
      rpID: webauthnConfig.rpID,
      timeout: webauthnConfig.timeout,
      allowCredentials: credentials.map(cred => ({
        id: Buffer.from(cred.credential_id, 'base64'),
        type: 'public-key',
        transports: cred.transports,
      })),
      userVerification: 'required',
    });

    // Store challenge temporarily
    challenges.set(student_id, options.challenge);

    res.json(options);
  } catch (error) {
    console.error('Authentication options error:', error);
    res.status(500).json({ message: 'Failed to generate authentication options', error: error.message });
  }
};

/**
 * Verify authentication response for attendance
 */
exports.verifyAuthentication = async (req, res) => {
  try {
    const { student_id, credential, session_id } = req.body;

    const expectedChallenge = challenges.get(student_id);
    if (!expectedChallenge) {
      return res.status(400).json({ message: 'Challenge not found or expired' });
    }

    // Find the credential
    const credentialId = Buffer.from(credential.id, 'base64url').toString('base64');
    const dbCredential = await WebAuthnCredential.findOne({ 
      credential_id: credentialId,
      student_id,
      is_active: true 
    });

    if (!dbCredential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: webauthnConfig.origin,
      expectedRPID: webauthnConfig.rpID,
      authenticator: {
        credentialID: Buffer.from(dbCredential.credential_id, 'base64'),
        credentialPublicKey: Buffer.from(dbCredential.public_key, 'base64'),
        counter: dbCredential.counter,
      },
    });

    if (!verification.verified) {
      return res.status(400).json({ 
        success: false,
        message: 'Biometric verification failed' 
      });
    }

    // Update credential counter and last used
    dbCredential.counter = verification.authenticationInfo.newCounter;
    dbCredential.last_used = new Date();
    await dbCredential.save();

    // Clean up challenge
    challenges.delete(student_id);

    res.json({ 
      success: true,
      verified: true,
      message: 'Biometric verified successfully',
      biometric_type: 'WEBAUTHN',
      device_type: dbCredential.device_type
    });
  } catch (error) {
    console.error('Authentication verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to verify authentication', 
      error: error.message 
    });
  }
};

/**
 * Get enrolled credentials for a student
 */
exports.getEnrolledCredentials = async (req, res) => {
  try {
    const { student_id } = req.params;
    
    if (!student_id || student_id === 'undefined' || student_id === 'null') {
      return res.status(400).json({ message: 'Valid student_id is required' });
    }

    const credentials = await WebAuthnCredential.find({ 
      student_id,
      is_active: true 
    }).select('device_type enrolled_at last_used transports');

    res.json({ 
      credentials,
      has_biometric: credentials.length > 0 
    });
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({ message: 'Failed to fetch credentials', error: error.message });
  }
};

/**
 * Remove a credential
 */
exports.removeCredential = async (req, res) => {
  try {
    const { credential_id } = req.params;
    const { student_id } = req.body;
    
    if (!credential_id || credential_id === 'undefined' || credential_id === 'null') {
      return res.status(400).json({ message: 'Valid credential_id is required' });
    }
    
    if (!student_id || student_id === 'undefined' || student_id === 'null') {
      return res.status(400).json({ message: 'Valid student_id is required' });
    }

    const credential = await WebAuthnCredential.findOne({ 
      _id: credential_id,
      student_id 
    });

    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    credential.is_active = false;
    await credential.save();

    res.json({ message: 'Credential removed successfully' });
  } catch (error) {
    console.error('Remove credential error:', error);
    res.status(500).json({ message: 'Failed to remove credential', error: error.message });
  }
};