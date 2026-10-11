import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { AppState, Metrics } from '../lib/types'
import { TOTAL_DAYS } from '../lib/engine'
import { inr } from '../lib/format'
import { Card, Field, SectionTitle } from '../components/ui'
import { useStore } from '../lib/store'

function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-lime-400' : 'bg-white/15'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink-950 transition-all ${on ? 'left-[22px]' : 'left-0.5 bg-white'}`} />
    </button>
  )
}

export default function Plan({ state, m }: { state: AppState; m: Metrics }) {
  const { payCommitment, addCommitment, toggleSub, addSub, contribute, addGoal } = useStore()
  const [bill, setBill] = useState({ name: '', amount: '', dueDay: String(Math.min(TOTAL_DAYS, state.day + 3)) })
  const [sub, setSub] = useState({ name: '', amount: '', renewalDay: String(Math.min(TOTAL_DAYS, state.day + 5)) })
  const [goal, setGoal] = useState({ name: '', target: '', emoji: '🎯' })

  const submitBill = (e: FormEvent) => {
    e.preventDefault()
    const amount = Number(bill.amount)
    if (!bill.name.trim() || !(amount > 0)) return
    addCommitment({ name: bill.name.trim(), amount, dueDay: Math.min(TOTAL_DAYS, Math.max(1, Number(bill.dueDay) || state.day)) })
    setBill({ ...bill, name: '', amount: '' })
  }
  const submitSub = (e: FormEvent) => {
    e.preventDefault()
    const amount = Number(sub.amount)
    if (!sub.name.trim() || !(amount > 0)) return
    addSub({ name: sub.name.trim(), amount, renewalDay: Math.min(TOTAL_DAYS, Math.max(1, Number(sub.renewalDay) || state.day)) })
    setSub({ ...sub, name: '', amount: '' })
  }
  const submitGoal = (e: FormEvent) => {
    e.preventDefault()
    const target = Number(goal.target)
    if (!goal.name.trim() || !(target > 0)) return
    addGoal({ name: goal.name.trim(), target, emoji: goal.emoji || '🎯' })
    setGoal({ name: '', target: '', emoji: '🎯' })
  }

  const unpaid = state.commitments.filter((c) => !c.paid).sort((a, b) => a.dueDay - b.dueDay)
  const paid = state.commitments.filter((c) => c.paid)

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <Card className="lg:col-span-6" label="Commitments">
        <SectionTitle title="Commitments" hint={`${inr(m.pendingCommitments)} still to pay this month.`} />
        <ul className="divide-y divide-white/5">
          {unpaid.map((c) => {
            const late = c.dueDay < state.day
            return (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-lg" aria-hidden>{c.emoji}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{c.name}</div>
                    <div className={`text-xs ${late ? 'text-rose-300' : 'text-slate-400'}`}>{late ? `Overdue since day ${c.dueDay}` : `Due day ${c.dueDay}`}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="num text-sm font-semibold">{inr(c.amount)}</span>
                  <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => payCommitment(c.id)} aria-label={`Pay ${c.name}`}>Pay now</button>
                </div>
              </li>
            )
          })}
          {paid.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 opacity-50">
              <span className="text-sm">{c.emoji} {c.name}</span>
              <span className="num text-xs">Paid · {inr(c.amount)}</span>
            </li>
          ))}
        </ul>
        <form onSubmit={submitBill} className="mt-4 grid grid-cols-6 gap-2">
          <div className="col-span-6 sm:col-span-3"><Field label="New bill" htmlFor="bill-name"><input id="bill-name" className="input" placeholder="e.g. Tuition fee" value={bill.name} onChange={(e) => setBill({ ...bill, name: e.target.value })} maxLength={40} /></Field></div>
          <div className="col-span-3 sm:col-span-1"><Field label="₹" htmlFor="bill-amt"><input id="bill-amt" type="number" min={1} className="input" value={bill.amount} onChange={(e) => setBill({ ...bill, amount: e.target.value })} /></Field></div>
          <div className="col-span-3 sm:col-span-1"><Field label="Day" htmlFor="bill-day"><input id="bill-day" type="number" min={1} max={TOTAL_DAYS} className="input" value={bill.dueDay} onChange={(e) => setBill({ ...bill, dueDay: e.target.value })} /></Field></div>
          <div className="col-span-6 flex items-end sm:col-span-1"><button className="btn-primary w-full" aria-label="Add bill"><Plus className="h-4 w-4" aria-hidden /></button></div>
        </form>
      </Card>

      <Card className="lg:col-span-6" label="Subscriptions">
        <SectionTitle title="Subscriptions" hint={`${inr(m.subTotal)}/month · ${inr(m.subTotal * 12)}/year if you keep all.`} />
        <ul className="divide-y divide-white/5">
          {state.subs.map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-lg ${x.active ? '' : 'grayscale'}`} aria-hidden>{x.emoji}</span>
                <div className={x.active ? '' : 'opacity-50'}>
                  <div className="text-sm font-medium text-white">{x.name}</div>
                  <div className="text-xs text-slate-400">{x.charged ? `Charged day ${x.renewalDay}` : `Renews day ${x.renewalDay}`} · {inr(x.amount * 12)}/yr</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="num text-sm font-semibold">{inr(x.amount)}</span>
                <Switch on={x.active} onChange={() => toggleSub(x.id)} label={`${x.name} is ${x.active ? 'active' : 'cancelled'}`} />
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={submitSub} className="mt-4 grid grid-cols-6 gap-2">
          <div className="col-span-6 sm:col-span-3"><Field label="New subscription" htmlFor="sub-name"><input id="sub-name" className="input" placeholder="e.g. Cloud storage" value={sub.name} onChange={(e) => setSub({ ...sub, name: e.target.value })} maxLength={40} /></Field></div>
          <div className="col-span-3 sm:col-span-1"><Field label="₹/mo" htmlFor="sub-amt"><input id="sub-amt" type="number" min={1} className="input" value={sub.amount} onChange={(e) => setSub({ ...sub, amount: e.target.value })} /></Field></div>
          <div className="col-span-3 sm:col-span-1"><Field label="Day" htmlFor="sub-day"><input id="sub-day" type="number" min={1} max={TOTAL_DAYS} className="input" value={sub.renewalDay} onChange={(e) => setSub({ ...sub, renewalDay: e.target.value })} /></Field></div>
          <div className="col-span-6 flex items-end sm:col-span-1"><button className="btn-primary w-full" aria-label="Add subscription"><Plus className="h-4 w-4" aria-hidden /></button></div>
        </form>
      </Card>

      <Card className="lg:col-span-12" label="Savings goals">
        <SectionTitle title="Savings goals" hint="Money moved here leaves your spendable balance — pay yourself first." />
        <ul className="grid gap-4 md:grid-cols-2">
          {m.goals.map((g) => {
            const now = Math.min(100, (g.goal.saved / g.goal.target) * 100)
            const proj = Math.min(100, (g.projectedSaved / g.goal.target) * 100)
            return (
              <li key={g.goal.id} className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-white">{g.goal.emoji} {g.goal.name}</div>
                  <span className={`text-xs font-semibold ${g.onTrack ? 'text-emerald-300' : 'text-amber-300'}`}>{g.onTrack ? 'On track' : `Short ${inr(g.shortBy)}`}</span>
                </div>
                <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={g.goal.target} aria-valuenow={g.goal.saved} aria-label={`${g.goal.name} progress`}>
                  <div className="absolute inset-y-0 left-0 rounded-full bg-violet-400/40" style={{ width: `${proj}%` }} />
                  <motion.div className="absolute inset-y-0 left-0 rounded-full bg-lime-400" initial={false} animate={{ width: `${now}%` }} />
                </div>
                <div className="mt-1.5 text-xs text-slate-400">{inr(g.goal.saved)} of {inr(g.goal.target)} · projected {inr(g.projectedSaved)} by day 30</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[100, 250, 500].map((amt) => (
                    <button key={amt} className="chip" disabled={m.balance < amt} onClick={() => contribute(g.goal.id, amt)} aria-label={`Add ${amt} rupees to ${g.goal.name}`}>+{inr(amt)}</button>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
        <form onSubmit={submitGoal} className="mt-5 grid grid-cols-6 gap-2">
          <div className="col-span-2 sm:col-span-1"><Field label="Emoji" htmlFor="goal-emoji"><input id="goal-emoji" className="input text-center" value={goal.emoji} onChange={(e) => setGoal({ ...goal, emoji: e.target.value })} maxLength={2} /></Field></div>
          <div className="col-span-4 sm:col-span-3"><Field label="New goal" htmlFor="goal-name"><input id="goal-name" className="input" placeholder="e.g. Concert fund" value={goal.name} onChange={(e) => setGoal({ ...goal, name: e.target.value })} maxLength={40} /></Field></div>
          <div className="col-span-4 sm:col-span-1"><Field label="Target ₹" htmlFor="goal-target"><input id="goal-target" type="number" min={1} className="input" value={goal.target} onChange={(e) => setGoal({ ...goal, target: e.target.value })} /></Field></div>
          <div className="col-span-2 flex items-end sm:col-span-1"><button className="btn-primary w-full" aria-label="Add goal"><Plus className="h-4 w-4" aria-hidden /></button></div>
        </form>
      </Card>
    </div>
  )
}
