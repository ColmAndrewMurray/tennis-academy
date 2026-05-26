/**
 * OrderSummary — displays the full booking summary before payment.
 * Shown below the form once all required fields are complete.
 */

import { SCHEDULE, getChildDisplayPrice, MONTHS } from '../config/academyConfig';

function getSlotLabel(venue, classGroup, slotId) {
  if (!venue || !classGroup || !slotId) return '—';
  const slots = SCHEDULE[venue]?.[classGroup];
  if (!slots) return slotId;
  const slot = slots.find((s) => s.id === slotId);
  return slot ? `${slot.day}  ${slot.time}` : slotId;
}

export default function OrderSummary({ parent, venue, children, pricingTier }) {
  if (!children.length) return null;

  const isEarlyBird = pricingTier === 'earlyBird';
  let totalEur = 0;
  let monthlyTotalEur = 0;

  return (
    <div className="summary-card">
      <h2>📋 Order Summary</h2>

      {/* Parent details */}
      <div className="summary-section">
        <div className="summary-label">Parent / Guardian</div>
        <div className="summary-value">{parent.name || '—'}</div>
        <div className="summary-value" style={{ fontSize: '0.82rem', opacity: 0.7 }}>
          {parent.email} {parent.phone ? `· ${parent.phone}` : ''}
        </div>
      </div>

      <div className="summary-section">
        <div className="summary-label">Venue</div>
        <div className="summary-value">{venue || '—'}</div>
      </div>

      <div className="summary-section">
        <div className="summary-label">Pricing</div>
        <div className="summary-value">
          <span
            style={{
              background: isEarlyBird ? '#c9963a' : 'rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 20,
            }}
          >
            {isEarlyBird ? '🌟 Early Bird' : 'Standard'}
          </span>
          {isEarlyBird && (
            <span style={{ fontSize: '0.78rem', opacity: 0.6, marginLeft: 8 }}>
              Valid until 1 Aug
            </span>
          )}
        </div>
      </div>

      <hr className="summary-divider" />

      {/* Children */}
      {children.map((child, i) => {
        const childNum = i + 1;
        const isFree   = childNum === 3;
        const price    = getChildDisplayPrice(childNum, pricingTier);
        const slotLbl  = getSlotLabel(venue, child.classGroup, child.slotId);

        if (!isFree) {
          totalEur += price.total;
          monthlyTotalEur += price.monthly;
        }

        return (
          <div className="summary-child" key={i}>
            <div className="summary-child-header">
              <span className="summary-child-name">
                {child.firstName || '—'} {child.lastName || ''}
              </span>
              <span className="summary-child-price">
                {isFree ? (
                  <span style={{ color: '#86efac' }}>FREE</span>
                ) : (
                  <>€{price.monthly.toFixed(2)}/mo</>
                )}
              </span>
            </div>
            <div className="summary-child-detail">
              {child.classGroup || '—'} · {slotLbl}
            </div>
            {!isFree && (
              <div className="summary-child-detail" style={{ marginTop: 2 }}>
                €{price.total} season total
              </div>
            )}
          </div>
        );
      })}

      <hr className="summary-divider" />

      {/* Totals */}
      <div className="summary-total-row">
        <div>
          <div className="summary-total-label">Monthly payment</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {MONTHS} payments · Sep – Jun
          </div>
        </div>
        <div>
          <div className="summary-total-amount">€{monthlyTotalEur.toFixed(2)}</div>
          <div className="summary-monthly-note">
            Season total: €{totalEur.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
