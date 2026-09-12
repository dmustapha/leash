// File: web/lib/auth.test.ts
// [WS-7 A1 / F-016] requireOwner is the ownership-JOIN gate on every mutating console route. This proves the
// adversarial-review B-01 case: a caller authenticated as user A, targeting user B's agentId, is rejected 403
// (the real IDOR), plus the token-binding cases (missing Bearer -> 401, wrong audience -> 401). The DB client
// and @privy-io/server-auth are mocked so the test is offline (unit tier) and deterministic.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set the app-id audience + create the controllable verifier BEFORE auth.ts's module-init runs (vi.hoisted
// executes above the imports, so both the env const APP_ID and `new PrivyClient` see these).
const { verifyAuthToken } = vi.hoisted(() => {
  process.env.PRIVY_APP_ID = 'app-under-test';
  process.env.PRIVY_APP_SECRET = 'secret-under-test';
  return { verifyAuthToken: vi.fn() };
});

vi.mock('@privy-io/server-auth', () => ({
  PrivyClient: class {
    verifyAuthToken = verifyAuthToken;
  },
}));

// Deterministic DB: each requireOwner path issues N .limit(1) reads; we queue their results in call order.
let resultQueue: unknown[][] = [];
const chain = {
  from() { return chain; },
  where() { return chain; },
  limit() { return Promise.resolve(resultQueue.shift() ?? []); },
};
vi.mock('../../db/client', () => ({ db: { select: () => chain } }));

import { requireOwner, verifyCaller, AuthError } from './auth';

function reqWithToken(token?: string): Request {
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return new Request('http://localhost/api/agents', { method: 'POST', headers });
}

beforeEach(() => {
  resultQueue = [];
  verifyAuthToken.mockReset();
});

describe('verifyCaller (token binding, B-06)', () => {
  it('rejects a request with no Bearer token (401)', async () => {
    await expect(verifyCaller(new Request('http://localhost'))).rejects.toMatchObject({ status: 401 });
  });

  it('rejects an invalid/expired token (401)', async () => {
    verifyAuthToken.mockRejectedValue(new Error('token expired'));
    await expect(verifyCaller(reqWithToken('bad'))).rejects.toMatchObject({ status: 401 });
  });

  it('rejects a token minted for a different app-id audience (401)', async () => {
    verifyAuthToken.mockResolvedValue({ appId: 'some-other-app', userId: 'A' });
    await expect(verifyCaller(reqWithToken('t'))).rejects.toMatchObject({ status: 401 });
  });

  it('accepts a valid token for the right audience', async () => {
    verifyAuthToken.mockResolvedValue({ appId: 'app-under-test', userId: 'A' });
    await expect(verifyCaller(reqWithToken('t'))).resolves.toBe('A');
  });
});

describe('requireOwner (ownership JOIN, B-01 IDOR)', () => {
  it('BLOCKS authed-as-A targeting B\'s agent (403)', async () => {
    // Caller A is authenticated; the target agent belongs to org owned by user B.
    verifyAuthToken.mockResolvedValue({ appId: 'app-under-test', userId: 'privy-A' });
    resultQueue = [
      [{ id: 'user-A', privyUserId: 'privy-A' }],          // loadCallerUser -> A
      [{ id: 'agent-1', orgId: 'org-B' }],                 // target agent
      [{ id: 'org-B', ownerId: 'user-B', ensName: 'b.leash.eth' }], // its org, owned by B (not A)
    ];
    await expect(requireOwner(reqWithToken('t'), { agentId: 'agent-1' }))
      .rejects.toMatchObject({ status: 403 });
  });

  it('ALLOWS the owner and returns the resolved context', async () => {
    verifyAuthToken.mockResolvedValue({ appId: 'app-under-test', userId: 'privy-A' });
    resultQueue = [
      [{ id: 'user-A', privyUserId: 'privy-A' }],
      [{ id: 'agent-1', orgId: 'org-A' }],
      [{ id: 'org-A', ownerId: 'user-A', ensName: 'a.leash.eth' }],
    ];
    const ctx = await requireOwner(reqWithToken('t'), { agentId: 'agent-1' });
    expect(ctx.org.id).toBe('org-A');
    expect(ctx.agent?.id).toBe('agent-1');
  });

  it('404s when the target agent does not exist', async () => {
    verifyAuthToken.mockResolvedValue({ appId: 'app-under-test', userId: 'privy-A' });
    resultQueue = [
      [{ id: 'user-A', privyUserId: 'privy-A' }],
      [], // no agent
    ];
    await expect(requireOwner(reqWithToken('t'), { agentId: 'missing' }))
      .rejects.toMatchObject({ status: 404 });
  });

  it('403s a caller with no index account (unknown identity)', async () => {
    verifyAuthToken.mockResolvedValue({ appId: 'app-under-test', userId: 'privy-ghost' });
    resultQueue = [[]]; // loadCallerUser finds nothing
    await expect(requireOwner(reqWithToken('t'), { orgId: 'org-A' }))
      .rejects.toBeInstanceOf(AuthError);
  });
});
