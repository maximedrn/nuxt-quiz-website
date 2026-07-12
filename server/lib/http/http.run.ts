import { Cause, Effect, Exit, Option } from 'effect'
import type { AppError } from '@/server/lib/http/http.error'

/**
 * Runs an effect and returns its value, or throws an H3 error built from the
 * failed tagged error. The single bridge between the Effect world of the
 * services and Nitro's throw-based HTTP errors.
 *
 * @param {Effect.Effect<A, E>} effect - The program to run.
 * @returns {Promise<A>} The success value.
 */
export async function runOrThrow<A, E extends AppError>(effect: Effect.Effect<A, E>): Promise<A> {
  const exit: Exit.Exit<A, E> = await Effect.runPromiseExit(effect)
  if (Exit.isSuccess(exit)) return exit.value
  const failure: Option.Option<E> = Cause.failureOption(exit.cause)
  if (Option.isSome(failure)) {
    throw createError({ statusCode: failure.value.status, statusMessage: failure.value.message })
  }
  throw createError({ statusCode: 500, statusMessage: 'Internal error' })
}
