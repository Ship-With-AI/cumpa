---
phase: 03
slug: distribution-contract-legal-boundary
status: verified
threats_open: 0
asvs_level: 1
register_authored_at_plan_time: true
block_on: high
created: 2026-09-08
---

# Phase 03 — Security

> Formal verification of the 23 threats authored in `03-01-PLAN.md`,
> `03-02-PLAN.md`, and `03-03-PLAN.md`. This audit verifies those declared
> mitigations and does not perform a retroactive whole-repository threat scan.
>
> **Result:** all declared threats are closed or explicitly accepted. The
> separate temporary-token cleanup gate was closed on 2026-09-08T13:42:11Z
> by the operator's `revoked` confirmation; both named local Keychain copies
> were then removed. No independent remote revocation check is claimed.

## Trust Boundaries

| Boundary | Verified control | Evidence |
|---|---|---|
| Licensor/legal evidence → publication | Current MIT bytes, named assents, rights/notices, and separate final authorization are bound to exact digests. | `03-LICENSE-APPROVAL.md:7-38`; `03-PUBLICATION-REVIEW.md:114-126` |
| Local main → private remote main | The two source updates were one-ref, ancestry/expected-old-lease guarded private fast-forwards; later local evidence commits stayed out of the authorized source. | `03-PUBLICATION-REVIEW.md:1175-1185,1289-1308` |
| Private GitHub surfaces → public internet | Current source/history, Actions/deployments/artifacts, and protection state were recaptured before the one visibility-only conversion. | `03-PUBLICATION-REVIEW.md:11-24,128-154,648-662` |
| Authenticated mutation → public observation | Public identity, main, LICENSE, source, and Issues were checked without credentials after conversion. | `03-PUBLICATION-REVIEW.md:15-24,36-63` |

## Threat Register

| Threat ID | Category | Component | Disposition | Verified mitigation and evidence | Status |
|---|---|---|---|---|---|
| T-03-01-AP | Spoofing | licensor identity | mitigate | Separate current records name Alessandro (direct assent) and Manuel (Alessandro's witnessed report of Manuel's own assent). The record expressly does not claim a proxy approval or independent external verification. | closed |
| T-03-01-DG | Tampering | LICENSE/approval binding | mitigate | Current `LICENSE` is the MIT text; the approval record binds both assents to SHA-256 `c947d781…68490c7d` and says any byte change requires fresh assent. | closed |
| T-03-01-RP | Repudiation | approval evidence | mitigate | The two assent entries retain approver/source/time and exact digest; final authorization separately identifies Alessandro, timestamp, snapshot, main, and protection digest. GitHub D.4/D.5/D.8 consequences are recorded. | closed |
| T-03-01-ID | Information Disclosure | rights review | mitigate | Rights and publication records store bounded classifications, paths, and digests rather than raw secret/private values; final capture says no raw token, private configuration value, or unredacted log payload is retained. | closed |
| T-03-01-RA | Elevation of Privilege | claimed publication rights | mitigate | Rights review records the owner authority basis, distinguishes it from legal certification, preserves independent third-party material, and carries outstanding limitations into the final publication gates. | closed |
| T-03-01-NO | Tampering | third-party notices | mitigate | `THIRD_PARTY_NOTICES.md` contains the retained Monaco/DOMPurify and license text; rights review binds its hash and explains the inventory. The known historical archive omission is separately accepted only for PUB-02 below, not relabeled compliant. | closed |
| T-03-01-ST | Tampering | stale review/approval | mitigate | The final gate rejected the stale snapshot when log bindings changed, then used the renewed exact snapshot and separate final authorization before conversion. | closed |
| T-03-01-DR | Denial of Service | unresolved destructive remediation | accept | Exact owner disposition accepts retention of artifacts `9907668126` and `9928300866`; no deletion/history rewrite was performed. The exception remains an unremediated notice risk, not a rights or compliance finding. | closed (accepted) |
| T-03-02-AP | Spoofing / Repudiation | LICENSE approval prerequisite | mitigate | Exact MIT digest, named assents, and rights/notices binding were rechecked for final publication. Manuel's evidence is correctly limited to a witnessed report, not asserted as independently verified. | closed |
| T-03-02-MD | Tampering | package.json / package-lock.json | mitigate | Current `package.json` retains `private: true`, the pre-Phase-4 files allowlist, `cumpa` bin, Node `>=24`, and pinned dependency contract; root lock identity is `@shipwithai/cumpa@1.5.0` under MIT. | closed |
| T-03-02-DI | Information Disclosure | README / distribution policy | mitigate | README separates conditional registry availability from public source/Issues availability; distribution policy requires bounded redacted evidence and forbids credentials/private operational values. | closed |
| T-03-02-PB | Elevation of Privilege | npm publication boundary | mitigate | `private: true` and the allowlist remain in the manifest; operations policy assigns tarball work to Phase 4 and registry mutation to Phase 5. The result record states no npm operation occurred. | closed |
| T-03-02-PR | Spoofing | provenance claims | mitigate | README and operations policy make registry/provenance conditional on later emitted attestation evidence; final summary expressly makes no registry or provenance claim. | closed |
| T-03-02-LK | Repudiation | source and Issues links | mitigate | README names the exact repository and Issues URLs; credential-free API plus HTML checks later confirmed both public source and Issues access. | closed |
| T-03-03-SR | Information Disclosure | Git history and GitHub surfaces | mitigate | Final inventory covered 50 runs, jobs/checks/annotations, archive/deployment collections, refs, and applicable GitHub surfaces; all source deltas were content-hashed. Denied organization-wide raw policy reads were recorded as unknown, while effective repository/public-only settings were directly observed rather than inferred. | closed |
| T-03-03-RG | Tampering | remote refs/private sync | mitigate | Private preparation authorization permitted only exact `main` old→new OID updates with ancestry and expected-old lease. Preflight matched the reviewed collections, and later local evidence commits were excluded. | closed |
| T-03-03-AP | Spoofing / Repudiation | licensor/publication authorization | mitigate | Current LICENSE digest, named MIT assents, repository identity, snapshot, protection disposition, and an attributable final-publication statement were bound separately from private-preparation authority. | closed |
| T-03-03-DR | Tampering | stale snapshot race | mitigate | A changed log ZIP representation stopped the prior gate; all 50 log-content bindings, 20 artifact ZIP bindings, protections, and exact snapshot were recaptured before the single visibility-only action. The record acknowledges no atomic visibility CAS. | closed |
| T-03-03-PR | Elevation of Privilege | rulesets and protections | mitigate | Post-public effective controls match the approved supported disposition: no effective/inherited or classic rulesets, unchanged collaborators/environment/Actions metadata, 90-day retention, and public fork approval `first_time_contributors`. No unavailable organization policy or clean-scan state is claimed. | closed |
| T-03-03-RV | Information Disclosure | evidence record | mitigate | Every non-directory member of every log ZIP is canonically bound as `[member_name, uncompressed_byte_size, sha256(member_bytes)]`; all 20 artifact ZIPs remain exact byte-bound. Archives were not extracted/executed and raw data stayed temporary/protected. | closed |
| T-03-03-ID | Spoofing | target repository | mitigate | The final result binds immutable repository ID `1327753770`, node ID `R_kgDOTyPqKg`, owner/name, scoped credential read, and the authorized `main` OID before visibility mutation. | closed |
| T-03-03-PF | Repudiation | claimed public success | mitigate | Actual public state is `Ship-With-AI/cumpa`, public main `ff72519969da8d2c0761c9533ccb27b809cd17bb`, and the 1,104-byte LICENSE hashes to `c947d781…68490c7d`; credential-free API and HTML source/Issues checks succeeded. Browser visual tooling timed out, so no visual-browser pass is claimed. | closed |
| T-03-03-RB | Information Disclosure | failed rollback assumption | mitigate | The approved disposition explicitly accepts public copies/history/logs/forks may persist and prohibits automatic privacy rollback or any retraction claim. The applied result records only the one authorized visibility change, not a rollback. | closed |

