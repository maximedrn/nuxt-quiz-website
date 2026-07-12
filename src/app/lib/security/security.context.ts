import { Effect } from "effect";
import { useEnv } from "@/app/lib/env/env.context.ts";
import type { IEnvService } from "@/app/lib/env/env.interface.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";
import { createSecurity } from "@/app/lib/security/security.factory.ts";
import type { IRateLimitService } from "@/app/lib/security/security.interface.ts";
import type { SecurityError } from "@/app/lib/security/security.types.ts";

let _security: IRateLimitService | undefined;

/**
 * Lazily-built, process-wide rate-limit service.
 *
 * @returns {IRateLimitService} The rate-limit service.
 */
const useSecurity: () => IRateLimitService = (): IRateLimitService => {
  if (!_security) {
    const env: IEnvService = useEnv();
    const effect: Effect.Effect<IRateLimitService, SecurityError> =
      createSecurity({
        auth: {
          duration: env.config.authRateLimitDuration,
          points: env.config.authRateLimitPoints,
        },
        global: {
          duration: env.config.rateLimitDuration,
          points: env.config.rateLimitPoints,
        },
        redisUrl: env.config.redisUrl,
      });
    const result: IRateLimitService = Effect.runSync(
      effect.pipe(
        Effect.mapError((error: SecurityError): SecurityError => {
          throw createError({
            statusCode: HttpStatus.internal,
            statusMessage: error.message,
          });
        }),
      ),
    );
    _security = result;
  }
  return _security;
};

export { useSecurity };
