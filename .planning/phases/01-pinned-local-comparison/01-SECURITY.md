---
phase: 01
slug: pinned-local-comparison
status: verified
threats_open: 0
asvs_level: 1
register_authored_at_plan_time: true
created: 2026-07-20
last_audited: 2026-07-20
block_on: open
---

# Phase 01 — Pinned Local Comparison Security

> Enforcing ASVS Level 1 gate. This audit verifies the threat register authored in Plans 01-01 through 01-13 against the Phase 01 implementation and focused behavioral tests. Implementation files were read-only during this audit.

---

## Gate Result

**SECURED — all declared Phase 01 threats are closed.**

| Metric | Count |
|---|---:|
| Declared register rows after permitted deduplication | 34 |
| Closed | 34 |
| Open | 0 |
| Accepted | 0 |
| Transferred | 0 |
| Unregistered summary flags | 0 |

The focused T-01-19 re-audit closed the final blocker. `src/cli/run.ts:180-185` now discards every browser-opener rejection detail and emits only the fixed generic diagnostic `Browser did not open automatically. Open the URL above manually.` The observable regression at `tests/cli/errors.test.ts:412-435` makes the opener reject with the full fragment-bearing launch URL, then proves every post-launch diagnostic contains neither `#token=` nor that URL; the focused run passed all 13 tests.

### Register accounting

- The plans declare 31 non-supply-chain rows. This includes two distinct, non-equivalent rows both authored as `T-01-05`: Plan 01-03 shutdown denial-of-service and Plan 01-04 candidate-label/path spoofing. Both remain separate below; the ID collision is not silently deduplicated.
- Plan 01-01's `T-01-SC` release-approval control is retained separately because its evidence is the exact-release audit and initial lock creation.
- Plans 01-02 through 01-12 repeat `T-01-SC` with equivalent disposition and evidence: reuse the approved lockfile and perform no install. Those eleven equivalent repetitions are represented by one row.
- Plan 01-13's `T-01-SC` is retained separately because it adds packaged-output inventory evidence to the approved-lock control.

---

## Trust Boundaries

| Boundary | Description | Data crossing |
|---|---|---|
| npm registry metadata to local dependency graph | A human-approved exact release set becomes the immutable npm lock graph and package runtime boundary. | Exact package versions, integrity hashes, engine/peer metadata, generated package contents. |
| CLI/domain to installed Git executable | Repository-derived and user-selected identities cross into a native subprocess that must not invoke a shell or repository code. | Argument arrays, bounded byte streams, cancellation, full object IDs. |
| Git object database to frozen comparison | Git metadata and object bytes become validated immutable comparison facts; worktree bytes and moving refs are outside authority after pinning. | Commit IDs, merge base, diff records, paths as bytes, object metadata, bounded blob bytes. |
| Public browser origin to IPv4 loopback | A hostile page can probe a local TCP listener and attempt DNS-rebinding-style Host/Origin confusion. | Static requests, bearer-authenticated API requests, generic denial responses. |
| Browser DTO to launch-scoped capability registry | Untrusted browser values must not select repositories, refs, object IDs, paths, Git arguments, mutations, or export destinations. | Strict route grammar and opaque `fileId` capabilities. |
| Validated session DTO to rendered UI | Repository-controlled labels and paths must remain text, not markup or authority; asynchronous responses must remain bound to the selected capability. | Safe display strings, exact path copies, full OIDs, status/reason text, response identity. |
| Responsive visible UI to hidden/modal UI | Layout changes must not leave hidden controls focusable or permit focus to escape a narrow modal identity sheet. | ARIA state, focus order, inert background, retained selection and scroll state. |

---

## Threat Register

