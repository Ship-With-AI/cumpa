---
phase: 03
slug: complete-review-draft
status: verified
threats_found: 39
threats_closed: 39
threats_open: 0
unique_threat_ids: 33
register_authored_at_plan_time: true
asvs_level: 1
block_on: open
created: 2026-07-23
last_audited: 2026-07-23
---

# Phase 03 — Complete Review Draft Security

This is a mitigation-verification audit, not a new-vulnerability scan. It extracted every row from the seven plan-time `<threat_model>` registers: **39 register rows** (the plan-local `T-03-SC` control occurs once in each plan) and **33 unique threat IDs**. Every registered disposition is `mitigate`; no accepted or transferred risk was declared.

## Audit Result

| Metric | Count |
|---|---:|
| Register rows found | 39 |
| Register rows closed | 39 |
| Register rows open | 0 |
| Unregistered Threat Flags | 0 |
| ASVS level | 1 |

Focused behavioral evidence executed during this audit:

- `npm run test:unit -- tests/unit/draft-mutations.test.ts tests/unit/draft-load.test.ts tests/unit/comment-groups.test.ts tests/unit/markdown-preview.test.ts` — **12 files, 85 passed**.
- `npm run test:api -- tests/api/draft-lifecycle.test.ts tests/api/draft-conflict.test.ts tests/api/draft-recovery.test.ts tests/api/draft-recovery-faults.test.ts tests/api/draft-reveal.test.ts tests/api/selector-drift.test.ts` — **11 files, 76 passed**.
- `npm run test:git -- tests/git/selector-drift.test.ts` — **7 files, 31 passed**.
- `npm run test:package -- tests/e2e/complete-review-draft.spec.ts` — all **8** packaged Chromium scenarios completed without a reported failure.

## Trust Boundaries

| Boundary | Enforced boundary |
|---|---|
| Browser to loopback API | Per-launch bearer plus exact bound Host and absent-or-exact Origin execute in `onRequest` before routes, validation, Git, or filesystem work. |
| Browser intent to draft filesystem | Mutation, recovery, and reveal routes expose fixed, strict DTOs; the server retains the canonical draft path and derives durable anchors. |
| Concurrent browser tabs to a draft | One repository/comparison queue performs reload, revision comparison, mutation, validation, and atomic replacement as one critical section. |
| Raw repository-local draft bytes to parser/recovery | Loader classifies an untouched Buffer; corrupt/newer data is read-only. Recovery verifies a byte-identical exclusive backup before replacement. |
| Browser display/navigation to pinned files | Opaque file capabilities and lossless path identities, rather than displayed paths, select exact recorded anchors. |
| Browser drift poll to Git | Server-retained launch descriptors and fixed repository closure are the only selector inputs; polling is read-only, visible-only, and coalesced. |
| Source tree to packaged runtime | Generated package tests exercise the actual loopback server, public routes, real Git, filesystem, and Monaco rather than a browser-only substitute. |

## Threat Register

