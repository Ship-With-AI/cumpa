---
phase: quick
plan: 260916-ide
subsystem: distribution
tags: [npm, release, provenance, supabase, stripe]
requires:
  - phase: quick
    provides: manifest-derived release identity and the widened repository gate
provides:
  - Deployed coupon/promotion-code support to the hosted Supabase authority
  - Published @shipwithai/cumpa@1.6.1 as latest with verified provenance
affects: [distribution, hosted support authority]
tech-stack:
  added: []
  patterns: [verify a release payload by full tarball tree diff, never run consumer npx checks from the package checkout]
key-files:
  created: []
  modified: [package.json, package-lock.json]
key-decisions:
  - "Published 1.6.1 even though its payload is byte-identical to 1.6.0 apart from the version string, so the registry version marks the commit that carried the coupon server change."
  - "Approved the npm-release gate through the pending_deployments API rather than the GitHub UI, per the 260914-hmu lesson that a UI click is not evidence of approval."
requirements-completed: []
duration: 1h
completed: 2026-09-16
status: complete
---

# Quick Task 260916-ide — Release 1.6.1

**Date:** 2026-09-16
**Outcome:** Coupon/promotion-code support deployed to hosted production, and
`@shipwithai/cumpa@1.6.1` published to the public npm registry as `latest` with
verified provenance.

## What actually shipped where

The payload of quick task `260916-h7p` (coupon codes) lives entirely in
`supabase/functions/**`, which is not part of the npm `files` list. So the two
halves of this release landed through different channels:

- **Hosted (the functional change).** The push to `main` triggered
  `Deploy Supabase production` run `35087364994`; both `repository-gates` and
  `deploy-production` passed. `support-flow` now sets `allow_promotion_codes: true`
  and `stripe-webhook`'s fulfillment invariant now pins `amount_subtotal` instead
  of the charged `amount_total`. Every existing installation — including 1.6.0 —
  gained coupon support at that moment, with no client update required.
- **npm (version metadata only).** A full tarball tree diff of published 1.6.0
  against the 1.6.1 candidate found exactly one differing file:

  ```
  Files b/package/package.json and a/package/package.json differ
  <  "version": "1.6.0",
  >  "version": "1.6.1",
  ```

  No `dist/` byte changed. The operator was shown this evidence before the
  irreversible publish and elected to publish anyway so the registry version
  marks the commit carrying the server change.

## The bump was three lines

`scripts/release-identity.mjs` still derives every identity value from the
manifest, so the release commit touched only:

```
 package-lock.json | 4 ++--
 package.json      | 2 +-
```

No test needed editing. The candidate build went green on the first attempt.

## Published identity

| Fact | Value |
|---|---|
| Version | `1.6.1` (`latest`) |
| Archive | `shipwithai-cumpa-1.6.1.tgz`, 3514753 bytes |
| sha256 | `97b29e12b396adf1a8a442784b0b687784d0c11f58887815304bf77c0295c41d` |
| sha512 (hex) | `136072ea3c5226c552e4fd11feffc7079ff93e982fb2d4346067d7a7210f5899f7a28a7305b51708f339a3429b75c6fd2b3ac4efcb8933f4d759ae51c2e17379` |
| shasum (sha1) | `c9ccc8a27fde4c05a90717668d7834bab58fbc4e` |
| integrity | `sha512-E2By6jxSJsVS5P0R/v/HB5/5PpgvstQ0YGfXpyEPWJn3oopzBbUXCPM5o0Kbdcb9KzrE78uJM/TXWa5RwuFzeQ==` |
| unpackedSize | 14743223 |
| Evidence seal | `43faf01152757682dff4f180983d445f8a92d3bfab7942d102285a66b3f5774c`, `status: verified` |
| Source commit | `2d3d71eed7cda0a0d419ce4185894eb2ec68a8fd` |
| Run / attempt | `35088078847` / 1 |
| Artifact id | `10442473998`, transport digest `sha256:0a4ee1a88221dbd5be8238a722d89a3c81822243c6cf518c43896f447780cede` |

The registry tarball is **byte-identical** to the approved candidate: `cmp`
reports no difference, and the registry's own `shasum` and `integrity` match
hashes computed locally from the downloaded artifact before publication.

