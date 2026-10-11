import { useEffect, useState, type ReactNode } from 'react'
import { animate, useMotionValue } from 'framer-motion'
import { inr } from '../lib/format'
import type { RiskLevel } from '../lib/types'

export function AnimatedNumber({ value, format = inr, className = '' }: { value: number; format?: (n: number) => string; className?: string }) {
  const mv = useMotionValue(value)
  const [text, setText] = useState(() => format(value))
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.6, ease: 'easeOut' })
    const unsub = mv.on('change', (v) => setText(format(v)))
    return () => {
      controls.stop()
      unsub()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return <span className={`num ${className}`}>{text}</span>
}

export function Card({ children, className = '', as: Tag = 'section', label }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article'; label?: string }) {
  return (
    <Tag className={`card ${className}`} aria-label={label}>
      {children}
    </Tag>
  )
}

export function SectionTitle({ title, hint, right }: { title: string; hint?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight text-white">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-slate-400">{hint}</p>}
      </div>
      {right}
    </div>
  )
}

export const RISK_STYLE: Record<RiskLevel, { text: string; bg: string; ring: string; hex: string }> = {
  Low: { text: 'text-emerald-300', bg: 'bg-emerald-400/10', ring: 'border-emerald-400/30', hex: '#34d399' },
  Moderate: { text: 'text-amber-300', bg: 'bg-amber-400/10', ring: 'border-amber-400/30', hex: '#fbbf24' },
  High: { text: 'text-orange-300', bg: 'bg-orange-400/10', ring: 'border-orange-400/30', hex: '#fb923c' },
  Critical: { text: 'text-rose-300', bg: 'bg-rose-400/10', ring: 'border-rose-400/30', hex: '#fb7185' },
}

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const st = RISK_STYLE[level]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${st.text} ${st.bg} ${st.ring}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.hex }} aria-hidden />
      {level} risk{score !== undefined ? ` · ${score}` : ''}
    </span>
  )
}

export function healthColor(score: number): string {
  return score >= 80 ? '#34d399' : score >= 60 ? '#c6f432' : score >= 40 ? '#fbbf24' : '#fb7185'
}

export function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
    </div>
  )
}
