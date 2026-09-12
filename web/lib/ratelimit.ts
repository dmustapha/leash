// File: web/lib/ratelimit.ts
// [WS-7 A4 / S2] Per-IP token-bucket rate limiter for the mutating routes. Every beat/console mutation does
// real on-chain work that spends the fee-payer's HBAR or an agent's USDC, so a rapid-fire caller could drain a
// balance. This throttles bursts with a 429 BEFORE the expensive work runs.
//
// Scope + limits (LIMITATIONS): the store is in-process memory - correct for the single-instance Render
// deployment, best-effort behind a multi-instance fronting. It is NOT an enforcement control (that is the
// facilitator + ENS policy); it is an availability/abuse guard, so an in-memory bucket is appropriate.
import { NextResponse } from 'next/server';

type Bucket = { tokens: number; last: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitOpts {
  capacity: number;      // max burst
  refillPerSec: number;  // sustained rate
}

// Consume one token for `key`. Returns { ok, retryAfter(seconds) }. Refills continuously since the last call.
export function rateLimit(key: string, opts: RateLimitOpts): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: opts.capacity, last: now };
  const elapsed = (now - b.last) / 1000;
  b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSec);
  b.last = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((1 - b.tokens) / opts.refillPerSec)) };
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return { ok: true, retryAfter: 0 };
}

// Derive a stable client key from the request (proxy-aware: first X-Forwarded-For hop, else X-Real-IP).
export function clientKey(req: Request, prefix: string): string {
  const xff = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = xff || req.headers.get('x-real-ip') || 'local';
  return `${prefix}:${ip}`;
}

// One-line guard for a route: returns a 429 NextResponse if the caller is over the limit, else null.
// Default limits suit real on-chain routes (a small burst, then a steady trickle).
export function enforceRateLimit(
  req: Request, prefix: string, opts: RateLimitOpts = { capacity: 8, refillPerSec: 0.5 },
): NextResponse | null {
  const { ok, retryAfter } = rateLimit(clientKey(req, prefix), opts);
  if (ok) return null;
  return NextResponse.json(
    { error: 'rate limited', message: `Too many requests. Retry in ~${retryAfter}s.`, retryAfter },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  );
}
