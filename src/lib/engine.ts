import type {
  AppState,
  Category,
  Commitment,
  ForecastPoint,
  GoalProjection,
  HealthPart,
  Metrics,
  RiskLevel,
  Scenario,
  Txn,
} from './types'
import { clamp, uid } from './format'

export const TOTAL_DAYS = 30
export const BUFFER = 300 // protected emergency cushion
const DEFAULT_BURN = 150 // assumed daily spend before any history exists

const isDiscretionary = (c: Category) => c !== 'bills'

export function computeMetrics(s: AppState): Metrics {
  const income = s.budget + s.txns.filter((t) => t.kind === 'income').reduce((a, t) => a + t.amount, 0)
  const spent = s.txns.filter((t) => t.kind === 'expense').reduce((a, t) => a + t.amount, 0)
  const savedToGoals = s.txns.filter((t) => t.kind === 'goal').reduce((a, t) => a + t.amount, 0)
  const balance = income - spent - savedToGoals

  const pending = s.commitments.filter((c) => !c.paid)
  const upcomingSubsList = s.subs.filter((x) => x.active && !x.charged)
  const pendingCommitments = pending.reduce((a, c) => a + c.amount, 0)
  const upcomingSubs = upcomingSubsList.reduce((a, x) => a + x.amount, 0)
  const obligations = pendingCommitments + upcomingSubs
  const overdue = pending.filter((c) => c.dueDay < s.day).length

  const daysLeft = Math.max(1, TOTAL_DAYS - s.day + 1)
  const safeToSpend = balance - obligations - BUFFER
  const dailyAllowance = Math.max(0, safeToSpend) / daysLeft

  // burn rate: blend of recent (7d) and overall discretionary spend
  const disc = s.txns.filter((t) => t.kind === 'expense' && isDiscretionary(t.category))
  const elapsed = Math.max(1, s.day)
  const overall = disc.reduce((a, t) => a + t.amount, 0) / elapsed
  const recentFrom = Math.max(1, s.day - 6)
  const recentDays = s.day - recentFrom + 1
  const recent = disc.filter((t) => t.day >= recentFrom).reduce((a, t) => a + t.amount, 0) / recentDays
  const burnRate = disc.length === 0 ? DEFAULT_BURN : 0.6 * recent + 0.4 * overall

  // forecast
  const forecast: ForecastPoint[] = []
  for (let d = 1; d <= s.day; d++) {
    const upto = s.txns.filter((t) => t.day <= d)
    const bal = s.budget + upto.reduce((a, t) => a + (t.kind === 'income' ? t.amount : -t.amount), 0)
    forecast.push({ day: d, balance: bal, actual: true })
  }

  let proj = balance
  let runOutDay: number | null = null
  for (let d = s.day + 1; d <= TOTAL_DAYS; d++) {
    const dueCommit = pending
      .filter((c) => (c.dueDay === d || (d === s.day + 1 && c.dueDay <= s.day)))
      .reduce((a, c) => a + c.amount, 0)
    const dueSubs = upcomingSubsList
      .filter((x) => x.renewalDay === d || (d === s.day + 1 && x.renewalDay <= s.day))
      .reduce((a, x) => a + x.amount, 0)
    proj -= dueCommit + dueSubs + burnRate
    if (proj < 0 && runOutDay === null) runOutDay = d
    forecast.push({ day: d, balance: proj, actual: false })
  }
  const projectedEnd = s.day >= TOTAL_DAYS ? balance - obligations : proj

  // goals: spread the projected surplus across goals in order
  let surplus = Math.max(0, projectedEnd - BUFFER)
  const goals: GoalProjection[] = s.goals.map((g) => {
    const need = Math.max(0, g.target - g.saved)
    const give = Math.min(need, surplus)
    surplus -= give
    const projectedSaved = g.saved + give
    return { goal: g, projectedSaved, onTrack: projectedSaved >= g.target, shortBy: Math.max(0, g.target - projectedSaved) }
  })

  // risk (0-100, higher = riskier)
  const shortfallRisk = 45 * clamp((1500 - projectedEnd) / 3000, 0, 1)
  const coverage = obligations === 0 ? 2 : balance / obligations
  const liquidityRisk = 25 * clamp((1.5 - coverage) / 1, 0, 1)
  const ratio = dailyAllowance <= 0 ? (burnRate > 0 ? 2 : 0) : burnRate / dailyAllowance
  const overspendRisk = 15 * clamp(ratio - 1, 0, 1)
  const daysShort = runOutDay === null ? 0 : TOTAL_DAYS - runOutDay + 1
  const runwayRisk = 15 * clamp(daysShort / 10, 0, 1)
  const risk = Math.round(clamp(shortfallRisk + liquidityRisk + overspendRisk + runwayRisk + overdue * 4, 0, 100))
  const riskLevel: RiskLevel = risk < 25 ? 'Low' : risk < 50 ? 'Moderate' : risk < 75 ? 'High' : 'Critical'

  // health (0-100)
  const subTotal = s.subs.filter((x) => x.active).reduce((a, x) => a + x.amount, 0)
  const runwayPts = 30 * clamp(projectedEnd / (0.15 * s.budget), 0, 1)
  const adherencePts = burnRate <= 0 ? 25 : 25 * clamp(dailyAllowance / burnRate, 0, 1)
  const savingsPts = 20 * clamp(savedToGoals / (0.15 * s.budget), 0, 1)
  const disciplinePts = clamp(15 - overdue * 5, 0, 15)
  const subPts = 10 * clamp(1 - (subTotal / s.budget - 0.03) / 0.07, 0, 1)
  const healthParts: HealthPart[] = [
    { key: 'runway', label: 'Runway', score: runwayPts, max: 30, hint: 'Will your money last all 30 days?' },
    { key: 'adherence', label: 'Spending pace', score: adherencePts, max: 25, hint: 'Daily spend vs. your safe allowance' },
    { key: 'savings', label: 'Savings', score: savingsPts, max: 20, hint: 'Money moved into your goals' },
    { key: 'discipline', label: 'Bills on time', score: disciplinePts, max: 15, hint: 'Overdue commitments cost points' },
    { key: 'subs', label: 'Subscription load', score: subPts, max: 10, hint: 'Recurring costs vs. budget' },
  ]
  const health = Math.round(healthParts.reduce((a, p) => a + p.score, 0))
  const healthLabel = health >= 80 ? 'Excellent' : health >= 60 ? 'Good' : health >= 40 ? 'Needs care' : 'At risk'

  const catMap = new Map<Category, number>()
  for (const t of s.txns) if (t.kind === 'expense') catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount)
  const byCategory = [...catMap.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount)

  return {
    income, spent, savedToGoals, balance, obligations, pendingCommitments, upcomingSubs, overdue, daysLeft,
    safeToSpend, dailyAllowance, burnRate, projectedEnd, runOutDay, forecast, risk, riskLevel, health,
    healthLabel, healthParts, goals, subTotal, byCategory,
  }
}

