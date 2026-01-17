const express = require('express');
const router = express.Router();
const { markAttendance, getActiveAttendanceSession } = require('../../controllers/Student/attendanceMarkingController');
const { authenticateToken, isStudent } = require('../../middleware/authMiddleware');

router.post('/mark', authenticateToken, isStudent, markAttendance);
router.get('/active-session', authenticateToken, isStudent, getActiveAttendanceSession);

module.exports = router;