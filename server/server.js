/**
 * Tennis Academy — Zero-dependency Node.js Server
 *
 * Uses ONLY Node.js built-in modules (http, https, crypto, fs, path, url).
 * No npm install required — just: node server/server.js
 *
 * Endpoints:
 *   GET  /api/health
 *   GET  /api/availability?venue=Clontarf
 *   POST /api/create-checkout-session
 *   POST /api/webhook
 *   GET  /* → serves public/index.html (SPA fallback)
 */

'use strict';

const http   = require('http');
const https  = require('https');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');
const url    = require('url');

// ── Load .env manually (no dotenv needed) ────────────────────────────────────
function loadEnv(filePath) {
  try {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.replace(/#.*$/, '').trim();
      if (!trimmed) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) process.env[key] = val;
    }
  } catch { /* .env not found — use real environment vars */ }
}
loadEnv(path.join(__dirname, '.env'));

// ── Config ────────────────────────────────────────────────────────────────────
const PORT          = process.env.PORT          || 3001;
const FRONTEND_URL  = process.env.FRONTEND_URL  || `http://localhost:${PORT}`;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY    || '';
const WEBHOOK_SECRET= process.env.STRIPE_WEBHOOK_SECRET || '';

const { SCHEDULE, calculateOrder, findSlot, getSlotCapacity, MONTHS } =
  require('./config/academyConfig');

const BOOKINGS_PATH = path.join(__dirname, 'data', 'bookings.json');
const PUBLIC_DIR    = path.join(__dirname, '..', 'public');

// ── Helpers ───────────────────────────────────────────────────────────────────

function readBookings() {
  try { return JSON.parse(fs.readFileSync(BOOKINGS_PATH, 'utf8')); }
  catch { return {}; }
}

function writeBookings(data) {
  fs.writeFileSync(BOOKINGS_PATH, JSON.stringify(data, null, 2));
}

/** Read entire request body as Buffer */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end',  () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Send a JSON response */
function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

/** CORS headers — open to any origin so the widget works on Duda (and any other domain) */
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,stripe-signature');
}

// ── Stripe REST helper (no SDK) ───────────────────────────────────────────────

/** Flatten a nested object into Stripe's bracket-notation param format */
function flattenStripeParams(obj, prefix) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenStripeParams(v, key));
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === 'object') {
          Object.assign(out, flattenStripeParams(item, `${key}[${i}]`));
        } else {
          out[`${key}[${i}]`] = String(item);
        }
      });
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

