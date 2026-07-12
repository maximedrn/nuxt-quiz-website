import { Data } from "effect";
import type { HttpStatus } from "@/app/lib/http/http.status.ts";
import type { AnswerOutcome } from "@/app/lib/quiz/option-state.ts";
import type {
  SessionMode,
  SessionStatus,
} from "@/app/lib/storage/storage.constants.ts";
import type { AnswerIndex } from "@/app/lib/storage/storage.types.ts";

/**
 * Tagged error for quiz domain failures.
 */
class QuizError extends Data.TaggedError("QuizError")<{
  readonly message: string;
  readonly status: HttpStatus;
}> {}

interface PlayableQuestion {
  code: string | null;
  id: number;
  number: number;
  options: string[];
  question: string;
  title: string;
}

interface SessionProgress {
  current: number;
  total: number;
}

interface SessionSummary {
  answered: number;
  finishedAt: string | null;
  id: number;
  mode: SessionMode;
  score: number | null;
  startedAt: string;
  status: SessionStatus;
  total: number;
}

interface CreateSessionInput {
  mode: SessionMode;
  quizId: number;
  size: number;
}

interface CreateSessionResult {
  id: number;
}

interface SessionStateResult {
  answeredResults: AnswerOutcome[];
  currentQuestion: PlayableQuestion | null;
  needsFinish: boolean;
  progress: SessionProgress;
  session: SessionSummary;
}

interface SubmitAnswerInput {
  questionId: number;
  selectedIndex: AnswerIndex;
}

interface SubmitAnswerResult {
  correct: boolean;
  correctIndex: AnswerIndex;
  explanation: string;
  progress: SessionProgress;
}

interface QuestionFeedback {
  correct: boolean;
  correctIndex: AnswerIndex;
  explanation: string;
  selectedIndex: AnswerIndex;
}

interface FinishSessionResult {
  score: number;
  total: number;
}

interface ReviewItem {
  code: string | null;
  correctIndex: AnswerIndex;
  explanation: string;
  isCorrect: boolean;
  number: number;
  options: string[];
  question: string;
  selectedIndex: AnswerIndex;
  title: string;
}

interface SessionResultsResult {
  items: ReviewItem[];
  session: SessionSummary;
}

export {
  type CreateSessionInput,
  type CreateSessionResult,
  type FinishSessionResult,
  type PlayableQuestion,
  type QuestionFeedback,
  QuizError,
  type ReviewItem,
  type SessionProgress,
  type SessionResultsResult,
  type SessionStateResult,
  type SessionSummary,
  type SubmitAnswerInput,
  type SubmitAnswerResult,
};
