-- File: db/init.sql
-- [Task 5.4b / DEV-029] Index-layer schema DDL for the real console. Mirrors db/schema.ts exactly. The Neon
-- DB had NO tables (schema was never pushed and there is no drizzle-kit in deps), so the console's org/agent
-- routes could not write. This DDL is idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS) so a re-run is a
-- no-op. INVARIANT #3: these tables are the INDEX layer only - never read on an enforcement path.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_user_id text UNIQUE NOT NULL,
  email         text,
  created_at    timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orgs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         uuid NOT NULL REFERENCES users(id),
  ens_name         text UNIQUE NOT NULL,
  registry_address text NOT NULL,
  created_at       timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES orgs(id),
  ens_name       text UNIQUE NOT NULL,
  max_per_call   text NOT NULL,
  allowed_payees text NOT NULL,
  hedera_account text NOT NULL,
  agent_evm      text NOT NULL DEFAULT '',
  agent_key      text NOT NULL DEFAULT '',
  privy_wallet_id text NOT NULL DEFAULT '',
  status         text NOT NULL DEFAULT 'active',
  mint_tx        text,
  policy_tx      text
);
-- Additive columns for an already-created agents table (idempotent).
ALTER TABLE agents ADD COLUMN IF NOT EXISTS agent_evm text NOT NULL DEFAULT '';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS agent_key text NOT NULL DEFAULT '';
ALTER TABLE agents ALTER COLUMN privy_wallet_id SET DEFAULT '';

CREATE TABLE IF NOT EXISTS spend_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name   text NOT NULL,
  decision     text NOT NULL,
  amount       text NOT NULL,
  pay_to       text NOT NULL,
  reason       text,
  hcs_sequence integer NOT NULL,
  ts           timestamp NOT NULL DEFAULT now()
);
