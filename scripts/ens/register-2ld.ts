// File: scripts/ens/register-2ld.ts
// [DP-1 RESOLVED 2026-09-12] Real ENSv2-alpha ETHRegistrar ABI introspected from the deployed
// contract (ensdomains/namechain contracts/deployments/sepolia/ETHRegistrar.json + sources).
// Corrections vs the ARCHITECTURE placeholder:
//   - availability probe is isAvailable(string), not available(string).
//   - makeCommitment(string label,address owner,bytes32 secret,address subregistry,address resolver,uint64 duration,bytes32 referrer).
//   - register(string label,address owner,bytes32 secret,address subregistry,address resolver,uint64 duration,address paymentToken,bytes32 referrer) returns tokenId.
//   - registration is PRICED in an ERC-20 payment token (MockUSDC on the testnet deployment); the
//     deployer must hold + approve the fee before register. MockUSDC.mint() is a public faucet.
//   - MIN_COMMITMENT_AGE = 60s (confirmed on-chain); the reveal waits that long.
// tokenId scheme (DP-1 item 3): ENSv2 registries key by labelhash = uint256(keccak256(label)),
// per-registry, with version bits in the low 32; read views accept the plain labelhash (version 0).
// Run LOCALLY (60s commit wait). Persists the secret so a crash between commit and reveal does not burn the commit.
import { parseAbi, keccak256, toBytes, encodePacked, toHex } from 'viem';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { publicClient, walletClient } from './client';
import { ENS } from './addresses';

// MockUSDC is the payment token accepted by the testnet StandardRentPriceOracle (isPaymentToken==true).
export const MOCK_USDC = '0xd3322b29a7bdee707d1684676f149bf41aa3422f' as const;

// [DP-1 CONFIRMED] real ETHRegistrar commit-reveal + priced-register ABI.
const registrarAbi = parseAbi([
  'function isAvailable(string label) view returns (bool)',
  'function MIN_COMMITMENT_AGE() view returns (uint64)',
  'function commit(bytes32 commitment)',
  'function commitmentAt(bytes32 commitment) view returns (uint64)',
  'function getRegisterPrice(string label,uint64 duration,address paymentToken) view returns (uint256,uint256)',
  'function makeCommitment(string label,address owner,bytes32 secret,address subregistry,address resolver,uint64 duration,bytes32 referrer) pure returns (bytes32)',
  'function register(string label,address owner,bytes32 secret,address subregistry,address resolver,uint64 duration,address paymentToken,bytes32 referrer) returns (uint256)',
]);

// The .eth parent registry, used to check whether the deployer already owns a candidate (resume-safety).
const ethRegistryAbi = parseAbi(['function findOwner(string label) view returns (address)']);

const erc20Abi = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner,address spender) view returns (uint256)',
  'function approve(address spender,uint256 value)',
  'function mint(address to,uint256 amount)',
]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as const;

// [DP-1 item 3] tokenId = labelhash, per-registry. Read views accept the version-0 labelhash.
// The full name is retained for callers that build child names; the tokenId is derived from the LABEL.
export function tokenIdOf(fullName: string): bigint {
  const label = fullName.split('.')[0];
  return BigInt(keccak256(toBytes(label)));
}

// Ensure the deployer holds and has approved enough MockUSDC to cover the register fee (base+premium).
async function ensurePayment(fee: bigint): Promise<void> {
  const wallet = walletClient();
  const owner = wallet.account.address;
  const bal = (await publicClient.readContract({ address: MOCK_USDC, abi: erc20Abi, functionName: 'balanceOf', args: [owner] })) as bigint;
  if (bal < fee) {
    const need = fee - bal + 10_000_000n; // faucet a comfortable buffer
    const mintHash = await wallet.writeContract({ address: MOCK_USDC, abi: erc20Abi, functionName: 'mint', args: [owner, need] });
    await publicClient.waitForTransactionReceipt({ hash: mintHash });
  }
  const allowance = (await publicClient.readContract({ address: MOCK_USDC, abi: erc20Abi, functionName: 'allowance', args: [owner, ENS.ETHRegistrar] })) as bigint;
  if (allowance < fee) {
    const approveHash = await wallet.writeContract({ address: MOCK_USDC, abi: erc20Abi, functionName: 'approve', args: [ENS.ETHRegistrar, fee * 4n] });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
  }
}

