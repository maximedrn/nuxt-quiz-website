import { Data, Schema } from "effect";
import type { ReadonlyDeep } from "type-fest";
import { EnvDefaults } from "@/app/lib/env/env.constants.ts";
import type { HttpStatus } from "@/app/lib/http/http.status.ts";

/**
 * Tagged error for env validation failures.
 */
class EnvError extends Data.TaggedError("EnvError")<{
  readonly message: string;
  readonly status: HttpStatus;
}> {}

/**
 * Effect Schema for the whole runtime environment.
 *
 * Numeric fields use `Schema.NumberFromString` for coercion from runtimeConfig
 * strings. Absent optional fields fall back to `EnvDefaults` via
 * `optionalWith`.
 */
const EnvSchema = Schema.Struct({
  authLookupPepper: Schema.String.pipe(Schema.minLength(32)),
  authRateLimitDuration: Schema.optionalWith(Schema.NumberFromString, {
    default: () => EnvDefaults.authRateLimitDuration,
  }),
  authRateLimitPoints: Schema.optionalWith(Schema.NumberFromString, {
    default: () => EnvDefaults.authRateLimitPoints,
  }),
  databaseHost: Schema.NonEmptyString,
  databaseName: Schema.NonEmptyString,
  databasePassword: Schema.NonEmptyString,
  databasePort: Schema.optionalWith(Schema.NumberFromString, {
    default: () => EnvDefaults.databasePort,
  }),
  databaseUser: Schema.NonEmptyString,
  rateLimitDuration: Schema.optionalWith(Schema.NumberFromString, {
    default: () => EnvDefaults.rateLimitDuration,
  }),
  rateLimitPoints: Schema.optionalWith(Schema.NumberFromString, {
    default: () => EnvDefaults.rateLimitPoints,
  }),
  redisUrl: Schema.optionalWith(Schema.NonEmptyString, {
    default: () => EnvDefaults.redisUrl,
  }),
  trustedProxy: Schema.optionalWith(Schema.Literal("true", "false"), {
    default: () => "false",
  }),
});

/**
 * Parsed, validated environment (mutable inference from the schema).
 */
type Env = Schema.Schema.Type<typeof EnvSchema>;

/**
 * Immutable view of the environment exposed to consumers.
 */
type EnvConfig = ReadonlyDeep<Env>;

export { type Env, type EnvConfig, EnvError, EnvSchema };
