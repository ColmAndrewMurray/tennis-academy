# 🎾 Tennis Academy — Season Registration App

A parent-friendly booking and payment app for a 10-month junior tennis academy.

Parents select a venue, choose class groups and time slots for up to 3 children,
and pay via Stripe. The subscription runs for exactly 10 monthly payments
(September–June) then ends automatically.

**No npm install or build step required** — just Node.js (already on your Mac).

---

## To Start the App

### Step 1 — Double-click `START.command`

Find the `START.command` file in the `tennis-academy` folder and double-click it.

- Terminal opens briefly, the server starts, and your browser opens automatically at **http://localhost:3001**
- To stop: press **Ctrl+C** in the Terminal window, or close it

> If you see "permission denied", right-click → Open → Open anyway (first time only on macOS)

---

### Step 2 — Add Your Stripe Test Keys (for payments)

The app loads and shows the form without Stripe keys — you just won't be able to submit payment yet.

1. Go to **https://dashboard.stripe.com/test/apikeys**
2. Copy your **Secret key** (starts with `sk_test_...`)
3. Open `server/.env` in any text editor
4. Replace `sk_test_REPLACE_WITH_YOUR_TEST_KEY` with your real test key
5. Save the file and re-launch via `START.command`

---

## Test a Payment

Use Stripe's test card numbers:

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Decline |
| `4000 0025 0000 3155` | 🔐 Requires authentication |

Any future expiry date and any 3-digit CVC.

---

## Folder Structure

```
tennis-academy/
├── START.command              ← Double-click to launch 🚀
├── public/
│   └── index.html             ← Complete frontend (React via CDN, no build needed)
├── server/
│   ├── server.js              ← Main Node.js server (zero external dependencies)
│   ├── .env                   ← Your Stripe keys (fill this in)
│   ├── config/
│   │   └── academyConfig.js   ← EDIT THIS: venues, slots, prices, dates
│   └── data/
│       └── bookings.json      ← Live slot booking counts (auto-updated on payment)
├── .env.example               ← Reference for .env variables
└── README.md
```

The `client/` folder contains a Vite/React source version if you'd like to
switch to a compiled build in future — but the app runs entirely from
`server/server.js` + `public/index.html` with **no npm install needed**.

---

## Editing Prices and Schedule Times

Open **`server/config/academyConfig.js`** — all the settings are at the top:

### Prices (in cents)
```js
const PRICING = {
  earlyBird: {
    child1: 61500, // €615.00 total  ← change here
    child2: 60000, // €600.00 total
    child3: 0,     // FREE
  },
  standard: {
    child1: 64000, // €640.00 total
    child2: 61500, // €615.00 total
    child3: 0,     // FREE
  },
};
```

Then update the matching display values in **`public/index.html`** → search for
`PRICING_DISPLAY` near the top of the `<script type="text/babel">` block.

### Early Bird Cut-off Date
```js
const EARLY_BIRD_CUTOFF = new Date('2026-08-01T23:59:59');
```
Update this each year. Also update `EARLY_BIRD_CUTOFF_DATE` in `public/index.html`.

### Slot Times
Edit the `SCHEDULE` object in `server/config/academyConfig.js` and the matching
`SCHEDULE` object in `public/index.html`. Keep the `id` fields identical — they're
used to track bookings.

### Add Currenagh Schedule
Replace `Currenagh: null` in both files with a slots object using the same
structure as Clontarf.

---

## Stripe Setup Checklist (Before Going Live)

- [ ] Add Stripe **test** key to `server/.env` for development
- [ ] Test a full payment with card `4242 4242 4242 4242`
- [ ] Set up Stripe webhook in Dashboard → pointing to `https://yourdomain.com/api/webhook`
  - Events to listen for: `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted`
- [ ] Add `STRIPE_WEBHOOK_SECRET` to `.env`
- [ ] Switch to **live** Stripe key when ready for real payments
- [ ] Add email confirmations — see `TODO` comments in `server/routes/webhook.js`

---

## Setting up Stripe Webhooks for Local Testing

In a second Terminal window, run:
```bash
stripe listen --forward-to localhost:3001/api/webhook
```

Copy the `whsec_...` value it prints and add it to `server/.env` as `STRIPE_WEBHOOK_SECRET`.
This allows the app to mark slots as booked and set up the 10-month schedule after payment.

---

## Assumptions

- 3rd child is always free, regardless of which children are in the booking
- Monday slot for 3rd & 4th Class is built as **3:15–4:15 PM** (original spec said 2:15 PM — see TODO in config)
- Slot counts are stored in `server/data/bookings.json`; production should use a database
- Early bird cut-off is set to **1 August 2026** for the 2026–27 season; update annually

---

## Improvement Plan

### Near-term
- [ ] Add a database (PostgreSQL / SQLite) to replace bookings.json and prevent race conditions at capacity
- [ ] Add email confirmations (Resend or SendGrid) — see TODOs in webhook.js
- [ ] Add an admin dashboard to view bookings and slot capacity
- [ ] Add Stripe Customer Portal so parents can update payment details
- [ ] Switch to a compiled Vite build (client/ folder) for faster load times

### Longer-term
- [ ] Add Currenagh schedule
- [ ] Waiting list for full slots
- [ ] Promo/discount code support via Stripe Coupons
- [ ] PWA support for mobile home screen shortcut
