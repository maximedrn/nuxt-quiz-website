import is from "@sindresorhus/is";
import { Effect } from "effect";
import { Redis } from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { HttpStatus } from "@/app/lib/http/http.status.ts";
import { FlexibleRateLimitDriver } from "@/app/lib/security/drivers/security.flexible.driver.ts";
import { RateLimitPrefix } from "@/app/lib/security/security.constants.ts";
import type { IRateLimitService } from "@/app/lib/security/security.interface.ts";
import { SecurityMessage } from "@/app/lib/security/security.message.ts";
import { RateLimitService } from "@/app/lib/security/security.service.ts";
import {
  type SecurityConfig,
  SecurityError,
} from "@/app/lib/security/security.types.ts";

/**
 * Builds the rate-limit service backed by Redis.
 *
 * The single entry point for rate-limit construction. Creates a global throttle
 * and a stricter auth limiter, both keyed per IP. Returns an `Effect` that
 * fails with `SecurityError` when the Redis URL is absent.
 *
 * @param {SecurityConfig} config - Redis URL and both limiter budgets.
 *
 * @returns {Effect.Effect<IRateLimitService, SecurityError>} The service, or a
 *   config error.
 */
const createSecurity: (
  config: SecurityConfig,
) => Effect.Effect<IRateLimitService, SecurityError> = (
  config: SecurityConfig,
): Effect.Effect<IRateLimitService, SecurityError> => {
  if (!is.nonEmptyString(config.redisUrl)) {
    return Effect.fail(
      new SecurityError({
        message: SecurityMessage.redisUrlMissing,
        status: HttpStatus.internal,
      }),
    );
  }
  const storeClient: Redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 2,
  });
  const driver: FlexibleRateLimitDriver = new FlexibleRateLimitDriver({
    auth: new RateLimiterRedis({
      duration: config.auth.duration,
      keyPrefix: RateLimitPrefix.auth,
      points: config.auth.points,
      storeClient,
    }),
    global: new RateLimiterRedis({
      duration: config.global.duration,
      keyPrefix: RateLimitPrefix.global,
      points: config.global.points,
      storeClient,
    }),
  });
  return Effect.succeed(new RateLimitService(driver));
};

export { createSecurity };
