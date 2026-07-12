import { questions } from "@/app/lib/database/schema/question.schema.ts";
import { quizzes } from "@/app/lib/database/schema/quiz.schema.ts";
import { quizSessions } from "@/app/lib/database/schema/quiz-session.schema.ts";
import { sessionAnswers } from "@/app/lib/database/schema/session-answer.schema.ts";
import { users } from "@/app/lib/database/schema/user.schema.ts";

const databaseSchema = {
  questions,
  quizSessions,
  quizzes,
  sessionAnswers,
  users,
} as const satisfies Record<string, unknown>;

export { databaseSchema };
