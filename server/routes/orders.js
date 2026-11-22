const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { sendShipmentEmail } = require('../utils/sendEmail');

const generateOTP = () => String(Math.floor(1000 + Math.random() * 9000));

// POST /api/orders — place order
router.post('/', protect, async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod, couponCode, notes } = req.body;

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Shipping address and payment method required.' });
    }
    if (paymentMethod !== 'UPI') {
      return res.status(400).json({ success: false, message: 'Only UPI/QR payments are currently available.' });
    }

    // Get cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name slug images price stock isActive')
      .populate('coupon');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    // Validate stock and build items
    const orderItems = [];
    for (const cartItem of cart.items) {
      const product = cartItem.product;
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product "${product?.name || 'Unknown'}" is no longer available.` });
      }
      if (product.stock < cartItem.qty) {
        return res.status(400).json({ success: false, message: `Insufficient stock for "${product.name}". Available: ${product.stock}.` });
      }
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0]?.url || '',
        qty: cartItem.qty,
        price: product.price,
      });
    }

    // Calculate totals
    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shipping = subtotal >= 499 ? 0 : 49; // Free shipping above ₹499
    const taxRate = 0.18; // 18% GST
    const tax = Math.round(subtotal * taxRate);

    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isValid()) {
        discount = coupon.calculateDiscount(subtotal);
        appliedCoupon = coupon;
      }
    } else if (cart.coupon) {
      discount = cart.coupon.calculateDiscount(subtotal);
      appliedCoupon = cart.coupon;
    }

    const total = Math.max(0, subtotal + shipping + tax - discount);

    // Generate invoice number
    const year = new Date().getFullYear();
    const count = await Order.countDocuments();
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      shipping,
      tax,
      discount,
      total,
      couponCode: appliedCoupon?.code,
      invoice: { number: invoiceNumber },
      notes,
      timeline: [{ status: 'pending', message: 'Order placed successfully.' }],
    });

    const reservedItems = [];
    try {
      for (const item of orderItems) {
        const reservation = await Product.updateOne(
          { _id: item.product, isActive: true, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty, soldCount: item.qty } }
        );
        if (reservation.modifiedCount !== 1) {
          const error = new Error(`Insufficient stock for "${item.name}". Please update your cart.`);
          error.statusCode = 409;
          throw error;
        }
        reservedItems.push(item);
      }
    } catch (error) {
      const rollbackResults = await Promise.allSettled(
        reservedItems.map((item) =>
          Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.qty, soldCount: -item.qty } }
          )
        )
      );
      await Order.findByIdAndDelete(order._id);

      if (rollbackResults.some((result) => result.status === 'rejected')) {
        console.error(`Inventory rollback failed for order ${order.orderNumber}.`);
        return next(new Error('Could not reserve inventory. Please contact support before retrying.'));
      }
      if (error.statusCode === 409) {
        return res.status(409).json({ success: false, message: error.message });
      }
      throw error;
    }

    try {
      await Payment.create({
        order: order._id,
        amount: total,
        method: 'UPI',
        mode: 'demo',
        status: 'created',
      });
    } catch (error) {
      const rollbackResults = await Promise.allSettled(
        reservedItems.map((item) =>
          Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.qty, soldCount: -item.qty } }
          )
        )
      );
      await Order.findByIdAndDelete(order._id);
      if (rollbackResults.some((result) => result.status === 'rejected')) {
        console.error(`Inventory rollback failed for order ${order.orderNumber}.`);
        return next(new Error('Could not create the payment record. Please contact support before retrying.'));
      }
      throw error;
    }

    // Update coupon usage
    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      const userUsage = appliedCoupon.usedBy.find((u) => u.user.toString() === req.user._id.toString());
      if (userUsage) {
        userUsage.count += 1;
      } else {
        appliedCoupon.usedBy.push({ user: req.user._id, count: 1 });
      }
      await appliedCoupon.save();
    }

    // Clear cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], coupon: null });

    // Queue notification
    await Notification.create({
      type: 'order',
      user: req.user._id,
      channel: 'email',
      title: `Order ${order.orderNumber} placed`,
      body: `Your order for ₹${total} has been placed.`,
      payload: { orderId: order._id, orderNumber: order.orderNumber },
    });

    await order.populate('items.product', 'name slug images');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/my-orders
router.get('/my-orders', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const filter = { user: req.user._id };
    if (status) filter.orderStatus = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.product', 'name slug images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      orders,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name slug images brand')
      .populate('user', 'name email phone');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Customers can only see their own orders
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', protect, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: `Cannot cancel order in "${order.orderStatus}" status.` });
    }

    order.orderStatus = 'cancelled';
    order.cancelReason = reason || 'Customer requested cancellation';
    order.timeline.push({ status: 'cancelled', message: order.cancelReason, updatedBy: req.user.role });

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.qty, soldCount: -item.qty },
      });
    }

    const demoPayment = await Payment.findOne({ order: order._id, mode: 'demo' });
    if (demoPayment && demoPayment.status !== 'paid') {
      demoPayment.status = 'failed';
      await demoPayment.save();
    }

    // Trigger refund if paid
    if (order.paymentStatus === 'paid') {
      order.refundStatus = 'manual_review';
      order.timeline.push({
        status: 'refund_manual_review',
        message: 'UPI refunds must be verified and handled manually outside this website.',
        updatedBy: 'system',
      });
    }

    await order.save();

    res.json({ success: true, message: 'Order cancelled.', order });
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/:id/verify-otp
router.put('/:id/verify-otp', protect, async (req, res, next) => {
  try {
    const { otp } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.orderStatus !== 'out_for_delivery') {
      return res.status(400).json({ success: false, message: 'OTP verification only valid for out-for-delivery orders.' });
    }
    if (!order.otp?.code || order.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    order.otp.verified = true;
    order.orderStatus = 'delivered';
    order.timeline.push({ status: 'delivered', message: 'Order delivered. OTP verified.' });

    await order.save();
    res.json({ success: true, message: 'OTP verified. Order marked as delivered.', order });
  } catch (error) {
    next(error);
  }
});

// ─── ADMIN ROUTES ────────────────────────────────────────────

// GET /api/orders/admin/all
router.get('/admin/all', protect, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, paymentMethod, search } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.orderStatus = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (search) filter.orderNumber = new RegExp(search, 'i');

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      orders,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/admin/:id/status
router.put('/admin/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, trackingId, courier, awbNumber, message } = req.body;

    const validStatuses = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    const fulfillmentStatuses = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
    if (fulfillmentStatuses.includes(status) && order.paymentStatus !== 'paid') {
      return res.status(409).json({ success: false, message: 'Approve the UPI payment before confirming the order.' });
    }

    order.orderStatus = status;
    order.timeline.push({ status, message: message || `Order status updated to ${status}.`, updatedBy: 'admin' });

    if (trackingId) order.trackingId = trackingId;
    if (courier) order.courier = courier;
    if (awbNumber) order.awbNumber = awbNumber;

    // Generate and assign delivery OTP when shipped
    if (status === 'shipped') {
      order.otp = { code: generateOTP(), verified: false, generatedAt: new Date() };
      sendShipmentEmail(order.user, order).catch(console.error);

      await Notification.create({
        type: 'order',
        user: order.user._id,
        channel: 'email',
        title: 'Order Shipped',
        body: `Your order ${order.orderNumber} has been shipped via ${courier}.`,
        payload: { orderId: order._id, awbNumber, courier },
      });
    }

    await order.save();
    res.json({ success: true, message: `Order status updated to ${status}.`, order });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
