const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const sessionRoutes = require('./routes/session.routes');

const app = express();
const PORT = Number(process.env.PORT || 5008);

app.use(cors());
app.use(express.json());

const mongoUri =
  process.env.TELEMEDICINE_DB_URI ||
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/emedicare_telemedicine';

mongoose
  .connect(mongoUri)
  .then(() => console.log('OK [Telemedicine Service] MongoDB connected'))
  .catch((err) => console.error('ERROR [Telemedicine Service] MongoDB connection error:', err.message));

app.get('/health', (req, res) => {
  res.json({
    status: 'Telemedicine Service is running',
    service: 'telemedicine-service',
    provider: 'jitsi-meet',
    apiKeyRequired: false,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/telemedicine', sessionRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const server = app.listen(PORT, () => {
  console.log(`Video Telemedicine Service running at http://localhost:${PORT}`);
  console.log('Join URLs use free Jitsi rooms and do not require an API key.');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Port ' + PORT + ' is already in use. Stop old process and run again.');
  } else {
    console.error('Startup error:', err.message);
  }
  process.exit(1);
});