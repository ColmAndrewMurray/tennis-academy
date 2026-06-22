/**
 * GET  /api/admin/export?key=ADMIN_SECRET  — download bookings CSV
 * POST /api/admin/reset-bookings?key=ADMIN_SECRET — zero out all slot counts
 */

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { SCHEDULE } = require('../config/academyConfig');

const BOOKINGS_PATH = process.env.NODE_ENV === 'production'
  ? '/data/bookings.json'
  : path.join(__dirname, '../data/bookings.json');

function escapeCell(val) {
  return `"${String(val ?? '').replace(/"/g, '""')}"`;
}

router.get('/export', async (req, res) => {
  if (!process.env.ADMIN_SECRET || req.query.key !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  try {
    // Paginate through all completed Stripe checkout sessions
    const sessions = [];
    const params   = { limit: 100 };
    let   hasMore  = true;

    while (hasMore) {
      const page = await stripe.checkout.sessions.list(params);
      sessions.push(...page.data.filter(s => s.status === 'complete'));
      hasMore = page.has_more;
      if (page.has_more) params.starting_after = page.data[page.data.length - 1].id;
    }

    const headers = [
      'Date', 'Parent Name', 'Email', 'Phone', 'Venue', 'Pricing Tier',
      'No. Children', 'Monthly (€)', 'Season Total (€)',
      'Child 1 Name', 'Child 1 DOB', 'Child 1 Class', 'Child 1 Slot',
      'Child 2 Name', 'Child 2 DOB', 'Child 2 Class', 'Child 2 Slot',
      'Child 3 Name', 'Child 3 DOB', 'Child 3 Class', 'Child 3 Slot',
      'Medical Notes', 'Additional Notes', 'How Did You Hear About Us?',
      'School Collection', 'Collection School', 'Collection Time', 'Collection Teacher',
      'Stripe Session ID',
    ];

    const rows = sessions.map(s => {
      const m       = s.metadata || {};
      const date    = new Date(s.created * 1000).toLocaleDateString('en-IE');
      const monthly = (Number(m.monthly_total_cents || 0) / 100).toFixed(2);
      const total   = (Number(m.order_total_cents   || 0) / 100).toFixed(2);

      const medicalNotes     = [1, 2, 3].map(n => m[`child${n}_medical`]).filter(Boolean).join('; ');
      const additionalNotes  = [1, 2, 3].map(n => m[`child${n}_notes`]).filter(Boolean).join('; ');
      const howHeard         = [1, 2, 3].map(n => m[`child${n}_how_heard`]).filter(Boolean)[0] || '';

      return [
        date,
        m.parent_name  || '',
        m.parent_email || '',
        m.parent_phone || '',
        m.venue        || '',
        m.pricing_tier === 'earlyBird' ? 'Early Bird' : 'Standard',
        m.child_count  || '',
        monthly,
        total,
        m.child1_name || '', m.child1_dob || '', m.child1_class || '', m.child1_slot_label || '',
        m.child2_name || '', m.child2_dob || '', m.child2_class || '', m.child2_slot_label || '',
        m.child3_name || '', m.child3_dob || '', m.child3_class || '', m.child3_slot_label || '',
        medicalNotes, additionalNotes, howHeard,
        m.collection === 'yes' ? 'Yes' : m.collection === 'no' ? 'No' : '',
        m.collection_school   || '',
        m.collection_time     || '',
        m.collection_teacher  || '',
        s.id,
      ].map(escapeCell).join(',');
    });

    const csv = [headers.map(escapeCell).join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tennis-academy-bookings.csv"');
    res.send('﻿' + csv); // BOM for Excel compatibility
  } catch (err) {
    console.error('Admin export error:', err.message);
    res.status(500).json({ error: 'Export failed' });
  }
});

// POST /api/admin/reset-bookings?key=ADMIN_SECRET
router.post('/reset-bookings', (req, res) => {
  if (!process.env.ADMIN_SECRET || req.query.key !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  // Build a zeroed-out bookings structure from the current schedule
  const empty = {};
  for (const [venue, classes] of Object.entries(SCHEDULE)) {
    if (!classes) continue; // skip venues with null schedule (e.g. Curragha)
    empty[venue] = {};
    for (const [classGroup, slots] of Object.entries(classes)) {
      empty[venue][classGroup] = {};
      for (const slot of slots) {
        empty[venue][classGroup][slot.id] = 0;
      }
    }
  }

  try {
    fs.mkdirSync(path.dirname(BOOKINGS_PATH), { recursive: true });
    fs.writeFileSync(BOOKINGS_PATH, JSON.stringify(empty, null, 2), 'utf8');
    console.log('Bookings reset to zero by admin');
    res.json({ ok: true, message: 'All booking counts reset to zero', data: empty });
  } catch (err) {
    console.error('Reset bookings error:', err.message);
    res.status(500).json({ error: 'Failed to reset bookings' });
  }
});

module.exports = router;
