---
phase: 03-distribution-contract-legal-boundary
plan: 03
subsystem: distribution
status: complete
human_verification: passed
tags: [mit, github, publication, git, security, evidence]
requires:
  - phase: 03-01
    provides: Rights review, retained third-party notices and named license approval record
  - phase: 03-02
    provides: Package identity and public-facing distribution documentation
provides:
  - Public Ship-With-AI/cumpa at the exact authorized source commit with anonymous source, LICENSE and Issues proof
  - Exhaustive redacted Git/GitHub exposure review and observed approved post-public protection state
  - Self-contained verifier-contract fixtures and explicit detached deployment evidence inputs
affects: [04-exact-runtime-tarball, 05-bootstrap-trusted-stable-publication]
tech-stack:
  added: []
  patterns:
    - Bind workflow logs to sorted decompressed member hashes, not transient ZIP representations
    - Keep maintainer approvals and later evidence commits outside the source snapshot they authorize
key-files:
  created:
    - .planning/phases/03-distribution-contract-legal-boundary/03-PUBLICATION-REVIEW.md
  modified:
    - .planning/phases/03-distribution-contract-legal-boundary/03-LICENSE-APPROVAL.md
    - .planning/phases/03-distribution-contract-legal-boundary/03-03-PLAN.md
    - .github/workflows/deploy-supabase-production.yml
    - scripts/verify-supabase-support.mjs
    - tests/e2e/support-payment.spec.ts
    - tests/e2e/support-restore.spec.ts
    - docs/distribution-operations.md
    - docs/support-service-operations.md
key-decisions:
  - Standard MIT supersedes the historical proprietary direction; Alessandro's direct assent and his witnessed report of Manuel's actual assent are distinctly attributed
  - Retain only the two exact owner-accepted legacy archives despite their unremediated notice finding; do not claim third-party permission or compliance
  - Preserve existing controls and accept the explicitly reviewed public-only platform consequences, without silent hardening or weaker-control assumptions
  - Public conversion authorizes no later source push, npm publication or unrelated settings change
requirements-completed: [PKG-06, PKG-07, REL-04, REL-05]
duration: not separately timed across resumed authorization checkpoints
completed: 2026-09-08
---

# Phase 03 Plan 03: Reviewed MIT Source Publication

**The existing `Ship-With-AI/cumpa` repository is public at approved commit `ff72519969da8d2c0761c9533ccb27b809cd17bb`, with exact MIT LICENSE and source/Issues access independently verified without authentication.**

## Execution and evidence

- The immutable repository remains **1327753770 / R_kgDOTyPqKg**; no substitute repository was created.
- Reviewed source reachability covers **875 commits, 3,684 trees and 2,700 blobs (7,259 objects)**. The complete redacted publication review preserves initial classifications, subsequent object projections, explicit owner dispositions and all separately attributable authorizations.
- The first authorized private push (`7c9b228…` → `ece7fcf…`) exposed a test-fixture defect in CI. The locally repaired and separately authorized second push advanced only to `ff72519969da8d2c0761c9533ccb27b809cd17bb`.
- Both private updates passed the same immutable old-OID ancestry and exact expected-old lease guards, used only repository-selected short-lived credentials and explicit HTTPS refspecs, and excluded later local evidence commits.
- Final workflow **34220014720** passed repository gates and the Supabase production deployment. Deployment **6326463240** reached success status **17983682355**. Its receipt binds the approved source/run, successful coherence and non-destructive live smoke, and zero authority before/after across the six inspected tables.
- Final exposure covers **50 terminal workflow runs, 100 jobs/check runs, 133 annotations, 50 log-content projections, 20 exact artifact ZIPs and 42 deployment/status collections**. The new artifact contains only `supabase-deployment-evidence.json`, not an npm/runtime release archive.
- Final authorized snapshot: **e784668b66563df3476f9f1039847b40df8c79bc803fc569d70f725a9e27da18**. Approved public protection disposition: **6dc6bf9649b4be99a9dd5ec34b71f10d673d284d8028a1077fd65150fca8ea48**.
- The one visibility-only command succeeded at **2026-09-08T13:02:24Z** after the complete current 47-collection preflight matched. No extra push, npm operation, artifact deletion, retention change or other manual settings mutation occurred.

## Task commits and external operations

| Task | Evidence and commits |
|---|---|
| 1 — Inventory private candidate and exposure | `bf65289`, `5939dae`, `4687c62`; exact-scope dispositions and retained-artifact updates include `e15dcce`, `85595d8`; later corrected final bindings in `3ee088c`, `4280080` |
| 2 — Separate private preparation approvals | `ee217f8`, `5ac22cb`, `3936412`; operator scope/readiness and exact review-digest statements are preserved distinctly |
| 3 — Apply bounded preparation and recapture | Two scoped, ancestry-and-lease-guarded external main updates; CI repair `ff72519`; all resulting logs/artifacts reviewed before final authorization |
| 4 — Exact final publication approval | Earlier unexecuted receipt `b7f0969`; corrected content-bound receipt `ea23e95`; no agent-authored authorization or implicit broadening |
| 5 — Visibility-only conversion and public proof | External GitHub operation at 13:02:23–13:02:24Z; current publication-result record and this summary provide the local evidence, deliberately not another public source commit |

