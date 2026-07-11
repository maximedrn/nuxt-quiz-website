import { integer, jsonb, pgTable, serial, timestamp } from 'drizzle-orm/pg-core'
import { sessionMode, sessionStatus } from '@/server/lib/database/schema/enums.schema'
import { users } from '@/server/lib/database/schema/user.schema'

/**
 * One training run. `questionIds` freezes the ordered set of questions asked,
 * so a session is always reproducible/resumable even if the question bank
 * changes later.
 */
export const quizSessions = pgTable('quiz_sessions', {
  id: serial('id').primaryKey(),
  /** Owner of the session. Every session belongs to exactly one user. */
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  questionIds: jsonb('question_ids').$type<number[]>().notNull(),
  mode: sessionMode('mode').notNull().default('random'),
  status: sessionStatus('status').notNull().default('in_progress'),
  /** Number of correct answers. Set once the session is completed. */
  score: integer('score'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
})

export type QuizSession = typeof quizSessions.$inferSelect
export type NewQuizSession = typeof quizSessions.$inferInsert
