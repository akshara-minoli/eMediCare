const express = require('express');
const cors = require('cors');
require('dotenv').config();

const aiRoutes = require('./routes/ai.routes');

const app = express();
const PORT = Number(process.env.PORT || 5005);

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────
app.use('/api/ai', aiRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'AI Service is running',
    service: 'ai-service',
    mode: 'rule-based triage engine',
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Start ─────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🤖 AI Service running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop old process and run again.`);
  } else {
    console.error('AI service startup error:', err.message);
  }
  process.exit(1);
});
