# Runway — ₹10,000 for 30 days

A consumer-style personal finance app for Gen Z. Every decision visibly ripples through balance, daily allowance, savings goals, month forecast, financial risk and financial health.

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Zustand (persisted to localStorage) · Lucide icons

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Accounts (login / sign up)
- **Sign up / Log in** with name, email and password (validated, with show/hide password).
- **Continue as guest** opens the day-9 demo month instantly, with no signup needed.
- Each account keeps its own money plan. New accounts start on day 1 with ₹10,000.
- Demo-grade auth: accounts live in the browser's localStorage (passwords are salted and hashed, never stored in plain text). There is no server.

## What it does
- **Home** – balance, safe-to-spend per day, 30-day forecast chart (hover to scrub), health score breakdown, risk meter, upcoming bills, nudges, goal progress.
- **Simulate** – test a purchase, new subscription, cancellation, savings deposit or income *before* committing. See before → after for balance, allowance, forecast, risk, health and goals, plus a plain-language ripple list and a forecast overlay. Includes unexpected-expense stress tests.
- **Plan** – pay commitments, toggle subscriptions, fund savings goals.
- **Activity** – log expenses/income, filter history, category breakdown, "life happens" surprise expenses, demo / reset controls.
- **Next day** – advance the month; subscriptions auto-renew, bills come due, surprise expenses may strike.

## Model (src/lib/engine.ts)
- Safe / day = (balance − unpaid bills − active renewals − ₹300 cushion) ÷ days left
- Forecast = balance − scheduled bills − blended burn rate (60% last 7 days, 40% month average)
- Risk (0–100) = shortfall + liquidity + overspend + runway + overdue bills
- Health (0–100) = runway 30 + spending pace 25 + savings 20 + bills on time 15 + subscription load 10

The app starts on a day-9 demo month; use Activity → "Start fresh (day 1)" for a clean slate.
