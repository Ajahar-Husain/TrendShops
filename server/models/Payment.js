const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    method: {
      type: String,
      enum: ['UPI'],
    },
    status: {
      type: String,
      enum: ['created', 'pending_approval', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'created',
    },
    mode: {
      type: String,
      enum: ['demo'],
      default: 'demo',
    },
    refundAmount: { type: Number, default: 0 },
    settledAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

paymentSchema.index({ order: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
