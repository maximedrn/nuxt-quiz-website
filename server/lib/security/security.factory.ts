import is from '@sindresorhus/is'
import { Effect } from 'effect'
import { Redis } from 'ioredis'
import { RateLimiterRedis } from 'rate-limiter-flexible'
import { HttpStatus } from '@/server/lib/http/http.status'
import { FlexibleRateLimitDriver } from '@/server/lib/security/drivers/security.flexible.driver'
import { RateLimitPrefix } from '@/server/lib/security/security.constants'
import type { IRateLimitService } from '@/server/lib/security/security.interface'
import { SecurityMessage } from '@/server/lib/security/security.message'
import { RateLimitService } from '@/server/lib/security/security.service'
import { type SecurityConfig, SecurityError } from '@/server/lib/security/security.types'

/**
 * Builds the rate-limit service backed by Redis.
 *
 * The single entry point for rate-limit construction. Creates a global throttle
 * and a stricter auth limiter, both keyed per IP. Returns an `Effect` that fails
 * with `SecurityError` when the Redis URL is absent.
 *
 * @param {SecurityConfig} config - Redis URL and both limiter budgets.
 *
 * @returns {Effect.Effect<IRateLimitService, SecurityError>} The service, or a config error.
 *
 * @example
 * ```ts
 * const service = await Effect.runPromise(createSecurity({ redisUrl, global: {...}, auth: {...} }))
 * ```
 */
function createSecurity(config: SecurityConfig): Effect.Effect<IRateLimitService, SecurityError> {
  if (!is.nonEmptyString(config.redisUrl)) {
    return Effect.fail(
      new SecurityError({
        message: SecurityMessage.REDIS_URL_MISSING,
        status: HttpStatus.INTERNAL,
      }),
    )
  }
  const storeClient = new Redis(config.redisUrl, { maxRetriesPerRequest: 2 })
  const driver = new FlexibleRateLimitDriver({
    global: new RateLimiterRedis({
      storeClient,
      keyPrefix: RateLimitPrefix.GLOBAL,
      points: config.global.points,
      duration: config.global.duration,
    }),
    auth: new RateLimiterRedis({
      storeClient,
      keyPrefix: RateLimitPrefix.AUTH,
      points: config.auth.points,
      duration: config.auth.duration,
    }),
  })
  return Effect.succeed(new RateLimitService(driver))
}

export { createSecurity }
