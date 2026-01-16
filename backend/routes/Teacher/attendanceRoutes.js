const express = require('express');
const router = express.Router();
const { verifyStudentAttendance, getCurrentLecture, getUserStudentId } = require('../../controllers/Teacher/attendanceController');
const { authenticateToken, isTeacher } = require('../../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(isTeacher);

// Convert User ID to Student ID (used when QR contains user_id)
router.get('/get-student-id/:userId', getUserStudentId);

// Verify student attendance via QR scan
router.post('/verify-student', verifyStudentAttendance);

// Get current active lecture for the teacher
router.get('/current-lecture', getCurrentLecture);

module.exports = router;
