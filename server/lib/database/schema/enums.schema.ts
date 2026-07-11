import { pgEnum } from 'drizzle-orm/pg-core'

/**
 * A single quiz option letter. Kept as a Postgres enum so the database itself
 * rejects anything outside A–D.
 */
export const answerLetter = pgEnum('answer_letter', ['A', 'B', 'C', 'D'])

/** How a session orders its questions. */
export const sessionMode = pgEnum('session_mode', ['sequential', 'random'])

/** Lifecycle state of a session. */
export const sessionStatus = pgEnum('session_status', ['in_progress', 'completed'])
