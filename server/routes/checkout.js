/**
 * POST /api/create-checkout-session
 *
 * Body:
 * {
 *   parent: { name, email, phone },
 *   venue: string,
 *   children: [
 *     { firstName, lastName, classGroup, slotId, medicalNotes?, parentNotes? },
 *     ...
 *   ]
 * }
 *
 * Returns: { url: 'https://checkout.stripe.com/...' }
 *
 * IMPORTANT: All pricing is calculated HERE on the server.
 * The frontend may display estimates but this is the source of truth.
 * Never trust amounts sent from the browser.
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const path = require('path');
const {
  SCHEDULE,
  calculateOrder,
  findSlot,
  getSlotCapacity,
} = require('../config/academyConfig');

const BOOKINGS_PATH = process.env.NODE_ENV === 'production'
  ? '/data/bookings.json'
  : path.join(__dirname, '../data/bookings.json');

function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' || hostname === 'localhost';
  } catch {
    return false;
  }
}

function readBookings() {
  try {
    return JSON.parse(fs.readFileSync(BOOKINGS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

// ── Validation ────────────────────────────────────────────────────────────

function validateBody(body) {
  const errors = [];

  if (!body.parent?.name?.trim())  errors.push('Parent name is required.');
  if (!body.parent?.email?.trim()) errors.push('Parent email is required.');
  if (!body.parent?.phone?.trim()) errors.push('Parent phone is required.');

  if (!body.venue) errors.push('Venue is required.');

  if (!Array.isArray(body.children) || body.children.length === 0) {
    errors.push('At least one child is required.');
  } else if (body.children.length > 3) {
    errors.push('Maximum 3 children per booking.');
  } else {
    body.children.forEach((child, i) => {
      const n = i + 1;
      if (!child.firstName?.trim())  errors.push(`Child ${n}: first name required.`);
      if (!child.lastName?.trim())   errors.push(`Child ${n}: last name required.`);
      if (!child.classGroup?.trim()) errors.push(`Child ${n}: class group required.`);
      if (!child.slotId?.trim())     errors.push(`Child ${n}: time slot required.`);
    });
  }

  return errors;
}

// ── Capacity check ────────────────────────────────────────────────────────

function checkCapacity(venue, children) {
  const bookings = readBookings();
  const venueSchedule = SCHEDULE[venue];

  for (const child of children) {
    const { classGroup, slotId } = child;
    const slot = findSlot(venue, classGroup, slotId);
    if (!slot) {
      return `Slot not found for ${child.firstName} (${classGroup} / ${slotId}).`;
    }
    const capacity = getSlotCapacity(classGroup, slot);
    const booked = bookings[venue]?.[classGroup]?.[slotId] || 0;
    if (booked >= capacity) {
      return `The ${slot.day} ${slot.time} slot for ${classGroup} is fully booked. Please get in touch to see if we can accommodate you.`;
    }
  }

  return null; // All slots available
}

// ── Route ─────────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    // 1. Validate input
    const errors = validateBody(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const { parent, venue, children, successUrl, cancelUrl } = req.body;

    // 2. Check venue exists
    if (!SCHEDULE.hasOwnProperty(venue)) {
      return res.status(400).json({ errors: [`Unknown venue: ${venue}`] });
    }
    if (SCHEDULE[venue] === null) {
      return res.status(400).json({ errors: ['Currenagh schedule is not yet available.'] });
    }

    // 3. Check slot capacity
    const capacityError = checkCapacity(venue, children);
    if (capacityError) {
      return res.status(409).json({ errors: [capacityError] });
    }

    // 4. Calculate pricing on the server (source of truth)
    const order = calculateOrder(children);
    const { tier, monthlyTotal, orderTotal, months } = order;

    if (monthlyTotal === 0) {
      return res.status(400).json({ errors: ['Order total is zero — please check your booking.'] });
    }

    // 5. Build Stripe metadata (max 500 chars per value, 50 keys)
    const metadata = {
      venue,
      parent_name:  parent.name.substring(0, 200),
      parent_email: parent.email.substring(0, 200),
      parent_phone: parent.phone.substring(0, 50),
      pricing_tier: tier,
      child_count:  String(children.length),
      order_total_cents:   String(orderTotal),
      monthly_total_cents: String(monthlyTotal),
      months: String(months),
    };

    children.forEach((child, i) => {
      const n = i + 1;
      const slot = findSlot(venue, child.classGroup, child.slotId);
      metadata[`child${n}_name`]       = `${child.firstName} ${child.lastName}`.substring(0, 100);
      metadata[`child${n}_class`]      = child.classGroup.substring(0, 100);
      metadata[`child${n}_slot_id`]    = child.slotId;
      metadata[`child${n}_slot_label`] = slot ? `${slot.day} ${slot.time}` : child.slotId;
      if (child.medicalNotes?.trim()) {
        metadata[`child${n}_medical`] = child.medicalNotes.substring(0, 200);
      }
      if (child.parentNotes?.trim()) {
        metadata[`child${n}_notes`] = child.parentNotes.substring(0, 200);
      }
    });

    // 6. Build description for Stripe
    const childNames = children.map((c) => c.firstName).join(', ');
    const productDescription =
      `${venue} Tennis Academy · ${childNames} · ` +
      `${tier === 'earlyBird' ? 'Early Bird' : 'Standard'} · ${months} months`;

    // 7. Create Stripe Checkout session (subscription mode)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: parent.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: monthlyTotal,   // monthly charge in cents
            recurring: { interval: 'month' },
            product_data: {
              name: `${venue} Tennis Academy — Monthly Fee`,
              description: productDescription,
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata,
        // NOTE: The subscription is converted to a 10-month schedule via
        // the Stripe webhook after payment succeeds (see routes/webhook.js).
      },
      metadata,
      // Prefer URLs sent by the client (supports Duda embeds where the page
      // URL isn't known at deploy time). Fall back to FRONTEND_URL env var.
      success_url: isSafeUrl(successUrl)
        ? successUrl
        : `${process.env.FRONTEND_URL}?ta_success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: isSafeUrl(cancelUrl)
        ? cancelUrl
        : `${process.env.FRONTEND_URL}?ta_cancelled=1`,
      payment_method_types: ['card'],
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error('Checkout session error:', err.message);
    res.status(500).json({ errors: ['Payment setup failed. Please try again.'] });
  }
});

module.exports = router;
