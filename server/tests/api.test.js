process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const { before, after } = require('node:test');
const { app } = require('../server');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('health endpoint reports API status without requiring MongoDB', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, body.database === 'connected' ? 200 : 503);
  assert.ok(['connected', 'disconnected'].includes(body.database));
  assert.equal(body.success, body.database === 'connected');
  assert.equal(body.status, body.database === 'connected' ? 'ok' : 'degraded');
});

test('root API endpoint returns the service welcome response to API clients', async () => {
  const response = await fetch(`${baseUrl}/`, { headers: { accept: 'application/json' } });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.message, 'Welcome to TrendShops API');
  assert.equal(body.health, '/api/health');
});

test('CORS permits both local development origins and rejects unrelated origins', async () => {
  for (const origin of ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001']) {
    const response = await fetch(`${baseUrl}/api/health`, { headers: { origin } });
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
  }

  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { origin: 'https://untrusted.example' },
  });
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});

test('registration rejects invalid input before database access', async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'A', email: 'not-an-email', password: 'x' }),
  });

  assert.equal(response.status, 400);
  assert.ok((await response.json()).errors.length > 0);
});

test('registration enforces password strength and rejects bcrypt-overlong UTF-8 input', async () => {
  for (const password of ['short7', '😀'.repeat(19)]) {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password }),
    });

    assert.equal(response.status, 400);
    assert.ok((await response.json()).errors.length > 0);
  }
});

test('login rejects invalid input before database access', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: '' }),
  });

  assert.equal(response.status, 400);
  assert.ok((await response.json()).errors.length > 0);
});

test('order and admin payment endpoints require authentication', async () => {
  const orderResponse = await fetch(`${baseUrl}/api/orders/my-orders`);
  const approvalsResponse = await fetch(`${baseUrl}/api/payments/admin/approval-queue`);

  assert.equal(orderResponse.status, 401);
  assert.equal(approvalsResponse.status, 401);
});

test('wishlist endpoints require authentication', async () => {
  const responses = await Promise.all([
    fetch(`${baseUrl}/api/auth/me/wishlist`),
    fetch(`${baseUrl}/api/auth/me/wishlist/507f1f77bcf86cd799439011`, { method: 'POST' }),
    fetch(`${baseUrl}/api/auth/me/wishlist/507f1f77bcf86cd799439011`, { method: 'DELETE' }),
  ]);

  assert.deepEqual(responses.map((response) => response.status), [401, 401, 401]);
});

test('email verification requires authentication to send and validates confirmation tokens', async () => {
  const sendResponse = await fetch(`${baseUrl}/api/auth/me/email-verification`, {
    method: 'POST',
  });
  const confirmResponse = await fetch(`${baseUrl}/api/auth/email-verification/confirm`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: 'invalid' }),
  });

  assert.equal(sendResponse.status, 401);
  assert.equal(confirmResponse.status, 400);
});
