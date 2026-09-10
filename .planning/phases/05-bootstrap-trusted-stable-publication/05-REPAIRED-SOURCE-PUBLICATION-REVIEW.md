# Phase 5 Repaired Acceptance Source Publication Review

**Record kind:** `cumpa.source-publication-review/v1`
**Observed at:** `2026-09-10T14:03:39Z`
**Status:** reviewed; prospective-source amendment and source-only push both await explicit owner authority. No push, new CI dispatch, candidate approval or stable publication is authorized by this record.

## Exact proposed source action

| Binding | Value |
|---|---|
| Repository | `Ship-With-AI/cumpa` |
| Repository ID | `1327753770` |
| Visibility / destination | Public / `refs/heads/main` |
| Required current public main R | `72c9bb499538a2c542d5165148e2d45096f7da56` |
| Sole proposed replacement source P | `fcc12be291623c37211291681420fe0203df6cb0` |
| Proposed source tree T | `23f87114ad2ddbc18c51f95e2611ef5b4f1e9f9c` |
| Native reviewed-object manifest SHA-256 | `0092459d52c22432d08a9ce0067127132e1201be67001488ae0c29330a1b2490` |
| Final recursive tree | 764 entries: 661 regular files and 103 directories |
| Push scope | One non-forced exact refspec from P to `refs/heads/main`; no tags, mirror or later bookkeeping commits |

The source tip contains `[skip ci]`. The intended command is an explicit no-force/no-follow-tags push of only the displayed P. The current source and tree must be checked again immediately before the effect. A different commit, including a tree-equivalent bookkeeping commit, requires another review and authority.

## Confirmed defect and repair

Two separately authorized candidate runs at R failed acceptance: `34476480752` and `34481083655`, both attempt 1. Their publisher jobs were skipped, no candidate artifacts were uploaded, and both owned temporary production entries were deleted and independently observed absent. The authoritative configuration was not changed. Neither run may be rerun or treated as an approved candidate.

The second run's native Playwright call log identified `support-dialog-backdrop` intercepting the asset test's file-tree click. Both installed acceptance paths previously checked `Not now` once immediately after the editor became visible. Startup support refresh can complete later and then open the invitation, racing the next interaction.

The repair:

- Shares `openRuntimeSession` between the installed review and asset acceptance paths.
- Observes startup session/support responses before navigation, waits for the actual support outcome, and dismisses an unverified invitation through its real accessible control.
- Preserves the no-support-capability path and does not require an invitation for verified or unsuccessful support responses.
- Makes the existing asset acceptance hold support refresh beyond the editor's first paint, then verify that the real backdrop is gone before interacting.
- Changes no application code, workflow, dependency, package version, timeout, forced-click behavior or acceptance requirement.

The delayed-refresh case failed against the old opener and passed against the repair. Full installed browser/native acceptance passed locally with unchanged published bootstrap bytes, and explicit strict TypeScript checking passed for all three affected test files. These are harness-fix proofs, not a new CI candidate or retrospective provenance claim. Owned reproduction outputs and isolated diagnostic toolchains were removed.

## Source and history exposure

Native Git reviewed every object newly reachable from P relative to R:

- **26 commits, 93 trees, 67 blobs, no tags: 186 objects total.**
- New blob payloads total **909018 bytes**, with **67 blob/path aliases**.
- All native SHA-1 object framings and independent payload SHA-256 values were checked.
- Every new blob and commit decoded as UTF-8 without NUL; no new LFS pointer was accepted.
- No shallow history, replacement refs, grafts, symlink or submodule gap was accepted.
- All new commit author/committer identities were already present in public R history; no new commit is signed. No independent ownership or signature certification is claimed.

Publishing P also publishes its intervening planning/evidence history, not only the small test repair. That history includes completed bootstrap publication and authentication-cleanup outcomes, approval fingerprints, operator assurance levels, and failed CI run identities. This exposure needs explicit owner acknowledgement.

The existing bounded source-marker rules found **94 rights-marker, 52 email and 2 home-path occurrences**. All matched value fingerprints were already present in the reviewed public baseline; their new locations are nevertheless part of this proposed exposure. No private-key, credential, JWT, production service-origin, private-custody-leaf or outside-project-context match was found. Exact protected project-reference and current private custody/operation strings were also absent. The private manifest contains hashes and repository-relative aliases, not raw source payloads.

These are bounded marker/context observations, not exhaustive secret detection, arbitrary encoded-data analysis, legal advice or ownership certification.

## Legal, package and immutable-history checks

