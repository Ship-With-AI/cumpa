---
phase: 08-semantic-visual-foundation
plan: "07"
subsystem: audit-remediation
status: complete
commits: []
requires:
  - phase: 08-semantic-visual-foundation
    provides: canonical semantic token root and browser contract gates
provides:
  - Monaco code typography derived from the canonical root
  - Distinct modified, added, and deleted state roles
  - Explicit contract deferrals for later-phase token consumers
  - Fresh-build browser test command
  - Honest dispositions for non-executable audit-process threats
affects:
  - VIS-01
  - VIS-02
  - VIS-03
tech-stack:
  added: []
  patterns:
    - Declare a canonical token only with a current CSS or Monaco consumer.
    - Defer a contract role to its owning phase when no current consumer exists.
key-files:
  created:
    - .planning/phases/08-semantic-visual-foundation/08-07-SUMMARY.md
  modified:
    - src/web/styles.css
    - src/web/monaco/diff-adapter.ts
    - src/web/monaco/theme.ts
    - scripts/css-token-contract.mjs
    - tests/unit/monaco-diff-adapter.test.ts
    - tests/unit/monaco-theme.test.ts
    - tests/e2e/responsive-session.spec.ts
    - package.json
    - .planning/phases/08-semantic-visual-foundation/08-UI-SPEC.md
    - .planning/phases/08-semantic-visual-foundation/08-04-PLAN.md
    - .planning/phases/08-semantic-visual-foundation/08-05-PLAN.md
key-decisions:
  - Keep the no-unconsumed-token gate; defer later surface roles in the contract instead of declaring dead tokens.
  - Accept historical-baseline recording and clean-tree contract-immutability as process risks because a local executable control would not provide independent evidence.
---

# Phase 08 Plan 07: Audit Remediation Summary

**Monaco, status semantics, and the token contract now share one consumed canonical root; remaining later-surface roles are explicitly deferred.**

## Finding Disposition

| Finding | Action | Evidence |
|---|---|---|
| UI review priority 1 — contract inventory diverged from the canonical root | Declared and consumed `--surface-gap`, `--border-overlay`, `--interactive-accent-emphasis-hover`, `--text-selection-background`, status modified/added/deleted triplets, and `--space-3`. Deferred `--space-5`, `--space-12`, `--space-16`, and each later geometry role to Phase 09, 10, or 11 by owner. Recorded the display-role exemption. | `styles.css`; `theme.ts`; `08-UI-SPEC.md` implementation-disposition tables; `npm run verify:semantic-css` passed with the no-unconsumed-token gate intact. |
| UI review priority 2 — modified state used warning yellow | Separated `.status-badge--modified` from dirty/unsupported warning styling and applied the approved blue foreground, selected background, and selected border. Added and deleted badges/line counts use their own approved triplets. | `styles.css`; browser canonical-root assertions; semantic gate passed. |
| UI review priority 3 — Monaco ignored code typography roles | Parsed the shared virtual root in the diff adapter and supplied Monaco `fontFamily`, `fontSize`, and `lineHeight`. Added a unit assertion that derives all three expected editor options from the root. | `diff-adapter.ts`; `monaco-diff-adapter.test.ts`; focused Vitest run passed. |
| T-08-05-01 — stale build browser suite | Bound `test:browser` to one `build:web` before Playwright, preserving selected-spec ergonomics. | `package.json`; targeted browser invocation showed `build:web` then 13 passing tests. |
| T-08-04-05 — historical baseline recording | Changed from aspirational mitigation to accepted process risk: mutable local baseline output cannot prove historical state; the existing summary is the audit evidence. | `08-04-PLAN.md` threat-model row. |
| T-08-05-05 — clean-tree contract immutability | Changed from aspirational mitigation to accepted process risk: clean-tree checks cannot distinguish valid coordinated contract/test edits from collusion and conflict with testing intended source changes. Canonical-root parity and browser painting checks remain executable. | `08-05-PLAN.md` threat-model row. |

## Monaco Runtime Observation

The fresh-build packaged-app responsive run launched the generated `dist/bin/cumpa.mjs` and asserted the rendered modified Monaco `.view-line` computed **`font-size: 13px`** and **`line-height: 26px`**, both resolved from the root code-role tokens rather than Monaco defaults.

## Verification

| Command | Result |
|---|---|
| `npm run verify:semantic-css` | Passed; fresh web build and semantic audit completed. |
| `npx vitest run tests/unit/token-contract.test.ts tests/unit/monaco-theme.test.ts tests/unit/monaco-diff-adapter.test.ts` | Passed: 3 files, 15 tests. One initial watcher timeout reproduced as non-deterministic and the focused watcher test then passed before the final green run. |
| `npm run typecheck:web` | Passed. |
| `npm run build` | Passed. |
| `npm run test:browser -- tests/integration/monaco-anchor.spec.ts tests/e2e/responsive-session.spec.ts` | Passed: fresh `build:web` followed by 13 Playwright tests. |

## Scope

- `.planning/STATE.md` and `.planning/ROADMAP.md` were intentionally unchanged.
- The pre-existing ReviewPanel destructive-copy defect, file-tree tabindex failure, and environment-marker requirements were not modified.

## Deviations from Plan

None — this remediation followed the supplied audit assignment. The token-contract watcher timeout observed during an intermediate combined run was a pre-existing timing flake; its focused reproduction and final combined run passed without changing its test or implementation.

## Self-Check: PASSED

- The atomic completion commit includes this summary and every file named above.
- No declared token lacks a CSS/Vue or Monaco consumer; later-surface roles are contract deferrals rather than declarations.
