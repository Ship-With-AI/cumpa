---
phase: 04
slug: agent-ready-export
status: verified
threats_open: 0
asvs_level: 1
created: 2026-07-23
---

# Phase 04 — Agent-Ready Export: Security Audit

**Audited:** 2026-07-23  
**Scope:** Canonical JSON/Markdown export, atomic publication, repository-local ignore safety, package acceptance, receipt/recovery UI, and the final native directory-exchange plus portable package-build remediation.
**ASVS level:** 1 (each phase threat model declares L1; no phase `<config>` block overrides it).

## Security Posture

All **44/44** registered Phase 04 threats declared `mitigate` disposition remain source/test grounded; the final native re-audit re-executed focused proof for affected T-04-04, T-04-13, T-04-14, T-04-34, T-04-35, T-04-39, T-04-43, and T-04-SC. No registered threat is open. One documented same-UID directory-replacement residual remains accepted beyond the locked mitigation scope and does not change the threat-register result.

## Trust Boundaries

| Boundary | Untrusted / authority-bearing input | Verified control |
|---|---|---|
| Browser → local API | Method, host, origin, session capability, request JSON | `src/server/security.ts:60-148` timing-safe bearer comparison, exact loopback host/origin policy, and bounded unavailable response; route-local strict schemas in `src/server/routes.ts:279-368`. |
| Draft/drift state → export | Draft revision, acknowledgement token, changed refs | `src/server/capabilities.ts:330-358` reloads current draft, checks revision, fingerprints the observed drift state, and issues a fresh opaque acknowledgement when needed. |
| Canonical JSON → Markdown | Canonical JSON bytes and review-controlled text | `src/export/review-export.ts:42-150` canonicalizes and reparses exact bytes; `src/export/render-review-markdown.ts:3-105` parses those bytes and dynamically fences content. |
| Server → repository export directory | Repository path, candidate pair, stable pair, and native addon capability | `src/server/export-store.ts:151-280` rejects symlink/non-directory roots and validates exact pairs; `src/server/native-exchange-capability.ts:26-67` enables exchange only after a private probe and downgrades setup/load/cleanup failures to typed unsupported; `scripts/build-native-addon.mjs:6-28` removes stale addons outside the declared darwin-arm64 target; `src/native/directory-exchange.cc:57-127` performs one no-follow `RENAME_SWAP` or fails closed. |
| Stable pair → receipt/UI | Disk bytes, server-confirmed comparison identity, and API result | `src/server/export-store.ts:248-272` rereads final/recovered pairs; `src/contracts/api.ts:397-465` strictly requires server-provided base/head labels, OIDs, and optional selector type alongside the receipt; `src/web/components/ExportReceipt.vue:23-153` only displays receipt fields. |
| Git state → inventory/ignore status | Git path records and repository `.gitignore` | `src/git/inventory.ts:68-84,174-176` recognizes only exact reserved paths; `src/server/gitignore-capability.ts:115-234` uses fixed bytes, no-follow/inode checks, and fixed re-probing. |
| Packaged CLI → real repository | Product commands, source/index/refs, lifecycle actions | `tests/package/agent-ready-export.test.ts:71-175` runs the packaged CLI against a fresh repository and asserts lifecycle/safety evidence. |

## Threat Register