## Verification

- Local focused Playwright suites: **13/13 passed**, including valid six-input final review and rejection of altered security/digest/manifest/lineage inputs.
- Detached real-CLI smoke ran `--final-review`, `--check-final`, `--check-promotion-evidence` and exact-cleanup `--check-run-evidence` successfully in a temporary directory **without `.planning`**. Temporary smoke storage was removed.
- Hosted CI at the approved source passed build, Vitest, the 13 Playwright contracts, Deno, database gates and production deployment. No registry publication or provenance claim follows from that success.
- Anonymous Node requests set no Authorization/Cookie header and used no Git credential helper or token-bearing environment. Repository/ref/LICENSE/Issues API checks passed. The 1,104-byte MIT LICENSE matched **c947d781600d41cdeac710b2c81f5cd04ed88bad83dcc2277cffb30768490c7d**.
- Anonymous source and Issues HTML both returned **HTTP 200** with the expected GitHub page titles. Browser-tool attempts timed out; graphical browser verification is not claimed. The direct HTTP/API scenario is the exercised fallback.
- Actual post-public protections match the approved disposition: no effective/inherited rulesets, no classic branch protection, no linked Projects; unchanged collaborators/teams, environment controls, secret/variable metadata, Actions defaults and **90-day retention**. Public fork approval is **first_time_contributors**; the private-fork endpoint is now inapplicable.
- Dependabot alerts became available/enabled with zero listed alerts; automated fixes remain disabled. Secret scanning remains disabled and code scanning reports no analysis. These observations are not clean-scan certifications.
- All audit archives were handled without extraction/execution and with protected temporary storage/cleanup. No raw credential or private configuration value is retained in evidence.

## Deviations and fixes

1. **Source-policy supersession:** Standard MIT replaced the historical proprietary direction during execution. The exact current MIT assent is Alessandro's direct approval plus his witnessed report of Manuel's own approval, not an independently verified statement or approval granted on Manuel's behalf. Original 03-01/03-02 summaries remain historical evidence; active CONTEXT/requirements and the MIT cutover supersede their obsolete policy.
2. **Explicit owner retention override:** Artifacts **9907668126** and **9928300866** remain retained, with their private backups, despite their known missing-notice finding. Earlier removal authority and its credential request were cancelled. This is a narrow owner-accepted risk, not verified third-party permission or notice compliance.
3. **CI fixture/verifier defect:** Three tests depended on absent historical planning receipts. Synthetic fixtures uncovered hardcoded deployment receipt substitution in the maintainer verifier. Detached cleanup/promotion checks now require explicit deployment input, and final review forwards its existing deployment argument. Validation guards were preserved; application/UI/API and deployment behavior were not changed.
4. **Transient metadata in audit hashes:** `temp_clone_token` and workflow-log ZIP representations changed without new source or retained log payload. The final gate stopped rather than publishing under stale hashes. The corrected projection excludes the transient clone token and binds every decompressed log member; artifact ZIP bytes remain exact-bound. Each corrected exact snapshot obtained renewed human authorization before use.
5. **Browser capability limitation:** Anonymous API/HTML checks substituted for unavailable browser tooling, with the limitation explicitly recorded rather than a fabricated visual pass.

## Threat flags and remaining human verification

- The exact retained legacy-artifact notice risk is owner-accepted and must not be relabeled compliant or broadened to other findings.
- Raw organization-wide retention/fork policy reads were denied. Effective repository retention and the actual post-public fork setting were directly observed; organization policy absence was never inferred.
- The operator confirmed both temporary preparation/visibility tokens revoked by replying `revoked` at 2026-09-08T13:42:11Z. Their two named login-Keychain copies were then removed without reading token values. No redundant remote credential check or unrelated credential change occurred.
- Final reviews are complete: code review is clean (0 findings), security closes all 23 declared threats, goal verification passes 10/10 must-haves, and `03-UAT.md` is complete with 1 passed/0 pending. Verification status is now `passed`.

## Next phase readiness

Public source/Issues access and the MIT legal/metadata boundary are established. Phase 4 still owns runtime-only tarball contents and exact artifact acceptance; Phase 5 owns registry bootstrap, OIDC publishing and actual provenance evidence. `package.json` remains private and its pre-Phase-4 allowlist is intentionally unchanged. README availability language is an ongoing verification requirement, not a false registry/publication claim, so no unapproved post-public documentation push was performed.

## Self-Check: PASSED — automated execution evidence

The exact authorized repository/main/LICENSE, real public HTTP/API responses, approved post-public controls, successful repaired CI/deployment and redacted evidence records were verified. Final code, security and goal reviews passed. The operator's temporary-token revocation confirmation and successful local copy cleanup close the sole human item. Phase 03 is formally complete, with Phase 04 — Exact Runtime Tarball ready to plan; no later local evidence commit was pushed.
