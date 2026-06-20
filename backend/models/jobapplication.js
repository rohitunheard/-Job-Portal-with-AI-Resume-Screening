const mongoose = require('mongoose')

const jobapplicationSchema = new mongoose.Schema(
  {
    applicationKey: {
      type: String,
      required: true,
      trim: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosting',
      default: null,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      default: null,
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Useraccount',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    resumeFile: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Rejected'],
      default: 'Applied',
    },
    aiScreening: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    screenedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

jobapplicationSchema.index(
  { applicantId: 1, applicationKey: 1 },
  {
    unique: true,
    name: 'one_application_per_candidate_per_job',
    partialFilterExpression: {
      applicantId: { $type: 'objectId' },
      applicationKey: { $type: 'string' },
    },
  }
)

module.exports = mongoose.model('Jobapplication', jobapplicationSchema)