| Plan | Threat ID | Category | Component | Disposition | Declared mitigation | Status | Implementation and focused-test evidence |
|---|---|---|---|---|---|---|---|
| 01-01 | T-01-SC | Tampering | npm/browser supply chain | mitigate | Independent exact-release metadata queries plus blocking per-row human disposition before install. | closed | Exact direct versions are pinned in `package.json:29-45` and identically rooted in lockfile v3 at `package-lock.json:4-33`; the completed per-release metadata/disposition record is in `01-01-SUMMARY.md:77-121`. No ranges are admitted at the root. |
| 01-01 | T-01-01 | Tampering | packed executable | mitigate | Deterministic generated wrapper and pack-content assertion; no source-path fallback. | closed | `scripts/build-bin.mjs:4-16` deterministically writes executable `dist/bin/diff-review.mjs`, imports only compiled `../cli/run.js`, and sets mode `0755`; `package.json:10-15` maps the bin and allowlists only `dist/`; `tests/e2e/package-assets.spec.ts:53-86` asserts the packed bin, absence of `src/`/TypeScript/Vue source, production HTML, and built JS. The audit's `npm pack --dry-run` succeeded with 27 allowlisted runtime files and no source tree. See the test-harness warning in Audit Notes. |
| 01-02 | T-01-02 | Tampering / Elevation | Git runner | mitigate | Argument arrays, shell false, bounded bytes, cancellation, and repository-code suppression. | closed | `src/git/runner.ts:7-17` suppresses hooks, fsmonitor, external diff, optional locks, and file protocol; `src/git/runner.ts:86-154` validates positive bounds and uses `spawn('git', args, { shell: false, signal })`; `src/git/runner.ts:157-231` kills over-limit children and handles cancellation, timeout, stderr, and exit failures. Focused Git run: 5 files, 27 tests passed. |
| 01-02 | T-01-03 | Information disclosure | comparison | mitigate | Frozen commit/blob authority only; no worktree-byte or moving-ref fallback. | closed | `src/git/comparison.ts:187-200` resolves endpoints once to full validated OIDs; `src/git/comparison.ts:225-293` derives the sole merge base and inventory only from those OIDs; `src/git/comparison.ts:295-325` schema-validates and freezes the DTO. `tests/git/pinned-comparison.test.ts:41-97` and `tests/git/inventory.test.ts:340-387` cover independent OIDs plus moving-ref and dirty-byte exclusion. |
| 01-03 | T-01-04 | Spoofing | listener | mitigate | Explicit `127.0.0.1:0`, process token seed, and actual-address URL. | closed | `src/cli/run.ts:146-176` creates 32 random bytes, binds Fastify to `127.0.0.1` port `0`, rejects any unexpected actual address, binds security to the actual port, and constructs the launch URL from that authority. `tests/e2e/pinned-session.spec.ts:243-304` proves the generated CLI's loopback/ephemeral/token URL and pinned identities; targeted packaged run passed. |
| 01-03 | T-01-05 | Denial of service | shutdown | mitigate | One idempotent drain promise aborts children and awaits server close. | closed | `src/server/lifecycle.ts:40-103` memoizes one shutdown promise, removes both signal handlers, aborts active work, awaits listener close, and preserves the first status; `src/cli/run.ts:112-126` wires Git abort and Fastify close. `tests/e2e/pinned-session.spec.ts:1376-1419` asserts one abort, one close, first status 130, handler removal, and real generated-process SIGINT exit; targeted packaged run passed. |
| 01-04 | T-01-05 | Spoofing | candidate labels/paths | mitigate | Control-safe presentation, separate immutable source IDs, no display string as authority. | closed | `src/cli/picker.ts:81-106` escapes terminal controls; `src/cli/picker.ts:145-174` uses immutable `candidate.id` as the prompt value while rendering escaped label/path separately; `src/cli/picker.ts:244-245` resolves selections through the ID map. Candidate objects are frozen at `src/git/candidates.ts:170-180,226-248`. `tests/cli/selection.test.ts:223-253` covers ordered identity and dirty copy. |
| 01-04 | T-01-06 | Tampering | candidate Git probes | mitigate | Argument arrays and NUL protocols only; no shell interpolation or line-oriented path parsing. | closed | `src/git/candidates.ts:38-72` parses NUL fields for branches; `src/git/candidates.ts:74-125` parses `worktree list --porcelain -z`; `src/git/candidates.ts:137-150` invokes discrete `for-each-ref` and worktree arguments; `src/git/candidates.ts:207-216` consumes `status --porcelain=v1 -z`. All calls pass through the shell-free runner. `tests/git/candidates.test.ts:31-100` passed in the focused Git run. |
| 01-04 | T-01-07 | Information disclosure | dirty state | mitigate | Expose only collapsed dirty/clean/unavailable status; never read or transmit dirty content. | closed | `src/git/candidates.ts:195-221` derives dirty state solely from whether NUL porcelain output is empty and does not preserve status records or read files; `src/cli/picker.ts:108-115` renders only the collapsed state. `tests/git/candidates.test.ts:31-68` creates staged, unstaged, and untracked bytes but asserts only the status; focused Git run passed. |
| 01-05 | T-01-08 | Tampering | comparison identity | mitigate | Resolve full commits once, verify objects, require exactly one `merge-base --all` result. | closed | `src/git/comparison.ts:62-119` resolves and verifies full commit objects; `src/git/comparison.ts:121-148` validates every returned full OID; `src/git/comparison.ts:225-282` passes only frozen OIDs to `merge-base --all`, rejects zero/multiple results, and verifies all objects. `tests/git/comparison.test.ts:190-259` covers equality and ambiguous merge bases; focused Git run passed. |
| 01-05 | T-01-09 | Elevation | Git arguments | mitigate | Opaque validated OIDs passed as argument-array values; no shell or `ref:path` expressions. | closed | Full lowercase OIDs are validated at `src/git/comparison.ts:79-81,134-139` and `src/git/objects.ts:42-45`; post-resolution merge-base, diff, and object reads use discrete OID fields at `src/git/comparison.ts:227-229`, `src/git/inventory.ts:123-147`, and `src/git/objects.ts:94-100,118-132`. No shell command or `OID:path` expression is present. |
| 01-05 | T-01-10 | Repudiation | terminal failures | mitigate | Typed specific diagnostics distinguish environment, endpoint, graph, and object failures. | closed | `src/domain/errors.ts:1-45` defines the explicit failure taxonomy and typed recovery; `src/domain/errors.ts:66-91` supplies exact fatal messages and recovery roles; `src/git/comparison.ts:86-117,202-207,245-282` maps endpoint, equality, graph, and object states. `tests/cli/errors.test.ts:108-329` and `tests/git/comparison.test.ts:190-259` cover specific states and zero-bind/open behavior; focused Git run passed. |
| 01-06 | T-01-11 | Tampering | Git diff invocation | mitigate | Discrete arguments, final option separator, frozen OIDs, no external diff/textconv. | closed | `src/git/inventory.ts:58-65` fixes `-z`, rename/copy policy, `--no-ext-diff`, and `--no-textconv`; `src/git/inventory.ts:123-147` invokes raw and numstat diff with frozen merge-base/head OIDs and final `--`. `tests/git/inventory.test.ts:257-289` asserts the exact arrays; focused Git run passed. |
| 01-06 | T-01-12 | Spoofing | unusual paths | mitigate | NUL-first byte parsing, visible control escaping, opaque IDs distinct from display. | closed | `src/git/raw-diff.ts:23-39,82-122` parses NUL-delimited buffers and converts raw fields directly to exact paths; `src/domain/path-bytes.ts:7-61` retains copied bytes/base64url, strict UTF-8 when valid, and visibly escaped controls; `src/git/inventory.ts:67-85` makes opaque IDs from exact record authority. `tests/unit/inventory-protocol.test.ts:47-149` and `tests/git/inventory.test.ts:295-326` cover tabs, newlines, leading dashes, invalid UTF-8, normalization collisions, and malformed records; focused unit/Git runs passed. |
| 01-06 | T-01-13 | Information disclosure | content authority | mitigate | Metadata/blob IDs from commits only; no worktree filesystem reads. | closed | `src/git/inventory.ts:123-193` derives records and availability from `git diff` and raw object IDs; the only inputs are repository root plus frozen merge-base/head OIDs. `tests/git/inventory.test.ts:340-387` mutates refs and writes dirty files after freezing and proves unchanged inventory with no dirty strings; focused Git run passed. |
| 01-06 | T-01-14 | Denial of service | subprocess output | mitigate | Existing streamed bounds and explicit malformed-record failure. | closed | Runner bounds are enforced before chunk retention at `src/git/runner.ts:157-181`; raw records fail on missing NUL, bad headers, empty/truncated path pairs at `src/git/raw-diff.ts:19-31,38-53,69-105`; numstat uses an independent bounded NUL grammar and exact join. `tests/unit/inventory-protocol.test.ts:143-149` and its numstat malformed matrix passed. |
| 01-07 | T-01-15 | Denial of service | blob reads | mitigate | Type/size before bounded allocation; explicit 1 MiB per-side policy. | closed | `src/git/availability.ts:13` defines 1,048,576 bytes; `src/git/availability.ts:82-103` inspects every side before any bounded read and rejects size greater than the policy; `src/git/objects.ts:114-154` caps runner output before returning bytes and checks framing/size. `tests/unit/availability.test.ts:145-193` proves inspect-before-read, limit+1 with no read, and exact-limit eligibility; focused unit run passed. |
| 01-07 | T-01-16 | Elevation | repository content hooks | mitigate | Raw `cat-file` only; no filters, textconv, external diff, symlink traversal, or project execution. | closed | `src/git/objects.ts:83-154` accepts only full OIDs and uses `cat-file --batch-command -Z` `info`/`contents`; `src/git/availability.ts:55-80` rejects submodules, symlinks, and unsupported modes before object access; `src/git/inventory.ts:58-65` disables external diff/textconv; `src/git/runner.ts:7-17,142-154` disables repository hooks/fsmonitor and shell execution. `tests/git/availability.test.ts:246-328` covers conversion drivers, symlink targets, dirty files, and moving refs; focused Git run passed. |
| 01-07 | T-01-17 | Tampering | vanished objects | mitigate | Explicit unavailable result; never substitute moving refs or filesystem bytes. | closed | `src/git/objects.ts:55-57,133-139` returns explicit missing results; `src/git/availability.ts:84-108` maps metadata/content disappearance to `unavailable: missing-object` with no fallback; `tests/unit/availability.test.ts:242-254` and `tests/git/availability.test.ts:246-328` prove disappearance and immutable authority; focused runs passed. |
| 01-08 | T-01-18 | Spoofing | loopback request | mitigate | Per-process 256-bit+ bearer, exact Host, exact-if-present Origin, no CORS. | closed | `src/cli/run.ts:146-175` creates a 256-bit token and binds expected Host/Origin from the actual listener; `src/server/security.ts:60-68` compares bearer bytes with `timingSafeEqual`; `src/server/security.ts:89-114` fails closed in target → Host → Origin → Bearer order. `tests/api/security.test.ts:117-168,171-248` asserts allowed/denied matrices, security headers, real binding, no CORS, and zero route work; 31 API tests and the packaged token smoke passed. |
| 01-08 | T-01-19 | Information disclosure | token/errors | mitigate | Fragment bootstrap, immediate removal, memory-only token, redaction, generic browser errors. | closed | Previously verified controls remain: `src/web/api/client.ts:44-65` removes the fragment before fetch and keeps the token closure-only; `src/server/security.ts:77-87,121-130` emits correlation/reason diagnostics and generic bodies; `tests/e2e/pinned-session.spec.ts:1281-1369` proves fragment removal, header-only bearer, no CORS, generic bodies, and no browser-console leak. Remediation `9b83f76` changes `src/cli/run.ts:180-185` so the opener catch ignores the rejected error and emits only the fixed generic browser-fallback diagnostic. Regression `fa878a4` at `tests/cli/errors.test.ts:412-435` rejects with `Unable to open ${url}` after capturing the full `#token=` URL, confirms the launch URL reached the opener, and asserts the post-launch diagnostics contain neither `#token=` nor the rejected URL. Focused command `npx vitest run tests/cli/errors.test.ts` passed: 1 file, 13 tests. |
| 01-08 | T-01-20 | Elevation | request grammar | mitigate | Strict two-route schemas and opaque file IDs; no repository/ref/object/path/export/blob authority. | closed | `src/server/routes.ts:7-20` rejects additional query/param properties; `src/server/routes.ts:22-54` exposes only two GET routes and validates opaque IDs; `src/server/capabilities.ts:39-66` projects DTOs without repository/blob authority; `src/web/api/client.ts:97-113` offers only fixed session/file GET methods. `tests/api/session.test.ts:113-241` and `tests/e2e/pinned-session.spec.ts:1330-1368` cover arbitrary capabilities and forbidden fields; focused API/package runs passed. |
| 01-08 | T-01-21 | Tampering | capability map | mitigate | Freeze launch-scoped map before serving; no request mutation path. | closed | `src/server/capabilities.ts:33-74` constructs the capability map completely from the frozen comparison before returning a frozen registry exposing only `session` and `lookup`; `src/server/app.ts:34-43` creates it before registering routes/static; routes contain no mutation method. `tests/api/session.test.ts:150-205` proves metadata-only lookup and frozen snapshot behavior; focused API run passed. |
| 01-09 | T-01-22 | Spoofing | path projection | mitigate | Exact bytes and opaque IDs remain distinct from control-safe display. | closed | `src/domain/path-bytes.ts:46-76` preserves exact bytes independently from display and compares bytewise; `src/domain/file-tree.ts` consumes exact path identities while `src/web/model/file-tree.ts:123-260` carries `fileId` for selection/focus. `tests/unit/file-tree.test.ts` covers byte ordering, display collisions, compaction, and opaque selection; focused unit run passed (34 tests across the security-relevant unit files). |
| 01-10 | T-01-23 | Spoofing | rendered paths | mitigate | Visible control escaping and exact details; color never acts alone. | closed | `src/web/components/PathDisplay.vue:19-35` renders validated display strings through Vue text interpolation and gives rename/copy textual semantics; `src/web/components/StatusBadge.vue:10-33` always exposes textual/assistive status in addition to tone. `tests/e2e/file-tree.spec.ts` and the passing packaged metadata case exercise collision-safe paths and textual statuses. |
| 01-10 | T-01-24 | Tampering | tree selection | mitigate | Opaque IDs are keys/events/capabilities; display paths never authorize. | closed | `src/web/components/FileTree.vue:17-19,40-63,162-180` uses `fileId` for emitted selection/activation and keys; `src/web/components/FileRow.vue:20,50-57` carries it as the row/event identity; `src/web/App.vue:53-92` resolves only a session `fileId` and asks the fixed client route. `tests/e2e/pinned-session.spec.ts:1261-1271` proves every detail request is GET with one known opaque capability, no query, and no body; targeted packaged run passed. |
| 01-11 | T-01-25 | Information disclosure | identity/error UI | mitigate | Validated frozen DTO only; generic denial copy and no token/path diagnostics. | closed | `src/web/api/client.ts:76-112` discards error bodies and emits fixed messages after schema validation; `src/web/App.vue:239-255,264-278` renders only validated sessions or fixed unavailable copy; `src/server/capabilities.ts:39-66` supplies the narrow validated DTO. `tests/api/security.test.ts:98-127,199-222` and `tests/e2e/pinned-session.spec.ts:1281-1369` inject sensitive authorities into denials and prove they do not render; focused runs passed. |
| 01-11 | T-01-26 | Spoofing | identity presentation | mitigate | Ordered labels plus full copyable OIDs and explicit pin/dirty language. | closed | `src/web/components/IdentityHeader.vue:17-64` renders ordered base → head labels/short OIDs, pinned cue, and textual dirty meaning; `src/web/components/IdentityPanel.vue:80-139` renders Base, Head, Merge base in order, full copyable OIDs, worktree/dirty statements, and no-follow-moving-refs copy. The passing `identity session and empty states` packaged case verifies the contract. |
| 01-12 | T-01-27 | Elevation | detail request | mitigate | Only launch-scoped opaque `fileId` reaches the existing strict route. | closed | `src/web/App.vue:53-92` accepts only IDs already found in validated session files; `src/web/api/client.ts:105-112` sends only encoded `fileId` to the fixed route; `src/server/routes.ts:33-52` validates it against the opaque schema and launch registry. `tests/e2e/pinned-session.spec.ts:1261-1271` proves no body/query/repository/ref/object/path authority; targeted packaged run passed. |
| 01-12 | T-01-28 | Spoofing | path/reason display | mitigate | Validated exact values remain separate from safe display; explicit textual reasons. | closed | `src/web/components/FileMetadataPane.vue:36-55,86-112` maps every availability state to machine reason and explicit prose; `src/web/components/FileMetadataPane.vue:114-148` shows control-safe display while exact UTF-8/base64url remains the labeled copy value. `tests/e2e/pinned-session.spec.ts:1094-1127,1147-1240` verifies safe headings, exact copies, and every reason; targeted packaged run passed. |
| 01-13 | T-01-29 | Spoofing / Elevation | responsive hidden UI | mitigate | Inactive panels leave accessibility/focus order; modal background is inert and focus-contained. | closed | `src/web/App.vue:295-365` marks the inactive narrow panel `hidden`; `src/web/App.vue:201-235,287-298` restores disclosure focus and sets the background inert; `src/web/components/IdentityPanel.vue:32-69` cycles focus within the modal. `tests/e2e/responsive-session.spec.ts:542-667` verifies hidden navigation, selection/focus restoration, inert background, Tab/Shift+Tab containment, Escape/close restoration, and desktop non-modal behavior. Targeted responsive package run passed. |
| 01-13 | T-01-30 | Denial of service | final acceptance lifecycle | mitigate | Repeated isolated generated-bin runs assert cleanup and single shutdown. | closed | `tests/e2e/pinned-session.spec.ts:311-632` is the generated-package ordering/security lifecycle matrix; `tests/e2e/pinned-session.spec.ts:1376-1419` asserts single drain. During this audit, `complete packaged Phase 1 ordering matrix` was run twice as separate Playwright invocations and passed both times; the shutdown/token/identity/metadata group also passed 5/5. |
| 01-02–01-12 | T-01-SC | Tampering | dependencies / UI dependencies | mitigate | Reuse the Plan 01 approved lockfile; no installs. | closed | All plans consume the same lockfile-v3 root exact set at `package-lock.json:4-33`; direct versions remain exact at `package.json:29-45`. The audit made no install or dependency edit, and no later plan declares an additional package. Equivalent repeated rows are deduplicated here as permitted. |
| 01-13 | T-01-SC | Tampering | packaged output | mitigate | Approved lockfile plus npm pack inventory; no installs. | closed | `package.json:10-15` publishes only the generated bin and `dist/`; the audit's successful `npm pack --dry-run` built the package and reported exactly 27 runtime/package files, including the generated bin, compiled Node modules, production HTML, and hashed CSS/JS, with no `src/`, tests, TypeScript, or Vue source. |

