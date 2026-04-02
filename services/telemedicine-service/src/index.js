const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const sessionRoutes = require('./routes/session.routes');

const app = express();
const PORT = process.env.PORT || 5008;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Database ──────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/emedicare_telemedicine')
  .then(() => console.log('✅ [Telemedicine Service] MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/telemedicine', sessionRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Telemedicine Service is running', timestamp: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n📹 Telemedicine Service running at http://localhost:${PORT}`);
});
