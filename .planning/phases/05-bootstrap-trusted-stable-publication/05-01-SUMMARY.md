---
phase: 05-bootstrap-trusted-stable-publication
plan: 01
subsystem: distribution
tags: [npm, bootstrap, artifacts, vitest]
requires:
  - phase: 04-exact-runtime-tarball
    provides: Existing producer, scanner and isolated acceptance contracts
provides:
  - Closed configured bootstrap producer and verifier profile
  - Trusted profile selection throughout installed acceptance
  - Byte-preserving source and private projection regression coverage
affects: [05-03, 05-04]
tech-stack:
  added: []
  patterns: [Version-only private manifest projection, Explicit trusted runtime profile]
key-files:
  created: []
  modified:
    - scripts/pack-runtime.mjs
    - scripts/verify-production-artifacts.mjs
    - tests/helpers/runtime-artifact.ts
    - tests/package/runtime-producer.test.ts
    - tests/package/runtime-artifact-verifier.test.ts
    - tests/package/agent-ready-export.test.ts
    - tests/e2e/package-assets.spec.ts
key-decisions:
  - Stable source manifests remain at 1.5.0; only the fresh private bootstrap packing tree projects 1.5.0-bootstrap.0.
  - Profile selection is caller-controlled before evidence parsing and installation, never inferred from artifact text.
requirements-completed: []
requirements-progress: [REL-01]
completed: 2026-09-09
status: complete
---

# 05-01 — Closed bootstrap artifact profile

The existing producer, scanner and acceptance harness now support one explicit bootstrap identity without changing stable defaults or historical artifacts.

## Implementation and commits

- RED: `e7a7d40` — producer/verifier/profile boundaries and acceptance-schema cases.
- GREEN: `6e72846` — both tightly coupled plan tasks committed together so producer, scanner and acceptance callers cut over coherently.
- `--purpose bootstrap` requires configured, clean source; performs one build and one scripts-disabled pack from a new mode-0700 temporary tree containing only that build's dist, exact legal/readme files and the version-only manifest projection.
- Evidence preserves source package and lock identities and records source, projected-input and actual packed-manifest hashes. Temporary packing state is removed on success/failure and handled by registered signal cleanup.
- Only `--profile bootstrap` enables scanner bootstrap validation. Missing profile stays stable; duplicate, empty, unknown and `stable` aliases fail.
- Only `CUMPA_RUNTIME_PROFILE=bootstrap` enables bootstrap acceptance. The trusted identity reaches scanner, installed package/bin checks, both browser scenarios and report schemas. The optional internal scenario-parser profile defaults to stable.

## Observed verification

Main ran all checks; executors intentionally ran no validation commands.

- Producer/verifier focused suites: **17/17 passed**.
- Dedicated acceptance-schema selection: **2 passed, 1 real installed-acceptance scenario deliberately filtered out**.
- Strict no-emit TypeScript checking passed for the runtime artifact helper, source-control helper, acceptance aggregator and both installed browser scenarios.
- Strict checking also passed for producer/verifier boundary fixtures.
- Actual CLI smoke: unconfigured `--purpose bootstrap` rejected before emitting custody or evidence.
- Protected source manifest/lock, LICENSE/notices and historical Phase 4 archive/evidence hashes remained unchanged; temporary smoke roots were removed.

## Issues resolved

The first RED run contained a missing test-fixture initialization in the pack-failure case; the independently observed successful-cycle, verifier and acceptance-schema RED failures established the missing bootstrap behavior. Main corrected that fixture and removed an incidental inventory-order assertion before the final passing run. Pack-failure coverage now explicitly observes packing-tree removal.

## Operational boundary

This completes the local code prerequisite only. REL-01 is not marked globally complete: the actual configured bootstrap artifact, its full installed browser/native acceptance, human approval, publication and credential revocation remain 05-04 gates. No remote source/configuration/CI/npm mutation, actual operational bootstrap production, or historical artifact replacement occurred in this plan.
