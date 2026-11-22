require('dotenv').config();

const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const port = Number(process.env.PORT) || 5000;
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
const clientOrigins = (process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);
const allowedOrigins = new Set(clientOrigins);
const clientBuildPath = path.resolve(__dirname, '../client/dist');
const clientIndexPath = path.join(clientBuildPath, 'index.html');

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:3000');
  allowedOrigins.add('http://127.0.0.1:3000');
}

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const localDevelopmentOrigin = process.env.NODE_ENV !== 'production'
      && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
    callback(null, !origin || allowedOrigins.has(origin) || localDevelopmentOrigin);
  },
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
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan((tokens, req, res) => [
    tokens.method(req, res),
    req.path,
    tokens.status(req, res),
    `${tokens['response-time'](req, res)} ms`,
  ].join(' ')));
}
app.use('/api', rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.get('/api/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    status: databaseConnected ? 'ok' : 'degraded',
    database: databaseConnected ? 'connected' : 'disconnected',
  });
});

app.get('/', (req, res, next) => {
  if (req.get('accept')?.includes('text/html') && fs.existsSync(clientIndexPath)) {
    return res.sendFile(clientIndexPath);
  }
  return res.status(200).json({
    success: true,
    message: 'Welcome to TrendShops API',
    status: 'running',
    health: '/api/health',
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use(express.static(clientBuildPath, { index: false, maxAge: '1d' }));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (fs.existsSync(clientIndexPath)) return res.sendFile(clientIndexPath);
  return next();
});
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
    console.log(`TrendShops service listening on port ${port} (${process.env.NODE_ENV || 'development'}).`);
  });
}

if (require.main === module) {
  start()
    .then((server) => {
      const shutdown = (signal) => {
        console.log(`Received ${signal}; shutting down TrendShops service.`);
        server.close(async () => {
          await mongoose.disconnect();
          process.exit(0);
        });
      };
      process.once('SIGTERM', () => shutdown('SIGTERM'));
      process.once('SIGINT', () => shutdown('SIGINT'));
    })
    .catch((error) => {
      console.error('Unable to start TrendShops API:', process.env.NODE_ENV === 'production' ? error.name : error.message);
      process.exitCode = 1;
    });
}

module.exports = { app, start };
