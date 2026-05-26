/**
 * ParentForm — collects parent/guardian contact details.
 */

export default function ParentForm({ parent, onChange, errors }) {
  function handle(field) {
    return (e) => onChange({ ...parent, [field]: e.target.value });
  }

  return (
    <div className="card">
      <div className="card-title">
        <span className="step-badge">1</span>
        Your Details
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="parent-name">
            Full Name <span className="required">*</span>
          </label>
          <input
            id="parent-name"
            type="text"
            className={`form-control${errors.name ? ' has-error' : ''}`}
            value={parent.name}
            onChange={handle('name')}
            placeholder="e.g. Jane Murphy"
            autoComplete="name"
          />
          {errors.name && <p className="field-error">⚠ {errors.name}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="parent-phone">
            Phone Number <span className="required">*</span>
          </label>
          <input
            id="parent-phone"
            type="tel"
            className={`form-control${errors.phone ? ' has-error' : ''}`}
            value={parent.phone}
            onChange={handle('phone')}
            placeholder="e.g. 087 123 4567"
            autoComplete="tel"
          />
          {errors.phone && <p className="field-error">⚠ {errors.phone}</p>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="parent-email">
          Email Address <span className="required">*</span>
        </label>
        <input
          id="parent-email"
          type="email"
          className={`form-control${errors.email ? ' has-error' : ''}`}
          value={parent.email}
          onChange={handle('email')}
          placeholder="e.g. jane@example.com"
          autoComplete="email"
        />
        {errors.email && <p className="field-error">⚠ {errors.email}</p>}
      </div>
    </div>
  );
}
