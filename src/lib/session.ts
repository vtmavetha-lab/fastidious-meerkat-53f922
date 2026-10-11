export interface Session {
  name: string
  email: string
  guest: boolean
}

const SESSION_KEY = 'runway-session-v1'

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function writeSession(s: Session | null): void {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* storage unavailable */
  }
}

/** Each account (and the guest) keeps its own finance data. */
export function storageNameFor(s: Session | null): string {
  if (!s) return 'runway-finance-anon'
  return s.guest ? 'runway-finance-guest' : `runway-finance:${s.email}`
}
