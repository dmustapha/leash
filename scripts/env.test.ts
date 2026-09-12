// File: scripts/env.test.ts
// Unit tier: proves upsertEnv (the seed's convergence primitive) is idempotent - the property that makes
// `npm run seed` safe to re-run. Replaces existing keys in place, appends new keys once, and re-applying
// the same pairs yields a byte-identical file (no duplicate KEY= lines accumulating across seed re-runs).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync, existsSync, rmSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { upsertEnv } from './env';

describe('upsertEnv - seed .env convergence (idempotence primitive)', () => {
  let dir: string;
  let prevCwd: string;

  beforeEach(() => {
    prevCwd = process.cwd();
    dir = mkdtempSync(join(tmpdir(), 'leash-env-'));
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(prevCwd);
    rmSync(dir, { recursive: true, force: true });
  });

  it('replaces an existing key in place without duplicating it', () => {
    writeFileSync('.env', 'A=1\nB=2\nC=3\n');
    upsertEnv({ B: '99' });
    const body = readFileSync('.env', 'utf8');
    expect(body).toBe('A=1\nB=99\nC=3\n');
    expect(body.match(/^B=/gm)?.length).toBe(1);
  });

  it('appends a new key exactly once', () => {
    writeFileSync('.env', 'A=1\n');
    upsertEnv({ NEW: 'x' });
    expect(readFileSync('.env', 'utf8')).toBe('A=1\nNEW=x\n');
  });

  it('creates .env when absent', () => {
    expect(existsSync('.env')).toBe(false);
    upsertEnv({ K: 'v' });
    expect(readFileSync('.env', 'utf8')).toBe('K=v\n');
  });

  it('is idempotent: re-applying the same pairs converges to a byte-identical file', () => {
    writeFileSync('.env', 'X=old\n');
    upsertEnv({ X: 'new', Y: 'y' });
    const once = readFileSync('.env', 'utf8');
    upsertEnv({ X: 'new', Y: 'y' });
    upsertEnv({ X: 'new', Y: 'y' });
    const thrice = readFileSync('.env', 'utf8');
    expect(thrice).toBe(once);
    expect(thrice.match(/^X=/gm)?.length).toBe(1);
    expect(thrice.match(/^Y=/gm)?.length).toBe(1);
  });

  it('preserves comments and blank lines untouched', () => {
    writeFileSync('.env', '# header\n\nA=1\n# mid\nB=2\n');
    upsertEnv({ B: '3' });
    expect(readFileSync('.env', 'utf8')).toBe('# header\n\nA=1\n# mid\nB=3\n');
  });
});
