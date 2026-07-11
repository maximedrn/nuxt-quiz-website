# Library Adoption + Effect-TS Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hand-rolled code with libraries (nuxt-auth-utils, @nuxtjs/i18n, shadcn-vue) and make Effect-TS the single effect/validation system across `solidity-quiz`.

**Architecture:** Every fallible service returns `Effect.Effect<A, DomainError>` (tagged errors); nullable reads use `effect/Option`; validation uses `effect/Schema`. Route handlers compose `Effect.gen` programs run through one `runOrThrow` helper that maps a tagged-error `_tag` → `HttpStatus`. Auth becomes sealed sessions (nuxt-auth-utils), i18n a module behind a const-enum key wrapper, and UI a shadcn-vue component set with no custom CSS classes.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript 7 (tsgo), Bun, Effect-TS, Drizzle+Postgres, Redis+BentoCache, viem, Tailwind v4, shadcn-vue/reka-ui.

## Global Constraints

- **Effect is the only effect system.** Fallible ops return `Effect.Effect<A, E>`; no `neverthrow`, no `try/catch`. Deps `neverthrow`, `option-t`, `zod`, `jose`, `@node-rs/argon2` are removed by end of plan.
- **`effect/Schema`, `effect/Option`, `effect/Data`** come from the installed `effect` package — no new effect deps.
- **No `utils` folders** anywhere. All imports use the `@/` root alias; explicit imports only (no reliance on Nitro/Nuxt user auto-imports).
- **Const-object unions**, never `type X = 'a' | 'b'`: `const X = { A: 'a' } as const; type X = (typeof X)[keyof typeof X]`.
- **HTTP status codes** come from the `HttpStatus` const enum; **static messages** come from per-domain `<domain>.message.ts` const enums; interpolate dynamic parts at the call site.
- **Type every variable** — explicit annotations on every `const`/`let`; for un-nameable library types, annotate with the library's exported return type or map immediately into a typed domain shape.
- **Per-domain structure** under `server/lib/<domain>/` (constants/types/interface/base/service/factory/message + drivers) is preserved.
- **`cn()` takes one class per argument**: `cn("flex", "items-center")`, never `cn("flex items-center")`.
- **TSDoc** on every exported/private function and class (existing template).
- Tests: Vitest, co-located `*.test.ts`, run effects via `Effect.runPromise`/`Effect.runPromiseExit`, assert on tagged errors. Descriptions Capitalized, end with a period.
- Commands: `bun run test`, `bun run typecheck` (tsgo), `bun run lint`, `bun run build`.

---

## Task 0: Repo init + dependency swap

**Files:**
- Modify: `package.json` (deps)

- [ ] **Step 1: Initialize git (repo is not yet under version control)**

Run: `git init && git add -A && git commit -m "chore: snapshot before Effect/libs migration"`
Expected: initial commit created.

- [ ] **Step 2: Remove superseded deps**

Run: `bun remove neverthrow option-t zod jose @node-rs/argon2`
Expected: removed from `package.json`.

- [ ] **Step 3: Add libraries**

Run: `bun add nuxt-auth-utils @nuxtjs/i18n && bun add -d shadcn-vue`
Expected: installed. (`reka-ui`, `class-variance-authority`, `clsx`, `tailwind-merge` are pulled by shadcn-vue init in Task C1; `effect`, `ts-pattern`, `type-fest`, `@sindresorhus/is` stay.)

- [ ] **Step 4: Commit**

Run: `git add -A && git commit -m "chore: swap deps for Effect/nuxt-auth-utils/i18n/shadcn"`

---

# Phase F — Effect core swap (+ Phase D const enums)

## Task F1: HTTP status enum, message base, and the run helper

**Files:**
- Create: `server/lib/http/http.status.ts`
- Create: `server/lib/http/http.error.ts`
- Create: `server/lib/http/http.run.ts`
- Delete: `server/lib/http/http.result.ts`
- Test: `server/lib/http/http.run.test.ts`

**Interfaces:**
- Produces: `HttpStatus` (const enum), `AppError` (base tagged-error type = `{ _tag: string; message: string; status: HttpStatus }`), `runOrThrow<A, E extends AppError>(effect: Effect.Effect<A, E>): Promise<A>`.

- [ ] **Step 1: Write `http.status.ts`**

```ts
/** HTTP status codes used across the API. */
export const enum HttpStatus {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  CONFLICT = 409,
  TOO_MANY_REQUESTS = 429,
  INTERNAL = 500,
}
```

- [ ] **Step 2: Write `http.error.ts`** — the shape every domain tagged error satisfies.

```ts
import type { HttpStatus } from '@/server/lib/http/http.status'

/** Contract every domain tagged error satisfies so the HTTP boundary can map it. */
export interface AppError {
  readonly _tag: string
  readonly message: string
  readonly status: HttpStatus
}
```

- [ ] **Step 3: Write the failing test `http.run.test.ts`**

```ts
import { Data, Effect } from 'effect'
import { describe, expect, it } from 'vitest'
import { HttpStatus } from '@/server/lib/http/http.status'
import { runOrThrow } from '@/server/lib/http/http.run'

class SampleError extends Data.TaggedError('SampleError')<{
  readonly message: string
  readonly status: HttpStatus
}> {}

describe('runOrThrow', () => {
  /** A succeeding effect resolves to its value — the happy path handlers rely on. */
  it('Resolves the success value.', async () => {
    const value = await runOrThrow(Effect.succeed(42))
    expect(value).toBe(42)
  })

  /** A failing tagged error becomes an H3 error carrying its status + message. */
  it('Throws an H3 error with the tagged error status.', async () => {
    const effect = Effect.fail(new SampleError({ message: 'nope', status: HttpStatus.NOT_FOUND }))
    await expect(runOrThrow(effect)).rejects.toMatchObject({ statusCode: 404, statusMessage: 'nope' })
  })
})
```

