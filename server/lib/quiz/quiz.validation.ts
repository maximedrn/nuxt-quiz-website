import { z } from 'zod'
import { AnswerLetter, SessionMode } from '@/shared/types'

/** Zod schema for a single answer letter. */
const answerLetterSchema = z.enum(AnswerLetter)

/** Zod schema for a session mode. */
const sessionModeSchema = z.enum(SessionMode)

/** Body schema for creating a session. `size` upper bound is checked per-request. */
const createSessionSchema = z.object({
  mode: sessionModeSchema,
  size: z.coerce.number().int().positive(),
})

/** Body schema for submitting an answer. */
const submitAnswerSchema = z.object({
  questionId: z.coerce.number().int().positive(),
  selected: answerLetterSchema,
})

/**
 * Parses and validates a value against a Zod schema, throwing a 400 on failure.
 *
 * Uses `safeParse` (never throws) and converts a failure into an H3 400 with
 * the first Zod issue message — keeping route handlers free of try/catch.
 *
 * @param {z.ZodType<T>} schema - The schema to validate against.
 * @param {unknown} value - The raw value (body, param, query).
 *
 * @returns {T} The parsed, typed value.
 */
function parseOr400<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message ?? 'Invalid input',
    })
  }
  return result.data
}

/**
 * Parses a route param into a positive session id, throwing 400 on failure.
 *
 * @param {unknown} value - Raw router param.
 *
 * @returns {number} The validated session id.
 */
function parseSessionId(value: string | undefined): number {
  return parseOr400(z.coerce.number().int().positive(), value)
}

export {
  answerLetterSchema,
  createSessionSchema,
  parseOr400,
  parseSessionId,
  sessionModeSchema,
  submitAnswerSchema,
}
