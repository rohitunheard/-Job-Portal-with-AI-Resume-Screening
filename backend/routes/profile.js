const express = require('express');
const router = express.Router();
const Useraccount = require('../models/useraccount');
const Employer = require('../models/employer');
const Userresume = require('../models/userresume');

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if it's a regular user
        let user = await Useraccount.findById(id).select('name email');
        if (user) {
            // Try to find additional user info
            const userInfo = await Userresume.findOne({ email: user.email }).select('profilePic');
            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                profilePic: userInfo?.profilePic,
                type: 'user'
            });
        }

        // Check if it's an employer
        let employer = await Employer.findById(id).select('companyName email profilePic');
        if (employer) {
            return res.json({
                _id: employer._id,
                name: employer.companyName,
                email: employer.email,
                profilePic: employer.profilePic,
                type: 'employer'
            });
        }

        res.status(404).json({ message: 'Profile not found' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
