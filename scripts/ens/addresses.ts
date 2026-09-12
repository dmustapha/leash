// File: scripts/ens/addresses.ts
// Pinned ENSv2 Sepolia set (2026-06-29). Prefer runtime load from contracts-v2/deployments/sepolia/*.json
// if that repo is cloned; otherwise this pinned set is authoritative (master §4.1).
import type { Address } from 'viem';
import { existsSync, readFileSync } from 'fs';

const PINNED = {
  RootRegistry: '0x11b5bfbe9078d826b1edbdd1cfc12f5828d9f50c',
  ETHRegistry: '0x67b728a792e789a8978b30cf1b3b641f19354b43',
  ETHRegistrar: '0xa4449a0dd2b83007553d9b1d28b583a46a805a30',
  PublicResolverV2: '0xd25f66dd4ff61486c2c5c1e6201a23576698d3df',
  PermissionedResolverImpl: '0x7e4b2d59938930168024201752ee5503df402303',
  UserRegistryImpl: '0x840fa461059862ea466a711e8c98c8de732061c0',
  VerifiableFactory: '0x118bc31a50d559f7015a8da26d54b3b030cdb70f',
  UniversalResolverV2: '0x85edf8b6b7d4211e2b07aa687506b746357b92cf',
  UpgradableUniversalResolverProxy: '0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe',
  ReverseRegistrarAdapter: '0x94e64e29e25533f93ba0a430646ae42cb47bf8f3',
} as const;

// Optional runtime override from a cloned contracts-v2 deployment (master §4.1).
function loadOverride(): Partial<typeof PINNED> {
  const path = 'contracts-v2/deployments/sepolia/deployment.json';
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
}

export const ENS = { ...PINNED, ...loadOverride() } as Record<keyof typeof PINNED, Address>;

// EAC role bitmap (master §4.1).
export const ROLE = {
  REGISTRAR: 1n << 0n,
  UNREGISTER: 1n << 12n,
  RENEW: 1n << 16n,
  SET_SUBREGISTRY: 1n << 20n,
  SET_RESOLVER: 1n << 24n,
} as const;
export const ADMIN_SHIFT = 128n; // admin variant = role << 128
