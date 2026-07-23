---
phase: 04-agent-ready-export
plan: 02
subsystem: export-contracts
tags: [canonical-json, markdown, zod, sha-256, tdd]

requires:
  - phase: 04-agent-ready-export
    provides: reconciled shared draft schema, exact path comparator, and focused unit command
provides:
  - strict versioned accepted-review export document composed from draft and durable-anchor schemas
  - deterministic UTF-8 canonical serialization, exact-byte reparse validation, and SHA-256 metadata
  - Markdown projection derived only from reparsed canonical bytes with a fixed applying-agent contract
affects: [04-03, 04-04, 04-05, 04-06, export-publication]

tech-stack:
  added: []
  patterns: [strict export composition, unsigned UTF-16 canonical key order, bytewise path ordering, dynamic Markdown fences]

key-files:
  created:
    - src/export/review-export.ts
    - src/export/render-review-markdown.ts
    - tests/unit/review-export.test.ts
    - tests/unit/review-markdown.test.ts
  modified:
    - src/contracts/draft.ts

key-decisions:
  - "Compose ReviewExportV1 from the reconciled draft/anchor vocabulary; the export snapshot supplies current anchor verification by stable comment ID."
  - "Use bytewise compareExactPaths and explicit base-before-head anchor ordering before RFC 8785-compatible object-key serialization."
  - "Make Markdown take canonical bytes and call parseCanonicalReviewExport before every projection."

patterns-established:
  - "Canonical JSON has no framing whitespace; Markdown is LF-only with exactly one final LF."
  - "Open verified comments are requested work, stale/orphaned open comments require reviewer attention, and resolved comments remain JSON-only history."

requirements-completed: [EXP-02, EXP-03, EXP-04, EXP-05, EXP-07]

duration: execution session
completed: 2026-07-23
status: complete
---

# Phase 04 Plan 02: Canonical Export and Markdown Projection Summary

**A strict accepted-review document now produces deterministic UTF-8 canonical bytes and a single reparse-derived Markdown instruction artifact without exposing filesystem identities or treating uncertain feedback as work.**

## Performance

- **Duration:** execution session
- **Started:** 2026-07-23
- **Completed:** 2026-07-23
- **Tasks:** 2 completed
- **Files modified:** 5

## Accomplishments

- Added `ReviewExportV1Schema`, composed from the reconciled draft, durable anchor, verification, OID, and exact-path contracts; it validates timestamps, state/timestamp relationships, relative lossless paths, lone surrogates, uniqueness, and derived counts.
- Added immutable accepted-snapshot mapping, total bytewise path/anchor ordering, recursive unsigned UTF-16 key ordering, canonical UTF-8 serialization, exact-byte reparsing, and SHA-256 byte receipts.
- Added a Markdown projector that reparses canonical bytes, dynamically fences untrusted review data, preserves all anchor facts, implements the four-row actionability table, and carries the no-guess applying-agent instructions.

## TDD Gate Compliance

- **RED:** `6e91d7b` proved `review-export.ts` was absent; `1c8b373` proved `render-review-markdown.ts` was absent.
- **GREEN:** `a78b88f` made canonical export tests pass; `b9b4698` made Markdown projection tests pass.
- **Follow-up contract hardening:** `a77eb82`, `6cd90ee`, and `e7c16e3` close strict Unicode, encoded absolute-path, and empty-summary boundary cases while the focused suite remains green.

## Task Commits

1. **Task 1: Specify and implement canonical accepted-review JSON**
   - `6e91d7b` (`test`) RED canonical export contract
   - `a78b88f` (`feat`) GREEN canonical export implementation
   - `a77eb82`, `6cd90ee`, `e7c16e3` (`fix`) required strict-boundary refinements
2. **Task 2: Derive exact agent Markdown only from reparsed canonical bytes**
   - `1c8b373` (`test`) RED Markdown projection contract
   - `b9b4698` (`feat`) GREEN canonical-byte Markdown projector

## Files Created/Modified

- `src/contracts/draft.ts` — strict composed `ReviewExportV1Schema` and named export DTO.
- `src/export/review-export.ts` — accepted snapshot mapping, order, canonicalization/reparse, and exact hashes.
- `src/export/render-review-markdown.ts` — canonical-byte-only fixed Markdown projection.
- `tests/unit/review-export.test.ts` — schema, ordering, canonical byte, timestamp, path, Unicode, and hash evidence.
- `tests/unit/review-markdown.test.ts` — actionability, hostile content, fixed instruction, and empty-artifact evidence.

## Schema and Ordering Profile

The document includes schema/kind/version, one injected export timestamp, accepted revision, launch base/head/merge-base/comparison identity, drift observation/acknowledgement, optional summary, every retained comment, verification state, full durable anchor, and derived counts. Arrays are first ordered by `compareExactPaths`, then side (`base`, `head`), line, blob OID, context hash, and stable comment ID. Object keys are serialized by unsigned UTF-16 code-unit order; arrays retain domain order; JSON has no trailing newline.

## Markdown Actionability

| Comment state | Anchor status | Markdown treatment |
| --- | --- | --- |
| open | verified | Requested work under its exact path with every anchor fact |
| open | stale | Needs reviewer attention only |
| open | orphaned | Needs reviewer attention only |
| resolved | any | Count/history pointer only; never requested work |

Empty summaries render `No summary provided`; zero-actionable and no-comment artifacts remain valid complete Markdown with one LF terminator.

## Verification

- `node .planning/phases/04-agent-ready-export/validate-reconciliation.mjs .planning/phases/04-agent-ready-export/04-01-RECONCILIATION.json` — passed before all source edits, as required by the plan's fail-closed preflight.
- `node scripts/run-focused-vitest.mjs tests/unit` — passed: 14 files, 94 tests.
- RED runs failed as required before each implementation: missing `review-export.ts`, then missing `render-review-markdown.ts`.

## Deviations from Plan

The post-edit wrapper in each task's `<verify>` repeats the 04-01 hash-bound reconciliation validator before invoking its focused command. That validator is intentionally a pre-edit drift gate and correctly rejects the now-modified reconciled owner (`src/contracts/draft.ts`) after implementation. The required pre-edit validator passed; the ledger-resolved focused command was then run directly and passed. No source, API, UI, publication, ignore, or dependency scope was added.

## Issues Encountered

None beyond the expected hash-bound preflight invalidation after changing a ledger-owned source file.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plans 04-03 onward can consume `ReviewExportV1Schema`, `buildReviewExportV1`, `canonicalizeReviewExport`, `parseCanonicalReviewExport`, `hashExportBytes`, and `renderReviewMarkdown` as the pure export boundary. Publication, server orchestration, ignore handling, routes, and UI remain untouched.

## Self-Check: PASSED

- All five plan-owned source/test artifacts exist.
- RED and GREEN commits are present in sequence.
- The focused ledger-resolved Vitest command passes all 94 tests.

---
*Phase: 04-agent-ready-export*
*Completed: 2026-07-23*
