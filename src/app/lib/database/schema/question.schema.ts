import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { quizzes } from "@/app/lib/database/schema/quiz.schema.ts";

const questions = pgTable("questions", {
  code: text("code"),
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation").notNull(),
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  options: text("options").array().notNull(),
  question: text("question").notNull(),
  quizId: integer("quiz_id")
    .notNull()
    .references(() => quizzes.id),
  title: text("title").notNull(),
});

type Question = typeof questions.$inferSelect;
type NewQuestion = typeof questions.$inferInsert;

export { type NewQuestion, type Question, questions };
