/**
 * GET /api/availability
 *
 * Returns current booking counts and remaining capacity for all slots.
 * Query param: ?venue=Clontarf
 *
 * Response shape:
 * {
 *   "Junior and Senior Infants": {
 *     "clontarf-jsi-mon": { booked: 3, capacity: 10, available: 7, full: false }
 *   },
 *   ...
 * }
 *
 * TODO (production): Replace file-based bookings.json with a real database.
 * A file store works fine for low volume but has no locking — concurrent
 * bookings at capacity could theoretically oversell a slot.
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { SCHEDULE, getSlotCapacity } = require('../config/academyConfig');

const BOOKINGS_PATH = process.env.NODE_ENV === 'production'
  ? '/data/bookings.json'
  : path.join(__dirname, '../data/bookings.json');

function readBookings() {
  try {
    return JSON.parse(fs.readFileSync(BOOKINGS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

router.get('/', (req, res) => {
  const { venue } = req.query;

  if (!venue) {
    return res.status(400).json({ error: 'venue query param required' });
  }

  const venueSchedule = SCHEDULE[venue];

  // Currenagh (and any unbuilt venue) — return null to signal TBC
  if (venueSchedule === null) {
    return res.json({ tbc: true });
  }

  if (!venueSchedule) {
    return res.status(404).json({ error: `Unknown venue: ${venue}` });
  }

  const bookings = readBookings();
  const result = {};

  for (const [classGroup, slots] of Object.entries(venueSchedule)) {
    result[classGroup] = {};
    for (const slot of slots) {
      const booked = (bookings[venue]?.[classGroup]?.[slot.id]) || 0;
      const capacity = getSlotCapacity(classGroup, slot);
      result[classGroup][slot.id] = {
        booked,
        capacity,
        available: Math.max(0, capacity - booked),
        full: booked >= capacity,
      };
    }
  }

  res.json(result);
});

module.exports = router;
