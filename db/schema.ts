// File: db/schema.ts
// Drizzle schema for the INDEX layer ONLY (component 9). INVARIANT #3: the DB is NEVER read on any
// enforcement path - enforcement always reads ENS live. These tables mirror on-chain/HCS state for fast UI reads.
import { pgTable, text, timestamp, integer, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  privyUserId: text('privy_user_id').unique().notNull(),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orgs = pgTable('orgs', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  ensName: text('ens_name').unique().notNull(), // <org>.<root>.eth
  registryAddress: text('registry_address').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const agents = pgTable('agents', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => orgs.id).notNull(),
  ensName: text('ens_name').unique().notNull(), // data.<org>.<root>.eth
  maxPerCall: text('max_per_call').notNull(),    // raw smallest-unit
  allowedPayees: text('allowed_payees').notNull(), // JSON array string
  hederaAccount: text('hedera_account').notNull(),
  privyWalletId: text('privy_wallet_id').notNull(),
  status: text('status').notNull().default('active'), // active | revoked
  mintTx: text('mint_tx'),
  policyTx: text('policy_tx'),
});

export const spendEvents = pgTable('spend_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentName: text('agent_name').notNull(),
  decision: text('decision').notNull(), // ALLOW | DENY
  amount: text('amount').notNull(),
  payTo: text('pay_to').notNull(),
  reason: text('reason'),
  hcsSequence: integer('hcs_sequence').notNull(),
  ts: timestamp('ts').defaultNow().notNull(),
});