| Plan | Threat ID | Category | Component | Disposition | Status | Implementation/test evidence |
|---|---|---|---|---|---|---|
| 03-01 | T-03-01 | Tampering | handoff assumptions | mitigate | CLOSED | `03-01-RECONCILIATION.json:4-34` records approved, inspection-only scope and the only created outputs; `03-01-SUMMARY.md:108-119` records the blocking approval and downstream unblocking. This plan contains no product implementation surface. |
| 03-01 | T-03-02 | Elevation of Privilege | browser/server authority seams | mitigate | CLOSED | `src/server/security.ts:89-114` performs Host, Origin, and bearer denial before route work; `src/server/capabilities.ts:136-197` closes reveal over the active store; `tests/api/draft-reveal.test.ts:40-70` proves denial precedes adapter invocation. |
| 03-01 | T-03-03 | Repudiation | plan-to-source mapping | mitigate | CLOSED | `03-01-RECONCILIATION.json:47-319` maps actual owners, executable/argument arrays, files, and coverage; the later focused commands listed above executed successfully against those owners. |
| 03-01 | T-03-SC | Tampering | package assumptions | mitigate | CLOSED | `03-01-RECONCILIATION.json:20-45` records inspection-only scope and observed package versions. Its later parser decision is represented by the exact locked Plan 04 records below, not an unpinned install. |
| 03-02 | T-03-04 | Tampering | concurrent mutation | mitigate | CLOSED | `src/server/draft-store.ts:249-281` serializes reload, revision comparison, reduction, full validation, commit, then acknowledgement. `tests/api/draft-conflict.test.ts:73-100` proves one winner and stale zero-write bytes/hash/stat/directory state. |
| 03-02 | T-03-05 | Elevation of Privilege | mutation DTO | mitigate | CLOSED | `src/contracts/api.ts:24-65` defines strict discriminated request objects with no path/ref/OID/replacement field; `src/server/routes.ts:209-270` derives add anchors from fixed capabilities; `tests/api/draft-lifecycle.test.ts` is included in the passing API run. |
| 03-02 | T-03-06 | Repudiation | accepted state | mitigate | CLOSED | `src/server/draft-store.ts:274-280` acknowledges only after `commit`; `tests/api/draft-atomicity.test.ts:90-120` injects each persistence boundary and distinguishes pre-rename preservation from post-rename visibility. |
| 03-02 | T-03-07 | Information Disclosure | errors/conflicts | mitigate | CLOSED | `src/server/security.ts:84-87,121-130` emits generic unavailable responses; `src/contracts/api.ts:165-185` limits authenticated conflicts to the canonical draft algebra; `tests/api/draft-conflict.test.ts:92-100` verifies the exact authenticated conflict state. |
| 03-02 | T-03-08 | Denial of Service | text/document size | mitigate | CLOSED | `src/contracts/draft.ts:5-11` bounds revision and text; `src/contracts/api.ts:91-104` caps comments at 10,000; `src/server/draft-store.ts:249-281` permits one queued mutation per comparison. |
| 03-02 | T-03-SC | Tampering | dependencies | mitigate | CLOSED | Mutation implementation imports Node/Zod/Fastify owners only; `package.json:35-38` retains exact direct runtime versions and no mutation-specific package is introduced. |
| 03-03 | T-03-09 | Tampering | corrupt/newer data | mitigate | CLOSED | `src/server/draft-loader.ts:73-117` classifies raw bytes before strict validation and treats newer schemas as terminal; `src/server/routes.ts:217-220` makes malformed/schema-invalid/newer mutations read-only; `tests/api/draft-recovery.test.ts:72-100,127-153` proves no fallback/write. |
| 03-03 | T-03-10 | Elevation of Privilege | recovery path | mitigate | CLOSED | `src/contracts/api.ts:187-201` permits only `expectedFingerprint`; `src/server/draft-store.ts:177-234,283-320` uses server-derived paths and exclusive backups; `tests/api/draft-reveal.test.ts:53-70` rejects body/query path authority. |
| 03-03 | T-03-11 | Denial of Service | recovery race | mitigate | CLOSED | `src/server/draft-store.ts:283-320` performs raw-state reread and fingerprint comparison inside the same `runSerialized` queue used by mutation; recovery fault/race coverage is in the passing `tests/api/draft-recovery-faults.test.ts`. |
| 03-03 | T-03-12 | Information Disclosure | validation response | mitigate | CLOSED | `src/server/draft-loader.ts:37-63` bounds public details and keeps raw Buffer internal; `src/contracts/api.ts:107-150` constrains safe paths/details; `tests/api/draft-recovery.test.ts:77-100` asserts neither raw bytes nor root path reaches the DTO. |
| 03-03 | T-03-13 | Repudiation | backup claim | mitigate | CLOSED | `src/server/draft-store.ts:187-204` syncs, rereads, length-checks, and byte-compares exclusive backups before returning a safe path; `tests/api/draft-recovery.test.ts:103-124` independently asserts backup Buffer and SHA-256 equality before validating replacement. |
| 03-03 | T-03-SC | Tampering | dependencies | mitigate | CLOSED | `src/server/draft-loader.ts:1-15` and `src/server/draft-store.ts:1-14` use Node filesystem/crypto plus existing contracts; no recovery dependency is introduced. |
| 03-04 | T-03-14 | Tampering | conflict UI | mitigate | CLOSED | `src/web/model/review-draft-state.ts:92-123` replaces canonical state only on accepted response or explicit reload and retains attempted buffers; `tests/e2e/complete-review-draft.spec.ts:407-606` is exercised by the passing packaged conflict scenario. |
| 03-04 | T-03-15 | Spoofing | path grouping/navigation | mitigate | CLOSED | `src/web/model/comment-groups.ts:26-76` keys by lossless base64url bytes and uses display only for presentation; `src/web/model/workspace-state.ts:237-254` selects the opaque exact file capability and recorded side/line. Focused grouping and packaged lifecycle tests passed. |
| 03-04 | T-03-16 | Information Disclosure | Markdown links/errors | mitigate | CLOSED | `src/web/model/markdown-preview.ts:3-19` disables HTML/linkification/plugins and accepts only HTTP(S)/mailto with `noopener noreferrer`; `tests/unit/markdown-preview.test.ts:6-21` covers script, javascript, file, data, and empty cases. |
| 03-04 | T-03-17 | Elevation of Privilege | Monaco navigation | mitigate | CLOSED | `src/web/model/workspace-state.ts:237-254` issues only fixed reveal/rebuild/focus commands for a verified stored anchor; no request or editor mutation is introduced. Packaged lifecycle scenario exercises mounted Show comment. |
| 03-04 | T-03-18 | Denial of Service | duplicate submissions | mitigate | CLOSED | `src/web/model/review-draft-state.ts:132-135` rejects starts while pending or conflicted; controller state preserves non-writing interactions and buffers. Focused review-panel and packaged lifecycle/conflict scenarios passed. |
| 03-04 | T-03-SC | Tampering | markdown dependency | mitigate | CLOSED | `package.json:35-46` pins `markdown-it` 14.3.0 and `@types/markdown-it` 14.1.2; `package-lock.json:773-776,2421-2424` records registry URLs and integrity hashes; renderer and hostile-input test above exercise the locked parser. |
| 03-05 | T-03-19 | Tampering | recovery UI | mitigate | CLOSED | `src/web/components/DraftRecovery.vue` is the recovery surface; `src/web/api/client.ts:149-160` sends only a schema-validated fingerprint; `tests/integration/draft-recovery-ui.spec.ts` is included in the Plan 03 focused browser evidence and its behavior is exercised packaged. |
| 03-05 | T-03-20 | Elevation of Privilege | reveal/copy/recovery | mitigate | CLOSED | `src/web/api/client.ts:162-169` exposes no-argument reveal; `src/server/routes.ts:293-305` rejects body/query before fixed reveal; `tests/e2e/complete-review-draft.spec.ts:748-815` proves hostile authority requests fail before opener work and safe copy has no absolute path. |
| 03-05 | T-03-21 | Information Disclosure | validation UI | mitigate | CLOSED | `src/contracts/api.ts:107-150,191-201` permits only safe relative paths and bounded details; `tests/e2e/complete-review-draft.spec.ts:758-815` proves root, token, raw draft sentinel, stderr, stack, and opener command are absent from responses, DOM, and clipboard. |
| 03-05 | T-03-22 | Spoofing | newer versus corrupt state | mitigate | CLOSED | `src/web/model/review-draft-state.ts:29-48` gives corrupt and newer distinct primary surfaces; packaged assertions at `tests/e2e/complete-review-draft.spec.ts:766-799` prove no backup/reset/downgrade path and no mutation/recovery write for newer schemas. |
| 03-05 | T-03-SC | Tampering | dependencies | mitigate | CLOSED | Recovery UI reuses existing Vue/API contracts; Plan 05 declares no added package and the final direct dependency set remains the exact locked set audited above. |
| 03-06 | T-03-23 | Tampering | selector substitution | mitigate | CLOSED | `src/git/selector-drift.ts:176-247` retains descriptors from pinned comparison and calls the runner with fixed repository cwd; `src/server/routes.ts:121-139` accepts no body/query authority; `tests/api/selector-drift.test.ts` passed. |
| 03-06 | T-03-24 | Spoofing | shortened/display identity | mitigate | CLOSED | `src/git/selector-drift.ts:147-173` compares schema-validated full OIDs, while labels are only DTO display fields; `tests/git/selector-drift.test.ts` passed and packaged drift scenarios show complete OIDs. |
| 03-06 | T-03-25 | Denial of Service | polling | mitigate | CLOSED | `src/web/model/selector-drift-state.ts:5,54-89,101-121` uses a 30-second visible-only interval, a single active request, and one coalesced follow-up; focused selector UI test is part of the accepted Plan 03 evidence. |
| 03-06 | T-03-26 | Elevation of Privilege | Git route | mitigate | CLOSED | `src/server/security.ts:89-114` guards every API request before routes; `src/server/routes.ts:121-139` performs the no-input validation before observer invocation; `tests/api/selector-drift.test.ts` verifies token/Host/Origin/body/query denial before observation. |
| 03-06 | T-03-27 | Information Disclosure | Git errors/worktree paths | mitigate | CLOSED | `src/git/selector-drift.ts:136-145,198-223` maps failures to bounded `source-unavailable` and returns no stderr/path; `src/contracts/api.ts:278-318` validates safe response shape; selector Git/API and packaged drift tests passed. |
| 03-06 | T-03-SC | Tampering | dependencies | mitigate | CLOSED | `src/git/selector-drift.ts:10,180-203` uses the existing native-Git runner with argument arrays; no drift-specific dependency was added. |
| 03-07 | T-03-28 | Tampering | packaged acceptance harness | mitigate | CLOSED | `tests/e2e/complete-review-draft.spec.ts:267-295` builds, verifies production artifacts, packs/extracts the package, and launches generated CLI; its passing eight scenarios use real browser, Git, filesystem, and routes. |
| 03-07 | T-03-29 | Spoofing | two-tab canonical state | mitigate | CLOSED | `tests/api/draft-conflict.test.ts:73-100` independently records canonical bytes/hash/stat/entries; `tests/e2e/complete-review-draft.spec.ts:407-606` exercises the two-tab response/revision/buffer contract in the package. |
| 03-07 | T-03-30 | Elevation of Privilege | security/exclusion probes | mitigate | CLOSED | Launch binds only actual `127.0.0.1` at `src/cli/run.ts:153-184`; fixed request grammar is in `src/contracts/api.ts:24-65,187-208` and `src/server/routes.ts:209-305`; packaged denial matrix at `tests/e2e/complete-review-draft.spec.ts:748-757` passed. |
| 03-07 | T-03-31 | Information Disclosure | diagnostics | mitigate | CLOSED | Generic server errors are fixed at `src/server/security.ts:121-130`; packaged assertions at `tests/e2e/complete-review-draft.spec.ts:758-815` exclude tokens, raw bytes, root paths, stderr, stack, and platform commands from observable diagnostics. |
| 03-07 | T-03-32 | Repudiation | safety claims | mitigate | CLOSED | Packaged tests independently snapshot canonical bytes, recovery backup, source state, and OIDs; examples include `tests/e2e/complete-review-draft.spec.ts:721-817,824-936`. The complete Phase 03 packaged suite ran successfully during this audit. |
| 03-07 | T-03-SC | Tampering | dependencies | mitigate | CLOSED | `tests/e2e/complete-review-draft.spec.ts:267-280` packs the approved lockfile-backed artifact without install; direct versions and parser integrity are exact in `package.json` and `package-lock.json`. |

## Summary Threat Flags

No Phase 03 summary contains a literal `## Threat Flags` section. The only explicit threat annotation is `03-05-SUMMARY.md:77-82`; it maps directly to registered T-03-19 through T-03-22. Therefore there are no `unregistered_flag` warnings.

## Accepted Risks Log

No accepted risks. All 39 plan-time register rows have implemented, observed mitigations.

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|---|---:|---:|---:|---|
| 2026-07-23 | 39 | 39 | 0 | PhaseThreeSecurity |

### Audit Protocol

- Loaded all seven Phase 03 plans and summaries, `03-VERIFICATION.md`, `03-REVIEW.md`, project skill locations, the required secure-phase workflow/reference, and only the implementation/test seams cited by the plan-time register.
- Used the authored register only; no retroactive threat model or out-of-scope threat was added.
- Treated each mitigation as absent until the cited source boundary and focused behavioral evidence established it.
- Implementation and tests were read-only. This audit created only this file.

## Sign-Off

- [x] All 39 plan-time threat rows have a `mitigate` disposition and verified implementation/test evidence.
- [x] No accepted or transferred risk was declared.
- [x] `threats_open: 0` confirmed.
- [x] `status: verified` set in frontmatter.

**Approval:** verified 2026-07-23