- [ ] **Step 4: Run it, expect FAIL** — `bunx vitest run server/lib/http/http.run.test.ts` → fails (module missing).

- [ ] **Step 5: Write `http.run.ts`**

```ts
import { Effect, Exit, Cause } from 'effect'
import { Option } from 'effect'
import type { AppError } from '@/server/lib/http/http.error'

/**
 * Runs an effect and returns its value, or throws an H3 error built from the
 * failed tagged error. The single bridge between the Effect world of the
 * services and Nitro's throw-based HTTP errors.
 *
 * @param {Effect.Effect<A, E>} effect - The program to run.
 * @returns {Promise<A>} The success value.
 */
export async function runOrThrow<A, E extends AppError>(effect: Effect.Effect<A, E>): Promise<A> {
  const exit: Exit.Exit<A, E> = await Effect.runPromiseExit(effect)
  if (Exit.isSuccess(exit)) return exit.value
  const failure: Option.Option<E> = Cause.failureOption(exit.cause)
  if (Option.isSome(failure)) {
    throw createError({ statusCode: failure.value.status, statusMessage: failure.value.message })
  }
  throw createError({ statusCode: 500, statusMessage: 'Internal error' })
}
```

- [ ] **Step 6: Run test, expect PASS.** Delete `server/lib/http/http.result.ts`.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(http): Effect run helper + HttpStatus enum"`

---

## Task F2: env domain → Schema + Effect

**Files:**
- Modify: `server/lib/env/env.types.ts` (Zod → Schema), `env.factory.ts`, `env.context.ts`, `env.interface.ts`, `env.base.ts`, `env.service.ts`
- Rename: `env.error.ts` → `env.message.ts` (const enum) + add `EnvError` tagged error in `env.types.ts`
- Test: `server/lib/env/env.factory.test.ts`

**Interfaces:**
- Produces: `EnvError` (`Data.TaggedError`, `status: HttpStatus.INTERNAL`), `createEnv(source): Effect.Effect<IEnvService, EnvError>`, `useEnv(): IEnvService` (runs the effect with `Effect.runSync`, throws H3 500 on failure).

- [ ] **Step 1: Write `env.message.ts`**

```ts
/** Static messages for the environment domain. */
export const enum EnvMessage {
  INVALID = 'Invalid environment configuration',
}
```

- [ ] **Step 2: Rewrite `env.types.ts` with `effect/Schema`** — replace the Zod object. Numeric env vars use `Schema.NumberFromString`; empty strings normalized via a `Schema.transform`. Blockchain-conditional requireds via `Schema.filter`.

```ts
import { Data, Schema } from 'effect'
import type { ReadonlyDeep } from 'type-fest'
import { EnvDefaults, StorageDriverKind } from '@/server/lib/env/env.constants'
import { EnvMessage } from '@/server/lib/env/env.message'
import { HttpStatus } from '@/server/lib/http/http.status'

/** Tagged error for env validation failures. */
export class EnvError extends Data.TaggedError('EnvError')<{
  readonly message: string
  readonly status: HttpStatus
}> {}

/** Coerces "" → undefined so optional/default fields behave. */
const OptionalString = Schema.optional(
  Schema.transform(Schema.String, Schema.String, { decode: (s) => s, encode: (s) => s }),
)

export const EnvSchema = Schema.Struct({
  databaseUrl: Schema.NonEmptyString,
  redisUrl: Schema.optionalWith(Schema.NonEmptyString, { default: () => EnvDefaults.REDIS_URL }),
  storageDriver: Schema.optionalWith(
    Schema.Literal(StorageDriverKind.POSTGRES, StorageDriverKind.BLOCKCHAIN),
    { default: () => EnvDefaults.STORAGE_DRIVER },
  ),
  sessionPassword: Schema.String.pipe(Schema.minLength(32)),
  accessTokenTtl: Schema.optionalWith(Schema.NumberFromString, { default: () => EnvDefaults.ACCESS_TOKEN_TTL }),
  rateLimitPoints: Schema.optionalWith(Schema.NumberFromString, { default: () => EnvDefaults.RATE_LIMIT_POINTS }),
  rateLimitDuration: Schema.optionalWith(Schema.NumberFromString, { default: () => EnvDefaults.RATE_LIMIT_DURATION }),
  authRateLimitPoints: Schema.optionalWith(Schema.NumberFromString, { default: () => EnvDefaults.AUTH_RATE_LIMIT_POINTS }),
  authRateLimitDuration: Schema.optionalWith(Schema.NumberFromString, { default: () => EnvDefaults.AUTH_RATE_LIMIT_DURATION }),
  rpcUrl: OptionalString,
  contractAddress: OptionalString,
  signerPrivateKey: OptionalString,
})

export type Env = Schema.Schema.Type<typeof EnvSchema>
export type EnvConfig = ReadonlyDeep<Env>
```

Note: `sessionPassword` replaces the two JWT secrets (see `env.constants.ts` update: remove JWT TTLs that are gone; keep access/refresh not needed — drop `refreshTokenTtl`). Update `env.constants.ts` `EnvDefaults` accordingly (remove `REFRESH_TOKEN_TTL`).

