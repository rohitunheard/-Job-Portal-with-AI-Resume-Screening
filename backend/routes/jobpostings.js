const express = require('express')
const router = express.Router()
const JobPosting = require('../models/jobposting')
const Employer = require('../models/employer')
const { authEmployer } = require('../middleware/auth')

// Public — get all active job postings
router.get('/', async (req, res) => {
  try {
    const jobs = await JobPosting.find({ isActive: true }).sort({ createdAt: -1 })
    res.json(jobs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Employer — get their own postings
router.get('/my/:employerId', authEmployer, async (req, res) => {
  try {
    if (req.user.id !== req.params.employerId)
      return res.status(403).json({ message: 'You can only view your own job postings' })
    const jobs = await JobPosting.find({ employerId: req.params.employerId }).sort({ createdAt: -1 })
    res.json(jobs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Employer — create posting
router.post('/', authEmployer, async (req, res) => {
  try {
    const { title, description, location, type, salary, skills } = req.body
    if (!title || !description || !location || !type || !salary)
      return res.status(400).json({ message: 'All fields are required' })

    const employer = await Employer.findById(req.user.id)
    if (!employer) return res.status(404).json({ message: 'Employer not found' })

    const job = new JobPosting({
      employerId: employer._id,
      companyName: employer.companyName,
      title,
      description,
      location,
      type,
      salary,
      skills,
    })
    await job.save()
    res.status(201).json(job)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Employer — update posting
router.put('/:id', authEmployer, async (req, res) => {
  try {
    const allowedFields = ['title', 'description', 'location', 'type', 'salary', 'skills', 'isActive']
    const update = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    )
    const job = await JobPosting.findOneAndUpdate(
      { _id: req.params.id, employerId: req.user.id },
      update,
      { new: true, runValidators: true }
    )
    if (!job) return res.status(404).json({ message: 'Job not found' })
    res.json(job)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Employer — delete posting
router.delete('/:id', authEmployer, async (req, res) => {
  try {
    const job = await JobPosting.findOneAndDelete({ _id: req.params.id, employerId: req.user.id })
    if (!job) return res.status(404).json({ message: 'Job not found' })
    res.json({ message: 'Job deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
