const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Useraccount = require('../models/useraccount');
const Employer = require('../models/employer');
const Admin = require('../models/admin');
const { authUser, authEmployer, authAdmin } = require('../middleware/auth');

const getAuthMiddleware = (role) => {
  if (role === 'seeker') return authUser;
  if (role === 'employer') return authEmployer;
  if (role === 'admin') return authAdmin;
  return (req, res, next) => res.status(400).json({ message: 'Invalid role' });
};

const getModel = (role) => {
  if (role === 'seeker') return Useraccount;
  if (role === 'employer') return Employer;
  if (role === 'admin') return Admin;
  return null;
};

router.post('/', async (req, res) => {
  const { role, oldPassword, newPassword } = req.body;

  const authMiddleware = getAuthMiddleware(role);
  authMiddleware(req, res, async () => {
    try {
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old and new passwords are required' });
      }

      const Model = getModel(role);
      if (!Model) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      const user = await Model.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid old password' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
});

module.exports = router;

