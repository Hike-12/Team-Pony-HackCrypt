const StudentBiometric = require('../../models/StudentBiometric');
const Student = require('../../models/Student');

// Enroll face
exports.enrollFace = async (req, res) => {
  try {
    const { student_id, face_embedding } = req.body;

    if (!student_id || !face_embedding) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify student exists
    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if already enrolled
    let biometric = await StudentBiometric.findOne({ student_id });

    if (biometric) {
      // Update existing
      biometric.face_embedding = face_embedding;
      biometric.face_enrolled = true;
      biometric.face_updated_at = new Date();
      biometric.consent_given = true;
      biometric.consent_at = new Date();
    } else {
      // Create new
      biometric = new StudentBiometric({
        student_id,
        face_embedding,
        face_enrolled: true,
        face_updated_at: new Date(),
        consent_given: true,
        consent_at: new Date(),
      });
    }

    await biometric.save();
    res.status(201).json({ message: 'Face enrolled successfully', biometric });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ error: 'Server error during enrollment' });
  }
};

// Get face embedding for a student
exports.getFaceEmbedding = async (req, res) => {
  try {
    const { student_id } = req.params;

    const biometric = await StudentBiometric.findOne({ student_id });
    
    if (!biometric || !biometric.face_enrolled) {
      return res.status(404).json({ error: 'Face not enrolled for this student' });
    }

    res.json({
      face_embedding: biometric.face_embedding,
      face_enrolled: biometric.face_enrolled,
      face_updated_at: biometric.face_updated_at,
    });
  } catch (err) {
    console.error('Get embedding error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Check enrollment status
exports.checkEnrollmentStatus = async (req, res) => {
  try {
    const { student_id } = req.params;

    const biometric = await StudentBiometric.findOne({ student_id });
    
    res.json({
      enrolled: biometric ? biometric.face_enrolled : false,
      consent_given: biometric ? biometric.consent_given : false,
    });
  } catch (err) {
    console.error('Check status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete face enrollment
exports.deleteFaceEnrollment = async (req, res) => {
  try {
    const { student_id } = req.params;

    const biometric = await StudentBiometric.findOne({ student_id });
    
    if (!biometric) {
      return res.status(404).json({ error: 'No enrollment found' });
    }

    biometric.face_enrolled = false;
    biometric.face_embedding = null;
    biometric.deleted_at = new Date();
    await biometric.save();

    res.json({ message: 'Face enrollment deleted successfully' });
  } catch (err) {
    console.error('Delete enrollment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
