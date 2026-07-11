import { Effect, Exit } from 'effect'
import { describe, expect, it } from 'vitest'
import { createEnv } from '@/server/lib/env/env.factory'

/** Minimal valid source: DB URL + a 32-char session password (the minimum). */
const base = { databaseUrl: 'postgres://x', sessionPassword: 'a'.repeat(32) }

describe('createEnv.', () => {
  /**
   * Absent optionals fall back to documented defaults so the app boots from
   * DB + session secret alone — no other env vars required.
   */
  it('Applies defaults for absent optionals.', async () => {
    const svc = await Effect.runPromise(createEnv(base))
    expect(svc.config.storageDriver).toBe('postgres')
    expect(svc.config.accessTokenTtl).toBe(900)
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
    const svc = await Effect.runPromise(createEnv({ ...base, accessTokenTtl: '120' }))
    expect(svc.config.accessTokenTtl).toBe(120)
  })

  /**
   * A missing databaseUrl must be rejected — no db connection = fatal boot failure.
   */
  it('Rejects a missing databaseUrl.', async () => {
    const exit = await Effect.runPromiseExit(createEnv({ sessionPassword: 'a'.repeat(32) }))
    expect(Exit.isFailure(exit)).toBe(true)
  })
})
