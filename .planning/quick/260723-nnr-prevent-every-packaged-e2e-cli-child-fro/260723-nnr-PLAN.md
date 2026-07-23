---
phase: quick
plan: 260723-nnr
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/e2e/complete-review-draft.spec.ts
  - tests/e2e/file-tree.spec.ts
  - tests/e2e/pinned-session.spec.ts
  - tests/e2e/responsive-session.spec.ts
autonomous: true
requirements:
  - QUICK-260723-NNR
must_haves:
  truths:
    - "Every generated CLI child in the four remaining packaged E2E specs omits inherited `CMUX_WORKSPACE_ID`, including when the parent test process runs inside cmux."
    - "Each child still prepends its executable fake `open` shim to PATH, so production URL launch reaches the test shim rather than cmux or a workstation browser."
    - "All existing launch options, opener logs, terminal captures, recovery controls, and reveal-marker variables remain unchanged."
    - "The tests sanitize a per-child environment copy and never add, delete, or overwrite a property on `process.env`."
    - "The already-correct anchored-review isolation pattern remains the precedent and is not modified."
  artifacts:
    - path: "tests/e2e/complete-review-draft.spec.ts"
      provides: "Sanitized packaged CLI child environment with draft recovery and reveal controls preserved"
    - path: "tests/e2e/file-tree.spec.ts"
      provides: "Sanitized packaged CLI child environment with opener and terminal evidence preserved"
    - path: "tests/e2e/pinned-session.spec.ts"
      provides: "Sanitized packaged CLI child environment with immutable-session opener evidence preserved"
    - path: "tests/e2e/responsive-session.spec.ts"
      provides: "Sanitized packaged CLI child environment with responsive-session opener evidence preserved"
  key_links:
    - from: "each remaining spec's `startGeneratedCli`"
      to: "its generated CLI `spawn` call"
      via: "spread of a copied environment after deleting only `CMUX_WORKSPACE_ID`"
      pattern: "delete environment.CMUX_WORKSPACE_ID"
    - from: "each generated CLI child environment"
      to: "the suite's executable `fake-bin/open`"
      via: "existing fake-bin PATH precedence"
      pattern: "PATH:.*fakeBinRoot"
---

<objective>
Close the packaged E2E test escape left after cmux-aware production URL routing by applying the anchored-review child-environment isolation pattern to all four remaining generated-CLI launchers.

Purpose: Ensure a cmux-hosted parent test process cannot divert packaged browser-open behavior around the executable fake `open` shims, without disturbing concurrent Phase 4 UI work or any suite-specific launch controls.
Output: One mechanical four-file test-harness change, focused static TypeScript diagnostics, and serial packaged Chromium evidence.
</objective>

<execution_context>
@/Users/alessandro/.agents/gsd-core/workflows/execute-plan.md
@/Users/alessandro/.agents/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@tests/e2e/anchored-review.spec.ts
@tests/e2e/complete-review-draft.spec.ts
@tests/e2e/file-tree.spec.ts
@tests/e2e/pinned-session.spec.ts
@tests/e2e/responsive-session.spec.ts
@package.json
@tsconfig.json

<interfaces>
`tests/e2e/anchored-review.spec.ts` establishes the exact local pattern: inside `startGeneratedCli`, create `const environment = { ...process.env }`, delete `environment.CMUX_WORKSPACE_ID`, then spread `environment` into the generated child's `env` before overriding PATH and adding test-specific variables. The other four specs already create executable fake `open` shims and prepend `fakeBinRoot` to PATH, but currently spread `process.env` directly and therefore inherit cmux routing state.
</interfaces>
</context>

<constraints>
- Execute directly in the current main checkout. Do not create, switch, or use a branch or worktree.
- Modify only the four files in `files_modified`; anchored-review is read-only precedent, and source code, configuration, generated output, and concurrent Phase 4 UI files are out of scope.
- Preserve concurrent Phase 4 changes exactly. Do not rewrite surrounding code or run a formatter, linter, broad Vitest category, full Playwright suite, or project-wide test command.
- Do not add a shared helper or abstraction for this mechanical test-local change.
- Do not mutate `process.env`, and do not replace deletion with an empty-string assignment: the child environment must omit the key.
- Keep every fake PATH override and every existing suite-specific environment variable byte-for-byte equivalent in meaning and precedence.
- Run the serial packaged command only when no concurrent Phase 4 process is writing source or production build output; wait or coordinate rather than racing its per-suite `npm run build` and `npm pack` hooks.
</constraints>

