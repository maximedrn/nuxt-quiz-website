import { Effect, Exit } from 'effect'
import { describe, expect, it } from 'vitest'
import { createEnv } from '@/server/lib/env/env.factory'

/** Minimal valid source: DB URL + a 32-char session password + a 32-char pepper. */
const base = {
  databaseUrl: 'postgres://x',
  sessionPassword: 'a'.repeat(32),
  authLookupPepper: 'b'.repeat(32),
}

describe('createEnv.', () => {
  /**
   * Absent optionals fall back to documented defaults so the app boots from
   * DB + session secret + pepper alone — no other env vars required.
   */
  it('Applies defaults for absent optionals.', async () => {
    const svc = await Effect.runPromise(createEnv(base))
    expect(svc.config.storageDriver).toBe('postgres')
    expect(svc.config.rateLimitPoints).toBe(100)
  })

  /**
   * A too-short session password must be rejected — it is the cookie sealing key
   * and must satisfy the 32-char minimum enforced by nuxt-auth-utils.
   */
  it('Rejects a short session password.', async () => {
    const exit = await Effect.runPromiseExit(createEnv({ ...base, sessionPassword: 'short' }))
    expect(Exit.isFailure(exit)).toBe(true)
  })

  /**
   * Numeric env vars arrive as strings from runtimeConfig; `Schema.NumberFromString`
   * must coerce them so downstream arithmetic is not silently broken.
   */
  it('Coerces string numeric variables to numbers.', async () => {
    const svc = await Effect.runPromise(createEnv({ ...base, rateLimitPoints: '250' }))
    expect(svc.config.rateLimitPoints).toBe(250)
  })

  /**
   * A missing databaseUrl must be rejected — no db connection = fatal boot failure.
   */
  it('Rejects a missing databaseUrl.', async () => {
    const exit = await Effect.runPromiseExit(
      createEnv({ sessionPassword: 'a'.repeat(32), authLookupPepper: 'b'.repeat(32) }),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })

  /**
   * The dedicated lookup pepper is required and must be at least 32 chars — it
   * keys the code-lookup HMAC independently of the session password.
   */
  it('Rejects a missing lookup pepper.', async () => {
    const exit = await Effect.runPromiseExit(
      createEnv({ databaseUrl: 'postgres://x', sessionPassword: 'a'.repeat(32) }),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })
})
