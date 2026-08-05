# Phase 13 Security Review 3

## Executive Summary

**Phase:** 13 — Exact Patch Grounding  
**ASVS level:** 1  
**Result:** **SECURED** — all 28 declared threats are closed. There are **zero open HIGH/blocking threats** and no unregistered threat flags.

This re-audit verifies current source and focused execution evidence, not plans or prior summaries. It specifically rechecked the remediated parser/decompression bounds, strict manifest integrity latch, and frozen V3 export through drift and terminal snapshot loss.

## Verification Performed

- `npx vitest run tests/git/exact-patch.test.ts tests/api/exact-patch.test.ts` — **2 files, 15 tests passed**.
- `npx playwright test --config=tests tests/integration/selector-drift-ui.spec.ts` — **6 tests passed**.

## Threat Verification

| Threat ID | Category | Disposition | Status | Evidence |
|---|---|---|---|---|
| T-13-01-01 | Input / command injection | mitigate | CLOSED | `src/contracts/request.ts:48-87` strictly discriminates bounded patch requests and two literal target kinds. `src/git/runner.ts:7-17,142-160` invokes Git with fixed argument arrays, `shell: false`, disabled hooks/external-diff features, abort signal, timeout, and bounded streams. |
| T-13-01-02 | Path traversal | mitigate | CLOSED | `src/git/exact-patch.ts:98-130` decodes Git quoting once to bytes and rejects NUL, absolute/backslash-rooted, empty, dot, traversal, `.git`, and `.compare` components. `src/git/exact-patch.ts:460-500` rejects intermediate worktree symlinks before reads. |
| T-13-01-03 | Preimage / postimage integrity | mitigate | CLOSED | `src/git/exact-patch.ts:228-232` requires full object-format IDs. `:534-608` reads bounded blobs, reconstructs both textual and reversible binary patches in memory, verifies the declared blob ID, and compares target bytes with `Buffer.equals`. Focused Git tests cover success and one-byte target drift. |
| T-13-01-04 | Repository state tampering | mitigate | CLOSED | Grounding calls only fixed read-only Git operations (`src/git/exact-patch.ts:447-455,506-531`) through the hardened runner. `tests/git/exact-patch.test.ts:96-108,130-164,250-266` captures and asserts unchanged source-control state on success and rejection paths. |
| T-13-01-05 | Resource exhaustion | mitigate | CLOSED | `src/git/exact-patch.ts:21-26,152-171,214-223` caps lines, entries, hunks, binary payload records, and grounded totals. `:273-320` limits compressed input and `inflateSync` output with `maxOutputLength`; `:329-424,447-455,506-531,559-589` uses safe-integer/ceiling checks for delta arithmetic, trees, input, every object read, and total bytes. `tests/git/exact-patch.test.ts:250-266` proves a sub-1 MiB binary patch expanding above the object ceiling is rejected without mutation. |
| T-13-01-06 | Error disclosure | mitigate | CLOSED | `src/git/exact-patch.ts:35-39,641-644` normalizes grounding failures; only fixed safe wording is intentionally emitted (`:598-608`). `src/cli/run.ts:433-439,483-495` maps grounding/snapshot failures to fixed terminal text, without request bytes, paths, object IDs, roots, stderr, or stack. |
| T-13-01-SC | Dependency integrity | accept | CLOSED | Accepted risk recorded below. Phase 13 adds no dependency, installation, or lockfile behavior. |
| T-13-02-01 | Snapshot path traversal | mitigate | CLOSED | `src/server/patch-snapshot.ts:171-193,535-588` materializes fixed side filenames in random owner-only staging/accepted roots with file/directory sync and atomic rename. `:337-346,385-393` rejects unsafe roots, symlinks, and group/world writable files. File IDs are opaque and schema-validated. |
| T-13-02-02 | Snapshot manifest / content integrity | mitigate | CLOSED | `src/server/patch-snapshot.ts:38-108` strictly validates every manifest, entry, side, path relation, unique ID, and byte ceiling. `:348-377` bounds and strictly decodes the on-disk manifest, validates its self-digest, and matches that digest to the originally accepted manifest before returning only the frozen in-memory manifest. `:385-398` verifies exact side length and SHA-256; corruption permanently latches `snapshot-unavailable`. `tests/api/exact-patch.test.ts:281-296` proves unknown-field manifest corruption latches before later capability use. |
| T-13-02-03 | Capability authorization | mitigate | CLOSED | `src/server/security.ts:62-116,135-148` requires a constant-time bearer token, exact loopback Host, and matching Origin. `src/server/routes.ts:127-141` accepts no query/body/content headers on patch status. Exact capabilities close over a single `PatchSnapshot` in `src/server/capabilities.ts:525-597`; `tests/api/exact-patch.test.ts:299-306` rejects unauthenticated and unknown-file access. |
| T-13-02-04 | Draft identity spoofing | mitigate | CLOSED | `src/server/patch-snapshot.ts:127-141` domain-separates and length-frames SHA-256 review keys over server digest, target kind, and repository identity. `src/server/draft-loader.ts:48-56` requires exact digest, target kind, and review-key equality. |
| T-13-02-05 | Drift / live-content fallback | mitigate | CLOSED | `src/server/patch-snapshot.ts:493-510` latches the first drift and terminal unavailability. Exact `readContent` and anchor verification use only `snapshot.readContent` / `snapshot.files` (`src/server/capabilities.ts:543-618`); no exact capability constructs or receives an object reader. `tests/api/exact-patch.test.ts:172-185` proves drift leaves frozen content and feedback usable. |
| T-13-02-06 | Snapshot lifecycle exhaustion | mitigate | CLOSED | `src/server/patch-snapshot.ts:28-33,539-588` bounds count, manifest, side, total, and target-tree bytes; bounded operands make cumulative arithmetic safe. It removes partial roots on failure and `:528-532` disposes idempotently. |
| T-13-02-07 | Snapshot failure-state fallback | mitigate | CLOSED | `src/server/patch-snapshot.ts:385-398` distinguishes retryable I/O from missing/access/integrity terminal failure. `:478-486,513-525` blocks terminal content/export access and never reconstructs from live data. `tests/api/exact-patch.test.ts:269-279` proves removal blocks both content and export. |
| T-13-02-SC | Dependency integrity | accept | CLOSED | Accepted risk recorded below. Snapshot support uses Node filesystem/crypto and existing dependencies only. |
| T-13-03-01 | CLI source authority | mitigate | CLOSED | `src/cli/run.ts:463-481` branches on the strict request discriminant before creating any range comparison. Patch mode grounds once, launches the exact session, and returns. |
| T-13-03-02 | Grounded-app handoff | mitigate | CLOSED | `src/cli/run.ts:392-405,463-472` passes the single grounded result once to the exact-app factory. `src/server/app.ts:136-159` materializes the snapshot before app/capability/browser setup; failure prevents launch. |
| T-13-03-03 | Export provenance spoofing | mitigate | CLOSED | `src/export/review-export.ts:181-216` verifies draft digest, target, and review key before building V3. `src/contracts/draft.ts:393-444` strictly validates full server-derived V3 patch provenance and frozen file facts; `src/export/review-export.ts:223-241` rejects noncanonical or unsupported serialized output. |
| T-13-03-04 | Terminal / Markdown injection | mitigate | CLOSED | Terminal diagnostics are fixed as noted for T-13-01-06. `src/export/render-review-markdown.ts:4-13,36-44,46-179` parses canonical validated JSON and places paths, text, context, comments, and summary in dynamically sized fences, so hostile values cannot alter Markdown structure. |
| T-13-03-05 | Drifted frozen export | mitigate | CLOSED | Exact export obtains `patch` exclusively from `snapshot.exportScope()` and builds V3 with it (`src/server/capabilities.ts:635-687`). `src/server/patch-snapshot.ts:513-525` permits the frozen scope while drifted but throws on terminal snapshot loss. `tests/api/exact-patch.test.ts:248-279` proves drifted export retains frozen provenance and omits modified live bytes, while loss blocks export. |
| T-13-03-SC | Dependency integrity | accept | CLOSED | Accepted risk recorded below. CLI/export changes use existing packages only. |
| T-13-04-01 | Patch-status spoofing | mitigate | CLOSED | `src/web/api/client.ts:255-263` accepts status only through `PatchStatusResponseSchema`; the endpoint is distinct from range drift. Server-side Host/Origin/bearer and empty-request checks are evidenced under T-13-02-03. |
| T-13-04-02 | UI frozen-content substitution | mitigate | CLOSED | Browser content comes from the authenticated file-capability DTO (`src/web/api/client.ts:228-235`), whose exact server implementation reads only the snapshot (`src/server/capabilities.ts:596-618`). Drift preserves frozen review (`tests/integration/selector-drift-ui.spec.ts:384-417`) and does not invoke a live-content route. |
| T-13-04-03 | Status-driven authority escalation | mitigate | CLOSED | `src/server/capabilities.ts:572-578` exposes only monotonic `unchanged`/`drifted`/`snapshotUnavailable` status; no acknowledge, revalidate, current-content, digest, target, key, or path authority is accepted. `src/web/App.vue:866-890` renders drift as notice and terminal loss as a blocking state. |
| T-13-04-04 | UI disclosure / XSS | mitigate | CLOSED | Exact client DTOs are schema parsed (`src/web/api/client.ts:228-263`), and Vue templates render data through text bindings rather than raw HTML. `src/web/App.vue:887-890` uses fixed drift text; `src/export/render-review-markdown.ts:46-179` preserves hostile export data as fenced text. No raw-HTML path is present in `src/web/`. |
| T-13-04-05 | Polling / alert / focus exhaustion | mitigate | CLOSED | `src/web/App.vue:772-802,804-855` permits one in-flight status request, one 30-second interval, stops after terminal status, and clears interval/listeners on unmount. `tests/integration/selector-drift-ui.spec.ts:438-507` verifies one terminal heading focus and no workspace/retry control after terminal loss. |
| T-13-04-06 | UI draft/export provenance | mitigate | CLOSED | The browser exports only through `/api/export`; exact server export verifies accepted draft identity then sends frozen `exportScope()` facts to V3 (`src/server/capabilities.ts:635-687`). The drifted V3 test at `tests/api/exact-patch.test.ts:248-267` proves frozen identity remains and live changed bytes are absent; terminal loss is blocked at `:269-279`. |
| T-13-04-SC | Dependency integrity | accept | CLOSED | Accepted risk recorded below. UI support reuses existing Vue, Monaco, Playwright, and UI components. |

