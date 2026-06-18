const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Admin = require('../models/admin');
const Jobapplication = require('../models/jobapplication');
const Userresume = require('../models/userresume');
const Useraccount = require('../models/useraccount');
const { authAdmin } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', 'uploads');

// Helper: safely remove an uploaded file (resume / profile pic)
function removeUpload(filename) {
  if (!filename) return;
  try {
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error('Failed to remove upload:', filename, err.message);
  }
}


const SECRET = process.env.JWT_SECRET || 'jobportal_secret';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// Seed default admin
async function seedAdmin() {
  const exists = await Admin.findOne({ username: 'admin' });
  if (!exists) {
    const hashed = await bcrypt.hash('admin123', 10);
    await Admin.create({ username: 'admin', password: hashed });
    console.log('Default admin created: username=admin password=admin123');
  }
}
seedAdmin();

// POST /api/admin/login — issues JWT
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required' });

    const admin = await Admin.findOne({ username: username.trim().toLowerCase() });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: 'admin' },
      SECRET,
      { expiresIn: EXPIRES }
    );

    res.json({
      message: 'Admin login successful',
      token,
      admin: { id: admin._id, username: admin.username },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/applications — protected
router.get('/applications', authAdmin, async (req, res) => {
  try {
    const apps = await Jobapplication.find().sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/profiles — protected
router.get('/profiles', authAdmin, async (req, res) => {
  try {
    const profiles = await Userresume.find().sort({ createdAt: -1 });
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users — list all registered user accounts (protected)
router.get('/users', authAdmin, async (req, res) => {
  try {
    const users = await Useraccount.find()
      .select('-password -loginOtpHash -loginOtpExpiresAt')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id — delete a user account AND all related data (protected)
router.delete('/users/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid user ID' });

    const user = await Useraccount.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const email = user.email;

    // Remove the user's profile/resume and associated uploaded files
    const profile = await Userresume.findOne({ email });
    if (profile) {
      removeUpload(profile.resumeFile);
      removeUpload(profile.profilePic);
      await Userresume.deleteOne({ _id: profile._id });
    }

    // Remove all job applications submitted by this user
    await Jobapplication.deleteMany({ email });

    // Finally remove the account itself
    await Useraccount.deleteOne({ _id: id });

    res.json({ message: 'User and all associated data deleted', email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/profiles/:id — delete a single user profile/resume (protected)
router.delete('/profiles/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid profile ID' });

    const profile = await Userresume.findById(id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    removeUpload(profile.resumeFile);
    removeUpload(profile.profilePic);
    await Userresume.deleteOne({ _id: id });

    res.json({ message: 'Profile deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/applications/:id — delete a single job application (protected)
router.delete('/applications/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: 'Invalid application ID' });

    const app = await Jobapplication.findByIdAndDelete(id);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    res.json({ message: 'Application deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

