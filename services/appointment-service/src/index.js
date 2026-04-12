const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const appointmentRoutes = require('./routes/appointments');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDB Atlas connected ✅'))
  .catch(err => console.log('MongoDB error:', err));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api', appointmentRoutes);

// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Appointment Service running on port ${PORT} 🚀`));