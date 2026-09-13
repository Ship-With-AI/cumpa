---
phase: quick
plan: 260913-nx0
subsystem: testing
tags: [typescript, tsc, vitest, playwright, ci]
requires:
  - phase: quick
    provides: existing Node and Vite TypeScript build projects
provides:
  - Node and web test TypeScript projects gated in production repository checks
  - Type-safe fixtures across the repository test suite
  - CI workflow verification that pins the aggregate test typecheck gate
affects: [ci, TypeScript tests, Supabase production workflow]
tech-stack:
  added: []
  patterns: [route tests by import graph to the matching module resolver, pin CI gates in both verifier and mutation tests]
key-files:
  created: [tsconfig.test.json, tsconfig.web.test.json, src/web/shims-vue.d.ts]
  modified: [.github/workflows/deploy-supabase-production.yml, scripts/verify-supabase-support.mjs, tests/e2e/support-payment.spec.ts]
key-decisions:
  - "Use two test projects because NodeNext and Vite Bundler module resolution cannot safely share the same test program."
  - "Run the aggregate test typecheck immediately after the build and before browser installation."
  - "Do not add a Vue SFC gate until vue-tsc supports the installed TypeScript 7 toolchain."
patterns-established:
  - "A workflow command added to repository-gates must update every verifier pin and its mutation-test row in the same commit."
requirements-completed: []
duration: 11min
completed: 2026-09-13
status: complete
---

# Quick Task 260913-nx0: Test Typecheck Coverage Summary

**Tests now typecheck under their actual Node or Vite resolver, and CI fails before browser suites when either test project has a diagnostic.**

## Performance

- **Duration:** 11min
- **Started:** 2026-09-13T15:40:58Z
- **Completed:** 2026-09-13T15:52:09Z
- **Tasks:** 13
- **Files modified:** 23 implementation/config/test files, plus this summary and project state

## Accomplishments

- Added `tsconfig.test.json` and `tsconfig.web.test.json`, then routed tests by import graph rather than directory: the ten unit tests importing `src/web` compile in the web project. A single program cannot use both NodeNext and Vite Bundler resolution without rewriting imports or breaking Vite-only module forms.
- Reduced the measured test-project diagnostics from **58 Node + 66 web** to **0 + 0**. The source correction was `WorkspaceEvent` missing the dispatched and handled `'diff-ready'` variant; it was not papered over in tests.
- Added `npm run typecheck:tests` to the `repository-gates` job directly after `npm run build` and before Playwright installation, then moved all verifier contracts together in `a8dfcf9`.

## Task Commits

1. **T1: Create test TypeScript projects** — `6ac8ce8` (feat)
2. **T2–T11: Correct source and test diagnostic buckets** — `81a684c`, `f07bcd4`, `2cd43ae`, `b21dfbf`, `fd60cca`, `3bfc6f5`, `f2e2b51`, `8442b77`, `a7d05e8`, `b524211` (fix)
3. **T12: Wire the CI test-typecheck gate** — `a8dfcf9` (chore)
4. **T13: Record verification and close the quick task** — this documentation commit

## CI Contract Wiring

`a8dfcf9` changed all five necessary locations atomically:

1. `.github/workflows/deploy-supabase-production.yml` runs `npm run typecheck:tests` in `repository-gates` after `npm run build` and before browser installation.
2. `scripts/verify-supabase-support.mjs` requires the command as a workflow substring.
3. The same verifier pins it in the whole-workflow command set.
4. The verifier pins it in the `repository-gates` command set.
5. `tests/e2e/support-payment.spec.ts` has the matching mutation row with `expected: 'npm run typecheck:tests'`.

The workflow verifier accepted the repository workflow with both the production-environment/mode invocation and the bare invocation (both exited 0 with no output). Removing any one contract location makes the verifier or mutation test reject the workflow.

## Technical Findings

### Import-graph resolver split

The Node project inherits the repository Node configuration; the web project inherits the Vite-oriented Bundler configuration and Vite client types. This is required because Vite query imports such as Monaco `?worker` modules and `import.meta.env` are web-only, while the Node project must retain Node resolution. The ten web-importing unit tests therefore belong to the web project even though they live in `tests/unit`.

### `diff-ready` was a source bug

`src/web/App.vue:810` dispatches `{ type: 'diff-ready', fileId }`, and `src/web/model/workspace-state.ts` handles it around line 362. The union omitted that member, which made the handler narrow to `never` and produced 26 downstream diagnostics. Adding `Readonly<{ type: 'diff-ready'; fileId: string }>` fixed the source type and cleared those diagnostics without weakening any test.

