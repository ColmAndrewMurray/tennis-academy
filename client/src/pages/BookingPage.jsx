/**
 * BookingPage — the main booking form.
 *
 * Flow:
 *  1. Parent details
 *  2. Venue selection
 *  3. Child details (up to 3) — each with class group + slot
 *  4. Order summary
 *  5. → Stripe Checkout
 */

import { useState, useEffect, useCallback } from 'react';
import ParentForm from '../components/ParentForm';
import ChildForm  from '../components/ChildForm';
import OrderSummary from '../components/OrderSummary';
import {
  VENUES,
  SCHEDULE,
  getPricingTier,
  getChildDisplayPrice,
  EARLY_BIRD_CUTOFF_DATE,
  MONTHS,
} from '../config/academyConfig';

// ── Helpers ────────────────────────────────────────────────────────────────

function emptyChild() {
  return { firstName: '', lastName: '', classGroup: '', slotId: '', medicalNotes: '', parentNotes: '' };
}

function emptyParent() {
  return { name: '', email: '', phone: '' };
}

// ── Component ──────────────────────────────────────────────────────────────

export default function BookingPage() {
  const [parent,       setParent]       = useState(emptyParent());
  const [venue,        setVenue]        = useState('');
  const [children,     setChildren]     = useState([emptyChild()]);
  const [availability, setAvailability] = useState({});
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [apiErrors,    setApiErrors]    = useState([]);
  const [fieldErrors,  setFieldErrors]  = useState({});

  const pricingTier = getPricingTier();
  const isEarlyBird = pricingTier === 'earlyBird';

  // ── Fetch availability when venue changes ────────────────────────────────
  const fetchAvailability = useCallback(async (v) => {
    if (!v || !SCHEDULE[v]) {
      setAvailability({});
      return;
    }
    if (SCHEDULE[v] === null) {
      setAvailability({ tbc: true });
      return;
    }
    setLoadingAvail(true);
    try {
      const res  = await fetch(`/api/availability?venue=${encodeURIComponent(v)}`);
      const data = await res.json();
      setAvailability(data);
    } catch {
      setAvailability({});
    } finally {
      setLoadingAvail(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability(venue);
  }, [venue, fetchAvailability]);

  // ── Venue change: reset all children's class/slot ────────────────────────
  function handleVenueChange(e) {
    const v = e.target.value;
    setVenue(v);
    setChildren((prev) => prev.map((c) => ({ ...c, classGroup: '', slotId: '' })));
    setApiErrors([]);
  }

  // ── Child helpers ─────────────────────────────────────────────────────────
  function updateChild(i, updated) {
    setChildren((prev) => prev.map((c, idx) => (idx === i ? updated : c)));
  }

  function addChild() {
    if (children.length < 3) setChildren((prev) => [...prev, emptyChild()]);
  }

  function removeChild(i) {
    setChildren((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate() {
    const errs  = {};
    const pErrs = {};

    if (!parent.name.trim())  pErrs.name  = 'Name is required';
    if (!parent.email.trim()) pErrs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(parent.email)) pErrs.email = 'Enter a valid email';
    if (!parent.phone.trim()) pErrs.phone = 'Phone number is required';
    if (Object.keys(pErrs).length) errs.parent = pErrs;

    if (!venue) errs.venue = 'Please select a venue';

    const childErrs = children.map((c) => {
      const ce = {};
      if (!c.firstName.trim()) ce.firstName = 'Required';
      if (!c.lastName.trim())  ce.lastName  = 'Required';
      if (!c.classGroup)       ce.classGroup = 'Required';
      if (!c.slotId)           ce.slotId     = 'Please select a time slot';
      return ce;
    });

    if (childErrs.some((ce) => Object.keys(ce).length > 0)) {
      errs.children = childErrs;
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setApiErrors([]);

    if (!validate()) {
      // Scroll to first error
      document.querySelector('.has-error, .field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);

    try {
      const res  = await fetch('/api/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ parent, venue, children }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiErrors(data.errors || ['Something went wrong. Please try again.']);
        setSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (err) {
      setApiErrors(['Network error — please check your connection and try again.']);
      setSubmitting(false);
    }
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const isCurrenagh   = venue === 'Currenagh';
  const showChildren  = venue && !isCurrenagh;
  const formComplete  = (
    parent.name.trim() &&
    parent.email.trim() &&
    parent.phone.trim() &&
    venue &&
    !isCurrenagh &&
    children.every((c) => c.firstName && c.lastName && c.classGroup && c.slotId)
  );

  // Check if any selected slot is full
  const hasFullSlot = children.some((c) => {
    return c.slotId && availability[c.classGroup]?.[c.slotId]?.full;
  });

  const canSubmit = formComplete && !hasFullSlot && !submitting;

  // Format cut-off date
  const cutoffStr = EARLY_BIRD_CUTOFF_DATE.toLocaleDateString('en-IE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className="site-header">
        <div className="container">
          <div className="logo-row">
            <span className="logo-icon">🎾</span>
            <div>
              <h1>Tennis Academy</h1>
              <p className="tagline">Season Registration — September to June</p>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="container">

          {/* Pricing tier banner */}
          <div className="pricing-banner">
            <span className={`badge${isEarlyBird ? '' : ' standard'}`}>
              {isEarlyBird ? '🌟 Early Bird Pricing' : 'Standard Pricing'}
            </span>
            <p>
              {isEarlyBird
                ? <>Early bird rates apply until <strong>{cutoffStr}</strong>. Book now to save!</>
                : <>Standard rates apply after {cutoffStr}.</>
              }
              {' '}The full season is <strong>€{isEarlyBird ? '615' : '640'}</strong> for the first child,
              paid over <strong>10 monthly payments</strong>.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* API error banner */}
            {apiErrors.length > 0 && (
              <div className="alert alert-error">
                <span>⛔</span>
                <div>
                  {apiErrors.map((e, i) => <p key={i} style={{ margin: 0 }}>{e}</p>)}
                </div>
              </div>
            )}

            {/* Step 1 — Parent details */}
            <ParentForm
              parent={parent}
              onChange={setParent}
              errors={fieldErrors.parent || {}}
            />

            {/* Step 2 — Venue */}
            <div className="card">
              <div className="card-title">
                <span className="step-badge">2</span>
                Select Venue
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="venue">
                  Venue <span className="required">*</span>
                </label>
                <select
                  id="venue"
                  className={`form-control${fieldErrors.venue ? ' has-error' : ''}`}
                  value={venue}
                  onChange={handleVenueChange}
                >
                  <option value="">— Select a venue —</option>
                  {VENUES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                {fieldErrors.venue && <p className="field-error">⚠ {fieldErrors.venue}</p>}
              </div>

              {/* Currenagh TBC notice */}
              {isCurrenagh && (
                <div className="venue-tbc" style={{ marginTop: 16 }}>
                  <h3>Schedule Coming Soon</h3>
                  <p>The Currenagh schedule is yet to be confirmed.<br />
                    Please check back soon or <a href="mailto:info@tennisacademy.ie">get in touch</a> to register your interest.
                  </p>
                </div>
              )}

              {loadingAvail && (
                <p style={{ marginTop: 12, color: 'var(--grey-400)', fontSize: '0.875rem' }}>
                  Checking availability…
                </p>
              )}
            </div>

            {/* Step 3 — Children */}
            {showChildren && (
              <div className="card">
                <div className="card-title">
                  <span className="step-badge">3</span>
                  Children
                  {children.length < 3 && (
                    <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--grey-400)', marginLeft: 6 }}>
                      (up to 3 — 3rd child is free)
                    </span>
                  )}
                </div>

                {children.map((child, i) => {
                  const childNum = i + 1;
                  const isFree   = childNum === 3;
                  const dp       = isFree ? { total: 0, monthly: 0 } : getChildDisplayPrice(childNum, pricingTier);

                  return (
                    <ChildForm
                      key={i}
                      index={i}
                      child={child}
                      venue={venue}
                      availability={availability}
                      pricingTier={pricingTier}
                      displayPrice={dp}
                      onChange={(updated) => updateChild(i, updated)}
                      onRemove={() => removeChild(i)}
                      errors={(fieldErrors.children?.[i]) || {}}
                      canRemove={children.length > 1}
                    />
                  );
                })}

                {/* Pay Now — visible as soon as parent + venue filled; disabled until children complete */}
                {(parent.name.trim() && parent.email.trim() && parent.phone.trim() && venue && !isCurrenagh) && (
                  <div style={{ marginBottom: 10 }}>
                    <button type="submit" className="btn btn-primary btn-full" disabled={!canSubmit}>
                      {submitting
                        ? <><span className="spinner" />Redirecting to payment…</>
                        : <>Pay Now →</>
                      }
                    </button>
                  </div>
                )}

                {children.length < 3 && (
                  <div className="add-child-row">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={addChild}
                    >
                      + Add Another Child
                      {children.length === 2 && (
                        <span style={{ fontSize: '0.78rem', marginLeft: 4, opacity: 0.7 }}>
                          (3rd child is free!)
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 4 — Summary + Pay */}
            {formComplete && !hasFullSlot && (
              <>
                <OrderSummary
                  parent={parent}
                  venue={venue}
                  children={children}
                  pricingTier={pricingTier}
                />

                <div style={{ marginBottom: 12 }}>
                  <div className="alert alert-info">
                    <span>🔒</span>
                    <span>
                      You'll be taken to <strong>Stripe's secure checkout</strong> to complete payment.
                      Your card details are never stored on our servers.
                      You'll be charged monthly for <strong>{MONTHS} months</strong>.
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-full"
                  disabled={!canSubmit}
                >
                  {submitting ? (
                    <><span className="spinner" />Redirecting to payment…</>
                  ) : (
                    <>Proceed to Secure Payment →</>
                  )}
                </button>
              </>
            )}

            {/* Incomplete form notice */}
            {!formComplete && venue && !isCurrenagh && (
              <p style={{ textAlign: 'center', color: 'var(--grey-400)', fontSize: '0.875rem', marginTop: 12 }}>
                Complete all required fields above to see your order summary and payment button.
              </p>
            )}

          </form>
        </div>
      </main>

      <footer className="site-footer">
        <p>Tennis Academy &copy; {new Date().getFullYear()} · 10-month season · September to June</p>
      </footer>
    </div>
  );
}
