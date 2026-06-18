const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Employer = require('../models/employer')
const { createOtpCode, hashOtpCode } = require('../utils/otp')
const { sendLoginOtpEmail } = require('../utils/mailer')
const { authEmployer } = require('../middleware/auth')

const SECRET = process.env.JWT_SECRET || 'jobportal_secret'
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d'

const uploadDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})
const upload = multer({ storage })

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, companyName, email, password } = req.body
    if (!name || !companyName || !email || !password)
      return res.status(400).json({ message: 'All fields are required' })

    const exists = await Employer.findOne({ email: email.trim().toLowerCase() })
    if (exists) return res.status(409).json({ message: 'Account already exists with this email' })

    const hashed = await bcrypt.hash(password, 10)
    const employer = new Employer({ name, companyName, email: email.trim().toLowerCase(), password: hashed })
    await employer.save()
    res.status(201).json({ message: 'Employer account created successfully' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Login — send OTP
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

    const employer = await Employer.findOne({ email: email.trim().toLowerCase() })
    if (!employer) return res.status(401).json({ message: 'Invalid email or password' })

    const match = await bcrypt.compare(password, employer.password)
    if (!match) return res.status(401).json({ message: 'Invalid email or password' })

    const otp = createOtpCode()
    employer.loginOtpHash = hashOtpCode(otp)
    employer.loginOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await employer.save()

    await sendLoginOtpEmail({ to: employer.email, name: employer.name, otp })
    res.json({ message: 'Verification code sent to your email', email: employer.email })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Verify OTP — issue JWT
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' })

    const employer = await Employer.findOne({ email: email.trim().toLowerCase() })
    if (!employer || !employer.loginOtpHash)
      return res.status(400).json({ message: 'OTP request not found or expired' })

    if (employer.loginOtpExpiresAt < new Date())
      return res.status(400).json({ message: 'OTP has expired. Please log in again.' })

    if (employer.loginOtpHash !== hashOtpCode(otp))
      return res.status(401).json({ message: 'Invalid OTP' })

    employer.loginOtpHash = ''
    employer.loginOtpExpiresAt = null
    await employer.save()

    const token = jwt.sign(
      { id: employer._id, name: employer.name, companyName: employer.companyName, email: employer.email, role: 'employer' },
      SECRET,
      { expiresIn: EXPIRES }
    )

    res.json({
      message: 'Login successful',
      token,
      employer: { id: employer._id, name: employer.name, companyName: employer.companyName, email: employer.email },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Protected — get own profile
router.get('/me', authEmployer, async (req, res) => {
  try {
    const employer = await Employer.findById(req.user.id).select('-password -loginOtpHash -loginOtpExpiresAt')
    if (!employer) return res.status(404).json({ message: 'Employer not found' })
    res.json(employer)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get employer by email (for profile page)
router.get('/by-email/:email', async (req, res) => {
  try {
    const employer = await Employer.findOne({ email: req.params.email }).select('-password -loginOtpHash -loginOtpExpiresAt')
    if (!employer) return res.status(404).json({ message: 'Employer not found' })
    res.json(employer)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update employer profile
router.post('/update-profile', upload.single('profilePic'), async (req, res) => {
  try {
    const { email, name, companyName, website, description, location } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })
    const update = { name, companyName, website, description, location }
    if (req.file) update.profilePic = req.file.filename
    const employer = await Employer.findOneAndUpdate({ email }, { $set: update }, { new: true }).select('-password -loginOtpHash -loginOtpExpiresAt')
    if (!employer) return res.status(404).json({ message: 'Employer not found' })
    res.json({ message: 'Profile updated', employer })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router
