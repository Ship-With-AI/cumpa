---
phase: 02-anchored-diff-review
plan: 02
subsystem: closed-frozen-content-and-anchors
tags: [fastify, zod, git, sha256, durable-anchors, tdd]
status: complete

requires:
  - phase: 02-anchored-diff-review
    plan: 01
    provides: authenticated launch-scoped opaque file capabilities and stable model-line identity
provides:
  - Authenticated opaque-capability access to exact frozen base and head text DTOs
  - Server-derived durable side-specific anchors with bounded context and framed SHA-256 identity
  - Exact verified, stale, and orphaned anchor classification without relocation
affects: [02-03-draft-persistence, 02-04-workspace-state, 02-06-comment-ui, 02-07-browser-flow]

tech-stack:
  added: []
  patterns:
    - Strict Zod transport and persisted-record schemas remain distinct.
    - A frozen capability registry resolves file IDs to side-specific Git facts; clients cannot select Git objects or paths.
    - SHA-256 inputs use domain-separated unsigned-64-bit length frames over lossless path bytes and immutable anchor facts.

key-files:
  created:
    - src/contracts/draft.ts
    - tests/unit/anchor.test.ts
    - tests/git/anchored-content.test.ts
    - tests/api/anchor.test.ts
  modified:
    - src/contracts/api.ts
    - src/domain/anchor.ts
    - src/server/capabilities.ts
    - src/server/routes.ts

key-decisions:
  - Derive every persisted anchor fact from the requested opaque file ID, side, and line after the inherited session guard; never accept path, blob, context, or repository authority from the browser.
  - Include lossless path bytes, side, blob OID, line, and numbered context in domain-separated, unsigned-64-bit-length-framed SHA-256 values.
  - Treat unavailable current content as orphaned and every exact mismatch as stale; verification neither searches for nor rewrites anchors.

metrics:
  duration: 8 min
  completed_date: 2026-07-21
  tasks_completed: 3
  files_modified: 8
---

# Phase 02 Plan 02: Closed Frozen Content and Anchors Summary

Implemented the closed Fastify boundary that retrieves only capability-authorized frozen side content and derives deterministic, side-specific durable anchors entirely on the server.

## Task Completion

| Task | Outcome | Commit |
| --- | --- | --- |
| 1. RED — specify side-canonical anchor construction and verification | Preserved the interrupted focused RED contract covering unit framing/verification, real Git rename-side content, and closed API behavior. | `9c37bfb` |
| 2. GREEN — derive exact anchors behind the inherited closed capability | Added strict schemas, frozen content reading, route derivation, exact verification, and API assertions. | `529f059` |
| 3. REFACTOR — consolidate canonical framing without changing authority | Reviewed the GREEN implementation; canonical framing, side selection, extraction, and verification were already consolidated, so no behavior-free source edit or refactor commit was warranted. | — |

## Reconciled Implementation

- `src/server/app.ts` retains Phase 1 registration order: `registerSessionSecurity` is installed before `registerSessionRoutes`.
- `src/server/capabilities.ts` extends the existing registry rather than creating a second authority: opaque file IDs map only to frozen changed-file records and the bounded object reader.
- `GET /api/files/:fileId/content` returns base/head existence, safe path DTO, language, blob OID, and text only after the inherited guard and capability lookup.
- `POST /api/draft/comments` accepts exactly `fileId`, `side`, positive `line`, and a trimmed 1–100,000-character `body`; it derives all anchor fields from frozen content. The injected mutation port remains intentionally limited to the Plan 03 persistence seam.
- `src/contracts/draft.ts` validates persisted durable anchors and non-mutating presentation verification separately from API input.

## Anchor Contract

