---
phase: 02-move-the-implementation-to-supabase
plan: 01
subsystem: infra
tags: [supabase, stripe, npm, supply-chain, provenance]

# Dependency graph
requires:
  - phase: 01-add-voluntary-stripe-support-payment-and-email-recovery
    provides: "Prior exact Stripe hosted-service provenance approval boundary."
provides:
  - "Human approval of four exact official hosted/tooling package pins before installation."
  - "A restricted-use boundary excluding Supabase and Stripe dependencies and credentials from Cumpa's published runtime."
affects: [02-02, 02-03, supabase-functions, hosted-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Do not install hosted dependencies until exact registry identity, repository, integrity, signatures, lifecycle scripts, and use location have explicit human approval."

key-files:
  created:
    - .planning/phases/02-move-the-implementation-to-supabase/02-01-SUMMARY.md
  modified:
    - .planning/STATE.md
    - .planning/ROADMAP.md

key-decisions:
  - "Approved only supabase@2.114.0 as development/CI tooling, not published runtime code."
  - "Approved only @supabase/supabase-js@2.112.3, @supabase/ssr@0.12.4, and stripe@22.5.0 inside supabase/functions/**."
  - "Accepted npm's empty maintainers response for @supabase/ssr@0.12.4 after exact official repository, integrity, signature, version, and no-install-hook evidence matched."

patterns-established:
  - "Hosted dependency provenance approval is pin-specific and location-specific; no ranges, substitutes, forks, or root runtime imports are authorized."

requirements-completed: [PAY-03, PAY-04, REC-01, REC-02]

# Metrics
duration: 0min active work; approval checkpoint resumed 2026-08-15
completed: 2026-08-15
status: complete
---

# Phase 02 Plan 01: Hosted Package Provenance Summary

**Human-approved exact Supabase and Stripe package pins for narrowly hosted/tooling use, with no manifest, lockfile, import, or application-source change.**

## Performance

- **Duration:** 0min active work; approval checkpoint resumed after the 2026-08-14 evidence collection.
- **Started:** 2026-08-14 (provenance checkpoint opened)
- **Completed:** 2026-08-15T09:49:00Z
- **Tasks:** 1/1 completed
- **Files modified:** 3 planning metadata files

## Accomplishments

- Recorded explicit human approval of the four exact official registry identities, not ranges or substitutes.
- Recorded registry integrity, signing-key, repository, maintainer, publication, and lifecycle evidence for every approved pin.
- Restricted the CLI to development/CI tooling and all runtime libraries to `supabase/functions/**`, keeping the published Cumpa runtime and secrets outside the hosted boundary.

## Task Commits

1. **Task 1: Approve exact hosted package provenance** - human-approved registry evidence; recorded by the plan metadata commit below.

**Plan metadata:** recorded in the close-out commit.

## Files Created/Modified

- `.planning/phases/02-move-the-implementation-to-supabase/02-01-SUMMARY.md` - durable exact-package approval and registry-evidence record.
- `.planning/STATE.md` - advances Phase 02 from completed Plan 01 to ready Plan 02.
- `.planning/ROADMAP.md` - marks the approved provenance plan complete.

## Human Decision

The user explicitly approved all four exact pins and their restricted locations, including the empty npm `maintainers` response for `@supabase/ssr@0.12.4`. This approval is limited to the records below. A different name, version, repository, integrity record, unexplained install lifecycle hook, package range, substitute, fork, or location is not approved and blocks dependent work.

## Registry Evidence and Exact Comparisons

The following targeted command was run without installation:

```text
npm view supabase@2.114.0 name version repository maintainers dist.integrity dist.signatures scripts --json && npm view @supabase/supabase-js@2.112.3 name version repository maintainers dist.integrity dist.signatures scripts --json && npm view @supabase/ssr@0.12.4 name version repository maintainers dist.integrity dist.signatures scripts --json && npm view stripe@22.5.0 name version repository maintainers dist.integrity dist.signatures scripts --json
```

All four queries returned the requested exact name and version, an npm SHA-512 integrity value, and two npm registry signatures made with `SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U`. Their returned `scripts` fields contain build, development, test, documentation, or publication commands only; none contains `preinstall`, `install`, or `postinstall`. Therefore no install-time lifecycle hook is approved or present.

### `supabase@2.114.0`

- **Expected vs returned:** `supabase@2.114.0` — **PASS**; exact name/version returned.
- **Repository:** `https://github.com/supabase/cli.git`, directory `apps/cli` — official `supabase/cli` — **PASS**.
- **Maintainers:** `kiwicopple <pcopplestone@gmail.com>`, `etienne_supa <etienne@supabase.io>`.
- **Published:** `2026-08-12T16:06:17.004Z`.
- **Integrity:** `sha512-JtCR+eDgVs2YtmZl5THdkaTeXex80lax+3V2SXRSuj280SWJPTIKxMLc82iDKjZlqXnt9zrGnJkrWb7DwHGPhQ==`.
- **Signatures:** 2 registry signatures; signing key ID `SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U`.
- **Returned scripts:** `build`, `build:go-sidecar`, `build:legacy`, `build:next`, `build:shim`, `check:all`, `dev:legacy`, `dev:next`, `fix:all`, `generate:go-serve-template`, `test`, `test:core`, `test:smoke`.
- **Lifecycle comparison:** **PASS** — no install lifecycle hook.
- **Approved location:** project development/CI CLI tooling only; never the published Cumpa runtime.

### `@supabase/supabase-js@2.112.3`

- **Expected vs returned:** `@supabase/supabase-js@2.112.3` — **PASS**; exact name/version returned.
- **Repository:** `https://github.com/supabase/supabase-js.git`, directory `packages/core/supabase-js` — official `supabase/supabase-js` — **PASS**.
- **Maintainers:** `etienne_supa <etienne@supabase.io>`, `mandarini <katerina.skroumpelou@supabase.io>`.
- **Published:** `2026-08-11T07:30:00.532Z`.
- **Integrity:** `sha512-Jv1bxVQmEJNkjvPEhFaKjPzsh+Ozyew6lWGD+SoYcsclDEP1z7yEvKvfUQfzy0DkxRIQnZNxmmWtAzw5XLTQoA==`.
- **Signatures:** 2 registry signatures; signing key ID `SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U`.
- **Returned scripts:** `build`, `build:watch`, `docs`, `docs:json`, `serve:coverage`, `test`, `test:all`, `test:bun`, `test:cjs`, `test:coverage`, `test:deno`, `test:edge-functions`, `test:esm`, `test:expo`, `test:exports`, `test:hermes-compat`, `test:integration`, `test:integration:browser`, `test:module-resolution`, `test:next`, `test:node:playwright`, `test:run`, `test:types`, `test:unit`, `test:watch`, `update:test-deps`, `update:test-deps:bun`, `update:test-deps:deno`, `update:test-deps:expo`, `update:test-deps:next`.
- **Lifecycle comparison:** **PASS** — no install lifecycle hook.
- **Approved location:** only `supabase/functions/**`; never root or published Cumpa runtime.

### `@supabase/ssr@0.12.4`

- **Expected vs returned:** `@supabase/ssr@0.12.4` — **PASS**; exact name/version returned.
- **Repository:** `git+https://github.com/supabase/ssr.git` — official `supabase/ssr` — **PASS**.
- **Maintainers:** `[]` returned by npm. **Caveat accepted explicitly by the user:** this empty result is preserved as evidence and does not widen approval beyond this exact pin.
- **Published:** `2026-07-28T16:10:58.740Z`.
- **Integrity:** `sha512-xHzcgI8cC1TpBKSwJcR5Yd8CCwfIq0SBc5yb4yz/YFw5tbCrEQ0QT3a+2jymCxHgQWLfzwN93HZ6eRbcoMkOlA==`.
- **Signatures:** 2 registry signatures; signing key ID `SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U`.
- **Returned scripts:** `build`, `docs`, `test`.
- **Lifecycle comparison:** **PASS** — no install lifecycle hook.
- **Approved location:** only `supabase/functions/**` as the hosted cookie-aware PKCE OAuth adapter; never root or published Cumpa runtime.

### `stripe@22.5.0`

- **Expected vs returned:** `stripe@22.5.0` — **PASS**; exact name/version returned and matches the prior Phase 01 approved pin.
- **Repository:** `git+https://github.com/stripe/stripe-node.git` — official `stripe/stripe-node` — **PASS**.
- **Maintainers:** `stripe-bindings <dev-platform-bots@stripe.com>`.
- **Published:** `2026-08-10T22:19:03.055Z`.
- **Integrity:** `sha512-QVwMwriC0bbySx6R4dpsvJ0W//GojC1kwWVS6rPSoVqDUIZX4Hy3TaUrd2AZeXEAaKbfWIjQjvo3vKAReHZ0vQ==`.
- **Signatures:** 2 registry signatures; signing key ID `SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U`.
- **Returned scripts:** `prepack`, `test`.
- **Lifecycle comparison:** **PASS** — `prepack` is a package-publishing script, not an install lifecycle hook; no `preinstall`, `install`, or `postinstall` is present.
- **Approved location:** only `supabase/functions/**` after migration; never root or published Cumpa runtime. The legacy `services/support/package.json` pin remains the prior separately deployed hosted-service boundary until the clean migration removes it.

## Published-Package Boundary

`package.json` publishes only `dist/` and `.kimi-code/skills/cumpa/` and contains no Supabase or Stripe dependency. `services/support/package.json` currently pins `stripe` to `22.5.0`, as recorded by the prior Phase 01 hosted-service approval. This Phase 02 decision authorizes the future migrated use only in Supabase Edge Functions; it does not authorize Supabase dependencies, OAuth state, privileged Supabase access, GitHub OAuth tokens, Stripe secret keys, webhook secrets, or service credentials in the published Cumpa package.

## Verification

- **Registry provenance command:** PASS — all four exact approved identities, repositories, integrity values, two-signature records, and non-install lifecycle scripts returned as recorded above.
- **Human verification:** PASS — user approved every exact pin and restricted location, expressly accepting the empty `@supabase/ssr@0.12.4` maintainers result.
- **Repository change boundary:** PASS — no package manifest, lockfile, import, or application source changed; only this plan's close-out metadata was written.
- **Project-wide validation:** not run, by explicit assignment; this plan has no code or dependency change.

## Decisions Made

- Approval is exact-pin and exact-location only: `supabase@2.114.0` is tooling-only; `@supabase/supabase-js@2.112.3`, `@supabase/ssr@0.12.4`, and `stripe@22.5.0` are hosted Edge Function-only.
- The published Cumpa package remains outside the hosted dependency and credential boundary required by D-03 and PAY-04.
- The `@supabase/ssr@0.12.4` empty-maintainers caveat is accepted only because the exact official repository, integrity, signatures, version, and no-install-hook evidence matched and the user explicitly approved it.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - this provenance gate made no external configuration change.

## Next Phase Readiness

- Plans 02-02 and 02-03 may rely on these four exact approvals only within their stated hosted/tooling boundaries.
- Any provenance mismatch or attempt to place an approved dependency outside its restricted location blocks dependent work.

---
*Phase: 02-move-the-implementation-to-supabase*
*Completed: 2026-08-15*
