# Phase 02: Move the Implementation to Supabase - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-14
**Phase:** 02-move-the-implementation-to-supabase
**Areas discussed:** Supabase footprint, Recovery ownership, Environment model, Cutover and data

---

## Supabase Footprint

### Hosted platform scope

| Option | Description | Selected |
|--------|-------------|----------|
| Database + Edge Functions | Move PostgreSQL and Fastify route behavior to Supabase Postgres plus Edge Functions; keep Stripe and Resend external. | |
| Managed Postgres only | Use Supabase only as the database and keep Fastify on a separate host. | |
| Supabase platform broadly | Use Postgres, Edge Functions, Auth, and other Supabase services where practical. | ✓ |

**User's choice:** Supabase platform broadly.

### Authentication scope

| Option | Description | Selected |
|--------|-------------|----------|
| Only support actions | Keep reviews anonymous; authenticate only for payment or restore. | ✓ |
| Restore only | Keep Checkout anonymous and authenticate only on another installation. | |
| Every app launch | Make Supabase authentication part of normal startup. | |

**User's choice:** Only support actions.
**Notes:** The user asked to replace magic-link recovery with Supabase OAuth. This intentionally changes REC-01 rather than adding app-wide authentication.

### OAuth client boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Hosted Supabase flow | Open a hosted support page; Supabase Auth/Functions complete OAuth while Cumpa polls installation status. | ✓ |
| Direct from local UI | Run `supabase-js` in the ephemeral loopback browser and handle dynamic redirects locally. | |
| You decide | Let research choose while preserving support-only authentication and secret safety. | |

**User's choice:** Hosted Supabase flow.

### Standalone-service retirement

| Option | Description | Selected |
|--------|-------------|----------|
| Remove it completely | Supabase becomes the sole hosted implementation; remove Render, Fastify, `pg`, and recovery email. | ✓ |
| Keep fallback service | Retain the old host as a disabled fallback. | |
| Keep shared Fastify core | Preserve Fastify business logic behind Supabase adapters. | |

**User's choice:** Remove it completely.

---

## Recovery Ownership

### OAuth provider

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub only | One provider aligned with Cumpa's developer audience. | ✓ |
| Google only | Broader consumer availability. | |
| GitHub + Google | More choice with immediate cross-provider account-linking complexity. | |

**User's choice:** GitHub only.

### Payment binding

| Option | Description | Selected |
|--------|-------------|----------|
| Sign in before Checkout | Put the authenticated Supabase user ID in server-controlled Stripe metadata. | ✓ |
| Match account email | Match later by Stripe and GitHub email. | |
| Manual claim code | Issue a separate claim credential after payment. | |

**User's choice:** Sign in before Checkout.

### Restore completion

| Option | Description | Selected |
|--------|-------------|----------|
| Restore automatically | Bind the requesting installation after authenticated supporter verification and let local polling complete the dialog. | ✓ |
| Require confirmation | Show identity and require a final Restore action. | |
| Keep account signed in locally | Return and persist a Supabase auth session in Cumpa. | |

**User's choice:** Restore automatically.

### Email-recovery removal

| Option | Description | Selected |
|--------|-------------|----------|
| OAuth only | Remove recovery-email collection, magic-link tokens, and Resend. | ✓ |
| Keep email fallback | Retain both identity systems. | |
| Operator-assisted fallback | Add a manual support claim path. | |

**User's choice:** OAuth only.

---

## Environment Model

### Local development

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase CLI locally | Run local Postgres, Auth, and Functions. | |
| Hosted project only | Use remote Supabase for all development and tests. | |
| Database locally only | Run a local database while Auth and Functions use hosted Supabase. | ✓ |

**User's choice:** Database locally only.

### Hosted projects

| Option | Description | Selected |
|--------|-------------|----------|
| Development + production | Separate non-production OAuth/Functions/Stripe test mode from live traffic. | ✓ |
| Production only | Use one hosted project for all work. | |
| Development + staging + production | Add a third promotion environment. | |

**User's choice:** Development + production.

### Local database runtime

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase-compatible Postgres | Match hosted roles, extensions, and migrations without running the full local stack. | ✓ |
| Generic PostgreSQL | Keep the existing disposable PostgreSQL harness. | |
| You decide | Leave the exact database-only setup to research. | |

**User's choice:** Supabase-compatible Postgres.

### Production promotion

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit CLI promotion | Run reviewed deployment commands manually. | |
| Automatic on main | CI deploys versioned migrations and Functions after merge. | ✓ |
| Supabase Git integration | Use Supabase-managed branch/deployment integration. | |

**User's choice:** Automatic on main.

---

## Cutover and Data

### Existing production data

| Option | Description | Selected |
|--------|-------------|----------|
| No production data | Treat Supabase as the first real hosted launch; no import or dual writes. | ✓ |
| Migrate existing records | Import installations, fulfillment, and recovery state. | |
| Verify before deciding | Inventory the current host and keep migration conditional. | |

**User's choice:** No production data.

### Hosted verification target

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase proof only | Replace the blocked Render checkpoint with real Supabase/Stripe/GitHub proof. | ✓ |
| Verify Render first | Finish Phase 01's current deployment before migrating. | |
| Local proof only | Skip real hosted-provider evidence. | |

**User's choice:** Supabase proof only.

### Hosted data retention

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal fulfillment record | Store account/payment/event identifiers, timestamps, and installations needed for authority and idempotency. | ✓ |
| Status only | Store only a supporter flag. | |
| Rich supporter profile | Copy GitHub and Stripe profile details. | |

**User's choice:** Minimal fulfillment record.

### API compatibility

| Option | Description | Selected |
|--------|-------------|----------|
| Clean API cutover | Update Cumpa and Supabase together; remove email-recovery endpoints and schemas. | ✓ |
| Temporary legacy endpoints | Retain the old recovery API during transition. | |
| Permanent compatibility | Operate both recovery models indefinitely. | |

**User's choice:** Clean API cutover.

---

## Claude's Discretion

- Exact schema names, function boundaries, callback mechanics, hosted-page presentation, CI provider, development deployment trigger, and polling cadence within the locked decisions.

## Deferred Ideas

- App-wide authentication — outside the support-only phase boundary.
- Additional OAuth providers — GitHub is the only provider in this phase.
