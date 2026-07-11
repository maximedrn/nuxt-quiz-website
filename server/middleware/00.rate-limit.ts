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

  const result = await useSecurity().consume(ip, kind)
  if (result.isErr()) return

  if (!result.value.allowed) {
    setResponseHeader(event, 'Retry-After', Math.ceil(result.value.msBeforeNext / 1000))
    throw createError({ statusCode: 429, statusMessage: 'Too many requests — please slow down.' })
  }
})
