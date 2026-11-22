/**
 * constants.js — TrendShops shared app constants
 */

/** All possible order lifecycle statuses with label and Tailwind color classes */
export const ORDER_STATUSES = {
  pending: {
    label: 'Pending',
    color: 'bg-secondary-light text-on-surface',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-primary-light text-on-surface',
  },
  processing: {
    label: 'Processing',
    color: 'bg-secondary-light text-on-surface',
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-surface-muted text-on-surface',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'bg-secondary text-on-surface',
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-primary-light text-on-surface',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-tertiary text-white',
  },
  returned: {
    label: 'Returned',
    color: 'bg-surface-muted text-on-surface-variant',
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-secondary-light text-on-surface',
  },
};

/** Supported payment methods */
export const PAYMENT_METHODS = ['UPI / QR'];

/** Product categories */
export const CATEGORIES = [
  'Electronics',
  "Men's Fashion",
  "Women's Fashion",
  'Home & Living',
  'Beauty',
  'Sports & Fitness',
  'Books',
  'Toys & Baby',
  'Grocery',
  'Automotive',
];

export const PRODUCT_CATEGORY_OPTIONS = [
  { name: 'Electronics', slug: 'electronics' },
  { name: "Men's Fashion", slug: 'mens-fashion' },
  { name: "Women's Fashion", slug: 'womens-fashion' },
  { name: 'Home & Living', slug: 'home-living' },
  { name: 'Beauty', slug: 'beauty' },
  { name: 'Sports & Fitness', slug: 'sports-fitness' },
];

/** Logistics / courier partner names */
export const COURIER_PARTNERS = ['Delhivery', 'Bluedart', 'Xpressbees', 'DTDC', 'Ekart'];

/** Product listing sort options */
export const SORT_OPTIONS = [
  { label: 'Relevance',         value: 'relevance' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Newest First',      value: 'newest' },
  { label: 'Best Rating',       value: 'rating' },
  { label: 'Most Reviews',      value: 'reviews' },
  { label: 'Discount',          value: 'discount' },
];

/** Number of products per page on listing pages */
export const ITEMS_PER_PAGE = 20;

/** Minimum cart value for free shipping (INR) */
export const FREE_SHIPPING_THRESHOLD = 499;

/** Standard shipping charge (INR) */
export const SHIPPING_CHARGE = 49;

/** GST rate applied to orders */
export const GST_RATE = 0.18;

/** App name */
export const APP_NAME = 'TrendShops';

/** App tagline */
export const APP_TAGLINE = 'India ka apna store';

/** Support email */
export const SUPPORT_EMAIL = 'support@trendshops.in';

/** Support phone */
export const SUPPORT_PHONE = '1800-123-4567';
