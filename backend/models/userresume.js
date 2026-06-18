const mongoose = require('mongoose');

const userresumeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        bio: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        qualifications: { type: String, default: '' },
        resumeFile: { type: String, default: '' },
        profilePic: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Userresume', userresumeSchema);
