import { defineConfig } from 'vitest/config';

// Three-tier test quarantine by filename (C0 rule 24), selected via TEST_TIER env:
//   TEST_TIER=unit        -> *.test.ts         offline unit (deterministic, zero-credential)  [default green gate]
//   TEST_TIER=integration -> *.integration.ts  real-dependency integration                    [green gate + test:integration]
//   TEST_TIER=live        -> *.live.ts         live-network (real creds, real broadcast)      [test:live ONLY, excluded from default]
// Default (no TEST_TIER) runs the unit tier so a bare `vitest` stays safe/offline.
const TIER_GLOB: Record<string, string> = {
  unit: '**/*.test.ts',
  integration: '**/*.integration.ts',
  live: '**/*.live.ts',
};
const tier = process.env.TEST_TIER ?? 'unit';
const include = [TIER_GLOB[tier] ?? TIER_GLOB.unit];

export default defineConfig({
  test: {
    include,
    exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.next/**'],
  },
});
