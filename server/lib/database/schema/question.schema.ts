import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core'
import { answerLetter } from '@/server/lib/database/schema/enums.schema'

/**
 * The 90 Core Solidity & EVM questions. Static reference data, seeded once
 * from `database.seed-data.ts` — never written to by the app itself.
 */
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  /** 1-based position in the original study guide (stable, human-facing). */
  number: integer('number').notNull().unique(),
  title: text('title').notNull(),
  /**
   * Question prose. May contain the literal placeholder `{{code}}` marking
   * where the `code` snippet (if any) should be rendered inline.
   */
  question: text('question').notNull(),
  code: text('code'),
  optionA: text('option_a').notNull(),
  optionB: text('option_b').notNull(),
  optionC: text('option_c').notNull(),
  optionD: text('option_d').notNull(),
  correctAnswer: answerLetter('correct_answer').notNull(),
  explanation: text('explanation').notNull(),
})

export type Question = typeof questions.$inferSelect
export type NewQuestion = typeof questions.$inferInsert
