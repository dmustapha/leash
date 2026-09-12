// File: scripts/ens/erc8004.test.ts
// REFRAME [SKILL] R1 unit tests (offline, deterministic). Mocks the viem registry read so no network is hit:
// resolve (agentId + evm), owner-mismatch ⇒ error (REF-5), unknown agentId ⇒ error, evm-only bind, bad input.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// A controllable mock of the registry contract reads (hoisted so the vi.mock factory can close over it).
const { readContract } = vi.hoisted(() => ({ readContract: vi.fn() }));
vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return { ...actual, createPublicClient: () => ({ readContract }) };
});

// config pins the registry address; SEPOLIA_RPC_URL must be present for registryClient().
process.env.SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://example.invalid/rpc';
process.env.ERC8004_REGISTRY_ADDRESS =
  process.env.ERC8004_REGISTRY_ADDRESS || '0x8004A818BFB912233c491871b3d84c89A494BD9e';

import { resolveExternalIdentity } from './erc8004';

const OWNER = '0x92AAe0857979a139344f5b6F008e71F27A507522';
const WALLET = '0x92AAe0857979a139344f5b6F008e71F27A507522';
const OTHER = '0xA7132182Cbc0ceA8bE148FDE88faaD3BB9410d48';
const ZERO = '0x0000000000000000000000000000000000000000';

// Set the registry read behavior: ownerOf -> `owner` (or throws when an Error), getAgentWallet -> `wallet`.
function setRegistry(owner: string | Error, wallet: string = ZERO) {
  readContract.mockImplementation((args: { functionName: string }) => {
    if (args.functionName === 'ownerOf') {
      if (owner instanceof Error) return Promise.reject(owner);
      return Promise.resolve(owner);
    }
    return Promise.resolve(wallet); // getAgentWallet
  });
}

describe('resolveExternalIdentity (R1)', () => {
  beforeEach(() => {
    readContract.mockReset();
    readContract.mockResolvedValue(ZERO); // safe default; each test overrides via setRegistry
  });

  it('resolves the on-chain owner for a known agentId', async () => {
    setRegistry(OWNER, WALLET);
    const r = await resolveExternalIdentity({ agentId: '7395' });
    expect(r.resolvedOwner.toLowerCase()).toBe(OWNER.toLowerCase());
    expect(r.agentId).toBe('7395');
    expect(r.source).toBe('erc8004');
    expect(r.caip).toContain('erc721:');
    expect(r.caip).toContain('/7395');
  });

  it('accepts a matching supplied EVM (owner match)', async () => {
    setRegistry(OWNER, ZERO);
    const r = await resolveExternalIdentity({ agentId: 7395, evmAddress: OWNER });
    expect(r.resolvedOwner.toLowerCase()).toBe(OWNER.toLowerCase());
  });

  it('accepts a supplied EVM matching the declared wallet', async () => {
    setRegistry(OTHER, WALLET); // owner differs, but wallet matches the supplied EVM
    const r = await resolveExternalIdentity({ agentId: 1, evmAddress: WALLET });
    expect(r.declaredWallet?.toLowerCase()).toBe(WALLET.toLowerCase());
  });

  it('throws owner-mismatch when the supplied EVM matches neither owner nor wallet (REF-5)', async () => {
    setRegistry(OWNER, ZERO);
    await expect(resolveExternalIdentity({ agentId: 7395, evmAddress: OTHER })).rejects.toThrow(/owner mismatch/i);
  });

  it('throws a clear error for an unknown/nonexistent agentId (ownerOf reverts)', async () => {
    setRegistry(new Error('execution reverted: ERC721: invalid token ID'));
    await expect(resolveExternalIdentity({ agentId: '999999999' })).rejects.toThrow(/unknown|nonexistent|not registered/i);
  });

  it('resolves an evm-only bind without touching the registry (source: evm)', async () => {
    const r = await resolveExternalIdentity({ evmAddress: OWNER });
    expect(r.source).toBe('evm');
    expect(r.agentId).toBeNull();
    expect(r.resolvedOwner.toLowerCase()).toBe(OWNER.toLowerCase());
    expect(readContract).not.toHaveBeenCalled();
  });

  it('rejects a malformed EVM address', async () => {
    await expect(resolveExternalIdentity({ evmAddress: '0xnothex' })).rejects.toThrow(/not a valid EVM address/i);
  });

  it('rejects a malformed agentId', async () => {
    await expect(resolveExternalIdentity({ agentId: 'abc' })).rejects.toThrow(/not a valid non-negative integer/i);
  });

  it('requires at least one of agentId / evmAddress', async () => {
    await expect(resolveExternalIdentity({})).rejects.toThrow(/requires an agentId and\/or an evmAddress/i);
  });
});
