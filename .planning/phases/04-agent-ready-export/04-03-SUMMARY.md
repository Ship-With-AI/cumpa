---
phase: 04-agent-ready-export
plan: 03
subsystem: api
tags: [fastify, zod, native-napi, atomic-publication, export]
requires:
  - phase: 04-agent-ready-export/04-02
    provides: canonical ReviewExportV1 bytes and Markdown projection
provides:
  - Strict secured export and fixed export-directory reveal capabilities
  - Validated two-file candidate publication with first-export rename and typed re-export refusal
  - Narrow Darwin native directory-exchange adapter and target-evidence boundary
  - Final reread SHA-256 receipt algebra
affects: [04-04, export, release-verification]
tech-stack:
  added: []
  patterns: [server-held export authority, canonical JSON to Markdown projection, candidate-only publication]
key-files:
  created: [src/native/directory-exchange.cc, binding.gyp, src/server/export-store.ts]
  modified: [src/contracts/api.ts, src/server/routes.ts, src/server/capabilities.ts, tests/api/export.test.ts, tests/api/export-publication.test.ts, tests/unit/directory-exchange.test.ts, tests/e2e/anchored-review.spec.ts]
key-decisions:
  - "No declared packaged target means re-export remains typed reExportUnsupported; a local Darwin primitive observation does not promote a runtime target."
  - "The server derives export directory identity only from pinned full launch OIDs and validates JSON/Markdown as one canonical pair before publishing."
patterns-established:
  - "Export route: strict request algebra plus existing token/Host/Origin guard before capability work."
  - "Publication: candidate validation, snapshot revalidation, one absent-path rename, otherwise native-swap-only or refusal."
requirements-completed: [EXP-01, EXP-05, EXP-06, EXP-08]
duration: execution session
completed: 2026-07-23
status: complete
---

# Phase 04 Plan 03: Agent-Ready Export Summary

**Secured accepted-draft export now produces a canonical JSON/derived-Markdown pair with bounded final receipts, while existing publication is refused unless a declared target has independently earned native-exchange capability.**

## Performance

- **Duration:** execution session
- **Completed:** 2026-07-23T13:36:29Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added the narrow N-API directory exchange adapter with Darwin `renameatx_np(..., RENAME_SWAP)` support, fixed sibling identities, no-follow/type checks, and explicit unsupported output outside supported primitives.
- Added strict export/reveal API algebra, fixed server-derived export directory authority, revision/drift snapshot checks, opaque session-bound drift acknowledgement, and zero-authority reveal input.
- Added restrictive candidate publication, canonical JSON parsing and Markdown re-projection, absent-path atomic rename, typed refusal for unsupported re-export, final exact-byte reread, and SHA-256 receipt evidence.

## Target Matrix

The reconciled `publicationPolicy.targets` list contains **zero declared packaged targets**. Therefore no packaged runtime is promoted to `observedNativeExchange` and every existing-stable re-export resolves to `reExportUnsupported` before stable rename, deletion, exchange, metadata, or content mutation.

| Declared target | Packaged compile/link | Exact primitive | Executable runner | Continuous old-or-new probe | Disposition |
|---|---|---|---|---|---|
| None (0 declared) | Not applicable | Not applicable | Not applicable | Vacuous: no target runner declared | `reExportUnsupported` |

A local Darwin/arm64 native unit probe compiled the project-owned C++ adapter and observed the one-call swap of complete sibling directories; it is deliberately **not** target capability evidence because it was not a declared packaged target runner.

## API and Snapshot/Drift Matrix

| Request/state | Result | Authority/callback evidence |
|---|---|---|
| Wrong bearer token, Host, or Origin | Existing security guard rejects | Reveal adapter not invoked |
| Wrong reveal method, body, or query | 400/404 | Reveal adapter not invoked |
| Export unknown `content` field | 400 | No draft, Git, serializer, or filesystem authority from request |
| Export request body | Only `expectedRevision` and optional opaque acknowledgement token accepted | Strict Zod object |
| Current accepted revision, unchanged retained selectors | 201 `exported` | End-to-end API test created a comment, exported revision 1, and received only bounded relative receipt paths |
| Draft revision changed | `revisionConflict` | No candidate publication |
| Moved/unavailable drift without current token | `driftAcknowledgementRequired` | Fresh random session token bound to drift observation fingerprint |
| Changed drift after token issue | `driftAcknowledgementStale` | Old acknowledgement cannot validate a new observation |