<tasks>

<task type="auto">
  <name>Task 1: Sanitize all four remaining packaged CLI child environments</name>
  <files>tests/e2e/complete-review-draft.spec.ts, tests/e2e/file-tree.spec.ts, tests/e2e/pinned-session.spec.ts, tests/e2e/responsive-session.spec.ts</files>
  <behavior>
    - Each `startGeneratedCli` copies `process.env` into a fresh local object, removes `CMUX_WORKSPACE_ID` from that copy, and passes the sanitized copy to `spawn`.
    - A parent process with a defined `CMUX_WORKSPACE_ID`, including an empty string, cannot cause any of these generated children to select the production cmux opener.
    - The complete-review-draft child retains `DIFF_REVIEW_LAUNCH_OPTIONS` plus its conditional `NODE_ENV`, recovery-failure, reveal-marker, and reveal-success variables.
    - The file-tree child retains launch options, `DIFF_REVIEW_OPENER_LOG`, and `DIFF_REVIEW_TERMINAL_CAPTURE`.
    - The pinned-session child retains launch options, `DIFF_REVIEW_OPENER_LOG`, and `DIFF_REVIEW_TERMINAL_CAPTURE`, including its returned opener evidence path.
    - The responsive-session child retains launch options, its per-child randomized opener log, and terminal capture.
    - All four children retain `fakeBinRoot` at the front of PATH, and their existing executable fake `open` setup remains untouched.
    - `process.env` remains unchanged for the parent runner and subsequent children.
  </behavior>
  <action>In each named spec, make the same narrow edit immediately before its generated CLI `spawn`: declare a fresh `environment` object by spreading `process.env`, then delete only `environment.CMUX_WORKSPACE_ID`. Replace only the `...process.env` entry inside that spawn's `env` object with `...environment`. Follow the anchored-review implementation literally rather than introducing a helper, destructuring the global environment, blanking the key, or changing PATH construction. Retain all following env entries in their current order so the fake-bin PATH and suite-specific values continue to override inherited values. Do not touch fixture setup, executable fake opener contents or mode, browser assertions, build/pack hooks, cleanup, imports, or anchored-review. Before editing, account for concurrent Phase 4 working-tree changes and preserve any unrelated modifications in these files.</action>
  <verify>
    <automated>./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2024 --module NodeNext --moduleResolution NodeNext --strict --skipLibCheck --types node tests/e2e/complete-review-draft.spec.ts tests/e2e/file-tree.spec.ts tests/e2e/pinned-session.spec.ts tests/e2e/responsive-session.spec.ts &amp;&amp; npx playwright test tests/e2e/complete-review-draft.spec.ts tests/e2e/file-tree.spec.ts tests/e2e/pinned-session.spec.ts tests/e2e/responsive-session.spec.ts --project=chromium --workers=1 --reporter=line</automated>
  </verify>
  <done>All four spawn sites use a sanitized per-child environment copy, no direct `process.env` spread remains at those generated CLI launch sites, fake PATH and every test-specific variable are preserved, focused TypeScript diagnostics pass, and the four exact packaged E2E specs pass serially against their production build/pack path without a cmux or real-browser escape.</done>
  <commit>Commit only the four named specs as `test(260723-nnr): isolate packaged cli child environments` after both focused verification steps pass.</commit>
</task>

</tasks>

<source_audit>

