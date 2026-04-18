const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendPasswordResetEmail = async (email, firstName, resetToken) => {
  const mailOptions = {
    from: `"Campus Attendance" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1a1a2e;">Hi ${firstName},</h2>
        <p>You requested a password reset for your Campus Attendance account.</p>
        <p>Your OTP code is:</p>
        <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">
          ${resetToken}
        </div>
        <p style="color: #888; font-size: 13px; margin-top: 16px;">This code expires in <strong>15 minutes</strong>. If you didn't request this, ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };