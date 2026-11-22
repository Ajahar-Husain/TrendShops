const isValidUpiVpa = (value) =>
  typeof value === 'string' && /^[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,64}$/.test(value);

function buildUpiPaymentUri({ vpa, payeeName, amount, orderNumber }) {
  if (!isValidUpiVpa(vpa)) {
    throw new Error('DEMO_UPI_VPA must be a valid UPI ID (for example, merchant@bank).');
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }
  if (!orderNumber) {
    throw new Error('Order number is required to create a UPI QR code.');
  }

  const params = new URLSearchParams({
    pa: vpa,
    pn: payeeName || 'TrendShops',
    am: amount.toFixed(2),
    cu: 'INR',
    tn: `Order ${orderNumber}`,
  });
  return `upi://pay?${params.toString()}`;
}

module.exports = { buildUpiPaymentUri, isValidUpiVpa };
