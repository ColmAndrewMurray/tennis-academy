const TENNIS_API_URL = 'https://tennis-academy-dzrw.onrender.com';
const ADMIN_SECRET = 'edOulgm-z_dULoVY910MV_dk0n7za-H0';
const {
  useState,
  useEffect,
  useCallback
} = React;
const MONTHS = 10;
const EARLY_BIRD_CUTOFF_DATE = new Date('2026-08-01T23:59:59');
const PRICING_DISPLAY = {
  earlyBird: {
    child1: {
      total: 615,
      monthly: 61.50
    },
    child2: {
      total: 600,
      monthly: 60.00
    },
    child3: {
      total: 0,
      monthly: 0
    }
  },
  standard: {
    child1: {
      total: 640,
      monthly: 64.00
    },
    child2: {
      total: 615,
      monthly: 61.50
    },
    child3: {
      total: 0,
      monthly: 0
    }
  },
  upfrontEarlyBird: {
    child1: {
      total: 589,
      monthly: null
    },
    child2: {
      total: 589,
      monthly: null
    },
    child3: {
      total: 0,
      monthly: null
    }
  }
};
const VENUES = ['Clontarf', 'Currenagh'];
const CLASS_GROUPS = ['Junior and Senior Infants', 'First and Second Class', 'Third and Fourth Class', 'Fifth and Sixth Class'];
const SCHEDULE = {
  Clontarf: {
    'Junior and Senior Infants': [{
      id: 'clontarf-jsi-mon',
      day: 'Monday',
      time: '1:30 PM – 2:15 PM',
      capacity: 10
    }, {
      id: 'clontarf-jsi-tue',
      day: 'Tuesday',
      time: '1:30 PM – 2:15 PM',
      capacity: 10
    }, {
      id: 'clontarf-jsi-wed',
      day: 'Wednesday',
      time: '1:30 PM – 2:15 PM',
      capacity: 10
    }, {
      id: 'clontarf-jsi-fri',
      day: 'Friday',
      time: '1:40 PM – 2:25 PM',
      capacity: 10
    }],
    'First and Second Class': [{
      id: 'clontarf-12-mon',
      day: 'Monday',
      time: '2:30 PM – 3:15 PM',
      capacity: 12
    }, {
      id: 'clontarf-12-tue',
      day: 'Tuesday',
      time: '2:30 PM – 3:15 PM',
      capacity: 12
    }, {
      id: 'clontarf-12-wed',
      day: 'Wednesday',
      time: '2:30 PM – 3:15 PM',
      capacity: 12
    }, {
      id: 'clontarf-12-fri',
      day: 'Friday',
      time: '2:30 PM – 3:15 PM',
      capacity: 12
    }],
    'Third and Fourth Class': [{
      id: 'clontarf-34-mon',
      day: 'Monday',
      time: '3:15 PM – 4:15 PM',
      capacity: 12
    }, {
      id: 'clontarf-34-tue',
      day: 'Tuesday',
      time: '3:15 PM – 4:15 PM',
      capacity: 12
    }, {
      id: 'clontarf-34-wed',
      day: 'Wednesday',
      time: '3:15 PM – 4:15 PM',
      capacity: 12
    }, {
      id: 'clontarf-34-fri',
      day: 'Friday',
      time: '3:15 PM – 4:15 PM',
      capacity: 12
    }],
    'Fifth and Sixth Class': [{
      id: 'clontarf-56-mon',
      day: 'Monday',
      time: '4:15 PM – 5:15 PM',
      capacity: 12
    }, {
      id: 'clontarf-56-tue',
      day: 'Tuesday',
      time: '4:15 PM – 5:15 PM',
      capacity: 6
    }, {
      id: 'clontarf-56-wed',
      day: 'Wednesday',
      time: '4:15 PM – 5:15 PM',
      capacity: 12
    }, {
      id: 'clontarf-56-fri',
      day: 'Friday',
      time: '4:15 PM – 5:15 PM',
      capacity: 12
    }]
  },
  Currenagh: null
};
function getPricingTier(now = new Date()) {
  return now <= EARLY_BIRD_CUTOFF_DATE ? 'earlyBird' : 'standard';
}
function getChildDisplayPrice(index, tier) {
  const key = `child${Math.min(index, 3)}`;
  return PRICING_DISPLAY[tier][key];
}
function getSlotLabel(venue, classGroup, slotId) {
  if (!venue || !classGroup || !slotId) return '—';
  const slots = (SCHEDULE[venue] || {})[classGroup] || [];
  const slot = slots.find(s => s.id === slotId);
  return slot ? `${slot.day}  ${slot.time}` : slotId;
}
function PaymentTypeSelector({
  paymentType,
  onChange,
  pricingTier
}) {
  if (pricingTier !== 'earlyBird') return null;
  const sel = v => ({
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '16px 14px',
    border: paymentType === v ? '2px solid var(--ta-navy)' : '1.5px solid var(--ta-grey-200)',
    borderRadius: 'var(--ta-radius-sm)',
    cursor: 'pointer',
    background: paymentType === v ? 'var(--ta-navy-light)' : v === 'upfront' ? 'var(--ta-gold-light)' : 'var(--ta-white)',
    transition: 'all var(--ta-transition)'
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "ta-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-card-title"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ta-step"
  }, "1"), " Payment Option"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: sel('upfront')
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "pt",
    checked: paymentType === 'upfront',
    onChange: () => onChange('upfront'),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: 'var(--ta-navy)'
    }
  }, "Pay in Full"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '.85rem',
      fontWeight: 600
    }
  }, "\u20AC589 one-time per child"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '.78rem',
      color: 'var(--ta-gold-dark)'
    }
  }, "Save \u20AC26 \u2014 early bird only")), /*#__PURE__*/React.createElement("label", {
    style: sel('monthly')
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "pt",
    checked: paymentType === 'monthly',
    onChange: () => onChange('monthly'),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: 'var(--ta-navy)'
    }
  }, "Monthly Payments"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '.85rem',
      fontWeight: 600
    }
  }, "10 payments of \u20AC61.50"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '.78rem',
      color: 'var(--ta-grey-600)'
    }
  }, "\u20AC615 total for first child"))), paymentType === 'upfront' && /*#__PURE__*/React.createElement("div", {
    className: "ta-alert ta-alert-info",
    style: {
      marginTop: 14,
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83C\uDF1F"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Early Bird Full Payment"), " \u2014 \u20AC589 per child (3rd free), one payment. Available until ", /*#__PURE__*/React.createElement("strong", null, "1 Aug 2026"), ".")));
}
function ParentForm({
  parent,
  onChange,
  errors
}) {
  const handle = field => e => onChange({
    ...parent,
    [field]: e.target.value
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "ta-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-card-title"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ta-step"
  }, "1"), "Your Details"), /*#__PURE__*/React.createElement("div", {
    className: "ta-form-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "ta-label"
  }, "Full Name ", /*#__PURE__*/React.createElement("span", {
    className: "ta-req"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: `ta-ctrl${errors.name ? ' ta-err' : ''}`,
    value: parent.name,
    onChange: handle('name'),
    placeholder: "e.g. Jane Murphy",
    autoComplete: "name"
  }), errors.name && /*#__PURE__*/React.createElement("p", {
    className: "ta-field-err"
  }, "\u26A0 ", errors.name)), /*#__PURE__*/React.createElement("div", {
    className: "ta-form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "ta-label"
  }, "Phone Number ", /*#__PURE__*/React.createElement("span", {
    className: "ta-req"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "tel",
    className: `ta-ctrl${errors.phone ? ' ta-err' : ''}`,
    value: parent.phone,
    onChange: handle('phone'),
    placeholder: "e.g. 087 123 4567",
    autoComplete: "tel"
  }), errors.phone && /*#__PURE__*/React.createElement("p", {
    className: "ta-field-err"
  }, "\u26A0 ", errors.phone))), /*#__PURE__*/React.createElement("div", {
    className: "ta-form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "ta-label"
  }, "Email Address ", /*#__PURE__*/React.createElement("span", {
    className: "ta-req"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "email",
    className: `ta-ctrl${errors.email ? ' ta-err' : ''}`,
    value: parent.email,
    onChange: handle('email'),
    placeholder: "e.g. jane@example.com",
    autoComplete: "email"
  }), errors.email && /*#__PURE__*/React.createElement("p", {
    className: "ta-field-err"
  }, "\u26A0 ", errors.email)));
}
function ChildForm({
  index,
  child,
  venue,
  availability,
  pricingTier,
  displayPrice,
  onChange,
  onRemove,
  errors,
  canRemove
}) {
  const childNumber = index + 1;
  const isFree = childNumber === 3;
  const label = childNumber === 1 ? '1st Child' : childNumber === 2 ? '2nd Child' : '3rd Child';
  const venueSlots = venue && SCHEDULE[venue] ? SCHEDULE[venue][child.classGroup] || [] : [];
  const handle = field => e => {
    const updated = {
      ...child,
      [field]: e.target.value
    };
    if (field === 'classGroup') updated.slotId = '';
    onChange(updated);
  };
  const availStatus = slotId => availability && child.classGroup ? (availability[child.classGroup] || {})[slotId] || null : null;
  return /*#__PURE__*/React.createElement("div", {
    className: "ta-child-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-child-hdr"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-child-ttl"
  }, "\uD83C\uDFBE ", label, isFree && /*#__PURE__*/React.createElement("span", {
    className: "ta-free-badge"
  }, "FREE")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, !isFree && displayPrice && /*#__PURE__*/React.createElement("div", {
    className: "ta-price-tag"
  }, displayPrice.monthly !== null ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("strong", null, "\u20AC", displayPrice.monthly.toFixed(2), "/mo"), /*#__PURE__*/React.createElement("span", null, "\u20AC", displayPrice.total, " total")) : /*#__PURE__*/React.createElement("strong", null, "\u20AC", displayPrice.total, " upfront")), canRemove && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ta-remove-btn",
    onClick: onRemove,
    title: "Remove child"
  }, "\u2715"))), /*#__PURE__*/React.createElement("div", {
    className: "ta-form-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "ta-label"
  }, "First Name ", /*#__PURE__*/React.createElement("span", {
    className: "ta-req"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: `ta-ctrl${errors.firstName ? ' ta-err' : ''}`,
    value: child.firstName,
    onChange: handle('firstName'),
    placeholder: "First name"
  }), errors.firstName && /*#__PURE__*/React.createElement("p", {
    className: "ta-field-err"
  }, "\u26A0 ", errors.firstName)), /*#__PURE__*/React.createElement("div", {
    className: "ta-form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "ta-label"
  }, "Surname ", /*#__PURE__*/React.createElement("span", {
    className: "ta-req"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: `ta-ctrl${errors.lastName ? ' ta-err' : ''}`,
    value: child.lastName,
    onChange: handle('lastName'),
    placeholder: "Surname"
  }), errors.lastName && /*#__PURE__*/React.createElement("p", {
    className: "ta-field-err"
  }, "\u26A0 ", errors.lastName))), /*#__PURE__*/React.createElement("div", {
    className: "ta-form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "ta-label"
  }, "School Class Group ", /*#__PURE__*/React.createElement("span", {
    className: "ta-req"
  }, "*")), /*#__PURE__*/React.createElement("select", {
    className: `ta-ctrl${errors.classGroup ? ' ta-err' : ''}`,
    value: child.classGroup,
    onChange: handle('classGroup'),
    disabled: !venue || venue === 'Currenagh'
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Select class group \u2014"), CLASS_GROUPS.map(g => /*#__PURE__*/React.createElement("option", {
    key: g,
    value: g
  }, g))), errors.classGroup && /*#__PURE__*/React.createElement("p", {
    className: "ta-field-err"
  }, "\u26A0 ", errors.classGroup)), child.classGroup && venueSlots.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "ta-form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "ta-label"
  }, "Day & Time Slot ", /*#__PURE__*/React.createElement("span", {
    className: "ta-req"
  }, "*")), /*#__PURE__*/React.createElement("div", {
    className: "ta-slot-grid"
  }, venueSlots.map(slot => {
    const avail = availStatus(slot.id);
    const isFull = avail ? avail.full : false;
    const count = avail ? avail.available : null;
    const isLow = !isFull && count !== null && count <= 3;
    return /*#__PURE__*/React.createElement("div", {
      className: "ta-slot-opt",
      key: slot.id
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      id: `slot-${index}-${slot.id}`,
      name: `slot-${index}`,
      value: slot.id,
      checked: child.slotId === slot.id,
      onChange: () => !isFull && onChange({
        ...child,
        slotId: slot.id
      }),
      disabled: isFull
    }), /*#__PURE__*/React.createElement("label", {
      htmlFor: `slot-${index}-${slot.id}`,
      className: `ta-slot-lbl${isFull ? ' ta-full' : ''}`
    }, /*#__PURE__*/React.createElement("span", {
      className: "ta-slot-day"
    }, slot.day), /*#__PURE__*/React.createElement("span", {
      className: "ta-slot-time"
    }, slot.time), avail && /*#__PURE__*/React.createElement("span", {
      className: `ta-slot-avail ${isFull ? 'ta-avail-full' : isLow ? 'ta-avail-low' : 'ta-avail-ok'}`
    }, isFull ? 'Fully booked' : isLow ? `${count} place${count === 1 ? '' : 's'} left` : `${count} available`)));
  })), errors.slotId && !child.slotId && /*#__PURE__*/React.createElement("p", {
    className: "ta-field-err"
  }, "\u26A0 ", errors.slotId), child.slotId && availStatus(child.slotId) && availStatus(child.slotId).full && /*#__PURE__*/React.createElement("div", {
    className: "ta-alert ta-alert-err",
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u26D4"), /*#__PURE__*/React.createElement("span", null, "This slot is ", /*#__PURE__*/React.createElement("strong", null, "fully booked"), ". Please choose another slot or", ' ', /*#__PURE__*/React.createElement("a", {
    href: "mailto:info@tennisacademy.ie"
  }, "get in touch"), "."))), /*#__PURE__*/React.createElement("div", {
    className: "ta-form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "ta-label"
  }, "Medical / Health Notes ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontWeight: 400
    }
  }, "(optional)")), /*#__PURE__*/React.createElement("textarea", {
    className: "ta-ctrl",
    value: child.medicalNotes,
    onChange: handle('medicalNotes'),
    placeholder: "Medical conditions or health info\u2026",
    rows: 2
  })), /*#__PURE__*/React.createElement("div", {
    className: "ta-form-group",
    style: {
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "ta-label"
  }, "Additional Notes ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontWeight: 400
    }
  }, "(optional)")), /*#__PURE__*/React.createElement("textarea", {
    className: "ta-ctrl",
    value: child.parentNotes,
    onChange: handle('parentNotes'),
    placeholder: "Anything else we should know\u2026",
    rows: 2
  })));
}
function OrderSummary({
  parent,
  venue,
  children,
  pricingTier,
  paymentType
}) {
  if (!children.length) return null;
  const isUpfront = paymentType === 'upfront',
    isEB = pricingTier === 'earlyBird';
  const dTier = isUpfront ? 'upfrontEarlyBird' : pricingTier;
  let tot = 0,
    mo = 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "ta-summary"
  }, /*#__PURE__*/React.createElement("h2", null, "\uD83D\uDCCB Order Summary"), /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-lbl"
  }, "Parent / Guardian"), /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-val"
  }, parent.name || '—'), /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-val",
    style: {
      fontSize: '.82rem',
      opacity: .7
    }
  }, parent.email, parent.phone ? ` · ${parent.phone}` : '')), /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-lbl"
  }, "Venue"), /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-val"
  }, venue || '—')), /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-lbl"
  }, "Pricing"), /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-val"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      background: isUpfront || isEB ? '#c9963a' : 'rgba(255,255,255,.2)',
      color: '#fff',
      fontSize: '.75rem',
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 20
    }
  }, isUpfront ? 'Pay in Full' : isEB ? 'Early Bird' : 'Standard'), isUpfront && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '.78rem',
      opacity: .6,
      marginLeft: 8
    }
  }, "One-time"), !isUpfront && isEB && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '.78rem',
      opacity: .6,
      marginLeft: 8
    }
  }, "Until 1 Aug"))), /*#__PURE__*/React.createElement("hr", {
    className: "ta-sum-div"
  }), children.map((child, i) => {
    const n = i + 1,
      isFr = n === 3,
      price = getChildDisplayPrice(n, dTier),
      slot = getSlotLabel(venue, child.classGroup, child.slotId);
    if (!isFr) {
      tot += price.total;
      if (price.monthly !== null) mo += price.monthly;
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "ta-sum-child",
      key: i
    }, /*#__PURE__*/React.createElement("div", {
      className: "ta-sum-child-hdr"
    }, /*#__PURE__*/React.createElement("span", {
      className: "ta-sum-child-name"
    }, child.firstName || '—', " ", child.lastName), /*#__PURE__*/React.createElement("span", {
      className: "ta-sum-child-price"
    }, isFr ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: '#86efac'
      }
    }, "FREE") : isUpfront ? `€${price.total}` : `€${price.monthly.toFixed(2)}/mo`)), /*#__PURE__*/React.createElement("div", {
      className: "ta-sum-child-detail"
    }, child.classGroup || '—', " \xB7 ", slot), !isFr && !isUpfront && /*#__PURE__*/React.createElement("div", {
      className: "ta-sum-child-detail",
      style: {
        marginTop: 2
      }
    }, "\u20AC", price.total, " total"));
  }), /*#__PURE__*/React.createElement("hr", {
    className: "ta-sum-div"
  }), isUpfront ? /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-total-row"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-total-lbl"
  }, "Total due today"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '.75rem',
      color: 'rgba(255,255,255,.4)',
      marginTop: 2
    }
  }, "One-time \xB7 full season")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-total-amt"
  }, "\u20AC", tot.toFixed(2)))) : /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-total-row"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-total-lbl"
  }, "Monthly payment"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '.75rem',
      color: 'rgba(255,255,255,.4)',
      marginTop: 2
    }
  }, MONTHS, " payments \xB7 Sep \u2013 Jun")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-total-amt"
  }, "\u20AC", (Math.round(mo * 100) / 100).toFixed(2)), /*#__PURE__*/React.createElement("div", {
    className: "ta-sum-monthly-note"
  }, "Season total: \u20AC", tot.toFixed(2)))));
}
function SuccessPage({
  onBack
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ta-result"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-result-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-result-icon"
  }, "\uD83C\uDF89"), /*#__PURE__*/React.createElement("h1", null, "You're all booked!"), /*#__PURE__*/React.createElement("p", null, "Thank you for registering. Your payment was successful and your children are enrolled for the season."), /*#__PURE__*/React.createElement("p", null, "A confirmation email will be sent to you shortly."), /*#__PURE__*/React.createElement("div", {
    className: "ta-action-row"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ta-btn ta-btn-gold",
    onClick: onBack
  }, "Back to Home"))));
}
function CancelPage({
  onBack
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ta-result"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-result-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-result-icon"
  }, "\u21A9\uFE0F"), /*#__PURE__*/React.createElement("h1", null, "Payment Cancelled"), /*#__PURE__*/React.createElement("p", null, "No payment has been taken. Your booking has not been confirmed."), /*#__PURE__*/React.createElement("p", null, "Go back and try again, or ", /*#__PURE__*/React.createElement("a", {
    href: "mailto:info@tennisacademy.ie"
  }, "get in touch"), " if you need help."), /*#__PURE__*/React.createElement("div", {
    className: "ta-action-row"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ta-btn ta-btn-gold",
    onClick: onBack
  }, "Try Again"))));
}
function emptyChild() {
  return {
    firstName: '',
    lastName: '',
    classGroup: '',
    slotId: '',
    medicalNotes: '',
    parentNotes: ''
  };
}
function BookingPage() {
  const [parent, setParent] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [venue, setVenue] = useState('');
  const [children, setChildren] = useState([emptyChild()]);
  const [availability, setAvailability] = useState({});
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [paymentType, setPaymentType] = useState('monthly');
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ta_success') === '1') return 'success';
    if (params.get('ta_cancelled') === '1') return 'cancel';
    return 'form';
  });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('ta_success') || params.has('ta_cancelled') || params.has('session_id')) {
      params.delete('ta_success');
      params.delete('ta_cancelled');
      params.delete('session_id');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, []);
  const pricingTier = getPricingTier();
  const isEarlyBird = pricingTier === 'earlyBird';
  const fetchAvailability = useCallback(async v => {
    if (!v || !SCHEDULE[v]) {
      setAvailability({});
      return;
    }
    if (SCHEDULE[v] === null) {
      setAvailability({
        tbc: true
      });
      return;
    }
    setLoadingAvail(true);
    try {
      const res = await fetch(`${TENNIS_API_URL}/api/availability?venue=${encodeURIComponent(v)}`);
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
  function handleVenueChange(e) {
    setVenue(e.target.value);
    setChildren(prev => prev.map(c => ({
      ...c,
      classGroup: '',
      slotId: ''
    })));
    setApiErrors([]);
  }
  function updateChild(i, updated) {
    setChildren(prev => prev.map((c, idx) => idx === i ? updated : c));
  }
  function validate() {
    const errs = {},
      pErrs = {};
    if (!parent.name.trim()) pErrs.name = 'Name is required';
    if (!parent.email.trim()) pErrs.email = 'Email is required';else if (!/\S+@\S+\.\S+/.test(parent.email)) pErrs.email = 'Enter a valid email';
    if (!parent.phone.trim()) pErrs.phone = 'Phone number is required';
    if (Object.keys(pErrs).length) errs.parent = pErrs;
    if (!venue) errs.venue = 'Please select a venue';
    const childErrs = children.map(c => {
      const ce = {};
      if (!c.firstName.trim()) ce.firstName = 'Required';
      if (!c.lastName.trim()) ce.lastName = 'Required';
      if (!c.classGroup) ce.classGroup = 'Required';
      if (!c.slotId) ce.slotId = 'Please select a time slot';
      return ce;
    });
    if (childErrs.some(ce => Object.keys(ce).length)) errs.children = childErrs;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setApiErrors([]);
    if (!validate()) {
      const el = document.querySelector('#ta-bw .ta-err, #ta-bw .ta-field-err');
      if (el) el.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      return;
    }
    setSubmitting(true);
    try {
      const base = window.location.origin + window.location.pathname;
      const successUrl = base + '?ta_success=1&session_id={CHECKOUT_SESSION_ID}';
      const cancelUrl = base + '?ta_cancelled=1';
      const res = await fetch(`${TENNIS_API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parent,
          venue,
          children,
          paymentType,
          successUrl,
          cancelUrl
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setApiErrors(data.errors || ['Something went wrong. Please try again.']);
        setSubmitting(false);
        document.getElementById('ta-bw').scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        return;
      }
      window.location.href = data.url;
    } catch {
      setApiErrors(['Network error — please check your connection and try again.']);
      setSubmitting(false);
    }
  }

  // Route to success/cancel pages
  if (page === 'success') return /*#__PURE__*/React.createElement(SuccessPage, {
    onBack: () => setPage('form')
  });
  if (page === 'cancel') return /*#__PURE__*/React.createElement(CancelPage, {
    onBack: () => setPage('form')
  });
  const isCurrenagh = venue === 'Currenagh';
  const showChildren = venue && !isCurrenagh;
  const hasFullSlot = children.some(c => c.slotId && (availability[c.classGroup] || {})[c.slotId]?.full);
  const formComplete = parent.name.trim() && parent.email.trim() && parent.phone.trim() && venue && !isCurrenagh && children.every(c => c.firstName && c.lastName && c.classGroup && c.slotId);
  const canSubmit = formComplete && !hasFullSlot && !submitting;
  const showPayNow = parent.name.trim() && parent.email.trim() && parent.phone.trim() && venue && !isCurrenagh;
  const cutoffStr = EARLY_BIRD_CUTOFF_DATE.toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("header", {
    className: "ta-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-logo-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ta-logo-icon"
  }, "\uD83C\uDFBE"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Tennis Academy"), /*#__PURE__*/React.createElement("p", {
    className: "ta-tagline"
  }, "Registration \u2014 September to June"))))), /*#__PURE__*/React.createElement("div", {
    className: "ta-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-pricing-banner"
  }, /*#__PURE__*/React.createElement("span", {
    className: `ta-badge${isEarlyBird ? '' : ' ta-badge-std'}`
  }, isEarlyBird ? '🌟 Early Bird Pricing' : 'Standard Pricing'), /*#__PURE__*/React.createElement("p", null, isEarlyBird ? /*#__PURE__*/React.createElement("span", null, "Early bird rates apply until ", /*#__PURE__*/React.createElement("strong", null, cutoffStr), ". Pay upfront before August 1 for only ", /*#__PURE__*/React.createElement("strong", null, "\u20AC589"), " for each of the first two children and the third free, or pay over ", /*#__PURE__*/React.createElement("strong", null, "10 monthly payments"), " \u2014 ", /*#__PURE__*/React.createElement("strong", null, "\u20AC615"), " for the first child, ", /*#__PURE__*/React.createElement("strong", null, "\u20AC600"), " for the second and the third child free.") : /*#__PURE__*/React.createElement("span", null, "Standard rates apply after ", cutoffStr, ". Season fee is ", /*#__PURE__*/React.createElement("strong", null, "\u20AC640"), " for the first child, paid over ", /*#__PURE__*/React.createElement("strong", null, "10 monthly payments"), "."))), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit,
    noValidate: true
  }, apiErrors.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "ta-alert ta-alert-err"
  }, /*#__PURE__*/React.createElement("span", null, "\u26D4"), /*#__PURE__*/React.createElement("div", null, apiErrors.map((err, i) => /*#__PURE__*/React.createElement("p", {
    key: i,
    style: {
      margin: 0
    }
  }, err)))), /*#__PURE__*/React.createElement(PaymentTypeSelector, {
    paymentType: paymentType,
    onChange: setPaymentType,
    pricingTier: pricingTier
  }), /*#__PURE__*/React.createElement(ParentForm, {
    parent: parent,
    onChange: setParent,
    errors: fieldErrors.parent || {}
  }), /*#__PURE__*/React.createElement("div", {
    className: "ta-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-card-title"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ta-step"
  }, "2"), "Select Venue"), /*#__PURE__*/React.createElement("div", {
    className: "ta-form-group",
    style: {
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "ta-label"
  }, "Venue ", /*#__PURE__*/React.createElement("span", {
    className: "ta-req"
  }, "*")), /*#__PURE__*/React.createElement("select", {
    className: `ta-ctrl${fieldErrors.venue ? ' ta-err' : ''}`,
    value: venue,
    onChange: handleVenueChange
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Select a venue \u2014"), VENUES.map(v => /*#__PURE__*/React.createElement("option", {
    key: v,
    value: v
  }, v))), fieldErrors.venue && /*#__PURE__*/React.createElement("p", {
    className: "ta-field-err"
  }, "\u26A0 ", fieldErrors.venue)), isCurrenagh && /*#__PURE__*/React.createElement("div", {
    className: "ta-venue-tbc"
  }, /*#__PURE__*/React.createElement("h3", null, "Schedule Coming Soon"), /*#__PURE__*/React.createElement("p", null, "The Currenagh schedule is yet to be confirmed.", /*#__PURE__*/React.createElement("br", null), "Please check back soon or ", /*#__PURE__*/React.createElement("a", {
    href: "mailto:info@tennisacademy.ie"
  }, "get in touch"), " to register your interest.")), loadingAvail && /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 12,
      color: 'var(--ta-grey-400)',
      fontSize: '.875rem'
    }
  }, "Checking availability\u2026")), showChildren && /*#__PURE__*/React.createElement("div", {
    className: "ta-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-card-title"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ta-step"
  }, "3"), "Children", children.length < 3 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '.78rem',
      fontWeight: 400,
      color: 'var(--ta-grey-400)',
      marginLeft: 6
    }
  }, "(up to 3 \u2014 3rd child is free)")), children.map((child, i) => {
    const n = i + 1;
    const isFr = n === 3;
    const displayTier = paymentType === 'upfront' ? 'upfrontEarlyBird' : pricingTier;
    const dp = isFr ? {
      total: 0,
      monthly: null
    } : getChildDisplayPrice(n, displayTier);
    return /*#__PURE__*/React.createElement(ChildForm, {
      key: i,
      index: i,
      child: child,
      venue: venue,
      availability: availability,
      pricingTier: pricingTier,
      displayPrice: dp,
      onChange: updated => updateChild(i, updated),
      onRemove: () => setChildren(prev => prev.filter((_, idx) => idx !== i)),
      errors: (fieldErrors.children || [])[i] || {},
      canRemove: children.length > 1
    });
  }), showPayNow && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "ta-btn ta-btn-gold ta-btn-full",
    disabled: !canSubmit
  }, submitting ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "ta-spin"
  }), "Redirecting to payment\u2026") : /*#__PURE__*/React.createElement(React.Fragment, null, "Pay Now \u2192"))), children.length < 3 && /*#__PURE__*/React.createElement("div", {
    className: "ta-add-child-row"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ta-btn ta-btn-outline",
    onClick: () => setChildren(prev => [...prev, emptyChild()])
  }, "+ Add Another Child", children.length === 2 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '.78rem',
      marginLeft: 4,
      opacity: .7
    }
  }, "(3rd child is free!)")))), formComplete && !hasFullSlot && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(OrderSummary, {
    parent: parent,
    venue: venue,
    children: children,
    pricingTier: pricingTier,
    paymentType: paymentType
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ta-alert ta-alert-info"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD12"), /*#__PURE__*/React.createElement("span", null, "You'll be taken to ", /*#__PURE__*/React.createElement("strong", null, "Stripe's secure checkout"), " to complete payment. Your card details are never stored on our servers.", paymentType === 'upfront' ? /*#__PURE__*/React.createElement(React.Fragment, null, " You'll be charged ", /*#__PURE__*/React.createElement("strong", null, "once"), " for the full season.") : /*#__PURE__*/React.createElement(React.Fragment, null, " You'll be charged monthly for ", /*#__PURE__*/React.createElement("strong", null, MONTHS, " months"), ".")))), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "ta-btn ta-btn-gold ta-btn-lg ta-btn-full",
    disabled: !canSubmit
  }, submitting ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "ta-spin"
  }), "Redirecting to payment\u2026") : /*#__PURE__*/React.createElement(React.Fragment, null, "Proceed to Secure Payment \u2192"))), !formComplete && venue && !isCurrenagh && /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: 'center',
      color: 'var(--ta-grey-400)',
      fontSize: '.875rem',
      marginTop: 12
    }
  }, "Complete all required fields above to see your order summary and payment button.")))), /*#__PURE__*/React.createElement("footer", {
    className: "ta-footer"
  }, /*#__PURE__*/React.createElement("p", null, "Tennis Academy \xA9 ", new Date().getFullYear(), " \xB7 10-month season \xB7 September to June"), new URLSearchParams(window.location.search).get('admin') === '1' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: `${TENNIS_API_URL}/api/admin/export?key=${ADMIN_SECRET}`,
    style: {
      background: '#c9963a',
      color: '#fff',
      padding: '8px 18px',
      borderRadius: 6,
      fontSize: '.8rem',
      fontWeight: 700,
      textDecoration: 'none'
    }
  }, "\u2B07 Export Bookings CSV"))));
}
ReactDOM.createRoot(document.getElementById('ta-root')).render(/*#__PURE__*/React.createElement(BookingPage, null));