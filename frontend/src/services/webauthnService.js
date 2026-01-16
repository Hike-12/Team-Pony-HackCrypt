import { 
  startRegistration, 
  startAuthentication 
} from '@simplewebauthn/browser';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/student/webauthn`;

/**
 * Check if WebAuthn is supported
 */
export const isWebAuthnSupported = () => {
  return window.PublicKeyCredential !== undefined &&
         typeof window.PublicKeyCredential === 'function';
};

/**
 * Check if platform authenticator is available (Touch ID, Face ID, Windows Hello)
 */
export const isPlatformAuthenticatorAvailable = async () => {
  if (!isWebAuthnSupported()) return false;
  
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (error) {
    console.error('Platform authenticator check failed:', error);
    return false;
  }
};

/**
 * Enroll biometric for a student
 */
export const enrollBiometric = async (studentId) => {
  try {
    console.log('===== ENROLLING BIOMETRIC =====');
    console.log('Student ID:', studentId);
    
    if (!studentId) {
      throw new Error('Student ID is required but was undefined or null');
    }
    
    // Check support first
    const isSupported = await isPlatformAuthenticatorAvailable();
    if (!isSupported) {
      throw new Error('Biometric authentication not supported on this device');
    }

    // Get registration options from server
    console.log('Fetching registration options...');
    const optionsResponse = await fetch(`${API_BASE_URL}/register/options`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ student_id: studentId }),
    });

    console.log('Options response status:', optionsResponse.status);
    
    if (!optionsResponse.ok) {
      const errorText = await optionsResponse.text();
      console.error('Failed to get registration options:', errorText);
      throw new Error('Failed to get registration options');
    }

    const options = await optionsResponse.json();
    console.log('Received registration options:', options);

    // Start registration with browser API
    console.log('Starting registration with browser...');
    const credential = await startRegistration(options);
    console.log('Registration complete, credential:', credential);

    // Verify registration with server
    console.log('Verifying registration with server...');
    const verifyResponse = await fetch(`${API_BASE_URL}/register/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ 
        student_id: studentId, 
        credential 
      }),
    });

    console.log('Verify response status:', verifyResponse.status);

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error('Failed to verify registration:', errorText);
      throw new Error('Failed to verify registration');
    }

    const result = await verifyResponse.json();
    console.log('Registration verified successfully:', result);
    return result;
  } catch (error) {
    console.error('Enrollment error:', error);
    throw error;
  }
};

/**
 * Verify biometric for attendance (Step 4 of pipeline)
 */
export const verifyBiometric = async (studentId, sessionId = null) => {
  try {
    console.log('===== VERIFYING BIOMETRIC =====');
    console.log('Student ID:', studentId);
    console.log('Session ID:', sessionId);
    
    if (!studentId) {
      throw new Error('Student ID is required but was undefined or null');
    }
    
    // Check support first
    const isSupported = await isPlatformAuthenticatorAvailable();
    if (!isSupported) {
      throw new Error('Biometric authentication not supported on this device');
    }

    // Get authentication options from server
    const optionsResponse = await fetch(`${API_BASE_URL}/authenticate/options`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ student_id: studentId }),
    });

    if (!optionsResponse.ok) {
      const error = await optionsResponse.json();
      throw new Error(error.message || 'Failed to get authentication options');
    }

    const options = await optionsResponse.json();

    // Start authentication with browser API
    const credential = await startAuthentication(options);

    // Verify authentication with server
    const verifyResponse = await fetch(`${API_BASE_URL}/authenticate/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ 
        student_id: studentId,
        session_id: sessionId,
        credential 
      }),
    });

    if (!verifyResponse.ok) {
      throw new Error('Failed to verify authentication');
    }

    const result = await verifyResponse.json();
    return result;
  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
};

/**
 * Get enrolled credentials for a student
 */
export const getEnrolledCredentials = async (studentId) => {
  try {
    if (!studentId) {
      throw new Error('Student ID is required');
    }
    
    const response = await fetch(`${API_BASE_URL}/credentials/${studentId}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch credentials');
    }

    return await response.json();
  } catch (error) {
    console.error('Get credentials error:', error);
    throw error;
  }
};

/**
 * Remove a credential
 */
export const removeCredential = async (credentialId, studentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/credentials/${credentialId}`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ student_id: studentId }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove credential');
    }

    return await response.json();
  } catch (error) {
    console.error('Remove credential error:', error);
    throw error;
  }
};