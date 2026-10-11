import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, ShieldAlert, ShieldCheck, Sparkles, TriangleAlert, Undo2, Zap } from 'lucide-react'
import type { AppState, Category, Scenario } from '../lib/types'
import { simulate, SURPRISES, TOTAL_DAYS, type Verdict } from '../lib/engine'
import { CATEGORY_META, inr } from '../lib/format'
import { Card, Field, RiskBadge, SectionTitle } from '../components/ui'
import { ForecastChart } from '../components/charts'
import { useStore } from '../lib/store'

type Mode = Scenario['type']

const MODES: { id: Mode; label: string }[] = [
  { id: 'spend', label: 'Spend' },
  { id: 'subscribe', label: 'Subscribe' },
  { id: 'cancel', label: 'Cancel sub' },
  { id: 'save', label: 'Save' },
  { id: 'earn', label: 'Earn' },
]

const SPEND_PRESETS: { label: string; amount: number; category: Category }[] = [
  { label: '🎤 Concert ticket', amount: 2500, category: 'fun' },
  { label: '👟 New sneakers', amount: 3499, category: 'shopping' },
  { label: '🍕 Dinner out', amount: 600, category: 'food' },
  { label: '🛵 Weekend ride', amount: 450, category: 'transport' },
  { label: '🛒 Online sale haul', amount: 1200, category: 'shopping' },
]
const SUB_PRESETS = [
  { name: 'Swiggy One', amount: 149 },
  { name: 'Prime Video', amount: 179 },
  { name: 'Hotstar', amount: 299 },
  { name: 'Canva Pro', amount: 399 },
]

const VERDICT: Record<Verdict, { icon: typeof Check; cls: string; ring: string }> = {
  safe: { icon: ShieldCheck, cls: 'text-emerald-300', ring: 'border-emerald-400/30 bg-emerald-400/10' },
  caution: { icon: TriangleAlert, cls: 'text-amber-300', ring: 'border-amber-400/30 bg-amber-400/10' },
  risky: { icon: ShieldAlert, cls: 'text-orange-300', ring: 'border-orange-400/30 bg-orange-400/10' },
  danger: { icon: ShieldAlert, cls: 'text-rose-300', ring: 'border-rose-400/30 bg-rose-400/10' },
}
const RIPPLE: Record<string, string> = { good: 'bg-emerald-400', warn: 'bg-amber-400', bad: 'bg-rose-400', info: 'bg-sky-400' }

function Delta({ before, after, fmt, higherBetter = true }: { before: number; after: number; fmt: (n: number) => string; higherBetter?: boolean }) {
  const d = after - before
  const changed = Math.abs(d) >= 0.5
  const good = higherBetter ? d > 0 : d < 0
  return (
    <div className="text-right">
      <div className="num text-lg font-bold text-white">{fmt(after)}</div>
      <div className={`num text-xs ${!changed ? 'text-slate-500' : good ? 'text-emerald-300' : 'text-rose-300'}`}>
        {changed ? `${d > 0 ? '▲' : '▼'} ${fmt(Math.abs(d))}` : 'no change'}
      </div>
    </div>
  )
}

