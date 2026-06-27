const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/useraccount');
const Employer = require('../models/employer');
const mailer = require('../utils/mailer');
const otpGenerator = require('otp-generator');

// @route   POST api/password-reset/request
// @desc    Request password reset
// @access  Public
router.post('/request', async (req, res) => {
    try {
        const { email, userType } = req.body;
        let user;
        if (userType === 'seeker') {
            user = await User.findOne({ email });
        } else if (userType === 'employer') {
            user = await Employer.findOne({ email });
        }

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false, digits: true });
        const hashedOtp = await bcrypt.hash(otp, 10);

        user.resetPasswordOtp = hashedOtp;
        user.resetPasswordExpires = Date.now() + 600000; // 10 minutes

        await user.save();

        try {
            await mailer.sendPasswordResetEmail({
                to: user.email,
                otp,
            });
            res.status(200).json({ msg: 'OTP sent to email' });
        } catch (err) {
            console.error('Error sending email:', err);
            res.status(500).send('Server Error');
        }
    } catch (err) {
        console.error('Error in /request route:', err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/password-reset/verify-and-reset
// @desc    Verify OTP and reset password
// @access  Public
router.post('/verify-and-reset', async (req, res) => {
    try {
        const { email, userType, otp, password } = req.body;

        let user;
        if (userType === 'seeker') {
            user = await User.findOne({
                email,
                resetPasswordExpires: { $gt: Date.now() }
            });
        } else if (userType === 'employer') {
            user = await Employer.findOne({
                email,
                resetPasswordExpires: { $gt: Date.now() }
            });
        }

        if (!user) {
            return res.status(400).json({ msg: 'OTP has expired.' });
        }

        const isMatch = await bcrypt.compare(otp, user.resetPasswordOtp);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid OTP.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ msg: 'Password updated' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
