import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, CalendarClock, FlaskConical, Lightbulb, PartyPopper, Target } from 'lucide-react'
import type { AppState, Metrics, View } from '../lib/types'
import { BUFFER, TOTAL_DAYS } from '../lib/engine'
import { CATEGORY_META, inr } from '../lib/format'
import { AnimatedNumber, Card, RISK_STYLE, RiskBadge, SectionTitle, healthColor } from '../components/ui'
import { CategoryBars, ForecastChart, Ring, RiskMeter } from '../components/charts'

interface Props {
  state: AppState
  m: Metrics
  go: (v: View) => void
}

function buildNudges(s: AppState, m: Metrics): { tone: 'bad' | 'warn' | 'good' | 'info'; text: string }[] {
  const out: { tone: 'bad' | 'warn' | 'good' | 'info'; text: string }[] = []
  if (m.runOutDay !== null) {
    const trim = Math.max(0, m.burnRate - m.dailyAllowance)
    out.push({ tone: 'bad', text: `At your current pace you hit ₹0 around day ${m.runOutDay}. Trimming about ${inr(trim)} a day keeps you afloat.` })
  } else if (m.burnRate > m.dailyAllowance * 1.05 && m.dailyAllowance > 0) {
    out.push({ tone: 'warn', text: `You are spending ${inr(m.burnRate)}/day against a safe ${inr(m.dailyAllowance)}/day. Ease off a little.` })
  } else {
    out.push({ tone: 'good', text: `Nice pace — you are inside your ${inr(m.dailyAllowance)}/day allowance.` })
  }
  if (m.overdue > 0) out.push({ tone: 'bad', text: `${m.overdue} bill${m.overdue > 1 ? 's are' : ' is'} overdue. Paying them protects your health score.` })
  if (m.subTotal / s.budget > 0.07) out.push({ tone: 'warn', text: `Subscriptions take ${Math.round((m.subTotal / s.budget) * 100)}% of your budget (${inr(m.subTotal)}/mo). Try the cancel what-if.` })
  const top = m.byCategory.find((c) => c.category !== 'bills')
  if (top) out.push({ tone: 'info', text: `${CATEGORY_META[top.category].emoji} ${CATEGORY_META[top.category].label} is your biggest non-bill spend at ${inr(top.amount)}.` })
  if (m.projectedEnd > BUFFER + 500) out.push({ tone: 'good', text: `You could end the month with about ${inr(m.projectedEnd)} spare — a good moment to fund a goal.` })
  return out.slice(0, 4)
}

const toneCls = { bad: 'text-rose-300', warn: 'text-amber-300', good: 'text-emerald-300', info: 'text-sky-300' }