### Bucket C: unreachable `launchComparison` stub

No production ordinary-action route reaches `RunCliDependencies.launchComparison`. In `src/cli/run.ts`, the TTY route invokes only `runCli(options)` at lines 544–546; non-TTY patch and revisions routes invoke attached sessions in the code starting at line 540, whose browser opening is internal to `launchAttachedSession` at lines 442 and 496. `launchComparison` is defined only for `runCli` at lines 626–627 and invoked there at line 738. The dead stubs and their vacuous `not.toHaveBeenCalled()` assertion were removed; the substantive `storageScope` and coordinator-status assertions remain. No dependency type was widened.

### Evidence writer and escape hatches

`scripts/write-acceptance-evidence.mjs` received JSDoc parameter annotations only, so `= []` defaults no longer infer `never[]`; writer behavior and the Phase 7 evidence JSON were unchanged. No new `any`, cast escape hatch, or TypeScript ignore directive was introduced anywhere in this quick task. The required `git grep` count for `as any`, `@ts-ignore`, and `@ts-expect-error` is **0**; pre-existing `as unknown as` uses outside this work remain untouched.

## Verification

- `npm run typecheck:tests` — passed; both `tsc --noEmit --project tsconfig.test.json` and `tsc --noEmit --project tsconfig.web.test.json` emitted no diagnostics.
- `npx tsc --noEmit --project tsconfig.json` — passed with no output.
- `npm run typecheck:web` — passed with no diagnostics.
- `npm run build` — passed.
- `npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-restore.spec.ts` — **12 passed** using one worker.
- Wave-2-edited browser specs, explicitly serial through the existing Playwright config — **44 passed** using one worker: `agent-ready-export-safety`, `review-panel-resolved`, `pinned-session`, `anchored-workspace`, `draft-recovery-ui`, and `monaco-anchor`.
- Full serial `npx playwright test tests/e2e tests/integration` selected 97 tests and reported **92 passed, 3 failed**. The wave-2 files all passed. One unrelated `file-tree.spec.ts` assertion expected selected-tree-item `tabindex="0"` but observed `"-1"`. Two operator-held-input specs could not run: `marketplace-review.spec.ts` requires `CUMPA_MARKETPLACE_URL_MARKER`; `public-support-states.spec.ts` requires `CUMPA_RUNTIME_CUSTODY_DIR`. They were not bypassed or reconfigured.
- `npx vitest run --no-file-parallelism` — **65 files, 520 tests passed**. There is no delta from 520: removing one vacuous assertion does not remove a test case.
- `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests` — **17 passed, 0 failed**.
- `node scripts/verify-supabase-support.mjs --verify-workflow .github/workflows/deploy-supabase-production.yml --require-environment production --expected-mode prelaunch-test` and its bare variant — both passed with no output.

## Residual Gap: Vue SFCs Are Not Checked

This gate intentionally does not claim complete `.vue` coverage. The Vue dispatch half of the `diff-ready` defect remains outside `tsc`; the newly checked model half catches only its contract side. The repository's `vue-tsc@3.3.7` cannot run against installed `typescript@7.0.2`: it imports the no-longer-exported `typescript/lib/tsc` subpath. The `*.vue` shim makes imports checkable as Vue `Component`s but does not check SFC props, emits, or templates.

A follow-up is warranted: retry a TypeScript-7-compatible `vue-tsc` on the next dependency bump and add a `typecheck:sfc` gate only when it runs. Pinning a second TypeScript toolchain just for this config-and-triage task would be unnecessary scope.

## Deviations from Plan

None — the CI wiring and close-out followed the plan. The complete e2e/integration command exposed one unrelated runtime assertion and two explicit operator-input gates; their exact status is recorded above without weakening assertions or changing runtime behavior.

## User Setup Required

None. No deployment, provider configuration, database mutation, sign-in, registry mutation, or push was performed.

## Next Phase Readiness

- The production repository gate now rejects test TypeScript diagnostics before long browser suites.
- Follow up on Vue SFC checking when the installed `vue-tsc` supports TypeScript 7.

## Self-Check: PASSED

- Summary exists at `.planning/quick/260913-nx0-test-typecheck-coverage/260913-nx0-SUMMARY.md`.
- Task commits `6ac8ce8`, `81a684c`, `f07bcd4`, `2cd43ae`, `b21dfbf`, `fd60cca`, `3bfc6f5`, `f2e2b51`, `8442b77`, `a7d05e8`, `b524211`, and `a8dfcf9` exist.