| Threat ID | Category | Disposition | Evidence | Status |
|---|---|---|---|---|
| T-04-01 | Spoofing — owner evidence | mitigate | `validate-reconciliation.mjs:96-164`; fresh schema-only ledger validation passed | CLOSED |
| T-04-02 | Tampering — command ledger | mitigate | `validate-reconciliation.mjs:202-240`; fresh schema-only ledger validation passed | CLOSED |
| T-04-03 | Tampering — package/lock evidence | mitigate | `validate-reconciliation.mjs:241-297`; `tests/package/agent-ready-export.test.ts:141-175` | CLOSED |
| T-04-04 | Tampering/repudiation — publication policy | mitigate | `validate-reconciliation.mjs:299-327`; `src/server/export-store.ts:182-256` | CLOSED |
| T-04-05 | Elevation of privilege — reveal authority | mitigate | `src/server/security.ts:89-148`; `src/server/routes.ts:351-368`; `src/server/capabilities.ts:296-314` | CLOSED |
| T-04-06 | Tampering — schema and canonical order | mitigate | `src/contracts/draft.ts:193-313`; `src/export/review-export.ts:42-142`; `tests/unit/review-export.test.ts` | CLOSED |
| T-04-07 | Tampering — JSON-to-Markdown reparse | mitigate | `src/export/review-export.ts:134-142`; `src/export/render-review-markdown.ts:34-35`; `tests/unit/review-markdown.test.ts` | CLOSED |
| T-04-08 | Spoofing — Markdown-controlled content | mitigate | `src/export/render-review-markdown.ts:3-105`; `tests/unit/review-markdown.test.ts` | CLOSED |
| T-04-09 | Information disclosure — paths | mitigate | `src/contracts/draft.ts:130-180`; `tests/unit/review-export.test.ts` | CLOSED |
| T-04-10 | Repudiation — hashes and bytes | mitigate | `src/export/review-export.ts:145-150`; `tests/unit/review-export.test.ts` | CLOSED |
| T-04-SC | Tampering — supply chain | mitigate | `validate-reconciliation.mjs:241-297`; `package.json:18-21`; `scripts/build-native-addon.mjs:6-28`; `tests/unit/build-native-addon.test.ts`; packed native safety evidence | CLOSED |
| T-04-11 | Elevation of privilege — secured export/reveal routes | mitigate | `src/server/security.ts:89-148`; `src/server/routes.ts:279-368`; `tests/api/export.test.ts` | CLOSED |
| T-04-12 | Tampering — revision/drift state | mitigate | `src/server/capabilities.ts:330-358`; `tests/api/export.test.ts` | CLOSED |
| T-04-13 | Tampering — atomic re-export/refusal | mitigate | `src/server/native-exchange-capability.ts:26-67`; `src/server/export-store.ts:197-256`; `src/native/directory-exchange.cc:57-83`; `tests/unit/native-exchange-capability.test.ts`; `tests/unit/directory-exchange.test.ts`; packed safety evidence | CLOSED |
| T-04-14 | Tampering — native/repository paths | mitigate | `src/server/export-store.ts:151-179,205-250`; `src/native/directory-exchange.cc:30-83,105-127` bounds N-API arguments, rejects traversal/non-child names, uses no-follow descriptor operations, and validates regular pairs; injected-replacement and packed-native coverage | CLOSED to declared mitigation; residual logged as AR-04-01 |
| T-04-15 | Information disclosure — route/result disclosure | mitigate | `src/contracts/api.ts:397-469`; `src/server/routes.ts:279-368`; `src/server/security.ts:89-114` | CLOSED |
| T-04-16 | Repudiation — receipt | mitigate | `src/server/export-store.ts:248-272`; `src/contracts/api.ts:397-469`; `tests/api/export-publication.test.ts` | CLOSED |
| T-04-17 | Tampering — reserved-path inventory | mitigate | `src/git/inventory.ts:68-84,174-176`; `tests/git/inventory.test.ts` | CLOSED |
| T-04-18 | Elevation of privilege — append route | mitigate | `src/server/routes.ts:313-349`; `src/server/security.ts:89-148`; `tests/api/gitignore.test.ts` | CLOSED |
| T-04-19 | Tampering — `.gitignore` append | mitigate | `src/server/gitignore-capability.ts:115-234`; `tests/api/gitignore.test.ts` | CLOSED |
| T-04-20 | Spoofing — ignore status truth | mitigate | `src/git/ignore-status.ts:4-29`; `tests/git/ignore-status.test.ts` | CLOSED |
| T-04-21 | Tampering — source-control state | mitigate | `tests/helpers/source-control-snapshot.ts`; packaged safety evidence in `tests/package/agent-ready-export.test.ts:71-175` | CLOSED |
| T-04-22 | Spoofing — export readiness | mitigate | `src/web/model/review-draft-state.ts`; packaged UI-state evidence in `tests/package/agent-ready-export.test.ts:141-175` | CLOSED |
| T-04-23 | Tampering — client revision/drift request | mitigate | `src/web/api/client.ts:156-191`; `src/server/capabilities.ts:330-358`; `tests/api/export.test.ts` | CLOSED |
| T-04-24 | Information disclosure — client buffers | mitigate | `src/web/model/review-draft-state.ts`; `src/contracts/api.ts:397-465`; `src/web/components/ExportReceipt.vue:23-60`; focused API/model evidence | CLOSED |
| T-04-25 | Repudiation — progress/failure state | mitigate | `src/web/model/review-draft-state.ts:23-27,196-199`; `tests/integration/agent-ready-export-states.spec.ts` | CLOSED |
| T-04-26 | Denial of service — duplicate export action | mitigate | `src/web/components/ExportSection.vue:88-93`; packaged UI-state evidence in `tests/package/agent-ready-export.test.ts:141-175` | CLOSED |
| T-04-27 | Repudiation — displayed receipt | mitigate | `src/contracts/api.ts:397-527` strictly ties acknowledged identities to the server-confirmed comparison and rejects an acknowledgement without changed/unavailable current endpoint; `src/web/components/ExportReceipt.vue:23-153`; `tests/api/export.test.ts:211-222`; focused receipt browser test | CLOSED |
| T-04-28 | Elevation of privilege — reveal action | mitigate | `src/web/api/client.ts:217-223`; `src/server/routes.ts:351-368`; `src/server/capabilities.ts:296-314` | CLOSED |
| T-04-29 | Tampering — ignore consent | mitigate | `src/web/components/ExportReceipt.vue`; `tests/integration/export-receipt-ui.spec.ts:205-224` | CLOSED |
| T-04-30 | Information disclosure — UI/clipboard | mitigate | `src/contracts/api.ts:397-465` constrains receipt data to server-confirmed labels/OIDs and repository-relative receipt paths; `src/web/components/ExportReceipt.vue:50-60,117-153` copies/renders only those fields; focused API/model and receipt browser evidence | CLOSED |
| T-04-31 | Repudiation — copy/reveal failure | mitigate | `src/web/components/ExportReceipt.vue:51-86`; `src/web/components/ExportSection.vue:88-93`; focused receipt browser test | CLOSED |
| T-04-32 | Tampering — source/index/refs | mitigate | `tests/helpers/source-control-snapshot.ts`; packaged acceptance execution in `tests/package/agent-ready-export.test.ts:71-175` | CLOSED |
| T-04-33 | Elevation of privilege — product command | mitigate | `tests/package/agent-ready-export.test.ts:71-123` real packaged CLI lifecycle | CLOSED |
| T-04-34 | Tampering — interrupted exchange | mitigate | `src/server/export-store.ts:257-272`; `tests/api/export-publication.test.ts`; package acceptance lifecycle evidence | CLOSED |
| T-04-35 | Spoofing — unsupported fallback | mitigate | `src/server/native-exchange-capability.ts:26-67` grants capability only after complete setup/probe/cleanup and returns typed unsupported for every failure; `src/server/export-store.ts:199-201,235-245,257-260` refuses replacement without confirmed exchange; `tests/unit/native-exchange-capability.test.ts` | CLOSED |
| T-04-36 | Repudiation — receipt versus disk | mitigate | `src/server/export-store.ts:248-272`; `tests/api/export-publication.test.ts` | CLOSED |
| T-04-37 | Tampering — package source/index/refs | mitigate | `tests/package/agent-ready-export.test.ts:71-175` | CLOSED |
| T-04-38 | Elevation of privilege — package routes/capabilities | mitigate | `tests/package/agent-ready-export.test.ts:22-33,141-175` | CLOSED |
| T-04-39 | Tampering — package native re-export | mitigate | `src/server/native-exchange-capability.ts:23,58-67` resolves the addon relative to the installed server module, not cwd/repository; `scripts/build-native-addon.mjs:6-28` gates the binary and removes stale unsupported-target output; `tests/unit/build-native-addon.test.ts`; `tests/package/agent-ready-export-safety.test.ts:136-218` | CLOSED |
| T-04-40 | Repudiation — package receipt/disk | mitigate | `tests/package/agent-ready-export.test.ts:71-175`; `src/server/export-store.ts:248-272` | CLOSED |
| T-04-41 | Information disclosure — package UI/API | mitigate | `tests/package/agent-ready-export.test.ts:141-175`; `src/contracts/api.ts:397-469` | CLOSED |
| T-04-42 | Elevation of privilege — repository execution | mitigate | `tests/package/agent-ready-export.test.ts:71-175` | CLOSED |
| T-04-43 | Tampering — packaged resume/lifecycle | mitigate | `tests/package/agent-ready-export.test.ts:71-175` | CLOSED |

