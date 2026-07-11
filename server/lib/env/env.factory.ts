import { Effect, Schema } from 'effect'
import { EnvError, EnvSchema, type Env } from '@/server/lib/env/env.types'
import { EnvMessage } from '@/server/lib/env/env.message'
import { EnvService } from '@/server/lib/env/env.service'
import type { IEnvService } from '@/server/lib/env/env.interface'
import { HttpStatus } from '@/server/lib/http/http.status'

/** Raw source: Nuxt runtimeConfig (string|undefined values, empties normalized). */
export type EnvSource = Record<string, string | undefined>

/**
 * Validates the raw config and builds the env service.
 *
 * Empty-string values are stripped to `undefined` before decoding so that Nuxt's
 * habit of coercing unset env vars to `""` does not defeat optional/default fields.
 *
 * @param {EnvSource} source - Raw runtimeConfig.
 *
 * @returns {Effect.Effect<IEnvService, EnvError>} The service or a validation error.
 *
 * @example
 * ```ts
 * const svc = await Effect.runPromise(createEnv(useRuntimeConfig()))
 * ```
 */
export function createEnv(source: EnvSource): Effect.Effect<IEnvService, EnvError> {
  const stripped: EnvSource = Object.fromEntries(
    Object.entries(source).map(([k, v]) => [k, v === '' ? undefined : v]),
  )
  return Schema.decodeUnknown(EnvSchema)(stripped).pipe(
    Effect.map((env: Env): IEnvService => new EnvService(env)),
    Effect.mapError((error): EnvError =>
      new EnvError({ message: `${EnvMessage.INVALID}: ${error.message}`, status: HttpStatus.INTERNAL }),
    ),
  )
}