| Input | Unchanged SHA-256 |
|---|---|
| `LICENSE` | `c947d781600d41cdeac710b2c81f5cd04ed88bad83dcc2277cffb30768490c7d` |
| `THIRD_PARTY_NOTICES.md` | `44ac7b248ca311016ec0e10cd2446dd5d34df53a666af3dc5f74da18ed3e9ced` |
| `package.json` | `4bad666e56748bb1c7c9ed6b12043c43d28ac15383a569626f50ea5179480a54` |
| `package-lock.json` | `896aefb20316dc2a6588b28eb3deb2bb5483388dc59daf51f2efd839e1b2df1f` |

The approved standard MIT text, third-party grants, both workflows and all product code remain unchanged. Phase 4 archive/evidence/approval and the retained legacy artifacts remain historical and untouched.

The following sealed bootstrap records retain their exact completed digests in P:

- Evidence: `54fc66c7354921bae673fe53aa0d58256055df967486089232d797ad59c5cdb4`
- Artifact approval: `c91450bdd8fdf1c775bfa5189ba30e3534bd5867e6a55e9065db9ecdea0328ec`
- Publication: `021ce9d595cc1b09bb9f4c3dd6e6b7222abf0e724fe492e516ebad5555548720`
- Authentication/revocation: `b14d9f961cd40fccc98753b78677533d7b626237235c13d5c7c3c754189efe9c`
- Original source-publication review: `d787ab9829909bfcab95eaa3871024bf40793634c889192f50330cbcbdc76966`

The D-10 temporary `latest` exception remains unchanged. This source action neither republishes bootstrap nor moves npm tags.

## Execution preconditions and collateral control

- Native GitHub reads identified `alemagio` / `21338507`, public repository `1327753770`, current main R, and push/admin permission.
- Existing SSH authentication identified the same account with batch mode, strict host-key checks, host-key updates disabled and multiplexing disabled. GitHub's supported no-shell response exited 1; it was not a failed authentication. No authentication or host-key state was created or changed.
- The sole configured push destination is the expected SSH repository. No local pre-push hook or active push/all-events repository webhook was observed.
- Both reserved production names remain absent. No configuration change, deployment approval, cancellation or workflow dispatch belongs to this source action.
- The unchanged publication workflow is manual-dispatch-only. The `[skip ci]` tip is intended to suppress push workflows, per [GitHub skip semantics](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs).
- After an authorized push, independently verify public main P, tree T and all 764 recursive entries, then inspect Actions and deployments for this exact P. No collateral Supabase execution is an observation required after the effect, not a result claimed in advance.

## Standards

Independent standards review found no hard documented violations or material judgement-call findings. The shared opener removes the duplicate race without introducing a competing convention.

## Spec

One procedural finding remains an explicit authorization prerequisite: the active 05-05 plan binds only the original 05-04 source R. It must not silently be reinterpreted to mean a newer main tip.

### Proposed D-11 prospective-source amendment — not yet approved

The owner may authorize **only P and T displayed above** as the prospective replacement CI source, conditional on a separate exact source-only publication authorization and verified public-main equality. The active 05-05 source-binding clauses must then be amended locally before any replacement push or candidate dispatch.

This amendment preserves original source R, the bootstrap release/assents, both failed runs and all Phase 4 artifacts as immutable history. It grants no push by itself, no reuse of a consumed run authority, no automatic rerun, no candidate-byte approval and no stable publication. Any later source requires another explicit source amendment and review.

Plan-amendment and source-result bookkeeping made after P is frozen is not implicitly included in the source push.

## Final changed-path inventory

| Status | Repository-relative path |
|---|---|
| M | `.planning/REQUIREMENTS.md` |
| M | `.planning/ROADMAP.md` |
| M | `.planning/STATE.md` |
| M | `.planning/phases/05-bootstrap-trusted-stable-publication/05-04-PLAN.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-04-SUMMARY.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-BOOTSTRAP-APPROVAL.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-BOOTSTRAP-AUTH-REVOCATION.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-BOOTSTRAP-EVIDENCE.json` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-BOOTSTRAP-PUBLICATION.json` |
| M | `.planning/phases/05-bootstrap-trusted-stable-publication/05-CONTEXT.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-SOURCE-PUBLICATION-REVIEW.md` |
| M | `tests/e2e/agent-ready-export.spec.ts` |
| M | `tests/e2e/package-assets.spec.ts` |
| A | `tests/helpers/open-runtime-session.ts` |

## Authority boundary

No authority has been received for either proposed D-11 or the source push. Actual attributable decisions must bind R, P, T and the SHA-256 of this closed review, acknowledge the reviewed history/exposure, and retain every separate CI, artifact and stable-publication gate. A mismatch stops rather than changing the target.
