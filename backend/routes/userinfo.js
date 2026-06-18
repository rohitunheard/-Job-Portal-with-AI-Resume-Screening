const express = require('express');
const router = express.Router();
const Userinfo = require('../models/userinfo');
const mongoose = require('mongoose');

//add user info
router.post('/', async (req, res) => {
    try {
        const userinfo = new Userinfo(req.body);
        await userinfo.save();
        res.status(201).json(userinfo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

//view user info
router.get('/', async (req, res) => {
    try {
        const userinfo = await Userinfo.find();
        res.json(userinfo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//single user info
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID' });
        }
        const userinfo = await Userinfo.findById(id);
        if (!userinfo) {
            return res.status(404).json({ message: 'User info not found' });
        }
        res.json(userinfo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//update user info
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID' });
        }
        const userinfo = await Userinfo.findByIdAndUpdate(id, req.body, { new: true });
        if (!userinfo) {
            return res.status(404).json({ message: 'User info not found' });
        }
        res.json(userinfo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

//delete user info
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID' });
        }
        const userinfo = await Userinfo.findByIdAndDelete(id);
        if (!userinfo) {
            return res.status(404).json({ message: 'User info not found' });
        }
        res.json({ message: 'User info deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;