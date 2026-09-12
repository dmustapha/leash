// File: facilitator/identity-isolation.integration.ts
// [WS-7 D1 / INVARIANT #13 / B-07] Import-graph guard: prove the ENFORCEMENT path never reads agent identity.
// D1 identity records (agent.description/type/avatar/erc8004) are ADVISORY - they must never influence a spend
// decision. This is a MODULE-BOUNDARY assertion (not a keyword grep): starting from facilitator/server.ts we
// transitively resolve every first-party import and assert scripts/ens/identity.ts is NEVER in the graph. If a
// future change makes the facilitator read identity, this test fails at the boundary.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';

const ROOT = resolve(__dirname, '..');
const ENTRY = resolve(__dirname, 'server.ts');
const IDENTITY_MODULE = resolve(ROOT, 'scripts/ens/identity.ts');

// Resolve a relative import specifier to a .ts file on disk (best-effort: .ts, /index.ts).
function resolveImport(fromFile: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null; // package import - not first-party
  const base = resolve(dirname(fromFile), spec);
  for (const cand of [base, `${base}.ts`, resolve(base, 'index.ts')]) {
    if (existsSync(cand) && cand.endsWith('.ts')) return cand;
  }
  return null;
}

// Collect the transitive first-party import graph from ENTRY.
function importGraph(entry: string): Set<string> {
  const seen = new Set<string>();
  const stack = [entry];
  const importRe = /(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g;
  while (stack.length) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const src = readFileSync(file, 'utf8');
    let m: RegExpExecArray | null;
    while ((m = importRe.exec(src)) !== null) {
      const target = resolveImport(file, m[1]);
      if (target && !seen.has(target)) stack.push(target);
    }
  }
  return seen;
}

describe('INVARIANT #13 - the facilitator enforcement graph imports no identity reader (D1 advisory-only)', () => {
  const graph = importGraph(ENTRY);

  // B-07: the proof is a MODULE-BOUNDARY assertion (the enforcement graph never imports the identity module),
  // NOT a keyword grep - identity column names/comments legitimately appear in shared modules like db/schema.ts.
  it('scripts/ens/identity.ts is NOT reachable from facilitator/server.ts', () => {
    const reachable = [...graph].map((f) => relative(ROOT, f));
    expect(reachable).not.toContain(relative(ROOT, IDENTITY_MODULE));
  });

  // Nothing in the enforcement graph imports the identity module by specifier either (belt-and-braces on the
  // module boundary, still not a content grep).
  it('no file in the enforcement graph imports scripts/ens/identity', () => {
    const offenders: string[] = [];
    for (const file of graph) {
      const src = readFileSync(file, 'utf8');
      if (/from\s*['"][^'"]*scripts\/ens\/identity['"]/.test(src)) offenders.push(relative(ROOT, file));
    }
    expect(offenders).toEqual([]);
  });
});
