/**
 * academyConfig.js — SERVER SOURCE OF TRUTH
 *
 * Edit this file to change:
 *  - Venues and class groups
 *  - Slot times and days
 *  - Slot capacities
 *  - Pricing (early bird and standard)
 *  - Early bird cut-off date
 *  - Number of monthly payments
 */

// ─── Season ────────────────────────────────────────────────────────────────
const MONTHS = 10; // Academy runs September → June

// ─── Early Bird Cut-off ────────────────────────────────────────────────────
// Pricing is EARLY BIRD up to and including this date; STANDARD after.
// Update this date each year before the new season opens.
const EARLY_BIRD_CUTOFF = new Date('2026-08-01T23:59:59');

// ─── Pricing (in euro CENTS for Stripe) ───────────────────────────────────
// Total season fee per child — divide by MONTHS for the monthly amount.
const PRICING = {
  earlyBird: {
    child1: 61500, // €615.00 total
    child2: 60000, // €600.00 total
    child3: 0,     // FREE
  },
  standard: {
    child1: 64000, // €640.00 total
    child2: 61500, // €615.00 total
    child3: 0,     // FREE
  },
};

// ─── Default Slot Capacities ───────────────────────────────────────────────
const DEFAULT_CAPACITY = {
  'Junior and Senior Infants': 10,
  default: 12,
};

// ─── Schedule ──────────────────────────────────────────────────────────────
// Each slot: { id, day, time, capacity? (overrides default) }
// If capacity is omitted, DEFAULT_CAPACITY is used.
const SCHEDULE = {
  Clontarf: {
    'Junior and Senior Infants': [
      { id: 'clontarf-jsi-mon', day: 'Monday',    time: '1:30 PM – 2:15 PM' },
      { id: 'clontarf-jsi-tue', day: 'Tuesday',   time: '1:30 PM – 2:15 PM' },
      { id: 'clontarf-jsi-wed', day: 'Wednesday', time: '1:30 PM – 2:15 PM' },
      { id: 'clontarf-jsi-fri', day: 'Friday',    time: '1:40 PM – 2:25 PM' },
    ],
    'First and Second Class': [
      { id: 'clontarf-12-mon', day: 'Monday',    time: '2:30 PM – 3:15 PM' },
      { id: 'clontarf-12-tue', day: 'Tuesday',   time: '2:30 PM – 3:15 PM' },
      { id: 'clontarf-12-wed', day: 'Wednesday', time: '2:30 PM – 3:15 PM' },
      { id: 'clontarf-12-fri', day: 'Friday',    time: '2:30 PM – 3:15 PM' },
    ],
    'Third and Fourth Class': [
      // TODO: Original Monday slot may have been 2:15 PM – 4:15 PM.
      // Built as 3:15 PM – 4:15 PM for consistency with other days.
      // Verify with academy before going live and update the id/time here.
      { id: 'clontarf-34-mon', day: 'Monday',    time: '3:15 PM – 4:15 PM' },
      { id: 'clontarf-34-tue', day: 'Tuesday',   time: '3:15 PM – 4:15 PM' },
      { id: 'clontarf-34-wed', day: 'Wednesday', time: '3:15 PM – 4:15 PM' },
      { id: 'clontarf-34-fri', day: 'Friday',    time: '3:15 PM – 4:15 PM' },
    ],
    'Fifth and Sixth Class': [
      { id: 'clontarf-56-mon', day: 'Monday',    time: '4:15 PM – 5:15 PM' },
      { id: 'clontarf-56-tue', day: 'Tuesday',   time: '4:15 PM – 5:15 PM', capacity: 6 }, // Reduced capacity
      { id: 'clontarf-56-wed', day: 'Wednesday', time: '4:15 PM – 5:15 PM' },
      { id: 'clontarf-56-fri', day: 'Friday',    time: '4:15 PM – 5:15 PM' },
    ],
  },
  Currenagh: null, // Schedule to be confirmed — shows message to user
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Returns 'earlyBird' or 'standard' based on today's date.
 */
function getPricingTier(now = new Date()) {
  return now <= EARLY_BIRD_CUTOFF ? 'earlyBird' : 'standard';
}

/**
 * Returns the per-child season total in cents for a given child position (1-indexed).
 */
function getChildSeasonTotal(childIndex, tier) {
  const key = `child${Math.min(childIndex, 3)}`;
  return PRICING[tier][key];
}

/**
 * Returns the monthly payment amount in cents for a given child position.
 * Monthly = season total / MONTHS (always a whole number of cents).
 */
function getMonthlyAmount(childIndex, tier) {
  return Math.round(getChildSeasonTotal(childIndex, tier) / MONTHS);
}

/**
 * Returns the capacity for a given slot.
 */
function getSlotCapacity(classGroup, slot) {
  if (slot.capacity !== undefined) return slot.capacity;
  if (DEFAULT_CAPACITY[classGroup] !== undefined) return DEFAULT_CAPACITY[classGroup];
  return DEFAULT_CAPACITY.default;
}

/**
 * Returns a slot by ID from a given venue's schedule.
 */
function findSlot(venue, classGroup, slotId) {
  const venueSchedule = SCHEDULE[venue];
  if (!venueSchedule) return null;
  const slots = venueSchedule[classGroup];
  if (!slots) return null;
  return slots.find((s) => s.id === slotId) || null;
}

/**
 * Calculates the full order pricing for an array of children.
 * Returns { tier, children: [{...child, seasonTotal, monthlyAmount}], orderTotal, monthlyTotal }
 * All amounts in cents.
 */
function calculateOrder(children, now = new Date()) {
  const tier = getPricingTier(now);
  const priced = children.map((child, i) => {
    const seasonTotal = getChildSeasonTotal(i + 1, tier);
    const monthlyAmount = getMonthlyAmount(i + 1, tier);
    return { ...child, seasonTotal, monthlyAmount };
  });
  const orderTotal = priced.reduce((sum, c) => sum + c.seasonTotal, 0);
  const monthlyTotal = priced.reduce((sum, c) => sum + c.monthlyAmount, 0);
  return { tier, children: priced, orderTotal, monthlyTotal, months: MONTHS };
}

module.exports = {
  MONTHS,
  EARLY_BIRD_CUTOFF,
  PRICING,
  DEFAULT_CAPACITY,
  SCHEDULE,
  getPricingTier,
  getChildSeasonTotal,
  getMonthlyAmount,
  getSlotCapacity,
  findSlot,
  calculateOrder,
};
