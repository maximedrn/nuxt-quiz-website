import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { questions } from "@/app/lib/database/schema/question.schema.ts";
import { quizSessions } from "@/app/lib/database/schema/quiz-session.schema.ts";

/**
 * One answered question within a session.
 */
const sessionAnswers = pgTable("session_answers", {
  answeredAt: timestamp("answered_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  id: serial("id").primaryKey(),
  isCorrect: boolean("is_correct").notNull(),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id),
  /**
   * 0-based index into the question's `options` the player picked.
   */
  selectedIndex: integer("selected_index").notNull(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => quizSessions.id, { onDelete: "cascade" }),
});

type SessionAnswer = typeof sessionAnswers.$inferSelect;
type NewSessionAnswer = typeof sessionAnswers.$inferInsert;

export { type NewSessionAnswer, type SessionAnswer, sessionAnswers };
