import { Data, Schema } from 'effect'
import type { ReadonlyDeep } from 'type-fest'
import { EnvDefaults, StorageDriverKind } from '@/server/lib/env/env.constants'
import type { HttpStatus } from '@/server/lib/http/http.status'

/** Tagged error for env validation failures. */
export class EnvError extends Data.TaggedError('EnvError')<{
  readonly message: string
  readonly status: HttpStatus
}> {}

/**
 * Marks a string field as optional in the struct, resolving to `string | undefined`.
 * Used for blockchain-conditional fields that are absent by default.
 */
const OptionalString = Schema.optional(Schema.String)

/**
 * Effect Schema for the whole runtime environment.
 *
 * Numeric fields use `Schema.NumberFromString` for coercion from runtimeConfig
 * strings. Absent optional fields fall back to `EnvDefaults` via `optionalWith`.
 * Blockchain-only fields are optional unless `storageDriver === 'blockchain'`,
 * which is enforced by a `Schema.filter` after decoding.
 */
export const EnvSchema = Schema.Struct({
  databaseUrl: Schema.NonEmptyString,
  redisUrl: Schema.optionalWith(Schema.NonEmptyString, { default: () => EnvDefaults.REDIS_URL }),
  storageDriver: Schema.optionalWith(
    Schema.Literal(StorageDriverKind.POSTGRES, StorageDriverKind.BLOCKCHAIN),
    { default: () => EnvDefaults.STORAGE_DRIVER },
  ),
  sessionPassword: Schema.String.pipe(Schema.minLength(32)),
  authLookupPepper: Schema.String.pipe(Schema.minLength(32)),
  rateLimitPoints: Schema.optionalWith(Schema.NumberFromString, {
    default: () => EnvDefaults.RATE_LIMIT_POINTS,
  }),
  rateLimitDuration: Schema.optionalWith(Schema.NumberFromString, {
    default: () => EnvDefaults.RATE_LIMIT_DURATION,
  }),
  authRateLimitPoints: Schema.optionalWith(Schema.NumberFromString, {
    default: () => EnvDefaults.AUTH_RATE_LIMIT_POINTS,
  }),
  authRateLimitDuration: Schema.optionalWith(Schema.NumberFromString, {
    default: () => EnvDefaults.AUTH_RATE_LIMIT_DURATION,
  }),
  /** Whether to trust the `X-Forwarded-For` header (only enable behind a real proxy). */
  trustedProxy: Schema.optionalWith(Schema.Literal('true', 'false'), { default: () => 'false' }),
  rpcUrl: OptionalString,
  contractAddress: OptionalString,
  signerPrivateKey: OptionalString,
})

/** Parsed, validated environment (mutable inference from the schema). */
export type Env = Schema.Schema.Type<typeof EnvSchema>

/** Immutable view of the environment exposed to consumers. */
export type EnvConfig = ReadonlyDeep<Env>
