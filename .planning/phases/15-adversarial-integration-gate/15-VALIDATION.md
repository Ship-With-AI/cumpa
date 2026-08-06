---
phase: 15
slug: adversarial-integration-gate
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-06
---

# Phase 15 — Validation Strategy

> Per-phase executable validation contract for request-scoped attached-review isolation.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0; Playwright 1.61.1 for the packaged browser path |
| **Config file** | `vitest.config.ts`; `playwright.config.ts` |
| **Quick run command** | `./node_modules/.bin/vitest run --no-file-parallelism tests/api/draft.test.ts tests/api/exact-patch.test.ts tests/api/export-publication.test.ts tests/api/attached-completion.test.ts tests/api/attached-completion-coordinator.test.ts tests/cli/request.test.ts` |
| **Full phase evidence command** | `npm run test:package -- tests/e2e/agent-ready-export.spec.ts && npm run test:package-contract` |
| **Estimated runtime** | Focused tests under 60 seconds; packaged browser evidence bounded by the existing Playwright timeout |

---

## Sampling Rate

- **After task commit:** Run the smallest focused command named by that task; no watch mode.
- **After plan wave:** Run the focused Vitest command above.
- **Before `/gsd:verify-work`:** Run packaged browser evidence and package-contract after focused evidence is green.
- **Max feedback latency:** 60 seconds for focused API/CLI checks.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | HAND-06; criterion 1 | T-15-01 cross-attached storage collision; T-15-02 provenance drift | Equivalent attached range and exact-patch requests retain equal deterministic provenance while using distinct trusted attached storage scopes for drafts and exports. | API integration | `./node_modules/.bin/vitest run --no-file-parallelism tests/api/draft.test.ts tests/api/exact-patch.test.ts tests/api/export-publication.test.ts` | Yes | pending |
| 15-01-02 | 01 | 1 | HAND-06; criteria 2–3 | T-15-03 interactive namespace takeover; T-15-04 cross-coordinator settlement; T-15-05 duplicate/partial delivery | Attached storage scope is server-created, cannot select an interactive path, and one coordinator's success, failure, signal, or duplicate Finish cannot mutate or redeliver another scope. | API + CLI integration | `./node_modules/.bin/vitest run --no-file-parallelism tests/api/draft.test.ts tests/api/attached-completion.test.ts tests/api/attached-completion-coordinator.test.ts tests/cli/request.test.ts` | Yes | pending |
| 15-01-03 | 01 | 2 | HAND-06; criteria 1–3 | T-15-01 through T-15-05 | Two equivalent attached launches keep independent browser/durable/output lifecycles; failed launch emits zero success bytes; successful sibling emits exactly one canonical document with no partial or duplicate result. | Packaged CLI + Chromium E2E | `npm run test:package -- tests/e2e/agent-ready-export.spec.ts && npm run test:package-contract` | Yes | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Reuse the existing real session-app, CLI request, package build, loopback server, file-descriptor stdout, and Chromium harnesses; do not add a separate fixture framework or fake browser/server path.

---

## Manual-Only Verifications

All phase behaviors have automated verification. The packaged Chromium scenario is the production browser handoff evidence and must be observed through its existing E2E assertions, not replaced with manual inspection.

---

## Validation Sign-Off

- [x] All tasks have automated verification.
- [x] Sampling continuity: no three consecutive tasks lack automated verification.
- [x] Wave 0 has no missing infrastructure references.
- [x] No watch-mode flags.
- [x] Focused feedback latency is bounded below 60 seconds.
- [x] `nyquist_compliant: true` is set in frontmatter.

**Approval:** ready for planning 2026-08-06