- [ ] **Step 3: Rewrite `env.factory.ts`** to return an Effect.

```ts
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
 * @param {EnvSource} source - Raw runtimeConfig.
 * @returns {Effect.Effect<IEnvService, EnvError>} The service or a validation error.
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
```

- [ ] **Step 4: Update `env.context.ts`** to run synchronously.

```ts
import { Effect } from 'effect'
import { createEnv } from '@/server/lib/env/env.factory'
import type { IEnvService } from '@/server/lib/env/env.interface'

let _env: IEnvService | undefined

/** Lazily-built, process-wide env service. Throws H3 500 if misconfigured. */
export function useEnv(): IEnvService {
  if (!_env) {
    _env = Effect.runSync(
      createEnv(useRuntimeConfig()).pipe(
        Effect.catchAll((error) => Effect.die(createError({ statusCode: error.status, statusMessage: error.message }))),
      ),
    )
  }
  return _env
}
```

- [ ] **Step 5: Rewrite `env.factory.test.ts`** — decode via the effect; assert defaults, coercion, min-length rejection, blockchain requireds. (Run effects with `Effect.runPromiseExit`; assert `Exit.isFailure` for the reject cases.)

```ts
import { Effect, Exit } from 'effect'
import { describe, expect, it } from 'vitest'
import { createEnv } from '@/server/lib/env/env.factory'

const base = { databaseUrl: 'postgres://x', sessionPassword: 'a'.repeat(32) }

describe('createEnv', () => {
  /** Absent optionals fall back to documented defaults so the app boots from DB + session secret. */
  it('Applies defaults for absent optionals.', async () => {
    const svc = await Effect.runPromise(createEnv(base))
    expect(svc.config.storageDriver).toBe('postgres')
    expect(svc.config.accessTokenTtl).toBe(900)
  })

  /** A too-short session password must be rejected — it is the cookie sealing key. */
  it('Rejects a short session password.', async () => {
    const exit = await Effect.runPromiseExit(createEnv({ ...base, sessionPassword: 'short' }))
    expect(Exit.isFailure(exit)).toBe(true)
  })
})
```

- [ ] **Step 6: Run tests + tsgo** — `bunx vitest run server/lib/env` PASS; `bunx tsgo --noEmit -p .nuxt/tsconfig.server.json` clean for env.
- [ ] **Step 7: Commit** — `git commit -am "refactor(env): Schema + Effect, drop zod"`

---

## Task F3: database domain → Effect

**Files:** Modify `server/lib/database/database.interface.ts`, `database.base.ts`, `database.service.ts`, `database.factory.ts`, `database.context.ts`, `drivers/database.drizzle.driver.ts`, `drivers/database.driver.interface.ts`; rename `database.error.ts` → `database.message.ts` + add `DatabaseError` tagged error in `database.types.ts`.

**Interfaces:**
- Produces: `DatabaseError` (`Data.TaggedError`, `status: HttpStatus.INTERNAL`), `IDatabaseService.disconnect(): Effect.Effect<void, DatabaseError>`, `createDatabase(config): Effect.Effect<IDatabaseService, DatabaseError>`, `useDatabase(): IDatabaseService`.

- [ ] **Step 1: `database.message.ts`**

```ts
/** Static messages for the database domain. */
export const enum DatabaseMessage {
  URL_MISSING = 'DATABASE_URL is required to open a database connection',
  DISCONNECT_FAILED = 'Failed to close the database connection',
}
```

- [ ] **Step 2: Add tagged error to `database.types.ts`**

```ts
import { Data } from 'effect'
import { HttpStatus } from '@/server/lib/http/http.status'
export class DatabaseError extends Data.TaggedError('DatabaseError')<{
  readonly message: string
  readonly status: HttpStatus
}> {}
```

- [ ] **Step 3: Convert driver `disconnect`** to Effect.

```ts
import { Effect } from 'effect'
import { DatabaseError } from '@/server/lib/database/database.types'
import { DatabaseMessage } from '@/server/lib/database/database.message'
import { HttpStatus } from '@/server/lib/http/http.status'
// inside DrizzleDatabaseDriver:
disconnect(): Effect.Effect<void, DatabaseError> {
  return Effect.tryPromise({
    try: (): Promise<void> => this.client.end(),
    catch: (error): DatabaseError =>
      new DatabaseError({
        message: `${DatabaseMessage.DISCONNECT_FAILED}: ${error instanceof Error ? error.message : String(error)}`,
        status: HttpStatus.INTERNAL,
      }),
  })
}
```

- [ ] **Step 4: `createDatabase` returns Effect** (validate url with `@sindresorhus/is`, `Effect.fail` on missing); `useDatabase` runs via `Effect.runSync` + `Effect.catchAll → Effect.die(createError)` (mirror F2 Step 4). Update interface/base/service signatures to `Effect`.
- [ ] **Step 5: tsgo clean for database.** Commit — `git commit -am "refactor(database): Effect signatures"`

---

## Task F4: cache domain → Effect + Option

**Files:** Modify `server/lib/cache/cache.types.ts`, `cache.interface.ts`, `cache.base.ts`, `cache.service.ts`, `cache.factory.ts`, `cache.context.ts`, `drivers/cache.driver.interface.ts`, `drivers/cache.bentocache.driver.ts`; rename `cache.error.ts` → `cache.message.ts` + `CacheError` tagged error; update `cache.constants.ts` (remove `refreshToken` key — auth no longer uses it). Test: `cache.service.test.ts` (new, stub driver).

