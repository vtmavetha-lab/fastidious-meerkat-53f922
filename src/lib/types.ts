export type Category =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'fun'
  | 'bills'
  | 'health'
  | 'learning'
  | 'unexpected'
  | 'other'

export type TxnKind = 'expense' | 'income' | 'goal'

export interface Txn {
  id: string
  day: number
  amount: number
  category: Category
  note: string
  kind: TxnKind
  goalId?: string
}

export interface Commitment {
  id: string
  name: string
  emoji: string
  amount: number
  dueDay: number
  paid: boolean
}

export interface Subscription {
  id: string
  name: string
  emoji: string
  amount: number
  renewalDay: number
  active: boolean
  charged: boolean
}

export interface Goal {
  id: string
  name: string
  emoji: string
  target: number
  saved: number
}

export interface AppState {
  budget: number
  day: number
  txns: Txn[]
  commitments: Commitment[]
  subs: Subscription[]
  goals: Goal[]
  surprises: boolean
}

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical'

export interface ForecastPoint {
  day: number
  balance: number
  actual: boolean
}

export interface GoalProjection {
  goal: Goal
  projectedSaved: number
  onTrack: boolean
  shortBy: number
}

export interface HealthPart {
  key: string
  label: string
  score: number
  max: number
  hint: string
}

export interface Metrics {
  income: number
  spent: number
  savedToGoals: number
  balance: number
  obligations: number
  pendingCommitments: number
  upcomingSubs: number
  overdue: number
  daysLeft: number
  safeToSpend: number
  dailyAllowance: number
  burnRate: number
  projectedEnd: number
  runOutDay: number | null
  forecast: ForecastPoint[]
  risk: number
  riskLevel: RiskLevel
  health: number
  healthLabel: string
  healthParts: HealthPart[]
  goals: GoalProjection[]
  subTotal: number
  byCategory: { category: Category; amount: number }[]
}

export type Scenario =
  | { type: 'spend'; amount: number; category: Category; note: string; day: number }
  | { type: 'subscribe'; amount: number; name: string; day: number }
  | { type: 'cancel'; subId: string }
  | { type: 'save'; amount: number; goalId: string }
  | { type: 'earn'; amount: number; note: string }

export type View = 'home' | 'simulate' | 'plan' | 'activity'
