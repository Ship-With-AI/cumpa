---
phase: 04-exact-runtime-tarball
plan: 03
subsystem: testing
tags: [installed-runtime, npm-isolation, playwright, canonical-export]
requires:
  - phase: 04-exact-runtime-tarball
    plan: 02
    provides: Hash-bound non-producing archive verifier
provides:
  - Isolated scripts-disabled global installation of supplied archives
  - Installed browser review, V2/V3 Finish and neutral support acceptance
  - Dedicated no-build acceptance command and bounded hash-linked report
  - Canonical V3 delivery for added and deleted patch files
affects: [04-04, 05-trusted-publication]
tech-stack:
  added: []
  patterns: [Parent-owned scanner authority, isolated npm environment, transport denial, optional property omission]
key-files:
  created: [tests/helpers/runtime-artifact.ts, playwright.runtime-artifact.config.ts, vitest.runtime-artifact.config.ts]
  modified: [tests/e2e/package-assets.spec.ts, tests/e2e/agent-ready-export.spec.ts, tests/package/agent-ready-export.test.ts, playwright.config.ts, vitest.config.ts, package.json, src/git/exact-patch.ts, tests/api/exact-patch.test.ts, docs/distribution-operations.md]
key-decisions:
  - Parent alone receives the configured origin and owns scanner results; scenario reports cannot supply scanner authority.
  - Deny server-side fetch as well as browser egress during installed support tests.
  - Preserve npm's explicitly optional absent peers without accepting missing required nodes.
  - Omit absent patch paths at construction rather than weakening strict canonical JSON.
requirements-completed: [PKG-03, PKG-04, PKG-05, REL-03]
duration: not separately timed
completed: 2026-09-08
status: complete
---

# Phase 04 Plan 03: Accept the installed immutable runtime

**One no-build command verifies and installs a supplied archive, exercises real browser/Finish behavior, and emits bounded evidence tied to unchanged bytes.**

## Task Commits

1. Isolated installation, shared helper and asset/browser runner — `4c1699c`.
2. Installed review/support/V3 scenarios — `09c9e12`.
3. Parent-owned acceptance aggregation and dedicated Vitest runner — `0e4df81`.
4. Real V3 add/delete regression (RED) — `cd92a8c`.
5. Canonical changed-file construction fix (GREEN) — `a111260`.
6. Post-verification documentation and redundant-assertion cleanup — `f44a1cc`.

## Verification

- **Complete offline pipeline:** one fresh configured fixture build/pack followed by `npm run accept:runtime-artifact` passed. The command ran two Vitest tests, including all seven child Chromium scenarios and adversarial report-identity validation.
- The fixture archive was 3,513,742 bytes; all SHA-256/SHA-1/SHA-512 identities remained unchanged. The report observed 167 resolved dependency relationships and successful cleanup/source-control checks.
- The seven installed scenarios covered assets/version/help; review/relaunch/native re-export; unsaved composer protection; exactly one V2 Finish document; equivalent-range draft/delivery isolation; real grounded V3 patch Finish; and support unavailable/Not now followed by unrestricted Finish.
- **Native observation:** actual Darwin ARM64 second export succeeded. Other targets retain the existing fallback contract; Windows runtime execution was not available and is not claimed.
- **Source regression:** the new API test reproduced HTTP 500 `canonicalizationFailure` before the fix and passed HTTP 201/canonical V3 delivery afterward. Four related suites passed 29 tests.
- **Final checkout validation:** credential-free build passed, all 57 ordinary Vitest files / 438 tests passed, web typecheck passed, and the four acceptance-harness TypeScript files passed a strict no-emit check.
- Both migrated ordinary browser caller suites passed 10 tests. The full local-security gate passed all 12 commands, including Deno and two local database cycles (recorded in 04-02).
- Schema/UI-safety gates did not block. The TDD review query found no `type: tdd` plans and skipped; no full pre-implementation RED sequence is claimed for the parallel task implementations.

## Acceptance contract

`accept:runtime-artifact` requires the caller-held custody directory, safe archive basename, SHA-256, producer evidence, protected configured origin and a new report path. It never builds or packs. The parent invokes the scanner, strips origin/runtime overrides from Playwright, validates both fresh run-ID-bound scenario reports, rehashes the archive and records source-control preservation before atomic report creation.

Installers use fresh HOME/user config/global config/cache/prefix, explicit public npm registry and `--ignore-scripts`. `npm ls --all --long` validates exact direct versions and the resolved logical dependency tree. Empty nodes are allowed only when their parent explicitly declares that peer optional. Raw npm trees, private paths, fixtures and stdout/stderr are not stored in acceptance evidence.

The temporary Node preloader rejects non-loopback `fetch` before networking and counts denied calls; browser routing denies external requests too. It is test-only, outside the tarball, and never substitutes a successful provider or native result. Windows `.cmd` handling uses the platform shell, while guarded Node launches select the installed JavaScript entrypoint.

## Deviations and fixes

- Added one shared test helper to avoid duplicating archive/install/identity/isolation policy between the two suites.
- Used two fixed-suffix scenario files under an aggregator-owned run bridge, avoiding concurrent report mutation. Ordinary and candidate-only Playwright outputs are separate.
- Browser routing alone could not block `src/server/support-client.ts` server-side fetch. Added the controlled stdlib preloader at that real transport boundary.
- Actual npm output represents absent optional TypeScript/@types peers as empty objects. Long-tree peer metadata now distinguishes them from missing required dependencies; no versions or dependency checks were weakened.
- Configured startup invitations require the same neutral `Not now` dismissal a user performs. Patch comments use the existing postimage label rather than the ordinary head label.
- Repaired already-exited child teardown, failure-before-install cleanup, safe Git diff fixture flags, and the generated Windows command-shim path. Strict typing exposed and resolved nullable streams, union narrowing and the correct synchronous spawn options.
- **Product bug:** grounded added/deleted files had own `oldPath`/`newPath` properties with `undefined`. The in-memory snapshot reached the strict canonical encoder and failed. Conditional omission now matches the existing exact-path construction convention; canonical validation and provenance checks remain strict.
- Initial task tests were validated after parallel implementation; the discovered product regression received explicit failing-test and fixing commits.

## Final artifact boundary

The successful archive used a **synthetic origin solely as an offline test fixture**, with hosted egress denied. It is not the final release candidate, is not read-only approved custody, and has no human approval. Disposable fixture files are removed after their bounded results are recorded. The checkout is rebuilt configured-absent afterward.

Plan 04-04 remains blocked at Task 1: no approved canonical support origin was available from the protected executor environment or documented local configuration. Do not recover it from a remote provider or reuse any fixture identity. After protected input is supplied, produce one new actual configured candidate, verify/install those same bytes, make the candidate read-only, then request actual SHA-256/length/limitations approval. No source push, upload, registry mutation, publication or provenance claim occurred.

## Self-Check: PASSED

All three implementation tasks and their real installed workflow are verified and committed. Requirement IDs above describe plan coverage; phase-level acceptance remains pending Plan 04-04's real artifact and human gate.
