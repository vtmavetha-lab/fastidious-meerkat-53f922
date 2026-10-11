import { create } from 'zustand'
import { readSession, storageNameFor, writeSession, type Session } from './session'
import { useStore } from './store'
import { uid } from './format'

/**
 * Client-side accounts for the demo: users live in this browser's localStorage and
 * passwords are salted + hashed (never stored in plain text). There is no server.
 */
const USERS_KEY = 'runway-users-v1'

interface StoredUser {
  name: string
  email: string
  salt: string
  hash: string
}

function loadUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') as StoredUser[]
  } catch {
    return []
  }
}

function saveUsers(users: StoredUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    /* storage unavailable */
  }
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const input = `${salt}:${password}`
  if (globalThis.crypto?.subtle) {
    const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Fallback for non-secure contexts (e.g. http on a LAN address)
  let h = 5381
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0
  return `fb-${(h >>> 0).toString(16)}`
}

export const isValidEmail = (e: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)

/** Point the finance store at this person's own saved data (or create it). */
async function enter(session: Session, isNew: boolean): Promise<void> {
  const key = storageNameFor(session)
  useStore.persist.setOptions({ name: key })
  let has = false
  try {
    has = localStorage.getItem(key) !== null
  } catch {
    has = false
  }
  if (has) await useStore.persist.rehydrate()
  else if (session.guest) useStore.getState().loadDemo()
  else useStore.getState().resetToDayOne()
  useStore.setState({
    toasts: [{ id: uid(), tone: 'good', text: session.guest ? 'Exploring as a guest with a day-9 demo month. Sign up to keep your own money plan.' : isNew ? `Welcome to Runway, ${session.name}! You start on day 1 with ₹10,000.` : `Welcome back, ${session.name}.` }],
  })
}

interface AuthState {
  session: Session | null
  signup: (name: string, email: string, password: string) => Promise<string | null>
  login: (email: string, password: string) => Promise<string | null>
  continueAsGuest: () => Promise<void>
  logout: () => void
}

const initial = readSession()
if (initial) useStore.persist.setOptions({ name: storageNameFor(initial) })

export const useAuth = create<AuthState>((set) => ({
  session: initial,

  signup: async (name, email, password) => {
    const clean = email.trim().toLowerCase()
    const users = loadUsers()
    if (users.some((u) => u.email === clean)) return 'An account with this email already exists. Try logging in instead.'
    const salt = uid() + uid()
    const hash = await hashPassword(password, salt)
    saveUsers([...users, { name: name.trim(), email: clean, salt, hash }])
    const session: Session = { name: name.trim(), email: clean, guest: false }
    writeSession(session)
    await enter(session, true)
    set({ session })
    return null
  },

  login: async (email, password) => {
    const clean = email.trim().toLowerCase()
    const user = loadUsers().find((u) => u.email === clean)
    if (!user) return 'No account found with this email. Sign up first.'
    const hash = await hashPassword(password, user.salt)
    if (hash !== user.hash) return 'Email or password is incorrect.'
    const session: Session = { name: user.name, email: user.email, guest: false }
    writeSession(session)
    await enter(session, false)
    set({ session })
    return null
  },

  continueAsGuest: async () => {
    const session: Session = { name: 'Guest', email: 'guest', guest: true }
    writeSession(session)
    await enter(session, false)
    set({ session })
  },

  logout: () => {
    writeSession(null)
    set({ session: null })
  },
}))
