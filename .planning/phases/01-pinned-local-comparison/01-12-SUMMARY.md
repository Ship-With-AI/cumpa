---
phase: 01-pinned-local-comparison
plan: 12
subsystem: ui
tags: [vue, playwright, metadata, capabilities, accessibility, clipboard, tdd]

requires:
  - phase: 01-pinned-local-comparison
    plan: 11
    provides: Immutable identity/session hierarchy and opaque-ID changed-file tree
  - phase: 01-pinned-local-comparison
    plan: 08
    provides: Strict authenticated file-metadata route scoped to launch capabilities
provides:
  - Read-only selected-file metadata pane for exact paths, statuses, line counts, modes, and availability
  - Textual reason-specific supported, unsupported, and unavailable states without editor chrome
  - Exact UTF-8 and base64url path copy actions with accessible success and failure feedback
  - Retry-safe and stale-response-safe opaque file-detail loading
  - Production-package Playwright proof for DIFF-06
'affects': [01-13, Phase 2 Monaco diff workspace, Phase 2 comment anchoring]

tech-stack:
  added: []
  patterns:
    - Opaque file capabilities are the only browser request authority for selected-file details
    - Session metadata remains visible while launch-scoped mode details load or fail
    - Request generations prevent older detail responses from replacing a newer tree selection

key-files:
  created:
    - src/web/components/FileMetadataPane.vue
    - src/web/components/InlineNotice.vue
  modified:
    - src/web/App.vue
    - src/web/components/CopyButton.vue
    - src/web/styles.css
    - tests/e2e/pinned-session.spec.ts

key-decisions:
  - "Keep safe display paths separate from exact copy payloads: UTF-8 actions copy the validated UTF-8 value, while non-UTF-8 actions copy only base64url bytes."
  - "Render status, paths, counts, and availability immediately from the validated session record; add old/new modes only after the matching opaque detail response succeeds."
  - "Use a monotonically increasing request generation plus response fileId equality so delayed or mismatched detail responses cannot replace the current selection."

patterns-established:
  - "Metadata availability: every classifier reason is visible as machine text followed immediately by its complete human explanation and recovery guidance."
  - "Retry behavior: a fixed non-leaking alert and one file-local retry retain the selected row and session metadata; retries never gain path, ref, or object authority."
  - "Copy behavior: adjacent safe/selectable values have specifically named 40px controls, preserve focus, announce Copied, reset after two seconds, and keep the value visible on denial."

requirements-completed: [DIFF-06]

duration: 14min
completed: 2026-07-20
status: complete
---

# Phase 01 Plan 12: Selected-file Metadata and Availability Summary

**The packaged Vue workspace now turns each opaque tree selection into a complete read-only metadata record with exact copy semantics, accessible reason-specific availability explanations, and retry/stale-response safety without exposing a path, ref, or object selection grammar.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-20T16:15:16Z
- **Completed:** 2026-07-20T16:29:03Z
- **Tasks:** 2
- **Files created or modified:** 6

## Accomplishments

- Composed the existing opaque-ID file tree with a selected-file `main` landmark headed exactly `File details — {safe effective path}`.
- Exposed textual status and availability plus Paths, Changes, Modes, and Availability sections from strict validated session/detail DTOs.
- Preserved exact control-safe path display while copying lossless UTF-8 values or base64url bytes according to each path side's encoding.
- Kept all binary, non-UTF-8, oversized, submodule, symlink, mode/type, and missing-object rows selectable in deterministic tree position and rendered exact machine reasons plus complete human explanations.
- Added a fixed, non-leaking, file-local retry state that retains session metadata and remains recoverable after both transient and repeated failures.
- Prevented stale responses and mismatched response capabilities from replacing the newer selected file.
- Proved the browser sends only `GET /api/files/{opaque fileId}` with no query string or request body and exposes no input/select/textarea authority.

## Task Commits

Each TDD gate was committed atomically:

1. **Task 1 — RED: specify metadata and availability behavior** — `820d2dd` (`test`)
2. **Task 2 — GREEN: render selected-file metadata and exact placeholders** — `bebe18f` (`feat`)

**Plan metadata:** This summary, state, roadmap, and requirement completion are committed together in the final `docs(01-12)` commit.