| Source | ID | Feature / requirement | Task | Status | Notes |
|---|---|---|---|---|---|
| GOAL | QUICK-260723-NNR | Prevent every remaining packaged E2E CLI child from inheriting cmux routing state | 1 | COVERED | All four named generated-child spawn sites are included in one mechanical task. |
| REQ | ENV-01 | Copy `process.env`, delete `CMUX_WORKSPACE_ID`, and spread the sanitized object into each child env | 1 | COVERED | Uses anchored-review's established pattern exactly; never mutates the global object. |
| REQ | SHIM-01 | Preserve executable fake `open` PATH interception inside cmux-hosted test runs | 1 | COVERED | Existing fake-bin PATH precedence and shim setup remain unchanged. |
| REQ | VARS-01 | Preserve every existing test-specific child variable | 1 | COVERED | Task behavior enumerates each suite's launch, evidence, recovery, and reveal variables. |
| REQ | VERIFY-01 | Use focused diagnostics and exact serial packaged E2E verification only | 1 | COVERED | Exact-file `tsc` command plus four-spec Chromium command with one worker. |
| RESEARCH | — | No research artifact for this quick task | — | N/A | Existing code provides a complete Level 0 mechanical precedent. |
| CONTEXT | — | No quick CONTEXT.md decision artifact | — | N/A | User constraints and acceptance contract are encoded in objective, constraints, behavior, and verification. |

</source_audit>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| Parent test environment → generated CLI child | Inherited `CMUX_WORKSPACE_ID` changes production URL-opener selection unless removed before spawn. |
| Generated CLI child → workstation GUI | Bypassing the PATH shim can escape the automated harness into cmux or a real browser. |
| Concurrent Phase 4 work → packaged build output | Each selected E2E suite builds and packs production artifacts, so verification must not race an active writer. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-QUICK-01 | Tampering | Per-child environment | mitigate | Copy inherited variables, remove only the cmux selector, then apply existing explicit overrides in their original order. |
| T-QUICK-02 | Elevation / Test escape | Packaged browser URL launch | mitigate | Preserve executable fake-bin PATH precedence and prove all four exact packaged Chromium suites serially. |
| T-QUICK-03 | Tampering | Parent runner environment | mitigate | Delete from the fresh local copy only; never mutate `process.env`. |
| T-QUICK-04 | Denial / Integrity | Concurrent build output | mitigate | Run selected packaged suites with one worker only when concurrent Phase 4 build/source writers are inactive. |
| T-QUICK-SC | Tampering | Package supply chain | accept | No dependency or package install changes are planned. |
</threat_model>

<verification>
Run only these focused checks, in order:

1. Static diagnostics for exactly the four edited TypeScript specs:
   `./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2024 --module NodeNext --moduleResolution NodeNext --strict --skipLibCheck --types node tests/e2e/complete-review-draft.spec.ts tests/e2e/file-tree.spec.ts tests/e2e/pinned-session.spec.ts tests/e2e/responsive-session.spec.ts`
2. Once concurrent Phase 4 source/build writers are inactive, execute exactly the four packaged suites serially:
   `npx playwright test tests/e2e/complete-review-draft.spec.ts tests/e2e/file-tree.spec.ts tests/e2e/pinned-session.spec.ts tests/e2e/responsive-session.spec.ts --project=chromium --workers=1 --reporter=line`

The selected suites' existing `beforeAll` hooks provide production build and npm-pack evidence; do not add a separate broad build/test invocation. Do not run formatters, linters, broad Vitest categories, the full Playwright suite, or any project-wide test command.
</verification>

<success_criteria>
- Exactly four packaged E2E `startGeneratedCli` functions sanitize a copied environment and omit `CMUX_WORKSPACE_ID` before spawn.
- No implementation mutates `process.env`, blanks the selector, changes opener shim setup, or alters fake PATH precedence.
- All existing suite-specific environment variables remain present with their original conditions and values.
- Anchored-review, source code, configuration, generated output, and concurrent Phase 4 changes remain untouched.
- Exact-file TypeScript diagnostics pass, followed by the four exact Chromium specs passing with one worker and their existing production build/pack hooks.
- One narrow test commit is produced on main; no branch, worktree, unrelated file, formatter, linter, or broad suite is involved.
</success_criteria>

<output>Create `.planning/quick/260723-nnr-prevent-every-packaged-e2e-cli-child-fro/260723-nnr-SUMMARY.md` with the commit hash and both focused-command results.</output>
