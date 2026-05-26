/**
 * GET /api/admin/export?key=ADMIN_SECRET
 *
 * Downloads all completed bookings as a CSV file.
 * Data is pulled live from Stripe checkout session metadata.
 */

const express = require('express');
const router  = express.Router();
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
      'Child 1 Name', 'Child 1 Class', 'Child 1 Slot',
      'Child 2 Name', 'Child 2 Class', 'Child 2 Slot',
      'Child 3 Name', 'Child 3 Class', 'Child 3 Slot',
      'Medical Notes', 'Stripe Session ID',
    ];

    const rows = sessions.map(s => {
      const m       = s.metadata || {};
      const date    = new Date(s.created * 1000).toLocaleDateString('en-IE');
      const monthly = (Number(m.monthly_total_cents || 0) / 100).toFixed(2);
      const total   = (Number(m.order_total_cents   || 0) / 100).toFixed(2);

      const medicalNotes = [1, 2, 3]
        .map(n => m[`child${n}_medical`])
        .filter(Boolean)
        .join('; ');

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
        m.child1_name || '', m.child1_class || '', m.child1_slot_label || '',
        m.child2_name || '', m.child2_class || '', m.child2_slot_label || '',
        m.child3_name || '', m.child3_class || '', m.child3_slot_label || '',
        medicalNotes,
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

module.exports = router;
