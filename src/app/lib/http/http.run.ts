import { Cause, Effect, Exit, Option } from "effect";
import { createError } from "h3";
import type { AppError } from "@/app/lib/http/http.error.ts";
import { HttpMessage } from "@/app/lib/http/http.message.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";

/**
 * Runs an effect and returns its value, or throws an H3 error built from the
 * failed tagged error. The single bridge between the Effect world of the
 * services and Nitro's throw-based HTTP errors.
 *
 * @param {Effect.Effect<A, E>} effect - The program to run.
 *
 * @returns {Promise<A>} The success value.
 */
const runOrThrow = async <A, E extends AppError>(
  effect: Effect.Effect<A, E>,
): Promise<A> => {
  const exit: Exit.Exit<A, E> = await Effect.runPromiseExit(effect);
  if (Exit.isSuccess(exit)) {
    return exit.value;
  }

  const failure: Option.Option<E> = Cause.failureOption(exit.cause);
  if (Option.isSome(failure)) {
    throw createError({
      statusCode: failure.value.status,
      statusMessage: failure.value.message,
    });
  }

  throw createError({
    statusCode: HttpStatus.internal,
    statusMessage: HttpMessage.internal,
  });
};

export { runOrThrow };
