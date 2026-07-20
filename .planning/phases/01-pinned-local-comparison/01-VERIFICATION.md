---
phase: 01-pinned-local-comparison
verified: 2026-07-20T19:15:50Z
status: passed
score: 44/44 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 1: Pinned Local Comparison Verification Report

**Phase Goal:** A developer can launch from a repository, select any ordered pair of local branches or registered worktrees, and inspect the correct pinned merge-base-to-head changed-file set in a secure local browser session.

**Verified:** 2026-07-20T19:15:50Z  
**Status:** `passed`  
**Re-verification:** No — initial verification  
**Branch:** `main`

## Verdict

Phase 1 achieves its goal. All 5 roadmap success criteria, all 39 PLAN-frontmatter truths, all 40 declared artifact entries, all 18 declared key links, and all 23 owned requirements are verified. No truth is failed or behavior-unverified, no artifact is missing/stubbed/orphaned, no critical link is unwired, and no human-only acceptance item remains.

The strongest independent behavioral evidence is:

- `npm run test:package -- tests/e2e/pinned-session.spec.ts` — **6/6 passed**, including the complete four-ordering packaged matrix, frozen identities, dirty-byte exclusion, identity/empty states, metadata/availability states, token/Host/Origin/capability denial, and one-time interrupt shutdown.
- `npm run test:package -- tests/e2e/responsive-session.spec.ts` — **1/1 passed**, exercising wide/medium/narrow layouts, keyboard focus/state continuity, modal focus containment/restoration, 320px reflow, 200% zoom, text spacing, control states, contrast, announcements, and reduced motion in Chromium against the production package.
- `npx vitest run tests/git tests/unit tests/api tests/cli` — **12 files, 109/109 tests passed**, covering the interactive picker and low-level Git/API contracts not fully isolated by the packaged matrix.
- `npm pack --dry-run` — **passed** after rebuilding the production runtime and Vite bundle; the tarball inventory contains only `package.json`, the generated executable, compiled runtime modules, and hashed production web assets.

## User Flow Coverage

| Step | Expected outcome | Actual implementation and behavior evidence | Status |
| --- | --- | --- | --- |
| Launch inside a real worktree, including a nested directory | Canonical non-bare repository root is resolved; invalid environments fail before binding | `src/git/repository.ts:143-214` uses native `git rev-parse --path-format=absolute --show-toplevel`, canonical `realpath`, bare/HEAD checks, version/protocol probes. `tests/git/pinned-comparison.test.ts:26-39` and `tests/git/comparison.test.ts:72-188`; focused suite passed. | VERIFIED |
| Search and choose ordered local sources | One grouped searchable list exposes local branches and all registered worktrees; base is chosen before head | `src/git/candidates.ts:130-251`, `src/cli/picker.ts:108-205,240-320`, `src/cli/run.ts:275-403`. `tests/git/candidates.test.ts:31-154` and `tests/cli/selection.test.ts:103-292`; focused suite passed. | VERIFIED |
| Confirm immutable comparison identity | Ordered labels, full base/head/merge-base OIDs, selected worktree paths, dirty warning, and pin statement are shown | `src/cli/confirm.ts:43-75`; `src/git/comparison.ts:150-325`; `tests/cli/selection.test.ts:223-292`; focused suite passed. | VERIFIED |
| Bind and open local browser session | Comparison is completely frozen before Fastify binds only to `127.0.0.1:0`; URL/instructions precede browser-open attempt | `src/cli/run.ts:93-195`; packaged `generated CLI opens immutable pinned session` and opener-fallback behavior passed. | VERIFIED |
| Navigate the changed-file inventory | Deterministic accessible tree shows exact safe paths, statuses, counts, and availability; selection authority is opaque file ID | `src/domain/file-tree.ts:202-219`, `src/web/model/file-tree.ts`, `src/web/components/FileTree.vue:1-183`, `FileRow.vue:21-69`; packaged matrix and focused file-tree tests passed. | VERIFIED |
| Inspect identities and file metadata | Full pinned identities, dirty context, exact paths/bytes, status/count/mode/availability, and reason-specific unsupported states are available without exposing blob text | `src/server/capabilities.ts:33-74`, `src/server/routes.ts:22-51`, `src/web/App.vue:53-92,244-249,330-400`, `IdentityPanel.vue:1-145`, `FileMetadataPane.vue:1-270`; packaged identity and metadata cases passed. | VERIFIED |
| Use responsive/keyboard workspace | State, scroll, focus, disclosure semantics, reflow, zoom, contrast, and reduced-motion behavior hold across supported viewports | `src/web/App.vue:95-241,270-400`, `src/web/styles.css:640-967`, `IdentityPanel.vue:32-69`; responsive Playwright contract passed. | VERIFIED |
| Stop the session | One interrupt aborts active Git work and closes the listener exactly once with SIGINT exit status 130 | `src/server/lifecycle.ts:21-105`; packaged `interrupt closes loopback session once` passed. | VERIFIED |

