const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 5009;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Database ──────────────────────────────────────────────────
const MONGO_URI = process.env.ADMIN_DB_URI || process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('✅ [Admin Service] MongoDB connected'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));
} else {
  console.log('ℹ️ [Admin Service] Running without admin-db (stateless orchestration mode)');
}

// ── Routes ────────────────────────────────────────────────────
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'Admin Service is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n👨‍💼 Admin Service running at http://localhost:${PORT}`);
});
