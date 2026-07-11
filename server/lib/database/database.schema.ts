import { questions } from '@/server/lib/database/schema/question.schema'
import { quizSessions } from '@/server/lib/database/schema/quiz-session.schema'
import { sessionAnswers } from '@/server/lib/database/schema/session-answer.schema'
import { users } from '@/server/lib/database/schema/user.schema'

/**
 * Aggregated Drizzle schema — the shape Drizzle's query builder is typed from.
 *
 * Not a barrel: it collects the table definitions into the single object Drizzle
 * requires for relational typing. Consumers still import individual tables from
 * their own `schema/*.schema.ts` file.
 */
export const databaseSchema = { users, questions, quizSessions, sessionAnswers }