## Goal Achievement

### Roadmap Success Criteria

| # | Roadmap truth | Status | Evidence |
| --- | --- | --- | --- |
| SC-1 | From any directory in a real Git worktree, the CLI offers searchable local branch and registered-worktree entries, makes base/head order explicit, warns that dirty bytes are ignored, resolves committed identities, binds an ephemeral loopback server, and opens the browser. | VERIFIED | Repository/picker/confirmation/launch wiring at `repository.ts:143-214`, `candidates.ts:130-251`, `picker.ts:108-320`, `confirm.ts:43-75`, and `run.ts:275-403,93-195`; CLI/Git focused suite passed and packaged CLI launched successfully. |
| SC-2 | Diverged branch/branch, branch/worktree, worktree/branch, and worktree/worktree fixtures show the merge-base-to-head file set while the session stays pinned to displayed full IDs. | VERIFIED | `tests/e2e/pinned-session.spec.ts:311-632` independently asks Git for base/head/merge-base/path facts for all four orderings, advances the head ref after listen, and checks unchanged session IDs/files; packaged suite passed. |
| SC-3 | Browser file tree accurately represents status/count/unsupported/unusual-path facts without reading dirty bytes. | VERIFIED | Byte-safe inventory in `path-bytes.ts:1-100`, `raw-diff.ts`, `numstat.ts:58-147`, `inventory.ts:38-205`; tree presentation in `FileTree.vue`/`FileRow.vue`; real-Git inventory and protocol tests passed, as did packaged tree/metadata checks. |
| SC-4 | Equal commits, environment/repository/history/object failures, no changes, and unsupported files produce explicit actionable states rather than crashes or substitutions. | VERIFIED | Typed failures in `errors.ts` and `comparison.ts:150-281`; CLI recovery in `run.ts:275-384`; empty and availability UI in `App.vue:360-400` and `FileMetadataPane.vue:36-121`; focused error matrices and packaged empty/metadata/object-loss states passed. |
| SC-5 | Blob/file APIs reject missing tokens, hostile origins, and arbitrary authority; terminal interrupt closes cleanly. | VERIFIED | `security.ts:70-146`, strict routes `routes.ts:7-51`, opaque registry `capabilities.ts:33-74`, fragment client `client.ts:44-108`, and lifecycle `lifecycle.ts:21-105`; packaged security and shutdown cases passed. |

### PLAN Must-Have Truths

Every PLAN truth is classified below. `Pxx-Ty` denotes PLAN `01-xx`, truth `y`.

