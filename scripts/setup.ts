// File: scripts/setup.ts
// [DP-1/DP-1b RESOLVED 2026-09-12] One-time provisioning of the 3-level sandbox hierarchy + policy
// substrate. Run LOCALLY (commit-reveal 60s wait). Appends generated ids to .env.
//
// Hierarchy (D-2, 3 levels, parent + >=2 children with distinct caps):
//   <root>.eth            e.g. leash.eth        registered via ETHRegistrar (priced, MockUSDC)
//   <org>.<root>.eth      e.g. acme.leash.eth   minted in leash.eth's own UserRegistry subregistry
//   data|payments.<org>   e.g. data.acme.leash.eth  minted in acme's UserRegistry (SANDBOX_REGISTRY)
//
// Why the org level is NOT a second register2LD: the ETHRegistrar registers only direct .eth 2LDs.
// A subname (acme under leash.eth) must be minted inside leash.eth's subregistry. The placeholder's
// second register2LD call was structurally wrong; corrected here to deploy-subregistry -> mintSubname.
//
// NOTE: run SERIALLY before seed-demo.ts. Both share the single deployer key/nonce + append to .env.
import { register2LD, tokenIdOf } from './ens/register-2ld';
import { deploySubregistry } from './ens/subregistry';
import { mintSubname } from './ens/subname';
import { mintUsdc } from './hedera/mint-usdc';
import { createTopic } from './hedera/hcs';
import { ENS } from './ens/addresses';
import { publicClient } from './ens/client';
import { parseAbi } from 'viem';
import { appendFileSync, readFileSync, existsSync } from 'fs';

const ownerReadAbi = parseAbi(['function findOwner(string label) view returns (address)']);
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

// Idempotent org/child mint: skip if the label is already owned in `registry`.
async function ensureMinted(registry: `0x${string}`, label: string, parentName: string, owner: `0x${string}`, expires: bigint) {
  const cur = (await publicClient.readContract({ address: registry, abi: ownerReadAbi, functionName: 'findOwner', args: [label] })) as `0x${string}`;
  if (cur && cur.toLowerCase() !== ZERO_ADDR) return;
  await mintSubname(registry, label, parentName, owner, expires);
}

async function main() {
  const deployer = process.env.LEASH_DEPLOYER_ADDRESS as `0x${string}`;
  const oneYear = BigInt(Math.floor(Date.now() / 1000) + 31_536_000);

  // 1) Root: a free .eth 2LD via the real priced ETHRegistrar (pays MockUSDC; faucets if needed).
  const root = await register2LD('leash', ['leashorg', 'leashctl', 'leashfleet'], 'eth');

  // 2) Deploy the org-parent UserRegistry under the root name (wired in the canonical ETHRegistry).
  const orgParentRegistry = await deploySubregistry(root.tokenId, ENS.ETHRegistry, root.label);

  // 3) Mint the org name (acme) in the org-parent registry -> acme.leash.eth.
  const orgLabel = 'acme';
  await ensureMinted(orgParentRegistry, orgLabel, root.fullName, deployer, oneYear);
  const orgFullName = `${orgLabel}.${root.fullName}`;
  const orgTokenId = tokenIdOf(orgFullName);

  // 4) Deploy the sandbox UserRegistry under the org name (this is SANDBOX_REGISTRY where children live).
  const sandboxRegistry = await deploySubregistry(orgTokenId, orgParentRegistry, orgLabel);

  // 5) Hedera substrate: own 6-dec HTS USDC + HCS audit topic.
  const { tokenId, evmAddress } = await mintUsdc();
  const topic = await createTopic();

  // Append only keys that carry NO value yet (empty or absent), so a resume re-run never duplicates.
  const envText = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
  const pairs: [string, string][] = [
    ['ENS_PARENT_NAME', root.fullName],
    ['SANDBOX_ORG_NAME', orgFullName],
    ['SANDBOX_ORG_PARENT_REGISTRY', orgParentRegistry],
    ['SANDBOX_REGISTRY', sandboxRegistry],
    ['USDC_TOKEN_ID', tokenId],
    ['USDC_EVM_ADDRESS', evmAddress],
    ['HCS_TOPIC_ID', topic],
  ];
  const hasValue = (k: string) => new RegExp(`^${k}=.+$`, 'm').test(envText);
  const toAppend = pairs.filter(([k]) => !hasValue(k)).map(([k, v]) => `${k}=${v}`);
  if (toAppend.length) appendFileSync('.env', '\n' + toAppend.join('\n') + '\n');
  console.log('setup complete:', {
    root: root.fullName,
    org: orgFullName,
    registry: sandboxRegistry,
    tokenId: orgTokenId.toString(),
    evmAddress,
    topic,
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
