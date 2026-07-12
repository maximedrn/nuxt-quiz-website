import { BaseEnvService } from "@/app/lib/env/env.base.ts";

/**
 * Concrete environment service. A thin wrapper over {@link BaseEnvService} —
 * construction is done through `createEnv` (the factory), never directly.
 */
class EnvService extends BaseEnvService {}

export { EnvService };
