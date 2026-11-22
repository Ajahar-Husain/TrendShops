const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// GET /api/products - paginate, filter, search
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      minPrice,
      maxPrice,
      brand,
      sort = '-createdAt',
      inStock,
    } = req.query;

    const filter = { isActive: true };

    if (search && String(search).trim()) {
      filter.$text = { $search: String(search).trim().slice(0, 100) };
    }

    if (category) {
      const cat = await Category.findOne({ slug: category });
      filter.category = cat ? cat._id : null;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice !== undefined && Number.isFinite(Number(minPrice))) filter.price.$gte = Math.max(0, Number(minPrice));
      if (maxPrice !== undefined && Number.isFinite(Number(maxPrice))) filter.price.$lte = Math.max(0, Number(maxPrice));
    }

    if (brand) {
      const escapedBrand = String(brand).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 60);
      filter.brand = new RegExp(escapedBrand, 'i');
    }
    if (inStock === 'true') filter.stock = { $gt: 0 };
    if (req.query.deals === 'true') filter.discountPercent = { $gte: 20 };

    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {
      'createdAt': { createdAt: 1 },
      '-createdAt': { createdAt: -1 },
      'price': { price: 1 },
      '-price': { price: -1 },
      'rating': { rating: 1 },
      '-rating': { rating: -1 },
      'discountPercent': { discountPercent: 1 },
      '-discountPercent': { discountPercent: -1 },
      'name': { name: 1 },
      '-name': { name: -1 },
    };
    const sortObj = sortOptions[sort] || { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(search && !sortOptions[sort] ? { score: { $meta: 'textScore' } } : sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/featured
router.get('/featured', async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug')
      .limit(12)
      .lean();
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/deals
router.get('/deals', async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, discountPercent: { $gte: 20 } })
      .populate('category', 'name slug')
      .sort({ discountPercent: -1 })
      .limit(20)
      .lean();
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug icon');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
});

// POST /api/products (admin)
router.post('/', protect, adminOnly, [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Valid price is required'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be non-negative integer'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const product = await Product.create(req.body);
    await product.populate('category', 'name slug');

    res.status(201).json({ success: true, message: 'Product created.', product });
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id (admin)
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // If name changes, re-generate slug
    if (req.body.name && req.body.name !== product.name) {
      product.name = req.body.name;
    }

    Object.assign(product, req.body);
    await product.save();
    await product.populate('category', 'name slug');

    res.json({ success: true, message: 'Product updated.', product });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id (admin — soft delete)
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    product.isActive = false;
    await product.save();

    res.json({ success: true, message: 'Product deactivated.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
