require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/db');

// Initialize database
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  console.log(`[${timestamp}] ${method} ${url}`);
  next();
});

// ── Routes ─────────────────────────────────────────────

// Agent routes (no JWT, uses API key)
app.use('/api/register', require('./routes/register'));
app.use('/api/beacon', require('./routes/beacon'));
app.use('/api/result', require('./routes/results'));

// Dashboard routes (JWT protected)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/payloads', require('./routes/payloads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    server: 'ByteCode Control Server',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║     ByteCode Control Server v1.0.0       ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log(`  ║  🌐 API:  http://localhost:${PORT}          ║`);
  console.log('  ║  📡 Status: OPERATIONAL                  ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});
