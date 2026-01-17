const express = require('express');
const router = express.Router();
const { exportLowAttendanceStudents, getLowAttendanceStats } = require('../../controllers/Teacher/exportController');

// Get statistics about low attendance students
router.get('/stats', getLowAttendanceStats);

// Export low attendance students to CSV
router.get('/export', exportLowAttendanceStudents);

module.exports = router;
