---
phase: 08-semantic-visual-foundation
audited: 2026-09-13
status: blocked
asvs_level: not-specified
threats_total: 25
threats_mitigated: 21
threats_accepted: 1
threats_open: 3
---

# Phase 08 Security Audit

## Executive Summary

The token implementation contains the declared safety controls for filesystem reads, emitted-module quoting, canonical colour validation, forced-colours repair, focus visibility, non-colour diff cues, and dependency containment. The virtual module reads only the fixed `src/web/styles.css` descendant of the trusted Vite/Vitest config root and serializes its payload with `JSON.stringify`; root text cannot become executable module syntax.

Three declared **process-only** mitigations have no implementation enforcement. This audit does not accept plan or summary statements as evidence. They remain open blockers: browser tests can run without a fresh build, the audit does not enforce or record its historical baseline, and no code prevents browser expectations from being edited together with broken output.

## Scope and Method

- Audited all five PLAN threat registers (`T-08-01-01` through `T-08-05-05`), all six phase summaries, verification, review, review fixes, and the requested implementation files.
- No `## Threat Flags` heading exists in any Phase 08 summary; therefore no unregistered flags were declared.
- Dependency evidence: `git diff 564f48a^..HEAD -- package.json package-lock.json` changes only the `verify:semantic-css` script. It adds no dependency or lockfile entry.
- No project-wide suite was run. Evidence below is from current implementation and test source, not summary claims.

## Threat Verification

