/**
 * SuccessPage — shown after successful Stripe Checkout.
 * Stripe redirects here with ?session_id=xxx
 */

import { Link } from 'react-router-dom';
import { MONTHS } from '../config/academyConfig';

export default function SuccessPage() {
  return (
    <div className="result-page">
      <div className="result-card">
        <div className="result-icon">🎉</div>
        <h1>You're all booked!</h1>
        <p>
          Thank you for registering with the Tennis Academy. Your payment was successful
          and your children are now enrolled for the season.
        </p>
        <p>
          You'll be charged monthly for <strong>{MONTHS} months</strong> (September – June).
          Your subscription will end automatically after the final payment — no action needed.
        </p>
        <p style={{ fontSize: '0.875rem', marginTop: 8 }}>
          A confirmation email will be sent to you shortly. If you have any questions,
          please don't hesitate to get in touch.
        </p>

        <div className="action-row">
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
