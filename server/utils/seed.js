require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');

const categories = [
  { name: 'Electronics', slug: 'electronics', icon: '⌁', sortOrder: 1 },
  { name: "Men's Fashion", slug: 'mens-fashion', icon: '◈', sortOrder: 2 },
  { name: "Women's Fashion", slug: 'womens-fashion', icon: '✿', sortOrder: 3 },
  { name: 'Home & Living', slug: 'home-living', icon: '⌂', sortOrder: 4 },
  { name: 'Beauty', slug: 'beauty', icon: '✦', sortOrder: 5 },
  { name: 'Sports & Fitness', slug: 'sports-fitness', icon: '◉', sortOrder: 6 },
];

const catalog = [
  ['Aura Pro ANC Wireless Headphones', 'electronics', 'SoundCraft', 3299, 7499, 28, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85', true],
  ['PulseFit AMOLED Smartwatch', 'electronics', 'PulseFit', 2499, 4999, 36, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85', true],
  ['Everyday Wireless Earbuds', 'electronics', 'SoundCraft', 1799, 3499, 42, 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=85', true],
  ['Portable Bluetooth Speaker', 'electronics', 'SoundCraft', 2199, 3999, 32, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85', false],
  ['Classic Cotton Oxford Shirt', 'mens-fashion', 'Northline', 899, 1499, 38, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=85', true],
  ['Relaxed Fit Everyday Sneakers', 'mens-fashion', 'Stride', 1899, 2999, 25, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85', false],
  ['Floral Everyday Kurta', 'womens-fashion', 'Aarohi', 1299, 2199, 34, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85', true],
  ['Lightweight Everyday Tote', 'womens-fashion', 'Aarohi', 999, 1799, 30, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85', false],
  ['Insulated Steel Water Bottle', 'home-living', 'DailyKind', 599, 999, 40, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85', true],
  ['Ceramic Pour-Over Coffee Set', 'home-living', 'DailyKind', 1499, 2299, 25, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85', false],
  ['Daily Glow Skincare Set', 'beauty', 'Bare Botanics', 1199, 1899, 28, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85', true],
  ['All-Day Training Yoga Mat', 'sports-fitness', 'Motion Co.', 1099, 1799, 24, 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=900&q=85', false],
  ['USB-C Fast Charging Power Bank', 'electronics', 'VoltGo', 1499, 2499, 45, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=85', true],
  ['Gaming Mechanical Keyboard', 'electronics', 'KeyForge', 2999, 4999, 18, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85', false],
  ['1080P HD Wireless Webcam', 'electronics', 'ViewMate', 1899, 3499, 22, 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?auto=format&fit=crop&w=900&q=85', false],
  ['Slim Aluminum Laptop Stand', 'electronics', 'DeskPro', 899, 1499, 35, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=85', false],
  ['Noise-Canceling Office Headset', 'electronics', 'SoundCraft', 2799, 4599, 20, 'https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=900&q=85', true],
  ['Slim Fit Casual T-Shirt', 'mens-fashion', 'Northline', 699, 1199, 50, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85', false],
  ['Classic Denim Jacket', 'mens-fashion', 'Northline', 1999, 3499, 16, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85', true],
  ['Premium Leather Wallet', 'mens-fashion', 'UrbanHide', 799, 1499, 40, 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=85', false],
  ['Running Performance Shorts', 'mens-fashion', 'Motion Co.', 999, 1699, 32, 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=900&q=85', false],
  ['Minimal Analog Watch', 'mens-fashion', 'Timely', 2299, 3999, 14, 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=85', true],
  ['Elegant Chiffon Dress', 'womens-fashion', 'Aarohi', 1899, 2999, 24, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85', true],
  ['High-Rise Denim Jeans', 'womens-fashion', 'Aarohi', 1499, 2499, 28, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85', false],
  ['Classic Canvas Sneakers', 'womens-fashion', 'Stride', 1699, 2799, 30, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85', false],
  ['Handcrafted Silver Earrings', 'womens-fashion', 'Mira', 699, 1299, 38, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85', true],
  ['Soft Cotton Lounge Set', 'womens-fashion', 'Aarohi', 1599, 2499, 20, 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=85', false],
  ['Modern Table Lamp', 'home-living', 'Haven', 1299, 2199, 27, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85', true],
  ['Soft Woven Cushion Cover Set', 'home-living', 'Haven', 899, 1499, 44, 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=85', false],
  ['Scented Soy Candle', 'home-living', 'Haven', 599, 999, 55, 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85', false],
  ['Bamboo Storage Organizer', 'home-living', 'DailyKind', 1099, 1799, 25, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=85', false],
  ['Hydrating Vitamin C Serum', 'beauty', 'Bare Botanics', 899, 1499, 48, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85', true],
  ['Natural Rose Face Wash', 'beauty', 'Bare Botanics', 499, 799, 60, 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=85', false],
  ['Matte Nude Lipstick', 'beauty', 'Velvet Hue', 699, 1199, 42, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85', true],
  ['Professional Makeup Brush Set', 'beauty', 'Velvet Hue', 999, 1799, 34, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85', false],
  ['Adjustable Dumbbell Set', 'sports-fitness', 'Motion Co.', 2499, 4499, 15, 'https://images.unsplash.com/photo-1586401100295-7a8096fd231a?auto=format&fit=crop&w=900&q=85', true],
  ['Resistance Band Training Kit', 'sports-fitness', 'Motion Co.', 799, 1499, 50, 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=900&q=85', false],
  ['Lightweight Sports Backpack', 'sports-fitness', 'TrailX', 1299, 2299, 31, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', false],
  ['Insulated Sports Shaker Bottle', 'sports-fitness', 'DailyKind', 499, 899, 65, 'https://images.unsplash.com/photo-1575209626684-88bfab1de5ec?auto=format&fit=crop&w=900&q=85', false],
];

async function seed() {
  await connectDB();
  const categoryIds = new Map();
  for (const data of categories) {
    const category = await Category.findOneAndUpdate(
      { slug: data.slug },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categoryIds.set(data.slug, category._id);
  }

  for (const [name, categorySlug, brand, price, originalPrice, stock, image, isFeatured] of catalog) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await Product.findOneAndUpdate(
      { slug },
      {
        $set: {
          name,
          slug,
          description: `${name} from ${brand}, selected for everyday comfort, reliable quality and great value.`,
          category: categoryIds.get(categorySlug),
          brand,
          price,
          originalPrice,
          stock,
          sku: `TS-${slug.toUpperCase().slice(0, 20)}`,
          images: [{ url: image, alt: name, isPrimary: true }],
          isFeatured,
          isActive: true,
          tags: [categorySlug, brand.toLowerCase()],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const email = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const existing = await User.findOne({ email }).select('+password');
    if (existing) {
      existing.role = 'admin';
      existing.isActive = true;
      await existing.save();
    } else {
      await User.create({ name: 'TrendShops Admin', email, password, role: 'admin' });
    }
    console.log(`Admin account ready: ${email}`);
  } else {
    console.log('No admin account created. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to enable one.');
  }

  console.log(`Seeded ${categories.length} categories and ${catalog.length} products.`);
}

seed()
  .catch((error) => {
    console.error('Database seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
