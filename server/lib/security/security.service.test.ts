import { RateLimiterMemory } from 'rate-limiter-flexible'
import { describe, expect, it } from 'vitest'
import { FlexibleRateLimitDriver } from '@/server/lib/security/drivers/security.flexible.driver'
import { RateLimitKind } from '@/server/lib/security/security.constants'
import { RateLimitService } from '@/server/lib/security/security.service'

function makeService(points: number): RateLimitService {
  const driver = new FlexibleRateLimitDriver({
    global: new RateLimiterMemory({ points, duration: 60 }),
    auth: new RateLimiterMemory({ points, duration: 60 }),
  })
  return new RateLimitService(driver)
}

describe('RateLimitService', () => {
  /**
   * Requests within budget are allowed; the one that exhausts the budget is
   * blocked. This is the exact boundary the 429 middleware relies on.
   */
  it('Allows up to the budget, then blocks.', async () => {
    const service = makeService(2)

    const first = await service.consume('1.2.3.4', RateLimitKind.GLOBAL)
    const second = await service.consume('1.2.3.4', RateLimitKind.GLOBAL)
    const third = await service.consume('1.2.3.4', RateLimitKind.GLOBAL)

    expect(first.isOk() && first.value.allowed).toBe(true)
    expect(second.isOk() && second.value.allowed).toBe(true)
    expect(third.isOk() && third.value.allowed).toBe(false)
  })

  /**
   * Limiters are keyed per IP: one IP exhausting its budget must not affect a
   * different IP — otherwise a single abuser could lock everyone out.
   */
  it('Tracks budgets independently per key.', async () => {
    const service = makeService(1)

    await service.consume('10.0.0.1', RateLimitKind.AUTH)
    const blocked = await service.consume('10.0.0.1', RateLimitKind.AUTH)
    const otherIp = await service.consume('10.0.0.2', RateLimitKind.AUTH)

    expect(blocked.isOk() && blocked.value.allowed).toBe(false)
    expect(otherIp.isOk() && otherIp.value.allowed).toBe(true)
  })
})
