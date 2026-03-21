require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const analyzeRoute = require('./routes/analyze');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — allow localhost in dev + Vercel frontend in production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL, // set this in Railway to your Vercel URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// Rate limiting — max 20 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' }
});
app.use('/api', limiter);

// Daily cap — max 10 analyses per IP per day, 100 total across all users
const dailyPerIP  = new Map(); // ip -> count
const DAILY_IP_LIMIT     = parseInt(process.env.DAILY_IP_LIMIT)     || 10;
const DAILY_GLOBAL_LIMIT = parseInt(process.env.DAILY_GLOBAL_LIMIT) || 100;
let   globalDailyCount   = 0;

// Reset counts at midnight UTC
function resetDailyCounts() {
  dailyPerIP.clear();
  globalDailyCount = 0;
}
const now = new Date();
const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
setTimeout(() => { resetDailyCounts(); setInterval(resetDailyCounts, 24 * 60 * 60 * 1000); }, msUntilMidnight);

app.use('/api/analyze', (req, res, next) => {
  if (globalDailyCount >= DAILY_GLOBAL_LIMIT) {
    return res.status(429).json({ error: `Daily limit reached (${DAILY_GLOBAL_LIMIT} analyses/day). Please come back tomorrow.` });
  }
  const ip = req.ip || req.socket.remoteAddress;
  const ipCount = dailyPerIP.get(ip) || 0;
  if (ipCount >= DAILY_IP_LIMIT) {
    return res.status(429).json({ error: `You've reached your daily limit of ${DAILY_IP_LIMIT} analyses. Please come back tomorrow.` });
  }
  dailyPerIP.set(ip, ipCount + 1);
  globalDailyCount++;
  next();
});

// Routes
app.use('/api', analyzeRoute);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong.';
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Backend running on http://localhost:${PORT}`);
  }
});
