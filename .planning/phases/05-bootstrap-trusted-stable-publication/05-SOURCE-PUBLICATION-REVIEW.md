# Phase 5 Source Publication Review — SOURCE PUSH NOT AUTHORIZED

**Record kind:** `cumpa.source-publication-review/v1`  
**Current observations:** `2026-09-09T16:51:27Z`  
**Status:** Bounded source review and real private bootstrap preparation complete; waiting for the exact source-push authorization. No source push, npm login, CI dispatch/upload, hosted configuration change or registry publication has occurred.

## Exact proposed source action

| Binding | Actual value |
|---|---|
| Repository | `Ship-With-AI/cumpa` |
| Repository ID | `1327753770` |
| Current visibility / default branch | Public / `main` |
| Observed public-main precondition R | `ff72519969da8d2c0761c9533ccb27b809cd17bb` |
| Observed public-main tree | `1b0f095862fba8ead7c92d260d0c3b72c52240a3` |
| Sole proposed source P | `72c9bb499538a2c542d5165148e2d45096f7da56` |
| Proposed source tree T | `cee68f305f818383364edc1a9595800970dac580` |
| Complete reviewed-object/range SHA-256 | `b73337990b01ea44daf50b50ef6a0fda75b45c183fd2aa6147a6b0b365f1f48c` |
| Literal authorized-ref candidate | `72c9bb499538a2c542d5165148e2d45096f7da56:refs/heads/main` |

The proposed command is exactly:

```sh
git push --no-follow-tags origin 72c9bb499538a2c542d5165148e2d45096f7da56:refs/heads/main
```

This is one non-force fast-forward of the already-public main branch, using the existing selected SSH remote. It does not push current-HEAD shorthand, another ref, implicit tags, later bookkeeping, or a visibility/protection change. The source/ref/remote/hook/permission preconditions must be re-observed after actual assent and immediately before any push. A mismatch stops the operation.

The actual P commit message contains `[skip ci]`. It is an empty boundary commit on the repaired and verified tree; its actual author/committer/message/parent/signature metadata was reviewed after creation. Later local evidence/bookkeeping commits are not part of the proposed push and do not change P.

## Existing source capability and collateral-deployment boundary

- Authenticated readback confirms repository identity, public visibility, default main, and the exact observed R above.
- Main is not protected; branch-protection lookup returned 404 consistently with the branch flag, and all repository/parent ruleset pages were empty. No required-check policy was observed that would make a skipped check block this route.
- No active configured push/all-events repository webhook or local pre-push hook was observed. The configured push destination is the single selected SSH repository; no mirror, extra push refspec or follow-tags configuration was present.
- Existing SSH authentication succeeded with batch/strict-host-key checks and host-key updates/multiplexing disabled; its account matched the existing GitHub API account with repository push/admin permission. The existing GitHub CLI credential also advertises workflow scope. No credential, host-key, login or configuration state was created or changed.
- Actions are enabled with allowed actions=all. The source workflow remains manual-dispatch-only. No release workflow has been dispatched, approved or uploaded by this preparation.
- [GitHub's documented skip semantics](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs) exclude push/pull_request workflows when a pushed commit has `[skip ci]`; this does not disable later manual dispatch. The existing Supabase workflow is a push-to-main workflow. **No collateral deployment is the required post-push result, not a result already claimed.** After an authorized push, inspect the exact target's Actions/deployment state; do not weaken policy or cancel unrelated runs.

## Complete source/history review boundary

- Native Git was used as authority for every new reachable object: **53 commits, 196 trees, 156 blobs, 0 tags; 405 objects total**.
- New blob payloads total **3641028 bytes**, with **156 blob/path aliases** and **69 final changed paths** listed below.
- Every object's native SHA-1 framing was checked and its exact payload independently SHA-256-bound. Every new blob/commit decoded as UTF-8 without NUL. Historical tree entries were regular `100644` blobs; no symlink, submodule, shallow/replacement/graft or new LFS-pointer gap was observed.
- The complete compact object manifest is retained privately with the candidate. Its SHA-256 is the reviewed range digest above. Its ordered fields are kind, repositoryId, base, head, tree, objects (sorted `[oid,type,byteLength,payloadSha256]`) and blobPaths (sorted `[blobOid,sortedPaths]`). No raw private value or custody location is needed to reconstruct or verify it from native Git.
- The independent disclosure and rights/history scouts reviewed the prior actual boundary `ea6494dff2e788fcd7f98e8c622a981f4feaad93` and range digest `151ae0230fd603263f4049a6d5e7ff67b5a485e216d695ce6f5073b9d1492ef1`. Its **388 unchanged objects** were reused by hash. Main then reviewed the **17 additional objects**: the one-line scanner option-order repair, its documented-prefix regression, bounded bookkeeping, all four new commit records and actual replacement P metadata. Tree equality was never treated as approval of a new commit object.
- All **53** new commits use already-public author/committer identities; none is signed. No signature or independent ownership certification is claimed. The public actor identity fingerprint is `2e2336c7635f1c29730e5bba169628e1aaa781e38d7f6799e6b0c362d9ef5202`.

## Rights, legal bytes and source changes

| Input | Current SHA-256 |
|---|---|
| LICENSE | `c947d781600d41cdeac710b2c81f5cd04ed88bad83dcc2277cffb30768490c7d` |
| THIRD_PARTY_NOTICES.md | `44ac7b248ca311016ec0e10cd2446dd5d34df53a666af3dc5f74da18ed3e9ced` |
| package.json | `4bad666e56748bb1c7c9ed6b12043c43d28ac15383a569626f50ea5179480a54` |
| package-lock.json | `896aefb20316dc2a6588b28eb3deb2bb5483388dc59daf51f2efd839e1b2df1f` |
| Existing exact MIT assent record | `da8131b0cf7d76516dafee5c5ce8acb8d57904d9d6c1e49f89f93defa67eff6f` |
| Existing rights review record | `d65e5f780c5469757fefef685100a1d4bc6ceaded20b1234b010e8d2b8136e94` |

The LICENSE is the unchanged approved standard MIT text. Alessandro's direct assent and his witnessed report of Manuel's assent remain the existing basis; independent assent from Manuel is not invented. The current notices preserve independent third-party grants and include the Phase 4 notice/build-output reconciliation. Their current digest differs from the initial Phase 3 notice snapshot; this is not a rewrite of that old approval. The accepted Phase 4 artifact already bound the current notice digest.

No dependency-lock change against public R exists. The package manifest's distribution scripts/contract, CLI version boundary, exact-patch correction, artifact helpers/tests, workflows and local planning/policy records are included in this source delta. Independent rights review found no evidenced new competing license, missing attribution, vendor-copy or authority-trailer concern. Absence of a marker is not proof of originality or ownership; previous first-party authority statements and independently applicable grants remain distinct. Historical proprietary/GPL proposals are preserved history, not the current license.

## Bounded disclosure findings and renewed exposure scope

- All 405 new objects were inventoried. Bounded scans found **0 private-key, credential, JWT, private-custody-leaf or outside-project-context signatures**. No raw configured production origin was found.
- There are **15 literal service-origin occurrences**, representing two already-public synthetic test values, neither matching the protected production fingerprint. No new service-origin value was identified.
- There are **29 home-path occurrences** using an already-public developer-home value, and **117 email-shaped occurrences** across source/history. All new commit actors use already-public identities. These new reviewed locations are not silently covered by a blanket old privacy exception: the source authorization must acknowledge this exact expanded range exposure.
- One additional email-value fingerprint, `cc6d96611cffa9f02c3626f0b9ee897dc171e2d540a5cae349d4ec316104997b` (23 characters; 6 historical occurrences), is the synthetic `git config user.email` identity in temporary package test fixtures, not identified personal/customer data. It is included in the review rather than treated as a secret or an actual account.
- Rights-marker matches (527) were classified separately as legal/attribution/planning data. No source credential or private custody path was printed or persisted in this review.

These are bounded source/marker/context observations, not exhaustive secret detection, arbitrary encoded-data analysis, legal advice or ownership certification. Source approval must explicitly cover the reviewed exposure, including new locations of previously public metadata. Any newly identified sensitive value or rights concern blocks the push instead of inheriting an old exception.

## Real private bootstrap preparation — not artifact approval

| Binding | Actual value |
|---|---|
| Package | `@shipwithai/cumpa@1.5.0-bootstrap.0` |
| Archive basename | `shipwithai-cumpa-1.5.0-bootstrap.0.tgz` |
| Archive byte length | `3514006` |
| Archive SHA-256 | `4405580ba53d20ee2c802eb30a2e77c32fb4425ac7e53673c39de6c14cd97f5f` |
| npm SHA-1 | `c34bee6983580de9f0fbbcce3bbb6759fc9933f2` |
| npm SHA-512 SRI | `sha512-911RewXQwTbNLlrqprXf9elM89Pcz41WYhAHSzQ6YZjo9Ka9zJPwcpR1uHoP11dnYYLQEpoCagReM8kXb933hw==` |
| Final sealed evidence SHA-256 | `54fc66c7354921bae673fe53aa0d58256055df967486089232d797ad59c5cdb4` |
| Configured-origin SHA-256 | `89485617b2d50d4778542ebedc3817a3e3fcddb6520a4a9c3a66e37c3a9c6cdf` |
| Build source/tree | P/T above |

The final candidate came from one fresh configured source build and one scripts-disabled private-tree pack at P/T. The canonical production value was read from the existing GitHub variable into memory; no local .env or duplicate configuration was created. Root package/lock and legal bytes were preserved. The real scanner passed **144 files / 95 reachable web assets**. Full installed acceptance passed browser assets/workers/codicon, review/relaunch/isolated drafts, support unavailability/dismissal/feature neutrality, canonical V2/V3, real native re-export, cleanup and source-control preservation; **167 dependency relationships** were recorded. The target actually observed was Darwin ARM64, not a cross-platform native matrix. Non-loopback support access was denied during acceptance; no payment or production support mutation is claimed.

After acceptance, all four archive identities and byte length were independently rechecked, the archive and private producer/final evidence became read-only, and the sealed enriched evidence passed the real scanner again. The complete producer core/order was retained; raw origin and private locations are absent from evidence. Select custody by **P and the final evidence digest**, not newest file or tgz hash alone.

An earlier unapproved preparation from `ea6494dff2e788fcd7f98e8c622a981f4feaad93` built successfully but stopped at the documented profile-first scanner command. Its private bytes/evidence were retained read-only with failed-not-approved disposition. RED `6fd586b` and GREEN `38d5834` repaired only that unnecessary option-order restriction. The final candidate was then genuinely rebuilt from new P; equal output bytes did not substitute the prior attempt as input or authority.

At the current readback, public npm returns canonical 404 Not Found responses for both the package and the fixed bootstrap version; no prior latest tag is publicly present. This proves public absence only, not private package ownership or authenticated publication authority. The later account/2FA/vacancy and explicit bootstrap publication gates remain mandatory.

## Approval boundary

**No source-push authorization has been received.** The next attributable statement must include this exact P, T, observed public R and the SHA-256 of this completed review file, plus acknowledgement of the reviewed exposure. It covers only the displayed source push. It does not approve bootstrap bytes, npm login, registry publication, temporary hosted configuration, CI build/upload or stable publication. The original accepted Phase 4 archive/evidence/approval and both retained legacy artifacts remain untouched.

## Final changed-path inventory

| Git status | Repository-relative path |
|---|---|
| M | `.github/workflows/deploy-supabase-production.yml` |
| A | `.github/workflows/publish-npm.yml` |
| M | `.planning/PROJECT.md` |
| M | `.planning/REQUIREMENTS.md` |
| M | `.planning/ROADMAP.md` |
| M | `.planning/STATE.md` |
| A | `.planning/phases/03-distribution-contract-legal-boundary/03-03-SUMMARY.md` |
| M | `.planning/phases/03-distribution-contract-legal-boundary/03-CONTEXT.md` |
| M | `.planning/phases/03-distribution-contract-legal-boundary/03-PUBLICATION-REVIEW.md` |
| A | `.planning/phases/03-distribution-contract-legal-boundary/03-REVIEW.md` |
| A | `.planning/phases/03-distribution-contract-legal-boundary/03-SECURITY.md` |
| A | `.planning/phases/03-distribution-contract-legal-boundary/03-UAT.md` |
| A | `.planning/phases/03-distribution-contract-legal-boundary/03-VERIFICATION.md` |
| A | `.planning/phases/04-exact-runtime-tarball/04-01-PLAN.md` |
| A | `.planning/phases/04-exact-runtime-tarball/04-01-SUMMARY.md` |
| A | `.planning/phases/04-exact-runtime-tarball/04-02-PLAN.md` |
| A | `.planning/phases/04-exact-runtime-tarball/04-02-SUMMARY.md` |
| A | `.planning/phases/04-exact-runtime-tarball/04-03-PLAN.md` |
| A | `.planning/phases/04-exact-runtime-tarball/04-03-SUMMARY.md` |
| A | `.planning/phases/04-exact-runtime-tarball/04-04-PLAN.md` |
| A | `.planning/phases/04-exact-runtime-tarball/04-04-SUMMARY.md` |
| A | `.planning/phases/04-exact-runtime-tarball/04-ARTIFACT-APPROVAL.md` |
| A | `.planning/phases/04-exact-runtime-tarball/04-ARTIFACT-EVIDENCE.json` |
| A | `.planning/phases/04-exact-runtime-tarball/04-PATTERNS.md` |
| A | `.planning/phases/04-exact-runtime-tarball/04-RESEARCH.md` |
| A | `.planning/phases/04-exact-runtime-tarball/04-REVIEW.md` |
| A | `.planning/phases/04-exact-runtime-tarball/04-SECURITY.md` |
| A | `.planning/phases/04-exact-runtime-tarball/04-VERIFICATION.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-01-PLAN.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-01-SUMMARY.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-02-PLAN.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-02-SUMMARY.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-03-PLAN.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-03-SUMMARY.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-04-PLAN.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-05-PLAN.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-06-PLAN.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-CHECK.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-CONTEXT.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-PATTERNS.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-RESEARCH.md` |
| A | `.planning/phases/05-bootstrap-trusted-stable-publication/05-REVIEW.md` |
| M | `THIRD_PARTY_NOTICES.md` |
| M | `docs/distribution-operations.md` |
| M | `docs/support-service-operations.md` |
| M | `package.json` |
| M | `playwright.config.ts` |
| A | `playwright.runtime-artifact.config.ts` |
| A | `scripts/pack-runtime.mjs` |
| A | `scripts/verify-npm-release.mjs` |
| M | `scripts/verify-prerequisites.mjs` |
| M | `scripts/verify-production-artifacts.mjs` |
| M | `scripts/verify-supabase-support.mjs` |
| M | `src/cli/run.ts` |
| M | `src/git/exact-patch.ts` |
| M | `tests/api/exact-patch.test.ts` |
| M | `tests/e2e/agent-ready-export.spec.ts` |
| M | `tests/e2e/anchored-review.spec.ts` |
| M | `tests/e2e/complete-review-draft.spec.ts` |
| M | `tests/e2e/package-assets.spec.ts` |
| M | `tests/e2e/support-payment.spec.ts` |
| A | `tests/helpers/runtime-artifact.ts` |
| M | `tests/package/agent-ready-export.test.ts` |
| A | `tests/package/npm-release-verifier.test.ts` |
| A | `tests/package/runtime-artifact-verifier.test.ts` |
| A | `tests/package/runtime-package-contract.test.ts` |
| A | `tests/package/runtime-producer.test.ts` |
| M | `vitest.config.ts` |
| A | `vitest.runtime-artifact.config.ts` |
