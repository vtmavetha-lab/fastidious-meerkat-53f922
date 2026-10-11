import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronsRight, FlaskConical, Home as HomeIcon, ListChecks, LogOut, Receipt } from 'lucide-react'
import type { View } from './lib/types'
import { computeMetrics, TOTAL_DAYS } from './lib/engine'
import { useAppState, useStore } from './lib/store'
import { useAuth } from './lib/auth'
import { inr } from './lib/format'
import Home from './views/Home'
import Simulator from './views/Simulator'
import Plan from './views/Plan'
import Activity from './views/Activity'
import { RiskBadge } from './components/ui'

const TABS: { id: View; label: string; icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'simulate', label: 'Simulate', icon: FlaskConical },
  { id: 'plan', label: 'Plan', icon: ListChecks },
  { id: 'activity', label: 'Activity', icon: Receipt },
]

export default function Shell() {
  const [view, setView] = useState<View>('home')
  const state = useAppState()
  const nextDay = useStore((s) => s.nextDay)
  const session = useAuth((s) => s.session)
  const logout = useAuth((s) => s.logout)
  const m = useMemo(() => computeMetrics(state), [state])
  const done = state.day >= TOTAL_DAYS

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-28 pt-4 md:pb-10">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-lime-400 focus:px-3 focus:py-2 focus:text-ink-950">Skip to content</a>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink-800 ring-1 ring-white/10" aria-hidden>
            <svg viewBox="0 0 32 32" className="h-6 w-6"><path d="M7 22 L14 14 L18 18 L25 9" stroke="#c6f432" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div>
            <h1 className="font-display text-xl font-bold leading-tight tracking-tight">Runway</h1>
            <p className="text-xs text-slate-400">{inr(state.budget)} · 30 days</p>
          </div>
        </div>

        <nav aria-label="Primary" className="hidden rounded-2xl bg-ink-800/80 p-1 ring-1 ring-white/10 md:flex">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setView(t.id)} aria-current={view === t.id ? 'page' : undefined} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${view === t.id ? 'bg-lime-400 text-ink-950' : 'text-slate-300 hover:bg-white/5'}`}>
              <t.icon className="h-4 w-4" aria-hidden /> {t.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <RiskBadge level={m.riskLevel} />
          <button className="btn-ghost" onClick={nextDay} disabled={done} aria-label={done ? 'Month complete' : `Advance from day ${state.day} to day ${state.day + 1}`}>
            <span className="num">Day {state.day}</span>
            <ChevronsRight className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{done ? 'Done' : 'Next day'}</span>
          </button>
          <div className="flex items-center gap-2 rounded-2xl bg-ink-800/80 py-1 pl-1 pr-1 ring-1 ring-white/10 sm:pr-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-500/30 text-sm font-bold text-violet-200" aria-hidden>{(session?.name ?? '?').charAt(0).toUpperCase()}</span>
            <span className="hidden max-w-[110px] truncate text-sm font-medium text-slate-200 sm:inline" title={session?.email}>{session?.name}</span>
            <button onClick={logout} className="grid h-8 w-8 place-items-center rounded-xl text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Log out" title="Log out">
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main id="main">
        <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {view === 'home' && <Home state={state} m={m} go={setView} />}
            {view === 'simulate' && <Simulator state={state} />}
            {view === 'plan' && <Plan state={state} m={m} />}
            {view === 'activity' && <Activity state={state} m={m} />}
        </motion.div>
      </main>

      <nav aria-label="Primary mobile" className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-3xl border border-white/10 bg-ink-800/95 p-1.5 shadow-2xl backdrop-blur md:hidden">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setView(t.id)} aria-current={view === t.id ? 'page' : undefined} className={`flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold ${view === t.id ? 'bg-lime-400 text-ink-950' : 'text-slate-300'}`}>
            <t.icon className="h-5 w-5" aria-hidden /> {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