| ID | Truth | Status | Exact evidence |
| --- | --- | --- | --- |
| P01-T1 | Every installed exact release is independently audited and explicitly approved/replaced/rejected before installation. | VERIFIED | The blocking human checkpoint is defined at `01-01-PLAN.md:64-91` and its exact-version audit/dispositions are preserved in `01-01-SUMMARY.md:62-128`. This historical gate is corroborated by current exact direct pins in `package.json:29-46` and `npm ls --depth=0`, which returned exactly the 14 approved versions with no invalid/extraneous package. This is process evidence, not a SUMMARY-only implementation claim. |
| P01-T2 | Generated executable and production Vue assets are packed and launch through the package bin boundary. | VERIFIED | `package.json:9-27` maps `diff-review` to `dist/bin/diff-review.mjs`, limits files to `dist/`, and rebuilds in `prepack`; packaged CLI suite passed. `npm pack --dry-run` rebuilt successfully and inventory listed the generated bin, compiled runtime, `dist/web/index.html`, and hashed JS/CSS. |
| P02-T1 | Nested launch resolves the canonical non-bare repository and preserves ordered base then head. | VERIFIED | `repository.ts:143-214`, `run.ts:275-403`; real-Git nested-root and CLI ordering tests passed. |
| P02-T2 | Full base/head and exactly one merge-base OID are frozen before server start; dirty-only bytes are excluded. | VERIFIED | `comparison.ts:150-325` resolves/validates OIDs, requires exactly one merge base, constructs inventory from only merge-base/head OIDs, and freezes the descriptor. `pinned-comparison.test.ts:41-111`, `inventory.test.ts:340-388`, and packaged moving-ref/dirty cases passed. |
| P03-T1 | CLI freezes comparison before binding Fastify to loopback port 0 and opens production Vue afterward. | VERIFIED | `run.ts:93-195` accepts a completed comparison, creates app, calls `listen({host:'127.0.0.1',port:0})`, validates actual address, binds security, then opens; packaged generated-bin launch passed. |
| P03-T2 | Actual URL and Ctrl+C instruction print before opener attempt; opener failure leaves URL usable. | VERIFIED | `run.ts:171-187` emits URL and `browserFallback` before `openBrowser`, catches opener failure without closing; packaged lifecycle case passed. |
| P03-T3 | One interrupt idempotently aborts active Git work and closes listener once. | VERIFIED | `lifecycle.ts:42-105` memoizes `shutdownPromise`, removes handlers, aborts, closes, and sets status once; packaged shutdown test passed with abort=1, close=1, status `[130]`. |
| P04-T1 | One grouped search includes local branches, registered worktrees, detached/unavailable worktrees, and distinct source rows sharing an OID. | VERIFIED | Native enumeration at `candidates.ts:137-251`; grouping/filtering at `picker.ts:108-205`; candidate discovery and selection tests passed. |
| P04-T2 | Same picker selects base first then head; base is explicit; only current checkout may be suggested head. | VERIFIED | `picker.ts:240-320` and `run.ts:303-326`; `selection.test.ts:182-221` passed. |
| P04-T3 | Worktree rows expose path, detached state, short committed HEAD, and clean/dirty/unavailable state with truthful dirty explanation. | VERIFIED | `candidates.ts:183-248`, `picker.ts:108-169`, `IdentityHeader.vue:21-51`; focused candidates/selection tests and packaged dirty-label assertions passed. |
| P04-T4 | Confirmation preserves order, full identities, selected paths, dirty warnings, and pin statement. | VERIFIED | `confirm.ts:43-75` and `selection.test.ts:223-292`; focused suite passed. |
| P05-T1 | Missing/unsupported Git and non-reviewable/bare/empty/unavailable-object states fail actionably before bind. | VERIFIED | `repository.ts:90-214`, `comparison.ts:150-281`, `run.ts:293-384`; focused comparison/error matrices passed and assert no launch on fatal paths. |
| P05-T2 | Equal commits remain picker facts but cannot launch; base is retained and focus returns to head. | VERIFIED | `comparison.ts:198-207` returns `equal-commits` with head recovery; `run.ts:340-376` preserves the opposite endpoint; equal-OID/recovery tests passed. |
| P05-T3 | Unrelated histories, multiple merge bases, and missing objects are distinct failures without substitution/re-resolution. | VERIFIED | `comparison.ts:227-281` distinguishes 0, >1, and missing object cases; comparison tests at `:222-323` passed. |
| P05-T4 | Recoverable endpoint failures preserve the opposite selection/focus; fatal environment failures exit without server/browser work. | VERIFIED | `run.ts:329-384`; `tests/cli/errors.test.ts:202-388`; focused suite passed. |
| P06-T1 | Inventory includes all required statuses, modes/blob IDs, and Git counts. | VERIFIED | `inventory.ts:38-205`, `raw-diff.ts:35-122`, `numstat.ts:58-147`; real-Git complete status/mode/blob/count matrix passed. |
| P06-T2 | Spaces, Unicode, controls, leading dashes, invalid UTF-8, and display collisions preserve path identity/selection. | VERIFIED | `path-bytes.ts:1-100` separates base64url authority, strict UTF-8, and control-safe display; protocol/inventory/file-tree collision tests passed. |
| P06-T3 | Rename/copy records retain exact old/new identities; display labels never become authority. | VERIFIED | `raw-diff.ts:68-118`, `numstat.ts:87-109`, `inventory.ts:68-114`; raw/numstat and browser metadata tests passed. |
| P06-T4 | Raw and numstat are independent NUL grammars joined one-to-one by exact bytes with explicit malformed/duplicate/missing/extra rejection. | VERIFIED | `numstat.ts:58-147` and `raw-diff.ts:35-122`; `inventory-protocol.test.ts:82-211`; focused suite passed. |
| P07-T1 | Binary/non-UTF-8/oversized/submodule/symlink/missing/wrong/mode-type entries remain with one precise reason. | VERIFIED | Ordered classifier at `availability.ts:50-117`; strict availability vocabulary in comparison contract; unit and real-Git availability matrices passed. |
| P07-T2 | Exactly 1 MiB per side is eligible and 1 MiB+1 is oversized before content allocation. | VERIFIED | `availability.ts:11,79-96`; unit boundary tests at `availability.test.ts:159-194`; packaged size-boundary case passed. |
| P07-T3 | Classification reads only frozen raw OIDs, never filesystem/ref:path/filter/textconv/external-diff/symlink-target authority. | VERIFIED | `objects.ts:86-159` accepts only full hex OIDs and uses `cat-file --batch-command -Z`; inventory uses `--no-ext-diff --no-textconv` and pinned OIDs at `inventory.ts:50-151`; real-Git authority test passed. |
| P07-T4 | Post-launch missing objects stay unavailable without moving-ref/filesystem substitution. | VERIFIED | `availability.ts:82-107`, `FileMetadataPane.vue:52-55`; disappearance and object-loss tests passed. |
| P08-T1 | Token plus exact Host and absent-or-exact Origin gate session/file reads. | VERIFIED | Early `onRequest` gate in `security.ts:89-113` uses constant-time token comparison and exact bound authority; packaged denial matrix passed. |
| P08-T2 | Authorization/validation precedes capability/object/Git work and denial reveals no sensitive detail. | VERIFIED | Security hook registration precedes routes/static in `app.ts:34-42`; generic denial/error handlers at `security.ts:77-139`; API security and packaged non-leakage assertions passed. |
| P08-T3 | Browser authority is limited to frozen session and opaque file ID; no repository/ref/object/path/option/export/mutation/blob-text grammar exists. | VERIFIED | Strict read-only routes at `routes.ts:7-51`, opaque schema `api.ts:11`, snapshot registry `capabilities.ts:33-74`, and client GETs `client.ts:97-108`; arbitrary fields/capabilities fail closed in packaged test. |
| P08-T4 | Token starts in URL fragment, is erased immediately, remains closure-memory only, and does not leak into URL/API bodies/referrer/logs/copy UI. | VERIFIED | `client.ts:44-65` parses fragment, synchronously `replaceState`s it away, then sends same-origin bearer with `no-referrer`; packaged test asserts cleared hash, bearer header, token absent from request URL, response bodies, browser console, and hostile-denial bodies. Terminal display of the initial fragment URL is intentional SEL-08 behavior, not persistence/log exposure. |
| P09-T1 | Immutable records project deterministically without changing opaque IDs or exact path bytes. | VERIFIED | `domain/file-tree.ts:202-219`, `web/model/file-tree.ts`; collision/order tests passed. |
| P09-T2 | Compaction, visible-row navigation, and first-leaf selection are pure/testable before composition. | VERIFIED | Pure model functions in `web/model/file-tree.ts`; `tests/unit/file-tree.test.ts:90-463`; focused suite passed. |
| P10-T1 | Deterministic hierarchy supports pointer/keyboard navigation with opaque-ID-only selection. | VERIFIED | `FileTree.vue:24-123`, ARIA rows in `DirectoryRow.vue:33-75` and `FileRow.vue:41-69`; packaged tree behavior and unit navigation tests passed. |
| P10-T2 | Leaves expose safe path, textual status, available counts, availability marker, and full rename/copy identity. | VERIFIED | `FileRow.vue:21-69`, `PathDisplay.vue:28-34`, `StatusBadge.vue:30-33`; packaged metadata/tree and inventory tests passed. |
| P11-T1 | Loaded sessions keep ordered identities/pin/dirty warnings visible and disclose full copyable IDs/paths. | VERIFIED | `IdentityHeader.vue:21-61`, `IdentityPanel.vue:75-139`; packaged identity state passed. |
| P11-T2 | Zero-change comparison renders validated identities, `0 changed files`, and deliberate empty state without false error/loading state. | VERIFIED | `App.vue:247-249,360-390`; packaged identity/empty test passed. |
| P11-T3 | Loading/stopped/denied states use non-leaking hierarchy; retry is file-detail-only. | VERIFIED | `App.vue:267-283,330-400`, `ErrorState.vue:7-11`, retry only in `FileMetadataPane.vue:171-185`; packaged identity/security/metadata cases passed. |
| P12-T1 | Supported and all unsupported/unavailable selections retain tree position and show exact reason-specific metadata state instead of a broken editor. | VERIFIED | Selection/request-version guard in `App.vue:53-92`; explanations in `FileMetadataPane.vue:36-121`; packaged metadata case passed and asserts no editor exists. |
| P12-T2 | Pane exposes exact paths/bytes, status/counts/modes/availability/copy/retry without broadening authority. | VERIFIED | `FileMetadataPane.vue:123-270`, opaque request in `client.ts:105-108`; packaged metadata request audit asserts GET-only opaque-ID URLs, no query/body/root leakage. |
| P13-T1 | Wide/medium/narrow layouts preserve identities, selection, expansion, scroll, focus, and availability state. | VERIFIED | State/scroll/focus wiring in `App.vue:95-241`, responsive CSS `styles.css:640-967`; responsive Playwright suite passed. |
| P13-T2 | Keyboard semantics, focus containment/restoration, 40px targets, 320px/200%/text-spacing reflow, contrast, announcements, and reduced motion pass in production. | VERIFIED | `IdentityPanel.vue:32-69`, `App.vue:142-241`, CSS focus/control/media rules `styles.css:640-967`; the named production-package responsive test passed every computed/runtime assertion. |
| P13-T3 | Final generated-package matrix proves Phase 1 conjunctively without production edits in its verification task. | VERIFIED | Full packaged suite passed. `git show --format='%H %s' --name-only c62ff79` reports commit `c62ff791a307cfb8e9a5302d45ef35780e74823d` changed only `tests/e2e/pinned-session.spec.ts`. |

**Score:** 44/44 truths verified; 0 present-but-behavior-unverified.

## Required Artifacts

All 40 PLAN artifact declarations were checked for existence, substantive implementation, and wiring. Grouping by plan avoids repeating the same shared artifacts while preserving every declared path.

| Plan | Declared artifacts | L1 exists | L2 substantive | L3 wired | Details |
| --- | --- | --- | --- | --- | --- |
| 01-01 | `package.json`; `scripts/build-bin.mjs`; `tests/e2e/package-assets.spec.ts` | PASS | PASS | PASS | Build/prepack/bin chain is live; packaged CLI and dry-run tarball prove generated runtime/assets. |
| 01-02 | `src/git/runner.ts`; `src/git/comparison.ts`; `tests/git/pinned-comparison.test.ts` | PASS | PASS | PASS | Runner is the single native-Git boundary; comparison is called from CLI; real-Git tests passed. |
| 01-03 | `src/server/app.ts`; `src/server/lifecycle.ts`; `tests/e2e/pinned-session.spec.ts` | PASS | PASS | PASS | App/lifecycle are composed in `run.ts`; generated process/browser behavior passed. |
| 01-04 | `src/git/candidates.ts`; `src/cli/picker.ts`; `src/cli/confirm.ts` | PASS | PASS | PASS | All three are imported and used by `runCli`; CLI/Git tests passed. |
| 01-05 | `src/domain/errors.ts`; `src/git/comparison.ts`; `tests/git/comparison.test.ts` | PASS | PASS | PASS | Typed `LaunchError` recovery flows into CLI state machine; full comparison matrix passed. |
| 01-06 | `src/domain/path-bytes.ts`; `src/git/raw-diff.ts`; `src/git/numstat.ts`; `src/git/inventory.ts` | PASS | PASS | PASS | Exact bytes flow parser → join → inventory → comparison/session. |
| 01-07 | `src/git/objects.ts`; `src/git/availability.ts`; `tests/git/availability.test.ts` | PASS | PASS | PASS | Inventory constructs object reader and attaches classifier output to every entry. |
| 01-08 | `src/server/security.ts`; `src/server/capabilities.ts`; `src/server/routes.ts`; `src/web/api/client.ts` | PASS | PASS | PASS | App registers security before routes/static; client consumes only the strict authenticated API. |
| 01-09 | `src/domain/file-tree.ts`; `src/web/model/file-tree.ts`; `tests/unit/file-tree.test.ts` | PASS | PASS | PASS | Browser model calls the pure projection; Vue tree consumes model. |
| 01-10 | `src/web/components/FileTree.vue`; `tests/e2e/file-tree.spec.ts` | PASS | PASS | PASS | `App.vue` renders tree and consumes opaque selection events; packaged browser behavior is tested. |
| 01-11 | `IdentityHeader.vue`; `IdentityPanel.vue`; `CopyButton.vue`; `tests/e2e/pinned-session.spec.ts` | PASS | PASS | PASS | Session DTO drives visible identity hierarchy and exact-value copy controls. |
| 01-12 | `FileMetadataPane.vue`; `CopyButton.vue`; `tests/e2e/pinned-session.spec.ts` | PASS | PASS | PASS | Opaque tree selection drives authenticated metadata request and pane state. |
| 01-13 | `tests/e2e/responsive-session.spec.ts`; `tests/e2e/pinned-session.spec.ts` | PASS | PASS | PASS | Both execute the generated production package; both passed in this verification. |

## Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `package.json` | `scripts/build-bin.mjs` | build/prepack script | WIRED | `build:runtime` invokes `build:bin`; dry-run pack rebuilt it. |
| `src/cli/run.ts` | `src/git/comparison.ts` | `createPinnedComparison` | WIRED | `run.ts:24-26,89-90,280-337`. |
| `src/cli/run.ts` | `src/server/app.ts` | frozen comparison passed to `createSessionApp` before listen | WIRED | `run.ts:133-155`. |
| `src/server/app.ts` | production Vue app | static Vite root plus `/api/session` | WIRED | `app.ts:34-42`; generated browser test rendered validated identities. |
| `src/git/candidates.ts` | `src/cli/picker.ts` | immutable `SourceCandidate` IDs | WIRED | `runCli` passes discovered candidates to `pickOrderedSources`. |
| `src/cli/picker.ts` | `src/cli/run.ts` | ordered picker result | WIRED | `run.ts:320-338` maps base/head in order into comparison creation. |
| `src/git/comparison.ts` | `src/cli/run.ts` | typed `LaunchError` recovery | WIRED | `run.ts:339-377`; focused error tests passed. |
| `src/git/inventory.ts` | `src/git/comparison.ts` | frozen merge-base/head OIDs | WIRED | `comparison.ts:283-295`; only full OIDs are supplied. |
| `src/domain/path-bytes.ts` | `src/contracts/comparison.ts` | separate encoded bytes/display/optional UTF-8 | WIRED | strict schemas preserve all three representations; API tests passed. |
| `src/git/inventory.ts` | `src/git/availability.ts` | diff modes/blob IDs classified | WIRED | `inventory.ts:183-197`. |
| `src/git/availability.ts` | `src/git/objects.ts` | metadata before bounded content | WIRED | `availability.ts:79-107`. |
| `src/server/routes.ts` | `src/server/capabilities.ts` | `fileId` only | WIRED | `routes.ts:33-50`; no path/object lookup grammar. |
| `src/web/api/client.ts` | `src/server/security.ts` | closure-held Authorization bearer | WIRED | `client.ts:44-65`; packaged network assertions passed. |
| `src/web/model/file-tree.ts` | `src/domain/file-tree.ts` | identity-preserving projection | WIRED | model imports/calls `buildFileTree`; unit tests passed. |
| `FileTree.vue` | `src/web/model/file-tree.ts` | `createFileTreeModel` | WIRED | `FileTree.vue:5-9,25`; packaged navigation passed. |
| `src/web/App.vue` | `src/web/api/client.ts` | validated session/details client | WIRED | `App.vue:244-249,53-92`. |
| `FileTree.vue` | `FileMetadataPane.vue` | selected opaque file ID through App client state | WIRED | `App.vue:53-92,335-400`; stale/mismatch guards are behavior-tested. |
| `src/web/App.vue` | `FileTree.vue` | persistent narrow Files/Details panels | WIRED | `App.vue:95-183,315-400`; responsive state-continuity test passed. |

## Data-Flow Trace (Level 4)

| Rendered artifact | Dynamic data | Real source | Status |
| --- | --- | --- | --- |
| Picker | branch/worktree candidates | Native `git for-each-ref` and `git worktree list --porcelain -z`, plus per-worktree `rev-parse`/`status` | VERIFIED |
| Browser identity header/panel | base/head/merge-base identities, worktree/dirty facts | `createPinnedComparison` frozen full-OID descriptor → strict capability snapshot → `/api/session` → Zod client | VERIFIED |
| File tree | immutable changed-file DTOs | Native `git diff --raw -z` plus independent `--numstat -z`, exact-byte join, OID availability classification | VERIFIED |
| Metadata pane | selected status/path/count/mode/availability | Opaque `fileId` → frozen in-memory capability map → strict metadata DTO | VERIFIED |
| Responsive workspace | selected ID, expansion, scroll, focus, active pane | Persistent Vue/model state; CSS/`hidden`/`inert` control visibility and focus without rebuilding authority | VERIFIED |

## Shell-Free Git Authority and Pinning Audit

- **Single subprocess boundary:** `src/git/runner.ts:1,86-229` calls `spawn('git', argumentArray, { shell: false, ... })`; no shell interpolation exists.
- **Repository-code suppression:** runner forces `--no-optional-locks`, empty hooks path, disabled fsmonitor/external diff/file protocol and noninteractive environment (`runner.ts:7-17,142-153`). Inventory additionally passes `--no-ext-diff --no-textconv` and a terminating `--` (`inventory.ts:50-151`).
- **Frozen OIDs:** `comparison.ts:181-281` resolves full base/head OIDs, rejects equality, asks Git for all merge bases, requires exactly one, re-verifies all three objects, and then calls inventory with only `mergeBaseOid`/`headOid`.
- **Dirty exclusion:** no filesystem content read exists in the comparison/inventory/object path. Worktree `status` is only a label probe (`candidates.ts:207-216`). Blob availability accepts only full lower-case SHA-1/SHA-256 IDs and uses `cat-file --batch-command -Z` (`objects.ts:1-159`).
- **Behavior:** focused Git tests and the packaged ref-move/dirty-byte matrix passed.

## Capability Security and Token Non-Leakage Audit

- Token is 32 random bytes encoded base64url before app construction (`run.ts:132-138`).
- Fastify binds `127.0.0.1` on port `0`, validates the actual address, then binds exact expected Host/Origin (`run.ts:153-172`).
- The global `onRequest` hook enforces bound state, exact Host, absent-or-exact Origin, and constant-time bearer comparison before routes/capability lookup/static work (`security.ts:60-113`; registration order `app.ts:34-42`).
- Routes are GET-only, have empty-query/additional-property-false schemas, and expose only `/api/session` and `/api/files/:fileId` (`routes.ts:7-51`).
- Denials use one generic body; diagnostics contain only random correlation ID plus internal reason (`security.ts:77-86,121-139`).
- Fragment bootstrap erases the token synchronously with `history.replaceState`; requests use same-origin credentials, `no-store`, and `no-referrer` (`client.ts:44-65`).
- Packaged security behavior passed: cleared hash; token absent from request URL, bodies, browser console, and error output; missing/wrong bearer 401; hostile Host/Origin 403; unknown capability 404; arbitrary fields 400.

## Behavioral Spot-Checks

| Behavior | Command | Observed result | Status |
| --- | --- | --- | --- |
| Exact approved direct graph is installed | `npm ls --depth=0` | 14 exact direct packages, matching `package.json`; exit 0 | PASS |
| Final packaged Phase 1 acceptance matrix | `npm run test:package -- tests/e2e/pinned-session.spec.ts` | 6 tests passed in 12.3s | PASS |
| Responsive/focus/accessibility production contract | `npm run test:package -- tests/e2e/responsive-session.spec.ts` | 1 test passed in 2.4s | PASS |
| Missing low-level Git/unit/API/CLI contracts | `npx vitest run tests/git tests/unit tests/api tests/cli` | 12 files, 109 tests passed | PASS |
| Production tarball build/inventory | `npm pack --dry-run` | build succeeded; generated runtime and hashed assets packed | PASS |
| Exact freshly built tarball file set | `npm pack --dry-run --json --ignore-scripts` | 27 entries: `package.json`, `dist/bin`, 22 compiled CLI/contracts/domain/Git/server modules, `dist/web/index.html`, one hashed JS, one hashed CSS; no tests/planning/TS/Vue source | PASS |
| Verification-only acceptance commit scope | `git show --format='%H %s' --name-only c62ff79` | only `tests/e2e/pinned-session.spec.ts` | PASS |

### Package Inventory

The successful exact inventory command returned:

```text
dist/bin/diff-review.mjs
dist/cli/confirm.js
dist/cli/picker.js
dist/cli/run.js
dist/contracts/api.js
dist/contracts/comparison.js
dist/domain/errors.js
dist/domain/path-bytes.js
dist/domain/source.js
dist/git/availability.js
dist/git/candidates.js
dist/git/comparison.js
dist/git/inventory.js
dist/git/numstat.js
dist/git/objects.js
dist/git/raw-diff.js
dist/git/repository.js
dist/git/runner.js
dist/server/app.js
dist/server/capabilities.js
dist/server/lifecycle.js
dist/server/routes.js
dist/server/security.js
dist/web/assets/index-CeOr2iMg.js
dist/web/assets/index-CmnGGrCP.css
dist/web/index.html
package.json
```

## Probe Execution

No PLAN or SUMMARY declares a `probe-*.sh`, PASS-marker migration probe, or conventional project probe. Probe execution is not applicable; executable behavior is covered directly by the generated-package Playwright commands above.

## Requirements Coverage

All 23 Phase 1 requirement IDs in `ROADMAP.md:20-36` are owned by a PLAN. There are no orphaned or unclaimed Phase 1 requirements.

