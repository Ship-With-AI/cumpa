---
phase: quick
plan: 260723-mzp
type: execute
wave: 1
depends_on: []
files_modified:
  - src/cli/run.ts
  - tests/cli/errors.test.ts
  - tests/e2e/anchored-review.spec.ts
autonomous: true
requirements:
  - QUICK-260723-MZP
must_haves:
  truths:
    - "When CMUX_WORKSPACE_ID is present, the production browser URL opener awaits `cmux open <url>` through a shell-free argument array."
    - "When CMUX_WORKSPACE_ID is absent, browser URLs continue through the existing `open` package."
    - "Draft and export reveal targets continue through the existing system `open` adapter and are never routed to cmux."
    - "CLI unit tests and the packaged anchored-review E2E cannot launch a real browser, including when the parent test process is running inside cmux."
    - "The anchored-review fake `open` executable is executable and records the exact loopback URL it intercepts."
  artifacts:
    - path: "src/cli/run.ts"
      provides: "Environment-aware browser-URL routing while preserving the separate reveal adapter"
    - path: "tests/cli/errors.test.ts"
      provides: "Focused routing and fallback coverage with injected no-op process adapters"
    - path: "tests/e2e/anchored-review.spec.ts"
      provides: "Executable, observable fake opener and hermetic packaged Chromium proof"
  key_links:
    - from: "src/cli/run.ts browser URL default"
      to: "cmux CLI or open package"
      via: "CMUX_WORKSPACE_ID presence check and shell-free exact argv"
      pattern: "CMUX_WORKSPACE_ID"
    - from: "src/cli/run.ts revealDraftFile"
      to: "open package"
      via: "unchanged canonical-path reveal adapter"
      pattern: "open(canonicalPath)"
    - from: "tests/e2e/anchored-review.spec.ts generated CLI environment"
      to: "fake-bin/open"
      via: "CMUX_WORKSPACE_ID omission, PATH precedence, executable bit, and per-launch marker"
      pattern: "chmodSync"
---

<objective>
Make real CLI browser-URL launch cmux-aware without widening cmux routing to filesystem reveal targets, and close the packaged anchored-review harness leak that can escape to a real browser.

Purpose: Preserve normal system-browser behavior outside cmux, use the cmux-native URL route inside cmux, and make automated launch verification observably hermetic.
Output: One narrow CLI routing change, focused Vitest coverage, and one repaired packaged Playwright shim.
</objective>

<execution_context>
@/Users/alessandro/.agents/gsd-core/workflows/execute-plan.md
@/Users/alessandro/.agents/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/cli/run.ts
@tests/cli/errors.test.ts
@tests/e2e/anchored-review.spec.ts
@tests/e2e/complete-review-draft.spec.ts
@playwright.config.ts
@package.json
@.planning/phases/01-pinned-local-comparison/01-03-SUMMARY.md
@.planning/phases/03-complete-review-draft/03-07-SUMMARY.md

<interfaces>
`createLaunchRuntime` currently owns two deliberately separate defaults: `openBrowser(url)` for the printed loopback URL and `revealDraftFile(canonicalPath)` for the server-retained draft/export path. The existing `LaunchPinnedSessionDependencies.openBrowser` override is the hermetic unit-test seam and must retain precedence. Browser-open failure remains best effort after URL/fallback publication; reveal failure remains owned by the secured reveal capability.
</interfaces>
</context>

