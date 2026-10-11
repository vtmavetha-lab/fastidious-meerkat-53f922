import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useStore } from '../lib/store'

const tone = {
  info: 'border-sky-400/30',
  good: 'border-emerald-400/40',
  bad: 'border-rose-400/40',
}

function ToastItem({ id, text, kind }: { id: string; text: string; kind: 'info' | 'good' | 'bad' }) {
  const dismiss = useStore((s) => s.dismissToast)
  useEffect(() => {
    const t = setTimeout(() => dismiss(id), 5000)
    return () => clearTimeout(t)
  }, [id, dismiss])
  return (
    <motion.div layout initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }} className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-ink-800/95 px-4 py-3 text-sm shadow-xl backdrop-blur ${tone[kind]}`}>
      <span className="flex-1 text-slate-100">{text}</span>
      <button onClick={() => dismiss(id)} aria-label="Dismiss notification" className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
    </motion.div>
  )
}

export default function Toasts() {
  const toasts = useStore((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 mx-auto flex w-full max-w-sm flex-col gap-2 px-4 md:bottom-6 md:left-auto md:right-6 md:mx-0" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.slice(-3).map((t) => (
          <ToastItem key={t.id} id={t.id} text={t.text} kind={t.tone} />
        ))}
      </AnimatePresence>
    </div>
  )
}
