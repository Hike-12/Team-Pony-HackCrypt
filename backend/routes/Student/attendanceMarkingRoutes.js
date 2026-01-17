const express = require('express');
const router = express.Router();
const { markAttendance, getActiveAttendanceSession, quickMarkAttendance, getAttempts } = require('../../controllers/Student/attendanceMarkingController');
const { authenticateToken, isStudent } = require('../../middleware/authMiddleware');

router.post('/mark', authenticateToken, isStudent, markAttendance);
router.get('/active-session', authenticateToken, isStudent, getActiveAttendanceSession);
router.post('/quick-mark', authenticateToken, isStudent, quickMarkAttendance);

router.get('/attempts/:sessionId', authenticateToken, isStudent, getAttempts);
module.exports = router;