## TDD Evidence

### RED — `820d2dd`

The Plan 11 prerequisite remained green before the new contract was committed:

```text
npm run test:package -- tests/e2e/pinned-session.spec.ts --grep "identity session and empty states"
1 passed (7.0s)
```

The new exact named case rebuilt and exercised the generated npm package, launched its real loopback CLI fixture, reached the loaded browser workspace, and failed at the first missing production metadata landmark/heading:

```text
npm run test:package -- tests/e2e/pinned-session.spec.ts --grep "metadata and availability states"
Locator: getByRole('main', { name: 'File details' }).getByRole('heading', { level: 2 })
Expected: "File details — src/new\\nname.ts"
Error: element(s) not found
1 failed
```

The failure was behavioral: production packaging, CLI launch, fragment-token authentication, strict session validation, loading transition, and the changed-file tree had already succeeded. No production source changed before commit `820d2dd`.

### GREEN — `bebe18f`

The exact named metadata case passed against rebuilt and packed production assets:

```text
npm run test:package -- tests/e2e/pinned-session.spec.ts --grep "metadata and availability states"
1 passed (2.6s)
```

The exact Plan 11 identity/session prerequisite also passed after the shared copy component change:

```text
npm run test:package -- tests/e2e/pinned-session.spec.ts --grep "identity session and empty states"
1 passed (5.6s)
```

Only these two named packaged Chromium cases ran. No formatter, linter, unit suite, API suite, unrelated Playwright file, full Playwright suite, or project-wide suite ran.

Git history proves the required TDD gate order:

```text
bebe18f feat(01-12): render selected-file metadata and availability
820d2dd test(01-12): specify metadata and availability states
```

## Metadata Field Contract

| Field | Browser presentation | Authority/copy behavior |
|---|---|---|
| Effective path | Safe control-escaped value in the file `h2`; rename/copy uses new path and deletion uses old path | Never used as request authority |
| Status | Exact textual expansion, including rename/copy similarity and `Mode changed` | Derived from the validated record |
| UTF-8 ordinary path | `Path` plus safe/selectable display | `Copy exact path` writes only validated UTF-8 |
| UTF-8 rename/copy paths | Independent `Old path` and `New path` rows | Specifically labeled old/new actions copy only the adjacent side |
| Non-UTF-8 path | `Exact path bytes (base64url)` with selectable base64url value | Byte-labeled action copies base64url, never a purported decoding |
| Line counts | Separate Additions and Deletions values | Null counts render `Line counts unavailable`; zeroes are never invented |
| Git modes | Separate selectable Old mode and New mode values | Added only by the matching validated metadata response |
| Availability | Text, Unsupported, or Unavailable immediately below the title and again as a textual section | Exact classifier reason plus human explanation; no content fallback |

The packaged case uses real tab and newline characters as UTF-8 copy payloads while asserting visible `\\t` and `\\n` safe rendering. It separately verifies the non-UTF-8 base64url value `Zml4dHVyZXMv_w` remains visible and is copied byte-for-byte.

## Availability Reason Matrix

| Machine reason | Heading | Textual explanation/recovery proof |
|---|---|---|
| Supported text | Availability | `Text file — content preview is not available in this version.` |
| `unsupported: binary` | `File cannot be shown inline` | Git binary classification; metadata remains inspectable; no in-browser recovery |
| `unsupported: non-utf8` | `File cannot be shown inline` | Invalid UTF-8; metadata remains inspectable; no in-browser recovery |
| `unsupported: oversized` | `File cannot be shown inline` | Inline size limit; metadata remains inspectable; no in-browser recovery |
| `unsupported: submodule` | `File cannot be shown inline` | Submodule commit rather than regular text; inspect with Git outside the session |
| `unsupported: symlink` | `File cannot be shown inline` | Symbolic link rather than regular text; inspect committed link target with Git |
| `unsupported: mode-or-type` | `File cannot be shown inline` | Git mode/object type is not supported as regular text; no in-browser recovery |
| `unavailable: missing-object` | `File cannot be shown inline` | Missing/unreadable pinned object; no moving-ref or worktree fallback; repair object data and relaunch |

