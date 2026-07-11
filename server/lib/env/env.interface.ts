import type { EnvConfig } from '@/server/lib/env/env.types'

/**
 * Public contract for the environment service.
 *
 * Consumers type against this interface, never the concrete class. Exposes the
 * validated, immutable configuration as a single `config` property.
 */
interface IEnvService {
  /** The validated, deeply-immutable environment configuration. */
  readonly config: EnvConfig
}

export type { IEnvService }
