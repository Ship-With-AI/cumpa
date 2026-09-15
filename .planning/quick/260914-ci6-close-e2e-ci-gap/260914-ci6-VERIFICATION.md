---
quick_task: 260914-ci6
verified: 2026-09-14
reverified: 2026-09-14
verdict: PASS-WITH-CONCERNS
score: 7/7 must-have truths verified
blocking_findings: 0
advisory_findings: 2
---

# Quick Task 260914-ci6 — Verification

## Verdict: PASS-WITH-CONCERNS

All goal-backward must-haves are now verified. The prior blocking saved-focus regression was corrected in `505ba43` and is pinned by a deterministic fail-first unit test. The concerns are advisory only: a single green real Ubuntu CI run is strong evidence but not a repeated flake study, and an older integration test title overclaims the focus behavior it asserts.

## Goal-backward must-haves

| Must-have truth | Status | Actual evidence |
|---|---|---|
| Repository gate runs every non-custody Playwright spec and still blocks deployment | VERIFIED | `.github/workflows/deploy-supabase-production.yml:30` has one `npx playwright test`; `deploy-production` retains `needs: repository-gates` at line 40. The real Ubuntu CI run `34832230537` was green. |
| Custody specs have a single exact source of truth and no spec is orphaned | VERIFIED | `playwright.runtime-artifact.config.ts:3-8` exports the only `custodyGatedSpecs`; `playwright.config.ts:2,7` imports it as `testIgnore`. Main list was **94 tests / 17 files**, custody list **14 / 4**, and `git ls-files 'tests/**/*.spec.ts'` returned **21** files: 17 + 4, disjoint. |
| Full non-custody browser suite is green | VERIFIED | Local Darwin run: **94 passed, 0 failed, 0 skipped**, 2.2 minutes, one worker. Real Ubuntu CI `34832230537`: **90 passed, 4 skipped**, green. |
| Selected row is the roving-tabindex row without focusing hidden files | VERIFIED | `src/web/model/file-tree.ts:174-191` uses `fileRowId()` and changes focus only for visible rows; `handleKey` keeps the visible-row guard at `:193-203`. `App.vue:1184` → `FileTree.vue:138-146` wires the load selection path, and `file-tree.spec.ts:297` passed in the 94-test run. |
| In-flight initial-diff composer activation survives readiness | VERIFIED | `src/web/monaco/diff-adapter.ts:189-198` preserves only a same-file in-flight composer. Reverting only the original `1d8b990` source hunk in a disposable worktree made the anchor regression fail: expected `{ fileId: 'file_a', side: 'head', line: 10 }`, received `undefined`. |
| Saved focus restores independently of a saved composer after A → B → A | VERIFIED | `src/web/monaco/diff-adapter.ts:189-195` now uses `inFlightComposer` only for a same-file activation that occurs while its first diff is pending. Otherwise it selects `saved?.composer` independently and restores `saved?.focused`. `tests/unit/monaco-diff-adapter.test.ts` is **3/3 passed**. Reverting only `505ba43`'s source hunk made its new focus test fail at `:161`: expected head `setPosition({ lineNumber: 11, column: 1 })`, received no head positioning. |
| Baselines remain green | VERIFIED | Previous local checks: Vitest **65 files / 523 passed**, all three requested TypeScript checks passed, Deno **17 passed**. After the permanent focus regression was added, real Ubuntu CI recorded Vitest **521 passed / 3 skipped (524)** and Deno **17 passed**. |

## A. Workflow gate and anti-narrowing contract — VERIFIED

The repository-gates job contains the only Playwright command, `npx playwright test`, in its original test-gate position. There is no second Playwright command; `deploy-production` still needs `repository-gates`.

The workflow contract remains consistent at all required sites:

- `scripts/verify-supabase-support.mjs:1730` required substring;
- `scripts/verify-supabase-support.mjs:1738` exact command set;
- `scripts/verify-supabase-support.mjs:1747` repository-gates command set;
- `tests/e2e/support-payment.spec.ts:224` narrowing mutation case.