<constraints>
- Execute in the current main checkout. `workflow.use_worktrees=false` and `git.branching_strategy=none`; do not create or switch a branch or worktree.
- Keep scope to `src/cli/run.ts`, `tests/cli/errors.test.ts`, and `tests/e2e/anchored-review.spec.ts`; do not touch concurrent Phase 4 files.
- Add no dependency and no generic subprocess abstraction.
- Do not run formatters, linters, or project-wide test suites. Run only the two focused commands named below.
- Automated tests must inject or intercept every browser launch attempt; no test may invoke a real system browser or cmux process.
</constraints>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Route only production browser URLs through cmux</name>
  <files>src/cli/run.ts, tests/cli/errors.test.ts</files>
  <behavior>
    - With an environment object that has no `CMUX_WORKSPACE_ID` own/inherited value, the existing system URL opener receives the exact loopback URL once and the cmux command adapter receives no call.
    - With `CMUX_WORKSPACE_ID` present, including the empty string, the system URL opener receives no call and the command adapter receives executable `cmux` with the exact argument tuple `open`, URL.
    - The production command adapter is awaited, uses an executable plus argument array with no shell, and rejects into the existing bounded best-effort browser fallback.
    - An explicitly injected `LaunchPinnedSessionDependencies.openBrowser` remains the top-level override so existing unit tests never reach either real adapter.
    - `revealDraftFile(canonicalPath)` remains backed directly by the imported `open` package under every environment; filesystem paths are not passed to cmux.
    - Existing fragment-bearing URL publication and token-free post-launch diagnostics remain unchanged.
  </behavior>
  <action>Write focused Vitest cases first using injected spies for the environment, system opener, and command adapter; the cases must perform zero real process or browser work. Add one narrowly named browser-URL opener in `src/cli/run.ts` whose defaults read `process.env`, call the existing `open` package outside cmux, and invoke `cmux` with `['open', url]` through Node's shell-free child-process API when the environment key is present. Use presence (`!== undefined`), not truthiness. Wire only `createLaunchRuntime`'s default browser URL path to this function while preserving `dependencies.openBrowser` as the first override. Do not route, wrap, or otherwise change the separate `revealDraftFile` default: it must continue to call `open(canonicalPath)` exactly as today. Preserve URL-before-opener ordering, failure swallowing, fallback copy, shutdown behavior, and all public launch contracts.</action>
  <verify>
    <automated>node scripts/run-focused-vitest.mjs tests/cli/errors.test.ts</automated>
  </verify>
  <done>Focused tests prove both environment branches, exact cmux argv, override hermeticity, bounded failure behavior, and unchanged reveal ownership without spawning cmux or a browser.</done>
  <commit>Commit only `src/cli/run.ts` and `tests/cli/errors.test.ts` as `fix(260723-mzp): route browser URLs through cmux` after the focused command passes.</commit>
</task>

<task type="auto">
  <name>Task 2: Make the anchored packaged opener executable and observable</name>
  <files>tests/e2e/anchored-review.spec.ts</files>
  <behavior>
    - Every generated CLI child omits `CMUX_WORKSPACE_ID` entirely, rather than setting it to an empty value, so a cmux parent cannot divert the test away from `fake-bin/open`.
    - The copied fake `open` target has mode `0o755`, exits without opening anything, and writes its received arguments to a unique per-launch marker.
    - The E2E waits with a bounded poll until that launch's marker contains the exact published loopback URL before Playwright navigates to the URL itself.
    - A stale marker from another generated CLI cannot satisfy the assertion.
    - The existing headless Chromium review scenarios, packaging boundary, production-artifact verification, and cleanup remain unchanged.
  </behavior>
  <action>Follow the executable target-aware fake-opener precedent in `tests/e2e/complete-review-draft.spec.ts`. Import `chmodSync`, make the copied `fake-bin/open` executable after `copyFileSync`, and have the shim append JSON-encoded argv to a marker path supplied only in the generated child environment before it exits nonzero. Give each `RunningCli` its own marker path. Construct the child environment from inherited variables with `CMUX_WORKSPACE_ID` removed, not blank, retain fake-bin PATH precedence, and add only the marker variable. Extend the loopback-start helper with a bounded marker poll that proves the same exact URL was intercepted before returning it to the Playwright page. Keep the shim non-launching and do not modify `playwright.config.ts`.</action>
  <verify>
    <automated>npx playwright test tests/e2e/anchored-review.spec.ts --project=chromium --workers=1 --reporter=line</automated>
  </verify>
  <done>The focused packaged test builds and packs production output, observes the executable fake opener intercept each exact CLI URL, and completes its existing headless Chromium scenarios without any host-browser or cmux launch.</done>
  <commit>Commit only `tests/e2e/anchored-review.spec.ts` as `test(260723-mzp): keep packaged browser launch hermetic` after the focused packaged command passes.</commit>
