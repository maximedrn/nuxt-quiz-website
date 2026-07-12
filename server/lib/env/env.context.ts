import { Effect } from 'effect'
import { createEnv } from '@/server/lib/env/env.factory'
import type { IEnvService } from '@/server/lib/env/env.interface'

let _env: IEnvService | undefined

/**
 * Lazily-built, process-wide env service. Throws H3 500 if misconfigured.
 *
 * Validates `useRuntimeConfig()` through the factory on first use and memoizes
 * the result. Any validation failure is a fatal boot condition — it dies with a
 * H3 createError so Nitro surfaces a readable 500.
 *
 * @returns {IEnvService} The validated environment service.
 */
export function useEnv(): IEnvService {
  if (!_env) {
    _env = Effect.runSync(
      createEnv(useRuntimeConfig()).pipe(
        Effect.catchAll((error) =>
          Effect.die(createError({ statusCode: error.status, statusMessage: error.message })),
        ),
      ),
    )
  }
  return _env
}