Observed independently before re-verification:

```text
node scripts/verify-supabase-support.mjs --verify-workflow .github/workflows/deploy-supabase-production.yml
exit 0; no output

node scripts/verify-supabase-support.mjs --verify-workflow /tmp/ci6-narrowed-workflow.yml
exit 1; supabase support verifier rejected: workflow is missing required npx playwright test
```

The scratch workflow copy differed from the real workflow only by replacing the full command with `npx playwright test tests/e2e/support-payment.spec.ts`.

## B. Exact partition — VERIFIED

Sequential list results were **94 tests in 17 main files** and **14 tests in 4 custody files**. The four custody patterns are exact `*.spec.ts` filenames—`package-assets`, `agent-ready-export`, `public-support-states`, and `marketplace-review`—so they do not absorb siblings: `agent-ready-export-safety.spec.ts` appeared in the main list. The list source is exported once by the custody config and imported by the main config; it is not duplicated in the configs.

## C. Host suite and skips — VERIFIED

The local Darwin suite had **0 skips**, hence no local skip was unexplained. The four platform-conditional declarations all provide the same concrete reason, verified against `node_modules/open/index.js:151-152,218-239`: `open` is PATH-resolved on Darwin, while Linux uses the bundled absolute `xdg-open`.

1. `tests/e2e/anchored-review.spec.ts:215` — anchored-review opener invocation.
2. `tests/e2e/pinned-session.spec.ts:540` — valid pinned-session opener invocation.
3. `tests/e2e/pinned-session.spec.ts:566` — invalid pinned-session non-invocation.
4. `tests/e2e/complete-review-draft.spec.ts:826` — fixed draft-reveal opener invocation.

The actual Ubuntu CI result was **90 passed / 4 skipped**, matching exactly those four platform-honest tests. Their cross-platform behavior remains outside the skip blocks: loopback URL, browser UI, and fixed-reveal HTTP behavior are asserted on Linux.

## D. Product fixes

### File tree — VERIFIED

The model-level fix is substantive, not a test accommodation. `selectFile()` sets the roving row only if its `fileRowId()` is in `frozenVisibleRows`; hidden selection leaves a visible keyboard focus target. `tests/unit/file-tree.test.ts:343-379` covers visible and hidden paths. `file-tree.spec.ts:330-333` still strictly requires the selected tree item to be `tabindex="0"` and passed in the full browser run.

### Composer race and focus restore — VERIFIED

The original race regression remains real: it fails if the `1d8b990` source hunk is removed. The earlier focus regression is resolved by `505ba43`:

```ts
const inFlightComposer = this.activeComposer?.fileId === file.id
  ? this.activeComposer
  : undefined;
const activeComposer = inFlightComposer ?? saved?.composer;
this.focused = inFlightComposer === undefined
  ? saved?.focused
  : { side: inFlightComposer.side, line: inFlightComposer.line };
```

This branch is reachable only after `setFile(file)` has set `currentFile`, while awaiting that same file’s first `onDidUpdateDiff`, and an anchor is activated during that await. On normal A → B → A restoration, `activeComposer` belongs to B or is absent, so `inFlightComposer` is `undefined`; the code restores both the saved A composer and the independently saved A focus.

The permanent unit test does not merely inspect fields. It loads A, activates base line 10, fires the registered head cursor listener at line 11, switches to B and back to A, then asserts both restored base anchor and modified-editor `setPosition({ lineNumber: 11, column: 1 })`. Current focused run: **3 passed**. In a disposable worktree, reversing only the `505ba43` source hunk made that test fail exactly as expected. The worktree was removed afterwards.

### Historical B-001 — RESOLVED

**Original finding (blocking at first verification):** `1d8b990` replaced `saved?.focused` with the active composer position for every restoration (`src/web/monaco/diff-adapter.ts:192-194` at that revision). A base:10 composer plus head:11 saved focus was restored to base:10 after A → B → A.

