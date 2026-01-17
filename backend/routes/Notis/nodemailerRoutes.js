const express = require('express');
const router = express.Router();
const emailController = require('../../controllers/Notis/emailController');

router.post('/check-attendance', emailController.checkAndSendAttendanceEmail);

module.exports = router;
