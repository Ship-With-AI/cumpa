# Phase 02: Move the Implementation to Supabase - Context

**Gathered:** 2026-08-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the unverified standalone Render/Fastify/PostgreSQL/Resend support backend from Phase 01 with Supabase Postgres, Auth, and Edge Functions. Preserve the optional USD $49.99 Stripe-hosted support payment, webhook-authoritative fulfillment, machine-wide local prompt suppression, unlimited-installation restoration, and unrestricted review experience. Intentionally replace email magic-link recovery with support-scoped GitHub OAuth; normal Cumpa use remains anonymous and local-first.

</domain>

<decisions>
## Implementation Decisions

### Supabase footprint
- **D-01:** Supabase broadly owns the hosted implementation: Postgres, Auth, and Edge Functions. Stripe remains the payment and webhook provider.
- **D-02:** Remove the standalone Render deployment, Fastify support service, direct `pg` runtime, recovery-email infrastructure, and Resend integration after equivalent Supabase paths pass verification. Do not retain a fallback implementation or shared Fastify compatibility layer.
- **D-03:** Keep the published Cumpa package behind narrow hosted HTTPS capabilities. Support OAuth runs on a hosted Supabase surface; the ephemeral loopback browser does not receive or persist a Supabase auth session.
- **D-04:** Authentication is required only after a user chooses a support action. Launching and using every review feature remains anonymous and unrestricted.

### OAuth supporter identity
- **D-05:** GitHub is the only OAuth provider in this phase.
- **D-06:** A user who chooses to support Cumpa signs in with GitHub before Stripe Checkout. Server-controlled Stripe metadata binds the Checkout and verified webhook fulfillment to the authenticated Supabase user ID; do not match payment ownership by email.
- **D-07:** On another installation, Restore opens the same hosted GitHub OAuth flow. After authentication, the hosted service automatically binds a paid supporter to the requesting installation; the local dialog closes when status polling observes verification.
- **D-08:** OAuth fully replaces recovery email, magic links, recovery tokens, and Resend. There is no email fallback or operator-assisted claim flow in this phase.
- **D-09:** Preserve unlimited-installation restoration. Locally persist only installation identity and verified supporter status; do not persist GitHub profile data, payer email, or OAuth tokens in Cumpa state.

### Requirements cutover
- **D-10:** Phase 02 intentionally supersedes the email-magic-link mechanism in `REC-01` and the recovery-token mechanism in `REC-02`. Research and planning must revise those requirement details to GitHub OAuth while preserving privacy, non-enumeration of supporter status to unauthenticated callers, secure single-user account binding, and installation-bound restoration.
- **D-11:** `REC-03` remains unchanged: one verified supporter may restore status on unlimited installations without device management or transfer flows.
- **D-12:** All PAY and SUP behavior remains unchanged except the support action now authenticates before Checkout and the Restore action uses OAuth.

### Environment model
- **D-13:** Run only a Supabase-compatible Postgres database locally. Auth and Edge Function development/integration use a hosted non-production Supabase project rather than a complete local Supabase stack.
- **D-14:** Maintain exactly two hosted Supabase projects: development and production. Development owns non-production OAuth, Edge Function, and Stripe test-mode integration.
- **D-15:** Version database migrations and Edge Functions in Git. Merges to `main` automatically deploy the production Supabase changes through CI; do not require manual promotion or Supabase Git integration.

### Cutover and data
- **D-16:** Assume no production supporter records exist. Supabase is the first real hosted launch; do not build import, dual-write, or data-reconciliation machinery for Render/PostgreSQL.
- **D-17:** Supabase replaces the blocked Render provider checkpoint and becomes the only hosted acceptance target. Real Stripe test-mode, GitHub OAuth, webhook, automatic restore, package-safety, and status-polling evidence must pass against Supabase; do not deploy Render first or substitute local-only proof.
- **D-18:** Retain only the hosted data needed for authority and operations: Supabase user ID, Stripe event/customer/session/payment identifiers required for fulfillment proof and idempotency, verification timestamps, and bound installation IDs. Do not copy GitHub profile fields or payer email into supporter records.
- **D-19:** Make a clean API cutover. Update Cumpa and Supabase together; remove legacy email-recovery routes and schemas rather than providing temporary or permanent compatibility. Existing machine-local verified status remains valid across the package upgrade.