**Interfaces:**
- Produces: `CacheError` (`Data.TaggedError`, `status: HttpStatus.INTERNAL`); `CacheOperations` with `getOrSet<A>(key, ttl, factory: () => Effect.Effect<A, CacheError>): Effect.Effect<A, CacheError>`, `set/get/delete` returning Effect; `get<A>` → `Effect.Effect<Option.Option<A>, CacheError>`.

- [ ] **Step 1: `cache.message.ts`** + `CacheError` tagged error (pattern as F3 Step 1–2).
- [ ] **Step 2: Rewrite `CacheOperations`** (types) to Effect + `Option`.

```ts
import type { Effect, Option } from 'effect'
import type { CacheError } from '@/server/lib/cache/cache.types'
export interface CacheOperations {
  getOrSet<A>(key: string, ttlSeconds: number, factory: () => Effect.Effect<A, CacheError>): Effect.Effect<A, CacheError>
  set<A>(key: string, value: A, ttlSeconds: number): Effect.Effect<void, CacheError>
  get<A>(key: string): Effect.Effect<Option.Option<A>, CacheError>
  delete(key: string): Effect.Effect<void, CacheError>
}
```

- [ ] **Step 3: Rewrite the BentoCache driver** using Effect end-to-end. `getOrSet`'s factory is an Effect run via `Effect.runPromise` inside bento's promise factory; point reads/writes keep the `Effect.timeout`/`Effect.retry` policy.

```ts
import { Duration, Effect, Option, Schedule } from 'effect'
// run<A>: wraps a bento thunk with timeout+retry, tagging failures with CacheError
private run<A>(op: string, thunk: () => Promise<A>): Effect.Effect<A, CacheError> {
  return Effect.tryPromise({
    try: thunk,
    catch: (e): CacheError => new CacheError({ message: `${CacheMessage.OP_FAILED}: ${op}: ${String(e)}`, status: HttpStatus.INTERNAL }),
  }).pipe(Effect.timeout(Duration.seconds(2)), Effect.retry(Schedule.recurs(2)),
    Effect.catchAll((e): Effect.Effect<A, CacheError> =>
      Effect.fail(e instanceof CacheError ? e : new CacheError({ message: `${CacheMessage.OP_FAILED}: ${op}`, status: HttpStatus.INTERNAL }))))
}
get<A>(key: string): Effect.Effect<Option.Option<A>, CacheError> {
  return this.run('get', () => this.bento.get<A | undefined>({ key, defaultValue: undefined }))
    .pipe(Effect.map((v): Option.Option<A> => (v === undefined ? Option.none() : Option.some(v))))
}
getOrSet<A>(key: string, ttlSeconds: number, factory: () => Effect.Effect<A, CacheError>): Effect.Effect<A, CacheError> {
  return this.run('getOrSet', () => this.bento.getOrSet<A>({ key, ttl: `${ttlSeconds}s`, factory: () => Effect.runPromise(factory()) }))
}
```

- [ ] **Step 4: Write `cache.service.test.ts`** with a stub `ICacheDriver` (in-memory Map, returns Effects) verifying `getOrSet` computes-once then caches, and `delete` removes. Run via `Effect.runPromise`.
- [ ] **Step 5: tsgo + vitest clean.** Commit — `git commit -am "refactor(cache): Effect + Option"`

---

## Task F5: storage domain → Effect + Option + Schema

**Files:** Modify `storage.types.ts` (StorageOperations → Effect/Option; add `StorageError` tagged error), `storage.interface.ts`, `storage.base.ts`, `storage.service.ts`, `storage.factory.ts`, `storage.context.ts`, `storage.stats.ts` (pure — unchanged logic, add explicit types), `storage.cache.ts`, `drivers/storage.drizzle.driver.ts`, `drivers/storage.blockchain.driver.ts`, `drivers/storage.driver.interface.ts`; rename `storage.error.ts` → `storage.message.ts`. Tests: `storage.stats.test.ts` (unchanged assertions), driver conformance stays pure.

**Interfaces:**
- Produces: `StorageError` (`Data.TaggedError`; `status` per op — `NOT_FOUND`/`INTERNAL`); `StorageOperations` methods return `Effect.Effect<…, StorageError>`; `getSession` → `Effect.Effect<Option.Option<StoredSession>, StorageError>`; `createStorage(env, db): Effect.Effect<IStorageService, StorageError>`; `useQuizStorage(): Promise<IStorageService>` (blockchain driver still lazy-imported; build runs the Effect).

- [ ] **Step 1: `storage.message.ts`** const enum (`QUERY_FAILED`, `SESSION_INSERT_FAILED`, `NOT_IMPLEMENTED`) + `StorageError` tagged error in `storage.types.ts`.
- [ ] **Step 2: Convert the Drizzle driver** — replace the `ResultAsync.fromPromise(query, …)` helper with an Effect `query` helper; `getSession` maps to `Option`.

```ts
private query<A>(op: string, run: () => Promise<A>): Effect.Effect<A, StorageError> {
  return Effect.tryPromise({
    try: run,
    catch: (e): StorageError => new StorageError({ message: `${StorageMessage.QUERY_FAILED}: ${op}: ${e instanceof Error ? e.message : String(e)}`, status: HttpStatus.INTERNAL }),
  })
}
getSession(id: number): Effect.Effect<Option.Option<StoredSession>, StorageError> {
  return this.query('getSession', async (): Promise<StoredSession | undefined> => {
    const [row] = await this.db.select().from(quizSessions).where(eq(quizSessions.id, id)).limit(1)
    return row
  }).pipe(Effect.map((row): Option.Option<StoredSession> => (row ? Option.some(row) : Option.none())))
}
```

