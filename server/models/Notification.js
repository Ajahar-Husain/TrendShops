const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['order', 'payment', 'return', 'restock', 'promotion', 'system'],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    channel: {
      type: String,
      enum: ['whatsapp', 'email', 'push', 'sms'],
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending', 'queued'],
      default: 'pending',
    },
    title: { type: String },
    body: { type: String },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sentAt: { type: Date },
    retries: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    lastError: { type: String },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ type: 1, channel: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
