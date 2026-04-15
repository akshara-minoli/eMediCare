const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const paymentRoutes = require('./routes/payment.routes');

const app = express();
const PORT = process.env.PORT || 5003;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());

// Raw body capture for Stripe webhook signature verification
// Must come BEFORE express.json() so the raw buffer is preserved
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      req.rawBody = data;
      req.body = data;
      next();
    });
  } else {
    next();
  }
});

app.use(express.json());

// ── Database ──────────────────────────────────────────────────
mongoose
  .connect(
    process.env.PAYMENTS_DB_URI
      || process.env.MONGO_URI
      || 'mongodb://localhost:27017/emedicare_payments'
  )
  .then(() => console.log('✅ [Payment Service] MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Payment Service is running', timestamp: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n💳 Payment Service running at http://localhost:${PORT}`);
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
  console.log(`   Stripe: ${stripeConfigured ? '✅ configured' : '⚠️  not configured (set STRIPE_SECRET_KEY)'}`);
});
