// File: scripts/env.ts
// Idempotent .env writer. The Phase 1-4 scripts appended raw lines, which duplicates keys on re-run.
// The seed MUST converge to the same file no matter how many times it runs, so it upserts: replace an
// existing KEY=... line in place, else append. Preserves everything else byte-for-byte.
import { readFileSync, writeFileSync, existsSync } from 'fs';

const ENV_PATH = '.env';

// Upsert a set of KEY=value pairs into .env. Existing keys are replaced in place; new keys are appended.
export function upsertEnv(pairs: Record<string, string>): void {
  const original = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : '';
  // Drop a single trailing newline so appended keys never land after a spurious blank line; it is added back once.
  const trimmed = original.endsWith('\n') ? original.slice(0, -1) : original;
  const lines = trimmed === '' ? [] : trimmed.split('\n');
  const remaining = { ...pairs };

  const updated = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (match && match[1] in remaining) {
      const key = match[1];
      const value = remaining[key];
      delete remaining[key];
      return `${key}=${value}`;
    }
    return line;
  });

  const appended = Object.entries(remaining).map(([k, v]) => `${k}=${v}`);
  const merged = [...updated, ...appended];
  writeFileSync(ENV_PATH, merged.length ? merged.join('\n') + '\n' : '');
}
