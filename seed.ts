import type { AppState, Txn, Category } from './types'

let n = 0
const t = (day: number, amount: number, category: Category, note: string, extra: Partial<Txn> = {}): Txn => ({
  id: `seed-${++n}`,
  day,
  amount,
  category,
  note,
  kind: 'expense',
  ...extra,
})

/** Day 1 — a clean slate. */
export function freshState(): AppState {
  return {
    budget: 10000,
    day: 1,
    txns: [],
    commitments: [
      { id: 'c-rent', name: 'Room rent share', emoji: '🏠', amount: 2800, dueDay: 2, paid: false },
      { id: 'c-transit', name: 'Metro / bus pass', emoji: '🚇', amount: 600, dueDay: 4, paid: false },
      { id: 'c-phone', name: 'Phone recharge', emoji: '📶', amount: 299, dueDay: 6, paid: false },
      { id: 'c-wifi', name: 'Wi-Fi split', emoji: '🛜', amount: 250, dueDay: 10, paid: false },
      { id: 'c-trip', name: 'Friends trip share', emoji: '🧳', amount: 400, dueDay: 20, paid: false },
    ],
    subs: [
      { id: 's-spot', name: 'Spotify', emoji: '🎧', amount: 59, renewalDay: 8, active: true, charged: false },
      { id: 's-nflx', name: 'Netflix', emoji: '🎬', amount: 199, renewalDay: 12, active: true, charged: false },
      { id: 's-yt', name: 'YouTube Premium', emoji: '▶️', amount: 129, renewalDay: 15, active: true, charged: false },
      { id: 's-gym', name: 'Gym membership', emoji: '🏋️', amount: 399, renewalDay: 20, active: true, charged: false },
    ],
    goals: [
      { id: 'g-em', name: 'Emergency cushion', emoji: '🛟', target: 1000, saved: 0 },
      { id: 'g-hp', name: 'New headphones', emoji: '🎧', target: 2500, saved: 0 },
    ],
    surprises: true,
  }
}

/** Day 9 — a realistic mid-month snapshot so every screen has something to show. */
export function demoState(): AppState {
  n = 0
  const s = freshState()
  s.day = 9
  s.commitments.forEach((c) => {
    if (['c-rent', 'c-transit', 'c-phone'].includes(c.id)) c.paid = true
  })
  s.subs.find((x) => x.id === 's-spot')!.charged = true
  s.goals[0].saved = 300
  s.txns = [
    t(1, 100, 'food', 'Canteen lunch'),
    t(1, 30, 'transport', 'Auto to college'),
    t(2, 2800, 'bills', 'Room rent share'),
    t(2, 120, 'food', 'Biryani with friends'),
    t(3, 80, 'food', 'Breakfast + chai'),
    t(3, 149, 'shopping', 'Plain tee, sale'),
    t(4, 600, 'bills', 'Metro / bus pass'),
    t(4, 100, 'food', 'Dinner'),
    t(4, 120, 'fun', 'Movie ticket'),
    t(5, 300, 'other', 'Saved to Emergency cushion', { kind: 'goal', goalId: 'g-em' }),
    t(5, 90, 'food', 'Lunch'),
    t(5, 40, 'transport', 'Cab share'),
    t(6, 299, 'bills', 'Phone recharge'),
    t(6, 99, 'learning', 'Course resource'),
    t(6, 80, 'food', 'Street food'),
    t(7, 100, 'food', 'Lunch'),
    t(7, 130, 'fun', 'Cafe hangout'),
    t(8, 59, 'bills', 'Spotify'),
    t(8, 70, 'food', 'Lunch'),
    t(8, 30, 'transport', 'Auto'),
    t(9, 110, 'food', 'Lunch + snacks'),
  ]
  return s
}