## D-03 Publication/Fault Matrix

| Stable state / capability | Operation | Verified outcome |
|---|---|---|
| Absent / any capability | Validate candidate, revalidate snapshot, one rename | First export succeeds only with exactly `review.json` and `review.md`; receipt comes from final reread |
| Present / `reExportUnsupported` | Refuse before stable mutation | `reExportUnsupported`; exact old pair remains readable |
| Present / observed native exchange | One native exchange only | Code path exists but is unreachable on this zero-target ledger; no portable fallback is present |
| Invalid candidate | Refuse before stable publication | `publicationFailed`; invalid canonical JSON cannot become stable |

No declared packaged runner exists for an interruption reader probe. The target-specific continuous observation requirement is therefore not promoted or claimed; zero-target policy remains refusal-first.

## Receipt Evidence

`publishReviewExport` requires a real non-symlink directory containing exactly the two regular names, rereads both candidate files, parses canonical JSON, re-renders Markdown byte-for-byte, syncs the candidate, revalidates the accepted snapshot, then rereads the final stable pair and returns only relative path, SHA-256, and byte length for `review.json` and `review.md`.

## Task Commits

1. **Task 1: Build the narrow adapter and execute the declared packaged-target exchange matrix**
   - `a9dfdc0` — RED native probe
   - `093d4de` — native adapter implementation
2. **Task 2: Add secured accepted-snapshot export and fixed export-directory reveal routes**
   - `897608f` — RED secured route tests
   - `6cb979e` — secured authority and reveal implementation
3. **Task 3: Publish the validated pair with atomic re-export or refusal fallback**
   - `e5e46b1` — RED publication tests
   - `f8bee5f` — publication state machine
   - `09d478a` — RED canonical-candidate rejection test
   - `b6796f1` — canonical candidate validation
   - `32b6371` — end-to-end secured export coverage

## Files Created/Modified

- `src/native/directory-exchange.cc` — narrow N-API fixed-identity directory exchange.
- `binding.gyp` — project-owned native adapter build declaration.
- `src/server/export-store.ts` — candidate validation, publication, refusal, recovery, receipt.
- `src/contracts/api.ts` — strict export request/result and reveal result algebra.
- `src/server/routes.ts` — secured export and fixed reveal endpoints.
- `src/server/capabilities.ts` — server-authoritative accepted snapshot, drift token, and export orchestration.
- `tests/api/export.test.ts` — zero-invocation denials, fixed reveal, and end-to-end export coverage.
- `tests/api/export-publication.test.ts` — first export, invalid-candidate refusal, and stable-preserving unsupported re-export.
- `tests/unit/directory-exchange.test.ts` — local native primitive probe in the ledger-selected unit runner.

## Decisions Made

- Keep re-export denied unless the ledger declares and independently observes a packaged target; native source presence alone never grants runtime authority.
- Treat the canonical JSON bytes as the only export model and require the Markdown bytes to be its exact renderer output.
- Reuse the existing reveal adapter through one fixed active-comparison capability; no generic path endpoint was introduced.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Correctness] Candidate validation originally proved only reread byte equality.**
- **Found during:** Task 3
- **Issue:** Arbitrary JSON/Markdown bytes could have been published as a pair without canonical schema parsing and Markdown projection.
- **Fix:** Added failing invalid-candidate coverage, canonical parse, and exact renderer comparison before publication.
- **Files modified:** `src/server/export-store.ts`, `src/server/capabilities.ts`, `tests/api/export-publication.test.ts`
- **Verification:** The focused publication runner failed in RED and passed 13 files / 82 tests in GREEN.
- **Committed in:** `09d478a`, `b6796f1`

**2. [Rule 1 - Correctness] Export orchestration passed a parsed document to a byte-oriented Markdown renderer.**
- **Found during:** Task 3 end-to-end coverage
- **Issue:** A successful route could not produce the canonical Markdown projection.
- **Fix:** Passed canonical JSON bytes directly and added a real secured accepted-revision export test.
- **Files modified:** `src/server/capabilities.ts`, `tests/api/export.test.ts`
- **Verification:** Focused API runner passed 13 files / 83 tests.
- **Committed in:** `b6796f1`, `32b6371`