// A deterministic secret so a crash between commit and reveal resumes the SAME commitment.
function loadSecret(label: string): `0x${string}` {
  const saltFile = `.salt-${label}`;
  if (existsSync(saltFile)) return readFileSync(saltFile, 'utf8').trim() as `0x${string}`;
  const secret = keccak256(encodePacked(['string', 'address'], [`leash-${label}`, ENS.ETHRegistry]));
  writeFileSync(saltFile, secret);
  return secret;
}

// Returns { label, fullName, tokenId } for the registered name (preferred or a free fallback).
// The child name lives under the ETHRegistry ("<label>.eth") or under a supplied parent registry.
export async function register2LD(
  preferred: string,
  fallbacks: string[],
  parentName = 'eth',
  durationSecs = 31_536_000n,
): Promise<{ label: string; fullName: string; tokenId: bigint }> {
  const wallet = walletClient();
  const owner = wallet.account.address;

  // Resume-safety (idempotent): if the deployer ALREADY owns a candidate, reuse it - do not burn a
  // fresh registration on a fallback. This makes a re-run of setup after a mid-flight crash a no-op here.
  let label = '';
  for (const c of [preferred, ...fallbacks]) {
    const curOwner = (await publicClient.readContract({ address: ENS.ETHRegistry, abi: ethRegistryAbi, functionName: 'findOwner', args: [c] })) as `0x${string}`;
    if (curOwner.toLowerCase() === owner.toLowerCase()) {
      return { label: c, fullName: `${c}.${parentName}`, tokenId: tokenIdOf(`${c}.${parentName}`) };
    }
  }
  for (const c of [preferred, ...fallbacks]) {
    const free = (await publicClient.readContract({ address: ENS.ETHRegistrar, abi: registrarAbi, functionName: 'isAvailable', args: [c] })) as boolean;
    if (free) { label = c; break; }
  }
  if (!label) throw new Error('no free label among candidates: ' + [preferred, ...fallbacks].join(','));

  const [base, premium] = (await publicClient.readContract({
    address: ENS.ETHRegistrar, abi: registrarAbi, functionName: 'getRegisterPrice', args: [label, durationSecs, MOCK_USDC],
  })) as [bigint, bigint];
  const fee = base + premium;
  await ensurePayment(fee);

  const secret = loadSecret(label);
  // Commit-reveal binds owner + the resolver/subregistry the name is registered with.
  const commitment = (await publicClient.readContract({
    address: ENS.ETHRegistrar, abi: registrarAbi, functionName: 'makeCommitment',
    args: [label, owner, secret, ENS.ETHRegistry, ENS.PublicResolverV2, durationSecs, ZERO_BYTES32],
  })) as `0x${string}`;

  const alreadyCommitted = (await publicClient.readContract({ address: ENS.ETHRegistrar, abi: registrarAbi, functionName: 'commitmentAt', args: [commitment] })) as bigint;
  if (alreadyCommitted === 0n) {
    const commitHash = await wallet.writeContract({ address: ENS.ETHRegistrar, abi: registrarAbi, functionName: 'commit', args: [commitment] });
    await publicClient.waitForTransactionReceipt({ hash: commitHash });
  }

  const minAge = (await publicClient.readContract({ address: ENS.ETHRegistrar, abi: registrarAbi, functionName: 'MIN_COMMITMENT_AGE' })) as bigint;
  await sleep(Number(minAge) * 1000 + 5_000);

  const regHash = await wallet.writeContract({
    address: ENS.ETHRegistrar, abi: registrarAbi, functionName: 'register',
    args: [label, owner, secret, ENS.ETHRegistry, ENS.PublicResolverV2, durationSecs, MOCK_USDC, ZERO_BYTES32],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: regHash });
  if (receipt.status !== 'success') throw new Error(`register(${label}) reverted: ${toHex(regHash)}`);

  const fullName = `${label}.${parentName}`;
  return { label, fullName, tokenId: tokenIdOf(fullName) };
}
