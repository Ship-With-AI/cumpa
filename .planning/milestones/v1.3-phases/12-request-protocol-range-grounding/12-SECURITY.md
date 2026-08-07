---
phase: 12-request-protocol-range-grounding
audit: security
asvs_level: 1
blocking_threshold: HIGH
status: secured
threats_total: 37
threats_mitigated: 31
threats_accepted: 6
threats_open: 0
unregistered_flags: 0
audited: 2026-08-04
---

# Phase 12 Security Audit

## Executive Summary

**SECURED.** All 31 plan-time mitigations are present at their declared trust boundaries. The six LOW supply-chain risks are explicitly accepted because Phase 12 added no dependency or package-manager surface. No summary reported a `## Threat Flags` section, so there are no unregistered flags.

## Audit Scope and Method

This audit verifies only the 37 threats registered in the six Phase 12 `<threat_model>` blocks. A mitigation is closed only where its implementation and directly relevant test evidence establish the planned control; this report does not treat summary intent as proof.

**Disposition totals:** 31 mitigated and closed; 6 accepted and documented; 0 open.

## Threat Register

| Threat ID | Category | Disposition | Status | Direct evidence |
|---|---|---|---|---|
| T-12-01-01 | Denial of Service — stdin accumulation | mitigate | CLOSED | `src/cli/request.ts:60-65` increments raw byte count and throws before retaining a chunk above `MAX_AGENT_REQUEST_BYTES`; `src/contracts/request.ts:5`; `tests/cli/request.test.ts:107-111`. |
| T-12-01-02 | Tampering — UTF-8/JSON framing | mitigate | CLOSED | Fatal decoder at `src/cli/request.ts:9`; a single EOF decode/`JSON.parse` at `:72-80`; strict parse follows at `:82-89`; malformed and split-invalid UTF-8 cases at `tests/cli/request.test.ts:117-120`. |
| T-12-01-03 | Elevation of Privilege — request schema | mitigate | CLOSED | `AgentReviewRequestSchema` is a strict, revisions-only object at `src/contracts/request.ts:48-55`; unknown root and nested authority fields are rejected at `tests/cli/request.test.ts:124-129`. |
| T-12-01-04 | Spoofing / Information Disclosure — errors | mitigate | CLOSED | Public error messages are finite constants at `src/cli/request.ts:19-35`; error construction receives only a category, not body data; safe non-reflecting cases at `tests/cli/request.test.ts:117-120`. |
| T-12-01-05 | Denial of Service — Git argument fields | mitigate | CLOSED | Non-empty, NUL-free, UTF-8 byte-bounded arguments at `src/contracts/request.ts:11-34`; pathspec maximum and frozen default at `:40-46`; limits at `:5-7`. |
| T-12-01-SC | Tampering — package supply chain | accept | ACCEPTED | See **Accepted Risks** AR-12-01-SC. |
| T-12-02-01 | Tampering / Elevation of Privilege — revision argv | mitigate | CLOSED | Endpoint resolution uses array argv with `--end-of-options` and commit peel at `src/git/comparison.ts:195-219`; Git spawn sets `shell: false` at `src/git/runner.ts:148-159`. |
| T-12-02-02 | Tampering — pathspec argv | mitigate | CLOSED | Both raw and numstat Git commands share one frozen `['--', ...pathspecs]` tail in `src/git/inventory.ts:140-171`; NUL was rejected upstream by `src/contracts/request.ts:11-34`. |
| T-12-02-02A | Spoofing / Information Disclosure — invalid pathspec diagnostics | mitigate | CLOSED | Scoped Git rejection maps to the fixed `invalid-pathspec` message without stderr or request value at `src/git/comparison.ts:483-495`; process proof at `tests/e2e/pinned-session.spec.ts:521-533`. |
| T-12-02-03 | Tampering — inherited Git environment | mitigate | CLOSED | All four pathspec-mode variables are deleted before spawn at `src/git/runner.ts:142-157`; inherited-mode test setup at `tests/git/inventory.test.ts:396-412`. |
| T-12-02-04 | Tampering / Repudiation — ref movement | mitigate | CLOSED | Revisions resolve exactly once (`src/git/comparison.ts:429-442`) and later ancestry, object verification, inventory, and range provenance consume OIDs (`:443-515`); verifier records moved-ref coverage in `12-VERIFICATION.md:28,45`. |
| T-12-02-05 | Spoofing / Repudiation — range review key | mitigate | CLOSED | Separate domain plus length-framed SHA-256 over both OIDs and every ordered pathspec at `src/domain/comparison-key.ts:3-12,26-38`; key-format test evidence at `tests/git/comparison.test.ts:314-317`. |
| T-12-02-06 | Denial of Service — Git execution | mitigate | CLOSED | Runner has an aborting timeout at `src/git/runner.ts:136-140` and kills a process whose stdout exceeds its configured cap at `:163-171`; request count/size inputs are bounded at `src/contracts/request.ts:5-7,40-46`. |
| T-12-02-SC | Tampering — package supply chain | accept | ACCEPTED | See **Accepted Risks** AR-12-02-SC. |
| T-12-03-01 | Spoofing / Tampering — stdin owner dispatch | mitigate | CLOSED | Strict `stdin.isTTY === true` branches to the existing picker before any request read at `src/cli/run.ts:351-362`; TTY event-order test at `tests/cli/selection.test.ts:517-562`. |
| T-12-03-02 | Elevation of Privilege — pre-launch gate | mitigate | CLOSED | Request read and pinned-range creation complete inside the failure gate at `src/cli/run.ts:369-388`; launch is reachable only after that block at `:390`; invalid generated request proves no opener/listener at `tests/e2e/pinned-session.spec.ts:521-533`. |
| T-12-03-03 | Spoofing / Information Disclosure — invalid-pathspec diagnostics | mitigate | CLOSED | Typed exit errors go only to configured stderr output with status 1 at `src/cli/run.ts:379-385`; the upstream fixed range error is at `src/git/comparison.ts:489-493`; E2E asserts empty stdout and no sensitive Git/request data at `tests/e2e/pinned-session.spec.ts:526-533`. |
| T-12-03-04 | Elevation of Privilege / Information Disclosure — session projection | mitigate | CLOSED | `SessionResponseSchema` is strict at `src/contracts/api.ts:321-329`; the range projection derives only kind, pinned OIDs, and pathspecs from frozen comparison at `src/server/capabilities.ts:268-305`; absence assertions at `tests/api/session.test.ts:189-193`. |
| T-12-03-05 | Repudiation — TTY regression | mitigate | CLOSED | Injected interactive test requires `discover → pick-base-head → pin-comparison → confirm → launch` at `tests/cli/selection.test.ts:517-562`; TTY dispatch continues to use `runCli` at `src/cli/run.ts:355-357`. |
| T-12-03-SC | Tampering — package supply chain | accept | ACCEPTED | See **Accepted Risks** AR-12-03-SC. |
| T-12-04-01 | Tampering / Repudiation — draft namespace | mitigate | CLOSED | Range draft paths derive solely from server-held `comparison.range.reviewKey` at `src/server/draft-loader.ts:80-85`; reordered scopes produce distinct paths at `tests/unit/draft-load.test.ts:93-98`. |
| T-12-04-02 | Tampering — persisted draft bytes | mitigate | CLOSED | Draft bytes fatal-decode and JSON-parse at `src/server/draft-loader.ts:87-99`, use strict envelope/draft parsing at `:101-126`, and reject provenance mismatch at `:127-130`; corrupt range evidence at `tests/unit/draft-load.test.ts:112-123,137-143`. |
| T-12-04-03 | Elevation of Privilege — draft API input | mitigate | CLOSED | Browser mutation input is a strict discriminated union (`src/contracts/api.ts:25-62`) and route-safe-parsed before capability/store use (`src/server/routes.ts:217-220`); authority-field rejection cases at `tests/api/draft.test.ts:183-187`. |
| T-12-04-04 | Denial of Service — draft mutation queue | mitigate | CLOSED | One promise chain serializes each server-derived `{repositoryRoot}\u0000{reviewKey}` queue key at `src/server/draft-store.ts:86-97,129-151`; writes use exclusive temporary files, fsync, then rename at `:139-165`. |
| T-12-04-SC | Tampering — package supply chain | accept | ACCEPTED | See **Accepted Risks** AR-12-04-SC. |
| T-12-05-01 | Tampering / Repudiation — range canonical export | mitigate | CLOSED | V2 builder exact-cumpas draft range, labels, OIDs, merge base, and review key before serialization at `src/export/review-export.ts:134-164`; schema rejects mismatched/unknown V2 input at `tests/unit/review-export.test.ts:231-245`. |
| T-12-05-02 | Tampering — publication namespace | mitigate | CLOSED | Range name must be exactly a 64-hex key at `src/server/export-store.ts:120-130`; managed directories reject symlinks at `:152-187`; reparsed candidate must match publication identity before rename at `:239-263`. |
| T-12-05-03 | Spoofing / Information Disclosure — Markdown rendering | mitigate | CLOSED | Renderer begins by reparsing canonical export bytes at `src/export/render-review-markdown.ts:35-36`; V2 range values use control-safe display at `:48-62`; canonical parser fatal-decodes, validates, and byte-cumpas at `src/export/review-export.ts:170-178`. |
| T-12-05-04 | Elevation of Privilege — export API | mitigate | CLOSED | Export request accepts only strict revision/acknowledgement input (`src/contracts/api.ts:213-216`) and route parses it before capability export at `src/server/routes.ts:289-294`; frozen comparison is the source of range review key at `src/server/capabilities.ts:324-328`. |
| T-12-05-05 | Denial of Service — publication/recovery | mitigate | CLOSED | Publication rejects invalid identity before I/O (`src/server/export-store.ts:207-210`), stages in mode-0700 candidate, rereads/validates both files, and atomically renames only after checks (`:230-263`); recovery/publication tests use the range-key matrix at `tests/api/export-publication.test.ts:235-255`. |
| T-12-05-SC | Tampering — package supply chain | accept | ACCEPTED | See **Accepted Risks** AR-12-05-SC. |
| T-12-06-01 | Elevation of Privilege — generated launch gate | mitigate | CLOSED | Production generated-path test asserts invalid native magic has nonzero exit, empty stdout, bounded stderr, no URL/listener signal, and no opener file at `tests/e2e/pinned-session.spec.ts:521-533`; code gate is `src/cli/run.ts:369-390`. |
| T-12-06-02 | Spoofing / Information Disclosure — scope presentation | mitigate | CLOSED | Server projects range facts only from frozen comparison at `src/server/capabilities.ts:268-305`; UI renders pathspecs through `controlSafeDisplay` at `src/web/components/IdentityPanel.vue:89-119`; generated-browser scope test at `tests/e2e/pinned-session.spec.ts:494-506`. |
| T-12-06-03 | Tampering — client inventory/content | mitigate | CLOSED | Server session maps only `comparison.changedFiles` to file capabilities at `src/server/capabilities.ts:282-305`; UI derives reviewable files only from `session.files` at `src/web/App.vue:119-128`; E2E confirms scoped inventory and immutable post-ref-move session at `tests/e2e/pinned-session.spec.ts:480-508`. |
| T-12-06-04 | Denial of Service — long scope display | mitigate | CLOSED | Request count/string caps are enforced at `src/contracts/request.ts:5-7,11-44`; panel scrolls and pathspecs wrap at `src/web/styles.css:575-624`, including narrow modal overflow at `:2229-2260`. |
| T-12-06-05 | Spoofing — modal focus/roles | mitigate | CLOSED | Scope panel uses labelled region/dialog and focus containment at `src/web/components/IdentityPanel.vue:40-64,69-88`; narrow E2E test proves focus, tab wrap, Escape, and focus return at `tests/e2e/pinned-session.spec.ts:590-613`; focus/reduced-motion/forced-color styles are present at `src/web/styles.css:102-105,2394-2473`. |
| T-12-06-SC | Tampering — package supply chain | accept | ACCEPTED | See **Accepted Risks** AR-12-06-SC. |

