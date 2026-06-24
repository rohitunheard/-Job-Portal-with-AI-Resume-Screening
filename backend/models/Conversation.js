const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Jobapplication',
      default: null,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosting',
      default: null,
    },
    seekerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Useraccount',
      default: null,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      default: null,
    },
    jobTitle: {
      type: String,
      default: '',
      trim: true,
    },
    company: {
      type: String,
      default: '',
      trim: true,
    },
    members: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    lastMessage: {
      type: String,
      default: '',
      trim: true,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ConversationSchema.index(
  { applicationId: 1 },
  { unique: true, sparse: true, name: 'one_chat_per_application' }
);
ConversationSchema.index({ members: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
