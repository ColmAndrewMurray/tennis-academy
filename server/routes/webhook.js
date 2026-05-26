/**
 * POST /api/webhook
 *
 * Stripe webhook handler.
 *
 * Handles:
 *  - checkout.session.completed
 *    → Increments slot booking counts in bookings.json
 *    → Converts the subscription to a 10-month Subscription Schedule
 *
 * To test locally, run in a separate terminal:
 *   stripe listen --forward-to localhost:3001/api/webhook
 *
 * IMPORTANT: This route must receive the RAW request body (not JSON-parsed)
 * for Stripe signature verification. See server/index.js for the bodyParser setup.
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const path = require('path');
const { MONTHS } = require('../config/academyConfig');

const BOOKINGS_PATH = path.join(__dirname, '../data/bookings.json');

function readBookings() {
  try {
    return JSON.parse(fs.readFileSync(BOOKINGS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeBookings(data) {
  fs.writeFileSync(BOOKINGS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// ── Increment slot bookings ───────────────────────────────────────────────

function incrementSlots(metadata) {
  const bookings = readBookings();
  const { venue, child_count } = metadata;
  const count = parseInt(child_count || '0', 10);

  for (let i = 1; i <= count; i++) {
    const classGroup = metadata[`child${i}_class`];
    const slotId     = metadata[`child${i}_slot_id`];

    if (!venue || !classGroup || !slotId) continue;

    if (!bookings[venue]) bookings[venue] = {};
    if (!bookings[venue][classGroup]) bookings[venue][classGroup] = {};
    if (!bookings[venue][classGroup][slotId]) bookings[venue][classGroup][slotId] = 0;

    bookings[venue][classGroup][slotId] += 1;
  }

  writeBookings(bookings);
}

// ── Create 10-month Subscription Schedule ────────────────────────────────

async function createSubscriptionSchedule(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Build a schedule from the existing subscription with exactly MONTHS iterations
    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: subscription.id,
    });

    // Update to exactly MONTHS billing cycles, then cancel automatically
    await stripe.subscriptionSchedules.update(schedule.id, {
      phases: [
        {
          start_date: subscription.current_period_start,
          iterations: MONTHS,
          items: subscription.items.data.map((item) => ({
            price:    item.price.id,
            quantity: item.quantity,
          })),
        },
      ],
      end_behavior: 'cancel', // Subscription cancels after 10 payments
    });

    console.log(`✓ Subscription schedule created: ${schedule.id} (${MONTHS} months)`);
    return schedule.id;

  } catch (err) {
    // Non-fatal: log the error but don't crash the webhook.
    // The subscription will continue indefinitely until manually cancelled.
    // TODO: Add alerting here (e.g. send admin email) so this is not missed.
    console.error('⚠ Failed to create subscription schedule:', err.message);
    return null;
  }
}

// ── Webhook route ─────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  // Verify the webhook came from Stripe (requires STRIPE_WEBHOOK_SECRET in .env)
  try {
    event = stripe.webhooks.constructEvent(
      req.body,                             // raw buffer — see server/index.js
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ── Handle events ──────────────────────────────────────────────────────

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};

    console.log(`✓ Checkout completed: ${session.id}`);
    console.log(`  Parent: ${metadata.parent_name} (${metadata.parent_email})`);
    console.log(`  Venue:  ${metadata.venue}`);
    console.log(`  Children: ${metadata.child_count}`);

    // 1. Increment slot bookings
    try {
      incrementSlots(metadata);
      console.log('✓ Slot bookings updated');
    } catch (err) {
      console.error('⚠ Failed to update slot bookings:', err.message);
      // TODO: Alert admin — slot counts may be inaccurate
    }

    // 2. Convert to 10-month subscription schedule
    if (session.subscription) {
      await createSubscriptionSchedule(session.subscription);
    }

    // ── TODO: Send confirmation emails ────────────────────────────────
    // Add your email provider here (e.g. Resend, SendGrid, Nodemailer).
    //
    // await sendParentConfirmationEmail({
    //   to:       metadata.parent_email,
    //   name:     metadata.parent_name,
    //   venue:    metadata.venue,
    //   children: buildChildrenFromMetadata(metadata),
    //   monthly:  Number(metadata.monthly_total_cents) / 100,
    //   months:   Number(metadata.months),
    // });
    //
    // await sendAcademyNotificationEmail({
    //   to:      process.env.ACADEMY_EMAIL,
    //   session: session,
    // });
    // ─────────────────────────────────────────────────────────────────
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    console.warn(`⚠ Payment failed for subscription: ${invoice.subscription}`);
    // TODO: Send payment failure email to parent
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    console.log(`Subscription ended: ${sub.id}`);
    // TODO: Send end-of-season confirmation email
  }

  res.json({ received: true });
});

module.exports = router;
