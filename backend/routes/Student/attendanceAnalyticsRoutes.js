const express = require('express');
const router = express.Router();
const { getStudentAttendanceAnalytics, getSubjectWiseStats } = require('../../controllers/Student/attendanceAnalyticsController');
const studentAuth = require('../../middleware/authMiddleware').studentAuth;

// Get comprehensive attendance analytics
router.get('/analytics/:studentId', getStudentAttendanceAnalytics);

// Get subject-wise detailed stats
router.get('/subject-stats/:studentId', getSubjectWiseStats);

module.exports = router;