- [ ] **Step 3: Convert the blockchain driver** the same way (`this.call` returns Effect; `getSession` → Option). Read/write bodies unchanged (viem inline literal calls).
- [ ] **Step 4: `storage.factory.ts`** — `buildDrizzle` returns `Effect.succeed(service)`; `buildBlockchain` returns an Effect that `Effect.tryPromise`s the dynamic import then validates chain fields (`isHex`) with `Effect.fail(new StorageError(...))`. `createStorage` selects via `ts-pattern`.
- [ ] **Step 5: `storage.context.ts`** — `useQuizStorage` awaits `Effect.runPromise(createStorage(...))`, converting failure to `createError` via `Effect.catchAll`.
- [ ] **Step 6: `storage.cache.ts`** — `cachedStats`/`cachedQuestionCount` become Effect-returning (compose `useCache().getOrSet` with the storage effect); `invalidateStatsCache` returns `Effect.Effect<void, CacheError>`.
- [ ] **Step 7: tsgo + vitest (storage) clean.** Commit — `git commit -am "refactor(storage): Effect + Option"`

---

## Task F6: security domain → Effect

**Files:** Modify `security.types.ts` (+`SecurityError` tagged error), `security.interface.ts`, `security.base.ts`, `security.service.ts`, `security.factory.ts`, `security.context.ts`, `drivers/security.flexible.driver.ts`; rename `security.error.ts` → `security.message.ts`. Test: `security.service.test.ts` (RateLimiterMemory injected).

**Interfaces:**
- Produces: `SecurityError` (`Data.TaggedError`, `status: HttpStatus.INTERNAL`); `consume(key, kind): Effect.Effect<RateLimitResult, SecurityError>`.

- [ ] **Step 1:** `consume` wraps the limiter promise (the `RateLimiterRes`-rejection-to-`allowed:false` translation stays inside a `.then/.catch` promise, then `Effect.tryPromise` wraps it). Selection via `ts-pattern`.
- [ ] **Step 2:** Rewrite `security.service.test.ts` to run effects (`Effect.runPromise`): budget-then-block, per-key independence.
- [ ] **Step 3: tsgo + vitest clean.** Commit — `git commit -am "refactor(security): Effect"`

---

## Task F7: quiz domain → Schema + Effect + Option

**Files:** Modify `quiz.validation.ts` (Zod → Schema), `quiz.session.ts` (Option/Effect), `quiz.question.ts` (explicit types); add `quiz.message.ts` + `QuizError` tagged error in a new `quiz.types.ts`.

**Interfaces:**
- Produces: `QuizError` (`Data.TaggedError`; `status: BAD_REQUEST`/`NOT_FOUND`); `answerLetterSchema`/`sessionModeSchema`/`createSessionSchema`/`submitAnswerSchema` as `Schema.Schema`; `decodeOr400<A>(schema, value): Effect.Effect<A, QuizError>`; `parseSessionId(value: string | undefined): Effect.Effect<number, QuizError>`; `getOwnedSession(storage, id, userId): Effect.Effect<StoredSession, StorageError | QuizError>`.

- [ ] **Step 1: `quiz.validation.ts` with Schema**

```ts
import { Effect, Schema } from 'effect'
import { AnswerLetter, SessionMode } from '@/shared/types'
import { QuizError } from '@/server/lib/quiz/quiz.types'
import { QuizMessage } from '@/server/lib/quiz/quiz.message'
import { HttpStatus } from '@/server/lib/http/http.status'

export const answerLetterSchema = Schema.Literal(AnswerLetter.A, AnswerLetter.B, AnswerLetter.C, AnswerLetter.D)
export const sessionModeSchema = Schema.Literal(SessionMode.SEQUENTIAL, SessionMode.RANDOM)
export const createSessionSchema = Schema.Struct({ mode: sessionModeSchema, size: Schema.NumberFromString.pipe(Schema.int(), Schema.positive()) })
export const submitAnswerSchema = Schema.Struct({ questionId: Schema.NumberFromString.pipe(Schema.int(), Schema.positive()), selected: answerLetterSchema })

/** Decodes a value or fails with a 400 QuizError. */
export function decodeOr400<A, I>(schema: Schema.Schema<A, I>, value: unknown): Effect.Effect<A, QuizError> {
  return Schema.decodeUnknown(schema)(value).pipe(
    Effect.mapError((e): QuizError => new QuizError({ message: `${QuizMessage.INVALID_INPUT}: ${e.message}`, status: HttpStatus.BAD_REQUEST })),
  )
}
```

- [ ] **Step 2: `quiz.session.ts`** — `getOwnedSession` composes `storage.getSession` (Option) + ownership; `Option.isNone` or wrong `userId` → `Effect.fail(new QuizError({ message: QuizMessage.SESSION_NOT_FOUND + …, status: HttpStatus.NOT_FOUND }))`.
- [ ] **Step 3: tsgo clean for quiz.** Commit — `git commit -am "refactor(quiz): Schema + Effect + Option"`

---

## Task F8: API routes → Effect programs

**Files:** Modify all handlers in `server/api/**` (8 quiz routes; auth routes are replaced in Phase A). Each becomes an `Effect.gen` program run through `runOrThrow`.

