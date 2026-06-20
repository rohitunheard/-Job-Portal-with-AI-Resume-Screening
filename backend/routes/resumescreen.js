const express = require('express');
const router = express.Router();
const multer = require('multer');
const { screenResumeBuffer } = require('../utils/resumeScreening');

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/resume-screen
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const { jobTitle, jobDescription } = req.body;

    if (!req.file) return res.status(400).json({ message: 'Resume file is required' });
    if (!jobTitle) return res.status(400).json({ message: 'Job title is required' });

    const analysis = await screenResumeBuffer({
      buffer: req.file.buffer,
      jobTitle,
      jobDescription,
    });

    res.json({ success: true, analysis });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Resume screening failed' });
  }
});

module.exports = router;