- **Side/path/blob fixtures:** the disposable Git fixture renames `old-name.ts` to `new-name.ts`, proving base resolves the old path/blob and head resolves the new path/blob after refs and the working tree move. It also covers added, deleted, and modified side existence.
- **Context:** the exact selected model line excludes its terminator; up to three existing numbered lines before and after are retained. Unit cases cover first, last, only, empty, blank, Unicode, LF, CRLF, and no-final-newline content.
- **Framing:** `durable-anchor-v1` uses `sha256-v1`; each domain-separated hash prefixes each immutable byte field with its unsigned 64-bit big-endian byte length. Path bytes remain base64url-decoded lossless bytes and Git OIDs remain opaque 40- or 64-hex identifiers.
- **Identity and verification:** uniqueness is exact path bytes + side + blob OID + line. Verification returns only `verified`/`exact-match`, `stale`/`anchor-mismatch`, or `orphaned`/`anchor-unavailable`; it preserves the recorded anchor and performs no search or relocation.

## TDD Gate Compliance

| Gate | Command | Evidence |
| --- | --- | --- |
| RED | `npm run test:unit -- tests/unit/anchor.test.ts` | Required behavioral RED is recorded by preserved commit `9c37bfb`; its prior execution output was unavailable in the interrupted checkout and was not re-run against GREEN code. |
| RED | `npm run test:git -- tests/git/anchored-content.test.ts` | Required behavioral RED is recorded by preserved commit `9c37bfb`; not re-run against GREEN code. |
| RED | `npm run test:api -- tests/api/anchor.test.ts` | Required behavioral RED is recorded by preserved commit `9c37bfb`; not re-run against GREEN code. |
| GREEN | `npm run test:unit -- tests/unit/anchor.test.ts` | Passed: 4 files, 38 tests. |
| GREEN | `npm run test:git -- tests/git/anchored-content.test.ts` | Passed: 6 files, 28 tests. |
| GREEN | `npm run test:api -- tests/api/anchor.test.ts` | Passed: 3 files, 34 tests. |
| REFACTOR | Same three focused commands unchanged | All passed after the no-change refactor review. |

`git log` confirms `9c37bfb` precedes `529f059`; no optional refactor commit is required because Task 3 introduced no source change.

## Verification Matrix

| Contract | Evidence | Result |
| --- | --- | --- |
| Model-line extraction, context boundaries, framing, uniqueness, exact states | `npm run test:unit -- tests/unit/anchor.test.ts` | PASS |
| Frozen old/base and new/head path/blob authority through a moved real-Git fixture | `npm run test:git -- tests/git/anchored-content.test.ts` | PASS |
| Authenticated closed content and anchor routes, strict inputs, generic denial before lookup | `npm run test:api -- tests/api/anchor.test.ts` | PASS |

No formatter, linter, aggregate suite, browser matrix, or project-wide test command was run.

## Closed-Authority Evidence

The Fastify security guard authenticates token, Host, and Origin before route work. Routes reject unknown query fields and strict-schema failures without exposing attempted values. A valid request selects only an opaque `fileId`; the registry supplies frozen side path, blob, and object bytes, rejects unsupported/missing content, and the anchor builder derives selected text, context, hashes, and unique key server-side. Tests assert unauthorized input does not invoke capability lookup and that smuggled repository/ref/commit/blob/path/context/draft fields receive generic denials.

## Deviations from Plan

None - plan executed exactly as written. The interrupted RED commit and uncommitted GREEN implementation were reconciled and resumed without duplication.

## Issues Encountered

None.

## Next Phase Readiness

Plan 02-03 can consume the `onAnchorAdd` port and validated `DurableAnchorV1` output to persist canonical records. Later UI plans can use `/api/files/:fileId/content` while retaining opaque launch-scoped capability authority.

## Self-Check: PASSED

- All eight declared implementation/test artifacts and this summary exist.
- RED commit `9c37bfb` and GREEN commit `529f059` exist in order.
- All three focused GREEN commands passed unchanged after the refactor review.
- No created source is a stub; no unplanned trust-boundary surface was introduced.
