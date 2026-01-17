const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.checkAndSendAttendanceEmail = async (req, res) => {
  try {
    const { 
      studentName = 'Student', 
      email = 'russeldanielpaul@gmail.com', 
      attendancePercentage, 
      canRecover 
    } = req.body;

    // Only send if attendance is below 80%
    if (attendancePercentage >= 80) {
      return res.status(200).json({ 
        message: 'Attendance is above 80%, no email needed.', 
        sent: false 
      });
    }

    let subject = '';
    let htmlContent = '';

    const commonStyle = `
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      background-color: #ffffff;
    `;

    const header = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4f46e5; margin: 0;">Attendance Alert</h1>
        <p style="color: #666; font-size: 16px;">Important Update Regarding Your Academic Status</p>
      </div>
    `;

    if (canRecover) {
      subject = '⚠️ Attendance Alert: Action Required to Reach 75%';
      htmlContent = `
        <div style="${commonStyle}">
          ${header}
          <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; font-weight: bold; color: #92400e;">Current Attendance: ${attendancePercentage}%</p>
          </div>
          <p>Hey <strong>${studentName}</strong>,</p>
          <p>We noticed your attendance has dipped below our recommended threshold. However, we've crunched the numbers, and here's the good news:</p>
          <h2 style="color: #059669; text-align: center;">You can still make it! 🚀</h2>
          <p>It is mathematically possible for you to reach the <strong>75%</strong> requirement by the end of the semester. But you must be diligent from now on.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Detailed Report</a>
          </div>

          <p>Buckle up and attend your remaining classes. You've got this!</p>
          <p style="margin-top: 30px; border-top: 1px solid #eee; pt-3; font-size: 12px; color: #999;">Best regards,<br>Academic Administration</p>
        </div>
      `;
    } else {
      subject = '⚠️ Attendance Alert: Special Exams Notice';
      htmlContent = `
        <div style="${commonStyle}">
          ${header}
          <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; font-weight: bold; color: #b91c1c;">Current Attendance: ${attendancePercentage}%</p>
          </div>
          <p>Hey <strong>${studentName}</strong>,</p>
          <p>We are writing to inform you about your current attendance status.</p>
          <h2 style="color: #dc2626; text-align: center;">Critical Status Update</h2>
          <p>Unfortunately, based on the remaining sessions, it is no longer mathematically possible to reach the <strong>75%</strong> threshold for this semester.</p>
          <p>We strongly recommend you start preparing for the <strong>Special Exams</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
             <a href="#" style="background-color: #dc2626; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Special Exam Schedule</a>
          </div>

          <p>Please contact the administration if you believe this is an error.</p>
          <p style="margin-top: 30px; border-top: 1px solid #eee; pt-3; font-size: 12px; color: #999;">Best regards,<br>Academic Administration</p>
        </div>
      `;
    }

    const mailOptions = {
      from: `"HackCrypt Admin" <${process.env.EMAIL_USER}>`,
      to: email, // Default is russeldanielpaul@gmail.com
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);

    res.status(200).json({ 
      success: true, 
      message: 'Email notification sent successfully', 
      messageId: info.messageId,
      sentTo: email
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email', 
      error: error.message 
    });
  }
};