## Unregistered Flags

None. Every Phase 04 summary was checked for a `## Threat Flags` section; none was present. The documented directory-replacement residual maps to T-04-14 and is recorded below rather than treated as an unregistered threat.

## Accepted Risks Log

| Risk ID | Threat reference | Acceptance and evidence | Accepted by | Date |
|---|---|---|---|---|
| AR-04-01 | T-04-14 residual beyond declared mitigation | A same-UID process can still replace a managed parent after a JavaScript path-based identity check on first publication, recovery, cleanup, or reveal. Phase 04 captures `dev`/`ino`, rejects symlinks/non-directories, and revalidates immediately (`src/server/export-store.ts:151-179,197-250,264-280`). The packaged native addon now performs descriptor-relative, no-follow atomic re-export exchange (`src/native/directory-exchange.cc:57-83`), but it does not retain descriptors for all surrounding JavaScript filesystem operations. The controlled replacement test fails closed. This residual remains explicitly accepted in `04-03-SUMMARY.md:165-170`; it is not a claim of complete descriptor-race elimination. | Phase 04 contract / Main | 2026-07-23 |

## Verification Executed

| Check | Observed result |
|---|---|
| `node .planning/phases/04-agent-ready-export/validate-reconciliation.mjs --schema-only .planning/phases/04-agent-ready-export/04-01-RECONCILIATION.json` | Passed: `reconciliation ledger valid: 04-01-RECONCILIATION.json`. |
| `node .planning/phases/04-agent-ready-export/validate-reconciliation.mjs --self-test` | Passed: 34 mutation rejection branches. |
| Focused export, Markdown, API, ignore, inventory, and receipt contract tests | 39 tests across 7 files passed. |
| `npm exec vitest run tests/api/export-publication.test.ts tests/api/export.test.ts` | 14 tests across 2 files passed after publication hardening. |
| `npm exec vitest run tests/api/export.test.ts tests/api/export-publication.test.ts tests/unit/agent-ready-export-state.test.ts` | 20 tests across 3 files passed after final receipt-provenance and acknowledged-drift invariant changes. |
| `npm exec playwright test tests/integration/export-receipt-ui.spec.ts` | 4 Chromium receipt/recovery/consent tests passed. |
| `npm exec vitest run tests/package/agent-ready-export.test.ts` | Package acceptance passed; its packaged Chromium run reported 22 tests passed and completed safety/lifecycle evidence for T-04-37 through T-04-43 and T-04-SC. |
| `npm exec vitest run tests/unit/native-exchange-capability.test.ts tests/unit/build-native-addon.test.ts tests/unit/directory-exchange.test.ts tests/api/export-publication.test.ts tests/package/agent-ready-export-safety.test.ts` | Passed: 5 files / 20 tests. Re-verified fail-closed discovery, portable target gate/stale-addon removal, no-shell native build invocation, managed-parent replacement and symlink rejection, complete-pair exchange/recovery, and source-control preservation. |

