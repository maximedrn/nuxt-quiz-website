# Design — Library adoption + Effect-TS migration

## Context

`solidity-quiz` (Nuxt 4 + Vue 3, TS7, Bun) currently hand-rolls several concerns that
mature libraries do better, and mixes two effect systems (neverthrow as primary, Effect
only inside the cache driver). This migration replaces hand-written code with libraries
wherever one fits, and makes **Effect-TS the single effect/validation system**.

Goals, all user-approved:
1. **Auth** → `nuxt-auth-utils` (sealed session cookies), dropping the bearer-JWT / refresh
   model, `jose`, `@node-rs/argon2`, and the Redis refresh-token store.
2. **i18n** → `@nuxtjs/i18n`, called through a `TranslationKey` **const enum** for
   compile-time key safety.
3. **UI** → `shadcn-vue` components; remove all custom CSS classes (`.btn`/`.card`/
   `.eyebrow`). `cn()` is called with one class per argument: `cn("a", "b", "c")`.
4. **Const enums** for HTTP status codes and all static messages/errors; interpolated
   messages keep static text in the enum and interpolate at the call site.
5. **Type every variable** — no inference (with a caveat for un-nameable library types).
6. **Effect-TS maximal**: `Effect.Effect` replaces neverthrow `Result`/`ResultAsync`;
   `effect/Option` replaces `option-t`; `effect/Schema` replaces `zod`. Drop all three deps.

Kept as-is: the per-domain `server/lib/<domain>` structure, the pluggable storage
(Postgres ↔ blockchain), Redis + BentoCache for caching, per-IP rate limiting,
`ts-pattern`, `type-fest`, `@sindresorhus/is`, the const-object union pattern, `@/` imports,
no `utils` folders.

---

## F. Effect-TS migration (cross-cutting — the backbone)

This underpins every other phase, so it is described first.

**Errors → tagged errors.** Each domain defines tagged errors via `Data.TaggedError`:
```ts
import { Data } from "effect"
export class StorageError extends Data.TaggedError("StorageError")<{ readonly message: string }> {}
```
The Effect error channel carries these (typed), replacing `string` error channels.

**Fallible ops → `Effect.Effect<A, E>`.** Every service/driver method returns
`Effect.Effect<A, DomainError>` (requirements `R = never`). Promises are wrapped with
`Effect.tryPromise({ try, catch })`; composition uses `Effect.gen`/`pipe`; retry/timeout
use `Effect.retry`/`Effect.timeout` (already the cache pattern, now everywhere I/O warrants).

**Nullable → `effect/Option`.** `Option.some`/`none`/`isNone`/`getOrElse` replace option-t.
`getSession` returns `Effect.Effect<Option.Option<StoredSession>, StorageError>`.

**Validation → `effect/Schema`.** `Schema.Struct`, `Schema.Literal`, `Schema.decodeUnknown`
(returns an Effect) / `Schema.decodeUnknownSync`. Replaces every Zod schema (env, request
bodies, the answer/mode enums). Const-object unions feed `Schema.Literal(...values)`.

**Running at the HTTP boundary.** A single helper in `server/lib/http/http.run.ts`:
```ts
export function runOrThrow<A, E extends { readonly _tag: string; readonly message: string }>(
  effect: Effect.Effect<A, E>,
): Promise<A>
```
It runs `Effect.runPromiseExit`, and on failure maps the tagged error's `_tag` → `HttpStatus`
(via `ts-pattern`) and throws `createError`. Route handlers compose an `Effect.gen` program
and `await runOrThrow(program)`. Env/cache/etc. singletons build via `Effect.runSync` where
construction is synchronous.

**Interfaces change** accordingly: `StorageOperations`, `CacheOperations`, `AuthOperations`,
`SecurityOperations`, `IDatabaseService`, `IEnvService` method signatures move from
`ResultAsync<T, string>` to `Effect.Effect<T, DomainError>`. Base/service/factory bodies
follow. Factories return `Effect.Effect<IService, DomainError>` (or a value when construction
can't fail).

**Deps dropped:** `neverthrow`, `option-t`, `zod`. **No new dep** — `Schema`/`Option`/`Data`
ship in the already-installed `effect` package.

---

## A. Auth → `nuxt-auth-utils`

Add `nuxt-auth-utils` (module). Env: `NUXT_SESSION_PASSWORD` (≥32 chars) replaces
`JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`/TTLs. Remove `jose`, `@node-rs/argon2`.

- Keep the `users` table and the peppered-HMAC `codeLookup` (stdlib `node:crypto`) so a user
  is found by code without storing plaintext. Hash the 8-digit code with the lib's
  `hashPassword`/`verifyPassword` (replacing argon2), stored in `codeHash`.
- The `auth` domain shrinks to a **credential service** (`Effect`-returning: `register(code)`,
  `login(code)` → the user record) over the shared DB + hashing. Session lifecycle is the lib:
  routes call `setUserSession(event, { user: { id } })`, `clearUserSession`, and
  `requireUserSession(event)` for protection.
- Delete: `auth.base` token/JWT/refresh machinery, `auth.http` cookie/bearer helpers,
  refresh-token cache keys, the refresh rotation. `requireUserId` becomes a thin wrapper over
  `requireUserSession`.
- **Middleware**: drop `01.auth` (the lib populates the session); keep `00.rate-limit`.
- **Frontend**: `useApi` loses the bearer header + 401-refresh retry (cookie is automatic);
  `useAuth` calls `/api/auth/*` and exposes the lib's `useUserSession()` (`loggedIn`, `user`,
  `fetch`, `clear`). Route guard uses session state.
