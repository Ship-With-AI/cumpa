---
phase: 15-adversarial-integration-gate
audit: security
asvs_level: not-declared
blocking_threshold: open
status: secured
threats_total: 6
threats_mitigated: 5
threats_accepted: 1
threats_open: 0
unregistered_flags: 0
audited: 2026-08-06
---

# Phase 15 Security Audit

## Executive Summary

**SECURED.** T-15-03 is closed after re-auditing current scope-validation ordering. A malformed attached scope cannot reach a draft, export, recovery, or export-reveal path: every such path validates the value before using it as a filesystem path component. The range registry now validates even when a caller injects a draft store, closing the former bypass.

The phase summary has no `## Threat Flags` section, so it declares no executor-detected attack-surface flags. This re-audit ran no commands: the assignment supplied the already-run Phase 15 evidence (final build passed; focused Vitest 74/74; packaged Chromium 4/4; package-contract 12/12) and prohibited extra test commands.

## Scope Method

The plan has no `<config>` block declaring an ASVS level; it maps this register to ASVS V3–V6. This audit inspected current implementation and the malformed-scope regression, treating mitigation as absent until its validation call and path ordering were directly established.

## Threat Verification

| Threat ID | Category | Disposition | Status | Direct evidence |
|---|---|---|---|---|
| T-15-01 | Tampering / Information Disclosure — cross-attached draft/export storage collision | mitigate | CLOSED | `src/cli/run.ts:435-443` creates one `agent-${randomBytes(16).toString('hex')}` scope in the shared attached launcher; both range and exact-patch paths route through it (`:480-502`, `:543-557`). `src/server/capabilities.ts:268-291,617-636` passes that one validated value into the range and exact-patch draft stores; `src/server/export-store.ts:223-239` publishes using the validated stable name. |
| T-15-02 | Tampering / Repudiation — canonical provenance drift | mitigate | CLOSED | `src/server/draft-loader.ts:101-108` uses an attached scope only as mutable draft key, leaving deterministic comparison/range keys intact. Range export retains `range.reviewKey` as its source identity in `src/server/capabilities.ts:553-566`; exact-patch retains `patch.reviewKey` in `:801-807`. `src/server/export-store.ts:259-264` rejects an export whose canonical document does not match that source identity. |
| T-15-03 | Elevation of Privilege / Tampering — interactive namespace takeover or path traversal | mitigate | CLOSED | Grammar is enforced by `assertAttachedStorageScope()` (`src/server/draft-loader.ts:17-22`). Draft construction validates before either `join()` in `draftPaths()` (`:101-108`), and `createDraftStore()` reaches that function before any draft I/O (`src/server/draft-store.ts:147-164`; `src/server/draft-loader.ts:162-169`). The range registry validates before constructing/using a draft store and before its export-reveal closure can join a path (`src/server/capabilities.ts:268-291,447-454`); the exact-patch registry does the same (`:617-636,769-777`). Export publication and recovery reject an invalid scope in `stableNameFor()` before `resolve()`, managed-root access, or `join()` (`src/server/export-store.ts:123-132,223-239,332-342`). `tests/api/attached-completion.test.ts:141-160` injects a prebuilt draft store plus `../controlled` and asserts `createSessionApp()` throws `Attached storage scope is invalid.`, proving registry validation cannot be bypassed by draft-store injection. |
| T-15-04 | Denial of Service / Tampering — cross-coordinator settlement, signal, or shutdown | mitigate | CLOSED | Each launch owns a coordinator and shutdown controller (`src/cli/run.ts:417-432`); its close callback references only that invocation's `app` (`:425-427`). Coordinator state, in-flight work, terminal result, and delivery promises are instance fields (`src/server/attached-completion.ts:11-28,52-90`). Shutdown removes only its own listener functions and invokes only supplied launch-local callbacks (`src/server/lifecycle.ts:42-76,95-103`). |
| T-15-05 | Tampering / Repudiation — duplicate or partial stdout accepted as success | mitigate | CLOSED | `AttachedCompletionCoordinator.runDelivery()` rejects terminal/completed delivery and the `finish()` method shares the one in-flight attempt (`src/server/attached-completion.ts:40-43,52-90`). The launcher writes through that coordinator, accepts only `completed`, awaits response settlement, and otherwise exits through failure shutdown (`src/cli/run.ts:440-442,466-476`). |
| T-15-SC | Tampering — supply chain | accept | CLOSED | Accepted risk is recorded below, matching `15-01-PLAN.md:317`: Phase 15 added no dependency or package installation and reuses existing runtime and test tooling. |

## T-15-03 Path-Ordering Result

| Filesystem path | Validation before path construction | Result |
|---|---|---|
| Draft canonical path and temporary draft path | `draftPaths()` validates `storageScope` before deriving `key`, `canonicalPath`, or `createDraftStore()` temporary filename. | CLOSED |
| Range export publication and recovery | `stableNameFor()` validates before publication calls `resolve()`/managed-root setup/`join()`, and before recovery opens the managed root or joins. | CLOSED |
| Range export reveal | The registry validates `attachedCompletion.storageScope` at construction; the closure later joins only that validated local `storageScope`. | CLOSED |
| Exact-patch draft, export publication/recovery, and export reveal | The exact-patch registry validates at construction before draft-store creation; publication/recovery revalidate in `stableNameFor()`; reveal joins only the validated local. | CLOSED |

## Unregistered Flags

None. `15-01-SUMMARY.md` contains no `## Threat Flags` section.

## Accepted Risks Log

| Threat ID | Risk | Acceptance basis |
|---|---|---|
| T-15-SC | Supply-chain exposure from existing dependencies and tooling | Accepted as LOW for this phase because no package installation, dependency manifest, or lockfile change was made; the plan explicitly records this disposition at `15-01-PLAN.md:317`. |