## Accepted Risks

| ID | Risk | Explicit acceptance and boundary |
|---|---|---|
| AR-12-01-SC | T-12-01-SC package supply chain | Accepted: Plan 12-01 reuses the established Node/Zod/Vitest toolchain; its summary declares `added: []` (`12-01-SUMMARY.md:14-17`). No new registry or install path was part of the phase. |
| AR-12-02-SC | T-12-02-SC package supply chain | Accepted: Plan 12-02 added no dependency (`12-02-SUMMARY.md:15-17`) and uses native Git plus Node crypto (`src/domain/comparison-key.ts:1-4`). |
| AR-12-03-SC | T-12-03-SC package supply chain | Accepted: Plan 12-03 declares `added: []` (`12-03-SUMMARY.md:18-20`); its control reuses existing CLI/Fastify contracts. |
| AR-12-04-SC | T-12-04-SC package supply chain | Accepted: Plan 12-04 declares `added: []` (`12-04-SUMMARY.md:18-21`) and reuses Node filesystem and existing Zod contracts. |
| AR-12-05-SC | T-12-05-SC package supply chain | Accepted: Plan 12-05 declares `added: []` (`12-05-SUMMARY.md:14-16`) and its artifact summary names only existing Zod/Node/Fastify components. |
| AR-12-06-SC | T-12-06-SC package supply chain | Accepted: Plan 12-06 declares `added: []` (`12-06-SUMMARY.md:14-16`); its source reuses Vue components and CSS without a new package. |

## Unregistered Flags

None. Searched every `12-01-SUMMARY.md` through `12-06-SUMMARY.md`; none contains a `## Threat Flags` section or threat-flag entry.

## Existing Verification Evidence

- `12-VERIFICATION.md:1-8` records **passed**, **23/23 must-haves**, and **0** behavior unverified.
- Its focused behavioral run (`12-VERIFICATION.md:80-85`) reports 11 Vitest files / 145 tests passing; its generated production browser run (`:84-85`) reports build success and 11 Playwright tests passing.
- Phase completion also records a final full Vitest pass of 49 files / 365 tests; this audit did not rerun suites, formatters, linters, or builds, per scope.

## Audit Trail

1. Read all six plan threat models and every plan summary (`12-01` through `12-06`), then checked the summaries for executor-reported threat flags.
2. Read `12-VERIFICATION.md`, the request, CLI, Git runner/range/inventory/key, session, draft, export/publication, and range UI implementations named by the plans.
3. Read focused mitigation tests, including request, Git, session, draft, export/publication, TTY, and generated Playwright evidence.
4. Audited only declared plan-time threats. No implementation or test file was modified.

## Result

`threats_open: 0` — all plan-time threats are either directly mitigated or explicitly accepted above.
