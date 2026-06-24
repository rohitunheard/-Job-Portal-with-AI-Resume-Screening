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

const sendApplicationStatusEmail = async ({ to, name, status, jobTitle, companyName, location }) => {
  const transporter = createTransporter()
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER
  const safeName = name || 'candidate'
  const safeJobTitle = jobTitle || 'the role'
  const safeCompanyName = companyName || 'the employer'
  const locationLine = location ? `\nLocation: ${location}` : ''

  const isShortlisted = status === 'Shortlisted'
  const subject = isShortlisted
    ? `Congratulations! You were shortlisted for ${safeJobTitle}`
    : `Application update for ${safeJobTitle}`
  const text = isShortlisted
    ? `Hello ${safeName},\n\nGreat news! You have been shortlisted for ${safeJobTitle} at ${safeCompanyName}.${locationLine}\n\nYou can now chat with the employer from this applied role in the job portal.\n\nBest of luck!`
    : `Hello ${safeName},\n\nThank you for applying for ${safeJobTitle} at ${safeCompanyName}.${locationLine}\n\nAfter reviewing your application, the employer has decided not to move forward for this role.\n\nKeep applying to roles that match your profile.`
  const html = isShortlisted
    ? `<p>Hello ${safeName},</p><p>Great news! You have been shortlisted for <strong>${safeJobTitle}</strong> at <strong>${safeCompanyName}</strong>.</p>${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}<p>You can now chat with the employer from this applied role in the job portal.</p><p>Best of luck!</p>`
    : `<p>Hello ${safeName},</p><p>Thank you for applying for <strong>${safeJobTitle}</strong> at <strong>${safeCompanyName}</strong>.</p>${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}<p>After reviewing your application, the employer has decided not to move forward for this role.</p><p>Keep applying to roles that match your profile.</p>`

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text,
    html,
  })
}

const sendShortlistEmail = async (details) => {
  await sendApplicationStatusEmail({ ...details, status: 'Shortlisted' })
}

module.exports = {
  sendLoginOtpEmail,
  sendApplicationStatusEmail,
  sendShortlistEmail,
  createTransporter,
}
