// MongoDB's driver expects global Web Crypto, which Node 18 does not expose by default.
globalThis.crypto ??= require('node:crypto').webcrypto;
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const notificationRoutes = require('./routes/notification.routes');

const app = express();
const PORT = process.env.PORT || 5004;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── MongoDB Connection ────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/emedicare_notifications';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Notification DB Connected'))
  .catch(err => console.error('❌ DB Context Error:', err));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Notification Service is running', timestamp: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔔 Notification Service running at http://localhost:${PORT}`);
});
