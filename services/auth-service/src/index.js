const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const User = require('./models/user.model');

const app = express();
const PORT = process.env.PORT || 5001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Database ──────────────────────────────────────────────────
mongoose
  .connect(process.env.AUTH_DB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/emedicare_auth')
  .then(async () => {
    console.log(`✅ [Auth Service] MongoDB connected (db: ${mongoose.connection.name})`);

    const adminEmail = 'admin@emed.lk';
    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      console.log('✅ [Auth Service] Default admin account created (admin@emed.lk)');
    }
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Auth Service is running', timestamp: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔐 Auth Service running at http://localhost:${PORT}`);
});
