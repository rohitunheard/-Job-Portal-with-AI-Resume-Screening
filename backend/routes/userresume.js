const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Userresume = require('../models/userresume');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Upsert profile by email
router.post('/', upload.fields([{ name: 'resume' }, { name: 'profilePic' }]), async (req, res) => {
    try {
        const { email, name, bio, linkedin, qualifications } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const update = { name, bio, linkedin, qualifications };
        if (req.files?.resume?.[0]) update.resumeFile = req.files.resume[0].filename;
        if (req.files?.profilePic?.[0]) update.profilePic = req.files.profilePic[0].filename;

        const profile = await Userresume.findOneAndUpdate(
            { email },
            { $set: update },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.json({ message: 'Profile saved', profile });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get profile by email
router.get('/by-email/:email', async (req, res) => {
    try {
        const profile = await Userresume.findOne({ email: req.params.email });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all
router.get('/', async (req, res) => {
    try {
        res.json(await Userresume.find());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get by id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });
        const profile = await Userresume.findById(id);
        if (!profile) return res.status(404).json({ message: 'Not found' });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update by id
router.put('/:id', upload.fields([{ name: 'resume' }, { name: 'profilePic' }]), async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });
        const update = { ...req.body };
        if (req.files?.resume?.[0]) update.resumeFile = req.files.resume[0].filename;
        if (req.files?.profilePic?.[0]) update.profilePic = req.files.profilePic[0].filename;
        const profile = await Userresume.findByIdAndUpdate(id, update, { new: true });
        if (!profile) return res.status(404).json({ message: 'Not found' });
        res.json(profile);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete by id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });
        const profile = await Userresume.findByIdAndDelete(id);
        if (!profile) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