**Interfaces:** Consumes `runOrThrow`, the Effect service methods, `decodeOr400`, `getOwnedSession`, `requireUserId`.

- [ ] **Step 1: Convert `sessions/index.post.ts` (representative — full code).**

```ts
import { Effect } from 'effect'
import { match } from 'ts-pattern'
import type { CreateSessionResult } from '@/shared/types'
// F8 keeps the EXISTING `requireUserId` from `@/server/lib/auth/auth.http`.
// Phase A (Task A2/A3) replaces that helper with the session-based one in
// `@/server/lib/auth/auth.session` and updates this import in every route.
import { requireUserId } from '@/server/lib/auth/auth.http'
import { HttpStatus } from '@/server/lib/http/http.status'
import { runOrThrow } from '@/server/lib/http/http.run'
import { shuffle } from '@/server/lib/quiz/quiz.question'
import { createSessionSchema, decodeOr400 } from '@/server/lib/quiz/quiz.validation'
import { QuizError } from '@/server/lib/quiz/quiz.types'
import { QuizMessage } from '@/server/lib/quiz/quiz.message'
import { useQuizStorage } from '@/server/lib/storage/storage.context'

export default defineEventHandler(async (event): Promise<CreateSessionResult> => {
  const userId: number = await requireUserId(event)
  const body: unknown = await readBody(event)
  const storage = await useQuizStorage()
  return runOrThrow(
    Effect.gen(function* () {
      const input = yield* decodeOr400(createSessionSchema, body)
      const refs = yield* storage.listQuestionRefs()
      if (refs.length === 0)
        return yield* Effect.fail(new QuizError({ message: QuizMessage.NO_QUESTIONS, status: HttpStatus.INTERNAL }))
      if (input.size > refs.length)
        return yield* Effect.fail(new QuizError({ message: `${QuizMessage.SIZE_RANGE}: 1..${refs.length}`, status: HttpStatus.BAD_REQUEST }))
      const ordered = match(input.mode)
        .with('sequential', () => [...refs].sort((a, b) => a.number - b.number))
        .with('random', () => shuffle(refs))
        .exhaustive()
      const questionIds: number[] = ordered.slice(0, input.size).map((r) => r.id)
      const session = yield* storage.createSession({ userId, questionIds, mode: input.mode })
      return { id: session.id }
    }),
  )
})
```

- [ ] **Step 2: Convert the remaining 7 quiz routes** the same way — each: read inputs, build an `Effect.gen` program using the service effects + `getOwnedSession`, `return runOrThrow(program)`. Files: `sessions/index.get.ts`, `sessions/[id]/index.get.ts`, `sessions/[id]/answer.post.ts`, `sessions/[id]/finish.post.ts`, `sessions/[id]/results.get.ts`, `stats.get.ts`, `questions/count.get.ts`. `Option` results from `getOwnedSession`/`getQuestionsByIds([id])` are unwrapped with `Option.getOrNull` + a `QuizError` on missing. `answer`/`finish` chain `invalidateStatsCache` into the program.
- [ ] **Step 3: tsgo clean for `server/api`.** Commit — `git commit -am "refactor(api): Effect route programs"`

---

## Task F9: purge neverthrow/option-t/zod usages + verify

- [ ] **Step 1:** `grep -rn "neverthrow\|option-t\|from 'zod'" server shared app` → expect no matches (all migrated). Fix stragglers.
- [ ] **Step 2:** `bun run test` (all green), `bun run typecheck` (clean), `bun run lint` (0 errors).
- [ ] **Step 3: Commit** — `git commit -am "chore: remove neverthrow/option-t/zod usage"`

---

# Phase A — Auth → nuxt-auth-utils

> **Security requirements (from automated review of the pre-migration auth code — must be satisfied by this phase):**
> - **[CRITICAL] No registration credential-enumeration oracle.** `register` must not return a distinguishable "code taken" outcome that lets an attacker probe which 8-digit codes exist. On collision, return the SAME opaque error/status as any other failure, and **always run a hash** (dummy on the collision path) so there is no timing side channel. Apply the aggressive per-IP auth rate-limit budget to `/api/auth/register` too.
> - **[MEDIUM] Constant-time login.** On the user-not-found path, run a dummy `verifyPassword` against a fixed sentinel hash before returning `INVALID_CREDENTIALS`, so hit/miss are indistinguishable by timing.
> - **[MEDIUM] Dedicated lookup pepper.** The `codeLookup` HMAC pepper must be its own env var (`AUTH_LOOKUP_PEPPER`, generated independently), NOT reused from `NUXT_SESSION_PASSWORD`/any signing secret. Add it to `env` (Task F2/A1) and `createAuth`.
>
> **Rate-limit middleware hardening (survives the migration — fix in a dedicated step, see Task A5):**
> - **[HIGH] Trusted-proxy IP.** Do not trust client `X-Forwarded-For` unconditionally. Default to the socket IP; only honor XFF (right-most entry after N trusted hops, or a proxy header like `X-Real-IP`) when behind a configured trusted proxy.
> - **[HIGH] Fail closed on `/api/auth/*`.** On limiter error, auth/account-creation endpoints must return 503/429 (fail closed), not allow the request. Global non-auth paths may still fail open.

## Task A1: register the module + session config

**Files:** Modify `nuxt.config.ts` (add `nuxt-auth-utils` to `modules`), `.env`/`.env.example` (add `NUXT_SESSION_PASSWORD`, remove `JWT_*`), `server/lib/env/env.constants.ts`.