Every row remains selected with `aria-selected="true"` while its explanation is shown. Warning/error tones supplement the heading, machine reason, prose, and tree text; color never carries the reason alone.

## Copy and Accessibility Proof

- `Copy exact old path`, `Copy exact new path`, `Copy exact path`, and `Copy exact path bytes` name the adjacent value precisely.
- A focused copy button remains focused after activation; the visible semantic hit target remains at least 40×40px and keeps the established two-pixel focus ring.
- Success changes only that button's visible treatment to `Copied`, publishes polite `Copied` feedback, and resets after two seconds.
- Clipboard denial renders exactly `Could not copy. Select the value and copy it manually.` as an alert while the selectable value remains present.
- The pane is a `main` landmark named `File details`; the selected file is its `h2`, section headings are ordered beneath it, retry failures are alerts, and loading is a status.

## Retry, Transition, and Stale-response Proof

- The pane updates its safe `h2`, status, paths, counts, and availability immediately from the selected session record.
- A file-detail failure retains the same heading, selected tree row, status, path, counts, and availability; it adds only the fixed generic alert and one `Retry file details` button.
- One fixture fails once and then succeeds, proving recovery. A second fixture fails both the selection request and first retry, proving the action remains available and does not enter a spinner loop, then succeeds on the next retry.
- A delayed oversized-file response is released only after a binary file has become current. The binary heading/reason remains current after the stale response completes.
- A response whose validated `fileId` does not equal the requested capability is treated as the same fixed file-detail failure rather than being rendered.

## Capability and Non-disclosure Proof

Every observed detail request satisfies all of the following:

- method is `GET`;
- path is exactly `/api/files/file_[A-Za-z0-9_-]{43}`;
- the capability belongs to the validated launch session;
- query string is empty;
- request body is absent.

The rendered workspace has no `input`, `textarea`, or `select`, and no repository path from hostile diagnostic text is rendered. Displayed/copyable paths are presentation data only; they never become request authority. No repository, ref, commit object, blob object, filesystem path, origin, token, or export destination selection grammar was added.

## Phase 2 Exclusion Proof

- No Monaco import, mount, editor frame, line gutter, content blob, hunk, context control, syntax highlighting, line navigation, comment affordance, or code surface exists.
- No file content request/response field, arbitrary object ID field, path query, ref query, or blob fallback was introduced.
- No router, state library, component package, registry source, manifest, lockfile, endpoint, schema, Git command, persistence surface, or dependency changed.
- Final responsive `Files`/`Details` tabs, narrow identity sheet modality/focus trap, viewport/orientation persistence, and the complete 320px acceptance matrix remain exclusively Plan 01-13 work.

## Files Created/Modified

- `src/web/components/FileMetadataPane.vue` — Renders exact selected-file metadata, path copy actions, reason-specific availability, mode loading, and retry state.
- `src/web/components/InlineNotice.vue` — Provides semantic neutral, warning, and error notice structure without encoding meaning only in color.
- `src/web/App.vue` — Owns opaque selection, file-local loading/error state, retries, response identity checks, and stale-request generations.
- `src/web/components/CopyButton.vue` — Supports context-specific fixed failure copy while preserving established identity copy behavior and focus.
- `src/web/styles.css` — Adds stable desktop metadata layout, selectable monospace values, semantic notices, and accessible retry/copy controls.
- `tests/e2e/pinned-session.spec.ts` — Adds the exact named production-package contract for every reason, exact copy modes, retries, stale responses, and opaque-only requests.

## Decisions Made

- Keep exact path presentation and copy payloads separate. The safe `display` string is always rendered; validated `utf8` or `bytesBase64url` is copied according to the exact side's encoding.
- Use the existing session DTO as the stable metadata baseline so a network/detail failure cannot erase status, paths, counts, or availability already validated at session load.
- Require both request-generation equality and response `fileId` equality before accepting mode details. This addresses response ordering without adding cancellation authority or a broader endpoint.
- Preserve the existing identity-panel clipboard failure sentence by making metadata's UI-spec failure text a per-use `CopyButton` property rather than silently changing Plan 11 behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test Bug] Made the supported control-character row the deterministic first leaf**
- **Found during:** Task 2 (GREEN)
- **Issue:** The RED fixture listed the supported rename first, but the established file-tree model correctly selects by deterministic path order rather than input-array order. Another synthetic directory sorted before `src`, so a passing implementation would select that row before the supported-path assertions.
- **Fix:** Prefixed only the synthetic supported fixture root with `00-src/` and updated its safe-display and exact-copy expectations. The behavioral RED remained genuine because it had already failed on the wholly absent `File details` landmark before path ordering could affect an assertion.
- **Files modified:** `tests/e2e/pinned-session.spec.ts`
- **Verification:** The exact named packaged metadata case selected the supported row first, copied actual tab/newline payloads, and then selected every other row deterministically.
- **Committed in:** `bebe18f`

