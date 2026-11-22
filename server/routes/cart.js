const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/auth');

const populateCart = (query) =>
  query
    .populate('items.product', 'name slug images price stock isActive')
    .populate('coupon', 'code discountType value minOrderValue maxDiscount');

// GET /api/cart
router.get('/', protect, async (req, res, next) => {
  try {
    let cart = await populateCart(Cart.findOne({ user: req.user._id }));
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    res.json({ success: true, cart });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart/add
router.post('/add', protect, async (req, res, next) => {
  try {
    const { productId, qty = 1, variant } = req.body;

    if (!productId) return res.status(400).json({ success: false, message: 'Product ID required.' });

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    if (product.stock < qty) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units available.` });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      const newQty = existingItem.qty + qty;
      if (product.stock < newQty) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} units available.` });
      }
      existingItem.qty = newQty;
    } else {
      cart.items.push({ product: productId, qty, variant });
    }

    await cart.save();
    cart = await populateCart(Cart.findById(cart._id));

    res.json({ success: true, message: 'Item added to cart.', cart });
  } catch (error) {
    next(error);
  }
});

// PUT /api/cart/update
router.put('/update', protect, async (req, res, next) => {
  try {
    const { productId, qty } = req.body;
    if (!productId || qty === undefined) {
      return res.status(400).json({ success: false, message: 'Product ID and qty required.' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not in cart.' });

    if (qty <= 0) {
      cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    } else {
      const product = await Product.findById(productId);
      if (product.stock < qty) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} units available.` });
      }
      item.qty = qty;
    }

    await cart.save();
    const updatedCart = await populateCart(Cart.findById(cart._id));
    res.json({ success: true, cart: updatedCart });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/remove/:productId
router.delete('/remove/:productId', protect, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );
    await cart.save();

    const updatedCart = await populateCart(Cart.findById(cart._id));
    res.json({ success: true, message: 'Item removed.', cart: updatedCart });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/clear
router.delete('/clear', protect, async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], coupon: null },
      { upsert: true }
    );
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart/apply-coupon
router.post('/apply-coupon', protect, async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required.' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon || !coupon.isValid()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon.' });
    }

    // Check per-user usage
    const userUsage = coupon.usedBy.find((u) => u.user.toString() === req.user._id.toString());
    if (userUsage && userUsage.count >= coupon.perUserLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached for your account.' });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'price');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    const subtotal = cart.items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
    if (subtotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} required.`,
      });
    }

    cart.coupon = coupon._id;
    await cart.save();

    const discount = coupon.calculateDiscount(subtotal);
    res.json({ success: true, message: 'Coupon applied.', discount, coupon: { code: coupon.code, discountType: coupon.discountType, value: coupon.value } });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/remove-coupon
router.delete('/remove-coupon', protect, async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { coupon: null });
    res.json({ success: true, message: 'Coupon removed.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
