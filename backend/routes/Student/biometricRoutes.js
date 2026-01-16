const express = require('express');
const router = express.Router();
const biometricController = require('../../controllers/Student/biometricController');

// Enroll face
router.post('/enroll', biometricController.enrollFace);

// Get face embedding
router.get('/:student_id', biometricController.getFaceEmbedding);

// Check enrollment status
router.get('/:student_id/status', biometricController.checkEnrollmentStatus);

// Delete enrollment
router.delete('/:student_id', biometricController.deleteFaceEnrollment);

module.exports = router;