</task>

</tasks>

<source_audit>

| Source | ID | Feature / requirement | Task | Status | Notes |
|---|---|---|---|---|---|
| GOAL | QUICK-260723-MZP | cmux-aware browser URL routing plus E2E leak fix | 1, 2 | COVERED | One atomic quick task; no phase scope added. |
| REQ | ROUTE-01 | Present cmux workspace uses `cmux open <url>` | 1 | COVERED | Exact shell-free argv and presence semantics tested. |
| REQ | ROUTE-02 | Outside cmux retains `open` package URL behavior | 1 | COVERED | System-opener branch tested. |
| REQ | REVEAL-01 | Draft/export reveal behavior stays unchanged | 1 | COVERED | Separate canonical-path adapter remains on `open`. |
| REQ | HERMETIC-01 | Automated tests never launch real browser/cmux | 1, 2 | COVERED | Unit adapters are injected; E2E strips cmux env and proves fake interception. |
| REQ | E2E-01 | Anchored fake opener is executable and focused packaged E2E passes | 2 | COVERED | `0o755`, per-launch marker, exact URL observation. |
| RESEARCH | — | No research artifact for this quick task | — | N/A | Existing code and packaged-test precedent are sufficient Level 0 discovery. |
| CONTEXT | — | No quick CONTEXT.md decision artifact | — | N/A | User contract and repository workflow settings are represented above. |

</source_audit>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| Process environment → URL launcher | `CMUX_WORKSPACE_ID` selects one of two local launch mechanisms. |
| Generated loopback URL → child process argv | Fragment bearer is sensitive and must be passed exactly without shell interpolation or diagnostic echo. |
| Packaged test process → workstation GUI | An un-intercepted opener would escape the test sandbox and launch a real browser. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-QUICK-01 | Tampering / Elevation | cmux subprocess | mitigate | Fixed executable `cmux`, fixed `open` verb, exact URL argument array, no shell. |
| T-QUICK-02 | Information Disclosure | opener failure diagnostics | mitigate | Preserve existing bounded fallback and do not surface child errors or fragment-bearing URL after publication. |
| T-QUICK-03 | Elevation | draft/export reveal | mitigate | Keep canonical filesystem reveal on its existing server-retained `open` adapter; cmux router is URL-callsite-only. |
| T-QUICK-04 | Denial / Test escape | anchored-review harness | mitigate | Remove inherited cmux selector, executable PATH shim, unique marker, bounded poll, headless Playwright. |
| T-QUICK-SC | Tampering | package supply chain | accept | No package install or dependency change. |
</threat_model>

<verification>
Run, in order, only:
1. `node scripts/run-focused-vitest.mjs tests/cli/errors.test.ts`
2. `npx playwright test tests/e2e/anchored-review.spec.ts --project=chromium --workers=1 --reporter=line`

The second command's existing `beforeAll` is the packaged smoke path: production build, production-artifact verification, `npm pack`, generated CLI launch, fake-opener interception, and headless browser review. Do not run formatters, linters, broad Vitest categories, the full Playwright suite, or any project-wide test command.
</verification>

<success_criteria>
- The cmux branch is selected solely by presence of `CMUX_WORKSPACE_ID` and issues exactly `cmux open <url>` without a shell.
- The non-cmux browser URL path and browser-launch failure semantics remain unchanged.
- Draft/export reveal continues using the existing system `open` behavior and never cmux.
- Focused unit coverage executes no real process/browser launch.
- Focused packaged E2E proves its executable fake opener intercepted every exact URL and no inherited cmux state can bypass it.
- Exactly two narrow implementation commits are produced; no branch, worktree, unrelated Phase 4 file, formatter, linter, or broad suite is involved.
</success_criteria>

<output>Create `.planning/quick/260723-mzp-keep-automated-browser-tests-hermetic-an/260723-mzp-SUMMARY.md` with the two commit hashes and focused-command results.</output>
