require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { checkConnection, pool } = require('./config/db');
const apiRouter = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const envOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
];

const allowedOrigins = [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins])];

let server;
let isShuttingDown = false;

// =====================================================
// Process Error Handlers
// =====================================================
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception');
  console.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise Rejection');
  console.error(reason);

  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// =====================================================
// App Settings
// =====================================================
app.disable('x-powered-by');
app.set('trust proxy', 1);

// =====================================================
// Security Middleware
// =====================================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const corsError = new Error(`CORS blocked for origin: ${origin}`);
    corsError.statusCode = 403;
    return callback(corsError);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// =====================================================
// Body Parsers
// =====================================================
app.use(
  express.json({
    limit: '10mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// =====================================================
// Static Files
// =====================================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =====================================================
// Logging
// =====================================================
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// =====================================================
// Rate Limiter
// =====================================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  skip: (req) => req.path === '/health',
});

app.use('/api', apiLimiter);

// =====================================================
// Health Check
// =====================================================
const healthHandler = (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// =====================================================
// API Routes
// =====================================================
app.use('/api', apiRouter);

// =====================================================
// 404 Handler
// =====================================================
app.use((req, res, next) => {
  const error = new Error(`Resource Not Found: [${req.method}] ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// =====================================================
// Global Error Handler
// =====================================================
app.use(errorHandler);

// =====================================================
// Graceful Shutdown
// =====================================================
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${signal} received. Closing server...`);

  const forceShutdownTimer = setTimeout(() => {
    console.error('⚠ Force shutdown.');
    process.exit(1);
  }, 10000);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    await pool.end();
    clearTimeout(forceShutdownTimer);
    console.log('✅ Database pool closed.');
    process.exit(0);
  } catch (err) {
    clearTimeout(forceShutdownTimer);
    console.error('❌ Error during graceful shutdown.');
    console.error(err);
    process.exit(1);
  }
};

// =====================================================
// Server Startup
// =====================================================
const startServer = async () => {
  try {
    console.log('🔄 Checking database connection...');
    await checkConnection();
    console.log('✅ Database connected successfully.');

    const geminiService = require('./services/geminiService');

    if (geminiService.isConfigured()) {
      console.log(`✅ Gemini AI : Configured (${geminiService.getModelName()})`);
    } else {
      console.warn('⚠ Gemini API key is missing.');
      console.warn('Add GEMINI_API_KEY inside backend/.env');
    }

    server = app.listen(PORT, () => {
      console.log('\n===================================');
      console.log('🚀 Server Running');
      console.log(`🌍 Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Port        : ${PORT}`);
      console.log(`❤️ Health      : http://localhost:${PORT}/health`);
      console.log(`🩺 API Health  : http://localhost:${PORT}/api/health`);
      console.log(`🤖 AI Health   : http://localhost:${PORT}/api/ai/health`);
      console.log('===================================\n');
    });

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ Server startup failed.');
    console.error(error);
    process.exit(1);
  }
};

startServer();