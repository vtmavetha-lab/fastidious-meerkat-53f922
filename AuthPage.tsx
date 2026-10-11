import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { isValidEmail, useAuth } from '../lib/auth'

type Mode = 'login' | 'signup'

function PasswordField({ id, label, value, onChange, autoComplete }: { id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} className="input pr-12" value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} placeholder="At least 6 characters" required />
        <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:text-white" aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    </div>
  )
}

export default function AuthPage() {
  const { signup, login, continueAsGuest } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mode === 'signup' && name.trim().length < 2) return setError('Please enter your name.')
    if (!isValidEmail(email.trim())) return setError('Enter a valid email address.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (mode === 'signup' && password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    const err = mode === 'signup' ? await signup(name, email, password) : await login(email, password)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-8 lg:grid-cols-2">
      <section className="order-2 lg:order-1" aria-label="About Runway">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-ink-800 ring-1 ring-white/10" aria-hidden>
            <svg viewBox="0 0 32 32" className="h-6 w-6"><path d="M7 22 L14 14 L18 18 L25 9" stroke="#c6f432" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">Runway</span>
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Make <span className="text-lime-400">₹10,000</span> last all <span className="text-violet-400">30 days</span>.
        </h1>
        <p className="mt-4 max-w-md text-slate-300">
          Test every money decision before you make it. See how it changes your balance, daily allowance, goals, risk and financial health.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-slate-300">
          <li className="flex items-center gap-3"><Sparkles className="h-5 w-5 shrink-0 text-lime-400" aria-hidden /> What-if simulator for spends, subscriptions and surprises</li>
          <li className="flex items-center gap-3"><TrendingUp className="h-5 w-5 shrink-0 text-lime-400" aria-hidden /> Live 30-day forecast, risk meter and health score</li>
          <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-lime-400" aria-hidden /> Your data stays on your device</li>
        </ul>
      </section>

      <motion.main initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="order-1 lg:order-2">
        <div className="card mx-auto w-full max-w-md !p-6 sm:!p-8">
          <div role="tablist" aria-label="Account" className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-ink-900 p-1">
            {(['login', 'signup'] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => switchMode(m)} className={`rounded-xl py-2.5 text-sm font-semibold transition ${mode === m ? 'bg-lime-400 text-ink-950' : 'text-slate-300 hover:bg-white/5'}`}>
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          <h2 className="font-display text-2xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mb-5 mt-1 text-sm text-slate-400">{mode === 'login' ? 'Log in to continue your month.' : 'Start your 30 days with ₹10,000.'}</p>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-name" className="label">Name</label>
                <input id="auth-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" maxLength={40} required />
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="label">Email</label>
              <input id="auth-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required />
            </div>
            <PasswordField id="auth-password" label="Password" value={password} onChange={setPassword} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            {mode === 'signup' && <PasswordField id="auth-confirm" label="Confirm password" value={confirm} onChange={setConfirm} autoComplete="new-password" />}

            {error && (
              <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-500" aria-hidden>
            <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
          </div>
          <button type="button" className="btn-ghost w-full" onClick={() => void continueAsGuest()}>
            Continue as guest · try the demo
          </button>
          <p className="mt-4 text-center text-xs text-slate-500">
            {mode === 'login' ? 'New here? ' : 'Already have an account? '}
            <button type="button" className="font-semibold text-lime-400 underline-offset-2 hover:underline" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Create an account' : 'Log in'}
            </button>
          </p>
        </div>
      </motion.main>
    </div>
  )
}