| Requirement | Owner | Status | Implementation and command evidence |
| --- | --- | --- | --- |
| SEL-01 | 01-02 | VERIFIED | Canonical nested worktree discovery in `repository.ts:143-214`; nested real-Git and packaged matrix cases passed. |
| SEL-02 | 01-05 | VERIFIED | Typed missing Git/non-worktree/bare/empty/version/protocol errors in repository/comparison; focused error matrix passed. |
| SEL-03 | 01-04 | VERIFIED | Native branches + every registered worktree, including detached/unavailable, in `candidates.ts`; picker tests passed. |
| SEL-04 | 01-04 | VERIFIED | Type/label/path/short-OID/detached/dirty/unavailable row copy in `picker.ts:108-205`; CLI/Git tests passed. |
| SEL-05 | 01-02 | VERIFIED | Base-first/head-second picker and ordered comparison mapping in `picker.ts`/`run.ts`; CLI tests passed. |
| SEL-06 | 01-05 | VERIFIED | Full-OID equality rejection with head recovery in `comparison.ts:198-207`; focused test passed. |
| SEL-07 | 01-04 | VERIFIED | Dirty probe is label-only; confirmation/browser explain committed HEAD and excluded staged/unstaged/untracked bytes; packaged dirty assertions passed. |
| SEL-08 | 01-03 | VERIFIED | Bind → print URL/instructions → browser-open order in `run.ts:153-187`; generated CLI and fallback behavior passed. |
| CMP-01 | 01-02 | VERIFIED | Native `merge-base --all baseOid headOid`; inventory runs `mergeBaseOid`→`headOid`; all four packaged orderings matched independent Git. |
| CMP-02 | 01-02 | VERIFIED | Full base/head/merge-base IDs in comparison/session and identity panel; packaged full-ID assertions passed. |
| CMP-03 | 01-05 | VERIFIED | Distinct unrelated/multiple-base/missing-object failures; real-DAG matrix passed. |
| CMP-04 | 01-06 | VERIFIED | Complete raw status/mode/blob inventory plus unsupported preservation; real-Git status matrix passed. |
| CMP-05 | 01-06 | VERIFIED | Native `--numstat -z` counts, null binary counts, exact join; unit/real-Git and packaged count assertions passed. |
| CMP-06 | 01-02 | VERIFIED | Full OID-only diff/object reads; moving refs and all dirty-byte classes excluded in focused and packaged tests. |
| CMP-07 | 01-06 | VERIFIED | Byte-exact NUL parsing/base64url authority and control-safe display; difficult/invalid/colliding path tests passed. |
| CMP-08 | 01-11 | VERIFIED | Deliberate zero-change state with identities and `0 changed files`; packaged empty-state test passed. |
| CMP-09 | 01-07 | VERIFIED | Precise binary/non-UTF-8/oversized/submodule/symlink/mode/object reason matrix; unit/real-Git/packaged tests passed. |
| DIFF-01 | 01-10 | VERIFIED | Accessible deterministic tree, path/status/count/availability, pointer/keyboard opaque-ID navigation; browser and model tests passed. |
| DIFF-06 | 01-12 | VERIFIED | Reason-specific metadata-only placeholders for unsupported/unavailable entries; packaged test asserts no editor and all reasons. |
| SAFE-01 | 01-03 | VERIFIED | Exact `127.0.0.1`, port `0`, actual-address validation; packaged process launch passed. |
| SAFE-02 | 01-08 | VERIFIED | Token/Host/Origin gate before API work, generic denial; API and packaged security tests passed. |
| SAFE-03 | 01-08 | VERIFIED | Strict read-only session/opaque-file capability grammar; arbitrary capability/query authority fails closed. |
| SAFE-05 | 01-03 | VERIFIED | Idempotent SIGINT shutdown aborts/closes once and exits 130; packaged process test passed. |

## Anti-Patterns and Adversarial Review

| Finding | Classification | Evidence and disposition |
| --- | --- | --- |
| No `TBD`, `FIXME`, `XXX`, `TODO`, `HACK`, or production placeholder/debt marker in Phase 1 implementation files | Clean | Scoped phase-file scan returned only the legitimate `return null` binary-numstat representation at `src/git/numstat.ts:38` and a test title containing “placeholder”; neither is a stub/debt marker. |
| Final packaged ordering test alone bypasses the interactive picker by supplying serialized selections | Disconfirmation check, resolved | It is not sufficient evidence for SEL-03–SEL-07 by itself. The independent focused command included `tests/git/candidates.test.ts` and both `tests/cli/*.test.ts`; all passed against actual picker/discovery/recovery code. |
| Packaged suite does not isolate every malformed raw/numstat grammar or object-classification precedence edge | Disconfirmation check, resolved | The focused command included `inventory-protocol.test.ts`, `inventory.test.ts`, and both availability suites; all passed. |
| Runner timeout/stdout-limit/stderr-limit process branches have no standalone behavioral test | INFO, non-blocking | Source inspection verifies bounded counters, abort/kill, and typed errors at `runner.ts:86-229`; Phase 1 requirements rely on shell-free Git authority/cancellation, both of which are wired and behavior-covered. This does not make any declared truth behavior-unverified. |

## Human Verification Required

None. The phase has no subjective visual-quality acceptance criterion or external service integration. Its browser, responsive, focus, ARIA, state-transition, security, and shutdown contracts are objective and were exercised in a real Chromium process against the generated production package. No must-have remains present-but-behavior-unverified.

## Gaps Summary

No blocking gaps, warnings, unowned requirements, deferred Phase 1 items, or verification overrides were found.

---

_Verified: 2026-07-20T19:15:50Z_  
_Verifier: the agent (gsd-verifier)_
