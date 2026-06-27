const mongoose = require('mongoose')

const employerSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: '' },
    website: { type: String, default: '' },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    loginOtpHash: { type: String, default: '' },
    loginOtpExpiresAt: { type: Date, default: null },
    resetPasswordOtp: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Employer', employerSchema)
