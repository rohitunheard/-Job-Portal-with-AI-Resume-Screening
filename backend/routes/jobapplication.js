const express = require('express')
const router = express.Router()
const Jobapplication = require('../models/jobapplication')

router.post('/', async (req, res) => {
  try {
    const application = new Jobapplication(req.body)
    await application.save()
    res.status(201).json(application)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const applications = await Jobapplication.find().sort({ createdAt: -1 })
    res.json(applications)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router