// File: web/lib/ratelimit.test.ts
// [WS-7 A4 / F-019] The token bucket throttles a burst and refills over time. Offline (unit tier); fake timers
// drive Date.now so the refill is deterministic.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rateLimit } from './ratelimit';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(0); });
afterEach(() => { vi.useRealTimers(); });

describe('rateLimit token bucket (F-019)', () => {
  it('allows a burst up to capacity, then throttles with a retryAfter', () => {
    const key = 'k1';
    const opts = { capacity: 3, refillPerSec: 1 };
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(true);
    const blocked = rateLimit(key, opts); // 4th within the same instant
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('refills over time so a later call succeeds again', () => {
    const key = 'k2';
    const opts = { capacity: 2, refillPerSec: 1 };
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(false); // drained
    vi.setSystemTime(2000); // 2s later -> +2 tokens
    expect(rateLimit(key, opts).ok).toBe(true);
  });

  it('keys are independent (one caller cannot throttle another)', () => {
    const opts = { capacity: 1, refillPerSec: 1 };
    expect(rateLimit('a', opts).ok).toBe(true);
    expect(rateLimit('a', opts).ok).toBe(false); // a is drained
    expect(rateLimit('b', opts).ok).toBe(true);  // b is unaffected
  });
});
