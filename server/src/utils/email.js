const crypto = require('crypto');

/**
 * Generate a secure reset token and its hashed version.
 * Store the hash in DB, send the raw token to the user.
 */
function generateResetToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

/**
 * Hash a raw token for comparison with the stored hash.
 */
function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Simple console-based email sender (swap with nodemailer/sendgrid in production).
 * Returns the reset URL so it can be surfaced in dev mode.
 */
async function sendPasswordResetEmail({ to, name, resetUrl }) {
  // ── Production: uncomment and configure nodemailer ──────────────────────────
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: process.env.SMTP_PORT,
  //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  // });
  // await transporter.sendMail({
  //   from: `"LifeTrack" <${process.env.FROM_EMAIL}>`,
  //   to,
  //   subject: 'Reset your LifeTrack password',
  //   html: `<p>Hi ${name},</p>
  //          <p>Click the link below to reset your password (expires in 10 minutes):</p>
  //          <a href="${resetUrl}">${resetUrl}</a>`,
  // });
  // ── Development: just log it ────────────────────────────────────────────────
  console.log('\n📧  Password reset email');
  console.log(`   To:  ${to}`);
  console.log(`   URL: ${resetUrl}\n`);
  return resetUrl;
}

module.exports = { generateResetToken, hashToken, sendPasswordResetEmail };
