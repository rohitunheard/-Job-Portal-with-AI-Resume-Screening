const mongoose = require('mongoose')

const jobPostingSchema = new mongoose.Schema(
  {
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', required: true },
    companyName: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Hybrid'] },
    salary: { type: String, required: true, trim: true },
    skills: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('JobPosting', jobPostingSchema)
