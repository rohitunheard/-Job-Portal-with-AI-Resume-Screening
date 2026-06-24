const router = require('express').Router()
const Conversation = require('../models/Conversation')
const JobApplication = require('../models/jobapplication')
const Employer = require('../models/employer')
const Useraccount = require('../models/useraccount')
const Userresume = require('../models/userresume')
const { authAny, authUser } = require('../middleware/auth')

const isSameId = (a, b) => String(a || '') === String(b || '')

const getApplicationForParticipants = async (firstUserId, secondUserId) => {
  return JobApplication.findOne({
    status: 'Shortlisted',
    $or: [
      { applicantId: firstUserId, employerId: secondUserId },
      { applicantId: secondUserId, employerId: firstUserId },
    ],
  }).sort({ updatedAt: -1 })
}

const ensureConversationForApplication = async (application) => {
  if (!application?.employerId) return null

  const insertData = {
    applicationId: application._id,
    jobId: application.jobId || null,
    seekerId: application.applicantId,
    employerId: application.employerId,
    members: [application.applicantId, application.employerId],
  }

  return Conversation.findOneAndUpdate(
    { applicationId: application._id },
    { $setOnInsert: insertData, $set: { jobTitle: application.jobTitle, company: application.company } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: false }
  )
}

const getSeekerProfile = async (id) => {
  const user = await Useraccount.findById(id).select('name email').lean()
  if (!user) return null

  const profile = await Userresume.findOne({ email: user.email }).select('profilePic').lean()
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    profilePic: profile?.profilePic || '',
    type: 'user',
  }
}

const getEmployerProfile = async (id) => {
  const employer = await Employer.findById(id).select('companyName email profilePic').lean()
  if (!employer) return null

  return {
    _id: employer._id,
    name: employer.companyName,
    email: employer.email,
    profilePic: employer.profilePic || '',
    type: 'employer',
  }
}

const hydrateConversation = async (conversation, reqUser) => {
  const conv = conversation.toObject ? conversation.toObject() : { ...conversation }
  let application = conv.applicationId
    ? await JobApplication.findById(conv.applicationId)
      .select('_id jobId employerId applicantId jobTitle company location status createdAt updatedAt')
      .lean()
    : null

  if (!application) {
    application = await getApplicationForParticipants(conv.members?.[0], conv.members?.[1])
    if (!application) return null
  }

  if (application.status !== 'Shortlisted') return null

  conv.application = {
    _id: application._id,
    jobId: application.jobId,
    jobTitle: application.jobTitle,
    company: application.company,
    location: application.location,
    status: application.status,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  }
  conv.applicationId = application._id
  conv.jobTitle = conv.jobTitle || application.jobTitle
  conv.company = conv.company || application.company

  const [seekerProfile, employerProfile] = await Promise.all([
    getSeekerProfile(application.applicantId),
    getEmployerProfile(application.employerId),
  ])

  conv.participants = {
    seeker: seekerProfile,
    employer: employerProfile,
  }

  if (reqUser.role === 'admin') {
    conv.otherMember = {
      _id: application._id,
      name: `${seekerProfile?.name || 'Candidate'} ↔ ${employerProfile?.name || application.company}`,
      email: '',
      profilePic: '',
      type: 'admin-view',
    }
  } else {
    conv.otherMember = reqUser.role === 'employer' ? seekerProfile : employerProfile
  }

  return conv
}

const authorizeApplicationAccess = (application, user) => {
  if (!application) return false
  if (user.role === 'user') return isSameId(application.applicantId, user.id)
  if (user.role === 'employer') return isSameId(application.employerId, user.id)
  if (user.role === 'admin') return true
  return false
}

const listConversationsFor = async (req, res) => {
  try {
    if (!['user', 'employer', 'admin'].includes(req.user.role)) return res.json([])

    if (req.user.role === 'admin') {
      const applications = await JobApplication.find({
        status: 'Shortlisted',
        employerId: { $ne: null },
      }).sort({ updatedAt: -1 })

      const conversations = await Promise.all(
        applications.map((application) => ensureConversationForApplication(application))
      )
      const hydrated = await Promise.all(
        conversations.filter(Boolean).map((conversation) => hydrateConversation(conversation, req.user))
      )

      return res.json(hydrated.filter(Boolean))
    }

    const conversations = await Conversation.find({
      members: req.user.id,
    }).sort({ lastMessageAt: -1, updatedAt: -1 })

    const hydrated = await Promise.all(
      conversations.map((conversation) => hydrateConversation(conversation, req.user))
    )

    res.json(hydrated.filter(Boolean))
  } catch (err) {
    res.status(500).json({ message: 'Failed to get conversations' })
  }
}

router.get('/', authAny, listConversationsFor)

router.get('/seeker', authUser, listConversationsFor)

router.get('/application/:applicationId', authAny, async (req, res) => {
  try {
    if (!['user', 'employer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only seekers and employers can open chats' })
    }

    const application = await JobApplication.findById(req.params.applicationId)
    if (!authorizeApplicationAccess(application, req.user)) {
      return res.status(404).json({ message: 'Application not found' })
    }

    if (application.status !== 'Shortlisted') {
      return res.status(403).json({ message: 'Chat opens only after this application is shortlisted' })
    }

    const conversation = await ensureConversationForApplication(application)
    res.json(await hydrateConversation(conversation, req.user))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', authAny, async (req, res) => {
  try {
    if (!['user', 'employer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only seekers and employers can start chats' })
    }

    let application = null

    if (req.body.applicationId) {
      application = await JobApplication.findById(req.body.applicationId)
      if (!authorizeApplicationAccess(application, req.user)) {
        return res.status(404).json({ message: 'Application not found' })
      }
    } else {
      const { senderId, receiverId } = req.body
      if (!senderId || !receiverId || (!isSameId(senderId, req.user.id) && !isSameId(receiverId, req.user.id))) {
        return res.status(403).json({ message: 'You can only create your own conversations' })
      }
      application = await getApplicationForParticipants(senderId, receiverId)
    }

    if (!application) return res.status(404).json({ message: 'No shortlisted application found for this chat' })
    if (application.status !== 'Shortlisted') {
      return res.status(403).json({ message: 'Chat opens only after this application is shortlisted' })
    }

    const conversation = await ensureConversationForApplication(application)
    res.status(200).json(await hydrateConversation(conversation, req.user))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/find/:firstUserId/:secondUserId', authAny, async (req, res) => {
  try {
    const { firstUserId, secondUserId } = req.params
    if (!isSameId(req.user.id, firstUserId) && !isSameId(req.user.id, secondUserId)) {
      return res.status(403).json({ message: 'You can only find your own conversations' })
    }

    const application = await getApplicationForParticipants(firstUserId, secondUserId)
    if (!application) return res.status(200).json(null)

    const conversation = await ensureConversationForApplication(application)
    res.status(200).json(await hydrateConversation(conversation, req.user))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:userId', authAny, async (req, res) => {
  if (!isSameId(req.user.id, req.params.userId)) {
    return res.status(403).json({ message: 'You can only view your own conversations' })
  }

  return listConversationsFor(req, res)
})

module.exports = router
