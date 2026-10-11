import { useId, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Category, ForecastPoint } from '../lib/types'
import { CATEGORY_META, inr } from '../lib/format'
import { TOTAL_DAYS } from '../lib/engine'

interface ChartProps {
  points: ForecastPoint[]
  compare?: ForecastPoint[]
  today: number
  height?: number
}

export function ForecastChart({ points, compare, today, height = 230 }: ChartProps) {
  const gid = useId().replace(/:/g, '')
  const ref = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const W = 640
  const H = height
  const pad = { l: 44, r: 12, t: 14, b: 26 }
  const all = [...points, ...(compare ?? [])]
  const maxV = Math.max(...all.map((p) => p.balance), 1000)
  const minV = Math.min(...all.map((p) => p.balance), 0)
  const span = maxV - minV || 1
  const x = (d: number) => pad.l + ((d - 1) / (TOTAL_DAYS - 1)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - (v - minV) / span) * (H - pad.t - pad.b)

  const path = (pts: ForecastPoint[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.balance).toFixed(1)}`).join(' ')
  const actual = points.filter((p) => p.actual)
  const projected = [actual[actual.length - 1], ...points.filter((p) => !p.actual)].filter(Boolean) as ForecastPoint[]
  const cmpProj = compare ? [compare.filter((p) => p.actual).slice(-1)[0], ...compare.filter((p) => !p.actual)].filter(Boolean) as ForecastPoint[] : []

  const ticks = [minV < 0 ? minV : 0, 0, maxV / 2, maxV].filter((v, i, a) => a.indexOf(v) === i)
  const hp = hover !== null ? points.find((p) => p.day === hover) : undefined
  const hc = hover !== null && compare ? compare.find((p) => p.day === hover) : undefined

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const px = ((e.clientX - r.left) / r.width) * W
    const d = Math.round(1 + ((px - pad.l) / (W - pad.l - pad.r)) * (TOTAL_DAYS - 1))
    setHover(Math.min(TOTAL_DAYS, Math.max(1, d)))
  }

  const end = points[points.length - 1]
  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-pan-y select-none"
        role="img"
        aria-label={`Balance forecast over 30 days. Today is day ${today}. Projected balance on day 30 is ${inr(end?.balance ?? 0)}.`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`a${gid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#c6f432" stopOpacity=".35" />
            <stop offset="100%" stopColor="#c6f432" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={v === 0 ? 'rgba(251,113,133,.5)' : 'rgba(255,255,255,.07)'} strokeDasharray={v === 0 ? '4 4' : undefined} />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" className="fill-slate-500" fontSize="11">
              {v >= 1000 || v <= -1000 ? `${Math.round(v / 100) / 10}k` : Math.round(v)}
            </text>
          </g>
        ))}
        {[1, 10, 20, 30].map((d) => (
          <text key={d} x={x(d)} y={H - 6} textAnchor="middle" className="fill-slate-500" fontSize="11">
            D{d}
          </text>
        ))}
        <path d={`${path(actual)} L${x(actual[actual.length - 1]?.day ?? 1)},${y(minV)} L${x(1)},${y(minV)} Z`} fill={`url(#a${gid})`} />
        <motion.path d={path(actual)} fill="none" stroke="#c6f432" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9 }} />
        {compare && <path d={path(cmpProj)} fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" />}
        <path d={path(projected)} fill="none" stroke={compare ? 'rgba(198,244,50,.55)' : '#c6f432'} strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" opacity={compare ? 1 : 0.75} />
        <line x1={x(today)} x2={x(today)} y1={pad.t} y2={H - pad.b} stroke="rgba(255,255,255,.25)" />
        <circle cx={x(today)} cy={y(actual[actual.length - 1]?.balance ?? 0)} r="5" fill="#c6f432" stroke="#07080d" strokeWidth="2" />
        {hover !== null && hp && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="rgba(255,255,255,.35)" />
            <circle cx={x(hover)} cy={y(hp.balance)} r="4.5" fill="#fff" />
          </g>
        )}
      </svg>
      {hover !== null && hp && (
        <div className="pointer-events-none absolute left-2 top-1 rounded-xl border border-white/10 bg-ink-900/95 px-3 py-1.5 text-xs shadow-lg" aria-hidden>
          <div className="text-slate-400">Day {hover} · {hp.actual ? 'actual' : 'forecast'}</div>
          <div className="num text-sm font-semibold text-white">{inr(hp.balance)}</div>
          {hc && <div className="num text-violet-300">With decision: {inr(hc.balance)}</div>}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 bg-lime-400" />Actual</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 border-t-2 border-dashed border-lime-400/70" />Forecast</span>
        {compare && <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 border-t-2 border-dashed border-violet-400" />With this decision</span>}
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 border-t-2 border-dashed border-rose-400/60" />₹0 line</span>
      </div>
    </div>
  )
}

export function Ring({ value, max = 100, color, size = 132, stroke = 12, label, sub }: { value: number; max?: number; color: string; size?: number; stroke?: number; label: string; sub?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const frac = Math.min(1, Math.max(0, value / max))
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${Math.round(value)} out of ${max}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.08)" strokeWidth={stroke} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - frac) }} transition={{ duration: 0.9, ease: 'easeOut' }} />
      </svg>
      <div className="absolute text-center">
        <div className="num text-3xl font-bold text-white">{Math.round(value)}</div>
        {sub && <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color }}>{sub}</div>}
      </div>
    </div>
  )
}

export function RiskMeter({ score, color }: { score: number; color: string }) {
  return (
    <div>
      <div className="relative h-3 overflow-hidden rounded-full bg-gradient-to-r from-emerald-400/70 via-amber-400/70 to-rose-500/80" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label="Financial risk">
        <motion.div className="absolute top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-full bg-white shadow" style={{ boxShadow: `0 0 0 3px ${color}55` }} initial={false} animate={{ left: `calc(${score}% - 3px)` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
        <span>Low</span><span>Moderate</span><span>High</span><span>Critical</span>
      </div>
    </div>
  )
}

export function CategoryBars({ data }: { data: { category: Category; amount: number }[] }) {
  const total = data.reduce((a, d) => a + d.amount, 0) || 1
  return (
    <ul className="space-y-2.5">
      {data.map((d) => {
        const m = CATEGORY_META[d.category]
        const p = (d.amount / total) * 100
        return (
          <li key={d.category}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-slate-200">{m.emoji} {m.label}</span>
              <span className="num text-slate-300">{inr(d.amount)} <span className="text-slate-500">· {Math.round(p)}%</span></span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div className="h-full rounded-full" style={{ background: m.color }} initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 0.7 }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
