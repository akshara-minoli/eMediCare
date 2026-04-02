const express = require('express');
const cors = require('cors');
require('dotenv').config();

const aiRoutes = require('./routes/ai.routes');

const app = express();
const PORT = process.env.PORT || 5005;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────
app.use('/api/ai', aiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'AI Service is running', timestamp: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🤖 AI Service running at http://localhost:${PORT}`);
});
