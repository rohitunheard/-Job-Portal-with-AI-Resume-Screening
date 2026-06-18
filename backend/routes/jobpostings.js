const express = require('express')
const router = express.Router()
const JobPosting = require('../models/jobposting')

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
router.get('/my/:employerId', async (req, res) => {
  try {
    const jobs = await JobPosting.find({ employerId: req.params.employerId }).sort({ createdAt: -1 })
    res.json(jobs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Employer — create posting
router.post('/', async (req, res) => {
  try {
    const { employerId, companyName, title, description, location, type, salary, skills } = req.body
    if (!companyName || !title || !description || !location || !type || !salary)
      return res.status(400).json({ message: 'All fields are required' })
    const job = new JobPosting({ employerId, companyName, title, description, location, type, salary, skills })
    await job.save()
    res.status(201).json(job)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Employer — update posting
router.put('/:id', async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!job) return res.status(404).json({ message: 'Job not found' })
    res.json(job)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Employer — delete posting
router.delete('/:id', async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndDelete(req.params.id)
    if (!job) return res.status(404).json({ message: 'Job not found' })
    res.json({ message: 'Job deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
