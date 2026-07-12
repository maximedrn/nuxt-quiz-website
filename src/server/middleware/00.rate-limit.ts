import is from "@sindresorhus/is";
import { Effect, Option } from "effect";
import {
  createError,
  defineEventHandler,
  getRequestHeader,
  getRequestIP,
  type H3Event,
  setResponseHeader,
} from "h3";
import { useEnv } from "@/app/lib/env/env.context.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";
import {
  RateLimitHeader,
  RateLimitKind,
  TrustedProxyOn,
  UnknownIp,
} from "@/app/lib/security/security.constants.ts";
import { useSecurity } from "@/app/lib/security/security.context.ts";
import { SecurityMessage } from "@/app/lib/security/security.message.ts";
import type { RateLimitResult } from "@/app/lib/security/security.types.ts";

/**
 * Resolves the client IP.
 *
 * Defaults to the socket peer (unspoofable). `X-Forwarded-For` is honored ONLY
 * when `TRUSTED_PROXY=true`, and then the right-most entry is used (the address
 * the trusted proxy actually saw) rather than the left-most client-supplied
 * one.
 *
 * @param {H3Event} event - The request event.
 *
 * @returns {string} The client IP, or 'unknown'.
 */
const clientIp: (event: H3Event) => string = (event: H3Event): string => {
  if (useEnv().config.trustedProxy === TrustedProxyOn) {
    const forwarded: string | undefined = getRequestHeader(
      event,
      RateLimitHeader.forwardedFor,
    );
    if (is.nonEmptyString(forwarded)) {
      const parts: string[] = forwarded
        .split(",")
        .map((part: string) => part.trim())
        .filter((part: string) => part.length > 0);
      const rightmost: string | undefined = parts.at(-1);
      if (is.nonEmptyString(rightmost)) {
        return rightmost;
      }
    }
  }
  const socketIp: string | undefined =
    getRequestIP(event) ?? event.node.req.socket.remoteAddress ?? undefined;
  if (is.nonEmptyString(socketIp)) {
    return socketIp;
  }
  return UnknownIp;
};

/**
 * Per-IP rate limiting for every `/api/*` request.
 *
 * A global throttle protects the API at large; a stricter budget on
 * `/api/auth/*` blunts brute-forcing of the 8-digit code. Runs first (`00.`),
 * before auth.
 *
 * Fail policy: on a limiter error (e.g. Redis outage), auth/account-creation
 * paths fail CLOSED (429) — they must never lose their brute-force gate — while
 * other paths fail open so a cache blip doesn't take the whole API down.
 */
const handler: (event: H3Event<EventHandlerRequest>) => Promise<void> =
  defineEventHandler(async (event: H3Event<EventHandlerRequest>) => {
    const path: string = event.path;
    if (!path.startsWith("/api")) {
      return;
    }

    const isAuthPath: boolean = path.startsWith("/api/auth");
    let kind: RateLimitKind;
    if (isAuthPath) {
      kind = RateLimitKind.auth;
    } else {
      kind = RateLimitKind.global;
    }
    const ip: string = clientIp(event);

    const result: Option.Option<RateLimitResult> = await Effect.runPromise(
      useSecurity().consume(ip, kind).pipe(Effect.option),
    );

    if (Option.isNone(result)) {
      if (isAuthPath) {
        throw createError({
          statusCode: HttpStatus.tooManyRequests,
          statusMessage: SecurityMessage.tooManyRequests,
        });
      }
      return;
    }

    if (!result.value.allowed) {
      setResponseHeader(
        event,
        RateLimitHeader.retryAfter,
        Math.ceil(result.value.msBeforeNext / 1000),
      );
      throw createError({
        statusCode: HttpStatus.tooManyRequests,
        statusMessage: SecurityMessage.tooManyRequests,
      });
    }
  });

export default handler;
