const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Coupon code cannot exceed 20 characters'],
    },
    discountType: {
      type: String,
      enum: ['percent', 'flat'],
      required: true,
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Value cannot be negative'],
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: null, // null = no cap
    },
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },
    usedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        count: { type: Number, default: 1 },
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      maxlength: 200,
    },
  },
  { timestamps: true }
);

couponSchema.methods.isValid = function () {
  return (
    this.isActive &&
    new Date() <= this.expiresAt &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
};

couponSchema.methods.calculateDiscount = function (subtotal) {
  if (!this.isValid()) return 0;
  if (subtotal < this.minOrderValue) return 0;

  let discount =
    this.discountType === 'percent'
      ? (subtotal * this.value) / 100
      : this.value;

  if (this.maxDiscount !== null) {
    discount = Math.min(discount, this.maxDiscount);
  }

  return Math.round(discount);
};

module.exports = mongoose.model('Coupon', couponSchema);
