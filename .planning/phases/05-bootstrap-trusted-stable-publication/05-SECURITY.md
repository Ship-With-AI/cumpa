---
phase: 05-bootstrap-trusted-stable-publication
report: security-audit
asvs_level: 1
block_on: open
threats_total: 59
threats_closed: 59
threats_open: 0
unregistered_flags: 0
status: secured
audited_at: 2026-09-10
---

# Phase 5 Security Audit — Bootstrap & Trusted Stable Publication

## Scope and verdict

**SECURED.** All 59 plan-time threat-register entries from plans 05-01 through 05-06 have executable control evidence in the implementation or bounded evidence of the executed operation. All dispositions are `mitigate`; none is accepted or transferred. No threat flag was recorded by any of the six summaries.

The public stable release is bound to source `fcc12be291623c37211291681420fe0203df6cb0`, workflow run `34490078365`, attempt `1`, publisher job `102915021477`, artifact `10157421286`, candidate evidence `b7fe676a35c40cbd03a8d73bbb7bc83c5a4893d6aa7d01d1ab60799af3ff1091`, and archive SHA-256 `dc8f792920833415d309015d5f4c31501016e9a4a6cc945bb69dde2453137141`. Canonical release evidence is `published-verified` and has SHA-256 `95863383e21642a05e7666fb675c10da6315beaf43a52b2b720b473bdac3225d`.

This audit inspected source controls and bounded canonical records. It did **not** inspect private operation journals, credentials, or custody paths. A cited procedural source proves guard behavior; a cited canonical record proves only the stated observation.

## Authority and limitation boundary

- D-01 through D-09 are evidenced by fresh CI construction, exact identity joins, protected single publication, npm cryptographic verification, and clean public consumers.
- **D-10 is not a blanket waiver.** It recorded the temporary bootstrap `latest` pointer after an authorized one-attempt removal returned `E400`, with isolated-session cleanup. The public stable release now records `latest: 1.5.0`; no residual D-10 accepted risk remains.
- **D-11 is not a risk waiver.** It narrowly amended only the source binding to the exact source/tree above, then authorized one no-force source-only push. `05-REPAIRED-SOURCE-PUBLICATION-REVIEW.md:125-135` records public-main/tree verification and no collateral workflow/deployment.
- The remaining limitations are explicit: bounded disclosure scanning; Darwin ARM64-only native observation with documented fallback; installed transitive dependencies; no SLSA-level/exhaustive-input/every-platform/full-public-browser claim; and no asserted backend cause for the initial public-visibility gap (`05-RELEASE-EVIDENCE.json:318-324`).

## Threat verification