export default function Home({ state, m, go }: Props) {
  const risk = RISK_STYLE[m.riskLevel]
  const upcoming = [
    ...state.commitments.filter((c) => !c.paid).map((c) => ({ id: c.id, name: c.name, emoji: c.emoji, amount: c.amount, day: c.dueDay, kind: 'Bill' })),
    ...state.subs.filter((x) => x.active && !x.charged).map((x) => ({ id: x.id, name: x.name, emoji: x.emoji, amount: x.amount, day: x.renewalDay, kind: 'Renews' })),
  ].sort((a, b) => a.day - b.day)
  const nudges = buildNudges(state, m)
  const progress = (state.day / TOTAL_DAYS) * 100

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      {state.day >= TOTAL_DAYS && (
        <Card className="lg:col-span-12 border-lime-400/30 bg-lime-400/5">
          <div className="flex items-start gap-3">
            <PartyPopper className="mt-0.5 h-6 w-6 text-lime-400" aria-hidden />
            <div>
              <h2 className="font-display text-lg font-semibold">Month complete!</h2>
              <p className="text-sm text-slate-300">
                You finish with {inr(m.balance - m.obligations)} after remaining bills, {inr(m.savedToGoals)} tucked into goals, and a health score of {m.health}. Reset to day 1 in Activity to try a different strategy.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="relative overflow-hidden lg:col-span-7" label="Balance overview">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lime-400/10 blur-3xl" aria-hidden />
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-400">
          <span>Balance left</span>
          <RiskBadge level={m.riskLevel} score={m.risk} />
        </div>
        <div className="mt-2 flex items-end gap-3">
          <AnimatedNumber value={m.balance} className="text-5xl font-bold text-white sm:text-6xl" />
          <span className="pb-2 text-sm text-slate-400">of {inr(m.income)}</span>
        </div>
        <div className="mt-4" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_DAYS} aria-valuenow={state.day} aria-label="Days elapsed">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-lime-400 to-violet-400" initial={false} animate={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-slate-400">
            <span>Day {state.day} of {TOTAL_DAYS}</span>
            <span>{m.daysLeft} day{m.daysLeft > 1 ? 's' : ''} left</span>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/5 p-3">
            <dt className="text-[11px] uppercase tracking-wider text-slate-400">Safe / day</dt>
            <dd className="num mt-1 text-xl font-bold text-lime-400"><AnimatedNumber value={m.dailyAllowance} /></dd>
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <dt className="text-[11px] uppercase tracking-wider text-slate-400">Bills ahead</dt>
            <dd className="num mt-1 text-xl font-bold text-white"><AnimatedNumber value={m.obligations} /></dd>
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <dt className="text-[11px] uppercase tracking-wider text-slate-400">Day-30 forecast</dt>
            <dd className={`num mt-1 text-xl font-bold ${m.projectedEnd < 0 ? 'text-rose-300' : 'text-white'}`}><AnimatedNumber value={m.projectedEnd} /></dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          Safe / day = (balance − upcoming bills − {inr(BUFFER)} cushion) ÷ days left. Your recent pace is {inr(m.burnRate)}/day.
        </p>
        <button className="btn-primary mt-4" onClick={() => go('simulate')}>
          <FlaskConical className="h-4 w-4" aria-hidden /> Try a what-if before you spend
        </button>
      </Card>

      <Card className="lg:col-span-5" label="Financial health and risk">
        <SectionTitle title="Health & risk" hint="Both move every time you make a decision." />
        <div className="flex items-center gap-5">
          <Ring value={m.health} color={healthColor(m.health)} sub={m.healthLabel} label="Financial health" />
          <ul className="flex-1 space-y-2">
            {m.healthParts.map((p) => (
              <li key={p.key} title={p.hint}>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>{p.label}</span>
                  <span className="num text-slate-400">{Math.round(p.score)}/{p.max}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div className="h-full rounded-full" style={{ background: healthColor((p.score / p.max) * 100) }} initial={false} animate={{ width: `${(p.score / p.max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-200">Financial risk</span>
            <span className={`font-semibold ${risk.text}`}>{m.riskLevel}</span>
          </div>
          <RiskMeter score={m.risk} color={risk.hex} />
        </div>
      </Card>

      <Card className="lg:col-span-8" label="Month forecast">
        <SectionTitle
          title="Your 30-day runway"
          hint={m.runOutDay ? `Heads up: money runs out on day ${m.runOutDay} at this pace.` : 'You stay above ₹0 all month at this pace.'}
        />
        <ForecastChart points={m.forecast} today={state.day} />
      </Card>

      <Card className="lg:col-span-4" label="Smart nudges">
        <SectionTitle title="Nudges" />
        <ul className="space-y-3">
          {nudges.map((n, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-slate-300">
              {n.tone === 'bad' || n.tone === 'warn' ? (
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${toneCls[n.tone]}`} aria-hidden />
              ) : (
                <Lightbulb className={`mt-0.5 h-4 w-4 shrink-0 ${toneCls[n.tone]}`} aria-hidden />
              )}
              <span>{n.text}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="lg:col-span-6" label="Upcoming payments">
        <SectionTitle title="Coming up" hint="Bills and renewals still to hit your balance." right={<CalendarClock className="h-5 w-5 text-slate-500" aria-hidden />} />
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing left to pay this month. 🎉</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {upcoming.slice(0, 6).map((u) => {
              const d = u.day - state.day
              const late = d < 0
              return (
                <li key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-lg" aria-hidden>{u.emoji}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{u.name}</div>
                      <div className={`text-xs ${late ? 'text-rose-300' : 'text-slate-400'}`}>
                        {u.kind} · {late ? `${-d} day${-d > 1 ? 's' : ''} overdue` : d === 0 ? 'today' : `in ${d} day${d > 1 ? 's' : ''} (day ${u.day})`}
                      </div>
                    </div>
                  </div>
                  <span className="num text-sm font-semibold text-white">{inr(u.amount)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card className="lg:col-span-6" label="Savings goals and spending mix">
        <SectionTitle title="Goals & spending" right={<button className="chip" onClick={() => go('plan')}>Manage <ArrowRight className="h-3 w-3" aria-hidden /></button>} />
        <ul className="mb-5 space-y-3">
          {m.goals.map((g) => {
            const now = (g.goal.saved / g.goal.target) * 100
            const proj = (g.projectedSaved / g.goal.target) * 100
            return (
              <li key={g.goal.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-slate-200"><Target className="h-3.5 w-3.5 text-slate-500" aria-hidden />{g.goal.emoji} {g.goal.name}</span>
                  <span className={`text-xs font-medium ${g.onTrack ? 'text-emerald-300' : 'text-amber-300'}`}>{g.onTrack ? 'On track' : `Short ${inr(g.shortBy)}`}</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-violet-400/40" style={{ width: `${Math.min(100, proj)}%` }} />
                  <div className="absolute inset-y-0 left-0 rounded-full bg-lime-400" style={{ width: `${Math.min(100, now)}%` }} />
                </div>
                <div className="mt-1 text-xs text-slate-500">{inr(g.goal.saved)} saved · {inr(g.projectedSaved)} projected of {inr(g.goal.target)}</div>
              </li>
            )
          })}
        </ul>
        {m.byCategory.length > 0 && <CategoryBars data={m.byCategory.slice(0, 5)} />}
      </Card>
    </div>
  )
}
