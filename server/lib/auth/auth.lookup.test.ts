import { describe, expect, it } from 'vitest'
import { computeLookup } from '@/server/lib/auth/auth.service'

describe('computeLookup.', () => {
  /**
   * The lookup must be deterministic — the same code + pepper always yields the
   * same key, otherwise an account could never be found by its code.
   */
  it('Is deterministic for the same code and pepper.', () => {
    expect(computeLookup('12345678', 'pepper-a')).toBe(computeLookup('12345678', 'pepper-a'))
  })

  /**
   * The pepper must actually key the HMAC — a different pepper yields a different
   * lookup, so a DB leak without the pepper can't be reversed to codes.
   */
  it('Differs when the pepper differs.', () => {
    expect(computeLookup('12345678', 'pepper-a')).not.toBe(computeLookup('12345678', 'pepper-b'))
  })

  /**
   * Different codes map to different lookups under the same pepper — no
   * collisions between distinct accounts.
   */
  it('Differs for different codes under the same pepper.', () => {
    expect(computeLookup('12345678', 'p')).not.toBe(computeLookup('87654321', 'p'))
  })
})