- [ ] **Step 1:** Add `'nuxt-auth-utils'` to `modules`. Add `NUXT_SESSION_PASSWORD` (`openssl rand -base64 32`) to `.env`/`.env.example`; remove `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`/`REFRESH_TOKEN_TTL` from both and from `runtimeConfig`.
- [ ] **Step 2:** `bun run postinstall` regenerates types (adds `#auth-utils` types). Commit.

## Task A2: credential service (Effect) over shared DB + lib hashing

**Files:** Modify `auth.types.ts` (`AuthError` tagged error; `AuthOperations` = `register(code): Effect.Effect<{ id }, AuthError>`, `login(code): Effect.Effect<{ id }, AuthError>`), `auth.service.ts`, `auth.factory.ts`, `auth.constants.ts`; rename `auth.error.ts` → `auth.message.ts`; **delete** `auth.base.ts` (JWT/refresh machinery), `auth.http.ts`, `auth.context.ts` is slimmed. Create `server/lib/auth/auth.session.ts` (`requireUserId`).

**Interfaces:**
- Produces: `AuthError` (`INVALID_CREDENTIALS`→401, `CODE_TAKEN`→409); `createAuth(db): IAuthCredentialService`; `requireUserId(event): Promise<number>` (wraps `requireUserSession`).

- [ ] **Step 1:** `auth.message.ts` const enum (`CODE_TAKEN`, `INVALID_CREDENTIALS`). `AuthError` tagged error.
- [ ] **Step 2:** Rewrite the service: `lookup(code)` (peppered HMAC via `node:crypto`, pepper = `NUXT_SESSION_PASSWORD`), `hashCode`/`verifyCode` via nuxt-auth-utils `hashPassword`/`verifyPassword` (auto-imported server utils), `findByLookup`/`insertUser` as Effect DB ops. `register`: fail `CODE_TAKEN` if lookup exists else insert → `{ id }`. `login`: find + `verifyPassword` → `{ id }` or fail `INVALID_CREDENTIALS`.
- [ ] **Step 3:** `auth.session.ts`:

```ts
import type { H3Event } from 'h3'
/** Returns the authenticated user id, or throws 401 (nuxt-auth-utils). */
export async function requireUserId(event: H3Event): Promise<number> {
  const session = await requireUserSession(event)
  return session.user.id
}
```

(`requireUserSession`/`setUserSession`/`clearUserSession` are auto-imported by nuxt-auth-utils. Augment its `User` type in a `server/lib/auth/auth.d.ts`: `declare module '#auth-utils' { interface User { id: number } }`.)

- [ ] **Step 4:** tsgo clean for auth service. Commit.

## Task A3: auth routes on sessions

**Files:** Rewrite `server/api/auth/register.post.ts`, `login.post.ts`, `logout.post.ts`, `me.get.ts`; **delete** `refresh.post.ts` and `server/middleware/01.auth.ts`. Update `shared/types` (`AuthResult` → `{ userId: number }` or drop token fields).

- [ ] **Step 1:** `register`/`login`: read `code`, run the credential Effect via `runOrThrow`, then `await setUserSession(event, { user: { id } })`, return `{ userId: id }`.
- [ ] **Step 2:** `logout`: `await clearUserSession(event)`; `me`: `{ userId: await requireUserId(event) }`.
- [ ] **Step 3:** Remove refresh-token cache keys from `cache.constants.ts` (done in F4). Commit.

## Task A4: frontend auth on the session

**Files:** Modify `app/composables/useAuth.ts`, `app/composables/useApi.ts`, `app/middleware/auth.global.ts`, `app/pages/login.vue`.

- [ ] **Step 1:** `useAuth` wraps `useUserSession()` (`loggedIn`, `user`, `fetch`, `clear`) + `register`/`login` POST helpers that call `fetch()` after success.
- [ ] **Step 2:** `useApi`: drop the bearer header + 401-refresh retry — plain `$fetch` (cookie is sent automatically).
- [ ] **Step 3:** `auth.global.ts`: redirect to `/login` when `!loggedIn.value` (from `useUserSession`), except on `/login`.
- [ ] **Step 4:** `bun run build` (SSR gate). Runtime smoke: register → cookie set → protected route works → logout clears. Commit — `git commit -am "feat(auth): nuxt-auth-utils sessions"`

## Task A5: rate-limit middleware hardening

**Files:** Modify `server/middleware/00.rate-limit.ts`; add `TRUSTED_PROXY` (bool) to `env` if needed.

- [ ] **Step 1: Trusted-proxy IP.** Derive the client IP from the socket by default (`getRequestIP(event)` without `xForwardedFor`, falling back to `event.node.req.socket.remoteAddress`). Only honor `X-Forwarded-For` when a `trustedProxy` env flag is set, and then take the right-most entry (or a proxy-set `X-Real-IP`). Never trust client XFF otherwise.
- [ ] **Step 2: Fail closed on auth.** When `useSecurity().consume(...)` yields a limiter error (`Effect` failure) AND the path starts with `/api/auth/`, throw `HttpStatus.TOO_MANY_REQUESTS` (fail closed). Non-auth paths may still fail open (return without blocking).
- [ ] **Step 3:** Test both branches (spoofed XFF ignored; limiter-error on `/api/auth/*` → 429). `bun run build`. Commit — `git commit -am "fix(security): trusted-proxy IP + fail-closed auth rate limit"`

---

# Phase B — i18n → @nuxtjs/i18n

## Task B1: module + catalogs + const-enum wrapper

