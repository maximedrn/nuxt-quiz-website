import { BaseEnvService } from '@/server/lib/env/env.base'
import type { EnvConfig } from '@/server/lib/env/env.types'

/**
 * Concrete environment service. A thin wrapper over {@link BaseEnvService} —
 * construction is done through `createEnv` (the factory), never directly.
 */
class EnvService extends BaseEnvService {
  /**
   * @param {EnvConfig} config - Already-validated, immutable configuration.
   */
  constructor(config: EnvConfig) {
    super(config)
  }
}

export { EnvService }
