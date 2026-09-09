---
phase: "04"
slug: exact-runtime-tarball
status: blocked
threats_open: 3
high_blockers: 3
implementation_gaps: 0
asvs_level: 1
created: 2026-09-08
updated: 2026-09-09
---

# Phase 04 Security Audit

**Phase:** 04 — Exact runtime tarball  
**Audit scope:** the declared threat registers in `04-01-PLAN.md` through `04-04-PLAN.md`; implemented controls only.  
**ASVS level:** 1 (`.planning/config.json:41-44`)  
**Blocking policy:** HIGH (`.planning/config.json:41-44`)

## Verdict

- **Declared threats:** 33
- **Closed by implemented control or actual final-candidate verification:** 29
- **Declared bounded limitation:** 1 (`T-04-02-NE`; the plan's `accept` disposition, recorded without granting any new acceptance)
- **Pending approval-related lifecycle gates:** 3
- **Implementation control gaps found:** 0
- **Unresolved HIGH blockers:** 3

The real production-configured archive now exists, passed scanner and installed acceptance, and is read-only. `04-ARTIFACT-EVIDENCE.json` is `verified`, not `accepted-local`. Human SHA-256/length assent, its subsequent rehash, and the bounded approval record remain pending. The existing GitHub production variable was reused in memory; no duplicate local configuration file was created.

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
| T-04-04-SO | HIGH | mitigate | CLOSED | Final evidence `configurationSource` records the existing GitHub production variable; its fingerprint matched the prior review. The build/scanner received the origin only through process environment; evidence stores only configured state/fingerprint. |
| T-04-04-AS | HIGH | mitigate | PENDING HUMAN BINDING | All three hashes and byte length matched before/after scanner, installed acceptance and read-only mode. The actual human statement and post-assent rehash are still required. |
| T-04-04-RP | HIGH | mitigate | CLOSED | One fresh final producer invocation performed one build/pack. No archive repair, replacement or repack occurred. The preserved identity is recorded in final evidence. |
| T-04-04-LG | HIGH | mitigate | CLOSED | Final `legalReconciliation` binds unchanged approved MIT text, preserved prior grants and Monaco notices, unchanged reviewed dependency locations, additive build-helper attributions, actual legal digests and emitted inventories. |
| T-04-04-CU | HIGH | mitigate | CLOSED | The one outside-checkout candidate is mode 0444 and all archive identities were recomputed unchanged. `custody.readOnly` is true; no backup was required or created. |
| T-04-04-AP | HIGH | mitigate | PENDING HUMAN BINDING | No attributable actual-digest approval has been received. `04-ARTIFACT-APPROVAL.md` is absent and evidence remains `verified`. |
| T-04-04-PV | HIGH | mitigate | CLOSED | Final evidence limitations disclaim upload, publication, registry equality/availability, public-source alignment, provenance, source push and transport authorization. No remote mutation occurred. |
| T-04-04-NT | MEDIUM | mitigate | CLOSED | The final archive's installed acceptance observed actual Darwin ARM64 native re-export and records the fallback limitation for other targets. |
| T-04-04-ED | HIGH | mitigate | PENDING APPROVAL RECORD | Final evidence passed bounded-data checks and contains no origin, project reference, private custody path or raw logs. The eventual approval record must also be checked after actual assent. |

## HIGH Blocking Gates

These are unresolved **approval lifecycle gates**, not source implementation gaps:

1. Receive the attributable statement repeating actual SHA-256 `e7766d43f7f804b138e694b298480cdec62ebfc16960f86d4c1e3c7959cf1dca`, byte length `3513998`, and limitations acknowledgement.
2. Independently rehash the same read-only archive after assent and reject any mismatch.
3. Write and inspect the bounded approval record, then advance evidence to `accepted-local`.

These steps gate local artifact acceptance and phase completion only. They do not authorize publication, upload, source push or transport.

## Threat Flags

Implementation summaries 04-01 through 04-03 are present. The added/deleted-patch canonicalization defect discovered by installed tests is fixed and regression-covered. No unresolved implementation threat flag is asserted.

## Accepted-risk log

No new acceptance was made by this audit. The only declared `accept` disposition is `T-04-02-NE`; its bounded-scan and trusted-local-producer limitation is recorded above exactly as authored in `04-02-PLAN.md:192` and implemented verifier output (`scripts/verify-production-artifacts.mjs:469-470`).

## Integration verification — Main

The complete offline fixture acceptance subsequently passed: isolated installation, all seven browser scenarios, V2/V3 Finish, support transport denial/dismissal, real Darwin ARM64 re-export, cleanup, and source-control checks. A discovered V3 add/delete canonicalization failure was fixed at changed-file construction and covered by a RED-to-GREEN API regression; strict canonical validation remains intact. These are fixture/source checks only.

On 2026-09-09, the real origin was derived from the existing GitHub production variable without a local configuration copy. The final archive passed all seven installed scenarios, retained all independent hashes/length through read-only custody, and has bounded final evidence. The three approval-related gates above remain open; no human assent, publication authority or provenance claim is inferred.
