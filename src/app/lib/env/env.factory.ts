import { Effect, Schema } from "effect";
import type { IEnvService } from "@/app/lib/env/env.interface.ts";
import { EnvMessage } from "@/app/lib/env/env.message.ts";
import { EnvService } from "@/app/lib/env/env.service.ts";
import { type Env, EnvError, EnvSchema } from "@/app/lib/env/env.types.ts";
import { HttpStatus } from "@/app/lib/http/http.status.ts";

/**
 * Raw source: Nuxt runtimeConfig (string|undefined values, empties normalized).
 */
type EnvSource = Record<string, string | undefined>;

/**
 * Validates the raw config and builds the env service.
 *
 * Empty-string values are stripped to `undefined` before decoding so that
 * Nuxt's habit of coercing unset env vars to `""` does not defeat
 * optional/default fields.
 *
 * @param {EnvSource} source - Raw runtimeConfig.
 *
 * @returns {Effect.Effect<IEnvService, EnvError>} The service or a validation
 *   error.
 */
const createEnv: (source: EnvSource) => Effect.Effect<IEnvService, EnvError> = (
  source: EnvSource,
): Effect.Effect<IEnvService, EnvError> => {
  const stripped: EnvSource = Object.fromEntries(
    Object.entries(source).map(([key, value]): [string, string | undefined] => {
      if (value === "") {
        return [key, undefined];
      }
      return [key, value];
    }),
  );
  return Schema.decodeUnknown(EnvSchema)(stripped).pipe(
    Effect.map((env: Env): IEnvService => new EnvService(env)),
    Effect.mapError(
      (error): EnvError =>
        new EnvError({
          message: `${EnvMessage.invalid}: ${error.message}`,
          status: HttpStatus.internal,
        }),
    ),
  );
};

export { createEnv, type EnvSource };