- Rate limiting on `/api/auth/*` stays (anti-bruteforce).

## B. i18n → `@nuxtjs/i18n` + const-enum keys

Add `@nuxtjs/i18n`. fr/en message catalogs (lazy files). Keep the `TranslationKey` **const
enum**; expose a typed `t(key: TranslationKey)` wrapper over the module's `useI18n().t` so
call sites stay `t(TranslationKey.NavHistory)`. Remove the hand-rolled `useI18n` composable
and `i18n.messages` map; catalogs become the module's locale files keyed by the enum values.
Locale persists via the module (cookie strategy).

## C. UI → `shadcn-vue`, no custom CSS classes

Init `shadcn-vue` (`reka-ui` + Tailwind + CVA). `components.json` aliases point `ui` →
`@/app/components/ui` and `utils` → `@/app/lib/cn` (no `utils` folder). Add the primitives in
use: **Button, Card, Input, Label, Badge, Separator, Progress, Sonner (toast)** (+ Dialog if
needed). Rewrite every component/page to compose them.

- **Delete** the `@layer components` block in `main.css` (`.btn*`, `.card`, `.eyebrow`) and all
  usages; keep `@theme` tokens + the `.dark` token overrides + `.tok-*` code-highlight colors.
- Tailwind **utility** classes remain allowed for layout (flex/grid/gap/spacing).
- `cn()` is invoked with **one class per argument**: `cn("flex", "items-center", "gap-2")`,
  never `cn("flex items-center gap-2")`.
- Dark mode unchanged (`@vueuse` `useDark` toggles `.dark`, which shadcn respects).

## D. Const enums — status codes + messages

- `HttpStatus` **const enum** (`OK=200, BAD_REQUEST=400, UNAUTHORIZED=401, NOT_FOUND=404,
  CONFLICT=409, TOO_MANY_REQUESTS=429, INTERNAL=500`) in `server/lib/http/http.status.ts`;
  replaces every inline status number and feeds `runOrThrow`'s `_tag`→status map.
- Each domain's messages move to a **const enum** of static strings (`server/lib/<domain>/
  <domain>.message.ts`, replacing the `*.error.ts` const objects). Interpolated messages keep
  the static base in the enum and interpolate at the call site
  (`` `${QuizMessage.SESSION_NOT_FOUND}: ${id}` ``). UI-side static strings not owned by i18n
  follow the same rule where they exist.

## E. Type every variable — no inference

Explicit type annotation on every `const`/`let` across the codebase. **Caveat (approved):**
some library return values (viem `readContract`, Drizzle query builders, some `Effect`
pipelines) have un-nameable/huge generic types; for those, annotate with the library's
exported return type where one exists, or map the value immediately into a typed domain shape.
Everywhere a type is nameable, it is written.

---

## Dependencies

- **Add:** `nuxt-auth-utils`, `@nuxtjs/i18n`, `shadcn-vue` + `reka-ui` (+ `class-variance-
  authority`, `clsx`, `tailwind-merge`, `lucide-vue-next` already present) as shadcn needs.
- **Remove:** `neverthrow`, `option-t`, `zod`, `jose`, `@node-rs/argon2`.
- **Keep:** `effect`, `ts-pattern`, `type-fest`, `@sindresorhus/is`, `bentocache`, `ioredis`,
  `rate-limiter-flexible`, `viem`, `drizzle-orm`, `@vueuse/*`, `tailwindcss`.

## Verification

1. `bun run db:migrate && bun run db:seed`; `docker compose up -d` (pg + redis).
2. `bun run test` (Vitest rewritten to Effect: run effects via `Effect.runPromise`, tagged-
   error assertions), `bun run lint`, `bun run typecheck` (tsgo).
3. `bun run build` (SSR compile gate for shadcn/i18n/auth-utils).
4. Runtime smoke: register (8-digit code) → session cookie set → create session → answer
   graded → stats cached → `/api/auth/*` 429 on bruteforce → logout clears session → dark mode
   + fr/en toggle render.

## Scope / phasing

Large but cohesive. Suggested order so each phase compiles: **F (Effect + Schema + Option
core swap)** → **D (const enums, used by F's boundary)** → **A (auth lib)** → **B (i18n)** →
**C (shadcn UI)** → **E (no-inference sweep, final pass over everything)**. The implementation
plan may execute these as separate reviewable chunks.

## Non-goals

- No change to the storage abstraction, blockchain driver contract, caching tiers, or rate-
  limit algorithm (only their error/Option/return types shift to Effect).
- No new features; behavior parity except the deliberate auth model change (sessions vs JWT).
