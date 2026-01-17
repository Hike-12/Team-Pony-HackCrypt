const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendAttendanceWhatsApp = async (req, res) => {
  try {
    const { 
      phoneNumber = '+918097996263',
      studentName = 'Student',
      attendancePercentage,
      canRecover 
    } = req.body;

    // Only send if attendance is below 80%
    if (attendancePercentage >= 80) {
      return res.status(200).json({ 
        message: 'Attendance is above 80%, no message needed.', 
        sent: false 
      });
    }

    let messageBody = '';

    if (canRecover) {
      messageBody = `👋 Hi ${studentName}!\n\nYour current attendance is ${attendancePercentage}% ⚠️\n\n✅ Good news! You can still reach 75% by end of semester.\n\n📌 Attend all remaining classes. You've got this! 🚀\n\n#HackCrypt`;
    } else {
      messageBody = `👋 Hi ${studentName}!\n\nYour current attendance is ${attendancePercentage}% ⚠️\n\n❌ Unfortunately, reaching 75% is no longer possible this semester.\n\n📌 Start preparing for Special Exams.\nContact admin if you have questions.\n\n#HackCrypt`;
    }

    // Send WhatsApp message
    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${phoneNumber}`,
      body: messageBody
    });

    console.log('WhatsApp message sent: %s', message.sid);

    res.status(200).json({
      success: true,
      message: 'WhatsApp message sent successfully',
      messageSid: message.sid,
      sentTo: phoneNumber
    });

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send WhatsApp message',
      error: error.message
    });
  }
};

exports.sendCustomWhatsApp = async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }

    // Send custom WhatsApp message
    const result = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${phoneNumber}`,
      body: message
    });

    console.log('Custom WhatsApp message sent: %s', result.sid);

    res.status(200).json({
      success: true,
      message: 'Custom WhatsApp message sent successfully',
      messageSid: result.sid,
      sentTo: phoneNumber
    });

  } catch (error) {
    console.error('Error sending custom WhatsApp message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send WhatsApp message',
      error: error.message
    });
  }
};
