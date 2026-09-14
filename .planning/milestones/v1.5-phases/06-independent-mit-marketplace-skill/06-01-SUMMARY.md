---
phase: 06-independent-mit-marketplace-skill
plan: "01"
subsystem: distribution
tags: [agent-skills, semver, node, preflight, tdd]
requires:
  - phase: 05-bootstrap-trusted-stable-publication
    provides: Verified public Cumpa 1.5.0 prerequisite
provides:
  - Dependency-free executable installed-Cumpa compatibility gate
  - Fail-closed version and subprocess boundary coverage
affects: [06-02, 06-03]
tech-stack:
  added: []
  patterns: [Executable-only tests with isolated PATH, String-safe canonical SemVer comparison]
key-files:
  created:
    - .kimi-code/skills/cumpa/scripts/check-cumpa.mjs
    - tests/cli/check-cumpa.test.ts
  modified: []
key-decisions:
  - Keep the checker executable-only with no exported test seams.
  - Compare the canonical minor component by decimal length and digit ordering without Number conversion.
  - Force-terminate timed-out version probes and keep all failure diagnostics on one recovery path.
requirements-completed: []
requirements-progress: [SKL-02]
duration: 14min
completed: 2026-09-11
status: complete
---

# Phase 6 Plan 01: Installed Cumpa Compatibility Gate

**A 33-line standard-library preflight accepts stable Cumpa >=1.5.0 <2.0.0 and fails closed without installing software or exposing probe diagnostics.**

## Performance

- Started: 2026-09-11T09:22:30+00:00
- Completed: 2026-09-11T09:37:11+00:00
- Duration: 14 minutes
- Tasks: 1
- Source/test files created: 2

## TDD and verification

- **RED — `7cba717`:** Added executable-only behavioral tests. The focused run failed all 24 cases because `check-cumpa.mjs` did not yet exist, not because tests were outside Vitest discovery.
- **GREEN — `ec8e559`:** Added the checker using only `node:child_process`. `npm exec --offline -- vitest run tests/cli/check-cumpa.test.ts` passed **1 file / 24 tests** in 19.82 seconds.
- **REFACTOR:** No further change was needed: there are no exported helpers, dependencies, alternate install paths or duplicated failure formatters.
- **Direct smoke:** `node .kimi-code/skills/cumpa/scripts/check-cumpa.mjs` returned `1.5.0` with exit 0 against the current PATH. This is a preflight smoke, not a new public-registry or browser proof.
- **Static check:** Focused LSP diagnostics for `tests/cli/check-cumpa.test.ts` returned OK.
- **TDD tracking:** The canonical phase checkpoint found one TDD plan with RED/GREEN commits and zero violations.

The executable checks only literal `cumpa --version` using an argument array, `shell: false`, a 10-second timeout, `SIGKILL` on timeout, and a 4 KiB output bound. It removes at most one terminal line ending and requires the full remaining output to be one canonical version. Stable build metadata is accepted; prereleases, noncanonical core components, labels, extra lines and malformed metadata are rejected. String-safe range comparison accepts arbitrarily large canonical minor/patch components within the bounded output without numeric overflow.

Failure writes exactly the selected installation command and Node.js 24+/Git 2.43.0+ prerequisite line, with nonzero exit and no accepted stdout. Tests independently exercise missing/non-executable probes, valid-looking stdout with a nonzero exit, signals, excessive diagnostic output, and a hanging probe that ignores SIGTERM. The timeout test alone has a 15-second deadline; the checker stays at 10 seconds. Owned PATH sentinels reject attempted Git/npm/npx side effects, and temporary test roots are cleaned.

## Scope and decisions

No application code, release bytes, manifest/dependency, provider, credential, installer, remote repository, Supabase configuration or existing review behavior changed. Accepted future 1.x fixture versions are compatibility-policy tests, not claims that those releases were published or independently verified.

SKL-02 is **in progress**, not fully completed: Plan 02 must wire the checker into the distributed skill, and Plan 03 must observe installed-target behavior. The summary therefore does not prematurely mark the whole requirement complete.

## Deviations and issues

No implementation scope deviation. The first plan executes inline under the single-task threshold, without creating a worktree. Older Git commits also named 06-01 belong to the historical Monaco theme plan; current checker/test paths had no prior production commits. No duplicate work was resumed.

## Next plan readiness

Ready for 06-02: author the thin four-agent skill, carry its exact MIT license, and freeze the external collection candidate. Installer/provider use and marketplace publication remain separately gated and unauthorized.

## Self-Check: PASSED

Both declared files were created and committed; RED and GREEN were observed; all 24 focused tests, the direct CLI smoke, focused diagnostics and TDD gate passed. No broad suite, build, formatter, installation or remote mutation was run for this plan.