**Resolution:** `505ba43 fix(web): restore saved focus independently from composer` restricts focus derivation to the pending initial same-file-diff race only. The new deterministic regression proves the former mismatch behavior and fails again when the correction is removed. **Status: RESOLVED; no blocker remains.**

## E. Assertions were not weakened — VERIFIED

| Change | Evidence |
|---|---|
| `a60c7b4` font serialization | `src/web/styles.css:47` retains authored `--font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`; `responsive-session.spec.ts:962-969` accepts only Chromium’s two legitimate serialization forms and strictly checks five selectors’ metrics/family. A changed font stack fails the regex. |
| `7e3e476` Monaco zones | `tests/integration/monaco-anchor.spec.ts:74-85` still demands both zones visible/non-null and top alignment within one pixel, including after text growth and resize (`:127-134`). Polling settles asynchronous layout but accepts neither timeout nor changed geometry. |
| `e06db2a` / `f8a725e` opener splits | Darwin blocks still require actual opener markers/arguments; Linux-neutral blocks still require loopback/browser/reveal behavior. No Linux assertion is vacuous. |

## F. Baselines — VERIFIED

| Command | Actual result |
|---|---|
| `npx vitest run --no-file-parallelism` | Local pre-correction: **65 files / 523 passed**; real post-correction CI: **521 passed / 3 skipped (524)** |
| `npm run typecheck:tests` | local exit 0 |
| `npx tsc --noEmit -p tsconfig.json` | local exit 0 |
| `npm run typecheck:web` | local exit 0 |
| `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests` | local **17 passed / 0 failed**; real CI **17 passed** |

## G. Records and scope — VERIFIED

`git diff 0fdc280^..bfd54eb -- .planning/STATE.md .planning/ROADMAP.md` showed exactly one new `260914-ci6 | Close e2e CI gap | 2026-09-14 | 0a1a359` STATE row and no ROADMAP change. The executor’s SUMMARY contains observed command/result values, not expected placeholders; its correction appendix records the focus fix without rewriting prior values.

At initial verification, `git status --short --untracked-files=all` showed staged 0, unstaged 0, and only pre-existing operator-owned `.gsd/`, `EVIDENCE.md`, `mockups/`, and quick-plan files. The historical change range did not stage, move, or delete those files. This verifier document is the sole verification artifact added by this task.

## Flake and defect-capture judgment

**Would the widened gate have caught the 1.5.1 composer draft-loss defect? Yes.** It now executes the formerly omitted `tests/integration/anchored-workspace.spec.ts:619` path and includes a deterministic adapter unit regression. The latter demonstrably fails without the race source hunk, so the combined gate catches the defect even if the original browser race does not reproduce on one attempt.

**Is it stable enough for every push to main? Yes, with normal watchfulness—not presently expected to be intermittently red.** Evidence now includes a 94/94 single-worker Darwin run and green real Ubuntu CI `34832230537` with 90 passed/4 explicit capability skips, 524 Vitest checks, and 17 Deno tests. The strict Monaco-zone assertions passed; their polling has bounded failure conditions rather than timeout tolerance. I would watch the asynchronous browser tests `tests/integration/anchored-workspace.spec.ts:619` (the original race), `tests/integration/monaco-anchor.spec.ts:127` (paired-zone geometry after layout), and the packaged CLI suites `anchored-review.spec.ts`, `pinned-session.spec.ts`, and `complete-review-draft.spec.ts`. Neither host run showed intermittent redness; no current evidence supports predicting a flaky main gate.

## Advisory findings

- **A-001 — `tests/integration/monaco-anchor.spec.ts:157-165`:** its title says it restores “focus side,” but it asserts composer text/anchor and diagnostics, not a deliberately divergent saved focus. The new unit test now supplies that missing deterministic contract; aligning the integration title/assertions can be future cleanup.
- **A-002 — CI confidence:** one real Ubuntu gate run is production-relevant proof but not a statistical flake study. Watch the listed async/package tests; this is not a reason to block the gate.
