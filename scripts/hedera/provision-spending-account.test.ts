// File: scripts/hedera/provision-spending-account.test.ts
// REFRAME [SKILL] S1 unit test — the pure long-zero EVM derivation (REF-2). Offline, deterministic.
import { describe, it, expect } from 'vitest';
import { longZeroEvm } from './provision-spending-account';

describe('longZeroEvm() — REF-2 KeyList account EVM facade', () => {
  it('derives 0x + entityNum padded to 40 hex chars for a small account', () => {
    // 0.0.10499595 -> hex a0360b, left-padded to 40 chars.
    expect(longZeroEvm('0.0.10499595')).toBe('0x0000000000000000000000000000000000a0360b');
  });

  it('account 0.0.1 -> the canonical long-zero-1 facade', () => {
    expect(longZeroEvm('0.0.1')).toBe('0x0000000000000000000000000000000000000001');
  });

  it('produces a valid 42-char 0x-prefixed 20-byte address', () => {
    const evm = longZeroEvm('0.0.10496489');
    expect(evm).toMatch(/^0x[0-9a-f]{40}$/);
    expect(evm.length).toBe(42);
  });
});
