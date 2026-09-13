# Phase 08 review-fix closure

## BL-01 — root extraction truncates comments

Closed by `scripts/css-token-contract.mjs`, the sole production brace/comment/string-aware CSS scanner. `tokenRootPlugin()` now extracts one context-free `:root`, rejects malformed/multiple roots, validates the exact canonical declaration set, and invalidates its virtual module when `styles.css` changes in a Vite dev server.

`tests/unit/token-contract.test.ts` uses `independentRootCss()` as a separate brace-aware oracle. It proves plugin output preserves a multiline comment containing `}`, a string containing `}`, rejects a missing `--border-control`, rejects duplicate `--surface-canvas`, and reloads a changed virtual module from an actual Vite dev server.

Observed rejection messages:

- `canonical root is missing --border-control`
- `canonical root declares duplicate token --surface-canvas`
- `unbalanced canonical :root token block`

## BL-02 — audit accepts runtime-invalid colours

Closed by the shared parser/normalizer. The semantic audit and browser `token-contract.ts` both consume `scripts/css-token-contract.mjs`. It resolves aliases with cycle detection and accepts semantic colour tokens only as lowercase `#rrggbb`, `#rrggbbaa`, or bounded `rgb(r g b / n%)` values. The audit self-check harness exercises out-of-range channels, fractional alpha, arbitrary values, unsupported functions, unknown aliases, uppercase hex, and alias cycles.

Observed rejection messages include:

- `token --surface-canvas must resolve to lowercase #rrggbb/#rrggbbaa or rgb(r g b / n%), got rgb(256 0 0 / 45%)`
- `token --surface-canvas must resolve to lowercase #rrggbb/#rrggbbaa or rgb(r g b / n%), got rgb(0 0 0 / 45.5%)`
- `token --surface-canvas must resolve to lowercase #rrggbb/#rrggbbaa or rgb(r g b / n%), got canvas`
- `canonical root contains an alias cycle at --surface-canvas`

## WR-01 — Vue raw shadow colours bypass audit

Closed by classifying `box-shadow` as paint-bearing before the selector-specific shadow allowlist runs. Prototype geometry still bypasses only that selector policy; a direct shadow colour cannot bypass colour confinement. The audit self-check includes `<style scoped>.prototype { box-shadow: 0 0 1px #fff; }</style>` and observes `direct hex color outside the permitted token root or forced-colors repair in .prototype`.

## WR-02 — root agreement test shares the extractor

Closed by removing `ROOT_DECLARATIONS` and replacing the helper's shared-regex reader with the independent brace-aware expected parser described in BL-01. The focused test also proves dev-server invalidation after an edit to `styles.css`.

## Verification

- `npm run verify:semantic-css` — passed; self-checks and semantic CSS audit passed.
- `npx vitest run tests/unit/token-contract.test.ts tests/unit/monaco-theme.test.ts` — passed: 2 files, 13 tests.
- `npm run typecheck:web` — passed.
- `npm run build` — passed.
- `npm run build && npm run test:browser -- tests/integration/monaco-anchor.spec.ts tests/e2e/responsive-session.spec.ts` — passed: 13 Playwright tests.