---

## Open Threats

No open threats. T-01-19 was closed by the directly verified generic opener diagnostic and focused non-leak regression recorded in the threat register and audit trail.

---

## Accepted Risks Log

No accepted risks.

No plan-time threat has disposition `accept`, and this audit did not convert any missing mitigation into an accepted risk.

---

## Transfer Log

No transferred risks.

No plan-time threat has disposition `transfer`.

---

## Summary Threat Flags and Unregistered Flags

None of the thirteen summaries contains a literal `## Threat Flags` section. Their security annotations and `## Threat Model Verification` entries describe the already-registered controls below; no summary declares an additional unmapped attack surface.

| Summary | Security/threat annotation mapping | Registration result |
|---|---|---|
| 01-01 | Exact-release audit, exact lock, generated bin, pack inventory | T-01-SC (release audit), T-01-01 |
| 01-02 | Shell-free bounded Git runner and immutable pinned comparison | T-01-02, T-01-03, lock-continuity T-01-SC |
| 01-03 | Process token seed, loopback lifecycle, one-drain shutdown | T-01-04, shutdown T-01-05, lock-continuity T-01-SC |
| 01-04 | Candidate identity, NUL probes, collapsed dirty state | candidate T-01-05, T-01-06, T-01-07, lock-continuity T-01-SC |
| 01-05 | Full-OID validation, sole merge base, typed failures | T-01-08 through T-01-10, lock-continuity T-01-SC |
| 01-06 | Frozen diff arrays, byte paths, immutable metadata, malformed bounds | T-01-11 through T-01-14, lock-continuity T-01-SC |
| 01-07 | Bounded object availability and no repository-content execution | T-01-15 through T-01-17, lock-continuity T-01-SC |
| 01-08 | `SAFE-02` token lifecycle and `SAFE-03` loopback/capability boundary | T-01-18 through T-01-21, lock-continuity T-01-SC |
| 01-09 | Exact path/opaque tree identity | T-01-22, lock-continuity T-01-SC |
| 01-10 | Safe textual path/status rendering and opaque tree selection | T-01-23, T-01-24, lock-continuity T-01-SC |
| 01-11 | Generic identity/error UI and explicit pinned identities | T-01-25, T-01-26, lock-continuity T-01-SC |
| 01-12 | Opaque detail requests, safe/exact path and reason display | T-01-27, T-01-28, lock-continuity T-01-SC |
| 01-13 | Hidden/modal focus safety, repeated lifecycle acceptance, final pack inventory | T-01-29, T-01-30, packaged-output T-01-SC |