**3. [Post-wave integration - Deterministic acceptance] Monaco virtualized unchanged context hid the requested side line before the helper could activate it.**
- **Found during:** Post-wave full package gate
- **Issue:** Monaco can retain an attached but zero-height virtual line while it rebuilds; the prior helper navigated speculative diff controls rather than focusing the requested side and targeting its line directly.
- **Fix:** Reused the established packaged acceptance pattern: focus the requested original/modified editor surface, invoke Monaco’s public Go to Line command (`Meta+g`), enter the requested line number, then select the rendered matching row.
- **Files modified:** `tests/e2e/anchored-review.spec.ts`, `04-03-SUMMARY.md`
- **Verification:** Chromium anchored-review acceptance passed 6/6 with `--repeat-each=3`; `agent-ready-export-safety.spec.ts` followed by anchored-review passed 3/3 in the full-suite ordering.
- **Committed in:** post-wave focused integration commit

**4. [Rule 1 - Security] Managed export parent symlinks could escape repository-local authority.**
- **Found during:** Post-wave CR-01 code-review remediation.
- **Issue:** Lexical `resolve()` containment did not prevent publication, recovery, cleanup, or fixed reveal from following repository-controlled `.diff-review` or `exports` symlinks.
- **Fix:** Added `ensureManagedExportsRoot()` no-follow `lstat` validation for each literal managed parent, rejected symlink/non-directory components, used it before publication, recovery, and reveal, and revalidated it before cleanup.
- **Files modified:** `src/server/export-store.ts`, `src/server/capabilities.ts`, `tests/api/export-publication.test.ts`, `tests/api/export.test.ts`, `tests/package/agent-ready-export-safety.test.ts`, `04-REVIEW.md`, `04-03-SUMMARY.md`.
- **Verification:** RED source API tests failed 4/4 and compiled-package safety tests failed 2/2 before enforcement. GREEN focused API tests passed 11/11; after `npm run build`, package safety passed 8/8.
- **Committed in:** `65effe4`, `7875e35`, `b3df9a3`.

**5. [Rule 1 - Correctness] Receipt parsing allowed positional JSON/Markdown labels to diverge from the receipt paths.**
- **Found during:** Post-wave WR-03 code-review remediation.
- **Issue:** Two individually valid receipt records could be reversed, duplicated, or drawn from different comparison OID directories, while the UI rendered them positionally.
- **Fix:** Added distinct ordered `review.json`/`review.md` Zod schemas and a common comparison-directory refinement at the API boundary; browser client continues positional rendering only after parsing that invariant.
- **Files modified:** `src/contracts/api.ts`, `tests/api/export.test.ts`, `tests/integration/agent-ready-export-states.spec.ts`, `04-REVIEW.md`, `04-03-SUMMARY.md`.
- **Verification:** RED API receipt contract and browser-client tests accepted malformed pairs before enforcement. GREEN API contract passed 7/7, browser-client integration passed 4/4, and `npm run build` passed.
- **Committed in:** `df767bc`, `9a2d18b`.

---

**Total deviations:** 5 auto-fixed correctness/security/integration issues.
**Impact on plan:** The acceptance helper remains behaviorally strict and deterministic; no timeout increase, hidden-region disablement, sleep, or assertion weakening was introduced.

## Issues Encountered

- The reconciliation validator was run and passed before edits as required. Later source changes intentionally invalidate its source-hash snapshot, so subsequent plan-focused API/publication runs invoked the ledger-resolved runner directly rather than claiming a post-edit validator pass.
- The reconciled native command executes the unit runner, so the native probe resides in `tests/unit/` rather than the plan's illustrative `tests/native/` path.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 04-04 can consume the strict export algebra, fixed reveal capability, canonical pair publisher, and zero-target refusal boundary.
- A future ledger update that declares a packaged target must add that target's actual packaged compile/link, primitive, and continuous reader observation before enabling native re-export.

## Self-Check: PASSED

---
*Phase: 04-agent-ready-export*
*Completed: 2026-07-23*
