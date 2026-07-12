import { Effect } from 'effect'
import { RateLimitKind } from '@/server/lib/security/security.constants'
import { useSecurity } from '@/server/lib/security/security.context'

/**
 * Per-IP rate limiting for every `/api/*` request.
 *
 * A global throttle protects the API at large; a stricter budget on `/api/auth/*`
 * blunts brute-forcing of the 8-digit code. Runs first (`00.`), before auth.
 *
 * Fails open: if the limiter itself errors (e.g. Redis blip) the request is let
 * through rather than taking the whole API down.
 */
export default defineEventHandler(async (event) => {
  const path = event.path
  if (!path.startsWith('/api/')) return

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const kind = path.startsWith('/api/auth/') ? RateLimitKind.AUTH : RateLimitKind.GLOBAL

  // Fails open: SecurityError (e.g. Redis blip) lets the request through.
  const result = await Effect.runPromise(
    useSecurity().consume(ip, kind).pipe(Effect.option),
  )
  if (result._tag === 'None') return

  const { allowed, msBeforeNext } = result.value
  if (!allowed) {
    setResponseHeader(event, 'Retry-After', Math.ceil(msBeforeNext / 1000))
    throw createError({ statusCode: 429, statusMessage: 'Too many requests — please slow down.' })
  }
})