**2. [Rule 1 - Planning Metadata Bug] Reconciled generated sequential progress**
- **Found during:** Plan closeout
- **Issue:** The required GSD handlers counted 12 summaries and reported 34%, but wrote frontmatter `percent: 0`, left the visible state bar at 31%, reset velocity totals, labeled one decision `Phase ?`, corrupted the fixed Phase 1 roadmap overview row, and left the detailed roadmap at 11/13 plans and 22/23 requirements.
- **Fix:** Restored the fixed Phase 1 goal and 23-requirement/13-plan totals, reconciled state to Plan 13 of 13 with 12 of 35 plans (34%), restored truthful velocity/history facts, labeled the decision Phase 01, and set the detailed Phase 1 row to 12/13 plans and 23/23 requirements.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Verification:** State now reports 12 completed plans, 34%, and Plan 13 of 13; roadmap preserves its fixed overview and reports 12/13 plans with all 23 Phase 1 requirements complete; DIFF-06 is checked and marked Complete.
- **Committed in:** Final planning metadata commit

---

**Total deviations:** 2 auto-fixed issues (2 bugs: 1 test fixture, 1 generated planning metadata).
**Impact on plan:** The fixture correction aligned with the required deterministic tree contract, and the metadata correction made sequential progress truthful. Production scope and RED/GREEN ordering were unchanged.

## Issues Encountered

- The first GREEN run reached the planned retry state but the alert landmark also contained the retry button's accessible text. The fixed message was moved onto its own `role="alert"` paragraph while the surrounding notice retained the retry action, producing one exact non-leaking alert without hiding or separating recovery.

## Threat Model Verification

- **T-01-27 (elevation):** App requests use only the `fileId` emitted by the existing validated tree. Packaged request evidence proves no body/query/path/ref/object field; mismatched response IDs are rejected and stale responses are ignored.
- **T-01-28 (spoofing):** Control-safe `display` remains the only visible path rendering, while exact UTF-8/base64url copy payloads remain adjacent and specifically labeled. Availability is always conveyed by exact text, heading, prose, and structure in addition to color.
- **T-01-SC (dependency tampering):** No install, dependency, manifest, lockfile, package registry, component registry, router, or state library changed.
- No new network endpoint, authentication path, schema boundary, repository read, Git command, file-content surface, persistence path, or source mutation was introduced.

## Known Stubs

None. `Text file — content preview is not available in this version.` is the authoritative Phase 1 supported-file availability contract, not a placeholder implementation; Monaco/content rendering is deliberately and verifiably excluded until Phase 2.

## User Setup Required

None.

## Next Phase Readiness

- Plan 01-13 can add the final narrow `Files`/`Details` navigation and identity-sheet modality around a stable selected-file pane without changing metadata, reasons, copy payloads, or request authority.
- Phase 2 can replace only the supported-text availability body with immutable blob-backed Monaco rendering while keeping all unsupported/unavailable placeholders and metadata sections intact.
- No blocker remains for the dependency-ordered next plan.

## Self-Check: PASSED

- Both created components and all four modified production/test files exist.
- RED commit `820d2dd` exists and precedes GREEN commit `bebe18f` on `main`.
- Both exact plan-scoped packaged Chromium cases pass against rebuilt production assets.
- Neither task commit contains a tracked-file deletion.
- DIFF-06 is delivered once; Phase 2 editor/content behavior and Plan 01-13 final responsive acceptance remain excluded.

---
*Phase: 01-pinned-local-comparison*
*Completed: 2026-07-20*