/** Apply a scenario to a copy of state (pure). */
export function applyScenario(s: AppState, sc: Scenario): AppState {
  const next: AppState = {
    ...s,
    txns: [...s.txns],
    commitments: s.commitments.map((c) => ({ ...c })),
    subs: s.subs.map((x) => ({ ...x })),
    goals: s.goals.map((g) => ({ ...g })),
  }
  switch (sc.type) {
    case 'spend': {
      if (sc.day <= s.day) {
        next.txns.push({ id: uid(), day: s.day, amount: sc.amount, category: sc.category, note: sc.note, kind: 'expense' })
      } else {
        const c: Commitment = { id: uid(), name: sc.note || 'Planned purchase', emoji: '🛒', amount: sc.amount, dueDay: sc.day, paid: false }
        next.commitments.push(c)
      }
      break
    }
    case 'subscribe': {
      const charged = sc.day <= s.day
      next.subs.push({ id: uid(), name: sc.name || 'New subscription', emoji: '🔁', amount: sc.amount, renewalDay: sc.day, active: true, charged })
      if (charged) next.txns.push({ id: uid(), day: s.day, amount: sc.amount, category: 'bills', note: sc.name || 'Subscription', kind: 'expense' })
      break
    }
    case 'cancel': {
      const sub = next.subs.find((x) => x.id === sc.subId)
      if (sub) sub.active = false
      break
    }
    case 'save': {
      const g = next.goals.find((x) => x.id === sc.goalId)
      if (g) {
        g.saved += sc.amount
        next.txns.push({ id: uid(), day: s.day, amount: sc.amount, category: 'other', note: `Saved to ${g.name}`, kind: 'goal', goalId: g.id })
      }
      break
    }
    case 'earn': {
      next.txns.push({ id: uid(), day: s.day, amount: sc.amount, category: 'other', note: sc.note || 'Extra income', kind: 'income' })
      break
    }
  }
  return next
}

export type Verdict = 'safe' | 'caution' | 'risky' | 'danger'

export interface Impact {
  before: Metrics
  after: Metrics
  verdict: Verdict
  headline: string
  ripples: { tone: 'good' | 'warn' | 'bad' | 'info'; text: string }[]
}

