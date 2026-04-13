const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const patientRoutes = require('./routes/patient.routes');

const app = express();
const PORT = process.env.PORT || 5007;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

const reportsDir = path.join(__dirname, '../uploads/patient-reports');
fs.mkdirSync(reportsDir, { recursive: true });
app.use('/api/patients/reports', express.static(reportsDir));

// ── Database ──────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/emedicare_patients')
  .then(() => console.log('✅ [Patient Service] MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/patients', patientRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Patient Service is running', timestamp: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🧑‍⚕️ Patient Service running at http://localhost:${PORT}`);
});
