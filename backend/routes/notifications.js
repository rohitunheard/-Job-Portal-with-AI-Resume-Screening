const router = require('express').Router()
const Notification = require('../models/Notification')
const { authAny } = require('../middleware/auth')

const recipientFilter = (req) => ({
  recipientId: req.user.id,
  recipientRole: req.user.role,
})

router.get('/', authAny, async (req, res) => {
  try {
    if (!['user', 'employer'].includes(req.user.role)) return res.json([])

    const notifications = await Notification.find(recipientFilter(req))
      .sort({ createdAt: -1 })
      .limit(30)
      .lean()

    res.json(notifications)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/unread-count', authAny, async (req, res) => {
  try {
    if (!['user', 'employer'].includes(req.user.role)) return res.json({ count: 0 })

    const count = await Notification.countDocuments({
      ...recipientFilter(req),
      read: false,
    })

    res.json({ count })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/read-all', authAny, async (req, res) => {
  try {
    if (!['user', 'employer'].includes(req.user.role)) return res.json({ updated: 0 })

    const result = await Notification.updateMany(
      {
        ...recipientFilter(req),
        read: false,
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      }
    )

    res.json({ updated: result.modifiedCount || 0 })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/:id/read', authAny, async (req, res) => {
  try {
    if (!['user', 'employer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Notifications are only available for seekers and employers' })
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        ...recipientFilter(req),
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      },
      { new: true }
    )

    if (!notification) return res.status(404).json({ message: 'Notification not found' })
    res.json(notification)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
