const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { buildUpiPaymentUri } = require('../utils/upi');
const { sendOrderConfirmationEmail } = require('../utils/sendEmail');

router.get('/demo/:orderId', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const payment = await Payment.findOne({ order: order._id, mode: 'demo' });
    if (!payment) return res.status(404).json({ success: false, message: 'UPI payment not found.' });

    const vpa = process.env.MERCHANT_UPI_VPA || process.env.DEMO_UPI_VPA || 'trendshops-demo@upi';
    const qrPayload = buildUpiPaymentUri({
      vpa,
      payeeName: process.env.MERCHANT_UPI_NAME || process.env.DEMO_UPI_NAME || 'TrendShops',
      amount: order.total,
      orderNumber: order.orderNumber,
    });

    res.json({
      success: true,
      payment: { id: payment._id, status: payment.status },
      order: { id: order._id, orderNumber: order.orderNumber, amount: order.total },
      upiVpa: vpa,
      qrPayload,
      manualVerificationRequired: true,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/demo/:orderId/submit', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const payment = await Payment.findOne({ order: order._id, mode: 'demo' });
    if (!payment) return res.status(404).json({ success: false, message: 'UPI payment not found.' });
    if (payment.status === 'pending_approval') {
      return res.json({ success: true, payment: { id: payment._id, status: payment.status } });
    }
    if (payment.status !== 'created' || order.orderStatus === 'cancelled') {
      return res.status(409).json({ success: false, message: 'This payment can no longer be submitted.' });
    }

    payment.status = 'pending_approval';
    await payment.save();
    order.timeline.push({
      status: 'payment_submitted',
      message: 'Customer submitted UPI payment for manual admin verification.',
      updatedBy: 'customer',
    });
    await order.save();

    res.json({
      success: true,
      message: 'Payment submitted for manual approval.',
      payment: { id: payment._id, status: payment.status },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/approval-queue', protect, adminOnly, async (req, res, next) => {
  try {
    const payments = await Payment.find({ mode: 'demo', status: 'pending_approval' })
      .populate({
        path: 'order',
        select: 'orderNumber total user createdAt shippingAddress',
        populate: { path: 'user', select: 'name email' },
      })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    res.json({ success: true, payments });
  } catch (error) {
    next(error);
  }
});

router.put('/admin/demo/:paymentId/approve', protect, adminOnly, async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.paymentId,
      mode: 'demo',
      status: 'pending_approval',
    }).populate({ path: 'order', populate: { path: 'user', select: 'name email' } });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Pending UPI payment not found.' });
    }
    if (!payment.order || payment.order.orderStatus === 'cancelled') {
      return res.status(409).json({ success: false, message: 'The related order cannot be approved.' });
    }

    payment.status = 'paid';
    payment.settledAt = new Date();
    payment.order.paymentStatus = 'paid';
    payment.order.orderStatus = 'confirmed';
    payment.order.timeline.push({
      status: 'confirmed',
      message: 'UPI payment manually verified and approved by an administrator.',
      updatedBy: 'admin',
    });
    await Promise.all([payment.save(), payment.order.save()]);

    if (payment.order.user) {
      sendOrderConfirmationEmail(payment.order.user, payment.order).catch((error) => {
        console.error('Order confirmation email failed:', error.message);
      });
    }

    res.json({
      success: true,
      message: 'UPI payment approved and order confirmed.',
      payment: { id: payment._id, status: payment.status },
      order: { id: payment.order._id, orderStatus: payment.order.orderStatus },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
