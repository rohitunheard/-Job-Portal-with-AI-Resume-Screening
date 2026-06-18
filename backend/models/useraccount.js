const mongoose = require('mongoose')

const useraccountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    loginOtpHash: {
      type: String,
      default: '',
    },
    loginOtpExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Useraccount', useraccountSchema)