const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendTerminationEmail = async (hostEmail, userEmail, reason) => {
  try {
    const timestamp = new Date().toLocaleString();
    const mailOptions = {
      from: `"IntegriMeet Security" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      cc: hostEmail,
      subject: 'Interview Terminated - Violation Detected',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ef4444;">Interview Session Terminated</h2>
          <p>Dear Participant,</p>
          <p>Your interview session has been automatically terminated by IntegriMeet's anti-cheating system.</p>
          <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <strong>Violation Detected:</strong> ${reason}<br>
            <strong>Timestamp:</strong> ${timestamp}
          </div>
          <p>This action has been logged and the host has been notified.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">This is an automated message from IntegriMeet Security System.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Termination email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendTerminationEmail };
