---
phase: 01-pinned-local-comparison
plan: 11
subsystem: ui
tags: [vue, playwright, identity, clipboard, accessibility, session-states, tdd]

requires:
  - phase: 01-pinned-local-comparison
    plan: 10
    provides: Accessible opaque-ID changed-file tree and validated packaged browser session
  - phase: 01-pinned-local-comparison
    plan: 08
    provides: Authenticated immutable session DTO and fixed launch-scoped capabilities
provides:
  - Persistent ordered base/head identity header with pin and dirty-byte context
  - Full base, head, and merge-base identity disclosure with exact copy actions
  - Valid loading, zero-change, stopped, denied, and unavailable session hierarchy
  - Production-package Playwright proof for CMP-08 and identity/session behavior
affects: [01-12, 01-13, Phase 2 diff workspace, Phase 3 selector drift]

tech-stack:
  added: []
  patterns:
    - Validated session DTOs atomically replace loading with either immutable identity or terminal-owned recovery
    - Copy controls retain exact selectable values while reporting polite success and non-destructive failure
    - Selected worktree presentation exposes only path and dirty facts needed by the identity contract

key-files:
  created:
    - src/web/components/IdentityHeader.vue
    - src/web/components/IdentityPanel.vue
    - src/web/components/CopyButton.vue
    - src/web/components/EmptyState.vue
    - src/web/components/ErrorState.vue
  modified:
    - src/web/App.vue
    - src/web/styles.css
    - src/web/api/client.ts
    - src/contracts/api.ts
    - src/server/capabilities.ts
    - src/domain/path-bytes.ts
    - tests/e2e/pinned-session.spec.ts

key-decisions:
  - "Expose only selected worktree path and dirty state in the browser identity DTO; branch refs, source IDs, repository authority, and blob IDs remain server-side."
  - "Classify a failed session fetch as a stopped local session while retaining generic non-leaking copy for HTTP and validation failures."
  - "Keep the identity panel non-modal in Plan 01-11; narrow modal focus trapping and final responsive acceptance remain Plan 01-13."

patterns-established:
  - "Identity presentation: safe labels and paths are control-escaped, short IDs remain in the persistent h1, and full IDs never truncate in disclosure."
  - "Session states: exactly one h1 is visible, errors remove interactive workspace content, and session-wide failures never offer retry."
  - "Clipboard feedback: exact adjacent value only, polite Copied status, two-second reset, and an alert that preserves the selectable value on failure."

requirements-completed: [CMP-08]

duration: 20min
completed: 2026-07-20
status: complete
---

# Phase 01 Plan 11: Immutable Identity and Session States Summary

**The production Vue package now keeps ordered pinned identities and dirty-byte semantics explicit, exposes exact full commit copy actions, and renders deliberate loading, zero-change, stopped, denied, and unavailable states without leaking terminal diagnostics or adding later-plan file metadata.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-20T15:38:39Z
- **Completed:** 2026-07-20T15:59:05Z
- **Tasks:** 2
- **Files created or modified:** 12

## Accomplishments

- Replaced the provisional always-open identity area with a persistent ordered header and keyboard-reachable `Comparison identities` disclosure.
- Displayed safe base/head labels and pinned short IDs in the single loaded h1; disclosed ordered Base, Head, and Merge base rows with non-truncated full IDs, applicable selected worktree paths, and dirty-byte explanations.
- Added specifically named full-ID copy controls that copy only their adjacent value, announce `Copied` politely, reset after two seconds, and report clipboard denial without hiding or replacing the full value.
- Rendered a successful zero-change comparison with validated identities, `0 changed files`, and the exact deliberate empty-state copy rather than an error or fabricated loading state.
- Rendered stopped, security-denied, and generic session-unavailable states with one semantic state heading, an alert, truthful terminal-owned recovery, no retry action, and no interactive file tree/details.
- Preserved visible keyboard focus and restored focus to the identity disclosure when desktop Escape closes the non-modal panel.

## Task Commits

Each TDD gate was committed atomically:

1. **Task 1 — RED: specify identity session and empty-state behavior** — `37c5e8f` (`test`)
2. **Task 2 — GREEN: render immutable identities and session states** — `7be3bfc` (`feat`)

**Plan metadata:** This summary, state, roadmap, and requirement completion are committed together in the final `docs(01-11)` commit.

## TDD Evidence

### RED — `37c5e8f`

The walking-skeleton prerequisite first rebuilt and exercised the generated production package successfully:

```text
npm run test:package -- tests/e2e/pinned-session.spec.ts --grep "generated CLI opens immutable pinned session"
1 passed (4.3s)
```

The new exact named case then rebuilt the package, launched the real loopback CLI fixture, validated the session, replaced the loading state, and failed at the first missing identity disclosure assertion:

```text
npm run test:package -- tests/e2e/pinned-session.spec.ts --grep "identity session and empty states"
Locator: getByRole('button', { name: 'Comparison identities' })
Expected aria-expanded: "false"
Error: element(s) not found
1 failed
```

The failure was behavioral and reached the browser UI; package build, CLI launch, token authentication, API validation, loading transition, and loaded heading prerequisites had already succeeded.

### GREEN — `7be3bfc`

Both plan-scoped production-asset commands passed after implementation:

```text
npm run test:package -- tests/e2e/pinned-session.spec.ts --grep "identity session and empty states"
1 passed (5.9s)

npm run test:package -- tests/e2e/pinned-session.spec.ts --grep "generated CLI opens immutable pinned session"
1 passed (2.0s)
```

Each command rebuilt the TypeScript/Vite production assets, packed and extracted the npm artifact, launched its generated executable against real Git fixtures, and drove Chromium through the loopback session. No formatter, linter, unrelated Playwright file, unit suite, API suite, or project-wide suite ran.

Git history proves the required gate order:

```text
7be3bfc feat(01-11): render immutable identities and session states
37c5e8f test(01-11): specify identity session and empty states
```

## Verified State Matrix

| State | Visible h1 | Primary state and recovery | Interactive workspace |
|---|---|---|---|
| Loading before DTO validation | `Diff Review: loading pinned comparison` | `Loading pinned comparison…` with `role="status"` | Absent |
| Loaded comparison | `Diff Review: {safe base label} · {short base ID} → {safe head label} · {short head ID}` | Persistent pin cue, dirty facts, and identity disclosure | Changed-file tree remains available |
| Successful zero changes | Loaded identity h1 | `No changes in this pinned comparison`, `0 changed files`, exact empty body | No false error or loading flash |
| Stopped local session | `Diff Review: pinned session unavailable` | `Pinned session unavailable` plus stopped alert and terminal relaunch instruction | Removed; no retry |
| Security denial | `Diff Review: pinned session unavailable` | Generic denial alert that names no rejected path, object, token, origin, or capability | Removed; no retry |
| Generic session failure | `Diff Review: pinned session unavailable` | Generic unavailable alert delegates diagnostics to the terminal | Removed; no retry |

## Identity and Copy Contract

- The persistent h1 keeps the ordered base → head relationship textual and includes both pinned short object IDs.
- `Pinned to displayed commits` remains visible; every dirty selected worktree also shows `Dirty bytes ignored` plus the accessible description `Committed HEAD reviewed; staged, unstaged, and untracked bytes ignored.`
- The disclosure uses `aria-expanded` and `aria-controls`, is operable by pointer and keyboard, closes on desktop Escape, and regains focus after closing.
- The definition list order is exactly Base, Head, Merge base. Endpoint rows retain safe source labels, full IDs, applicable selected worktree paths, and endpoint-local dirty explanations.
- Full IDs are selectable monospace text and wrap rather than truncate.
- Copy controls are named exactly `Copy full base commit`, `Copy full head commit`, and `Copy full merge-base commit`; each writes only the adjacent full object ID.
- Success is announced through a polite live status as `Copied` and becomes empty after two seconds. Clipboard failure uses an alert reading `Copy failed. The full value remains available to select.` while leaving the full ID visible.
- The panel ends with the exact statement: `This session is pinned to these commits and does not follow moving refs.` It does not claim selector-drift detection.

## Exact Empty and Recovery Copy

- **Empty heading:** `No changes in this pinned comparison`
- **Empty body:** `The merge base and head resolve to identical trees. Open Comparison identities to review the pinned commits, then press Ctrl+C in the terminal when you are finished.`
- **Stopped:** `This pinned session has stopped. Relaunch Diff Review from the terminal to continue.`
- **Security denial:** `This request is not available in the current session. Relaunch Diff Review from the terminal.`
- **Generic unavailable:** `This pinned session is unavailable. Return to the terminal and launch Diff Review again. Diagnostic details are shown in the terminal.`

## Files Created/Modified

- `src/web/components/IdentityHeader.vue` — Renders the ordered h1, pin cue, dirty badges, and accessible disclosure control.
- `src/web/components/IdentityPanel.vue` — Renders full immutable identities, selected worktree context, copy controls, and no-moving-refs statement.
- `src/web/components/CopyButton.vue` — Owns exact clipboard writes, polite success/reset, failure alert, and timer cleanup.
- `src/web/components/EmptyState.vue` — Renders the deliberate successful zero-change state and exact copy.
- `src/web/components/ErrorState.vue` — Renders the session-wide semantic state heading and non-leaking alert.
- `src/web/App.vue` — Atomically composes loading, unavailable, empty, and populated session hierarchy without Plan 12 metadata.
- `src/web/styles.css` — Applies the verified dark developer-tool hierarchy, stable panel/card layouts, semantic status text, 40px controls, and visible focus rings.
- `src/contracts/api.ts` — Validates the minimal selected-worktree identity facts required by the browser.
- `src/server/capabilities.ts` — Projects only selected worktree path/dirty presentation into the frozen session DTO.
- `src/web/api/client.ts` — Distinguishes a stopped loopback fetch from generic session failure while preserving non-leaking copy.
- `src/domain/path-bytes.ts` — Exposes the existing control-safe display function for source labels and selected worktree paths.
- `tests/e2e/pinned-session.spec.ts` — Proves the named identity/copy/loading/empty/stopped/denied/unavailable contract through generated production assets.

## Decisions Made

- Expose only the selected worktree `path` and `dirty` presentation facts in the session DTO. Do not expose branch ref names, internal source IDs, repository selection authority, or blob identities.
- Treat network failure while loading `/api/session` as the stopped-loopback state; retain generic unavailable copy for HTTP/protocol/validation failure and the established generic denial for 401/403.
- Reuse the existing control-safe string renderer for labels and paths rather than adding a second escaping convention.
- Keep the identity panel non-modal at wide and medium widths. Plan 01-13 still owns narrow sheet modality, focus trapping, responsive tabs, and final responsive acceptance.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added minimal selected-worktree identity facts to the validated browser DTO**
- **Found during:** Task 2 (GREEN)
- **Issue:** The existing strict session DTO retained only endpoint label and OID. A selected worktree's applicable path and dirty state therefore could not reach the identity UI, and passing the existing domain `source` object directly was correctly rejected by strict validation.
- **Fix:** Added a minimal readonly `worktree: { path, dirty }` browser shape and explicitly projected only those presentation facts in the capability registry. Reused the shared control-safe renderer for labels and paths.
- **Files modified:** `src/contracts/api.ts`, `src/server/capabilities.ts`, `src/domain/path-bytes.ts`
- **Verification:** The exact named packaged case launched a dirty selected-worktree fixture and observed the safe heading, visible badge, accessible dirty description, applicable path, and exact endpoint-local explanation.
- **Committed in:** `7be3bfc`

**2. [Rule 2 - Missing Critical] Distinguished stopped local sessions from generic post-launch failure**
- **Found during:** Task 2 (GREEN)
- **Issue:** The client collapsed fetch refusal and server/protocol failure into the same generic session message, so the required truthful stopped state could not be rendered.
- **Fix:** Added a dedicated stopped client classification and exact terminal relaunch copy for session-fetch network failure while leaving 401/403 and generic HTTP/validation behavior unchanged.
- **Files modified:** `src/web/api/client.ts`, `src/web/App.vue`
- **Verification:** The named packaged case aborts the session request as connection refused and separately exercises 403 and 500 responses, proving three non-leaking messages, one unavailable hierarchy, removed workspace content, and no retry.
- **Committed in:** `7be3bfc`

