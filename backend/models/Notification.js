const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['user', 'employer', 'admin'],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['application_status', 'message'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: '',
      trim: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Jobapplication',
      default: null,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosting',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

notificationSchema.index({ recipientId: 1, recipientRole: 1, read: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
