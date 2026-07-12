import type { IEnvService } from "@/app/lib/env/env.interface.ts";
import type { EnvConfig } from "@/app/lib/env/env.types.ts";

/**
 * Common state for environment services: holds the validated config and exposes
 * it read-only. Concrete services extend this rather than re-implementing
 * storage of the config.
 */
abstract class BaseEnvService implements IEnvService {
  readonly config: EnvConfig;

  /**
   * @param {EnvConfig} config - Already-validated, immutable configuration.
   */
  constructor(config: EnvConfig) {
    this.config = config;
  }
}

export { BaseEnvService };
