import is from '@sindresorhus/is'
import { Redis } from 'ioredis'
import { err, ok, type Result } from 'neverthrow'
import { RateLimiterRedis } from 'rate-limiter-flexible'
import { FlexibleRateLimitDriver } from '@/server/lib/security/drivers/security.flexible.driver'
import { RateLimitPrefix } from '@/server/lib/security/security.constants'
import { SecurityError } from '@/server/lib/security/security.error'
import type { IRateLimitService } from '@/server/lib/security/security.interface'
import { RateLimitService } from '@/server/lib/security/security.service'
import type { SecurityConfig } from '@/server/lib/security/security.types'

/**
 * Builds the rate-limit service backed by Redis.
 *
 * The single entry point for rate-limit construction. Creates a global throttle
 * and a stricter auth limiter, both keyed per IP.
 *
 * @param {SecurityConfig} config - Redis URL and both limiter budgets.
 *
 * @returns {Result<IRateLimitService, string>} The service, or a config error.
 *
 * @example
 * ```ts
 * const result = createSecurity({ redisUrl, global: {...}, auth: {...} })
 * ```
 */
function createSecurity(config: SecurityConfig): Result<IRateLimitService, string> {
  if (!is.nonEmptyString(config.redisUrl)) {
    return err(SecurityError.CONSUME_FAILED('REDIS_URL is required'))
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
  return ok(new RateLimitService(driver))
}

export { createSecurity }