## Verification

- **Preflight (local, pre-bump):** 66 files / 552 Vitest tests, 19 deno tests,
  `tsc --noEmit -p tsconfig.json`, `typecheck:tests`, and `typecheck:web` all clean.
- **CI gates (post-push):** the deploy workflow re-ran the full suite plus
  Playwright, `supabase test db`, `migration list`, and `db lint` — all green.
- **Candidate inspection:** all 13 producer steps succeeded; sealed evidence
  `status: verified`, archive identity recomputed locally and matched.
- **Provenance:** `npm audit signatures --json --include-attestations` in a fresh
  isolated tree under npm 11.19.1 reported **0 invalid, 0 missing**, with both the
  npm publish attestation (`.../specs/publish/v0.1`) and SLSA provenance
  (`https://slsa.dev/provenance/v1`).
- **Provenance binding:** subject `pkg:npm/%40shipwithai/cumpa@1.6.1` with sha512
  `136072ea…7379` (exactly the published bytes), workflow
  `.github/workflows/publish-npm.yml` on `refs/heads/main`, resolved dependency
  `gitCommit 2d3d71eed7cda0a0d419ce4185894eb2ec68a8fd`, builder
  `github-hosted`, invocation `runs/35088078847/attempts/1`, event
  `workflow_dispatch`.
- **Consumers:** isolated global install reports `1.6.1`; literal
  `npx --yes @shipwithai/cumpa@1.6.1 --version` reports `1.6.1`.

`npm publish` again returned success while the registry still served 1.6.0. Per
`docs/distribution-operations.md:93` this triggered read-only reconciliation only
— no retry, rebuild, rerun, or substitution — and 1.6.1 appeared roughly two
minutes later with the expected digests.

## Two traps worth remembering

1. **Run consumer `npx` checks from a scratch cwd.** The first
   `npx --yes @shipwithai/cumpa@1.6.1 --version` printed `1.6.0`. It had run with
   the repository as cwd, so npx resolved the checkout's `dist/` — which had been
   built *before* the version bump — instead of the registry package. From an
   empty temporary directory the same command reports `1.6.1`. The distribution
   runbook's "no fallback to a checkout dist" rule is not theoretical.
2. **The UI-approval anomaly did not recur,** but the API path was used anyway:
   `POST actions/runs/35088078847/pending_deployments` with `state=approved` and a
   comment naming the archive digest, followed by confirming
   `pending_deployments` was empty before treating the gate as passed.

## Cleanup

Both temporary transports were removed and their absence confirmed against the
server (zero `CUMPA_*` secrets and variables remain in the `production`
environment): the `CUMPA_RELEASE_BUILD_ORIGIN` secret and the
`CUMPA_RELEASE_SOURCE_SHA` variable.

The build origin was derived in process memory from the existing public
`SUPABASE_PROJECT_REF` production variable, verified only by comparing its
SHA-256 against the recorded `configuredOriginSha256`
(`89485617…6cdf`, exact match), piped to `gh secret set` via stdin, and never
printed in cleartext.

All inspection scratch directories (downloaded candidate, audit tree, consumer
install roots) were deleted and their absence confirmed.

## Open items

- Coupon redemption is not yet possible end to end: no Stripe Dashboard coupon or
  promotion code exists. `docs/support-service-operations.md` documents the
  creation steps and the two hard constraints (the Price must stay at exactly USD
  4999; never issue a 100%-off code, which would charge nothing and never fulfil).
- `SKILL.md` still installs `@1.5.0`; its checker accepts `>=1.5.0 <2.0.0`, so
  1.6.1 is compatible, but correcting the marketplace skill needs a separate
  publication authority.
- Restore still ignores an RPC transport error and renders the completion page
  (`260913-apr-SUMMARY.md`).
- `.vue` files remain outside `tsc`; `vue-tsc` would close that gap.
- ACC-04 verified row remains blocked (`live-entitlement-unavailable`).

## Commits

`2d3d71e` release bump — pushed with `7fc8765`, `d470296`, `8d47c62` from quick
task `260916-h7p`.