function stripeRequest(method, stripePath, params = {}) {
  return new Promise((resolve, reject) => {
    const flat     = flattenStripeParams(params);
    const postData = new URLSearchParams(flat).toString();

    const options = {
      hostname: 'api.stripe.com',
      path:     `/v1/${stripePath}`,
      method,
      headers: {
        Authorization:  `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(parsed.error?.message || `Stripe error ${res.statusCode}`));
          } else {
            resolve(parsed);
          }
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    if (method !== 'GET') req.write(postData);
    req.end();
  });
}

// ── Webhook signature verification ───────────────────────────────────────────

function verifyWebhookSignature(rawBody, sigHeader, secret) {
  const parts     = sigHeader.split(',');
  const timestamp = (parts.find(p => p.startsWith('t=')) || '').slice(2);
  const sigs      = parts.filter(p => p.startsWith('v1=')).map(p => p.slice(3));

  if (!timestamp) throw new Error('Missing timestamp in Stripe-Signature');

  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
  if (age > 300) throw new Error('Webhook timestamp too old');

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');

  const match = sigs.some(s => {
    try { return crypto.timingSafeEqual(Buffer.from(s, 'hex'), Buffer.from(expected, 'hex')); }
    catch { return false; }
  });
  if (!match) throw new Error('Invalid Stripe webhook signature');
}

// ── Route handlers ────────────────────────────────────────────────────────────

async function handleAvailability(req, res) {
  const query = url.parse(req.url, true).query;
  const venue = query.venue;

  if (!venue) return sendJson(res, 400, { error: 'venue param required' });

  const venueSchedule = SCHEDULE[venue];
  if (venueSchedule === null)      return sendJson(res, 200, { tbc: true });
  if (venueSchedule === undefined) return sendJson(res, 404, { error: `Unknown venue: ${venue}` });

  const bookings = readBookings();
  const result   = {};

  for (const [classGroup, slots] of Object.entries(venueSchedule)) {
    result[classGroup] = {};
    for (const slot of slots) {
      const booked   = bookings[venue]?.[classGroup]?.[slot.id] || 0;
      const capacity = getSlotCapacity(classGroup, slot);
      result[classGroup][slot.id] = {
        booked, capacity,
        available: Math.max(0, capacity - booked),
        full: booked >= capacity,
      };
    }
  }
  sendJson(res, 200, result);
}

async function handleCreateCheckout(req, res) {
  let body;
  try {
    const raw = await readBody(req);
    body      = JSON.parse(raw.toString());
  } catch {
    return sendJson(res, 400, { errors: ['Invalid JSON'] });
  }

  // Validate
  const errors = [];
  if (!body.parent?.name?.trim())  errors.push('Parent name required.');
  if (!body.parent?.email?.trim()) errors.push('Parent email required.');
  if (!body.parent?.phone?.trim()) errors.push('Parent phone required.');
  if (!body.venue)                 errors.push('Venue required.');
  if (!Array.isArray(body.children) || !body.children.length) {
    errors.push('At least one child required.');
  } else if (body.children.length > 3) {
    errors.push('Maximum 3 children.');
  } else {
    body.children.forEach((c, i) => {
      const n = i + 1;
      if (!c.firstName?.trim())  errors.push(`Child ${n}: first name required.`);
      if (!c.lastName?.trim())   errors.push(`Child ${n}: surname required.`);
      if (!c.classGroup?.trim()) errors.push(`Child ${n}: class group required.`);
      if (!c.slotId?.trim())     errors.push(`Child ${n}: time slot required.`);
    });
  }
  if (errors.length) return sendJson(res, 400, { errors });

  const { parent, venue, children } = body;

  // Venue check
  if (!Object.prototype.hasOwnProperty.call(SCHEDULE, venue))
    return sendJson(res, 400, { errors: [`Unknown venue: ${venue}`] });
  if (SCHEDULE[venue] === null)
    return sendJson(res, 400, { errors: ['Currenagh schedule not yet available.'] });

  // Capacity check
  const bookings = readBookings();
  for (const child of children) {
    const slot = findSlot(venue, child.classGroup, child.slotId);
    if (!slot) return sendJson(res, 400, { errors: [`Slot not found: ${child.slotId}`] });
    const capacity = getSlotCapacity(child.classGroup, slot);
    const booked   = bookings[venue]?.[child.classGroup]?.[child.slotId] || 0;
    if (booked >= capacity) {
      return sendJson(res, 409, {
        errors: [
          `The ${slot.day} ${slot.time} slot for ${child.classGroup} is fully booked. ` +
          `Please get in touch to see if we can accommodate you.`,
        ],
      });
    }
  }

  // Pricing (source of truth — never from the browser)
  const order = calculateOrder(children);
  const { tier, monthlyTotal, orderTotal } = order;
  if (monthlyTotal === 0)
    return sendJson(res, 400, { errors: ['Order total is zero.'] });

  // Build metadata
  const meta = {
    venue,
    parent_name:         parent.name.slice(0, 200),
    parent_email:        parent.email.slice(0, 200),
    parent_phone:        parent.phone.slice(0, 50),
    pricing_tier:        tier,
    child_count:         String(children.length),
    order_total_cents:   String(orderTotal),
    monthly_total_cents: String(monthlyTotal),
    months:              String(MONTHS),
  };
  children.forEach((child, i) => {
    const n    = i + 1;
    const slot = findSlot(venue, child.classGroup, child.slotId);
    meta[`child${n}_name`]       = `${child.firstName} ${child.lastName}`.slice(0, 100);
    meta[`child${n}_class`]      = child.classGroup.slice(0, 100);
    meta[`child${n}_slot_id`]    = child.slotId;
    meta[`child${n}_slot_label`] = slot ? `${slot.day} ${slot.time}` : child.slotId;
    if (child.medicalNotes?.trim())
      meta[`child${n}_medical`] = child.medicalNotes.slice(0, 200);
    if (child.parentNotes?.trim())
      meta[`child${n}_notes`] = child.parentNotes.slice(0, 200);
  });

  if (!STRIPE_SECRET || STRIPE_SECRET.includes('REPLACE')) {
    return sendJson(res, 500, { errors: ['Stripe key not configured. Add it to server/.env'] });
  }

  try {
    const childNames  = children.map(c => c.firstName).join(', ');
    const description = `${venue} Tennis Academy · ${childNames} · ${tier === 'earlyBird' ? 'Early Bird' : 'Standard'} · ${MONTHS} months`;

    // Flatten metadata into Stripe's bracket notation
    const metaFlat = {};
    for (const [k, v] of Object.entries(meta)) {
      metaFlat[`metadata[${k}]`]                    = v;
      metaFlat[`subscription_data[metadata][${k}]`] = v;
    }

    const session = await stripeRequest('POST', 'checkout/sessions', {
      mode:            'subscription',
      customer_email:  parent.email,
      'line_items[0][price_data][currency]':                    'eur',
      'line_items[0][price_data][unit_amount]':                  String(monthlyTotal),
      'line_items[0][price_data][recurring][interval]':         'month',
      'line_items[0][price_data][product_data][name]':          `${venue} Tennis Academy — Monthly Fee`,
      'line_items[0][price_data][product_data][description]':   description,
      'line_items[0][quantity]':                                 '1',
      // Use successUrl/cancelUrl from the request body when provided (e.g. Duda widget).
      // This allows Stripe to redirect back to whatever page the widget is embedded on.
      // Falls back to the server's own FRONTEND_URL for the standalone app.
      success_url: body.successUrl || `${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  body.cancelUrl  || `${FRONTEND_URL}/cancel`,
      'payment_method_types[0]': 'card',
      ...metaFlat,
    });

    sendJson(res, 200, { url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    sendJson(res, 500, { errors: [err.message || 'Payment setup failed.'] });
  }
}

async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const raw = await readBody(req);

  // Signature verification
  if (WEBHOOK_SECRET && !WEBHOOK_SECRET.includes('REPLACE')) {
    try {
      verifyWebhookSignature(raw.toString(), sig || '', WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook sig failed:', err.message);
      res.writeHead(400); res.end(`Webhook Error: ${err.message}`); return;
    }
  } else {
    console.warn('⚠  STRIPE_WEBHOOK_SECRET not set — skipping signature check (dev only)');
  }

  let event;
  try { event = JSON.parse(raw.toString()); }
  catch { res.writeHead(400); res.end('Invalid JSON'); return; }

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object;
    const metadata = session.metadata || {};
    console.log(`✓ Checkout completed: ${session.id}`);
    console.log(`  Parent: ${metadata.parent_name} | Venue: ${metadata.venue} | Children: ${metadata.child_count}`);

    // Increment slot bookings
    try {
      const bookings = readBookings();
      const count    = parseInt(metadata.child_count || '0', 10);
      for (let i = 1; i <= count; i++) {
        const classGroup = metadata[`child${i}_class`];
        const slotId     = metadata[`child${i}_slot_id`];
        const v          = metadata.venue;
        if (!v || !classGroup || !slotId) continue;
        if (!bookings[v])              bookings[v]              = {};
        if (!bookings[v][classGroup])  bookings[v][classGroup]  = {};
        if (!bookings[v][classGroup][slotId]) bookings[v][classGroup][slotId] = 0;
        bookings[v][classGroup][slotId] += 1;
      }
      writeBookings(bookings);
      console.log('✓ Slot bookings updated');
    } catch (err) {
      console.error('⚠ Slot booking update failed:', err.message);
    }

    // Create 10-month subscription schedule
    if (session.subscription) {
      try {
        const sub = await stripeRequest('GET', `subscriptions/${session.subscription}`);

        const schedule = await stripeRequest('POST', 'subscription_schedules', {
          from_subscription: sub.id,
        });

        await stripeRequest('POST', `subscription_schedules/${schedule.id}`, {
          'phases[0][start_date]':         String(sub.current_period_start),
          'phases[0][iterations]':          String(MONTHS),
          'phases[0][items][0][price]':     sub.items.data[0].price.id,
          'phases[0][items][0][quantity]':  String(sub.items.data[0].quantity),
          end_behavior: 'cancel',
        });

        console.log(`✓ Subscription schedule: ${schedule.id} (${MONTHS} months)`);
      } catch (err) {
        console.error('⚠ Subscription schedule failed:', err.message);
        // TODO: Alert admin — subscription will not auto-cancel after 10 months
      }
    }

    // TODO: Send confirmation email
    // Add your email provider here (Resend, SendGrid, Nodemailer, etc.)
    // await sendConfirmationEmail({ to: metadata.parent_email, ... });
  }

  if (event.type === 'invoice.payment_failed') {
    console.warn(`⚠ Payment failed: ${event.data.object.subscription}`);
    // TODO: Notify parent of failed payment
  }

  if (event.type === 'customer.subscription.deleted') {
    console.log(`Subscription ended: ${event.data.object.id}`);
    // TODO: Send end-of-season email
  }

  sendJson(res, 200, { received: true });
}

// ── Static file serving ───────────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
};

function serveStatic(reqPath, res) {
  // For SPA — any non-file path serves index.html
  const ext  = path.extname(reqPath);
  const file = ext ? path.join(PUBLIC_DIR, reqPath) : path.join(PUBLIC_DIR, 'index.html');

  fs.readFile(file, (err, data) => {
    if (err) {
      // Fallback to index.html
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, html) => {
        if (err2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      });
      return;
    }
    const mime = MIME[path.extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

// ── Main server ───────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname  = parsedUrl.pathname;

  try {
    if (pathname === '/api/health') {
      return sendJson(res, 200, { status: 'ok' });

    } else if (pathname === '/api/availability' && req.method === 'GET') {
      return await handleAvailability(req, res);

    } else if (pathname === '/api/create-checkout-session' && req.method === 'POST') {
      return await handleCreateCheckout(req, res);

    } else if (pathname === '/api/webhook' && req.method === 'POST') {
      return await handleWebhook(req, res);

    } else if (req.method === 'GET') {
      return serveStatic(pathname, res);

    } else {
      sendJson(res, 404, { error: 'Not found' });
    }
  } catch (err) {
    console.error('Unhandled error:', err.message);
    if (!res.headersSent) sendJson(res, 500, { error: 'Internal server error' });
  }
});

server.listen(PORT, () => {
  const stripeOk  = STRIPE_SECRET && !STRIPE_SECRET.includes('REPLACE');
  const webhookOk = WEBHOOK_SECRET && !WEBHOOK_SECRET.includes('REPLACE');

  console.log('\n🎾  Tennis Academy is running!\n');
  console.log(`   → Open in browser: http://localhost:${PORT}`);
  console.log(`   Stripe key:    ${stripeOk  ? '✓ configured' : '⚠  NOT SET — add to server/.env'}`);
  console.log(`   Webhook secret:${webhookOk ? ' ✓ configured' : ' ⚠  NOT SET (optional for testing)'}`);
  if (!stripeOk) {
    console.log('\n   To configure Stripe:');
    console.log('   1. Copy .env.example to server/.env');
    console.log('   2. Add your Stripe TEST key from https://dashboard.stripe.com/test/apikeys');
  }
  console.log('\n   Press Ctrl+C to stop.\n');
});