### Evidence notes

- Current exact MIT assent: `03-LICENSE-APPROVAL.md:19-38`; current license text: `LICENSE`; public byte/hash confirmation: `03-PUBLICATION-REVIEW.md:17-20,42-63`.
- Exposure/protection capture and policy limits: `03-PUBLICATION-REVIEW.md:648-662`; applied public proof: `03-PUBLICATION-REVIEW.md:11-30`.
- ZIP canonicalization and byte binding: `03-PUBLICATION-REVIEW.md:139-145`. Log ZIP transport encoding is deliberately not treated as a content binding; all decompressed members are. Artifact ZIPs remain byte-authoritative.
- Source/package boundary: `package.json`; `package-lock.json:1-38`; `README.md:5-32`; `docs/distribution-operations.md:9-40`.

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---|---|---|---|---|
| PUB-02 | T-03-01-DR; supports T-03-01-NO | Exactly artifacts `9907668126` and `9928300866` remain retained despite missing root license/notice material. This is an explicit, narrow owner retention exception only; it is not third-party permission, notice compliance, a new waiver, or authority to retain other material. | Owner (explicit disposition recorded in publication review) | 2026-09-08 |
| R-02/R-03 | T-03-01-ID (bounded supporting dispositions) | The historical reviewed personal metadata and non-Cumpa context remain accepted only at the enumerated reviewed locations. Neither entry is a general allowlist for new private data. | Operator (attributable rights-review selections) | 2026-09-07 |

## Summary Threat Flags

| Summary flag | Mapping | Security treatment |
|---|---|---|
| Retained legacy-artifact notice risk | T-03-01-DR / T-03-01-NO; PUB-02 | Closed as the exact accepted risk above. It remains explicitly unremediated and must never be called compliant. |
| Organization-wide retention/fork policy reads denied | T-03-03-PR | Informational: no policy absence was inferred. The final effective repository retention and public-fork setting were observed directly. |
| Temporary preparation/visibility token revocation | `unregistered_flag` | **Human cleanup closed:** operator reported `revoked` at 2026-09-08T13:42:11Z; both named local Keychain copies were removed afterward without reading token values. Server-side revocation is operator-confirmed, not inferred from local deletion. |
| Security/code/goal review artifacts are generated after execution summary | `unregistered_flag` | Informational phase-closeout warning: artifact presence alone does not prove phase completion. |

## Human Cleanup Gate — Closed

The operator's `revoked` response at 2026-09-08T13:42:11Z confirms revocation of both temporary preparation/visibility fine-grained credentials. Main then removed the two named login-Keychain copies successfully. No token value was retrieved, no unrelated credential was touched, and no remote recheck or mutation occurred. `03-UAT.md` records the completed human item; `threats_open: 0` remains unchanged.

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|---|---:|---:|---:|---|
| 2026-09-08 | 23 | 23 | 0 | PhaseSecurity |

## Sign-Off

- [x] All 23 plan-time threats have a disposition and evidence.
- [x] Accepted risks are recorded with their exact scope.
- [x] `threats_open: 0` confirmed for the authored threat register.
- [x] `status: verified` applies to the threat register.
- [x] Operator confirmed temporary credential revocation; local temporary copies were removed.

**Approval:** Threat register verified 2026-09-08; the final human cleanup gate is closed by the operator confirmation recorded above.