| Threat ID | Category | Disposition | Result | Real-code evidence |
|---|---|---|---|---|
| T-08-01-01 | Tampering / Elevation | mitigate | MITIGATED | `package.json:51-71` is the complete dependency/devDependency manifest; the audited range diff changes only `scripts.verify:semantic-css` at `package.json:36`. |
| T-08-01-02 | Information Disclosure | mitigate | MITIGATED | `scripts/token-root-plugin.mjs:20,35-38` resolves only the fixed `src/web/styles.css` path, reads it, and has no write/glob/import-derived pathname. Actual Vite and Vitest registrations supply trusted `import.meta.dirname` at `vite.config.ts:11` and `vitest.config.ts:5`. |
| T-08-01-03 | Tampering | mitigate | MITIGATED | `scripts/token-root-plugin.mjs:40` emits the root only through `JSON.stringify(root)`, producing a data string literal rather than concatenating executable syntax. |
| T-08-01-04 | Tampering (displayed-state integrity) | mitigate | MITIGATED | `src/web/theme/token-contract.ts:15-21` resolves then rejects unnormalizable colour values. Shared validation accepts only bounded canonical forms at `scripts/css-token-contract.mjs:193-203,218-223`. |
| T-08-01-05 | Repudiation | mitigate | MITIGATED | The unit gate imports the virtual module at `tests/unit/token-contract.test.ts:7`, while its only registration is `vitest.config.ts:5`; removing registration makes module loading fail. The gate also independently compares build and filesystem maps at `tests/unit/token-contract.test.ts:156-163`. |
| T-08-02-01 | Repudiation / usability-security | mitigate | MITIGATED | Canonical focus geometry is declared at `src/web/styles.css:111-112` and consumed by global `:focus-visible` at `:148-150`; destructive emphasis remains a semantic token at `:35-37`. Browser source asserts computed focus colour, width, and offset at `tests/integration/draft-recovery-ui.spec.ts:214-216`. |
| T-08-02-02 | Tampering (displayed-state integrity) | mitigate | MITIGATED | The terminal `@media (forced-colors: active)` repair is present at `src/web/styles.css:2619-2749`; it restores system focus colour at `:2661-2663`, selected states at `:2665-2678`, and diff rail styles at `:2723-2739`. |
| T-08-02-03 | Information Disclosure | mitigate | MITIGATED | File status has text/ARIA labels and explicit `+`/`−` counts in `src/web/components/FileRow.vue:21-36,58-73`; distinct status names are mapped in `FileMetadataPane.vue:69-84`. Diff rails are dashed/solid with `−`/`+` pseudo-content in `src/web/styles.css:2530-2561`. |
| T-08-02-04 | Tampering | accept | ACCEPTED | The only application consumer of `TOKEN_ROOT_CSS` is `src/web/monaco/theme.ts:3,7-11`, which parses it before colour lookup. The build transfer at `scripts/token-root-plugin.mjs:40` is JSON-quoted data, not an HTML, DOM, `eval`, or executable-JavaScript sink. Accepted low risk is recorded below. |
| T-08-02-05 | Tampering / Elevation | mitigate | MITIGATED | `package.json:51-71` contains no added styling dependency; the audited range diff adds only the first-party command at `package.json:36`. |
| T-08-03-01 | Tampering (displayed-state integrity) | mitigate | MITIGATED | `src/web/monaco/theme.ts:7,10-11` routes every theme value through `toMonacoHex`, whose rejection branch is `src/web/theme/token-contract.ts:15-21`. |
| T-08-03-02 | Tampering | mitigate | MITIGATED | Syntax foreground rules strip exactly the leading `#` with `.slice(1)` at `src/web/monaco/theme.ts:20-62`; independent expected token mappings compare every rule to canonical bytes in `tests/unit/monaco-theme.test.ts:121-136`. |
| T-08-03-03 | Repudiation | mitigate | MITIGATED | `tests/unit/monaco-theme.test.ts:110-119` owns an explicit `THEME_COLOR_ROOT_MAP`, asserts complete non-sentinel colour keys, and compares each to `toMonacoHex`; it is independent of the production theme object's token choices. |
| T-08-03-04 | Information Disclosure | mitigate | MITIGATED | Monaco maps opaque line backgrounds and alpha intraline backgrounds separately at `src/web/monaco/theme.ts:80-85`; the gate requires six-digit line values, eight-digit intraline values, and inequality at `tests/unit/monaco-theme.test.ts:121-130`. Signed/dashed/solid decorations originate in `src/web/monaco/diff-semantics.ts:55-89` and are painted at `src/web/styles.css:2530-2561`. |
| T-08-03-05 | Tampering / Elevation | mitigate | MITIGATED | The only new browser-side token import is first-party `virtual:cumpa-tokens` at `src/web/monaco/theme.ts:3`; the manifest/range evidence at `package.json:51-71` adds no client dependency. |
| T-08-04-01 | Repudiation | mitigate | MITIGATED | `package.json:36` makes the named audit build first. `scripts/verify-semantic-css.mjs:270-380` runs self-checks unconditionally before source reads, including rejection fixtures for raw colours, invalid token forms, legacy vocabulary, and orphan tokens. |
| T-08-04-02 | Information Disclosure | mitigate | MITIGATED | Generated stylesheet paths are resolved below `outputRoot` and rejected on traversal before reading at `scripts/verify-semantic-css.mjs:390-400`. |
| T-08-04-03 | Tampering / Elevation | mitigate | MITIGATED | The audit remains the first-party `scripts/verify-semantic-css.mjs`, invoked by `package.json:36`; `package.json:51-71` and the range diff show no linter or token-compiler addition. |
| T-08-04-04 | Tampering | mitigate | MITIGATED | Both browser conversion and audit validation import the same first-party implementation: `src/web/theme/token-contract.ts:1-13` and `scripts/verify-semantic-css.mjs:4-11`. Audit value validation calls shared `assertCanonicalTokenValues` at `scripts/verify-semantic-css.mjs:109-115`. |
| T-08-04-05 | Repudiation | mitigate | NOT MITIGATED — BLOCKER | No implementation records or validates the required pre-phase red baseline/history. `scripts/verify-semantic-css.mjs:380-424` executes checks and prints only a success line; it neither reads nor writes a historical baseline. A SUMMARY statement is not code evidence. |
| T-08-05-01 | Repudiation | mitigate | NOT MITIGATED — BLOCKER | `package.json:41` defines `test:browser` as bare `playwright test`, without `build`/`build:web` predecessor. No Playwright/build wrapper was found to bind the two operations, so a stale bundle can be tested. |
| T-08-05-02 | Repudiation / usability-security | mitigate | MITIGATED | Global and Monaco focus affordances remain tokenized at `src/web/styles.css:148-150,2602-2605`; the browser contract tests a focused control's computed colour, width, and offset at `tests/integration/draft-recovery-ui.spec.ts:214-216`. |
| T-08-05-03 | Information Disclosure | mitigate | MITIGATED | The browser contract asserts text labels, selection rail, dashed/solid rails, and `−`/`+` signs at `tests/e2e/responsive-session.spec.ts:557-581`, backed by implementation at `FileRow.vue:58-73` and `styles.css:2530-2561`. |
| T-08-05-04 | Tampering (displayed-state integrity) | mitigate | MITIGATED | Theme colours derive only through `toMonacoHex` at `src/web/monaco/theme.ts:7-11,65-103`. The browser test waits for real Monaco then asserts canvas and gutter colours from root tokens at `tests/integration/monaco-anchor.spec.ts:217-229`. |
| T-08-05-05 | Tampering | mitigate | NOT MITIGATED — BLOCKER | No implementation enforces a clean source tree or prevents browser expectation edits from moving with broken output. `package.json:41` exposes a direct Playwright run; no source-clean preflight or immutable contract check exists in the reviewed command/config/test code. A plan rule is not executable mitigation. |

