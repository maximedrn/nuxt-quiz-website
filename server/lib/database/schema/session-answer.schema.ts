import { boolean, integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core'
import { answerLetter } from '@/server/lib/database/schema/enums.schema'
import { questions } from '@/server/lib/database/schema/question.schema'
import { quizSessions } from '@/server/lib/database/schema/quiz-session.schema'

/** One answered question within a session. */
export const sessionAnswers = pgTable('session_answers', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .notNull()
    .references(() => quizSessions.id, { onDelete: 'cascade' }),
  questionId: integer('question_id')
    .notNull()
    .references(() => questions.id),
  selected: answerLetter('selected').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
})

export type SessionAnswer = typeof sessionAnswers.$inferSelect
export type NewSessionAnswer = typeof sessionAnswers.$inferInsert