### Claude's Discretion
- Exact Supabase schema names, Edge Function boundaries, hosted support-page layout, OAuth callback mechanics, development-project deployment trigger, CI provider, and polling cadence, provided the locked platform, privacy, environment, and clean-cutover decisions above remain intact.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and active requirements
- `.planning/PROJECT.md` — Cumpa's local-first product boundary, no-feature-gating rule, runtime constraints, and established security/persistence decisions.
- `.planning/REQUIREMENTS.md` — Current PAY/SUP/REC requirements. Phase 02 intentionally replaces the magic-link and recovery-token details of REC-01 and REC-02 as recorded in D-10.
- `.planning/ROADMAP.md` — Phase 02 placement after the voluntary-support implementation; its placeholder goal must be resolved from this context before planning.

### Prior phase authority and deployment status
- `.planning/phases/01-add-voluntary-stripe-support-payment-and-email-recovery/01-CONTEXT.md` — Locked support-dialog, Checkout, machine-wide status, and restoration behavior carried forward except where OAuth explicitly supersedes email recovery.
- `.planning/phases/01-add-voluntary-stripe-support-payment-and-email-recovery/01-05-SUMMARY.md` — Confirms local implementation passed and real deployed-provider proof remains blocked.
- `docs/support-service-operations.md` — Existing Render/Stripe/Resend operations and evidence contract to replace with Supabase-specific deployment and proof.

### Validated project findings
- `.kimi-code/skills/spike-findings-cumpa/SKILL.md` — Existing Cumpa implementation constraints and validated patterns.
- `.kimi-code/skills/spike-findings-cumpa/references/cli-source-discovery.md` — Startup and packaged-runtime constraints that support integration must not regress.

No external design specification was supplied. Research must verify current Supabase Auth, Edge Functions, database, migration, secrets, and CI deployment behavior against official documentation.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/server/support-store.ts` — Keep its machine-wide installation identity and verified-status persistence behavior; it remains the local authority after hosted verification.
- `src/server/support-client.ts` and `src/server/capabilities.ts` — Reuse the narrow hosted-client/capability boundary while replacing email-recovery contracts with hosted OAuth initiation and status polling.
- `src/web/components/SupportDialog.vue` — Preserve the existing optional support, waiting, automatic thank-you, dismissal, focus, and inert-background experience; replace only the recovery interaction and pre-Checkout authentication handoff.
- `services/support/tests/`, `tests/e2e/support-payment.spec.ts`, `tests/e2e/support-recovery.spec.ts`, and `tests/integration/support-dialog.spec.ts` — Existing observable behavior is the migration oracle; adapt tests to GitHub OAuth and Supabase rather than retaining the old service.

### Established Patterns
- The installed app trusts only server-verified fulfillment; browser redirects and local claims never establish supporter status.
- Hosted calls cross a bounded HTTPS capability, while the loopback server and machine-wide JSON store remain authoritative for local state.
- Stripe webhooks require signature verification and idempotent transactional settlement.
- Published-package verification must prove no hosted secrets or privileged credentials enter package assets.

### Integration Points
- Replace `services/support/src/app.ts`, its Fastify routes, `services/support/src/db.ts`, `services/support/migrations/001_init.sql`, and `render.yaml` with Supabase functions, migrations, and deployment configuration; remove the obsolete service once migrated.
- Change `src/server/support-client.ts` recovery request/status contracts from email challenge tokens to hosted OAuth initiation plus installation-bound status observation.
- Change `src/web/components/SupportDialog.vue` so both Support and Restore open the hosted GitHub OAuth flow; Support continues to Stripe Checkout only after authentication.
- Keep `src/server/support-store.ts` compatible with already-persisted verified state during the clean hosted API cutover.

</code_context>

<specifics>
## Specific Ideas

- Supporting Cumpa must remain the only authenticated path; ordinary reviews never require an account.
- The hosted OAuth flow should leave the local workspace open and complete payment or restoration through existing background status observation.
- Payment ownership is account-bound through server-controlled Stripe metadata, never inferred from matching email addresses.

</specifics>

<deferred>
## Deferred Ideas

None — GitHub OAuth intentionally replaces the prior recovery mechanism within this migration phase; app-wide authentication and additional OAuth providers remain outside the phase boundary.

</deferred>

---

*Phase: 02-move-the-implementation-to-supabase*
*Context gathered: 2026-08-14*
