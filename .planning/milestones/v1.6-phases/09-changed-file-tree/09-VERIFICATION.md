---
phase: 09-changed-file-tree
verified: 2026-09-13
status: passed
score: 25/25 must-have truths verified; 5/5 requirements accounted for
human_verification_closed_by: .planning/phases/09-changed-file-tree/09-UI-REVIEW.md (live session, 2026-09-13)
---

# Phase 09 — Changed-File Tree Verification

## Goal verdict

**Functional goal achieved.** The changed-file tree has a real filtered projection, preserves selection and tree identity, exposes a single model-derived tab stop, and renders the dense tree chrome in the packaged browser. The focused phase browser run passed all 14 tests in `file-tree.spec.ts`, `responsive-session.spec.ts`, and `pinned-session.spec.ts` after a fresh web build.

The phase remains **`human_needed`** rather than `passed`: no automated check compares a rendered 1440×1000 or 420×900 surface to the approved mockup. The remaining human checks are listed below.

## Validation run

| Command | Result | Evidence |
|---|---|---|
| `npm run typecheck:web` | PASS | Exited 0. |
| `npm run verify:semantic-css` | PASS | Fresh Vite build completed; semantic CSS reported canonical root, retired vocabulary, and author-style invariants passed. |
| `npm run test:unit` | PASS | 29 files, 181 tests passed. |
| `npm run build` | PASS | Runtime and fresh web builds completed. |
| `npm run test:browser -- tests/e2e/file-tree.spec.ts tests/e2e/responsive-session.spec.ts tests/e2e/pinned-session.spec.ts` | PASS | Fresh build, 14 Chromium tests passed. |
| `npm run test:browser` | EXPECTED EXTERNAL FAILURE | 93 passed; only `marketplace-review.spec.ts` failed for missing `CUMPA_MARKETPLACE_URL_MARKER`, and `public-support-states.spec.ts` failed for missing `CUMPA_RUNTIME_CUSTODY_DIR`. Both are declared out of scope for this verification; no Phase 09 test failed. |

## Requirement ownership

`REQUIREMENTS.md:30-34` assigns TREE-01 through TREE-05 to Phase 09. Every ID is owned by at least one plan frontmatter:

| Requirement | Owning plans | Verdict |
|---|---|---|
| TREE-01 | 09-02, 09-03, 09-04, 09-05 | VERIFIED |
| TREE-02 | 09-01, 09-02, 09-03, 09-04, 09-05 | VERIFIED |
| TREE-03 | 09-01, 09-02, 09-03, 09-04, 09-05 | VERIFIED |
| TREE-04 | 09-01, 09-04, 09-05 | VERIFIED |
| TREE-05 | 09-01, 09-04, 09-05 | VERIFIED |

The ownership evidence is the five `requirements:` declarations in `09-01-PLAN.md:11`, `09-02-PLAN.md:13`, `09-03-PLAN.md:13`, `09-04-PLAN.md:13`, and `09-05-PLAN.md:11`. No Phase 09 requirement is unaccounted for.

## Roadmap success criteria

| # | Required observable truth | Verdict | Direct evidence |
|---|---|---|---|
| 1 | Dense rows show status, filename, signed counts, non-reviewable identity; directories show descendant counts. | VERIFIED | `FileRow.vue:56-70` renders status, basename path, `+`/`−` counts, and availability; `DirectoryRow.vue:30-40,63-64` recursively counts rendered descendants and announces singular/plural labels. The focused browser run passed the packaged row/count assertions; density is token-bound at `styles.css:130,953` and semantic CSS passed. |
| 2 | Nesting, compaction, ordering, default expansion, collapse/expand, selection, and full roving keyboard operation remain observable. | VERIFIED | `file-tree.test.ts:285-641` covers original tree navigation plus the model regressions; `FileTree.vue:90-121` routes Up/Down/Left/Right/Home/End/Enter/Space to the model. The packaged browser test covers keyboard traversal at `file-tree.spec.ts:297-437`; focused browser run passed. |
| 3 | Filtering keeps only matches and visibly expanded ancestors. | VERIFIED | Filtering is a pruned built-tree projection in `file-tree.ts:100-124,153-185`; the component renders `projectedTree` and `displayExpandedDirectoryIds` at `FileTree.vue:192-200`. Browser assertions collapse `collision/`, filter it, then observe `aria-expanded="true"` at `file-tree.spec.ts:494-499`; focused browser run passed. |
| 4 | No-match state explains recovery; clearing restores the tree and open selection. | VERIFIED | Recovery UI and clear action are present at `FileTree.vue:217-220`; selected row is revealed without refocusing at `FileTree.vue:74-85`. Packaged assertions verify zero rows/tab stops, exact recovery copy, restored selected opaque id, restored single tab stop, preserved collapsed directory, and no request at `file-tree.spec.ts:527-543`; focused browser run passed. |
| 5 | Desktop and narrow tree interiors retain dense hierarchy. | VERIFIED, structurally | `responsive-session.spec.ts:546-579,1168-1172` exercises 1440, 1280, and 420 widths, checking canonical row height, containment, indentation, descendant counts, signed counts, and page overflow. Focused browser run passed. Exact visual parity still needs the human comparison below. |

