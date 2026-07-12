/** Result of a successful register/login — the user id now backing the sealed session. */
export interface AuthResult {
  userId: number
}

/** Identity of the currently signed-in user. */
export interface MeResult {
  userId: number
}

/** A single quiz option letter. */
export const AnswerLetter = { A: 'A', B: 'B', C: 'C', D: 'D' } as const
export type AnswerLetter = (typeof AnswerLetter)[keyof typeof AnswerLetter]

/** How a session orders its questions. */
export const SessionMode = { SEQUENTIAL: 'sequential', RANDOM: 'random' } as const
export type SessionMode = (typeof SessionMode)[keyof typeof SessionMode]

/** Lifecycle state of a session. */
export const SessionStatus = { IN_PROGRESS: 'in_progress', COMPLETED: 'completed' } as const
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus]

/** A question as sent to the client while a session is in progress — no `correctAnswer` or `explanation`. */
export interface PlayableQuestion {
  id: number
  number: number
  title: string
  question: string
  code: string | null
  options: Record<AnswerLetter, string>
}

/** Progress marker within a session: 1-based index of the current question, and the total. */
export interface SessionProgress {
  current: number
  total: number
}

export interface SessionSummary {
  id: number
  mode: SessionMode
  status: SessionStatus
  total: number
  answered: number
  score: number | null
  startedAt: string
  finishedAt: string | null
}

export interface CreateSessionInput {
  size: number
  mode: SessionMode
}

export interface CreateSessionResult {
  id: number
}

export interface SessionStateResult {
  session: SessionSummary
  progress: SessionProgress
  currentQuestion: PlayableQuestion | null
  needsFinish: boolean
  /** Correct/incorrect outcome of every question already answered, in session order. */
  answeredResults: Array<'correct' | 'incorrect'>
}

export interface SubmitAnswerInput {
  questionId: number
  selected: AnswerLetter
}

export interface SubmitAnswerResult {
  correct: boolean
  correctAnswer: AnswerLetter
  explanation: string
  progress: SessionProgress
}

export interface FinishSessionResult {
  score: number
  total: number
}

/** One row in the post-session review list. */
export interface ReviewItem {
  number: number
  title: string
  question: string
  code: string | null
  options: Record<AnswerLetter, string>
  correctAnswer: AnswerLetter
  explanation: string
  selected: AnswerLetter
  isCorrect: boolean
}

export interface SessionResultsResult {
  session: SessionSummary
  items: ReviewItem[]
}

export interface WeakQuestion {
  number: number
  title: string
  attempts: number
  wrongCount: number
  wrongRate: number
}

export interface TrendPoint {
  sessionId: number
  finishedAt: string
  percentage: number
}

export interface StatsResult {
  totalQuestions: number
  completedSessions: number
  averageScorePct: number | null
  bestScorePct: number | null
  totalAnswered: number
  overallAccuracyPct: number | null
  currentStreakDays: number
  trend: TrendPoint[]
  weakest: WeakQuestion[]
}