export function simulate(s: AppState, sc: Scenario, fmt: (n: number) => string): Impact {
  const before = computeMetrics(s)
  const after = computeMetrics(applyScenario(s, sc))
  const ripples: Impact['ripples'] = []

  const dAllow = after.dailyAllowance - before.dailyAllowance
  if (Math.abs(dAllow) >= 1) {
    const p = before.dailyAllowance > 0 ? Math.round((dAllow / before.dailyAllowance) * 100) : 0
    ripples.push({
      tone: dAllow < 0 ? (p <= -25 ? 'bad' : 'warn') : 'good',
      text: `Daily allowance ${dAllow < 0 ? 'drops' : 'rises'} from ${fmt(before.dailyAllowance)} to ${fmt(after.dailyAllowance)}${p ? ` (${p > 0 ? '+' : ''}${p}%)` : ''}.`,
    })
  }
  if (after.runOutDay !== null && before.runOutDay === null) {
    ripples.push({ tone: 'bad', text: `At your current pace you would run out of money on day ${after.runOutDay}.` })
  } else if (after.runOutDay !== null && before.runOutDay !== null && after.runOutDay !== before.runOutDay) {
    ripples.push({ tone: after.runOutDay < before.runOutDay ? 'bad' : 'good', text: `Money runs out on day ${after.runOutDay} instead of day ${before.runOutDay}.` })
  } else if (after.runOutDay === null && before.runOutDay !== null) {
    ripples.push({ tone: 'good', text: 'This keeps you above ₹0 through day 30.' })
  }
  after.goals.forEach((g, i) => {
    const b = before.goals[i]
    if (!b) return
    if (b.onTrack && !g.onTrack) ripples.push({ tone: 'bad', text: `${g.goal.emoji} ${g.goal.name} falls off track — short by ${fmt(g.shortBy)}.` })
    else if (!b.onTrack && g.onTrack) ripples.push({ tone: 'good', text: `${g.goal.emoji} ${g.goal.name} becomes fully fundable.` })
    else if (!g.onTrack && g.shortBy - b.shortBy >= 50) ripples.push({ tone: 'warn', text: `${g.goal.emoji} ${g.goal.name} gap grows by ${fmt(g.shortBy - b.shortBy)}.` })
  })
  const dRisk = after.risk - before.risk
  if (Math.abs(dRisk) >= 3) {
    ripples.push({ tone: dRisk > 0 ? (after.risk >= 50 ? 'bad' : 'warn') : 'good', text: `Financial risk goes from ${before.riskLevel} (${before.risk}) to ${after.riskLevel} (${after.risk}).` })
  }
  const dHealth = after.health - before.health
  if (Math.abs(dHealth) >= 2) {
    ripples.push({ tone: dHealth < 0 ? (dHealth <= -8 ? 'bad' : 'warn') : 'good', text: `Financial health ${dHealth < 0 ? 'falls' : 'improves'} by ${Math.abs(dHealth)} points to ${after.health}.` })
  }
  if (sc.type === 'subscribe') {
    ripples.push({ tone: 'info', text: `That is ${fmt(sc.amount * 12)} a year if you keep it.` })
  }
  if (sc.type === 'cancel') {
    const sub = s.subs.find((x) => x.id === sc.subId)
    if (sub) ripples.push({ tone: 'info', text: `Frees up ${fmt(sub.amount * 12)} a year.` })
  }
  if (ripples.length === 0) ripples.push({ tone: 'info', text: 'Barely moves the needle — go ahead.' })

  let verdict: Verdict
  if (after.runOutDay !== null && (before.runOutDay === null || after.runOutDay < before.runOutDay) || after.risk >= 75) verdict = 'danger'
  else if (after.risk >= 50 && after.risk > before.risk + 2) verdict = 'risky'
  else if (after.risk > before.risk + 8 || after.health < before.health - 8) verdict = 'caution'
  else if (after.risk > before.risk + 2 && after.risk >= 25) verdict = 'caution'
  else verdict = 'safe'
  if (after.risk < before.risk - 2 || (after.health > before.health + 2 && after.risk <= before.risk)) verdict = 'safe'

  const headline = {
    safe: 'Looks safe — you can afford this.',
    caution: 'Doable, but it tightens your month.',
    risky: 'Risky — you would feel this later.',
    danger: 'Not recommended — it breaks your month.',
  }[verdict]
  return { before, after, verdict, headline, ripples }
}

export const SURPRISES: { note: string; amount: number; emoji: string }[] = [
  { note: 'Phone screen cracked', amount: 1800, emoji: '📱' },
  { note: "Friend's birthday gift", amount: 700, emoji: '🎁' },
  { note: 'Doctor visit + medicines', amount: 650, emoji: '🩺' },
  { note: 'Laptop charger died', amount: 1100, emoji: '🔌' },
  { note: 'Bike puncture & repair', amount: 250, emoji: '🛵' },
  { note: 'Emergency cab ride', amount: 420, emoji: '🚕' },
  { note: 'Group trip split', amount: 900, emoji: '🏖️' },
]

export function txnsForDay(txns: Txn[], day: number) {
  return txns.filter((t) => t.day === day)
}