## Accepted Risks

| Threat ID | Accepted risk | Basis |
|---|---|---|
| T-13-01-SC | Package supply chain | No dependency, installation, or lockfile change; implementation uses Node 24 standard-library modules and existing Git/Zod/Vitest tooling. |
| T-13-02-SC | Package supply chain | No dependency, installation, or lockfile change; snapshot support uses Node filesystem/crypto and existing Fastify/Zod/Vitest tooling. |
| T-13-03-SC | Package supply chain | No dependency, installation, or lockfile change; CLI/export support uses existing CLI, Zod, canonical serializer, and renderer. |
| T-13-04-SC | Package supply chain | No dependency, installation, or lockfile change; UI support reuses Vue, Monaco, Playwright, and existing UI components. |

## Unregistered Flags

None. `13-01-SUMMARY.md`, `13-02-SUMMARY.md`, `13-03-SUMMARY.md`, and `13-04-SUMMARY.md` contain no `## Threat Flags` section.

## Disposition

**threats_open:** 0  
**unresolved HIGH/blocking threats:** 0  
**unregistered flags:** 0

1. Bound binary-patch decompression and establish entry/hunk/object-read ceilings before reconstruction (`T-13-01-05`).
2. Parse and validate the complete snapshot manifest against an explicit strict schema/accepted immutable manifest before using entries; malformed storage must latch terminal unavailability (`T-13-02-02`).
3. Compose exact-patch export from the `PatchSnapshot`-owned frozen facts, allow it while `drifted`, and block it only when `snapshotUnavailable`; route UI export through that implementation (`T-13-03-05`, `T-13-04-06`).

## Disposition

`threats_open: 4`  
`unregistered_flags: 0`
