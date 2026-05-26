/**
 * CancelPage — shown if the user cancels on the Stripe Checkout page.
 */

import { Link } from 'react-router-dom';

export default function CancelPage() {
  return (
    <div className="result-page">
      <div className="result-card">
        <div className="result-icon">↩️</div>
        <h1>Payment Cancelled</h1>
        <p>
          No payment has been taken. Your booking has not been confirmed.
        </p>
        <p>
          If you'd like to complete your registration, simply go back and try again.
          Your form details may have been cleared — please re-enter them.
        </p>
        <p style={{ fontSize: '0.875rem', marginTop: 8 }}>
          Having trouble? <a href="mailto:info@tennisacademy.ie">Get in touch</a> and we'll help you complete your booking.
        </p>

        <div className="action-row">
          <Link to="/" className="btn btn-primary">
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}
