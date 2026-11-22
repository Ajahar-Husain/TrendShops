const test = require('node:test');
const assert = require('node:assert/strict');
const { buildUpiPaymentUri, isValidUpiVpa } = require('../utils/upi');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

test('builds a UPI QR payload with the exact INR amount and order reference', () => {
  const uri = new URL(buildUpiPaymentUri({
    vpa: 'merchant@bank',
    payeeName: 'TrendShops Demo',
    amount: 1250,
    orderNumber: 'TS-2026-00001',
  }));

  assert.equal(uri.protocol, 'upi:');
  assert.equal(uri.searchParams.get('pa'), 'merchant@bank');
  assert.equal(uri.searchParams.get('pn'), 'TrendShops Demo');
  assert.equal(uri.searchParams.get('am'), '1250.00');
  assert.equal(uri.searchParams.get('cu'), 'INR');
  assert.equal(uri.searchParams.get('tn'), 'Order TS-2026-00001');
});

test('rejects invalid merchant VPA and non-positive amounts', () => {
  assert.equal(isValidUpiVpa('not-a-vpa'), false);
  assert.throws(() => buildUpiPaymentUri({
    vpa: 'not-a-vpa',
    amount: 100,
    orderNumber: 'TS-1',
  }), /valid UPI ID/);
  assert.throws(() => buildUpiPaymentUri({
    vpa: 'merchant@bank',
    amount: 0,
    orderNumber: 'TS-1',
  }), /greater than zero/);
});

test('order and payment models reject non-UPI payment methods', () => {
  const order = new Order({ paymentMethod: 'COD' });
  const payment = new Payment({ method: 'Card' });

  assert.ok(order.validateSync().errors.paymentMethod);
  assert.ok(payment.validateSync().errors.method);
});
