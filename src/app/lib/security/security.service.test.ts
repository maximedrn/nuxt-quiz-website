import { Effect } from "effect";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { describe, expect, it } from "vitest";
import { FlexibleRateLimitDriver } from "@/app/lib/security/drivers/security.flexible.driver.ts";
import { RateLimitKind } from "@/app/lib/security/security.constants.ts";
import { RateLimitService } from "@/app/lib/security/security.service.ts";
import type { RateLimitResult } from "@/app/lib/security/security.types.ts";

const makeService: (points: number) => RateLimitService = (
  points: number,
): RateLimitService => {
  const driver: FlexibleRateLimitDriver = new FlexibleRateLimitDriver({
    auth: new RateLimiterMemory({ duration: 60, points }),
    global: new RateLimiterMemory({ duration: 60, points }),
  });
  return new RateLimitService(driver);
};

describe("RateLimitService.", () => {
  /**
   * Requests within budget are allowed; the one that exhausts the budget is
   * blocked. This is the exact boundary the 429 middleware relies on.
   */
  it("Allows up to the budget, then blocks.", async () => {
    const service: RateLimitService = makeService(2);

    const first: RateLimitResult = await Effect.runPromise(
      service.consume("1.2.3.4", RateLimitKind.global),
    );
    const second: RateLimitResult = await Effect.runPromise(
      service.consume("1.2.3.4", RateLimitKind.global),
    );
    const third: RateLimitResult = await Effect.runPromise(
      service.consume("1.2.3.4", RateLimitKind.global),
    );

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });

  /**
   * Limiters are keyed per IP: one IP exhausting its budget must not affect a
   * different IP — otherwise a single abuser could lock everyone out.
   */
  it("Tracks budgets independently per key.", async () => {
    const service: RateLimitService = makeService(1);

    await Effect.runPromise(service.consume("10.0.0.1", RateLimitKind.auth));
    const blocked: RateLimitResult = await Effect.runPromise(
      service.consume("10.0.0.1", RateLimitKind.auth),
    );
    const otherIp: RateLimitResult = await Effect.runPromise(
      service.consume("10.0.0.2", RateLimitKind.auth),
    );

    expect(blocked.allowed).toBe(false);
    expect(otherIp.allowed).toBe(true);
  });
});