## PLAN must-haves

All 25 plan-frontmatter truths are satisfied. Evidence is code or executed behavior, not the plan summaries.

| Plan | Must-have verdict | Evidence |
|---|---|---|
| 09-01 | **6/6 VERIFIED:** full-path case-insensitive projection; stable surviving directories; filter-time collapse actually collapses; restoration preserves reviewer state; no-match preserves selection with no tab stop; selected visible row wins the sole tab stop. | Model API and derivation: `file-tree.ts:40-45,100-124,177-201,225-292`. Direct behavioral unit cases: `file-tree.test.ts:494-641`, including active-filter collapse at `:617-637` and restoration at `:535-556`. `npm run test:unit` passed all 181 tests. |
| 09-02 | **4/4 VERIFIED:** 34px dense reviewable row; grayscale-surviving selection rail; unchanged indent formula; every added token is canonical and consumed. | Token/root and dense row: `styles.css:118-140,952-981`; row components inject `8 + (level - 1) * 16px` at `DirectoryRow.vue:56` and `FileRow.vue:52`. `styles.css:981-990` creates the rail. `npm run verify:semantic-css` passed. |
| 09-03 | **5/5 VERIFIED:** basename-only row presentation retains full accessible identity; moves retain both basename displays and full move identity; recursive directory counts are spoken; directory labels end in `/`; colliding basenames remain independently selectable. | `PathText.vue:5-17`, `PathDisplay.vue:28-43`, `FileRow.vue:47-70`, and `DirectoryRow.vue:30-40,63-64`. Packaged assertions exercise renamed/copied names, escaped basename collisions, distinct opaque file requests, and directory labels at `file-tree.spec.ts:330-388`; focused browser run passed. |
| 09-04 | **5/5 VERIFIED:** header/filter/scroller/hint; narrowing projection; recovery; selection-preserving clear/reveal without focus theft; one visible Tab stop. | Tree composition and query transition: `FileTree.vue:65-91,151-222`; single-stop drilling: `DirectoryRow.vue:12-14,54,74,85` and `FileRow.vue:49`. `file-tree.spec.ts:468-550` verifies browser behavior. |
| 09-05 | **5/5 VERIFIED within the stated external-test exception:** packaged filtering/recovery/tab-stop proof; responsive interior proof; phase contract suites and semantic gate. | The focused fresh-build browser command passed all relevant 14 tests. Responsive helper and its three widths are at `responsive-session.spec.ts:546-579,1168-1172`; packaged filter/recovery proof is `file-tree.spec.ts:439-550`. Typecheck, semantic gate, unit suite, and production build all passed. The full browser command's only failures are the two declared environment-owned tests listed in Validation run. |

## Critical filter-state interaction

**Verified:** collapsing a surviving directory while a filter is active is not an `aria-expanded` lie.

- The model removes a query-collapsed directory from effective display expansion in `file-tree.ts:166-185`; `toggleDirectory` decides from that effective set and records the override at `:225-258`.
- `DirectoryRow.vue:52,67` binds both `aria-expanded` and rendered child group to the same `expanded` value.
- The focused unit contract at `file-tree.test.ts:617-637` passes: after `setQuery('alpha')`, collapse removes the directory from `displayExpandedDirectoryIds` and its matching leaf from visible rows; toggling again restores both.
- Clearing restores the reviewer-owned expansion set, proved by the passing unit contract at `file-tree.test.ts:535-556` and packaged browser restoration assertion at `file-tree.spec.ts:537-543`.

