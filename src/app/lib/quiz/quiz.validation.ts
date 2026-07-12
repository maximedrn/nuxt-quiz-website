import { Effect, Schema } from "effect";
import type { ParseError } from "effect/ParseResult";
import { HttpStatus } from "@/app/lib/http/http.status.ts";
import { QuizMessage } from "@/app/lib/quiz/quiz.message.ts";
import { QuizError } from "@/app/lib/quiz/quiz.types.ts";
import { SessionMode } from "@/app/lib/storage/storage.constants.ts";

/**
 * Schema for a session mode.
 */
const sessionModeSchema = Schema.Literal(
  SessionMode.sequential,
  SessionMode.random,
);

/**
 * Schema for a 0-based option index (any number of choices, not just A–D).
 */
const selectedIndexSchema = Schema.Number.pipe(
  Schema.int(),
  Schema.nonNegative(),
);

/**
 * Body schema for creating a session. `size` upper bound is checked
 * per-request.
 */
const createSessionSchema = Schema.Struct({
  mode: sessionModeSchema,
  quizId: Schema.Number.pipe(Schema.int(), Schema.positive()),
  size: Schema.Number.pipe(Schema.int(), Schema.positive()),
});

/**
 * Body schema for submitting an answer.
 */
const submitAnswerSchema = Schema.Struct({
  questionId: Schema.Number.pipe(Schema.int(), Schema.positive()),
  selectedIndex: selectedIndexSchema,
});

/**
 * Decodes a value against an `effect/Schema`, failing with a 400 `QuizError` on
 * parse failure.
 *
 * Replaces the old `parseOr400` (Zod-based) without throwing — callers receive
 * a typed `Effect` and handle the error path explicitly.
 *
 * @param {Schema.Schema<A, I>} schema - The schema to decode against.
 * @param {unknown} value - The raw value (body, param, query).
 *
 * @returns {Effect.Effect<A, QuizError>} The decoded value or a 400 QuizError.
 */
const decodeOr400 = <A, I>(
  schema: Schema.Schema<A, I>,
  value: unknown,
): Effect.Effect<A, QuizError> =>
  Schema.decodeUnknown(schema)(value).pipe(
    Effect.mapError(
      (error: ParseError): QuizError =>
        new QuizError({
          message: `${QuizMessage.invalidInput}: ${error.message}`,
          status: HttpStatus.badRequest,
        }),
    ),
  );

/**
 * Parses a route param into a positive session id, failing with a 400
 * `QuizError` on failure.
 *
 * @param {string | undefined} value - Raw router param.
 *
 * @returns {Effect.Effect<number, QuizError>} The validated session id or a 400
 *   QuizError.
 */
const parseSessionId = (
  value: string | undefined,
): Effect.Effect<number, QuizError> =>
  decodeOr400(
    Schema.NumberFromString.pipe(Schema.int(), Schema.positive()),
    value,
  );

export {
  createSessionSchema,
  decodeOr400,
  parseSessionId,
  sessionModeSchema,
  submitAnswerSchema,
};
