/**
 * Static messages for the quiz domain.
 */
const QuizMessage = {
  alreadyAnswered: "Question already answered",
  alreadyCompleted: "Session already completed",
  invalidInput: "Invalid input",
  noQuestions: "No questions available",
  questionMissing: "A question referenced by this session no longer exists.",
  questionNotInSession: "Question not in session",
  questionOrderCorrupted: "Session question order is corrupted.",
  sessionNotFound: "Session not found",
  sizeRange: "Session size out of range",
} as const satisfies Record<string, string>;

type QuizMessage = (typeof QuizMessage)[keyof typeof QuizMessage];

export { QuizMessage };