## Accepted Risks

| Threat ID | Accepted risk | Code boundary | Rationale |
|---|---|---|---|
| T-08-02-04 | Canonical root text is delivered to the Monaco build consumer as a JavaScript string constant. | `scripts/token-root-plugin.mjs:35-40` → `src/web/monaco/theme.ts:3,7-11` | The transfer is `JSON.stringify`-quoted, parsed only by the first-party token parser, and has no HTML/DOM/eval/executable interpolation path. This is an accepted low-risk data transfer, not an unsafe sink. |

## Virtual Module Path and Injection Assessment

- **Path handling:** The plugin constructs one pathname from a caller-supplied root plus a constant suffix (`scripts/token-root-plugin.mjs:20,35`). In production configuration the caller is the repository's own `import.meta.dirname` (`vite.config.ts:11`; `vitest.config.ts:5`). The virtual import id cannot supply a path: `resolveId()` accepts only the exact constant id (`token-root-plugin.mjs:10-18`).
- **Content injection:** The root declaration body is extracted and validated (`token-root-plugin.mjs:37-38`) before a single `JSON.stringify` serialization (`:40`). Quotes, newlines, comment text, or a `</script>` sequence remain data in the generated JavaScript string. No executable syntax can be injected through the CSS root.
- **Boundary conclusion:** A caller who can alter the Vite/Vitest config can pass another root, but that already grants arbitrary build-time JavaScript execution. The plugin does not widen that trust boundary.

## Unregistered Flags

None. No Phase 08 summary contains a `## Threat Flags` section or threat-flag entry.

## Open Threats

| Threat ID | Missing executable mitigation | Files searched |
|---|---|---|
| T-08-04-05 | Historical pre-/post-baseline recording is only a documentation/process instruction; no code checks or emits it. | `scripts/verify-semantic-css.mjs`, `package.json` |
| T-08-05-01 | `test:browser` lacks a mandatory fresh web build. | `package.json`, `playwright.config.ts`, `scripts/` |
| T-08-05-05 | No clean-tree preflight or contract immutability guard prevents changed expectations from matching broken output. | `package.json`, `vite.config.ts`, `vitest.config.ts`, browser test sources |

## Audit Result

**BLOCKED — 3 open declared mitigations.** The implementation must add executable enforcement for the three open controls, or their dispositions must be deliberately changed through the phase threat model and accepted-risk process before this phase can be marked security-secured.