**Unregistered flags:** None.

---

## Focused Verification Evidence

| Audit command | Result |
|---|---|
| `npm run test:unit -- tests/unit/inventory-protocol.test.ts tests/unit/availability.test.ts tests/unit/file-tree.test.ts` | Passed: 3 files, 34 tests. |
| `npm run test:git -- tests/git/pinned-comparison.test.ts tests/git/comparison.test.ts tests/git/inventory.test.ts tests/git/availability.test.ts tests/git/candidates.test.ts` | Passed: 5 files, 27 tests. |
| `npm run test:api -- tests/api/security.test.ts tests/api/session.test.ts` | Passed: 2 files, 31 tests. |
| `npm run test:package -- tests/e2e/pinned-session.spec.ts --grep "generated CLI opens immutable pinned session\|identity session and empty states\|metadata and availability states\|fragment token protects loopback API\|interrupt closes loopback session once"` | Passed: 5 tests. |
| `npm run test:package -- tests/e2e/responsive-session.spec.ts --grep "responsive keyboard and accessibility contract"` | Passed: 1 test. |
| `npm run test:package -- tests/e2e/pinned-session.spec.ts --grep "complete packaged Phase 1 ordering matrix"` | Passed twice in two independent invocations: 1 test each. |
| `npm pack --dry-run` | Passed: 27 allowlisted package files; generated bin, compiled Node runtime, and production Vite assets present; source/tests absent. |
| `npm run test:package -- tests/e2e/package-assets.spec.ts` | **Failed, exit 1, before its final packaged behavior assertions.** Exact failure: `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'open' imported from .../package/dist/cli/run.js` while executing the manually extracted `package/dist/bin/diff-review.mjs`. The test extracted the tarball without installing its declared dependencies. Direct source inspection and the successful dry-run pack establish the declared generated-wrapper/content control, but this regression test does not currently provide end-to-end executable proof. |
| `npx vitest run tests/cli/errors.test.ts` | **Passed, exit 0:** Vitest v4.1.10; `Test Files 1 passed (1)`; `Tests 13 passed (13)`; start `21:56:56`; duration `269ms`; wall time `0.70 seconds`. The focused T-01-19 case is `tests/cli/errors.test.ts:412-435`. |

