const express = require('express');
const cors = require('cors');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());

// ── Health Check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'API Gateway is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Service Routes (Proxy) ────────────────────────────────────
const services = {
  '/api/auth':          process.env.AUTH_SERVICE_URL         || 'http://localhost:5001',
  '/api/appointments':  process.env.APPOINTMENT_SERVICE_URL  || 'http://localhost:5002',
  '/api/payments':      process.env.PAYMENT_SERVICE_URL      || 'http://localhost:5003',
  '/api/notifications': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5004',
  '/api/ai':            process.env.AI_SERVICE_URL            || 'http://localhost:5005',
  '/api/doctors':        process.env.DOCTOR_SERVICE_URL        || 'http://localhost:5006',
  '/api/patients':       process.env.PATIENT_SERVICE_URL       || 'http://localhost:5007',
  '/api/telemedicine':   process.env.TELEMEDICINE_SERVICE_URL  || 'http://localhost:5008',
  '/api/admin':          process.env.ADMIN_SERVICE_URL         || 'http://localhost:5009',
};

Object.entries(services).forEach(([route, target]) => {
  app.use(
    route,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      onProxyReq: fixRequestBody,
      onError: (err, req, res) => {
        console.error(`[Gateway] Proxy error for ${route}:`, err.message);
        res.status(502).json({ error: 'Service temporarily unavailable' });
      },
    })
  );
  console.log(`[Gateway] ${route} → ${target}`);
});

// ── 404 fallback ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.path} not found on gateway` });
});

// ── Start ─────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway running at http://localhost:${PORT}`);
  console.log(`   Services registered: ${Object.keys(services).length}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. API Gateway may already be running.`);
    console.error('   Stop the existing process on 8080, then run npm start again.');
    process.exit(1);
  }

  console.error('❌ API Gateway startup error:', err.message);
  process.exit(1);
});
