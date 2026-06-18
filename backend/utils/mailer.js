const nodemailer = require('nodemailer')

const createTransporter = () => {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })
}

const sendLoginOtpEmail = async ({ to, name, otp }) => {
  const transporter = createTransporter()
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: 'Your login verification code',
    text: `Hello ${name || 'user'}, your login verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Hello ${name || 'user'},</p><p>Your login verification code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`,
  })
}

module.exports = {
  sendLoginOtpEmail,
  createTransporter,
}