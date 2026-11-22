const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Product = require('../models/Product');
const { generateTokens, generateRefreshToken, setTokenCookies } = require('../utils/generateToken');
const { sendEmail } = require('../utils/sendEmail');
const { protect } = require('../middleware/auth');

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 10,
  message: { success: false, message: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many verification emails requested. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional({ values: 'falsy' }).matches(/^[6-9]\d{9}$/).withMessage('Invalid Indian mobile number'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const wishlistProductFields = 'name slug images price originalPrice discountPercent stock rating numReviews brand';

function validateProductId(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false;
  }
  return true;
}

function populateWishlist(userQuery) {
  return userQuery.populate({
    path: 'wishlist',
    match: { isActive: true },
    select: wishlistProductFields,
  });
}

// POST /api/auth/register
router.post('/register', authLimiter, validateRegister, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;
    const phone = req.body.phone?.trim() || undefined;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, password, phone });
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, validateLogin, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated.' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      message: 'Login successful.',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, isVerified: user.isVerified },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', protect, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh-token
router.post('/refresh-token', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, newRefreshToken);

    res.json({ success: true, accessToken });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Refresh token expired. Please login again.' });
    }
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'name slug images price');
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/me/email-verification
router.post('/me/email-verification', protect, emailVerificationLimiter, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'This email address is already verified.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.emailVerificationExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const verificationUrl = `${clientUrl}/verify-email?token=${token}`;
    const result = await sendEmail({
      to: user.email,
      subject: 'Verify your TrendShops email',
      text: `Use this link within one hour to verify your TrendShops email address: ${verificationUrl}`,
      html: `<p>Use this link within one hour to verify your TrendShops email address:</p><p><a href="${verificationUrl}">Verify email address</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });

    if (!result.success) {
      user.emailVerificationTokenHash = undefined;
      user.emailVerificationExpiresAt = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(503).json({
        success: false,
        message: 'Could not send the verification email. Check the SMTP configuration and try again.',
      });
    }

    res.json({ success: true, message: 'Verification email sent. The link expires in one hour.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/email-verification/confirm
router.post('/email-verification/confirm', [
  body('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('A valid verification token is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const tokenHash = crypto.createHash('sha256').update(req.body.token).digest('hex');
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
      isActive: true,
    }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');

    if (!user) {
      return res.status(400).json({ success: false, message: 'This verification link is invalid or has expired.' });
    }

    user.isVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Email verified successfully.', email: user.email });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me/wishlist
router.get('/me/wishlist', protect, async (req, res, next) => {
  try {
    const user = await populateWishlist(User.findById(req.user._id).select('wishlist'));
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, products: user.wishlist });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/me/wishlist/:productId
router.post('/me/wishlist/:productId', protect, [
  param('productId').isMongoId().withMessage('Valid product ID is required'),
], async (req, res, next) => {
  try {
    if (!validateProductId(req, res)) return;

    const product = await Product.findOne({ _id: req.params.productId, isActive: true }).select('_id');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const user = await populateWishlist(
      User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { wishlist: product._id } },
        { new: true, runValidators: true }
      ).select('wishlist')
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, products: user.wishlist });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/auth/me/wishlist/:productId
router.delete('/me/wishlist/:productId', protect, [
  param('productId').isMongoId().withMessage('Valid product ID is required'),
], async (req, res, next) => {
  try {
    if (!validateProductId(req, res)) return;

    const user = await populateWishlist(
      User.findByIdAndUpdate(
        req.user._id,
        { $pull: { wishlist: req.params.productId } },
        { new: true }
      ).select('wishlist')
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, products: user.wishlist });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/me
router.put('/me', protect, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional({ values: 'falsy' }).trim().matches(/^[6-9]\d{9}$/).withMessage('Invalid Indian mobile number'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const setFields = {};
    const updates = {};
    if (req.body.name !== undefined) setFields.name = req.body.name;
    if (req.body.phone !== undefined) {
      if (req.body.phone.trim()) setFields.phone = req.body.phone.trim();
      else updates.$unset = { phone: 1 };
    }
    if (Object.keys(setFields).length) updates.$set = setFields;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, message: 'Profile updated.', user });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/change-password
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/me/addresses
router.put('/me/addresses', protect, async (req, res, next) => {
  try {
    const { action, address, addressId } = req.body;
    const addressActions = ['add', 'update'];
    const idActions = ['update', 'delete', 'setDefault'];
    if (!['add', 'update', 'delete', 'setDefault'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }
    if (idActions.includes(action) && !mongoose.isObjectIdOrHexString(addressId)) {
      return res.status(400).json({ success: false, message: 'A valid address ID is required.' });
    }
    if (addressActions.includes(action)) {
      if (!address || typeof address !== 'object' || Array.isArray(address)) {
        return res.status(400).json({ success: false, message: 'A valid address is required.' });
      }

      const requiredFields = ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'];
      if (requiredFields.some((field) => typeof address[field] !== 'string' || !address[field].trim())) {
        return res.status(400).json({ success: false, message: 'Complete all required address fields.' });
      }
      if (['line2', 'country'].some((field) => address[field] !== undefined && typeof address[field] !== 'string')) {
        return res.status(400).json({ success: false, message: 'Address fields must be text.' });
      }
      if (address.isDefault !== undefined && typeof address.isDefault !== 'boolean') {
        return res.status(400).json({ success: false, message: 'Default address setting must be true or false.' });
      }
      if (!/^[6-9]\d{9}$/.test(address.phone.trim())) {
        return res.status(400).json({ success: false, message: 'Invalid Indian mobile number.' });
      }
      if (!/^\d{6}$/.test(address.pincode.trim())) {
        return res.status(400).json({ success: false, message: 'PIN code must contain six digits.' });
      }
      if (address.label && !['home', 'work', 'other'].includes(address.label)) {
        return res.status(400).json({ success: false, message: 'Address label must be home, work, or other.' });
      }
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (action === 'add') {
      const shouldBeDefault = user.addresses.length === 0 || address.isDefault === true;
      if (shouldBeDefault) {
        user.addresses.forEach((a) => (a.isDefault = false));
      }
      user.addresses.push({
        fullName: address.fullName.trim(),
        phone: address.phone.trim(),
        line1: address.line1.trim(),
        line2: address.line2?.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
        country: address.country?.trim() || 'India',
        label: address.label || 'home',
        isDefault: shouldBeDefault,
      });
    } else if (action === 'update') {
      const idx = user.addresses.findIndex((a) => a._id.toString() === addressId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Address not found.' });
      if (address.isDefault === true) {
        user.addresses.forEach((a) => (a.isDefault = false));
      }
      user.addresses[idx] = {
        ...user.addresses[idx].toObject(),
        fullName: address.fullName.trim(),
        phone: address.phone.trim(),
        line1: address.line1.trim(),
        line2: address.line2?.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
        country: address.country?.trim() || 'India',
        label: address.label || 'home',
        isDefault: address.isDefault === true,
      };
    } else if (action === 'delete') {
      const existed = user.addresses.some((a) => a._id.toString() === addressId);
      if (!existed) return res.status(404).json({ success: false, message: 'Address not found.' });
      user.addresses = user.addresses.filter((a) => a._id.toString() !== addressId);
      if (user.addresses.length && !user.addresses.some((a) => a.isDefault)) {
        user.addresses[0].isDefault = true;
      }
    } else if (action === 'setDefault') {
      const exists = user.addresses.some((a) => a._id.toString() === addressId);
      if (!exists) return res.status(404).json({ success: false, message: 'Address not found.' });
      user.addresses.forEach((a) => {
        a.isDefault = a._id.toString() === addressId;
      });
    }

    await user.save({ validateModifiedOnly: true });
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
