# Roadmap: Cumpa

## Milestones

- **[v1.0 MVP](./milestones/v1.0-ROADMAP.md)** — Phases 01–04.1, 40 plans, shipped 2026-07-24.
- **[v1.1 GitHub Dark Diff](./milestones/v1.1-ROADMAP.md)** — Phases 05–08, 16 plans, 18/18 requirements, shipped 2026-07-29.
- **[v1.2 Fast Source Discovery](./milestones/v1.2-ROADMAP.md)** — Phases 09–11, 4 plans, 5/5 requirements, shipped 2026-07-30.
- **[v1.3 Agent Review Handoff](./milestones/v1.3-ROADMAP.md)** — Phases 12–15, 14 plans, 42 tasks, 17/17 requirements, shipped 2026-08-06.

### Phase 1: Add voluntary Stripe support payment and email recovery

**Goal:** Let a developer optionally support Cumpa with one USD $49.99 Stripe-hosted payment, verify it only through hosted webhook authority, persist installation-wide prompt suppression, and restore it on additional installations through privacy-safe email magic links without gating any review feature.
**Requirements:** PAY-01, PAY-02, PAY-03, PAY-04, SUP-01, SUP-02, SUP-03, SUP-04, SUP-05, REC-01, REC-02, REC-03
**Depends on:** Phase 0
**Plans:** 5 plans

Plans:

- [ ] 01-01-PLAN.md — Approve exact hosted dependency provenance before installation
- [ ] 01-02-PLAN.md — Build signature-verified idempotent Stripe fulfillment and hosted status authority
- [ ] 01-03-PLAN.md — Add non-enumerating magic-link recovery and concrete hosted deployment
- [ ] 01-04-PLAN.md — Add machine-wide local status, hosted client, authenticated APIs, and launch wiring
- [ ] 01-05-PLAN.md — Deliver workspace-ready support UI, packaged end-to-end proof, secret safety, and operations

### Phase 2: Move the implementation to Supabase

**Goal:** Replace the blocked standalone support backend with Supabase Postgres, Auth, and Edge Functions while preserving optional webhook-authoritative USD $49.99 support and machine-wide prompt suppression, replacing email recovery with installation-bound GitHub OAuth restoration, and completing a verified Supabase-only production cutover.
**Requirements:** PAY-01, PAY-02, PAY-03, PAY-04, SUP-01, SUP-02, SUP-03, SUP-04, SUP-05, REC-01, REC-02, REC-03 (REC-01/REC-02 mechanisms superseded by Phase 2 D-10)
**Depends on:** Phase 1
**Plans:** 6/13 plans executed

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Approve four exact Supabase and Stripe package provenance records

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — TDD the RLS/RPC support authority and prove two clean schema applications

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03-PLAN.md — Implement GitHub OAuth, fixed-price Checkout, status, and webhook Edge Functions

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 02-04-PLAN.md — Cut shared/server contracts to the hosted action and monotonic status boundary

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 02-05-PLAN.md — Cut every browser caller to Support/Restore actions with rendered RED/GREEN proof

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 02-06-PLAN.md — Prove complete ordinary-local support disablement while preserving configured contracts

**Wave 7** *(blocked on Wave 6 completion)*

- [ ] 02-07-PLAN.md — Run and approve sole-project prelaunch acceptance with full-ref fingerprint and fixture inventory

**Wave 8** *(blocked on Wave 7 completion)*

- [ ] 02-08-PLAN.md — Delete exact acceptance fixtures, prove zero authority, and promote the same project in place

**Wave 9** *(blocked on Wave 8 completion)*

- [ ] 02-09-PLAN.md — Delete legacy hosted service source, schema, routes, tests, and Render declaration

**Wave 10** *(blocked on Wave 9 completion)*

- [ ] 02-10-PLAN.md — Remove legacy service toolchain, workspace, and root dependency graph entries

**Wave 11** *(blocked on Wave 10 completion)*

- [ ] 02-11-PLAN.md — Replace operations docs and prove generated/package legacy absence

**Wave 12** *(blocked on Wave 11 completion)*

- [ ] 02-12-PLAN.md — Land protected sole-production deployment and release the configured public-capability package

**Wave 13** *(blocked on Wave 12 completion)*

- [ ] 02-13-PLAN.md — Approve final local, package, security, requirements, and non-destructive evidence verification