**Files:** Modify `nuxt.config.ts` (add `@nuxtjs/i18n`, config), create `i18n/locales/fr.json` + `en.json` (or TS), keep `app/lib/i18n/i18n.keys.ts` (const enum), rewrite `app/composables/useI18n.ts` as a typed wrapper, delete `app/lib/i18n/i18n.messages.ts`.

- [ ] **Step 1:** Add `@nuxtjs/i18n` to `modules`; config `{ defaultLocale: 'fr', strategy: 'no_prefix', locales: [{code:'fr',file:'fr.json'},{code:'en',file:'en.json'}] }`.
- [ ] **Step 2:** Move the fr/en messages into locale files, keyed by the `TranslationKey` values (dotted strings).
- [ ] **Step 3:** Rewrite `useI18n` wrapper:

```ts
import type { TranslationKey } from '@/app/lib/i18n/i18n.keys'
/** Typed wrapper over @nuxtjs/i18n: t(TranslationKey) stays compile-time-checked. */
export function useTypedI18n() {
  const { t, locale, setLocale } = useNuxtI18n() // the module's composable
  return {
    t: (key: TranslationKey): string => t(key),
    locale,
    toggleLocale: () => setLocale(locale.value === 'fr' ? 'en' : 'fr'),
  }
}
```

(Adjust import name to the module's actual composable; the module auto-imports `useI18n` — alias to avoid clashing with our file, or rename our file to `useTypedI18n.ts`.)

- [ ] **Step 4:** Update `AppHeader`/`login`/pages to `useTypedI18n`. `bun run build`. Commit — `git commit -am "feat(i18n): @nuxtjs/i18n behind const-enum keys"`

---

# Phase C — UI → shadcn-vue

## Task C1: init shadcn-vue

**Files:** Create `components.json`, `app/lib/cn.ts`, `app/components/ui/**`; modify `nuxt.config`/`tsconfig` as the init requires.

- [ ] **Step 1:** `bunx shadcn-vue@latest init` — choose Tailwind v4, base color, and set aliases: `components` → `@/app/components`, `ui` → `@/app/components/ui`, `utils` → `@/app/lib/cn` (keeps out of any `utils` folder). Confirm `cn` is written to `app/lib/cn.ts`.
- [ ] **Step 2:** Add primitives: `bunx shadcn-vue@latest add button card input label badge separator progress sonner`.
- [ ] **Step 3: Commit** — `git commit -am "chore(ui): shadcn-vue init + primitives"`

## Task C2: migrate components/pages to shadcn + remove custom classes

**Files:** Modify every `app/components/*.vue` and `app/pages/**/*.vue`; edit `app/assets/css/main.css` (delete `@layer components` block: `.btn*`, `.card`, `.eyebrow`; keep `@theme`, `.dark` tokens, `.tok-*`).

- [ ] **Step 1:** Replace `<button class="btn btn-accent">` → `<Button variant="default">`, `<div class="card">` → `<Card>`, custom inputs → `<Input>`/`<Label>`, badges → `<Badge>`, the eyebrow text → a `<span>` with Tailwind utility classes. All `class` bindings that remain (layout) use `cn("flex", "items-center", "gap-2")` — one class per argument.
- [ ] **Step 2:** Delete the `@layer components` block from `main.css`. Grep `grep -rn "btn-\|\"card\"\|eyebrow" app` → no matches.
- [ ] **Step 3:** `bun run build`; visual smoke (dark mode + fr/en still fine). Commit — `git commit -am "feat(ui): shadcn components, drop custom CSS classes"`

---

# Phase E — Type every variable (no inference)

## Task E1: annotation sweep

**Files:** All `.ts`/`.vue` `<script setup>` under `server/`, `app/`, `shared/`.

- [ ] **Step 1:** Add explicit type annotations to every `const`/`let`. For un-nameable library returns, annotate with the library's exported type (e.g., `Effect.Effect<…>`, viem `ReadContractReturnType`, Drizzle row types via `InferSelectModel`) or map immediately into a typed domain shape. Work domain-by-domain, running `bunx tsgo --noEmit -p .nuxt/tsconfig.server.json` after each.
- [ ] **Step 2:** `bun run typecheck` clean, `bun run test` green, `bun run lint` 0 errors, `bun run build` OK.
- [ ] **Step 3: Commit** — `git commit -am "style: explicit type annotations everywhere"`

---

## Final verification

- [ ] `docker compose up -d` (pg + redis); `bun run db:migrate && bun run db:seed`.
- [ ] `bun run test` green; `bun run typecheck` clean; `bun run lint` 0 errors; `bun run build` OK.
- [ ] Runtime smoke (built server): register 8-digit code → session cookie set → `me` returns userId → create session → answer graded → stats cached → `/api/auth/*` 429 on bruteforce → logout clears session → dark mode + fr/en toggle render, all UI via shadcn components.
- [ ] `grep -rn "neverthrow\|option-t\|from 'zod'\|jose\|@node-rs/argon2" server app shared` → no matches.

## Self-review notes (coverage)

- Spec F (Effect) → Tasks F1–F9, E1. Spec D (const enums) → F1 (HttpStatus) + each domain's `*.message.ts`. Spec A (auth) → A1–A4. Spec B (i18n) → B1. Spec C (shadcn) → C1–C2. Spec E (no inference) → E1.
- Tagged-error `status` fields give `runOrThrow` its status mapping (no separate `_tag`→status table needed).
- `effect/Schema`, `effect/Option`, `effect/Data` all from the installed `effect` package — no new effect dep.
