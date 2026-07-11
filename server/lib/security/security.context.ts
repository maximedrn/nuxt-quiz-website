import { useEnv } from '@/server/lib/env/env.context'
import { createSecurity } from '@/server/lib/security/security.factory'
import type { IRateLimitService } from '@/server/lib/security/security.interface'

let _security: IRateLimitService | undefined

/**
 * Lazily-built, process-wide rate-limit service.
 *
 * @returns {IRateLimitService} The rate-limit service.
 */
export function useSecurity(): IRateLimitService {
  if (!_security) {
    const { config } = useEnv()
    const result = createSecurity({
      redisUrl: config.redisUrl,
      global: { points: config.rateLimitPoints, duration: config.rateLimitDuration },
      auth: { points: config.authRateLimitPoints, duration: config.authRateLimitDuration },
    })
    if (result.isErr()) {
      throw createError({ statusCode: 500, statusMessage: result.error })
    }
    _security = result.value
  }
  return _security
}
