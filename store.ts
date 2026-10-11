import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, Category, Scenario } from './types'
import { applyScenario, SURPRISES, TOTAL_DAYS } from './engine'
import { demoState, freshState } from './seed'
import { uid } from './format'
import { readSession, storageNameFor } from './session'

export interface Toast {
  id: string
  tone: 'info' | 'good' | 'bad'
  text: string
}

interface Store extends AppState {
  toasts: Toast[]
  dismissToast: (id: string) => void
  addExpense: (p: { amount: number; category: Category; note: string }) => void
  addIncome: (p: { amount: number; note: string }) => void
  payCommitment: (id: string) => void
  addCommitment: (p: { name: string; amount: number; dueDay: number }) => void
  toggleSub: (id: string) => void
  addSub: (p: { name: string; amount: number; renewalDay: number }) => void
  contribute: (goalId: string, amount: number) => void
  addGoal: (p: { name: string; target: number; emoji: string }) => void
  commit: (sc: Scenario) => void
  nextDay: () => void
  setSurprises: (v: boolean) => void
  triggerSurprise: () => void
  loadDemo: () => void
  resetToDayOne: () => void
}

const pick = (s: Store): AppState => ({
  budget: s.budget, day: s.day, txns: s.txns, commitments: s.commitments, subs: s.subs, goals: s.goals, surprises: s.surprises,
})

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...demoState(),
      toasts: [],
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      addExpense: ({ amount, category, note }) =>
        set((s) => ({
          txns: [...s.txns, { id: uid(), day: s.day, amount, category, note: note || 'Expense', kind: 'expense' }],
        })),
      addIncome: ({ amount, note }) =>
        set((s) => ({ txns: [...s.txns, { id: uid(), day: s.day, amount, category: 'other', note: note || 'Income', kind: 'income' }] })),
      payCommitment: (id) =>
        set((s) => {
          const c = s.commitments.find((x) => x.id === id)
          if (!c || c.paid) return s
          return {
            commitments: s.commitments.map((x) => (x.id === id ? { ...x, paid: true } : x)),
            txns: [...s.txns, { id: uid(), day: s.day, amount: c.amount, category: 'bills', note: c.name, kind: 'expense' }],
          }
        }),
      addCommitment: ({ name, amount, dueDay }) =>
        set((s) => ({ commitments: [...s.commitments, { id: uid(), name, emoji: '🧾', amount, dueDay, paid: false }] })),
      toggleSub: (id) =>
        set((s) => ({ subs: s.subs.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) })),
      addSub: ({ name, amount, renewalDay }) =>
        set((s) => {
          const charged = renewalDay <= s.day
          return {
            subs: [...s.subs, { id: uid(), name, emoji: '🔁', amount, renewalDay, active: true, charged }],
            txns: charged ? [...s.txns, { id: uid(), day: s.day, amount, category: 'bills', note: name, kind: 'expense' }] : s.txns,
          }
        }),
      contribute: (goalId, amount) =>
        set((s) => {
          const g = s.goals.find((x) => x.id === goalId)
          if (!g) return s
          return {
            goals: s.goals.map((x) => (x.id === goalId ? { ...x, saved: x.saved + amount } : x)),
            txns: [...s.txns, { id: uid(), day: s.day, amount, category: 'other', note: `Saved to ${g.name}`, kind: 'goal', goalId }],
          }
        }),
      addGoal: ({ name, target, emoji }) =>
        set((s) => ({ goals: [...s.goals, { id: uid(), name, target, emoji, saved: 0 }] })),
      commit: (sc) => set((s) => ({ ...applyScenario(pick(s), sc) })),
      nextDay: () => {
        const s = get()
        if (s.day >= TOTAL_DAYS) return
        const day = s.day + 1
        const txns = [...s.txns]
        const toasts: Toast[] = []
        const subs = s.subs.map((x) => {
          if (x.active && !x.charged && x.renewalDay <= day) {
            txns.push({ id: uid(), day, amount: x.amount, category: 'bills', note: x.name, kind: 'expense' })
            toasts.push({ id: uid(), tone: 'info', text: `${x.emoji} ${x.name} renewed — ₹${x.amount} charged.` })
            return { ...x, charged: true }
          }
          return x
        })
        s.commitments.forEach((c) => {
          if (!c.paid && c.dueDay === day) toasts.push({ id: uid(), tone: 'info', text: `${c.emoji} ${c.name} is due today (₹${c.amount}).` })
        })
        if (s.surprises && Math.random() < 0.22) {
          const ev = SURPRISES[Math.floor(Math.random() * SURPRISES.length)]
          txns.push({ id: uid(), day, amount: ev.amount, category: 'unexpected', note: ev.note, kind: 'expense' })
          toasts.push({ id: uid(), tone: 'bad', text: `${ev.emoji} Surprise: ${ev.note} — ₹${ev.amount}.` })
        }
        set({ day, txns, subs, toasts: [...s.toasts, ...toasts] })
      },
      setSurprises: (v) => set({ surprises: v }),
      triggerSurprise: () => {
        const ev = SURPRISES[Math.floor(Math.random() * SURPRISES.length)]
        set((s) => ({
          txns: [...s.txns, { id: uid(), day: s.day, amount: ev.amount, category: 'unexpected', note: ev.note, kind: 'expense' }],
          toasts: [...s.toasts, { id: uid(), tone: 'bad', text: `${ev.emoji} ${ev.note} — ₹${ev.amount}. Life happens.` }],
        }))
      },
      loadDemo: () => set({ ...demoState(), toasts: [] }),
      resetToDayOne: () => set({ ...freshState(), toasts: [] }),
    }),
    {
      name: storageNameFor(readSession()),
      version: 1,
      partialize: (s) => pick(s as Store),
    },
  ),
)

export function useAppState(): AppState {
  const budget = useStore((s) => s.budget)
  const day = useStore((s) => s.day)
  const txns = useStore((s) => s.txns)
  const commitments = useStore((s) => s.commitments)
  const subs = useStore((s) => s.subs)
  const goals = useStore((s) => s.goals)
  const surprises = useStore((s) => s.surprises)
  return useMemo(
    () => ({ budget, day, txns, commitments, subs, goals, surprises }),
    [budget, day, txns, commitments, subs, goals, surprises],
  )
}
