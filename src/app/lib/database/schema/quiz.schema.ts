import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

const quizzes = pgTable("quizzes", {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  description: text("description"),
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
});

type Quiz = typeof quizzes.$inferSelect;
type NewQuiz = typeof quizzes.$inferInsert;

export { type NewQuiz, type Quiz, quizzes };
