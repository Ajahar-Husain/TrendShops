/**
 * formatters.js — TrendShops utility formatters
 */

/**
 * Format a number as Indian Rupee currency string.
 * @param {number} amount
 * @returns {string} e.g. "₹1,234"
 */
export function formatPrice(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date to "22 Nov 2026".
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Format a date to "22 Nov 2026, 10:30 AM".
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

/**
 * Returns a Tailwind CSS badge class string for a given order status.
 * @param {string} status
 * @returns {string}
 */
export function getOrderStatusColor(status) {
  const colorMap = {
    pending:          'bg-secondary-light text-on-surface',
    confirmed:        'bg-primary-light text-on-surface',
    processing:       'bg-secondary-light text-on-surface',
    shipped:          'bg-surface-muted text-on-surface',
    out_for_delivery: 'bg-secondary text-on-surface',
    delivered:        'bg-primary-light text-on-surface',
    cancelled:        'bg-tertiary text-white',
    returned:         'bg-surface-muted text-on-surface-variant',
    refunded:         'bg-secondary-light text-on-surface',
  };
  return colorMap[status] || 'bg-surface-muted text-on-surface-variant';
}

/**
 * Returns a human-readable label for an order status.
 * @param {string} status
 * @returns {string}
 */
export function getStatusLabel(status) {
  const labelMap = {
    pending:          'Pending',
    confirmed:        'Confirmed',
    processing:       'Processing',
    shipped:          'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered:        'Delivered',
    cancelled:        'Cancelled',
    returned:         'Returned',
    refunded:         'Refunded',
  };
  return labelMap[status] || status;
}

/**
 * Truncate a string to n characters, appending "…" if truncated.
 * @param {string} str
 * @param {number} n
 * @returns {string}
 */
export function truncate(str, n = 100) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

/**
 * Generate a unique TrendShops order ID prefix string.
 * @returns {string} e.g. "TS-A3F9K2"
 */
export function generateOrderId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TS-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
