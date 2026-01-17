const AttendanceSession = require('../../models/AttendanceSession');
const AttendanceAttempt = require('../../models/AttendanceAttempt');
const AttendanceRecord = require('../../models/AttendanceRecord');
const StudentBiometric = require('../../models/StudentBiometric');
const SessionQRToken = require('../../models/SessionQRToken');
const geofencingController = require('./geofencingController');
const webauthnController = require('./webauthnController');
const Student = require('../../models/Student');

exports.getActiveAttendanceSession = async (req, res) => {
  try {
    const studentId = req.user.student_id;
    const student = await Student.findById(studentId).populate('class_id');
    if (!student || !student.class_id) {
      return res.status(400).json({ success: false, message: 'Student or class not found' });
    }

    const now = new Date();
    // Find active session for student's class
    const session = await AttendanceSession.findOne({
      is_active: true,
      starts_at: { $lte: now },
      ends_at: { $gte: now },
      // Join with Timetable logic if needed
    }).populate('teacher_subject_id');

    if (!session) {
      return res.status(400).json({ success: false, message: 'No active attendance session' });
    }

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Robust Euclidean Distance Calculation
 * Handles cases where descriptor is passed as an Object {0: val, ...} instead of Array
 */
function euclideanDistance(arr1, arr2) {
  if (!arr1 || !arr2) return Infinity;

  // Convert objects to arrays if strictly necessary (handles serialization artifacts)
  const a1 = Array.isArray(arr1) ? arr1 : Object.values(arr1);
  const a2 = Array.isArray(arr2) ? arr2 : Object.values(arr2);

  if (a1.length === 0 || a2.length === 0 || a1.length !== a2.length) return Infinity;

  let sum = 0;
  for (let i = 0; i < a1.length; i++) {
    sum += Math.pow(a1[i] - a2[i], 2);
  }
  return Math.sqrt(sum);
}

exports.markAttendance = async (req, res) => {
  try {
    const studentId = req.user.student_id;
    const { sessionId, faceData, biometricData, location, qrToken } = req.body;

    console.log("FACE DATA", faceData);

    // 1. Find active session
    const session = await AttendanceSession.findById(sessionId);
    if (!session || !session.is_active) {
      return res.status(400).json({ success: false, message: 'No active session' });
    }

    let attempt = {
      session_id: sessionId,
      student_id: studentId,
      attempt_status: 'FAILED',
      fail_reason: '',
      face_verified: null,
      face_score: null,
      liveness_verified: null,
      biometric_verified: null,
      biometric_type: null,
      location_verified: null,
      qr_valid: null,
      qr_token: qrToken,
      student_lat: location?.latitude,
      student_lng: location?.longitude,
    };

    let allPassed = true;

    // --- Face Verification ---
    if (session.enable_face) {
      const biometric = await StudentBiometric.findOne({ student_id: studentId });
      console.log("BIOMETRIC", biometric);
      if (!biometric || !biometric.face_enrolled || !biometric.face_embedding) {
        attempt.face_verified = false;
        attempt.fail_reason += 'Face not enrolled. ';
        allPassed = false;
      } else if (!faceData || !faceData.descriptor) {
        attempt.face_verified = false;
        attempt.fail_reason += 'No face data provided. ';
        allPassed = false;
      } else {
        console.log("HERE");
        // Safe comparison using robust distance function
        const score = euclideanDistance(faceData.descriptor, biometric.face_embedding);
        
        attempt.face_score = score;
        attempt.face_verified = score < 0.45; // Threshold
        attempt.liveness_verified = faceData.liveness === true;
        
        if (!attempt.face_verified) {
          attempt.fail_reason += `Face mismatch (Score: ${score.toFixed(3)}). `;
          allPassed = false;
        }
        if (!attempt.liveness_verified) {
          attempt.fail_reason += 'Liveness failed. ';
          allPassed = false;
        }
      }
    }

    // --- Biometric Verification (WebAuthn) ---
    if (session.enable_biometric) {
      if (!biometricData || !biometricData.credential) {
        attempt.biometric_verified = false;
        attempt.fail_reason += 'No biometric data provided. ';
        allPassed = false;
      } else {
        req.body.student_id = studentId;
        req.body.credential = biometricData.credential;
        req.body.session_id = sessionId;
        const result = await webauthnController.verifyAuthenticationInternal(req.body);
        attempt.biometric_verified = result.verified;
        attempt.biometric_type = 'WEBAUTHN';
        if (!result.verified) {
          attempt.fail_reason += 'Biometric check failed. ';
          allPassed = false;
        }
      }
    }

    // --- Geofencing Verification ---
    if (session.enable_geofencing) {
      if (!location || location.latitude === undefined || location.longitude === undefined) {
        attempt.location_verified = false;
        attempt.fail_reason += 'No location data provided. ';
        allPassed = false;
      } else {
        const geoResult = await geofencingController.verifyLocationInternal({
          class_id: session.teacher_subject_id.class_id || student.class_id, // Ensure we check against active session class or student class
          latitude: location.latitude,
          longitude: location.longitude
        });
        attempt.location_verified = geoResult.verified;
        attempt.student_lat = location.latitude;
        attempt.student_lng = location.longitude;
        if (!geoResult.verified) {
          attempt.fail_reason += 'Out of location bounds. ';
          allPassed = false;
        }
      }
    }

    // --- QR Verification ---
    if (session.enable_dynamic_qr || session.enable_static_qr) {
      if (!qrToken) {
        attempt.qr_valid = false;
        attempt.fail_reason += 'No QR token provided. ';
        allPassed = false;
      } else {
        // Validate QR token logic
        const qrRecord = await SessionQRToken.findOne({
          token: qrToken,
          session_id: sessionId
        });
        if (!qrRecord) {
          attempt.qr_valid = false;
          attempt.fail_reason += 'QR invalid. ';
          allPassed = false;
        } else {
          const now = new Date();
          attempt.qr_valid = now <= qrRecord.valid_until;
          if (!attempt.qr_valid) {
            attempt.fail_reason += 'QR expired. ';
            allPassed = false;
          }
        }
      }
    }

    attempt.attempt_status = allPassed ? 'SUCCESS' : 'FAILED';

    // 4. Log attempt
    const attemptDoc = await AttendanceAttempt.create(attempt);

    console.log("ALL PASSED", allPassed);

    // 5. Mark attendance if all passed
    if (allPassed) {
      // Check if already marked for this session to avoid duplicates
      const existingRecord = await AttendanceRecord.findOne({
        session_id: sessionId,
        student_id: studentId
      });
      console.log("Attendance Record", existingRecord);

      if (!existingRecord) {
        await AttendanceRecord.create({
          session_id: sessionId,
          student_id: studentId,
          status: 'PRESENT',
          marked_at: new Date(),
          source_attempt_id: attemptDoc._id
        });
      }
      return res.status(200).json({ success: true, message: 'Attendance marked!', details: attempt });
    } else {
    console.log("You are already present");
      return res.status(400).json({ success: false, message: 'Verification failed', details: attempt });
    }
  } catch (error) {
    console.error('Mark Attendance Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// --- Internal helpers for direct function calls ---
exports.verifyAuthenticationInternal = async (body) => {
  try {
    const { student_id, credential, session_id } = body;
    // ...integration with webauthn logic...
    return { verified: true };
  } catch (error) {
    return { verified: false };
  }
};

exports.verifyLocationInternal = async (body) => {
  try {
    const { class_id, latitude, longitude } = body;
    // ...integration with geofencing logic...
    return { verified: true };
  } catch (error) {
    return { verified: false };
  }
};