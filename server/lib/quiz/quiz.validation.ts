import { Effect, Schema } from 'effect'
import { HttpStatus } from '@/server/lib/http/http.status'
import { QuizMessage } from '@/server/lib/quiz/quiz.message'
import { QuizError } from '@/server/lib/quiz/quiz.types'
import { AnswerLetter, SessionMode } from '@/shared/types'

/** Schema for a single answer letter. */
const answerLetterSchema = Schema.Literal(
  AnswerLetter.A,
  AnswerLetter.B,
  AnswerLetter.C,
  AnswerLetter.D,
)

/** Schema for a session mode. */
const sessionModeSchema = Schema.Literal(SessionMode.SEQUENTIAL, SessionMode.RANDOM)

/** Body schema for creating a session. `size` upper bound is checked per-request. */
const createSessionSchema = Schema.Struct({
  mode: sessionModeSchema,
  size: Schema.NumberFromString.pipe(Schema.int(), Schema.positive()),
})

/** Body schema for submitting an answer. */
const submitAnswerSchema = Schema.Struct({
  questionId: Schema.NumberFromString.pipe(Schema.int(), Schema.positive()),
  selected: answerLetterSchema,
})

/**
 * Decodes a value against an `effect/Schema`, failing with a 400 `QuizError` on parse failure.
 *
 * Replaces the old `parseOr400` (Zod-based) without throwing — callers receive a typed
 * `Effect` and handle the error path explicitly.
 *
 * @param {Schema.Schema<A, I>} schema - The schema to decode against.
 * @param {unknown} value - The raw value (body, param, query).
 *
 * @returns {Effect.Effect<A, QuizError>} The decoded value or a 400 QuizError.
 *
 * @example
 * ```ts
 * const body = yield* decodeOr400(createSessionSchema, rawBody)
 * ```
 */
function decodeOr400<A, I>(
  schema: Schema.Schema<A, I>,
  value: unknown,
): Effect.Effect<A, QuizError> {
  return Schema.decodeUnknown(schema)(value).pipe(
    Effect.mapError(
      (e): QuizError =>
        new QuizError({
          message: `${QuizMessage.INVALID_INPUT}: ${e.message}`,
          status: HttpStatus.BAD_REQUEST,
        }),
    ),
  )
}

/**
 * Parses a route param into a positive session id, failing with a 400 `QuizError` on failure.
 *
 * @param {string | undefined} value - Raw router param.
 *
 * @returns {Effect.Effect<number, QuizError>} The validated session id or a 400 QuizError.
 *
 * @example
 * ```ts
 * const id = yield* parseSessionId(event.context.params?.id)
 * ```
 */
function parseSessionId(value: string | undefined): Effect.Effect<number, QuizError> {
  return decodeOr400(Schema.NumberFromString.pipe(Schema.int(), Schema.positive()), value)
}

export {
  answerLetterSchema,
  createSessionSchema,
  decodeOr400,
  parseSessionId,
  sessionModeSchema,
  submitAnswerSchema,
}
