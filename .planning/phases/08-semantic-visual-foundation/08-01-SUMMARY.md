---
phase: 08-semantic-visual-foundation
plan: 01
subsystem: ui
tags: [vite, vitest, monaco, css-tokens]

requires:
  - phase: prior workspace theme
    provides: canonical CSS root and Monaco theme parity test
provides:
  - Pure semantic-token parsing and color byte normalization shared by browser and tests
  - Build-time canonical-root virtual module with a filesystem agreement gate
affects: [08-02, Monaco theme, browser style assertions]

tech-stack:
  added: []
  patterns: [Vite virtual module emits canonical root declaration text, pure token contract owns color normalization]

key-files:
  created:
    - src/web/theme/token-contract.ts
    - src/web/theme/virtual-tokens.d.ts
    - scripts/token-root-plugin.mjs
    - tests/helpers/canonical-root.ts
    - tests/unit/token-contract.test.ts
  modified:
    - vite.config.ts
    - vitest.config.ts
    - tsconfig.web.json

key-decisions:
  - "Keep the only color normalizer pure and restrict it to the two CSS forms the canonical root uses."
  - "Emit raw root declarations through the virtual module so browser, Vitest, and Playwright paths share the parser."

patterns-established:
  - "Canonical root delivery: Vite plugin reads styles.css at build time; Node tests use the shared filesystem helper."
  - "Parity gate: virtual and filesystem token maps must both be non-empty and exactly equal."

requirements-completed: [VIS-01, VIS-02]
duration: 12min
completed: 2026-09-13
status: complete
---

# Phase 08: Semantic Visual Foundation Summary

**A pure semantic-token contract now derives canonical lowercase color bytes while Vite injects the CSS root once for Monaco and test consumers.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-13T06:41:05Z
- **Completed:** 2026-09-13T06:52:59Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Added an I/O-free token parser, alias resolver, and shared CSS/Monaco color normalizers backed by synthetic, non-tautological tests.
- Added a tracked Vite virtual module and ambient declaration that expose canonical root declarations at build time.
- Added a filesystem reader and agreement test so Vite and Node consumers cannot silently derive divergent token maps.

## TDD Evidence

- **RED:** The new test failed before implementation with `Cannot find module '../../src/web/theme/token-contract.js' imported from .../tests/unit/token-contract.test.ts` (`ERR_MODULE_NOT_FOUND`), proving the missing contract import rather than an assertion mismatch.
- **GREEN:** `node node_modules/vitest/vitest.mjs run tests/unit/token-contract.test.ts --reporter=verbose` passed all 5 transform cases after the pure module and TypeScript inclusion were added.
- **REFACTOR:** No separate cleanup was needed; Task 3 added the build-tier delivery and agreement gate while preserving the passing contract.
- **Vitest plugin gate:** Removing `plugins: [rootPlugin(import.meta.dirname)]` from `vitest.config.ts` failed with `Cannot find package 'virtual:cumpa-tokens' imported from .../tests/unit/token-contract.test.ts` (`ERR_MODULE_NOT_FOUND`); the registration was restored before final verification.

## Verification

- `node node_modules/vitest/vitest.mjs run tests/unit/token-contract.test.ts tests/unit/monaco-theme.test.ts --reporter=verbose` — 8 tests passed.
- `npm run typecheck:web` — passed.
- `npm run build:web` — passed (only the pre-existing Vite chunk-size warning appeared).
- `tests/unit/monaco-theme.test.ts` remained green: 2 tests passed.
- `git diff --stat package.json` — empty; no dependency changed.

## Task Commits

Each task was committed atomically:

1. **Task 1: Failing behavioural spec for the pure token contract** — `564f48a` (`test`)
2. **Task 2: Implement the pure token contract to green** — `ca1f166` (`feat`)
3. **Task 3: Build-time and test-time delivery of the canonical root, gated for agreement** — `c4a8e51` (`feat`)

## Files Created/Modified

- `src/web/theme/token-contract.ts` — Pure token parsing, resolution, and color conversion contract.
- `src/web/theme/virtual-tokens.d.ts` — Type declaration for the virtual canonical-root module.
- `scripts/token-root-plugin.mjs` — Build-time reader for `styles.css` root declarations.
- `tests/helpers/canonical-root.ts` — Shared Node-side canonical root loader.
- `tests/unit/token-contract.test.ts` — Synthetic transform and reader-agreement tests.
- `vite.config.ts`, `vitest.config.ts` — Register the root plugin for browser builds and unit tests.
- `tsconfig.web.json` — Includes the contract and virtual module declaration in web typechecking.

## Decisions Made

- Kept color parsing deliberately narrow: six-digit hex and the canonical `rgb(r g b / n%)` form are the only supported inputs.
- Shared the root extraction expression by exporting it from the plugin for the Node helper, preventing reader-regex drift.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The plan's wrapper command `npm run test:unit -- tests/unit/token-contract.test.ts` did not terminate within 120 seconds during RED collection. The directly scoped Vitest invocation immediately produced the required unresolved-import failure and was used for RED/GREEN proof; all final targeted checks passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 08-02 can re-derive root token values using the shared contract without creating a second color parser or root reader.
- `STATE.md` and `ROADMAP.md` were intentionally unchanged; the orchestrator owns those updates.

## Self-Check: PASSED

---
*Phase: 08-semantic-visual-foundation*
*Completed: 2026-09-13*