| Threat ID | Category | Disposition | Status | Evidence |
|---|---|---|---|---|
| T-05-01-PC | Spoofing / Tampering | mitigate | CLOSED | `scripts/verify-production-artifacts.mjs:171-199` fixes profile before parsing and enforces exact bootstrap projection; `scripts/verify-npm-release.mjs:248-277` accepts only stable profile/identity. |
| T-05-01-SP | Tampering | mitigate | CLOSED | `scripts/pack-runtime.mjs:410-475` hashes tracked source before/after build and pack; `:378-407` projects only a private tree. |
| T-05-01-HF | Tampering / Repudiation | mitigate | CLOSED | `05-CONTEXT.md:20-25` excludes Phase 4 from any fallback; `05-REPAIRED-SOURCE-PUBLICATION-REVIEW.md:65-72` records preservation; release cleanup confirms preservation at `05-RELEASE-EVIDENCE.json:315-316`. |
| T-05-01-PJ | Tampering | mitigate | CLOSED | `scripts/pack-runtime.mjs:378-403,462-468` enforces version-only projection and hashes projected/packed manifests; verifier rechecks semantics at `scripts/verify-production-artifacts.mjs:333-349`. |
| T-05-01-IV | Spoofing | mitigate | CLOSED | Fixed bootstrap/stable identities are selected in `scripts/verify-production-artifacts.mjs:82-103,171-199`; sealed stable acceptance validates package, bin, and installed identity in `scripts/verify-npm-release.mjs:248-277`. |
| T-05-01-ID | Information Disclosure | mitigate | CLOSED | Only origin fingerprint is retained (`scripts/pack-runtime.mjs:107-125,497-511`); failure output redacts origin (`:522-529`); canonical evidence omits custody locations and raw logs. |
| T-05-01-NR | Tampering | mitigate | CLOSED | Native binary/inventory verification is enforced at `scripts/verify-production-artifacts.mjs:493-499`; stable seal requires Darwin ARM64 observed re-export at `scripts/verify-npm-release.mjs:261-270`; approval records the observation at `05-CI-ARTIFACT-APPROVAL.md:48-51`. |
| T-05-01-CL | Denial of Service / Information Disclosure | mitigate | CLOSED | Private mode-0700 packing tree and signal/finally cleanup: `scripts/pack-runtime.mjs:378-407,429-441,515-519`; verifier extraction receives the same control at `scripts/verify-production-artifacts.mjs:430-452,526-530`. |
| T-05-02-01 | Tampering | mitigate | CLOSED | Stable file reads reject symlinks/mutation at `scripts/verify-npm-release.mjs:75-117`; candidate sealing independently joins archive, producer, scanner, acceptance and CI at `:319-345`. |
| T-05-02-02 | Spoofing | mitigate | CLOSED | Exact repository/ref/SHA/run/attempt/hosted-runner checks occur in `scripts/verify-npm-release.mjs:280-300,347-361`; source admission precedes checkout in `.github/workflows/publish-npm.yml:27-40`. |
| T-05-02-03 | Tampering | mitigate | CLOSED | Numeric artifact ID/digest validation is `scripts/verify-npm-release.mjs:364-383`; publisher independently rehashes downloaded inner payload at `.github/workflows/publish-npm.yml:158-188`. |
| T-05-02-04 | Spoofing | mitigate | CLOSED | npm cryptographic audit plus exact subject/repository/workflow/source/run/attempt checks are `scripts/verify-npm-release.mjs:398-440`; canonical audit exit code is 0 at `05-RELEASE-EVIDENCE.json:162-185`. |
| T-05-02-05 | Information Disclosure | mitigate | CLOSED | Evidence is bounded/allowlisted (`scripts/verify-npm-release.mjs:60-73,173-278`), isolated environments inherit only a narrow allowlist (`:443-464`), and canonical limits preserve no raw audit/provider material (`05-RELEASE-EVIDENCE.json:262-263,318-324`). |
| T-05-02-06 | Elevation of Privilege | mitigate | CLOSED | The helper exports only sealing/verification functions (`scripts/verify-npm-release.mjs:319,371,534`); there is no publish, approval, token, or credential command in it. Publication remains solely in protected workflow step `.github/workflows/publish-npm.yml:189-220`. |
| T-05-02-07 | Denial of Service | mitigate | CLOSED | Registry traffic has HTTPS/host allowlisting, three redirects, 30-second timeout, byte limits (`scripts/verify-npm-release.mjs:487-510`), shape checks (`:512-532`), and finally cleanup (`:546-590`). |
| T-05-02-SC | Tampering | mitigate | CLOSED | Release verifier imports Node built-ins only; `package.json:1-25` has no Phase 5 dependency addition; workflow pins Node/npm and uses fixed registry at `.github/workflows/publish-npm.yml:41-55,140-152`. |
| T-05-03-01 | Spoofing | mitigate | CLOSED | Input-free dispatch plus exact authorized-SHA-before-checkout guard: `.github/workflows/publish-npm.yml:3-4,27-40`; executed candidate record binds same source/run/attempt in `05-RELEASE-EVIDENCE.json:13-30`. |
| T-05-03-02 | Tampering | mitigate | CLOSED | Producer/scanner/acceptance sealing precedes read-only two-file artifact upload (`.github/workflows/publish-npm.yml:89-125`); publisher rehashes and verifies same-run evidence (`:158-188`). |
| T-05-03-03 | Elevation of Privilege | mitigate | CLOSED | Candidate has contents-read only while publish alone has `id-token: write` and protected `npm-release` environment (`.github/workflows/publish-npm.yml:14-20,127-135`); setup record states no CI npm token (`05-05-SUMMARY.md:54-60`). |
| T-05-03-04 | Information Disclosure | mitigate | CLOSED | The authoritative variable is not referenced by workflow; transient secret maps only to producer/scanner/acceptance (`.github/workflows/publish-npm.yml:58-87`). |
| T-05-03-05 | Repudiation | mitigate | CLOSED | Fixed package/version/path/source/run/artifact and distinct exact stable assent are recorded in `05-RELEASE-EVIDENCE.json:13-54`; protected deployment approval and named job complete at `:87-115`. |
| T-05-03-06 | Tampering | mitigate | CLOSED | Publisher performs exact-ID download, identity checks, `verify-candidate`, then one supplied-tarball publish; it has no project install/build/pack steps (`.github/workflows/publish-npm.yml:153-220`). |
| T-05-03-07 | Denial of Service | mitigate | CLOSED | No workflow retry/rerun branch exists; executed record proves `observedPublishInvocationCount: 1`, `retryPerformed: false`, `workflowRerunPerformed: false` (`05-RELEASE-EVIDENCE.json:104-123`). |
| T-05-03-SC | Tampering | mitigate | CLOSED | Actions use full reviewed SHAs and npm is asserted `11.19.1`; cache is disabled (`.github/workflows/publish-npm.yml:37-55,120,136-153`). |
| T-05-04-ST | Spoofing / Tampering | mitigate | CLOSED | D-11 binds exact P/tree and one no-force/no-tags push; independent credential-free public-main/tree readback is recorded at `05-REPAIRED-SOURCE-PUBLICATION-REVIEW.md:125-135`. |
| T-05-04-SD | Tampering / Denial of Service | mitigate | CLOSED | D-05 requires the one-off `[skip ci]` source path (`05-CONTEXT.md:37-40`); source review records two post-push observations with no target workflow/deployment (`05-REPAIRED-SOURCE-PUBLICATION-REVIEW.md:132-135`). |
| T-05-04-CF | Information Disclosure | mitigate | CLOSED | Canonical origin validation/fingerprint-only evidence is code-enforced (`scripts/pack-runtime.mjs:107-125`; `scripts/verify-production-artifacts.mjs:419-428`); D-06 prohibits durable plaintext (`05-CONTEXT.md:42-47`). |
| T-05-04-AS | Spoofing / Tampering | mitigate | CLOSED | Candidate approval repeats archive/evidence/source/run/attempt/artifact identities and independently rehashes custody (`05-CI-ARTIFACT-APPROVAL.md:19-42`); stable evidence preserves those same values (`05-RELEASE-EVIDENCE.json:13-54`). |
| T-05-04-HF | Tampering | mitigate | CLOSED | Historical Phase 4 artifact is explicitly retained/non-fallback by D-02 (`05-CONTEXT.md:20-25`) and final cleanup (`05-RELEASE-EVIDENCE.json:315-316,323-324`). |
| T-05-04-NC | Spoofing | mitigate | CLOSED | Candidate approval records exact stable `1.5.0` absent before protected publication (`05-CI-ARTIFACT-APPROVAL.md:52-53`); execution then records one exact version publication and read-only visibility reconciliation, with no retry (`05-RELEASE-EVIDENCE.json:104-123`). |
| T-05-04-CR | Information Disclosure / Elevation of Privilege | mitigate | CLOSED | Bootstrap guard isolates HOME/cache/prefix/config and only logs bounded state (`local://phase5-bootstrap-guard.py:161-183,233-238`); closure reports only owned contexts, preserving unrelated credentials (`05-BOOTSTRAP-PUBLICATION.json:600-648`). |
| T-05-04-AU | Spoofing / Elevation of Privilege | mitigate | CLOSED | Bootstrap evidence records authenticated account/owner/2FA/vacancy checks before each authorized publish (`05-04-SUMMARY.md:65-71`); no stable authority was inferred from bootstrap. |
| T-05-04-PA | Repudiation / Tampering | mitigate | CLOSED | Immutable bootstrap candidate approval (`05-BOOTSTRAP-APPROVAL.md:8-21`) is distinct from candidate assent (`05-CI-ARTIFACT-APPROVAL.md:9-17`) and exact stable irreversible-effects assent (`05-RELEASE-EVIDENCE.json:43-54`). |
| T-05-04-RT | Tampering | mitigate | CLOSED | Bootstrap guard only publishes the approved absolute archive with fixed `bootstrap`/public/no-script/no-retry/registry arguments (`local://phase5-bootstrap-guard.py:376-385`); the initial tag side effect and authorized failed single removal are accurately retained (`05-BOOTSTRAP-PUBLICATION.json:918-1016`). |
| T-05-04-AR | Tampering / Repudiation | mitigate | CLOSED | Bootstrap failure stopped without automatic retry (`05-04-SUMMARY.md:67-71`); stable initial visibility absence was reconciled read-only without republish/rerun (`05-RELEASE-EVIDENCE.json:114-123`). |
| T-05-04-RV | Elevation of Privilege / Repudiation | mitigate | CLOSED | Guard arms cleanup across signals, waits, errors and hard loss (`local://phase5-bootstrap-guard.py:262-330,387-495`); actual record distinguishes supported logout/operator assurance and explicitly does not claim a rejected-token probe (`05-04-SUMMARY.md:77-85`). |
| T-05-04-EV | Information Disclosure | mitigate | CLOSED | Bootstrap guard never prints raw npm output (`local://phase5-bootstrap-guard.py:1-2,332-336`); canonical stable evidence contains bounded fields/limitations and no raw bundle (`05-RELEASE-EVIDENCE.json:262-263,318-324`). |
| T-05-04-NR | Tampering | mitigate | CLOSED | CI candidate scanner/acceptance/native re-export observations are in approval (`05-CI-ARTIFACT-APPROVAL.md:48-51`), and final stable archive is hash-identical across candidate/registry identities (`05-RELEASE-EVIDENCE.json:25-33,152-160`). |
| T-05-05-01 | Spoofing | mitigate | CLOSED | GitHub identity/rights observations are native and exact; npm trusted-publisher assertion is honestly recorded as owner UI inspection—not an invented authenticated API response (`05-05-SUMMARY.md:54-60`). |
| T-05-05-02 | Elevation of Privilege | mitigate | CLOSED | Procedure preflight requires exact protected publisher environment review/no-bypass/main policy/no secrets (`local://phase5-ci-candidate-driver.py:292-316`); workflow scopes OIDC only to publish (`.github/workflows/publish-npm.yml:127-135`). |
| T-05-05-03 | Information Disclosure | mitigate | CLOSED | Procedure derives origin in memory, validates fingerprint, sends temporary secret via stdin and retains only metadata (`local://phase5-ci-candidate-driver.py:322-382`); D-06 bans durable raw origin (`05-CONTEXT.md:42-47`). |
| T-05-05-04 | Tampering | mitigate | CLOSED | Driver verifies public main exactly equals P and creates the absent-only source lease (`local://phase5-ci-candidate-driver.py:277-331,334-357`); workflow rejects mismatched `GITHUB_SHA` before checkout (`.github/workflows/publish-npm.yml:27-40`). |
| T-05-05-05 | Tampering | mitigate | CLOSED | Procedure persists intent/response, deletes only matching owned metadata, waits for active consumers, and blocks unknown/uncertain state (`local://phase5-ci-candidate-driver.py:489-572`); final evidence records both temporary transports absent (`05-RELEASE-EVIDENCE.json:304-307`). |
| T-05-05-06 | Tampering | mitigate | CLOSED | Approval defines exact two-file artifact and independent transport/inner hashes (`05-CI-ARTIFACT-APPROVAL.md:19-42`); workflow accepts only expected payload and rehashes it (`.github/workflows/publish-npm.yml:94-125,158-188`). |
| T-05-05-07 | Repudiation | mitigate | CLOSED | Candidate assent supplies all exact values but explicitly denies stable publication (`05-CI-ARTIFACT-APPROVAL.md:9-17,67-75`); stable assent separately names publisher job and irreversible effects (`05-RELEASE-EVIDENCE.json:43-54`). |
| T-05-05-08 | Denial of Service | mitigate | CLOSED | Failed runs `34476480752` and `34481083655` retained consumed authority, had no publisher/artifact, and had owned transports removed; no rerun/retry was used (`05-05-SUMMARY.md:62-76`). |
| T-05-05-SC | Tampering | mitigate | CLOSED | Procedure uses native GitHub CLI/API semantics; workflow uses pinned official actions and fixed npm; no broker or added package is present (`local://phase5-ci-candidate-driver.py:51-82`; `.github/workflows/publish-npm.yml:37-55`). |
| T-05-05-CC | Tampering / Repudiation | mitigate | CLOSED | Non-cancelling workflow concurrency is fixed (`.github/workflows/publish-npm.yml:9-11`); driver rejects competing receipts/nonterminal runs and uniquely fences the single dispatched run (`local://phase5-ci-candidate-driver.py:261-274,408-461`). |
| T-05-05-RC | Information Disclosure / Repudiation | mitigate | CLOSED | Private atomic 0700/0600 receipt with symlink refusal is implemented at `local://phase5-ci-candidate-driver.py:116-152,186-225`; recovery is cleanup-only and never publishes (`:713-785`). |
| T-05-05-DL | Denial of Service | mitigate | CLOSED | Candidate approval records native creation/artifact expiry, conservative 30/35-day bounds, and 15-minute publisher reserve (`05-CI-ARTIFACT-APPROVAL.md:55-65`); no expiry is treated as retry authority. |
| T-05-06-01 | Repudiation | mitigate | CLOSED | Stable exact-value assent names candidate identity and publisher job before native approval; it is distinct from candidate approval (`05-RELEASE-EVIDENCE.json:35-54,87-103`). |
| T-05-06-02 | Elevation of Privilege | mitigate | CLOSED | Only named protected `npm-release` publisher gets OIDC (`.github/workflows/publish-npm.yml:127-135`); executed setup says no CI npm token and records trusted publisher assurance accurately (`05-05-SUMMARY.md:54-60`). |
| T-05-06-03 | Tampering | mitigate | CLOSED | Same-run prepublish verification is mandatory before supplied tarball publish (`.github/workflows/publish-npm.yml:181-220`); canonical registry archive repeats all four identities (`05-RELEASE-EVIDENCE.json:25-33,152-160`). |
| T-05-06-04 | Denial of Service | mitigate | CLOSED | The only publish step was observed once; retry/rerun are false and initial visibility was read-only reconciled (`05-RELEASE-EVIDENCE.json:98-123`). |
| T-05-06-05 | Spoofing | mitigate | CLOSED | npm 11.19.1 cryptographically verified audit signatures/attestations, then code inspected exact 12 subject/provenance claims (`scripts/verify-npm-release.mjs:398-440`; `05-RELEASE-EVIDENCE.json:162-260`). |
| T-05-06-06 | Spoofing | mitigate | CLOSED | Separate credential-free fresh global and npx roots execute the literal `1.5.0` commands; normal global install had scripts enabled and no local fallback (`05-RELEASE-EVIDENCE.json:265-302`). |
| T-05-06-07 | Information Disclosure | mitigate | CLOSED | Public verifier uses 0700 roots, narrow inherited environment and finally removal (`scripts/verify-npm-release.mjs:443-464,546-590`); canonical cleanup confirms no owned consumer/tooling state remains (`05-RELEASE-EVIDENCE.json:304-316`). |
| T-05-06-08 | Tampering | mitigate | CLOSED | New output is create-only/atomic (`scripts/verify-npm-release.mjs:85-97,302-316`); release record is `published-verified`, has expected/observed/pass provenance rows, and final digest is bound in the verification input. |
| T-05-06-SC | Tampering | mitigate | CLOSED | Verification fixes npm `11.19.1`, registry and Node-stdlib verifier controls (`scripts/verify-npm-release.mjs:10-29,543-567`); npm itself performs cryptography rather than project hand-rolled verification. |

## Summary threat flags

No `## Threat Flags` section or threat-flag entry exists in `05-01-SUMMARY.md` through `05-06-SUMMARY.md`. Therefore there are **no unregistered flags**.

## Open threats

None. `threats_open: 0`.
