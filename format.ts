const nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export const inr = (n: number): string => {
  const r = Math.round(n)
  return `${r < 0 ? '-' : ''}₹${nf.format(Math.abs(r))}`
}

export const signedInr = (n: number): string => {
  const r = Math.round(n)
  if (r === 0) return '₹0'
  return `${r > 0 ? '+' : '-'}₹${nf.format(Math.abs(r))}`
}

export const pct = (n: number): string => `${Math.round(n)}%`

export const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n))

export const uid = (): string => Math.random().toString(36).slice(2, 10)

export const CATEGORY_META: Record<string, { label: string; emoji: string; color: string }> = {
  food: { label: 'Food', emoji: '🍜', color: '#fb923c' },
  transport: { label: 'Transport', emoji: '🚌', color: '#38bdf8' },
  shopping: { label: 'Shopping', emoji: '🛍️', color: '#f472b6' },
  fun: { label: 'Fun', emoji: '🎮', color: '#a78bfa' },
  bills: { label: 'Bills', emoji: '🧾', color: '#94a3b8' },
  health: { label: 'Health', emoji: '💊', color: '#34d399' },
  learning: { label: 'Learning', emoji: '📚', color: '#facc15' },
  unexpected: { label: 'Unexpected', emoji: '⚡', color: '#f87171' },
  other: { label: 'Other', emoji: '✨', color: '#cbd5e1' },
}
