const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const patientRoutes = require('./routes/patient.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();
const PORT = process.env.PORT || 5007;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

const reportsDir = path.join(__dirname, '../uploads/patient-reports');
fs.mkdirSync(reportsDir, { recursive: true });
app.use('/api/patients/reports', express.static(reportsDir));

// ── Database ──────────────────────────────────────────────────
const connectDB = async () => {
  const mongoUri = process.env.PATIENTS_DB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('PATIENTS_DB_URI or MONGO_URI is required for patient-service');
  }

  await mongoose.connect(mongoUri);
  console.log('✅ [Patient Service] MongoDB connected');
};

// ── Routes ────────────────────────────────────────────────────
app.use('/api/patients', patientRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'Patient Service is running',
    timestamp: new Date().toISOString(),
    service: 'patient-service',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`\n🧑‍⚕️ Patient Service running at http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `❌ Port ${PORT} is already in use. Patient service may already be running in another terminal.`
        );
        console.error('   Stop the existing process on 5007, then run npm start again.');
        process.exit(1);
      }

      console.error('❌ Server startup error:', err.message);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start patient-service:', err.message);
    process.exit(1);
  });