## Pinned-session assertion deviation

**Accepted as contract-preserving.** The old page-global assertion would prohibit every `input`, including the deliberately always-visible, non-review comment filter. The changed assertion at `pinned-session.spec.ts:1418` scopes the count to `main.review-main`, which is exactly the unavailable-diff/review-content surface selected in the preceding loop (`:1394-1416`). It still proves that an unavailable file exposes no editable comment/review control, while correctly permitting `Filter files` in the changed-files navigation. The focused run passed all 11 pinned-session tests.

## Phase boundary check

No Phase 10–12 **product restyle** was implemented.

- `git diff --name-only a1544a5^..HEAD` shows Phase source changes only in the tree model, tree/path components, tree CSS, and associated tests; it contains no diff-surface, shell, dialog, or comments-rail source component.
- The stylesheet delta is limited to tree tokens/selectors and tree chrome (`styles.css:928-1245`); it introduces no diff, shell, dialog, or comments-rail restyle.
- There is one non-tree **test-only** delta in `tests/integration/anchored-workspace.spec.ts`: it removes now-invalid full-path assertions after basename presentation and makes a Monaco geometry locator tolerate normal virtualization. It changes no product source and is not a Phase 10–12 restyle.

## Disconfirmation pass

- **Partial automated coverage:** the packaged browser test proves force expansion from a pre-filter collapse and restoration after clearing, but does not click-collapse a directory while the filter remains active. The direct passing unit contract plus the shared `aria-expanded`/`v-if` binding prove this transition; the live-browser version is retained as a human check.
- **Potentially misleading green test avoided:** a directory-count browser assertion over a fully matching directory would not prove counts follow a partial projection. The passing unit test `file-tree.test.ts:596-615` checks the recursive count on an actually pruned directory; `DirectoryRow.vue:30-38` folds the rendered projected children.
- **Empty/error path:** no-match keeps the `role="tree"` mounted while exposing recovery content (`FileTree.vue:187-220`), and the packaged browser test confirms zero treeitems and no tab stop (`file-tree.spec.ts:527-535`).

## Human verification

1. At **1440×1000** against nested changed files, compare the rendered tree to `mockups/01b-quiet-workspace-tree.html`: dense one-line rows; visible Files/count/Changed header order; filter immediately below; only inner tree scroller moves; selected rail; slash-suffixed directory counts; hint below the tree.
2. At **420×900**, open the existing Files host and confirm identical row density, indentation, signed counts, non-reviewable labels, and directory counts without horizontal page overflow or hidden information.
3. In a live browser, filter to a directory, click that surviving directory to collapse it, verify `aria-expanded="false"` and hidden descendants, then clear the filter. Confirm the reviewer’s own expansion state returns and the open file remains selected; focus must remain on the filter/clear control used.

No source, test, ROADMAP, or STATE file was modified during verification.

## Human verification — CLOSED 2026-09-13

All outstanding human checks were performed live against the shipped CLI (fresh `npm run build`, isolated Git fixture, ephemeral loopback session) by the Phase 09 UI audit. Evidence: `.planning/phases/09-changed-file-tree/09-UI-REVIEW.md`; captures under `.planning/ui-reviews/09-live-20260913` (gitignored).

| Check | Result | Observed |
|---|---|---|
| Reference-viewport comparison vs `mockups/01b-quiet-workspace-tree.html` | PASS | Desktop 288px, narrow 256px, compact 420px captures match the density/hierarchy/state contract; mockup shell differences are approved out-of-scope departures. |
| Collapse a surviving directory while a filter is active | PASS | Matching `src/` rows went 4 → 1 and `aria-expanded` became `false` — no aria lie. |
| Clearing the filter restores reviewer expansion + selection | PASS | Reviewer collapse returned, selected file persisted and remained the single tab stop. |
| Exactly one tab stop per state | PASS | unfiltered 1, filtered 1, no-match 0, cleared 1. |
| Clicking the decorative search glyph focuses the filter | PASS | Physical click at glyph coordinates focused `Filter files`. |

UI audit score: 24/24, zero blockers, zero warnings.