## Native Remediation Re-Audit

| Control | Threats | Source/test-grounded evidence | Result |
|---|---|---|---|
| Fail-closed capability discovery | T-04-04, T-04-13, T-04-35 | `src/server/native-exchange-capability.ts:26-67` downgrades setup, load, probe, or cleanup failures to `reExportUnsupported`; `tests/unit/native-exchange-capability.test.ts:6-39` exercises setup and cleanup failures; `tests/e2e/agent-ready-export-safety.spec.ts:37-55` proves forced unavailable re-export leaves the old pair intact. | CLOSED |
| Validated portable native target; no shell interpolation | T-04-04, T-04-39, T-04-SC | `scripts/build-native-addon.mjs:6-28` admits only `darwin-arm64`, removes a stale output elsewhere, and uses `execFileSync` with an explicit compiler argv; `tests/unit/build-native-addon.test.ts:38-60` exercises stale-output removal and the declared host target. | CLOSED |
| Safe managed parent | T-04-14 | `src/server/export-store.ts:138-180,190-280` validates real, no-symlink parent identities before publication, recovery, and cleanup; `tests/api/export-publication.test.ts:130-207` rejects parent replacement and externally directed parents. | CLOSED; AR-04-01 remains bounded and accepted. |
| Stable-pair atomicity and final receipt | T-04-13, T-04-16, T-04-34, T-04-36, T-04-40 | `src/native/directory-exchange.cc:57-83,105-146` validates no-follow sibling directories and makes one `RENAME_SWAP`; `src/server/export-store.ts:212-272` validates candidates/final bytes and recovers only exact pairs; `tests/package/agent-ready-export-safety.test.ts:136-168` samples/re-reads the complete pair and recovery. | CLOSED |
| Packaged production proof | T-04-39, T-04-40, T-04-43, T-04-SC | Fresh `npm exec vitest run tests/package/agent-ready-export.test.ts` passed its focused package contract; it drove **22/22** packaged Chromium checks, including forced-unavailable refusal and a terminate/relaunch/re-export journey over a packed `dist/bin/diff-review.mjs` artifact. | CLOSED |

## Security Audit Trail

| Date | Auditor | Scope | Result |
|---|---|---|---|
| 2026-07-23 | Phase04SecurityAudit | All eight Phase 04 threat models, final receipt provenance/invariant boundary, native platform gate/probe remediation, summary flags, current mitigations, and focused evidence | Verified; 44 closed, 0 open, one documented accepted residual |
| 2026-07-23 | Phase04FinalSecurity | Native directory exchange and portable package-build remediation: capability discovery, target gate, explicit argv, managed parents, pair exchange, packaged journey, and forced-unavailable refusal | Verified; 44 closed, 0 open, AR-04-01 retained as the sole accepted residual |

## Sign-Off

- [x] Every declared threat has been verified by its declared disposition.
- [x] All mitigation evidence is code or executed focused verification, not plan/document intent alone.
- [x] No unregistered Summary threat flag was found.
- [x] Accepted residual risk is explicitly documented and bounded.
- [x] `threats_open: 0` is justified for the locked Phase 04 threat register.

**Status:** verified
