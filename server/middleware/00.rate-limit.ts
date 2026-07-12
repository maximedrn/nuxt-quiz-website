import is from '@sindresorhus/is'
import { Effect, Option } from 'effect'
import type { H3Event } from 'h3'
import { useEnv } from '@/server/lib/env/env.context'
import { HttpStatus } from '@/server/lib/http/http.status'
import { RateLimitKind } from '@/server/lib/security/security.constants'
import { useSecurity } from '@/server/lib/security/security.context'

const TOO_MANY_MESSAGE = 'Too many requests — please slow down.'

/**
 * Resolves the client IP.
 *
 * Defaults to the socket peer (unspoofable). `X-Forwarded-For` is honored ONLY
 * when `TRUSTED_PROXY=true`, and then the right-most entry is used (the address
 * the trusted proxy actually saw) rather than the left-most client-supplied one.
 *
 * @param {H3Event} event - The request event.
 *
 * @returns {string} The client IP, or 'unknown'.
 */
function clientIp(event: H3Event): string {
  if (useEnv().config.trustedProxy === 'true') {
    const forwarded: string | undefined = getRequestHeader(event, 'x-forwarded-for')
    if (is.nonEmptyString(forwarded)) {
      const parts: string[] = forwarded
        .split(',')
        .map((part: string): string => part.trim())
        .filter((part: string): boolean => part.length > 0)
      const rightmost: string | undefined = parts.at(-1)
      if (is.nonEmptyString(rightmost)) return rightmost
    }
  }
  const socketIp: string | undefined =
    getRequestIP(event) ?? event.node.req.socket.remoteAddress ?? undefined
  return is.nonEmptyString(socketIp) ? socketIp : 'unknown'
}

/**
 * Per-IP rate limiting for every `/api/*` request.
 *
 * A global throttle protects the API at large; a stricter budget on `/api/auth/*`
 * blunts brute-forcing of the 8-digit code. Runs first (`00.`), before auth.
 *
 * Fail policy: on a limiter error (e.g. Redis outage), auth/account-creation
 * paths fail CLOSED (429) — they must never lose their brute-force gate — while
 * other paths fail open so a cache blip doesn't take the whole API down.
 */
export default defineEventHandler(async (event) => {
  const path: string = event.path
  if (!path.startsWith('/api/')) return

  const isAuthPath: boolean = path.startsWith('/api/auth/')
  const kind = isAuthPath ? RateLimitKind.AUTH : RateLimitKind.GLOBAL
  const ip: string = clientIp(event)

  const result = await Effect.runPromise(useSecurity().consume(ip, kind).pipe(Effect.option))

  if (Option.isNone(result)) {
    if (isAuthPath) {
      throw createError({ statusCode: HttpStatus.TOO_MANY_REQUESTS, statusMessage: TOO_MANY_MESSAGE })
    }
    return
  }

  if (!result.value.allowed) {
    setResponseHeader(event, 'Retry-After', Math.ceil(result.value.msBeforeNext / 1000))
    throw createError({ statusCode: HttpStatus.TOO_MANY_REQUESTS, statusMessage: TOO_MANY_MESSAGE })
  }
})
