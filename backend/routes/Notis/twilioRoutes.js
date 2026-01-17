const express = require('express');
const router = express.Router();
const twilioController = require('../../controllers/Notis/twilioController');

router.post('/send-attendance-whatsapp', twilioController.sendAttendanceWhatsApp);
router.post('/send-custom-whatsapp', twilioController.sendCustomWhatsApp);

module.exports = router;