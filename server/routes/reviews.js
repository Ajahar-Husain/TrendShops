const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// GET /api/reviews/product/:productId
router.get('/product/:productId', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find({ product: req.params.productId, isActive: true })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments({ product: req.params.productId, isActive: true }),
    ]);

    // Rating breakdown
    const breakdown = await Review.aggregate([
      { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(req.params.productId), isActive: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      reviews,
      breakdown,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews
router.post('/', protect, [
  body('productId').isMongoId().withMessage('Valid product ID required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('body').trim().notEmpty().withMessage('Review body is required').isLength({ max: 2000 }),
  body('title').optional().trim().isLength({ max: 100 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { productId, rating, title, body } = req.body;

    // Check for verified purchase
    const hasOrdered = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
      orderStatus: 'delivered',
    });

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating,
      title,
      body,
      isVerifiedPurchase: !!hasOrdered,
    });

    await review.populate('user', 'name avatar');

    res.status(201).json({ success: true, message: 'Review submitted.', review });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/reviews/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews/:id/helpful
router.post('/:id/helpful', protect, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    const idx = review.helpful.indexOf(req.user._id);
    if (idx > -1) {
      review.helpful.splice(idx, 1);
    } else {
      review.helpful.push(req.user._id);
    }
    await review.save();

    res.json({ success: true, helpfulCount: review.helpful.length });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
