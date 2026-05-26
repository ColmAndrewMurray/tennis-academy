/**
 * academyConfig.js — CLIENT DISPLAY CONFIG
 *
 * This is a READ-ONLY copy for the frontend to drive dropdowns and display.
 * Pricing and capacity are recalculated on the SERVER — do not trust this
 * file for financial calculations.
 *
 * To edit venues, slots, and times: update BOTH this file AND
 * server/config/academyConfig.js
 */

export const MONTHS = 10;

// Early bird cut-off for display purposes only
export const EARLY_BIRD_CUTOFF_DATE = new Date('2026-08-01T23:59:59');

export const PRICING_DISPLAY = {
  earlyBird: {
    child1: { total: 615, monthly: 61.50 },
    child2: { total: 600, monthly: 60.00 },
    child3: { total: 0,   monthly: 0 },
  },
  standard: {
    child1: { total: 640, monthly: 64.00 },
    child2: { total: 615, monthly: 61.50 },
    child3: { total: 0,   monthly: 0 },
  },
};

export const VENUES = ['Clontarf', 'Currenagh'];

export const CLASS_GROUPS = [
  'Junior and Senior Infants',
  'First and Second Class',
  'Third and Fourth Class',
  'Fifth and Sixth Class',
];

export const SCHEDULE = {
  Clontarf: {
    'Junior and Senior Infants': [
      { id: 'clontarf-jsi-mon', day: 'Monday',    time: '1:30 PM – 2:15 PM', capacity: 10 },
      { id: 'clontarf-jsi-tue', day: 'Tuesday',   time: '1:30 PM – 2:15 PM', capacity: 10 },
      { id: 'clontarf-jsi-wed', day: 'Wednesday', time: '1:30 PM – 2:15 PM', capacity: 10 },
      { id: 'clontarf-jsi-fri', day: 'Friday',    time: '1:40 PM – 2:25 PM', capacity: 10 },
    ],
    'First and Second Class': [
      { id: 'clontarf-12-mon', day: 'Monday',    time: '2:30 PM – 3:15 PM', capacity: 12 },
      { id: 'clontarf-12-tue', day: 'Tuesday',   time: '2:30 PM – 3:15 PM', capacity: 12 },
      { id: 'clontarf-12-wed', day: 'Wednesday', time: '2:30 PM – 3:15 PM', capacity: 12 },
      { id: 'clontarf-12-fri', day: 'Friday',    time: '2:30 PM – 3:15 PM', capacity: 12 },
    ],
    'Third and Fourth Class': [
      // TODO: Verify Monday slot time — originally listed as 2:15 PM – 4:15 PM.
      // Built as 3:15 PM – 4:15 PM for consistency. Confirm with academy.
      { id: 'clontarf-34-mon', day: 'Monday',    time: '3:15 PM – 4:15 PM', capacity: 12 },
      { id: 'clontarf-34-tue', day: 'Tuesday',   time: '3:15 PM – 4:15 PM', capacity: 12 },
      { id: 'clontarf-34-wed', day: 'Wednesday', time: '3:15 PM – 4:15 PM', capacity: 12 },
      { id: 'clontarf-34-fri', day: 'Friday',    time: '3:15 PM – 4:15 PM', capacity: 12 },
    ],
    'Fifth and Sixth Class': [
      { id: 'clontarf-56-mon', day: 'Monday',    time: '4:15 PM – 5:15 PM', capacity: 12 },
      { id: 'clontarf-56-tue', day: 'Tuesday',   time: '4:15 PM – 5:15 PM', capacity: 6  }, // Reduced
      { id: 'clontarf-56-wed', day: 'Wednesday', time: '4:15 PM – 5:15 PM', capacity: 12 },
      { id: 'clontarf-56-fri', day: 'Friday',    time: '4:15 PM – 5:15 PM', capacity: 12 },
    ],
  },
  Currenagh: null,
};

/**
 * Returns 'earlyBird' or 'standard' based on today's date.
 */
export function getPricingTier(now = new Date()) {
  return now <= EARLY_BIRD_CUTOFF_DATE ? 'earlyBird' : 'standard';
}

/**
 * Calculates a display-only order total (in euros) for the frontend summary.
 * The backend recalculates this authoritatively before charging.
 */
export function calculateDisplayOrder(childCount) {
  const tier = getPricingTier();
  let totalEur = 0;
  let monthlyEur = 0;

  for (let i = 1; i <= childCount; i++) {
    const key = `child${Math.min(i, 3)}`;
    totalEur += PRICING_DISPLAY[tier][key].total;
    monthlyEur += PRICING_DISPLAY[tier][key].monthly;
  }

  return {
    tier,
    totalEur,
    monthlyEur: Math.round(monthlyEur * 100) / 100,
    months: MONTHS,
  };
}

/**
 * Returns the display price for a single child by position (1-indexed).
 */
export function getChildDisplayPrice(index, tier) {
  const key = `child${Math.min(index, 3)}`;
  return PRICING_DISPLAY[tier][key];
}

/**
 * Returns a formatted label for a slot.
 */
export function slotLabel(slot) {
  return `${slot.day}  ${slot.time}`;
}