export default function Simulator({ state }: { state: AppState }) {
  const commit = useStore((s) => s.commit)
  const push = useStore.setState
  const [mode, setMode] = useState<Mode>('spend')
  const [amount, setAmount] = useState(1500)
  const [category, setCategory] = useState<Category>('fun')
  const [note, setNote] = useState('Concert ticket')
  const [day, setDay] = useState(state.day)
  const [subId, setSubId] = useState('')
  const [goalId, setGoalId] = useState(state.goals[0]?.id ?? '')
  const [applied, setApplied] = useState(false)

  const activeSubs = state.subs.filter((x) => x.active)
  const effSubId = activeSubs.some((x) => x.id === subId) ? subId : activeSubs[0]?.id ?? ''
  const effGoalId = state.goals.some((g) => g.id === goalId) ? goalId : state.goals[0]?.id ?? ''
  const effDay = Math.max(state.day, Math.min(TOTAL_DAYS, day))

  const scenario: Scenario | null = useMemo(() => {
    if (mode === 'cancel') return effSubId ? { type: 'cancel', subId: effSubId } : null
    if (!(amount > 0)) return null
    switch (mode) {
      case 'spend': return { type: 'spend', amount, category, note: note || 'Purchase', day: effDay }
      case 'subscribe': return { type: 'subscribe', amount, name: note || 'New subscription', day: effDay }
      case 'save': return effGoalId ? { type: 'save', amount, goalId: effGoalId } : null
      case 'earn': return { type: 'earn', amount, note: note || 'Extra income' }
    }
  }, [mode, amount, category, note, effDay, effSubId, effGoalId])

  const impact = useMemo(() => (scenario ? simulate(state, scenario, inr) : null), [state, scenario])

  const maxAmount = 5000
  const v = impact ? VERDICT[impact.verdict] : null
  const goalsOn = (i: NonNullable<typeof impact>['before']) => i.goals.filter((g) => g.onTrack).length

  const doCommit = () => {
    if (!scenario) return
    commit(scenario)
    push((s) => ({ toasts: [...s.toasts, { id: Math.random().toString(36).slice(2), tone: 'good', text: 'Decision applied — your dashboard has updated.' }] }))
    setApplied(true)
    setTimeout(() => setApplied(false), 2000)
  }

  const loadSpend = (label: string, amt: number, cat: Category) => {
    setMode('spend'); setAmount(amt); setCategory(cat); setNote(label.replace(/^\S+\s/, '')); setDay(state.day)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <Card className="lg:col-span-5" label="Decision builder">
        <SectionTitle title="Decision simulator" hint="Test a choice. Nothing changes until you commit." right={<Sparkles className="h-5 w-5 text-lime-400" aria-hidden />} />

        <div role="tablist" aria-label="Decision type" className="mb-4 flex flex-wrap gap-1.5 rounded-2xl bg-ink-900 p-1">
          {MODES.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={mode === x.id}
              onClick={() => {
                setMode(x.id)
                if (x.id === 'subscribe') { setNote('Swiggy One'); setAmount(149) }
                if (x.id === 'earn') { setNote('Freelance gig'); setAmount(1000) }
                if (x.id === 'save') setAmount(500)
                if (x.id === 'spend') { setNote('Concert ticket'); setAmount(1500) }
              }}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${mode === x.id ? 'bg-lime-400 text-ink-950' : 'text-slate-300 hover:bg-white/5'}`}
            >
              {x.label}
            </button>
          ))}
        </div>

        {mode === 'spend' && (
          <div className="mb-4">
            <div className="label">Quick picks</div>
            <div className="flex flex-wrap gap-2">
              {SPEND_PRESETS.map((p) => (
                <button key={p.label} className="chip" onClick={() => loadSpend(p.label, p.amount, p.category)}>
                  {p.label} · {inr(p.amount)}
                </button>
              ))}
            </div>
            <div className="label mt-3 flex items-center gap-1.5"><Zap className="h-3 w-3" aria-hidden /> Stress test: unexpected expense</div>
            <div className="flex flex-wrap gap-2">
              {SURPRISES.slice(0, 5).map((p) => (
                <button key={p.note} className="chip" onClick={() => { setMode('spend'); setAmount(p.amount); setCategory('unexpected'); setNote(p.note); setDay(state.day) }}>
                  {p.emoji} {p.note} · {inr(p.amount)}
                </button>
              ))}
            </div>
          </div>
        )}
        {mode === 'subscribe' && (
          <div className="mb-4 flex flex-wrap gap-2">
            {SUB_PRESETS.map((p) => (
              <button key={p.name} className="chip" onClick={() => { setNote(p.name); setAmount(p.amount) }}>
                {p.name} · {inr(p.amount)}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {mode === 'cancel' ? (
            <Field label="Which subscription?" htmlFor="sim-sub">
              {activeSubs.length === 0 ? (
                <p className="text-sm text-slate-400">No active subscriptions left to cancel.</p>
              ) : (
                <select id="sim-sub" className="input" value={effSubId} onChange={(e) => setSubId(e.target.value)}>
                  {activeSubs.map((x) => (
                    <option key={x.id} value={x.id}>{x.emoji} {x.name} — {inr(x.amount)}/mo{x.charged ? ' (already charged)' : ''}</option>
                  ))}
                </select>
              )}
            </Field>
          ) : (
            <>
              <Field label={`Amount: ${inr(amount)}`} htmlFor="sim-amount">
                <input id="sim-amount" type="range" min={50} max={maxAmount} step={50} value={Math.min(amount, maxAmount)} onChange={(e) => setAmount(Number(e.target.value))} className="w-full" />
                <input aria-label="Amount in rupees" type="number" min={1} inputMode="numeric" className="input mt-2" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} />
              </Field>
              {mode !== 'save' && (
                <Field label={mode === 'subscribe' ? 'Name' : mode === 'earn' ? 'Source' : 'What is it?'} htmlFor="sim-note">
                  <input id="sim-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={40} />
                </Field>
              )}
              {mode === 'spend' && (
                <Field label="Category" htmlFor="sim-cat">
                  <select id="sim-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                    {Object.entries(CATEGORY_META).filter(([k]) => k !== 'bills').map(([k, c]) => <option key={k} value={k}>{c.emoji} {c.label}</option>)}
                  </select>
                </Field>
              )}
              {(mode === 'spend' || mode === 'subscribe') && (
                <Field label={`${mode === 'subscribe' ? 'Starts' : 'When'}: ${effDay === state.day ? 'today' : `day ${effDay}`}`} htmlFor="sim-day">
                  <input id="sim-day" type="range" min={state.day} max={TOTAL_DAYS} value={effDay} onChange={(e) => setDay(Number(e.target.value))} className="w-full" disabled={state.day >= TOTAL_DAYS} />
                </Field>
              )}
              {mode === 'save' && (
                <Field label="Into which goal?" htmlFor="sim-goal">
                  <select id="sim-goal" className="input" value={effGoalId} onChange={(e) => setGoalId(e.target.value)}>
                    {state.goals.map((g) => <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>)}
                  </select>
                </Field>
              )}
            </>
          )}
        </div>
      </Card>

      <div className="space-y-5 lg:col-span-7">
        {impact && v ? (
          <>
            <motion.div key={impact.verdict} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl border p-5 ${v.ring}`} role="status" aria-live="polite">
              <div className="flex items-start gap-3">
                <v.icon className={`mt-0.5 h-6 w-6 shrink-0 ${v.cls}`} aria-hidden />
                <div className="flex-1">
                  <h2 className={`font-display text-lg font-semibold ${v.cls}`}>{impact.headline}</h2>
                  <ul className="mt-2 space-y-1.5">
                    {impact.ripples.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-200">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${RIPPLE[r.tone]}`} aria-hidden />
                        {r.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            <Card label="Before and after">
              <SectionTitle title="Before → after" right={<div className="flex items-center gap-2 text-xs text-slate-400"><RiskBadge level={impact.before.riskLevel} /> <ArrowRight className="h-3 w-3" aria-hidden /> <RiskBadge level={impact.after.riskLevel} /></div>} />
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { k: 'Balance', b: impact.before.balance, a: impact.after.balance, f: inr, hb: true },
                  { k: 'Daily allowance', b: impact.before.dailyAllowance, a: impact.after.dailyAllowance, f: inr, hb: true },
                  { k: 'Day-30 forecast', b: impact.before.projectedEnd, a: impact.after.projectedEnd, f: inr, hb: true },
                  { k: 'Risk score', b: impact.before.risk, a: impact.after.risk, f: (n: number) => String(Math.round(n)), hb: false },
                  { k: 'Health score', b: impact.before.health, a: impact.after.health, f: (n: number) => String(Math.round(n)), hb: true },
                  { k: 'Goals on track', b: goalsOn(impact.before), a: goalsOn(impact.after), f: (n: number) => `${Math.round(n)}/${state.goals.length}`, hb: true },
                ].map((r) => (
                  <div key={r.k} className="rounded-2xl bg-white/5 p-3">
                    <dt className="text-[11px] uppercase tracking-wider text-slate-400">{r.k}</dt>
                    <dd className="mt-1 flex items-end justify-between gap-2">
                      <span className="num text-xs text-slate-500">{r.f(r.b)}</span>
                      <Delta before={r.b} after={r.a} fmt={r.f} higherBetter={r.hb} />
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card label="Forecast comparison">
              <SectionTitle title="Month forecast with this decision" />
              <ForecastChart points={impact.before.forecast} compare={impact.after.forecast} today={state.day} height={210} />
            </Card>

            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" onClick={doCommit} disabled={!scenario}>
                <AnimatePresence mode="wait" initial={false}>
                  {applied ? (
                    <motion.span key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2"><Check className="h-4 w-4" aria-hidden /> Applied</motion.span>
                  ) : (
                    <motion.span key="go" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Commit this decision</motion.span>
                  )}
                </AnimatePresence>
              </button>
              <button className="btn-ghost" onClick={() => { setAmount(500); setDay(state.day) }}>
                <Undo2 className="h-4 w-4" aria-hidden /> Reset
              </button>
            </div>
          </>
        ) : (
          <Card><p className="text-sm text-slate-400">Enter an amount to see how this decision ripples through your month.</p></Card>
        )}
      </div>
    </div>
  )
}
