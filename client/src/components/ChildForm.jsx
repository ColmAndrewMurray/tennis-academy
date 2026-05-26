/**
 * ChildForm — collects one child's details including class group, slot selection,
 * and optional medical/parent notes. Shows live slot availability.
 */

import { SCHEDULE, CLASS_GROUPS, slotLabel } from '../config/academyConfig';

export default function ChildForm({
  index,          // 0-based
  child,
  venue,
  availability,   // { classGroup: { slotId: { booked, capacity, available, full } } }
  pricingTier,
  displayPrice,   // { total, monthly }
  onChange,
  onRemove,
  errors,
  canRemove,
}) {
  const childNumber = index + 1;
  const isFree      = childNumber === 3;
  const label       = childNumber === 1 ? '1st Child' : childNumber === 2 ? '2nd Child' : '3rd Child (Free)';

  const venueSlots = venue && SCHEDULE[venue] ? SCHEDULE[venue][child.classGroup] || [] : [];

  function handle(field) {
    return (e) => {
      const updated = { ...child, [field]: e.target.value };
      // Reset slot if class group changes
      if (field === 'classGroup') updated.slotId = '';
      onChange(updated);
    };
  }

  function selectSlot(slotId) {
    onChange({ ...child, slotId });
  }

  function availStatus(slotId) {
    const data = availability?.[child.classGroup]?.[slotId];
    if (!data) return null;
    return data;
  }

  return (
    <div className="child-card">
      <div className="child-card-header">
        <div className="child-card-title">
          🎾 {label}
          {isFree && <span className="free-badge">FREE</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isFree && displayPrice && (
            <div className="price-tag">
              <strong>€{displayPrice.monthly.toFixed(2)}/mo</strong>
              <span>€{displayPrice.total} total</span>
            </div>
          )}
          {canRemove && (
            <button
              type="button"
              className="remove-child-btn"
              onClick={onRemove}
              aria-label="Remove child"
              title="Remove child"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Name row */}
      <div className="form-row">
        <div className="form-group">
          <label>
            First Name <span className="required">*</span>
          </label>
          <input
            type="text"
            className={`form-control${errors.firstName ? ' has-error' : ''}`}
            value={child.firstName}
            onChange={handle('firstName')}
            placeholder="First name"
            autoComplete="given-name"
          />
          {errors.firstName && <p className="field-error">⚠ {errors.firstName}</p>}
        </div>

        <div className="form-group">
          <label>
            Surname <span className="required">*</span>
          </label>
          <input
            type="text"
            className={`form-control${errors.lastName ? ' has-error' : ''}`}
            value={child.lastName}
            onChange={handle('lastName')}
            placeholder="Surname"
            autoComplete="family-name"
          />
          {errors.lastName && <p className="field-error">⚠ {errors.lastName}</p>}
        </div>
      </div>

      {/* Class group */}
      <div className="form-group">
        <label>
          School Class Group <span className="required">*</span>
        </label>
        <select
          className={`form-control${errors.classGroup ? ' has-error' : ''}`}
          value={child.classGroup}
          onChange={handle('classGroup')}
          disabled={!venue || venue === 'Currenagh'}
        >
          <option value="">— Select class group —</option>
          {CLASS_GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        {errors.classGroup && <p className="field-error">⚠ {errors.classGroup}</p>}
      </div>

      {/* Slot picker */}
      {child.classGroup && venueSlots.length > 0 && (
        <div className="form-group">
          <label>
            Day &amp; Time Slot <span className="required">*</span>
          </label>
          <div className="slot-grid">
            {venueSlots.map((slot) => {
              const avail = availStatus(slot.id);
              const isFull = avail?.full ?? false;
              const availCount = avail?.available ?? null;
              const isLow = !isFull && availCount !== null && availCount <= 3;

              return (
                <div className="slot-option" key={slot.id}>
                  <input
                    type="radio"
                    id={`slot-${index}-${slot.id}`}
                    name={`slot-${index}`}
                    value={slot.id}
                    checked={child.slotId === slot.id}
                    onChange={() => !isFull && selectSlot(slot.id)}
                    disabled={isFull}
                  />
                  <label
                    htmlFor={`slot-${index}-${slot.id}`}
                    className={`slot-label${isFull ? ' is-full' : ''}`}
                  >
                    <span className="slot-day">{slot.day}</span>
                    <span className="slot-time">{slot.time}</span>
                    {avail && (
                      <span className={`slot-avail ${isFull ? 'avail-full' : isLow ? 'avail-low' : 'avail-ok'}`}>
                        {isFull
                          ? 'Fully booked'
                          : isLow
                          ? `${availCount} place${availCount === 1 ? '' : 's'} left`
                          : `${availCount} available`}
                      </span>
                    )}
                  </label>
                </div>
              );
            })}
          </div>

          {/* Fully booked message */}
          {child.slotId === '' && errors.slotId && (
            <p className="field-error">⚠ {errors.slotId}</p>
          )}
        </div>
      )}

      {/* Fully booked slot selected warning */}
      {child.slotId && (() => {
        const avail = availStatus(child.slotId);
        return avail?.full ? (
          <div className="alert alert-error" style={{ marginTop: 4, marginBottom: 12 }}>
            <span>⛔</span>
            <span>
              This slot is <strong>fully booked</strong>. Please select a different slot or{' '}
              <a href="mailto:info@tennisacademy.ie">get in touch</a> to see if we can accommodate you.
            </span>
          </div>
        ) : null;
      })()}

      {/* Medical notes */}
      <div className="form-group">
        <label>Medical / Health Notes <em style={{ fontWeight: 400 }}>(optional)</em></label>
        <textarea
          className="form-control"
          value={child.medicalNotes}
          onChange={handle('medicalNotes')}
          placeholder="Any medical conditions, allergies, or health information we should know about…"
          rows={2}
        />
      </div>

      {/* Parent notes */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Additional Notes <em style={{ fontWeight: 400 }}>(optional)</em></label>
        <textarea
          className="form-control"
          value={child.parentNotes}
          onChange={handle('parentNotes')}
          placeholder="Anything else you'd like us to know…"
          rows={2}
        />
      </div>
    </div>
  );
}
