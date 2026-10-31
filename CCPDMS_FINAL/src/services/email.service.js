const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
const FROM = `"CCPDMS Placement Cell" <${process.env.EMAIL_USER}>`;
// ── Single email ──────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    await transporter.sendMail({ from: FROM, to, subject, text, html });
    return true;
  } catch (err) {
    console.error(`[Email] Failed → ${to}: ${err.message}`);
    return false;
  }
};
// ── Bulk emails (fire-and-forget, batched 50 at a time) ───────────────────────
const sendBulkEmails = async ({ to, subject, text, html }) => {
  const BATCH_SIZE = 50;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < to.length; i += BATCH_SIZE) {
    const batch = to.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map((email) =>
        sendEmail({
          to: email,
          subject,
          text,
          html,
        })
      )
    );

    results.forEach((result) => {
      if (result) sent += 1;
      else failed += 1;
    });

    if (i + BATCH_SIZE < to.length) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  return { sent, failed };
};
// ── OTP email ─────────────────────────────────────────────────────────────────
const sendOTPEmail = (email, otp) =>
  sendEmail({
    to:      email,
    subject: 'CCPDMS — Password Reset OTP',
    text:    `Your OTP for password reset is: ${otp}\n\nValid for 10 minutes. Do not share this OTP with anyone.\n\n— Placement Cell`,
  });

// ── Resume reminder (sent every 10 days via cron) ─────────────────────────────
const sendResumeReminder = (email, name) =>
  sendEmail({
    to:      email,
    subject: 'CCPDMS — Update Your Resume',
    text:    `Dear ${name},\n\nIt has been 10 days since you last updated your resume. Please keep it up-to-date to be ready for upcoming drives.\n\nLogin: ${process.env.APP_URL || 'http://localhost:3000'}/profile\n\n— Placement Cell`,
  });
module.exports = { sendEmail, sendBulkEmails, sendOTPEmail, sendResumeReminder };