import is from "@sindresorhus/is";
import type { H3Event } from "h3";
import { createError, defineEventHandler, readBody } from "h3";
import { useAuth } from "@/app/lib/auth/auth.context.ts";
import { AuthMessage } from "@/app/lib/auth/auth.message.ts";
import { CODE_PATTERN, openSession } from "@/app/lib/auth/auth.session.ts";
import type { AuthResult } from "@/app/lib/auth/auth.types.ts";
import { runOrThrow } from "@/app/lib/http/http.run.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";

/**
 * Registers a new account from a self-chosen 8-digit code and opens a session.
 *
 * The code is scrypt-hashed by nuxt-auth-utils (never stored in clear). On
 * success a sealed session cookie is set.
 */
const handler: EventHandler<
  EventHandlerRequest,
  Promise<AuthResult>
> = defineEventHandler(
  async (event: H3Event<EventHandlerRequest>): Promise<AuthResult> => {
    const body: unknown = await readBody(event);

    if (!(
      is.plainObject(body) &&
      is.string(body.code) &&
      CODE_PATTERN.test(body.code)
    )) {
      throw createError({
        statusCode: HttpStatus.badRequest,
        statusMessage: AuthMessage.invalidFormat,
      });
    }

    const result: { id: number } = await runOrThrow(
      useAuth().register(body.code),
    );
    await openSession(event, result.id);
    return { userId: result.id };
  },
);

export default handler;