### Audit notes

1. **Closed implementation gap:** The initial audit found T-01-19 open because the opener-error diagnostic emitted rejected error detail. Remediation candidates `fa878a4` (RED regression) and `9b83f76` (GREEN fix) are present: the catch at `src/cli/run.ts:180-185` emits generic copy without the rejection detail, and the focused observable regression at `tests/cli/errors.test.ts:412-435` passed while rejecting with the full fragment-token URL and proving post-launch diagnostics contain neither `#token=` nor that URL. This is why `threats_open` is now `0`.
2. **Non-counted test-harness failure:** `tests/e2e/package-assets.spec.ts` assumes a manually extracted npm tarball can resolve external dependencies without an npm install. That is not the installed-package boundary. It fails after confirming the generated bin is in inventory and before later asset assertions. The actual `npm pack --dry-run` inventory, deterministic wrapper source, publish allowlist, and the generated-package Playwright suites establish the declared package control. This test failure is recorded rather than hidden, but it is not a second missing threat mitigation.
3. **Duplicate authored ID:** The two `T-01-05` rows are different threats. Both are retained and independently verified.
4. **No source modification by auditors:** The original audit did not patch implementation or test files and created only this security artifact. This focused re-audit likewise modified only this security artifact.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|---|---:|---:|---:|---|
| 2026-07-20 | 34 | 33 | 1 | GSD Security Auditor (`SecurePhase01`) |
| 2026-07-20 | 34 | 34 | 0 | GSD Security Remediation Auditor (`SecurePhase01Retry`) |

