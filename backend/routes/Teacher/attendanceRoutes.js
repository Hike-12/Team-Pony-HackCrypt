const express = require('express');
const router = express.Router();
const { verifyStudentAttendance, getCurrentLecture, getUserStudentId, startAttendanceSession, getTodaysLectures, getActiveSessions } = require('../../controllers/Teacher/attendanceController');
const { 
    startQRAttendance, 
    refreshQRToken, 
    stopQRAttendance, 
    scanQRAttendance,
    getSessionAttendance,
} = require('../../controllers/Teacher/qrAttendanceController');
const { authenticateToken, isTeacher, isStudent } = require('../../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// QR Attendance routes (students can scan)
router.post('/qr/scan', isStudent, scanQRAttendance);

// Teacher-only routes
router.use(isTeacher);

// Convert User ID to Student ID (used when QR contains user_id)
router.get('/get-student-id/:userId', getUserStudentId);

// Verify student attendance via QR scan
router.post('/verify-student', verifyStudentAttendance);

// Get current active lecture for the teacher
router.get('/current-lecture', getCurrentLecture);

router.post('/start-session', startAttendanceSession);
router.get('/today-lectures', getTodaysLectures);
router.get('/active-sessions', getActiveSessions);

// Stats endpoint
router.get('/stats', async (req, res) => {
  res.json({ success: true, stats: { totalStudents: 0, attendanceRate: 0 } });
});

// QR Attendance - Teacher routes
router.post('/qr/start', startQRAttendance);
router.get('/qr/refresh/:sessionId', refreshQRToken);
router.post('/qr/stop/:sessionId', stopQRAttendance);
router.get('/qr/session/:sessionId/attendance', getSessionAttendance);

module.exports = router;
