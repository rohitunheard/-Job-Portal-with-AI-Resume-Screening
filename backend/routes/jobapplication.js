const express = require('express')
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const router = express.Router()
const Jobapplication = require('../models/jobapplication')
const JobPosting = require('../models/jobposting')
const Userresume = require('../models/userresume')
const { authUser, authEmployer } = require('../middleware/auth')
const { screenResumeBuffer } = require('../utils/resumeScreening')

const uploadDir = path.join(__dirname, '..', 'uploads')
const keyPart = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '')

const employerApplications = async (employerId) => Jobapplication.find({ employerId })
  .populate('jobId', 'title description skills location type salary companyName')
  .sort({ createdAt: -1 })

// Candidate — apply once to a job. A saved resume is mandatory.
router.post('/', authUser, async (req, res) => {
  try {
    const { jobId, staticJobId, jobTitle, company, location } = req.body
    const profile = await Userresume.findOne({ email: req.user.email })

    if (!profile?.resumeFile) {
      return res.status(400).json({
        code: 'RESUME_REQUIRED',
        message: 'Upload a resume in your profile before applying for a job.',
      })
    }
    if (path.extname(profile.resumeFile).toLowerCase() !== '.pdf') {
      return res.status(400).json({
        code: 'PDF_RESUME_REQUIRED',
        message: 'Upload a PDF resume in your profile before applying so employers can use AI screening.',
      })
    }

    const resumePath = path.join(uploadDir, path.basename(profile.resumeFile))
    if (!fs.existsSync(resumePath)) {
      return res.status(400).json({
        code: 'RESUME_REQUIRED',
        message: 'Your saved resume file could not be found. Please upload it again before applying.',
      })
    }

    let applicationData
    if (jobId) {
      if (!mongoose.Types.ObjectId.isValid(jobId))
        return res.status(400).json({ message: 'Invalid job ID' })

      const job = await JobPosting.findOne({ _id: jobId, isActive: true })
      if (!job) return res.status(404).json({ message: 'This job is no longer available.' })

      applicationData = {
        applicationKey: `job:${job._id}`,
        jobId: job._id,
        employerId: job.employerId,
        jobTitle: job.title,
        company: job.companyName,
        location: job.location,
      }
    } else {
      if (!staticJobId || !jobTitle || !company || !location)
        return res.status(400).json({ message: 'Job details are required' })

      applicationData = {
        applicationKey: `static:${keyPart(jobTitle)}:${keyPart(company)}:${keyPart(location)}`,
        jobTitle,
        company,
        location,
      }
    }

    const duplicate = await Jobapplication.findOne({
      applicantId: req.user.id,
      applicationKey: applicationData.applicationKey,
    })
    if (duplicate) {
      return res.status(409).json({
        code: 'ALREADY_APPLIED',
        message: 'You have already applied for this job.',
        application: duplicate,
      })
    }

    const application = await Jobapplication.create({
      ...applicationData,
      applicantId: req.user.id,
      name: profile.name || req.user.name,
      email: req.user.email,
      resumeFile: profile.resumeFile,
    })

    res.status(201).json(application)
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        code: 'ALREADY_APPLIED',
        message: 'You have already applied for this job.',
      })
    }
    res.status(400).json({ message: error.message })
  }
})

// Candidate — load their submitted applications so the UI remains correct after refresh.
router.get('/mine', authUser, async (req, res) => {
  try {
    const applications = await Jobapplication.find({ applicantId: req.user.id })
      .select('applicationKey jobId jobTitle company status createdAt')
      .sort({ createdAt: -1 })
    res.json(applications)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Employer — view candidates who applied to this employer's jobs.
router.get('/employer', authEmployer, async (req, res) => {
  try {
    res.json(await employerApplications(req.user.id))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Employer — update hiring status.
router.patch('/:id/status', authEmployer, async (req, res) => {
  try {
    const allowed = ['Applied', 'Shortlisted', 'Rejected']
    if (!allowed.includes(req.body.status))
      return res.status(400).json({ message: 'Invalid application status' })

    const application = await Jobapplication.findOneAndUpdate(
      { _id: req.params.id, employerId: req.user.id },
      { $set: { status: req.body.status } },
      { new: true }
    )
    if (!application) return res.status(404).json({ message: 'Application not found' })
    res.json(application)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Employer — screen the candidate's saved PDF against the exact posted role.
router.post('/:id/screen', authEmployer, async (req, res) => {
  try {
    const application = await Jobapplication.findOne({
      _id: req.params.id,
      employerId: req.user.id,
    }).populate('jobId', 'title description skills')

    if (!application) return res.status(404).json({ message: 'Application not found' })
    if (path.extname(application.resumeFile).toLowerCase() !== '.pdf') {
      return res.status(400).json({
        message: 'AI screening currently supports PDF resumes only. The candidate must upload a PDF resume.',
      })
    }

    const resumePath = path.join(uploadDir, path.basename(application.resumeFile))
    if (!fs.existsSync(resumePath))
      return res.status(404).json({ message: 'Candidate resume file was not found' })

    const analysis = await screenResumeBuffer({
      buffer: fs.readFileSync(resumePath),
      jobTitle: application.jobId?.title || application.jobTitle,
      jobDescription: application.jobId?.description || '',
      skills: application.jobId?.skills || '',
    })

    application.aiScreening = analysis
    application.screenedAt = new Date()
    await application.save()

    res.json({ success: true, analysis, screenedAt: application.screenedAt })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Resume screening failed' })
  }
})

// Backward-compatible employer list route, now protected and scoped.
router.get('/', authEmployer, async (req, res) => {
  try {
    res.json(await employerApplications(req.user.id))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
