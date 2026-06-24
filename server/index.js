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
// ALLOWED_ORIGINS is a comma-separated list of permitted origins, e.g.:
//   https://mysite.multiscreensite.com,https://myacademy.ie
const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...extraOrigins,
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3001',
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

// Webhook MUST be registered before express.json() so the raw body Buffer
// reaches the handler intact for Stripe signature verification.
app.use('/api/webhook', express.raw({ type: '*/*' }));
app.use('/api/webhook', require('./routes/webhook'));

app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/availability',             require('./routes/availability'));
app.use('/api/create-checkout-session',  require('./routes/checkout'));
app.use('/api/admin',                    require('./routes/admin'));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Payment success page ───────────────────────────────────────────────────
app.get('/payment-success', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful — Tennis Academy</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f0f9f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
      max-width: 480px;
      width: 100%;
      padding: 48px 40px;
      text-align: center;
    }
    .icon { font-size: 64px; margin-bottom: 16px; }
    h1 { font-size: 1.75rem; color: #1a1a1a; margin-bottom: 12px; }
    p { color: #555; line-height: 1.6; margin-bottom: 12px; }
    a.btn {
      display: inline-block;
      margin-top: 24px;
      padding: 14px 32px;
      background: #2e7d32;
      color: #fff;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
    }
    a.btn:hover { background: #1b5e20; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🎾</div>
    <h1>You're all booked!</h1>
    <p>Thank you for registering with the Tennis Academy. Your payment was successful and your children are now enrolled for the season.</p>
    <p>A confirmation email will be sent to you shortly. If you have any questions, please get in touch.</p>
    <a class="btn" href="https://tennis4kids.multiscreensite.com/book">Back to Booking</a>
  </div>
</body>
</html>`);
});

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