### Audit protocol

- Loaded the canonical secure-phase workflow, security template, auditor protocol, and required UI output reference before analysis.
- Extracted the register from all thirteen plan-time `<threat_model>` blocks and applied only the permitted equivalence deduplication to repeated `T-01-SC` rows.
- Treated every mitigation as absent until the exact implementation path and/or focused behavioral test established it.
- Audited SUMMARY security annotations without inventing a retroactive threat model because `register_authored_at_plan_time` is true.
- Used ASVS Level 1 with `block_on: open`.
- Re-audited only T-01-19 against `src/cli/run.ts:180-185` and `tests/cli/errors.test.ts:412-435`; no other threat classification was reopened.
- Ran only `npx vitest run tests/cli/errors.test.ts`; no broad suite, package suite, formatter, linter, or install was run.

---

## Sign-Off

- [x] All plan-time threat rows have a disposition.
- [x] Every row is classified closed or open with exact evidence/files searched.
- [x] Accepted and transferred risks are explicitly accounted for.
- [x] SUMMARY security/threat annotations are mapped and unregistered flags are listed.
- [x] `threats_open: 0` confirmed.
- [x] `status: verified` set in frontmatter.

**Approval:** verified 2026-07-20 — 34/34 declared threats are closed, with T-01-19's generic opener diagnostic and non-leak regression directly verified.
