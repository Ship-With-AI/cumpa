---
phase: "04"
slug: exact-runtime-tarball
status: blocked
threats_open: 9
high_blockers: 8
implementation_gaps: 0
asvs_level: 1
created: 2026-09-08
---

# Phase 04 Security Audit

**Phase:** 04 — Exact runtime tarball  
**Audit scope:** the declared threat registers in `04-01-PLAN.md` through `04-04-PLAN.md`; implemented controls only.  
**ASVS level:** 1 (`.planning/config.json:41-44`)  
**Blocking policy:** HIGH (`.planning/config.json:41-44`)

## Verdict

- **Declared threats:** 33
- **Closed by implemented control:** 23
- **Declared bounded limitation:** 1 (`T-04-02-NE`; the plan's `accept` disposition, recorded without granting any new acceptance)
- **Pending final-candidate / approval lifecycle gates:** 9
- **Implementation control gaps found:** 0
- **Unresolved HIGH blockers:** 8

The 9 pending items are not code defects. `04-ARTIFACT-EVIDENCE.json` and `04-ARTIFACT-APPROVAL.md` do not exist, and `04-01-SUMMARY.md:64-68` records that the protected support origin is unavailable. Therefore no configured final candidate, immutable final evidence, read-only custody record, or attributable actual-digest approval exists. Synthetic/disposable fixture evidence is not a final candidate and is not used to close any final-candidate obligation.

This audit preserves the stated verifier boundary: extraction protections apply only after trusted locally produced, hash-bound evidence is accepted; they do **not** claim arbitrary hostile-tar safety or exhaustive credential detection.

## Threat Verification

| Threat ID | Severity | Disposition | Status | Implemented evidence / pending gate |
|---|---:|---|---|---|
| T-04-01-VS | HIGH | mitigate | CLOSED | `src/cli/run.ts:65-80` validates manifest name/version; `src/cli/run.ts:754-769` configures Commander version before the ordinary action. |
| T-04-01-SC | HIGH | mitigate | CLOSED | Runtime/legal positive allowlist is `package.json:20-25`; producer rejects any other manifest contract in `scripts/pack-runtime.mjs:187-211`; verifier requires complete inventory parity in `scripts/verify-production-artifacts.mjs:429-440`. |
| T-04-01-LC | HIGH | mitigate | CLOSED | Sole candidate pack is `npm pack --json --ignore-scripts` (`scripts/pack-runtime.mjs:376-385`); installed acceptance uses `npm install ... --ignore-scripts` (`tests/helpers/runtime-artifact.ts:333-338`). `package.json:26-46` contains no install lifecycle hook. |
| T-04-01-SO | HIGH | mitigate | CLOSED | The producer reads only `CUMPA_RELEASE_SUPPORT_SERVICE_URL`, validates/fingerprints it, and redacts failures (`scripts/pack-runtime.mjs:100-117,351-360,426-432`); verifier requires matching configured/absent state without emitting it (`scripts/verify-production-artifacts.mjs:366-375,458-470`). |
| T-04-01-DR | HIGH | mitigate | CLOSED | Closed `lstat` preflight rejects links/special files (`scripts/pack-runtime.mjs:148-172`); candidate/deployment reject dirty tracked state and all purposes recheck HEAD/tree/diff/input digest after build (`scripts/pack-runtime.mjs:361-374`). |
| T-04-01-MP | HIGH | mitigate | CLOSED | New custody/evidence paths are required (`scripts/pack-runtime.mjs:58-87`); one pack result and one custody member are enforced, then SHA-256/SHA-1/SHA-512/length are read from the archive (`scripts/pack-runtime.mjs:276-308,376-385`); evidence uses non-overwriting link creation (`scripts/pack-runtime.mjs:311-325`). |
| T-04-01-NP | MEDIUM | mitigate | CLOSED | Native source/binary safety and digests are recorded in `scripts/pack-runtime.mjs:234-248,406-420`; verifier requires the Darwin ARM64 binary or explicit absence elsewhere (`scripts/verify-production-artifacts.mjs:442-467`). |
| T-04-01-DP | MEDIUM | mitigate | CLOSED | Exact direct dependency allowlist and bidirectional addition/omission/drift checks are `scripts/verify-prerequisites.mjs:6-25,36-59`. |
| T-04-02-AS | HIGH | mitigate | CLOSED | Verifier independently reads all three algorithms and byte length with before/after file identity checks (`scripts/verify-production-artifacts.mjs:98-128`) and compares them to evidence and supplied SHA-256 before extraction (`scripts/verify-production-artifacts.mjs:223-229,352-358,456-457`). |
| T-04-02-TR | HIGH | mitigate | CLOSED | Eligibility is bounded to structured producer evidence (`scripts/verify-production-artifacts.mjs:146-220`); protected temporary extraction, one `package/` root, recursive `lstat`, and file/byte bounds are enforced in `scripts/verify-production-artifacts.mjs:377-431`. This is deliberately not arbitrary-hostile-tar protection. |
| T-04-02-ID | HIGH | mitigate | CLOSED | Forbidden paths/source maps/credential signatures and configured-origin policy are scanned per regular file (`scripts/verify-production-artifacts.mjs:31-36,262-275,410-440`); required runtime/legal files and legal digest parity are enforced at `432-440`. |
| T-04-02-WG | HIGH | mitigate | CLOSED | Recursive browser asset graph, all Monaco worker roles, and codicon asset are required by `scripts/verify-production-artifacts.mjs:329-349`; all `dist` entries must match evidence at `421-434`. |
| T-04-02-SO | HIGH | mitigate | CLOSED | Configured evidence requires canonical environment origin matching only its SHA-256 and exactly one launcher assignment; absent evidence rejects the variable and all origin occurrences (`scripts/verify-production-artifacts.mjs:366-375,447-455`). |
| T-04-02-NE | MEDIUM | accept | DOCUMENTED LIMITATION | The declared plan disposition is `accept` (`04-02-PLAN.md:192`). Verifier output records the bounded-scan/trusted-producer limitations (`scripts/verify-production-artifacts.mjs:469-470`). This audit grants no independent risk acceptance. |
| T-04-02-WU | HIGH | mitigate | CLOSED | Deployment workflow uses transient custody cleanup and uploads only `supabase-deployment-evidence.json` (`.github/workflows/deploy-supabase-production.yml:72-93`); its checker rejects other upload paths (`scripts/verify-supabase-support.mjs:1773-1794`). |
| T-04-02-CA | HIGH | mitigate | CLOSED | Evidence purpose/status constraints distinguish candidate from development/deployment checks (`scripts/verify-production-artifacts.mjs:153-159,205-219`); final approval remains a separate, absent Plan 04-04 gate. |
| T-04-03-DB | HIGH | mitigate | CLOSED | The installer inherits only a narrow environment allowlist, creates new HOME/config/cache/prefix with public registry, and validates the installed exact runtime tree (`tests/helpers/runtime-artifact.ts:257-320,322-359`). |
| T-04-03-LS | HIGH | mitigate | CLOSED | Isolated global install explicitly uses `--ignore-scripts` (`tests/helpers/runtime-artifact.ts:333-338`); the candidate acceptance aggregator consumes supplied identity rather than invoking producer/pack (`tests/package/agent-ready-export.test.ts:113-137`). |
| T-04-03-AS | HIGH | mitigate | CLOSED | Custody basename/realpath containment and pre/post multi-algorithm rehash occur in `tests/helpers/runtime-artifact.ts:156-203,222-255`; the acceptance report requires matching scanner and scenario identity (`tests/package/agent-ready-export.test.ts:119-155`). |
| T-04-03-WA | HIGH | mitigate | CLOSED | Npm-generated scoped package/bin and dependency tree are required (`tests/helpers/runtime-artifact.ts:311-359`); installed package assets, legal material, excluded source, worker and codicon behavior are exercised in `tests/e2e/package-assets.spec.ts:94-187`. |
| T-04-03-AF | HIGH | mitigate | CLOSED | Aggregation accepts only same-run schema-validated V2/V3 scenario records (`tests/package/agent-ready-export.test.ts:69-102,148-173`); installed exact-patch test checks provenance and committed bytes only after Finish (`tests/e2e/agent-ready-export.spec.ts:622-710`). |
| T-04-03-SP | HIGH | mitigate | CLOSED | Node global `fetch` is denied for non-loopback requests by the disposable installed-test guard (`tests/helpers/runtime-artifact.ts:362-376`); browser routing aborts non-loopback requests and observes unavailable/dismissed support while Finish succeeds (`tests/e2e/agent-ready-export.spec.ts:712-765`). This is test-only egress observation, not a final-candidate attestation. |
| T-04-03-NT | MEDIUM | mitigate | CLOSED | Scenario schema binds actual-target native observation to either `exported` or `reExportUnsupported` (`tests/package/agent-ready-export.test.ts:75-100`); unsupported fallback retains bytes (`tests/e2e/agent-ready-export.spec.ts:387-410`). |
| T-04-03-ER | HIGH | mitigate | CLOSED | Scenario records reject durable private-data keys/paths and use non-overwrite temporary-to-link writes (`tests/helpers/runtime-artifact.ts:407-431`); aggregator redacts origin/path values, cleans bridge state, and atomically writes the bounded report (`tests/package/agent-ready-export.test.ts:156-189`). |
| T-04-04-SO | HIGH | mitigate | PENDING FINAL GATE | Source control exists (`scripts/pack-runtime.mjs:100-117,351-360`), but no protected origin is available and no configured final candidate/evidence exists (`04-01-SUMMARY.md:64-68`). |
| T-04-04-AS | HIGH | mitigate | PENDING FINAL GATE | Multi-algorithm rehash controls exist (`scripts/verify-production-artifacts.mjs:98-128,352-358,456-457`; `tests/helpers/runtime-artifact.ts:173-255`), but there are no final bytes or final evidence to bind through every stage. |
| T-04-04-RP | HIGH | mitigate | PENDING FINAL GATE | Producer prevents destination reuse and accepts exactly one pack result (`scripts/pack-runtime.mjs:58-87,376-385`), but no unique final candidate cycle has been executed. |
| T-04-04-LG | HIGH | mitigate | PENDING FINAL GATE | Scanner enforces exact reviewed legal bytes/digests (`scripts/verify-production-artifacts.mjs:435-440`), but final lock/emitted-material reconciliation has no final artifact evidence. |
| T-04-04-CU | HIGH | mitigate | PENDING FINAL GATE | The required read-only custody observation is an explicit final-cycle operation (`04-04-PLAN.md:145-149`); no durable outside-checkout candidate or `readOnly: true` custody record exists. |
| T-04-04-AP | HIGH | mitigate | PENDING FINAL GATE | Plan 04-04 requires attributable actual SHA-256/byte-length assent and rejects placeholders (`04-04-PLAN.md:157-183`); no human approval record exists. |
| T-04-04-PV | HIGH | mitigate | PENDING FINAL GATE | Report template limitations disclaim registry/publication/provenance/alignment (`tests/package/agent-ready-export.test.ts:157-177`) and operations policy reserves publication to Phase 5 (`docs/distribution-operations.md:33-46`); no final evidence/approval/handoff exists to verify. |
| T-04-04-NT | MEDIUM | mitigate | PENDING FINAL GATE | Runtime behavior supports actual-target observation plus explicit fallback (`tests/package/agent-ready-export.test.ts:75-100`; `tests/e2e/agent-ready-export.spec.ts:387-410`), but no final candidate has the required native observation record. |
| T-04-04-ED | HIGH | mitigate | PENDING FINAL GATE | Candidate acceptance report is bounded and checks for private values (`tests/package/agent-ready-export.test.ts:157-189`), but final durable evidence and approval records do not exist for inspection. |

## HIGH Blocking Gates

These are unresolved **lifecycle gates**, not source implementation gaps. They block candidate use under the configured HIGH threshold:

1. Recover authorized protected `CUMPA_RELEASE_SUPPORT_SERVICE_URL` input without putting it in argv, evidence, logs, or a synthetic fixture.
2. Produce exactly one clean configured candidate into new outside-checkout custody and create `04-ARTIFACT-EVIDENCE.json` with the actual identity.
3. Rehash and scan those unchanged bytes; run the supplied-archive, isolated-install, browser, support, Finish/export, dependency, cleanup, and native/fallback acceptance on that candidate only.
4. Make that exact archive read-only, rehash all required identities, and record bounded custody evidence.
5. Obtain the required attributable human statement repeating the actual SHA-256 and byte length with limitations acknowledgement; only then write `04-ARTIFACT-APPROVAL.md` and advance candidate status.

No upload, publication, registry equality, provenance, public-source alignment, remote action, or approval was inferred from disposable development checks.

## Threat Flags

`04-01-SUMMARY.md` contains no `## Threat Flags` section. `04-02-SUMMARY.md` and `04-03-SUMMARY.md` are absent during active integration. No unregistered threat flag is asserted from missing summaries.

## Accepted-risk log

No new acceptance was made by this audit. The only declared `accept` disposition is `T-04-02-NE`; its bounded-scan and trusted-local-producer limitation is recorded above exactly as authored in `04-02-PLAN.md:192` and implemented verifier output (`scripts/verify-production-artifacts.mjs:469-470`).

## Integration verification — Main

The complete offline fixture acceptance subsequently passed: isolated installation, all seven browser scenarios, V2/V3 Finish, support transport denial/dismissal, real Darwin ARM64 re-export, cleanup, and source-control checks. A discovered V3 add/delete canonicalization failure was fixed at changed-file construction and covered by a RED-to-GREEN API regression; strict canonical validation remains intact. These are fixture/source checks only.

The final real-origin archive, final evidence, read-only custody and attributable digest-bound approval still do not exist. All nine final lifecycle gates above remain open, including eight HIGH blockers. No new risk acceptance, publication authority or provenance claim is granted.
