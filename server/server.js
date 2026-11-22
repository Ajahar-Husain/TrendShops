require('dotenv').config();

const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const port = Number(process.env.PORT) || 5000;
const allowedOrigins = new Set([process.env.CLIENT_URL || 'http://localhost:3000']);

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:3000');
  allowedOrigins.add('http://127.0.0.1:3000');
}

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
  credentials: true,
}));
app.use(compression());
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buffer) => {
    req.rawBody = Buffer.from(buffer);
  },
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use('/api', rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    database: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use(notFound);
app.use(errorHandler);

async function start() {
  for (const name of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    const secret = process.env[name];
    if (!secret || secret.length < 32 || /replace|change|example/i.test(secret)) {
      throw new Error(`${name} must be a unique, random secret of at least 32 characters. Configure server/.env.`);
    }
  }
  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different values.');
  }
  await connectDB();
  return app.listen(port, () => {
    console.log(`TrendShops API listening on http://localhost:${port}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Unable to start TrendShops API:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, start };
