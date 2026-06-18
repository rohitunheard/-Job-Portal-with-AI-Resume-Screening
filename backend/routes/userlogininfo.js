const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Useraccount = require('../models/useraccount');
const bcrypt = require('bcryptjs');
const { createOtpCode, hashOtpCode } = require('../utils/otp');
const { sendLoginOtpEmail, createTransporter } = require('../utils/mailer');
const { authUser } = require('../middleware/auth');

const SECRET = process.env.JWT_SECRET || 'jobportal_secret';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// Signup
router.post('/signup', async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required' });

    const existing = await Useraccount.findOne({ email });
    if (existing)
      return res.status(409).json({ message: 'Account already exists with this email' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const account = new Useraccount({ name, email, password: hashedPassword });
    await account.save();

    res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login — send OTP
router.post('/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const account = await Useraccount.findOne({ email });
    if (!account) return res.status(401).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, account.password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    const otp = createOtpCode();
    account.loginOtpHash = hashOtpCode(otp);
    account.loginOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await account.save();

    await sendLoginOtpEmail({ to: account.email, name: account.name, otp });
    res.json({ message: 'Verification code sent to your email', email: account.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify OTP — issue JWT
router.post('/verify-otp', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp = (req.body.otp || '').trim();

    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP are required' });

    const account = await Useraccount.findOne({ email });
    if (!account || !account.loginOtpHash || !account.loginOtpExpiresAt)
      return res.status(400).json({ message: 'OTP request not found or expired' });

    if (account.loginOtpExpiresAt.getTime() < Date.now()) {
      account.loginOtpHash = '';
      account.loginOtpExpiresAt = null;
      await account.save();
      return res.status(400).json({ message: 'OTP has expired. Please log in again.' });
    }

    if (account.loginOtpHash !== hashOtpCode(otp))
      return res.status(401).json({ message: 'Invalid OTP' });

    account.loginOtpHash = '';
    account.loginOtpExpiresAt = null;
    await account.save();

    const token = jwt.sign(
      { id: account._id, name: account.name, email: account.email, role: 'user' },
      SECRET,
      { expiresIn: EXPIRES }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: account._id, name: account.name, email: account.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Protected — get own profile (example protected route)
router.get('/me', authUser, async (req, res) => {
  try {
    const account = await Useraccount.findById(req.user.id).select('-password -loginOtpHash -loginOtpExpiresAt');
    if (!account) return res.status(404).json({ message: 'User not found' });
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// View all accounts (admin use)
router.get('/', async (req, res) => {
  try {
    const list = await Useraccount.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SMTP check
router.get('/smtp-check', async (req, res) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    res.json({ ok: true, message: 'SMTP configured and reachable' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
