/**
 * Tennis Academy — Express Server
 *
 * Endpoints:
 *   GET  /api/availability?venue=Clontarf  — slot booking counts
 *   POST /api/create-checkout-session       — creates Stripe Checkout session
 *   POST /api/webhook                       — Stripe webhook handler
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────────────────
// Allow requests from the Vite dev server and production frontend.
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:4173', // Vite preview
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
  }),
);

// ── Body parsing ──────────────────────────────────────────────────────────
// The webhook route MUST receive the raw body for Stripe signature verification.
// All other routes use JSON.

app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/availability',             require('./routes/availability'));
app.use('/api/create-checkout-session',  require('./routes/checkout'));
app.use('/api/webhook',                  require('./routes/webhook'));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ──────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎾 Tennis Academy API running on http://localhost:${PORT}`);
  console.log(`   Stripe mode: ${process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') ? 'TEST ✓' : 'LIVE ⚠'}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
});
