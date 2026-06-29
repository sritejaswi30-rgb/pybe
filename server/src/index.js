const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const scenarioRoutes = require('./routes/scenarios');
const sessionRoutes = require('./routes/sessions');
const analyticsRoutes = require('./routes/analytics');
const roadmapRoutes = require('./routes/roadmap');
const conceptRoutes = require('./routes/concepts');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ ok: true, product: 'PyBe' }));
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/concepts', conceptRoutes);

process.on('uncaughtException', (err) => {
  console.error('FATAL: Uncaught Exception -', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('FATAL: Unhandled Rejection -', reason);
  if (reason instanceof Error) {
    console.error('Stack:', reason.stack);
  }
  process.exit(1);
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = error.status || error.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : error.message || 'Server error';
  res.status(status).json({ error: message, safe: true });
});

const server = app.listen(port, () => {
  console.log(`[PYBE] Backend running on http://localhost:${port}`);
  console.log(`[PYBE] Health check: http://localhost:${port}/api/health`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[PYBE] ERROR: Port ${port} is already in use`);
  } else {
    console.error('[PYBE] Server error:', err);
  }
  process.exit(1);
});
