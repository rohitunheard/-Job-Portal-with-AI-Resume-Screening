const mongoose = require('mongoose');
const userlogininfoSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            default: '',
        },
        email: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        action: {
            type: String,
            enum: ['login', 'signup'],
            default: 'login',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Userlogininfo', userlogininfoSchema);