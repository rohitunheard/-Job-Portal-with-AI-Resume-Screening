const router = require('express').Router()
const Message = require('../models/Message')
const Conversation = require('../models/Conversation')
const JobApplication = require('../models/jobapplication')
const Notification = require('../models/Notification')
const { authAny } = require('../middleware/auth')
const { createNotification, userRoom } = require('../utils/notifications')

const isSameId = (a, b) => String(a || '') === String(b || '')

const loadAuthorizedConversation = async (conversationId, user) => {
  const conversation = await Conversation.findById(conversationId)
  if (!conversation) {
    const error = new Error('Conversation not found')
    error.statusCode = 404
    throw error
  }

  const isMember = conversation.members.some((member) => isSameId(member, user.id))
  if (!isMember) {
    const error = new Error('You are not part of this conversation')
    error.statusCode = 403
    throw error
  }

  const application = conversation.applicationId
    ? await JobApplication.findById(conversation.applicationId)
    : await JobApplication.findOne({
      status: 'Shortlisted',
      $or: [
        { applicantId: conversation.members[0], employerId: conversation.members[1] },
        { applicantId: conversation.members[1], employerId: conversation.members[0] },
      ],
    })

  if (!application || application.status !== 'Shortlisted') {
    const error = new Error('Chat is available only for shortlisted applications')
    error.statusCode = 403
    throw error
  }

  if (user.role === 'user' && !isSameId(application.applicantId, user.id)) {
    const error = new Error('You are not allowed to access this chat')
    error.statusCode = 403
    throw error
  }

  if (user.role === 'employer' && !isSameId(application.employerId, user.id)) {
    const error = new Error('You are not allowed to access this chat')
    error.statusCode = 403
    throw error
  }

  return { conversation, application }
}

router.post('/', authAny, async (req, res) => {
  try {
    if (!['user', 'employer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only seekers and employers can send messages' })
    }

    const text = String(req.body.text || '').trim()
    if (!text) return res.status(400).json({ message: 'Message cannot be empty' })
    if (text.length > 2000) return res.status(400).json({ message: 'Message is too long' })

    const { conversation, application } = await loadAuthorizedConversation(req.body.conversationId, req.user)

    const savedMessage = await Message.create({
      conversationId: conversation._id,
      sender: req.user.id,
      senderRole: req.user.role,
      text,
    })

    conversation.lastMessage = text.slice(0, 160)
    conversation.lastMessageAt = savedMessage.createdAt
    await conversation.save()

    const receiverRole = req.user.role === 'employer' ? 'user' : 'employer'
    const receiverId = req.user.role === 'employer' ? application.applicantId : application.employerId
    const senderName = req.user.companyName || req.user.name || (req.user.role === 'employer' ? 'Employer' : 'Job seeker')
    const link = `/chat?applicationId=${application._id}`

    await createNotification(req, {
      recipientId: receiverId,
      recipientRole: receiverRole,
      type: 'message',
      title: `New message from ${senderName}`,
      body: `${application.jobTitle}: ${text.slice(0, 120)}`,
      link,
      applicationId: application._id,
      conversationId: conversation._id,
      jobId: application.jobId || null,
      metadata: {
        senderId: req.user.id,
        senderRole: req.user.role,
        jobTitle: application.jobTitle,
        company: application.company,
      },
    })

    const payload = savedMessage.toObject()
    const io = req.app.get('io')
    if (io) {
      io.to(userRoom(receiverRole, receiverId)).emit('getMessage', payload)
      io.to(userRoom(receiverRole, receiverId)).emit('message:new', payload)
    }

    res.status(200).json(payload)
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message })
  }
})

router.get('/:conversationId', authAny, async (req, res) => {
  try {
    if (!['user', 'employer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only seekers and employers can read messages' })
    }

    await loadAuthorizedConversation(req.params.conversationId, req.user)

    const messages = await Message.find({
      conversationId: req.params.conversationId,
    }).sort({ createdAt: 1 })

    await Notification.updateMany(
      {
        recipientId: req.user.id,
        recipientRole: req.user.role,
        conversationId: req.params.conversationId,
        type: 'message',
        read: false,
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      }
    )

    res.status(200).json(messages)
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message })
  }
})

module.exports = router
