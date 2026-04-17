const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const doctorRoutes = require('./routes/doctor.routes');

const app = express();
const PORT = process.env.PORT || 5006;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Database ──────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI || process.env.DOCTOR_DB_URI || 'mongodb://localhost:27017/emedicare_doctors')
  .then(() => {
    console.log(`✅ [Doctor Service] MongoDB connected (db: ${mongoose.connection.name})`);
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/doctors', doctorRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Doctor Service is running', timestamp: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🩺 Doctor Service running at http://localhost:${PORT}`);
});
