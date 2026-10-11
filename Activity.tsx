import { useMemo, useState, type FormEvent } from 'react'
import { Database, RotateCcw, Zap } from 'lucide-react'
import type { AppState, Category, Metrics } from '../lib/types'
import { CATEGORY_META, inr } from '../lib/format'
import { Card, Field, SectionTitle } from '../components/ui'
import { CategoryBars } from '../components/charts'
import { useStore } from '../lib/store'

export default function Activity({ state, m }: { state: AppState; m: Metrics }) {
  const { addExpense, addIncome, setSurprises, triggerSurprise, loadDemo, resetToDayOne } = useStore()
  const [kind, setKind] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>('food')
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState<'all' | Category>('all')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const a = Number(amount)
    if (!(a > 0)) return
    if (kind === 'expense') addExpense({ amount: a, category, note: note.trim() })
    else addIncome({ amount: a, note: note.trim() })
    setAmount('')
    setNote('')
  }

  const grouped = useMemo(() => {
    const list = state.txns.filter((t) => filter === 'all' || t.category === filter)
    const map = new Map<number, typeof list>()
    for (const t of [...list].reverse()) map.set(t.day, [...(map.get(t.day) ?? []), t])
    return [...map.entries()].sort((a, b) => b[0] - a[0])
  }, [state.txns, filter])

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="space-y-5 lg:col-span-5">
        <Card label="Log a transaction">
          <SectionTitle title={`Log for day ${state.day}`} />
          <div role="tablist" aria-label="Transaction type" className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-ink-900 p-1">
            {(['expense', 'income'] as const).map((k) => (
              <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className={`rounded-xl py-2 text-sm font-semibold capitalize ${kind === k ? 'bg-lime-400 text-ink-950' : 'text-slate-300 hover:bg-white/5'}`}>{k}</button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Amount (₹)" htmlFor="tx-amt"><input id="tx-amt" type="number" min={1} inputMode="numeric" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required /></Field>
            {kind === 'expense' && (
              <Field label="Category" htmlFor="tx-cat">
                <select id="tx-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                  {Object.entries(CATEGORY_META).filter(([k]) => k !== 'bills').map(([k, c]) => <option key={k} value={k}>{c.emoji} {c.label}</option>)}
                </select>
              </Field>
            )}
            <Field label="Note" htmlFor="tx-note"><input id="tx-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={kind === 'expense' ? 'Lunch, cab, snacks…' : 'Pocket money, gig…'} maxLength={40} /></Field>
            <button className="btn-primary w-full" type="submit">{kind === 'expense' ? 'Add expense' : 'Add income'}</button>
          </form>
        </Card>

        <Card label="Life happens">
          <SectionTitle title="Life happens" hint="Unexpected costs are part of real money. Test how your plan holds up." right={<Zap className="h-5 w-5 text-amber-300" aria-hidden />} />
          <button className="btn-ghost w-full" onClick={triggerSurprise}>⚡ Hit me with a surprise expense</button>
          <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 text-sm text-slate-300">
            <span>Random surprises when a day passes</span>
            <input type="checkbox" className="h-5 w-5" checked={state.surprises} onChange={(e) => setSurprises(e.target.checked)} />
          </label>
        </Card>

        <Card label="Spending by category">
          <SectionTitle title="Where it went" hint={`${inr(m.spent)} spent so far.`} />
          {m.byCategory.length ? <CategoryBars data={m.byCategory} /> : <p className="text-sm text-slate-400">No spending yet.</p>}
        </Card>

        <Card label="Demo controls">
          <SectionTitle title="Month controls" />
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={loadDemo}><Database className="h-4 w-4" aria-hidden /> Load day-9 demo</button>
            <button className="btn-ghost" onClick={resetToDayOne}><RotateCcw className="h-4 w-4" aria-hidden /> Start fresh (day 1)</button>
          </div>
        </Card>
      </div>

      <Card className="lg:col-span-7" label="Transaction history">
        <SectionTitle title="Activity" hint={`${state.txns.length} transactions this month`} />
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {(['all', ...Object.keys(CATEGORY_META)] as ('all' | Category)[]).map((c) => (
            <button key={c} className={`chip ${filter === c ? '!border-lime-400/60 !bg-lime-400/15 !text-lime-300' : ''}`} aria-pressed={filter === c} onClick={() => setFilter(c)}>
              {c === 'all' ? 'All' : `${CATEGORY_META[c].emoji} ${CATEGORY_META[c].label}`}
            </button>
          ))}
        </div>
        {grouped.length === 0 && <p className="text-sm text-slate-400">Nothing here yet. Log your first transaction.</p>}
        <div className="space-y-5">
          {grouped.map(([day, list]) => (
            <div key={day}>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Day {day}{day === state.day ? ' · today' : ''}</h3>
              <ul className="divide-y divide-white/5">
                {list.map((t) => {
                  const meta = CATEGORY_META[t.category]
                  const out = t.kind !== 'income'
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-xl text-lg" style={{ background: `${meta.color}22` }} aria-hidden>{t.kind === 'goal' ? '🎯' : t.kind === 'income' ? '💸' : meta.emoji}</span>
                        <div>
                          <div className="text-sm font-medium text-white">{t.note}</div>
                          <div className="text-xs text-slate-400">{t.kind === 'goal' ? 'Savings' : t.kind === 'income' ? 'Income' : meta.label}</div>
                        </div>
                      </div>
                      <span className={`num text-sm font-semibold ${out ? 'text-slate-100' : 'text-emerald-300'}`}>{out ? '-' : '+'}{inr(t.amount)}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
