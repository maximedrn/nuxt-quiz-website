import {
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import {
  sessionMode,
  sessionStatus,
} from "@/app/lib/database/schema/enums.schema.ts";
import { quizzes } from "@/app/lib/database/schema/quiz.schema.ts";
import { users } from "@/app/lib/database/schema/user.schema.ts";
import {
  SessionMode,
  SessionStatus,
} from "@/app/lib/storage/storage.constants.ts";

const quizSessions = pgTable("quiz_sessions", {
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  id: serial("id").primaryKey(),
  mode: sessionMode("mode").notNull().default(SessionMode.random),
  questionIds: jsonb("question_ids").$type<number[]>().notNull(),
  quizId: integer("quiz_id")
    .notNull()
    .references(() => quizzes.id),
  score: integer("score"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  status: sessionStatus("status").notNull().default(SessionStatus.inProgress),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

type QuizSession = typeof quizSessions.$inferSelect;
type NewQuizSession = typeof quizSessions.$inferInsert;

export { type NewQuizSession, type QuizSession, quizSessions };
