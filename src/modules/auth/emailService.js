const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER || 'support.lawyerslog@gmail.com';
const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

const transporter = emailPass
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    })
  : nodemailer.createTransport({ jsonTransport: true });

const sendOtpEmail = async (email, otp) => {
  if (!emailPass) {
    console.error(`EMAIL_PASS not configured. OTP for ${email}: ${otp}`);
    return;
  }

  const info = await transporter.sendMail({
    from: `LawyersLog <${emailUser}>`,
    to: email,
    subject: 'LawyersLog OTP Verification',
    html: `<p>Your LawyersLog OTP is:</p><h2>${otp}</h2><p>This OTP expires in 5 minutes.</p>`
  });

  console.log('OTP email sent:', {
    to: email,
    accepted: info.accepted,
    rejected: info.rejected,
    messageId: info.messageId
  });
};

module.exports = { sendOtpEmail };