**3. [Rule 1 - Bug] Reconciled generated planning progress fields**
- **Found during:** Sequential main closeout
- **Issue:** The required GSD handlers correctly counted 11 summaries and completed CMP-08, but reset the state percentage to `0`, left the visible progress bar at `29%`, replaced the Phase 1 overview goal/totals with progress columns, and left the detailed roadmap row at `10/13` plans and `21/23` requirements.
- **Fix:** Restored the fixed Phase 1 overview goal, 23-requirement and 13-plan totals, then reconciled state to 11 of 35 plans (`31%`) and the Phase 1 detail row to `11/13` plans and `22/23` requirements.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Verification:** The summary count is 11, CMP-08 is checked and marked Complete, state shows Plan 12 of 13 with 11 of 35 plans (`31%`), and the roadmap preserves fixed totals while reporting `11/13` and `22/23`.
- **Committed in:** Final planning metadata commit

---

**Total deviations:** 3 auto-fixed issues (2 missing-critical, 1 generated metadata bug).
**Impact on plan:** The production fixes were required to satisfy dirty/worktree and stopped-state contracts through validated data; the metadata fix preserved truthful sequential planning state. No dependency, selected-file metadata, unsupported-file placeholder, narrow responsive acceptance, Phase 2 diff control, or Phase 3 drift behavior was added.

## Issues Encountered

- The first draft of the RED fixture attempted to include selected-worktree source context immediately, which the pre-existing strict API schema rejected before the browser opened. The test was corrected before the RED commit so the required RED proof reached and failed the missing identity disclosure assertion; the minimal DTO seam was then implemented only during GREEN.
- The pre-existing walking-skeleton test expected full identity rows to be permanently visible. It was updated during GREEN to activate the new required disclosure before asserting the same full immutable IDs.

## Threat Model Verification

- **T-01-25 (information disclosure):** Browser errors ignore response diagnostics and render only fixed messages. The packaged denial fixtures inject the selected repository path and fragment token into hostile response text; neither appears in the page.
- **T-01-26 (identity spoofing):** Base/head order is explicit in the h1 and definition list, safe labels visibly escape control characters, full OIDs remain visible and copyable, and pin/dirty meaning is stated in text rather than color.
- **T-01-SC (dependency tampering):** No dependency, package manifest, lockfile, registry source, router, state library, component library, or network package changed.
- The API adjustment exposes only the selected worktree path already required by the UI specification and its dirty boolean. It does not introduce a repository/ref/object/path selection capability, endpoint, source mutation, authentication path, Git command, persistence schema, or file-content surface.

## Known Stubs

None. The populated workspace intentionally does not render selected-file metadata because Plan 01-12 owns that behavior; no placeholder copy, fake value, empty mock, or metadata scaffold was added.

## User Setup Required

None.

## Next Phase Readiness

- Plan 01-12 can render selected-file metadata and availability states beside the unchanged opaque-ID tree without changing the identity/session hierarchy.
- Plan 01-13 can convert the stable identity disclosure into the narrow modal sheet and add the responsive Files/Details acceptance matrix without changing its copy or copy-action contract.
- No blocker remains for the next dependency-ordered plan.

## Self-Check: PASSED

- All five created Vue components and all seven modified source/test files exist.
- RED commit `37c5e8f` exists and precedes GREEN commit `7be3bfc` on `main`.
- Both exact plan-scoped packaged Chromium commands pass against production assets.
- Neither task commit contains a tracked-file deletion.
- CMP-08 is delivered through the deliberate zero-change state, while selected-file metadata and final narrow responsive acceptance remain unimplemented as required.

---
*Phase: 01-pinned-local-comparison*
*Completed: 2026-07-20*
