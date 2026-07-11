import type { IEnvService } from '@/server/lib/env/env.interface'
import type { EnvConfig } from '@/server/lib/env/env.types'

/**
 * Common state for environment services: holds the validated config and
 * exposes it read-only. Concrete services extend this rather than
 * re-implementing storage of the config.
 */
abstract class BaseEnvService implements IEnvService {
  readonly config: EnvConfig

  /**
   * @param {EnvConfig} config - Already-validated, immutable configuration.
   */
  protected constructor(config: EnvConfig) {
    this.config = config
  }
}

export { BaseEnvService }
