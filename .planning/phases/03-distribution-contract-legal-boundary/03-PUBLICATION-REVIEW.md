# Private Publication Review — REPAIRED SOURCE CHECKPOINT

**Record kind:** cumpa.publication-review/v1
**Collected:** 2026-09-07; authenticated observations accumulated during Task 1.
**Owner dispositions recorded:** 2026-09-08T05:23:51.698Z.
**PRIVATE PREPARATION AUTHORIZATION:** Repaired-source review `a8c4b2ce103067d3b7592c4a8248bdba0fede329b860e7ec074f0129816b1da2` is now explicitly authorized by Alessandro; scoped authentication works. Complete no-drift preflight is required before the repaired private push.
**FINAL PUBLICATION AUTHORIZATION:** Not granted.

### Repaired-source authorization received

- **Authorizer:** Alessandro Magionami, direct user message.
- **Captured:** 2026-09-08T11:14:53Z.
- **Verbatim statement:** `PRIVATE PREPARATION AUTHORIZED: Ship-With-AI/cumpa review a8c4b2ce103067d3b7592c4a8248bdba0fede329b860e7ec074f0129816b1da2`.
- **Exact bounds:** Only private main `ece7fcfc7a993e751a999145b2c74ee233402a1f` → `ff72519969da8d2c0761c9533ccb27b809cd17bb`, guarded by matching old-OID ancestry and lease, plus the unchanged CI/Supabase deployment effects in the proposal. No retry of the old run, extra ref, later local evidence commit, public visibility, npm operation, deletion or settings change is authorized.
- **Credential preflight:** A fresh secure retrieval returned the existing fine-grained token, and its authenticated read matched immutable private repository `1327753770` / `R_kgDOTyPqKg`. Scope/expiry remain as explicitly confirmed by the operator; no token bytes are recorded.

## Current repaired-source preparation review — 2026-09-08T11:07:44Z

**The first authorized private push is complete. This is a new proposal, not permission to repeat it or push local HEAD.** The current private remote main is `ece7fcfc7a993e751a999145b2c74ee233402a1f`; the reviewed repair target is `ff72519969da8d2c0761c9533ccb27b809cd17bb`. Later local review/STATE/approval/SUMMARY commits remain excluded.

- **Source review:** Five intervening commits, 24 trees and 14 blobs: **43 new reachable objects**, all read/content-hashed. Sorted `[oid,type,content_sha256]` projection: `ccdaefb35950aa4009304506a51b9663d35ffafb1c48497d9b089e353eb209f4`. Complete reviewed reachability is **875 commits, 3,684 trees, 2,700 blobs; 7,259 objects**. Native ancestry proved the exact remote old OID is an ancestor of the repair target.
- **Changed paths:** Only the maintainer verifier, the two existing verifier-contract test files, their operations documentation, and redacted publication/STATE history. No application, UI/API, package dependency/metadata, LICENSE, notices, license-assent record or workflow byte change. All corresponding unchanged bindings were rehashed against the prior approved source.
- **Classification:** Zero tested credential-pattern matches or new commit-email identities. Three full-blob matches for the configured provider mode are the verifier's existing public enum vocabulary reused in synthetic tests, not private provider identifiers. No new rights or confidentiality finding was identified. The owner-accepted exact PUB-02 artifact retention remains unremediated notice risk.
- **Verification:** 13/13 focused Playwright contracts pass; four real verifier commands also pass in an isolated temporary directory with no `.planning` directory. All previous manifest/lineage/digest rejection checks remain active. The small verifier change eliminates hidden deployment-input substitution; it does not bypass validation or change deployment/app behavior.
- **Actual remote exposure:** The fully reviewed terminal post-sync state above has exposure SHA-256 `c178b45f3e69089b7999889cb2820d5a9af503a5c5a2301d39ceb6aad6b92f6c` and unchanged protection SHA-256 `96b362425508a1340047171187a2c2559c56dc193328d9dd7cfa87d92d5cbe90`. The only new prior-run exposure is the reviewed failed run `34216472139`; production deployment was skipped. There is no new artifact or unresolved exposure finding beyond the exact accepted PUB-02 risk.
- **Proposed effect:** One ancestry-and-exact-lease-guarded private main fast-forward to the repair target, triggering the unchanged repository gates and, if they pass, the existing Supabase production deployment and deployment-evidence upload. No workflow retry, additional ref, public visibility, npm publication, deletion, retention/protection change or later evidence-commit push is authorized here.
- **Credential:** The existing repository-selected short-lived credential is working, subject to expiry/revalidation. Contents-write is needed for this update; its already operator-approved Workflows-write permission is unchanged and no new permissions are requested. No new token setup or cancelled deletion credential is needed.

**Repaired private-preparation review SHA-256: `a8c4b2ce103067d3b7592c4a8248bdba0fede329b860e7ec074f0129816b1da2`.** Serialization and projection rules are unchanged from the corrected contract below, including exclusion of `temp_clone_token`. The exact proposal is:

```json
{
  "credential_requirement": {
    "ambient_write_fallback": false,
    "cancelled_deletion_credential": "do not retrieve or reuse",
    "repository_id": 1327753770,
    "required_push_permissions": [
      "Contents:write"
    ],
    "selection": "only Ship-With-AI/cumpa",
    "short_lived": true,
    "operator_confirmed_existing_permissions": [
      "Contents:write",
      "Workflows:write"
    ]
  },
  "expected_push_effects": [
    "existing repository-gates workflow",
    "existing Supabase production deployment after gates pass",
    "supabase-deployment-evidence.json upload only; inspect resulting logs/artifacts before final publication authorization"
  ],
  "expected_visibility": "private",
  "exposure_sha256": "c178b45f3e69089b7999889cb2820d5a9af503a5c5a2301d39ceb6aad6b92f6c",
  "kind": "cumpa.private-preparation-proposal/v1",
  "later_local_evidence_commits_authorized": false,
  "main_update": {
    "ref": "refs/heads/main",
    "fast_forward_only": true,
    "ancestor_must_be": "ece7fcfc7a993e751a999145b2c74ee233402a1f",
    "lease": "--force-with-lease=refs/heads/main:ece7fcfc7a993e751a999145b2c74ee233402a1f",
    "refspec": "ff72519969da8d2c0761c9533ccb27b809cd17bb:refs/heads/main"
  },
  "npm_authorized": false,
  "preserve": [
    "all artifacts and private backups",
    "all run records and logs",
    "all other refs",
    "all Git history",
    "all retention and protection settings"
  ],
  "prior_reviewed_source_oid": "ece7fcfc7a993e751a999145b2c74ee233402a1f",
  "protection_changes": [],
  "protection_sha256": "96b362425508a1340047171187a2c2559c56dc193328d9dd7cfa87d92d5cbe90",
  "remote_main_before": "ece7fcfc7a993e751a999145b2c74ee233402a1f",
  "remote_refs": [
    [
      "refs/heads/main",
      "ece7fcfc7a993e751a999145b2c74ee233402a1f"
    ]
  ],
  "repository": "Ship-With-AI/cumpa",
  "repository_id": 1327753770,
  "repository_node_id": "R_kgDOTyPqKg",
  "retained_owner_accepted_notice_risk": [
    {
      "archive": "3e4813bebbad2155ca473fe022cbb34196b1eadf85453f37bc675259b82cb453",
      "id": 9907668126,
      "members": "215ddd7bc9bec5b00c0bbc22d6e8385e9979a9d2e66bff99562cbc900950be58",
      "size": 3482130
    },
    {
      "archive": "bfbd790230ffaf37d5f6dc89fd792484c26a2062a32d8c50ab72e9ee7ec6afac",
      "id": 9928300866,
      "members": "d1dae1f17e6658b019c3edf889376649e684923f4d7fb585e181c4a2738eb720",
      "size": 3482132
    }
  ],
  "source_bindings": {
    "LICENSE": "c947d781600d41cdeac710b2c81f5cd04ed88bad83dcc2277cffb30768490c7d",
    "THIRD_PARTY_NOTICES.md": "847c9cb7c9e3585ed7ae518208ac934c5658f0fdb01ad2f2a20b50f56015d143",
    ".planning/phases/03-distribution-contract-legal-boundary/03-RIGHTS-REVIEW.md": "d65e5f780c5469757fefef685100a1d4bc6ceaded20b1234b010e8d2b8136e94",
    ".planning/phases/03-distribution-contract-legal-boundary/03-LICENSE-APPROVAL.md": "da8131b0cf7d76516dafee5c5ce8acb8d57904d9d6c1e49f89f93defa67eff6f",
    "package.json": "5ae67356a55c01be628cc4f82d4debba272984d9a28e1824069878e7ded2c5b3",
    "package-lock.json": "896aefb20316dc2a6588b28eb3deb2bb5483388dc59daf51f2efd839e1b2df1f",
    "README.md": "7eba4475ecf0d610ee57afb555c2afc328dcd8c604ae41e56b4ab1cfd1f0e065",
    "docs/distribution-operations.md": "5d36cfaac8164567eaaf9775cd5a0c03db028a34e01df4ba49fa14de174f096f",
    "docs/support-service-operations.md": "a453d5a1c86d34f553ce601082572307542fcc48c89c244254e4c49fb79b1515",
    ".github/workflows/deploy-supabase-production.yml": "0cc92062e9b5ccefc4ae68ddf9494be6d5fec4f03ab07d2df67262293b6fe2d0",
    "scripts/verify-supabase-support.mjs": "6e83bb0ea66015d6ab446a0109e6730ad849dd68299ff14584316e9eb224110d",
    "tests/e2e/support-payment.spec.ts": "2aa85ba8fa18c284de82a3732369775becce2e5655b5bbcecfdfd93dab98d33d",
    "tests/e2e/support-restore.spec.ts": "de11d5bd17a391f96d2639accfd5ebcfe239ce5454279d416f1b2f72f132f473"
  },
  "source_delta_sha256": "ccdaefb35950aa4009304506a51b9663d35ffafb1c48497d9b089e353eb209f4",
  "source_target_oid": "ff72519969da8d2c0761c9533ccb27b809cd17bb",
  "visibility_authorized": false,
  "repair_scope": {
    "maintainer_verifier": "Use explicit deployment evidence for detached cleanup/promotion validation and forward --test-deployment through final review; retain all validation guards.",
    "tests": "Self-contained deterministic fixtures; 13 focused tests and four detached real-CLI commands passed.",
    "documentation": "Document detached evidence inputs and preserve redacted phase authorization/execution history.",
    "application_and_workflow_changes": false
  }
}
```

### Repaired-source authorization gate

The operator supplied exactly:

`PRIVATE PREPARATION AUTHORIZED: Ship-With-AI/cumpa review a8c4b2ce103067d3b7592c4a8248bdba0fede329b860e7ec074f0129816b1da2`

Authorization for this repaired-source digest is recorded above. Recheck current identity/private visibility, exact old ref, complete exposure/protection bindings, LICENSE/assent and credential validity before applying it. After the authorized push, review the resulting CI/deployment content and rebuild the actual snapshot for the distinct final-publication gate. **Do not substitute a later local HEAD or broaden the authorization.**

### Renewed private-preparation authorization

- **Authorizer:** Alessandro Magionami, direct user message.
- **Captured:** 2026-09-08T10:33:17Z.
- **Verbatim statement:** `PRIVATE PREPARATION AUTHORIZED: Ship-With-AI/cumpa review 3f44e7f08e193f915e35698af8ac33e4ee3b75e9725549a4d4e48394b8e1209c`.
- **Authorized bounds:** Only the proposal JSON below: private main from `7c9b22801378de313a7f2b9be7261eb17c4bb613` to `ece7fcfc7a993e751a999145b2c74ee233402a1f`, with matching ancestry/expected-old lease, and its existing CI/Supabase deployment effects. No later evidence commit, additional ref, artifact deletion, retention/protection change, npm operation or public visibility is authorized.
- **Authentication:** Operator-confirmed repository-only, one-day-expiry Contents-write/Workflows-write credential in the new Keychain item; successful scoped identity read recorded below. Neither token bytes nor clone-authentication values are evidence inputs.

This record is not final publication authorization. The exact authorized private source fast-forward has now occurred, triggering the existing workflow. No remote deletion, retention/protection/configuration mutation, npm operation or visibility conversion occurred. PUB-01's exact identifier disposition and the owner's retention of the two exact legacy archives remain in force. Their notice finding remains unremediated owner-accepted risk, not verified notice compliance. New CI/deployment exposure must be reviewed before the separate final-publication checkpoint.

### Authorized private preparation — observed result

- **Push interval:** 2026-09-08T10:37:51Z through 2026-09-08T10:37:53Z.
- **Preflight:** All 45 corrected collection bindings matched exposure SHA-256 `428b276b8ecff316a45dd13449bc34b2ce5b9346a2c6d16456f74de048d03504`; all 67 archives matched their exact reviewed bytes. MIT/notice/rights/assent bindings and terminal producer states matched. Temporary audit data was cleaned up.
- **Last guards:** Scoped authenticated read matched immutable repository ID/node/name and private visibility; native advertised refs contained only the approved old main. `git merge-base --is-ancestor` succeeded for that same approved old OID and source target immediately before the push.
- **Mutation:** Exactly `ece7fcfc7a993e751a999145b2c74ee233402a1f:refs/heads/main` to the explicit HTTPS repository, guarded by `--force-with-lease=refs/heads/main:7c9b22801378de313a7f2b9be7261eb17c4bb613`. Only the scoped `gh auth git-credential` helper was enabled for this push; ambient helpers were cleared through command-local configuration, redirects and terminal prompting disabled. Stored origin and global authentication were not changed. No force rewrite, other ref, deletion or retry occurred.
- **Observed result:** Git exit 0, porcelain fast-forward `7c9b228..ece7fcf`. Native remote main now equals the approved target and no other ref is advertised. Authenticated repository ID remains `1327753770` and visibility remains **private**.
- **Source-content proof:** Remote commit `ece7fcfc7a993e751a999145b2c74ee233402a1f` has tree `e1c28807085a0eae773ee49dd62dd887a41a7914`, exactly the reviewed local source tree. The remote LICENSE was independently read at this OID and contains the approved MIT text. Metadata, notices, README and all other frozen file bindings are therefore attached to the same verified tree, not a later local commit.
- **Authorized producer:** Push-triggered workflow `348310628`, run **34216472139**, head exactly the approved source target, completed with conclusion **failure**. Installation/build and Vitest passed (**54 test files passed, 1 skipped; 419 tests passed, 3 skipped**). The selected Playwright suites had **10 passed / 3 failed**. The production deployment job was **skipped**; no Supabase deployment or new artifact upload occurred.
- **Resulting exposure reviewed:** All producers are terminal and new logs/API content were inspected as recorded below. Final-publication authorization is still absent. The CI fixture defect is being repaired locally before proposing an additional reviewed private push; this does not authorize a retry or new source update.

### Terminal post-sync exposure and CI diagnosis

- **Captured:** 2026-09-08T10:46:38Z. Actual remote main remains `ece7fcfc7a993e751a999145b2c74ee233402a1f`; repository `1327753770` remains private. No other advertised ref, protection change, artifact deletion or retention change occurred.
- **Coverage:** 49 terminal runs, 98 jobs, 98 check runs, 131 annotations, 68 inspected archives, 19 unexpired artifacts and 41 terminal deployment-status collections. No new deployment collection or Actions artifact was created. All prior 67 archive bindings are unchanged.
- **New archive:** Run `34216472139`, 45,049 bytes, SHA-256 `6f7c327fb86b83908b4e07256d4997a49b195fec8a0c73d6a30e30cc482b47d1`. All 14 members were read in memory under a protected temporary-directory lifecycle; 186,093 expanded bytes. Sorted `[member_name,byte_size,sha256]` canonical projection SHA-256 `d823ff10e765a6b3c12c6f591a8a15b49bb5dc6bfb7b9c2980e9746fafcbbabe`. No extraction/execution, tested credential-pattern finding or known protected-value match; temporary directory removed.
- **Actual exposure digest:** `c178b45f3e69089b7999889cb2820d5a9af503a5c5a2301d39ceb6aad6b92f6c`. Reconstruct its complete collection vector from the corrected preparation vector above by replacing only the seven entries below. The changes are the new terminal run/jobs/checks/annotations/log archive, the approved main OID, and repository license/push/update metadata. Every other collection is unchanged.
- **Protection digest:** Still exactly `96b362425508a1340047171187a2c2559c56dc193328d9dd7cfa87d92d5cbe90`; no new high-severity exposure finding beyond the exact retained owner-accepted PUB-02 notice risk. This does not resolve the CI test defect or constitute final publication authorization.

```json
{
  "annotations": "60eb5e0dabfa796497a3ec995be45ccdc39efeabd2b9a00ded69831ae38968aa",
  "archive_bytes": "d1d17bb505f45bddba26d2f97c1f469178cd0b5b55f40c96dddbbdd1dca0e8fa",
  "base/runs": "c874c161406ee78c86762ff9198a26a352fbf613f296597e1cc190c46ba8e214",
  "checks": "a025189e017d7da334d6fd63849dab10d79fbba807d36a75544875485ac8e09a",
  "jobs": "ace438dc5f8fb3381a211ab32267595f8fd389af073538c2654c1e8f00d723b9",
  "surface/branches": "6b1a553e9b59298821f291ba7a4df098f47253d4c3cc8076e5d84e81ca614659",
  "surface/repository": "824a1628a7e2f17c6e73a2687d2c4379eebd5c6421f3f99a6e88cecafd231779"
}
```

**CI diagnosis and local repair:** The three failures read receipts from the absent `.planning/phases/02-move-the-implementation-to-supabase/` directory. Synthetic test fixtures exposed a second dependency in the maintainer verifier itself: cleanup/promotion validation still substituted a hardcoded deployment receipt, even when final review had an explicit `--test-deployment` input. The repaired suites generate deterministic records under `testInfo.outputPath`; cleanup/promotion checks take explicit `--deployment`, and final review forwards its existing deployment input through the validation chain. Missing inputs and all manifest, repeated-zero-authority, immutable-lineage, digest and tamper checks remain enforced. Active operations documentation explains the detached-input contract. No application/UI/API, deployment behavior, workflow permission, package dependency or live service changed.

**Verification:** `npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-restore.spec.ts` passed **13/13** in 8.1 seconds, including the three previously failing contracts and their negative cases. LSP reports no errors in either test file or the verifier; two pre-existing unused-symbol hints remain in the script. A separate real-CLI smoke copied synthetic receipts into a temporary directory with **no `.planning` directory** and successfully ran `--final-review`, `--check-final`, `--check-promotion-evidence` and exact-cleanup `--check-run-evidence`. Its temporary directory was removed. The initial smoke used a generic output basename, which the verifier correctly rejected; correcting the smoke to use its required final-evidence basename passed without changing validation. This repair is local only; capture/review a new exact source commit and obtain separate authorization before any additional private push.

## Original approved private-preparation review — 2026-09-08T09:32:13Z

This section supersedes earlier candidate/snapshot and blocker descriptions below, which remain historical evidence. **Task 1 is complete; scoped authentication and renewed exact-digest private-preparation authorization are ready. Task 3 may execute only after the immediate no-drift preflight passes.** Source/ref/archive/protection bindings and requested effects are unchanged. Final-publication authorization has not been granted. The cancelled artifact-deletion credential is not requested, retrieved or reused.

### Frozen source and native Git proof

- Repository: `Ship-With-AI/cumpa`, immutable ID `1327753770`, node `R_kgDOTyPqKg`; still private, default branch main, not archived or disabled.
- `remote_main_before`: `7c9b22801378de313a7f2b9be7261eb17c4bb613`. Native advertised refs and paginated branch/tag/PR reads agree: only main, one branch, zero tags, zero PRs, zero forks.
- `source_target_oid`: `ece7fcfc7a993e751a999145b2c74ee233402a1f`. The exact approved old OID is its ancestor; **52 intervening commits**. No-sync is not available. The one-ref proposal below uses that same old OID for both ancestry and the explicit lease.
- Before freezing this target, commit `ece7fcf` corrected two stale documentation statements: current MIT assent is recorded, and legacy-artifact deletion is cancelled. No application or workflow behavior changed in this resume. Later local review/STATE/authorization/SUMMARY commits are excluded from the proposed push.
- Extension from previously reviewed `5939daec8afa04f97a283c9fe9ea93c0bac6cd29`: **8 commits, 33 trees, 28 blobs; 69 newly reachable objects**, all read and content-hashed. Sorted `[oid,type,content_sha256]` projection SHA-256: `6d7471eecc95474d6951cd694eeff8f82c67efa7e260f00b48616d7af6fee22f`. Combined coverage: **870 commits, 3,660 trees, 2,686 blobs; 7,216 objects**.
- All 15 changed historical paths were enumerated, including intermediate planning records. Changes are MIT legal/metadata/documentation cutover, redacted backup/Projects/assent/credential-handoff records and their superseding retention disposition, plus the two corrected policy statements. No new dependency graph, runtime behavior, external code or new commit-email identity was introduced. Package and lock objects are semantically identical to the prior candidate after changing only their MIT license fields; `private: true` and the package allowlist remain unchanged.
- New object bytes and messages produced zero known protected-environment-value matches and zero tested private-key/GitHub-token/AWS-key/Stripe-secret/JWT/credential-URL patterns. Contextual classification preserves earlier exact R-01/R-02/R-03 dispositions; scanning is not ownership, confidentiality or license-compliance certification.
- Current 1,104-byte MIT LICENSE, unchanged notices and rights-review digests match their recorded bindings. Alessandro's direct assent and his witnessed report of Manuel's own assent remain distinct; no independently verified statement from Manuel is claimed.

### Fresh authenticated exposure and protection observations

All list endpoints used exhaustive REST `per_page=100` pagination or explicit GraphQL totals/pageInfo. Observed counts: branches/tags/PRs **1/0/0**; issues, issue comments/events, PR review comments, commit comments, releases/assets, forks, webhooks and teams **0**; collaborators **2**, both administrators. Linked Projects **0**, cursor exhausted. No PR-dependent review or release-asset collection exists to traverse. Discussions and wiki are disabled; the native wiki Git probe returned repository-not-found. Pages is disabled and its API returns 404.

Actions: **1 workflow, 48 completed runs/48 attempts, 96 jobs, 96 check runs, 96 annotation lists/129 annotations**. Deployments: **41** fully read status collections, latest states **19 success / 22 failure**. All exposure producers were terminal when read; an operator no-write/no-rename/no-transfer window has not been asserted.

All **67 archives** (48 run logs and 19 unexpired artifacts; **8,278,181 downloaded bytes**) were downloaded again and matched the exact prior byte-size/SHA-256 bindings. Prior member-level inspection/classification therefore applies to identical bytes, including both retained legacy archives; no changed or unreviewed archive was substituted. No archive was extracted or executed. The mode-0700 temporary directory under umask 077 had finally/SIGINT/SIGTERM cleanup and was confirmed removed. Existing requested private backups were not modified. Current API payload coverage was **1,587,694 bytes** before the additional empty commit-comment list; no tested credential-pattern match occurred. Known protected values appeared only in the intentionally read environment-variable values, whose durable representation is SHA-256 only.

Effective/inherited rulesets (all targets) and classic branch-protection rules are **0**, with GraphQL `hasNextPage=false`; main's branch rule is null. REST protection/ruleset 403 responses are private-plan restrictions, not the basis for assuming absence. Production environment `21002754719` has **no protection rules**, null deployment-branch policy and **0 custom deployment protections**; the branch-policy endpoint's 404 is corroborated by the explicit null setting. Environment variables/secrets are **5/5** (secret metadata only); repository variables/secrets are **0/0**. Environment value fingerprints match the previously reviewed bindings.

Actions are enabled, `allowed_actions=all`, SHA pinning is not required; default GITHUB_TOKEN permission is read and PR-review approval is disabled. Private-fork workflows, write-token delivery and secret/variable delivery are disabled. Private forking is disabled. There is no associated code-security configuration; vulnerability/Dependabot alerts, automated security fixes and secret scanning are disabled; code scanning reports Advanced Security is not enabled. These are explicit feature-state observations, not clean-alert certifications. Public-only fork-contributor approval returns 422 while private; **no future configured value is invented or approved here**.

Proposed private protection changes: **none**. The separate final-publication checkpoint must approve the supported post-public disposition, including existing unprotected main/Production, public-fork behavior and GitHub disabling **all push rulesets** (currently zero). [GitHub's documented visibility consequences](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility) also include public Actions history/logs, public code/forks and copies that cannot be retracted by later privacy changes.

**PUB-02 remains an unremediated owner-accepted notice risk for exactly artifacts 9907668126 and 9928300866.** They remain retained at the exact archive bindings below. No deletion, retention-setting change, third-party permission or notice-compliance claim is made. PUB-01's exact identifier acceptance and all unrelated rights/security gates remain bounded.

### Canonical projection and proposal

Serialization is UTF-8 `json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)`, hashed with SHA-256. Collection record arrays are sorted by their serialized projected record; nested semantic arrays retain API order. REST pagination envelopes are flattened; object-valued pages retain their wrappers. Object keys are recursively sorted for serialization. Variable objects retain `name` and replace string `value` with its SHA-256. No secret value is read from secret-metadata endpoints. Omitted keys are exactly `download_count, forks, forks_count, network_count, open_issues, open_issues_count, size, stargazers_count, subscribers_count, temp_clone_token, watchers, watchers_count` (repository/view/download counters and the transient GitHub clone-authentication token); archive byte sizes and artifact `size_in_bytes` remain bound. Resource timestamps, content, actor IDs, statuses, permissions, environment/security values and error/feature-state observations remain included. Transport headers and capture timestamps are not response-body inputs. Future local approval/report fields are not snapshot inputs.

The exposure digest is the canonical sorted map of collection names to their projected-content digests. Protection digest independently binds repository feature/access controls, effective/classic rules, environment and Actions/security settings, the empty private change set and explicit visibility consequences. These are **preparation-review bindings**, not a final post-sync publication snapshot. Task 3 must recapture all actual remote content after authorized preparation and resulting CI/deployment, then obtain separate final authorization.

- Exposure SHA-256: `428b276b8ecff316a45dd13449bc34b2ce5b9346a2c6d16456f74de048d03504`.
- Protection/disposition SHA-256: `96b362425508a1340047171187a2c2559c56dc193328d9dd7cfa87d92d5cbe90`.
- **Private-preparation review SHA-256: `3f44e7f08e193f915e35698af8ac33e4ee3b75e9725549a4d4e48394b8e1209c`** (canonical JSON proposal below, independent of this document's future commit).

<details>
<summary>Exact redacted collection digests and protection projection</summary>

```json
{
  "collections": {
    "annotations": "148f36be122d62a27d2a072d7a48fd51ccfc33e499cffdc19b6bfdc2a5c0ca8a",
    "archive_bytes": "4b5d1982cf4e66b2ff21387c7b799b7171149407e94ea1ba543ad5287e84d996",
    "base/artifacts": "5b487eac8c72271614a493644d321b8dc0b9d12d1e04fd1485469744e04dda1c",
    "base/deployments": "66ee14cd95e15e4b44914061b83ca006944a4ed83681e360d7db7a6dbd9d839b",
    "base/runs": "0785313ddc7f4bbae254f38759576adf8ffc5c8ff3153a1cce462dcd98ab3547",
    "base/workflows": "d408a19d8fedc49d961d407b19679d35f6bd22d4ffa4c6fbf5f7f5344a6f08ce",
    "checks": "38fa67b4fd6465c94c1ad6fb4d79eba9e6bc93d5bdd2dc821f579b1fa935485c",
    "collaborators": "a525f348d8502777b9409a97100c0f450ed4bcfb601700cba34d21062e608431",
    "commit_comments": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    "deployment_statuses": "1650de80ef2d1f636ef3edd7ef9f9f951e7f4ab02706c690f9dde81aba993bae",
    "graphql": "c8079b2e7d2e11d8f3b9aae7fd61a5eb221040007ae8892fa04201794c762249",
    "jobs": "dd57f782446fee7a8946dcf60da935b345d9698cb3a3f335a14348ad2a4e78ad",
    "surface/actions_permissions": "25842d2b9453f8e5fed37a198b9a268cf6aee1225690bf5fb91a89e8542ea718",
    "surface/automated_security_fixes": "8a0a15ba9d18fbed2294a579cbae9c005dd2fc71b83c56a28e7f55f984e8771f",
    "surface/branches": "ec234153daa6ad5f88ce23cab22f519d6526be714f553eebaa7b68a3c7076e4a",
    "surface/code_scanning": "5547f4c73465214a091963b2e70ca1331dc3dc76a58c3d91966d0cfb348962b5",
    "surface/code_security_configuration": "74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b",
    "surface/dependabot": "a75019e06dfded2c0b8a3c17e844fe8d5bde12b716fd21a6867ff4dcfff1ed9c",
    "surface/deployment_branch_policies": "5b2f5a10055778602f1dc91780de12e8d10e8d5785367675fe5b18b16d885f02",
    "surface/deployment_protection_rules": "8ebbe4538a833927b69cd64a669741e5ada91dd883c353c8626843e544af33a7",
    "surface/env_secrets": "49aa3fe9d1aad31baced1bde8304d7f02be04ed37e0c2ddadd8cb74c6ed7716e",
    "surface/env_variables": "d70c286581f28bd2b147c7d2d62824a9c091865e2aed7fca1f151a6347490124",
    "surface/environment": "e6927b867d7836da75b210c93a07c5899621bf6307228f69d0b3264203e8f780",
    "surface/environments": "64085f9341870df1ced97771f3c66ab9a0399b9856e62d4ccbcedd2a07416889",
    "surface/fork_approval": "a98dd8c4b9aa1f925aa7156adabba3ecaa3129398f010b9f9ea17c747f590e7a",
    "surface/fork_permissions": "b02b39c5f551845d4983ff38b6967f4acdcc4d05b4550d4e8d609a8e48b94de3",
    "surface/forks": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    "surface/hooks": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    "surface/issue_comments": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    "surface/issue_events": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    "surface/issues": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    "surface/main_protection": "2fb9628dc2d4b321f14a613e7263343126d1f62b67ef489ddf6e5ba98aa575e8",
    "surface/pages": "4f85e4faa30c78ccd743d62e76176edf23ebc3fc8fecb44ceacfaa219a755ee5",
    "surface/pulls": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    "surface/releases": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    "surface/repo_secrets": "c0f46bfb73dbb41d36cf2ea8f1d63ee7d6a498bde0a8e18b02796a41193de5da",
    "surface/repo_variables": "ca54fa494652031e6b1212b5ea847b7d0b7d919e24df2654ce6d771d9d0f7f66",
    "surface/repository": "58231f21fc7e9b313bbab441c0182d010bf3dfbbfc3c895b6886a3c8c9fa133d",
    "surface/review_comments": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    "surface/rulesets": "2fb9628dc2d4b321f14a613e7263343126d1f62b67ef489ddf6e5ba98aa575e8",
    "surface/secret_scanning": "31140ea22e43b342ce4b02867adff8b5a8226540b39535fbca91b497bff3c3e4",
    "surface/tags": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    "surface/vulnerability_alerts": "8c8ac6c2613a31e07fd81b9a35f6b37a34e54d3a4f63972e00313244113fa4b4",
    "surface/workflow_permissions": "fb00f7e1aab4200684b287b484155d5521381f4593552beed4bbb5f9b1622ede",
    "teams": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
  },
  "protections": {
    "repository": {
      "id": 1327753770,
      "node_id": "R_kgDOTyPqKg",
      "full_name": "Ship-With-AI/cumpa",
      "private": true,
      "has_issues": true,
      "has_projects": true,
      "has_downloads": false,
      "has_wiki": false,
      "has_pages": false,
      "has_discussions": false,
      "archived": false,
      "disabled": false,
      "allow_forking": false,
      "web_commit_signoff_required": false,
      "has_pull_requests": true,
      "visibility": "private",
      "default_branch": "main",
      "allow_squash_merge": true,
      "allow_merge_commit": true,
      "allow_rebase_merge": true,
      "allow_auto_merge": false,
      "delete_branch_on_merge": false,
      "allow_update_branch": false
    },
    "access_controls": {
      "collaborators": [
        {
          "login": "hoghweed",
          "id": 127878,
          "node_id": "MDQ6VXNlcjEyNzg3OA==",
          "avatar_url": "https://avatars.githubusercontent.com/u/127878?v=4",
          "gravatar_id": "",
          "url": "https://api.github.com/users/hoghweed",
          "html_url": "https://github.com/hoghweed",
          "followers_url": "https://api.github.com/users/hoghweed/followers",
          "following_url": "https://api.github.com/users/hoghweed/following{/other_user}",
          "gists_url": "https://api.github.com/users/hoghweed/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/hoghweed/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/hoghweed/subscriptions",
          "organizations_url": "https://api.github.com/users/hoghweed/orgs",
          "repos_url": "https://api.github.com/users/hoghweed/repos",
          "events_url": "https://api.github.com/users/hoghweed/events{/privacy}",
          "received_events_url": "https://api.github.com/users/hoghweed/received_events",
          "type": "User",
          "user_view_type": "public",
          "site_admin": false,
          "permissions": {
            "admin": true,
            "maintain": true,
            "push": true,
            "triage": true,
            "pull": true
          },
          "role_name": "admin"
        },
        {
          "login": "alemagio",
          "id": 21338507,
          "node_id": "MDQ6VXNlcjIxMzM4NTA3",
          "avatar_url": "https://avatars.githubusercontent.com/u/21338507?v=4",
          "gravatar_id": "",
          "url": "https://api.github.com/users/alemagio",
          "html_url": "https://github.com/alemagio",
          "followers_url": "https://api.github.com/users/alemagio/followers",
          "following_url": "https://api.github.com/users/alemagio/following{/other_user}",
          "gists_url": "https://api.github.com/users/alemagio/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/alemagio/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/alemagio/subscriptions",
          "organizations_url": "https://api.github.com/users/alemagio/orgs",
          "repos_url": "https://api.github.com/users/alemagio/repos",
          "events_url": "https://api.github.com/users/alemagio/events{/privacy}",
          "received_events_url": "https://api.github.com/users/alemagio/received_events",
          "type": "User",
          "user_view_type": "public",
          "site_admin": false,
          "permissions": {
            "admin": true,
            "maintain": true,
            "push": true,
            "triage": true,
            "pull": true
          },
          "role_name": "admin"
        }
      ],
      "teams": []
    },
    "effective_rulesets": {
      "totalCount": 0,
      "nodes": [],
      "pageInfo": {
        "hasNextPage": false,
        "endCursor": null
      }
    },
    "classic_protection": {
      "totalCount": 0,
      "nodes": [],
      "pageInfo": {
        "hasNextPage": false,
        "endCursor": null
      }
    },
    "main_branch_rule": null,
    "settings": {
      "environment": {
        "id": 21002754719,
        "node_id": "EN_kwDOTyPqKs8AAAAE49yanw",
        "name": "Production",
        "url": "https://api.github.com/repos/Ship-With-AI/cumpa/environments/Production",
        "html_url": "https://github.com/Ship-With-AI/cumpa/deployments/activity_log?environments_filter=Production",
        "created_at": "2026-09-01T12:18:19Z",
        "updated_at": "2026-09-01T12:18:19Z",
        "can_admins_bypass": true,
        "protection_rules": [],
        "deployment_branch_policy": null
      },
      "env_variables": [
        {
          "variables": [
            {
              "name": "STRIPE_PRICE_ID",
              "value": "6eb4ae5e01c0f6096753cd0a167d433f31469dc03ec3878055cbb63360be2188",
              "created_at": "2026-09-02T05:49:27Z",
              "updated_at": "2026-09-03T13:16:58Z"
            },
            {
              "name": "STRIPE_WEBHOOK_ENDPOINT_ID",
              "value": "79be299e993c11e1acb5c43a8f8cf6e58eac64f503cf29a1737a5c0592ac3631",
              "created_at": "2026-09-02T10:09:23Z",
              "updated_at": "2026-09-03T13:16:31Z"
            },
            {
              "name": "SUPABASE_GITHUB_CLIENT_ID",
              "value": "953333ebbd9b6118fadebc7f2b6fe9926b76adb22c6037788ce443d91d5cf71d",
              "created_at": "2026-09-02T11:15:29Z",
              "updated_at": "2026-09-02T11:15:29Z"
            },
            {
              "name": "SUPABASE_PROJECT_REF",
              "value": "2043c31eacb2efa76123043fcd652ac45bd19b121db1ddaa537e86b3473bf73d",
              "created_at": "2026-09-01T12:29:42Z",
              "updated_at": "2026-09-01T12:29:42Z"
            },
            {
              "name": "SUPPORT_PROVIDER_MODE",
              "value": "349af68ebbc98a1a24a918cbcc2822c4e0235fa2f2abb41b92f0a02e69ad883f",
              "created_at": "2026-09-01T12:32:17Z",
              "updated_at": "2026-09-03T13:20:49Z"
            }
          ],
          "total_count": 5
        }
      ],
      "env_secrets": [
        {
          "total_count": 5,
          "secrets": [
            {
              "name": "STRIPE_SECRET_KEY",
              "created_at": "2026-09-02T05:46:10Z",
              "updated_at": "2026-09-03T13:20:28Z"
            },
            {
              "name": "STRIPE_WEBHOOK_SECRET",
              "created_at": "2026-09-02T10:09:45Z",
              "updated_at": "2026-09-03T13:16:10Z"
            },
            {
              "name": "SUPABASE_ACCESS_TOKEN",
              "created_at": "2026-09-01T12:23:41Z",
              "updated_at": "2026-09-02T12:03:40Z"
            },
            {
              "name": "SUPABASE_DB_PASSWORD",
              "created_at": "2026-09-01T12:23:58Z",
              "updated_at": "2026-09-01T12:23:58Z"
            },
            {
              "name": "SUPABASE_GITHUB_CLIENT_SECRET",
              "created_at": "2026-09-01T12:26:25Z",
              "updated_at": "2026-09-02T16:16:03Z"
            }
          ]
        }
      ],
      "repo_variables": [
        {
          "variables": [],
          "total_count": 0
        }
      ],
      "repo_secrets": [
        {
          "total_count": 0,
          "secrets": []
        }
      ],
      "deployment_branch_policies": {
        "ok": false,
        "status": "404",
        "message": "Not Found",
        "corroboration": "environment.deployment_branch_policy=null"
      },
      "deployment_protection_rules": {
        "total_count": 0,
        "custom_deployment_protection_rules": []
      },
      "actions_permissions": {
        "enabled": true,
        "allowed_actions": "all",
        "sha_pinning_required": false
      },
      "workflow_permissions": {
        "default_workflow_permissions": "read",
        "can_approve_pull_request_reviews": false
      },
      "fork_permissions": {
        "run_workflows_from_fork_pull_requests": false,
        "send_write_tokens_to_workflows": false,
        "send_secrets_and_variables": false,
        "require_approval_for_fork_pr_workflows": false
      },
      "fork_approval": {
        "ok": false,
        "status": "422",
        "message": "Validation Failed"
      },
      "code_security_configuration": null,
      "vulnerability_alerts": {
        "ok": false,
        "status": "404",
        "message": "Vulnerability alerts are disabled."
      },
      "automated_security_fixes": {
        "enabled": false,
        "paused": false
      },
      "code_scanning": {
        "ok": false,
        "status": "403",
        "message": "Advanced Security must be enabled for this repository to use code scanning."
      },
      "secret_scanning": {
        "ok": false,
        "status": "404",
        "message": "Secret scanning is disabled on this repository."
      },
      "dependabot": {
        "ok": false,
        "status": "403",
        "message": "Dependabot alerts are disabled for this repository."
      }
    },
    "requested_private_changes": [],
    "visibility_consequences": {
      "all_push_rulesets_disabled": true,
      "observed_push_rulesets": 0,
      "code_and_actions_history_public": true,
      "public_forks_and_persistent_copies": true,
      "public_only_fork_approval": "unavailable while private; no configured value or enforcement claimed; requires separate final disposition"
    }
  }
}
```

</details>

```json
{
  "kind": "cumpa.private-preparation-proposal/v1",
  "repository": "Ship-With-AI/cumpa",
  "repository_id": 1327753770,
  "repository_node_id": "R_kgDOTyPqKg",
  "expected_visibility": "private",
  "remote_refs": [
    [
      "refs/heads/main",
      "7c9b22801378de313a7f2b9be7261eb17c4bb613"
    ]
  ],
  "remote_main_before": "7c9b22801378de313a7f2b9be7261eb17c4bb613",
  "source_target_oid": "ece7fcfc7a993e751a999145b2c74ee233402a1f",
  "source_bindings": {
    "LICENSE": "c947d781600d41cdeac710b2c81f5cd04ed88bad83dcc2277cffb30768490c7d",
    "THIRD_PARTY_NOTICES.md": "847c9cb7c9e3585ed7ae518208ac934c5658f0fdb01ad2f2a20b50f56015d143",
    ".planning/phases/03-distribution-contract-legal-boundary/03-RIGHTS-REVIEW.md": "d65e5f780c5469757fefef685100a1d4bc6ceaded20b1234b010e8d2b8136e94",
    ".planning/phases/03-distribution-contract-legal-boundary/03-LICENSE-APPROVAL.md": "da8131b0cf7d76516dafee5c5ce8acb8d57904d9d6c1e49f89f93defa67eff6f",
    "package.json": "5ae67356a55c01be628cc4f82d4debba272984d9a28e1824069878e7ded2c5b3",
    "package-lock.json": "896aefb20316dc2a6588b28eb3deb2bb5483388dc59daf51f2efd839e1b2df1f",
    "README.md": "7eba4475ecf0d610ee57afb555c2afc328dcd8c604ae41e56b4ab1cfd1f0e065",
    "docs/distribution-operations.md": "5d36cfaac8164567eaaf9775cd5a0c03db028a34e01df4ba49fa14de174f096f",
    "docs/support-service-operations.md": "89dc5b1b005f208ee885a0d3c7ba00db46e2bd9ed29722cdcb4ac33813b2873e",
    ".github/workflows/deploy-supabase-production.yml": "0cc92062e9b5ccefc4ae68ddf9494be6d5fec4f03ab07d2df67262293b6fe2d0"
  },
  "prior_reviewed_source_oid": "5939daec8afa04f97a283c9fe9ea93c0bac6cd29",
  "source_delta_sha256": "6d7471eecc95474d6951cd694eeff8f82c67efa7e260f00b48616d7af6fee22f",
  "exposure_sha256": "428b276b8ecff316a45dd13449bc34b2ce5b9346a2c6d16456f74de048d03504",
  "protection_sha256": "96b362425508a1340047171187a2c2559c56dc193328d9dd7cfa87d92d5cbe90",
  "main_update": {
    "ref": "refs/heads/main",
    "fast_forward_only": true,
    "ancestor_must_be": "7c9b22801378de313a7f2b9be7261eb17c4bb613",
    "lease": "--force-with-lease=refs/heads/main:7c9b22801378de313a7f2b9be7261eb17c4bb613",
    "refspec": "ece7fcfc7a993e751a999145b2c74ee233402a1f:refs/heads/main"
  },
  "protection_changes": [],
  "expected_push_effects": [
    "existing repository-gates workflow",
    "existing Supabase production deployment after gates pass",
    "supabase-deployment-evidence.json upload only; inspect resulting logs/artifacts before final publication authorization"
  ],
  "retained_owner_accepted_notice_risk": [
    {
      "id": 9907668126,
      "size": 3482130,
      "archive": "3e4813bebbad2155ca473fe022cbb34196b1eadf85453f37bc675259b82cb453",
      "members": "215ddd7bc9bec5b00c0bbc22d6e8385e9979a9d2e66bff99562cbc900950be58"
    },
    {
      "id": 9928300866,
      "size": 3482132,
      "archive": "bfbd790230ffaf37d5f6dc89fd792484c26a2062a32d8c50ab72e9ee7ec6afac",
      "members": "d1dae1f17e6658b019c3edf889376649e684923f4d7fb585e181c4a2738eb720"
    }
  ],
  "preserve": [
    "all artifacts and private backups",
    "all run records and logs",
    "all other refs",
    "all Git history",
    "all retention and protection settings"
  ],
  "credential_requirement": {
    "repository_id": 1327753770,
    "selection": "only Ship-With-AI/cumpa",
    "short_lived": true,
    "required_push_permissions": [
      "Contents:write",
      "Workflows:write"
    ],
    "ambient_write_fallback": false,
    "cancelled_deletion_credential": "do not retrieve or reuse"
  },
  "visibility_authorized": false,
  "npm_authorized": false,
  "later_local_evidence_commits_authorized": false
}
```

### Blocking human-action checkpoint

The private push requires a new short-lived credential selecting **only this immutable repository**, with **Contents: write** and **Workflows: write** (the reviewed history updates the existing workflow). Use an operator-verified secure mechanism; do not paste token bytes into chat, arguments, URLs or this record. Broad ambient OAuth/SSH is read-only for this procedure; the cancelled Actions-write deletion handoff is not reusable authorization. Repository administration/visibility permission is not needed for this preparation step and is not requested here.

The exact one-ref private fast-forward will trigger existing CI and, if gates pass, the existing **Supabase production deployment** and deployment-evidence upload. Authorization must cover those effects. It grants no visibility change, npm publication, artifact deletion, retention/protection change, extra ref or later evidence commit.

Scoped authentication is ready. After reviewing the projection correction below, the operator must supply:

`PRIVATE PREPARATION AUTHORIZED: Ship-With-AI/cumpa review 3f44e7f08e193f915e35698af8ac33e4ee3b75e9725549a4d4e48394b8e1209c`

Renewed authorization for this corrected digest is recorded above. Immediately before the authorized push, recheck exact repository identity/private state, current old ref, affected exposure/protection bindings and current MIT assent; drift requires refreshed review. The one-ref update must pass the same-old-OID ancestry check and exact lease. Phase 3 remains **2/3 plans complete** until private preparation, the separate final-publication gate and public verification finish.

### Scoped authentication ready; projection correction verified

- **Credential readiness captured:** 2026-09-08T10:16:52Z. The operator's `ready` response confirms only `Ship-With-AI/cumpa` selected, expiry within one day, Contents-write and Workflows-write. The nonempty fine-grained token was retrieved from the new Keychain item without disclosure; an authenticated repository read matched immutable ID `1327753770`, node `R_kgDOTyPqKg`, exact owner/name and private visibility. Scope/expiry/permissions are operator-reported, not inferred from that successful read. No new credential setup is needed.
- **Complete preflight:** Native refs, all 45 projected collection bindings, 48 terminal runs, 96 jobs/checks, 129 annotations, 41 terminal deployment-status collections, GraphQL Projects/rulesets/classic protection and all 67 archive byte bindings were refreshed. All archives matched exactly and the protected temporary directory was removed. Only `/temp_clone_token` in the repository response differed from the earlier capture.
- **Diagnosis:** The original repository response projection mistakenly included GitHub's transient clone-authentication token. It is not published repository content or a protection setting. No token bytes are recorded here. No write was attempted after the original exposure digest mismatch.
- **Correction captured:** 2026-09-08T10:21:06Z. Omit exactly `temp_clone_token` in addition to the documented counters. Reprojecting both the original capture and the current full preflight produced exactly the same corrected collection-digest vector. Source, old-main OID, archive bindings, rights/assents, protections, credential requirements and all proposed effects remain unchanged.
- **Executable checks:** The real captured-data replay passes after correction. Changing only `temp_clone_token` leaves the projected value unchanged; changing repository ID, private visibility or the forking setting still changes it. This is a one-off audit-projection correction, not an application behavior change.
- **Historical bindings:** Earlier exposure SHA-256 `79c8b6dc374ae8b62f66d85d3c7b74db91023d9bf0d6110d7bafabead106a74c`, repository-collection SHA-256 `796c31a0667ec67ca2ff7fbe7c37b8c94fdd00f5f0e51bf583c421e85b99c8c5`, and authorized proposal SHA-256 `262cb67e042d528de1e3318421987e9c72a3d4abbe8e1ca0f23ca5d4cc6cc19b` are superseded only by this projection correction. The proposal JSON differs only in `exposure_sha256`. Replacing that field with the historical exposure digest reconstructs the earlier authorized proposal.
- **Current gate:** Renewed authorization for `3f44e7f08e193f915e35698af8ac33e4ee3b75e9725549a4d4e48394b8e1209c` is now recorded above. No new token permissions or private-preparation effects are requested. The earlier preflight attempts made **0** mutations; the new authorized execution still requires immediate no-drift checks.

### Earlier preparation authorization and resolved credential blocker

- **Authorizer:** Alessandro Magionami, direct user message.
- **Captured:** 2026-09-08T10:11:46Z.
- **Verbatim statement:** `PRIVATE PREPARATION AUTHORIZED: Ship-With-AI/cumpa review 262cb67e042d528de1e3318421987e9c72a3d4abbe8e1ca0f23ca5d4cc6cc19b`.
- **Scope:** The then-current proposal `262cb67e042d528de1e3318421987e9c72a3d4abbe8e1ca0f23ca5d4cc6cc19b`, reconstructed using the historical exposure digest above, including only the guarded private main fast-forward and existing CI/Supabase deployment effects. It was not executed. No public visibility, npm operation, artifact deletion, retention/protection change or later evidence-commit push was authorized.
- **Observed authentication blocker:** The new Keychain item with service `cumpa-private-preparation-1327753770`, account `github-token`, exists in the login keychain. Password-only lookup succeeded but returned only a newline; a second captured diagnostic explicitly confirmed an empty password. No nonempty credential was available or sent to GitHub. No secret bytes were printed or recorded.
- **Resolution:** The later `ready` response and successful scoped repository read above resolve this credential blocker. Do not retrieve or reuse the cancelled artifact-deletion item. Renewed review-digest authorization is now needed solely because the exact projection binding changed.
- **Mutation attempts:** 0. The credential blocker was reached before remote-preparation execution; no claim of a fresh no-drift preflight is made at this checkpoint.

## Historical MIT supersession — renewed assent recorded

The 2026-09-08 MIT decision supersedes every prior proprietary-license/source binding in this review. The current `LICENSE` is the 1,104-byte standard MIT text with SHA-256 `c947d781600d41cdeac710b2c81f5cd04ed88bad83dcc2277cffb30768490c7d`.

The historical proprietary approval digest `889614622bf0bf5da0f7f543868fe9dc9ff568e22872edcfa7b03996a15ad29a` and both related historical approvals are **not approval of the MIT bytes**. Renewed exact-text MIT assent was recorded on 2026-09-08: Alessandro directly selected `Approve exact MIT text`; he separately selected `Yes, I witnessed his approval` when asked about Manuel's own approval of the same current MIT digest. See `03-LICENSE-APPROVAL.md` for attribution and limitations. The current LICENSE, notices and rights-review digests were rechecked and match their bindings. This closes the exact-license-assent blocker only; source/exposure bindings still require refresh, and no remote mutation or publication is authorized. This is a maintainer publication gate only and adds no bespoke permission requirement for MIT recipients.

All earlier LICENSE/source-candidate bindings and any proprietary licensing language below are historical evidence, not current authority. The reviewed legacy-artifact removal scope, private backups, rights/sensitive-material review, security findings, exhaustive exposure requirements, protection disposition, scoped-credential requirement, and separate private-preparation/final-publication authorizations remain in force unchanged. Do not treat this supersession as clearance, artifact-removal authorization, or permission to mutate a remote.

## Exact repository and source candidate

- Existing repository: Ship-With-AI/cumpa; immutable numeric ID **1327753770**, node ID **R_kgDOTyPqKg**.
- Observed visibility: **private**; default branch **main**; not archived or disabled.
- Earlier reviewed source candidate (superseded by the active review above): **5939daec8afa04f97a283c9fe9ea93c0bac6cd29**.
- Actual advertised remote main: **7c9b22801378de313a7f2b9be7261eb17c4bb613**.
- Native Git advertised only refs/heads/main. Paginated branch/tag/PR reads corroborated one branch, zero tags and zero PRs. There are no observed remote-only roots or forks.
- Native ancestry checks proved old remote main is an ancestor of this candidate, with **44 intervening commits**. No-sync is therefore **not** available.
- The initial a80ac723189d428193d685836c01bbc3d7bbbd9a candidate is superseded by the reviewed identifier disposition, workflow recurrence-prevention fix and updated execution state. The earlier tentative f75e316 was already superseded when the omitted checkpoint deletion was committed at a80ac72.
- Earlier redacted review/disposition records are now explicitly included in the newly reviewed candidate history. This refresh and any later authorization/post-change/SUMMARY commits remain outside it; none may be pushed automatically. Do not silently substitute a later HEAD.

Any eventual one-ref update must recheck the exact approved old OID with BOTH native ancestry and an explicit expected-old lease. No non-fast-forward, unconditional force, mirror, deletion, rewrite or additional ref is implied. Origin currently uses SSH; that broad ambient path is not approved mutation authentication.

## Historical proprietary license and candidate bindings

The following table and two recorded approvals bind the superseded proprietary candidate only. They are retained as historical evidence; the current MIT license/assent binding is the active blocker above. Initial R-01/R-02/R-03 dispositions remain exact-scope owner statements, not a general private-data allowlist.

| Candidate artifact | SHA-256 |
|---|---|
| LICENSE, 4,561 bytes | 889614622bf0bf5da0f7f543868fe9dc9ff568e22872edcfa7b03996a15ad29a |
| THIRD_PARTY_NOTICES.md | 847c9cb7c9e3585ed7ae518208ac934c5658f0fdb01ad2f2a20b50f56015d143 |
| Initial rights review | d65e5f780c5469757fefef685100a1d4bc6ceaded20b1234b010e8d2b8136e94 |
| License approval record | 1fe81efbda42d8955ba63a67f561a0840e6879126653eb9321ceb4734968bbf0 |
| package.json | 9e7b82f462bb4cafd8c0aa580dd85126d4d0db7f0a7582b0e5543dfac756370b |
| package-lock.json | 920091a7f027e13479ab8fdae7d266d171b17e4aa039f2dd46e0a16b75750e01 |
| README.md | 02d1f75da1bc48be63449242df93b93ee47e631a5ca13155d2ec2292051b4482 |
| docs/distribution-operations.md | d9dbd8bce6db618dc44123f0d8968ff9427fa1f6e364c27672b1e5d4f3f6cadd |
| docs/support-service-operations.md | 89dc5b1b005f208ee885a0d3c7ba00db46e2bd9ed29722cdcb4ac33813b2873e |
| .github/workflows/deploy-supabase-production.yml | 0cc92062e9b5ccefc4ae68ddf9494be6d5fec4f03ab07d2df67262293b6fe2d0 |
| scripts/verify-supabase-support.mjs | c3977ba0a373053b2224e10bd0e6cd87664743a538dcb5b198d089764aa1bf1d |
| tests/e2e/package-assets.spec.ts | 781e3dfc35c3673e30f45f8e9e6103d780a969b0d087569dcb1169499e3052c1 |

The historical root-lock metadata change did not alter any of the 254 dependency locations, direct pins, or transitive entries. The package guard and old allowlist remain intact for Phase 4. This historical candidate did not contain the current MIT LICENSE; no renewed license text is inferred from this exposure review.

## Git coverage and classification

The completed baseline at 2cc86b144307284e43bfc7f6fa31eb8cc5e2433d was reused, not replaced by a package scan. Native reachability/content reads first covered candidate a80ac72: **857 commits, 3,607 trees, 2,647 blobs; 7,111 objects**. Every blob decoded as UTF-8. That extension contained **13 commits, 74 new objects and 13 changed historical paths**, including the checkpoint added and later deleted.

All initial-candidate objects were additionally swept for the newly known protected environment values; there were **zero prohibited-value matches**. Its new object/message/path delta was lexically reviewed. The 13 email locations were already-reviewed commit identities, with **zero new email identities** relative to the original audit. R-02 covers that Git identity; this is not a general confidentiality or ownership certification.

The deterministic scanned-object/content projection SHA-256 was **2bd2277c0e452cbf8d3025647949277a6e6b83e3f3105b4aa445d843daa30d42**. Unchanged initial history/rights classifications remain in the bound rights review. Final-source changes must extend this evidence, not silently inherit it.

The current 5939dae candidate adds **5 commits and 36 objects** over a80ac72: 5 commits, 20 trees and 11 blobs. Those objects were read and content-hashed, with zero matches to the protected environment values. The reviewed changes are redacted evidence/state, the exact-scope policy disposition and the existing workflow/verifier/regression changes; no dependency or LICENSE change occurred. The sorted OID/type/content-SHA-256 delta projection is **80ed9f0f04c79900fea91383ad92b08e61abe0d4fdb45a97989f8cf487832483**. Together these cover 862 commits, 3,627 trees and 2,658 blobs, or 7,147 reachable objects.

## Authenticated GitHub surface coverage

All successful collection endpoints used exhaustive REST pagination (per_page=100 with paginate/slurp) or GraphQL pageInfo. These collections each fit one page; subordinate jobs, checks, annotations and deployment statuses were separately exhausted.

| Surface | Observed evidence and disposition |
|---|---|
| Branches / tags / PRs | 1 / 0 / 0; native advertised refs agree. No PR review/body/head/base content exists in the returned all-state inventory. |
| Issues / issue comments / events / PR review comments | 0 / 0 / 0 / 0, all-state/paginated reads. |
| Releases / release assets | 0 / 0. |
| Forks / repository teams | 0 / 0. |
| Contributors / collaborators | 1 / 2. No unnecessary personal values are copied here. |
| Discussions | Disabled. |
| Wiki | Disabled; authenticated native wiki Git probe returned repository-not-found. No active wiki exposure was inferred. |
| Pages | Disabled, no advertised Pages ref, Pages API 404 consistent with unconfigured state. |
| Linked Projects | **Resolved** on 2026-09-08 after the operator supplied read access: authenticated GraphQL returned repository R_kgDOTyPqKg, isPrivate=true, projectsV2.totalCount=0, nodes=[], hasNextPage=false, endCursor=null. Zero linked projects; pagination exhausted. |
| Actions workflows / runs / attempts | 1 workflow (348310628); 48 runs, 48 attempts, all completed. |
| Jobs / check runs / annotation lists | 96 / 96 / 96 read; 129 annotation records inspected. |
| Run logs | All 48 run-log archives downloaded and inspected. |
| Actions artifacts | 19, none expired; 6,987,912 archive bytes; all downloaded and inspected, including nested packages. |
| Deployments / status collections | 41 / 41; latest states 19 success and 22 failure, all terminal. |
| Webhooks | 0. |
| Environments | One environment, Production, ID 21002754719. Five variables and five secrets; only metadata/fingerprints retained. |
| Repository variables / secrets | 0 / 0. |
| Effective repository/inherited rulesets | GraphQL includeParents=true: totalCount 0, hasNextPage false. |
| Classic branch protection | GraphQL branchProtectionRules totalCount 0, hasNextPage false; main.branchProtectionRule null. REST 403 was a private-plan restriction, not the basis for assuming absence. |
| Security configuration | No associated code-security configuration. Vulnerability/Dependabot alerts disabled; automated security fixes enabled=false, paused=false. Secret scanning explicitly disabled. Code scanning requires Advanced Security and is not configured. These are disabled-feature observations, not clean-alert certifications. |

The API-content review additionally scanned **1,596,332 bytes** of repository/branch/ref, Actions, deployment, check-output and annotation payloads. No credential-pattern or known protected-value matches appeared there. Ninety-six email matches were already-reviewed Git author/committer metadata in run records; the remaining match was the SSH clone URL syntax, not an email disclosure.

Scout unauthenticated 404 reports reflected their restricted tool surface, not repository-wide authentication failure. Main's successful authenticated CLI and native Git evidence supersedes them.

## Current controls — not an approved post-public disposition

- Actions enabled; allowed_actions=all; sha_pinning_required=false. The selected-actions endpoint's 409 explicitly states all actions/workflows are allowed, so a selected allowlist is inapplicable.
- Default GITHUB_TOKEN permission is read; can_approve_pull_request_reviews=false.
- Private-fork workflows, write tokens and secret/variable delivery are disabled. The fork-contributor approval endpoint explicitly rejects private repositories; its future public-only behavior must not be invented.
- Private forking disabled. Public GitHub platform fork/hosting permissions remain applicable under the approved license disclosure.
- Production has **no protection rules**, **no deployment branch policy**, and **zero custom deployment-protection rules**. Do not describe this as configured reviewer/wait/branch enforcement. The existing workflow separately restricts its trigger to main and gates the deployment job on repository-gates.
- GitHub disables **all push rulesets** on private-to-public conversion. The observed repository/inherited push-ruleset count is zero, so no existing push ruleset was found to preserve. Any changed protection baseline still requires explicit review/approval.
- No no-write/no-rename/no-transfer window has yet been confirmed by the operator. Observed terminal runs/deployments are not a promise against future activity.

## Blocking findings and recurrence

### PUB-01 — Reviewed CI identifiers accepted as public

**Resolved by explicit owner privacy disposition on 2026-09-08.** This was not secret-key leakage. Four configuration categories appeared unmasked: SUPABASE_PROJECT_REF, SUPABASE_GITHUB_CLIENT_ID, STRIPE_PRICE_ID and STRIPE_WEBHOOK_ENDPOINT_ID. The owner accepted the **six exact value fingerprints** below: one each for the first two categories and two each for the historical Stripe price and webhook endpoint IDs.

The current values alone produced **361 matches prohibited by the former policy**, now covered by this exact-scope CI disposition. Complete canonical Supabase routing URLs were separately distinguished from bare/project-dashboard forms; 21 canonical-origin matches were already permitted. Raw log values remain omitted from this record.

The output mechanism was directly observed: the workflow maps these values from GitHub vars into job env, which the runner prints unmasked; neighboring secret-backed inputs are masked. The operator accepted the reviewed non-secret values, so no migration of these variables to secrets or deletion of the 41 historical logs is proposed. Different values and unrelated private data still require fresh review.

Exact affected run IDs:

33622336751, 33622943035, 33623725680, 33624498036, 33627948449, 33628703809, 33629315937, 33630033807, 33630695772, 33631411293, 33632233923, 33636367272, 33640314126, 33647656445, 33650123093, 33651963035, 33653988673, 33655877488, 33680154193, 33734739980, 33735505663, 33737170991, 33749015890, 33749654199, 33750280316, 33750818328, 33751528044, 33751528558, 33752361428, 33753024645, 33753592589, 33754289126, 33757825727, 33758707760, 33760658067, 33761455820, 33763437194, 33764325699, 33790809230, 33791539888, 33850174450

Reviewed historical value fingerprints (not plaintext):

| Field | SHA-256 of exact value | Header occurrences |
|---|---|---|
| SUPABASE_PROJECT_REF | `2043c31eacb2efa76123043fcd652ac45bd19b121db1ddaa537e86b3473bf73d` | 150 |
| SUPABASE_GITHUB_CLIENT_ID | `953333ebbd9b6118fadebc7f2b6fe9926b76adb22c6037788ce443d91d5cf71d` | 144 |
| STRIPE_PRICE_ID | `6eb4ae5e01c0f6096753cd0a167d433f31469dc03ec3878055cbb63360be2188` | 33 |
| STRIPE_PRICE_ID | `bf06620b01578c7d80cd90f1c8a35adcc722f0093c2752affe3fd9f641c76976` | 111 |
| STRIPE_WEBHOOK_ENDPOINT_ID | `79be299e993c11e1acb5c43a8f8cf6e58eac64f503cf29a1737a5c0592ac3631` | 33 |
| STRIPE_WEBHOOK_ENDPOINT_ID | `d5b7211207fd642904a90a71f7689e4a23941de21703df7f13f354db4bf9923e` | 117 |

Current configuration bindings:

| Field | SHA-256 of current value |
|---|---|
| STRIPE_PRICE_ID | `6eb4ae5e01c0f6096753cd0a167d433f31469dc03ec3878055cbb63360be2188` |
| STRIPE_WEBHOOK_ENDPOINT_ID | `79be299e993c11e1acb5c43a8f8cf6e58eac64f503cf29a1737a5c0592ac3631` |
| SUPABASE_GITHUB_CLIENT_ID | `953333ebbd9b6118fadebc7f2b6fe9926b76adb22c6037788ce443d91d5cf71d` |
| SUPABASE_PROJECT_REF | `2043c31eacb2efa76123043fcd652ac45bd19b121db1ddaa537e86b3473bf73d` |

**Attributable disposition:** The operator selected `Accept these IDs as public` in `publication_identifier_policy`, explicitly scoped to review SHA-256 **0c0ebee771ce6fd26edcb12bb5a0fb1fe9d2baeafdec0e739d5b58bd91eabe35**. This accepts only the six fingerprints and reviewed Cumpa CI exposure; it is not a general private-data allowlist and authorizes no deletion, configuration mutation, push or visibility change. The operator separately selected `Back up, then remove` for the legacy archive disposition; that selects private preservation and preparation of a selective removal proposal, not execution of a remote deletion.

### PUB-02 — Retained legacy runtime archives; owner-accepted notice risk

**HIGH notice/distribution finding; unremediated, with owner-accepted retention.** Artifacts **9928300866** and **9907668126** contain release-package/cumpa-0.0.0.tgz. Each package has **142 entries**, no root LICENSE, no root THIRD_PARTY_NOTICES.md, and no license/notice/copying-named file. A targeted check found **zero copies of the complete upstream Monaco notice**, either as exact bytes or whitespace-normalized text, within either archive's members. Upstream reference SHA-256: **790537262fc78a764e121e6b92b959bcd3f5c310b47d9d9b9e92e17fe0af5336**. The checked archive digests are unchanged.

These are not Phase 4 accepted runtime artifacts. The owner has explicitly chosen to retain them despite the recorded missing-license/notice issue. Deletion is no longer a prerequisite under that exact-scope owner disposition. This is acceptance of a known, unremediated risk, not evidence of third-party permission or verified notice compliance. Preserve the archives and existing private backups without changing retention settings; include this disposition and the actual artifact bindings in the refreshed final-publication review.

**Superseding owner instruction, recorded 2026-09-08T08:20:14Z:** `I don't care about those artifacts. They can live there forever even without license`. This cancels the earlier authorization to delete artifacts 9907668126 and 9928300866 and the associated request for an Actions-write token. Do not seek the same deletion approval again or use its old authorization. No remote retention-setting change or guarantee of indefinite GitHub retention is inferred. All other rights/security/exposure checks and separate final-publication authorization remain in force.

#### Private backups and removal-only proposal

The owner-requested backups were completed at **2026-09-08T05:30:57.000128+00:00**, while the same repository ID was still private. Both downloaded ZIPs matched the pre-decision archive sizes and SHA-256 values exactly. Storage is the gitignored **.cumpa/publication-backup-vn77bbs5/** directory, mode **0700**; both archive files and manifest are owner-readable **0400**. No archive member was extracted or executed.

The local manifest is **manifest.json**, kind **cumpa.publication-private-backup/v1**, SHA-256 **0da8d1d46f67a379a1c58669c205399f5e50513a7ff803d54e4b687e4a7e97a6**. This intentional private retention is separate from the completed temporary-audit cleanup.

The following is the unchanged **historical removal proposal**, now superseded by the owner's retention instruction above. Its digest is the SHA-256 of compact UTF-8 JSON with the shown key/array order: **b0cc10ef0721b782bc4b6bcaf4d1e272d34f01c7d881299362d728a32f59f951**. Preserve it as history only, not current mutation authority.

```json
{
  "kind": "cumpa.private-artifact-removal-proposal/v1",
  "repository": "Ship-With-AI/cumpa",
  "repository_id": 1327753770,
  "expected_visibility": "private",
  "artifacts": [
    {
      "id": 9907668126,
      "bytes": 3482130,
      "sha256": "3e4813bebbad2155ca473fe022cbb34196b1eadf85453f37bc675259b82cb453"
    },
    {
      "id": 9928300866,
      "bytes": 3482132,
      "sha256": "bfbd790230ffaf37d5f6dc89fd792484c26a2062a32d8c50ab72e9ee7ec6afac"
    }
  ],
  "backup_directory": ".cumpa/publication-backup-vn77bbs5",
  "backup_manifest_sha256": "0da8d1d46f67a379a1c58669c205399f5e50513a7ff803d54e4b687e4a7e97a6",
  "preserve": "all run records and logs, all other artifacts, all refs and Git history",
  "required_authority": "separate explicit removal approval and operator-confirmed expiring repository-selected Actions-write credential"
}
```

**Do not execute this removal proposal.** The owner's 2026-09-08 retention instruction supersedes the earlier authorization. No deletion request was sent. Any future removal would require a new explicit instruction and appropriately scoped authority; the current workflow must not request a deletion token or treat removal as a prerequisite.

### PUB-03 — Projects resolved; removal credential request cancelled

Projects access was verified at **2026-09-08T06:29:40.756Z** after the operator replied `ready` to the read-scope request. The authenticated repository-scoped query returned zero linked projects and no next page, closing the former access blocker. This does not grant mutation authority.

The existing broad OAuth login remains suitable for authenticated reads only under the separate mutation-scope policy. The Actions-write credential requested solely for legacy-artifact deletion is no longer required because that operation is cancelled. Other future remote mutations still require their own exact authorization and verified repository-scoped credentials; no broad OAuth/SSH write fallback is implied.

The historical token handoff used macOS Keychain service `cumpa-publication-1327753770` and account `github-token`. No credential was loaded or used before the owner cancelled deletion. Do not retrieve or use that token for the cancelled operation. If the operator created a temporary token solely for deletion, it is no longer needed and should be revoked; no token revocation or Keychain removal has been performed or is claimed here.

Both remote artifacts were re-read during the 2026-09-08 resume: IDs, sizes and GitHub SHA-256 digests still match the proposal and neither is expired. Repository ID 1327753770 remains private. The local manifest and both backup files were rehashed successfully; their sizes and 0700-directory/0400-file permissions still match. The unchanged proposal was reserialized and its digest verified. These are preflight observations, not proof of remote deletion or final publication clearance.

#### Historical removal-only authorization — superseded; do not execute

- **Operator:** Alessandro Magionami.
- **Record captured at:** 2026-09-08T08:05:47.511365+00:00, after the checkpoint responses.
- **Authority question:** Delete only artifacts **9907668126** and **9928300866** from private **Ship-With-AI/cumpa**, repository ID **1327753770**, under proposal SHA-256 **b0cc10ef0721b782bc4b6bcaf4d1e272d34f01c7d881299362d728a32f59f951**, after rechecking backups, bindings and scoped credentials.
- **Actual `exact_artifact_removal` selection:** `Authorize these two deletions`.
- **Actual `scoped_removal_credential` selection:** `Ready; scope and expiry verified`.
- **Scope preserved:** Only the two named artifact objects; preserve private backups, all runs/logs, all other artifacts, all refs and Git history. This grants no source push, protection/configuration mutation, registry operation or public conversion.
- **Observed handoff blocker:** `security find-generic-password` for the exact service/account returned exit **44**, `The specified item could not be found in the keychain.` A service-only lookup also returned 44. This session's user search list and default keychain both identify `/Users/alessandro/Library/Keychains/login.keychain-db`.
- **Last checked:** 2026-09-08T08:06:46.045300+00:00. The operator's ready confirmation is recorded; the observed session visibility problem is not treated as a withdrawal of authorization or an invitation to use broad credentials.
- **Mutation attempts:** **0**. The later retention instruction supersedes this authorization and cancels the credential handoff. This historical checkpoint must not be resumed as a deletion task.

### PUB-04 — Prevent new unaccepted runtime archive uploads

**Local prevention implemented and verified; not deployed.** Commit **1c270c7** retains repository gates, automatic production deployment and configured package build/scanning, but uploads only supabase-deployment-evidence.json. The existing release-workflow verifier now rejects an archive upload target or an additional upload step.

The original verifier accepted the unsafe runtime upload. The focused Playwright regression now passes, exercising the actual Node verifier against the configured workflow and both unsafe variants. Source-text-only assertions were removed. The direct CLI verifier also passes for the current workflow; LSP reported no errors in the changed test/verifier (two unrelated existing unused hints remain). No live workflow, build, deployment or push was triggered. Phase 4 still owns final runtime-only artifact/notice acceptance.

## Scanner coverage, classification and cleanup

All **67** accessible log/artifact archives were read, including nested tarballs, without extracting or executing archive members. Original expanded coverage: **35,040,516 bytes**, 1,029 UTF-8 members/metadata records and two binary members. Repeated exact-provider-pattern checks added the existing production-policy key families, credential URLs and secret-assignment forms.

No genuine credential/key/JWT candidate was established. One broader prefix pass matched 90 compiler-identifier substrings; a token-boundary-corrected pass against the identical archives returned zero candidates. Other email/home-path matches were grammar strings, a currency-reference URL and a synthetic fixture. The scanner did not grant privacy clearance: PUB-01 was resolved by the actual owner selection above, and the exact PUB-02 notice/distribution finding remains unremediated under the owner-accepted retention disposition above.

Audit downloads used mode-0700 temporary directories under umask 077, finally/SIGINT/SIGTERM cleanup, bounded archive checks and no execution. All completed passes confirmed cleanup; a focused check after the tool-kernel reset found no owned audit temporary directories. No raw payload is stored in Git or this evidence. The separately requested, verified private backups above are intentionally retained under .cumpa/ and remain excluded from Git and package contents.

## Deterministic evidence boundaries

The table below binds each exact archive and a deterministically serialized member/path/byte digest projection. Configuration values are represented only by SHA-256. Git content is bound separately to the fixed source target and scanned-object projection. Transport headers, capture timestamps, view/download counters, local approval fields and future report commits are not content authorization inputs.

**The following is historical snapshot-boundary guidance, superseded by the active preparation review above.** Projects are fully inventoried; the exact legacy-artifact finding is owner-accepted risk, not a deletion prerequisite. After separately authorized private preparation, rebuild the full sorted ref/content/surface/protection projection from the actual remote; preserve every security-relevant field, require terminal exposure producers and an operator-confirmed no-write window, and recheck all bindings before any approved visibility-only action.

## Per-archive evidence

| Kind | ID | Download bytes | Exact archive SHA-256 | Member projection SHA-256 |
|---|---|---|---|---|
| artifact | 9847075690 | 809 | `497880954b9547c7c0738f25e042465c77b34ad802b54d307eb405a4f4d140f5` | `fc3671a376a362a27dee503b3186dd2902535ee93ee1a8c5447c280c47b75ba0` |
| artifact | 9847415064 | 805 | `822a63ba11b8bf8fdfc64c858e1dfae0f3d0589d804361d9f2b464d60e6f5ac4` | `3cb5827d3054c61f9b2b05ef8cc7c1ce20c449cf8cd669f0afcbd138d0e0650b` |
| artifact | 9849100911 | 806 | `4e093c6df15d1f517bee62b0eca8803d949f2b6e0d1c3d0047df0c3af444a853` | `fb037d0655c6553e10359e7b6b4065545590bd74a514933f53630d0456614e9d` |
| artifact | 9850725940 | 808 | `4d22393755f3d1d7d4b5f79c889f62de86f8c8291e4f1b66dedf8defc614ab7f` | `2756696fa4334d7098c1d915b90ed4355da3917c67f80b6730ebbd15ef713fc5` |
| artifact | 9853996162 | 807 | `12a19492e15733b748ca606dd609b697c414d9706bba2e833541e4df699205b0` | `8961c55401a7f90d27ee2309fe95f3a408ff73c29a2c89727272fb6a559abcf7` |
| artifact | 9854721091 | 809 | `332b858aaca3a8e4c876c352f579ac2a8eb4b794954a47002d8b5f70def305f1` | `e9232390a426d9a870a6c90028252d479ba99e4eee085f12f8f582c84ccd329b` |
| artifact | 9855304861 | 811 | `0f7dbbeb5164809c77dcbb9c1bd715a468f3317466887f539c0cc46c30a20c92` | `92a76cb9f9463d2310324d9f86e863431e01442e530ecfc99d5de485e19fb42c` |
| artifact | 9856079278 | 913 | `8b2e4a545f7ae8ce3ce2755889d247a5084848df71ce228679395db5a37b85b5` | `3240ed53fdc411844fb58b3cae7d455f4dec012d5e681f7a015847bf6e39ec80` |
| artifact | 9856822348 | 1128 | `e15119eedc13bee8602d75907b51f4a36835771f4381685ce695d7d62e8496c1` | `2171fbe63ca73a6951092ac29937d1ac51012e9c47de6e3050a204aa6fe1e4d3` |
| artifact | 9866049642 | 1248 | `3ae9bc05292e7c2260d60b18edf8679edc546713180f2423488281349c1c9296` | `3e6cdafb7214227cb185c57a102c04cc1ac11f2fc0b1ce304dd2ac65c59bd97c` |
| artifact | 9885389875 | 1246 | `abf5ad915f54200b5abdbd2801c64033d757c9e30b057007cfd6651bcb39c94a` | `6d6c17d175a68c7898881b330ef8fa94049f28efae95bd15f0f27df3dbbf54bb` |
| artifact | 9885679874 | 1247 | `9ef664889152160821abb1d4e5598a8b698db7b19cde8eb65a2c32806a813835` | `b8ab45d875f72bbea7729ec9e8e37ae11d46051382c8a44da60a3127a7af41ec` |
| artifact | 9886333373 | 1360 | `e505e78a26dde0ab9342f73b1904bf835f7215d8d2ff043ac42e56fb467bc838` | `4b326c472600e63220fe5c81c8b80ae88305bd9928d56a6c04581dd9eb74af9b` |
| artifact | 9892978251 | 6019 | `cec60f253d9bfbdca6843a1d44005abf0887dad409f8c1de555f99dbde8026d0` | `7ceed62e8e21c966b0d20c5011a309c1f635d4f08ca788f2740d56112a4e46a3` |
| artifact | 9894302499 | 3118 | `acf7799eb4bafe14a4a69159f0a62b514773254c65644e25004760808ba79489` | `08769e25540106f66d2de1ded09c10b08f6b4be26d6cbcd92d3668f22157b43b` |
| artifact | 9896603692 | 857 | `d69f1d8f40b7cb6407b1ad02257a953eab48a4ff313df549dcd1a518c9cb3dd0` | `ecd329e806da444d67b907e1a48dac54e7dd2262e043905ac9dedd659e117c52` |
| artifact | 9896970610 | 859 | `2d5de8b3499e7bdd1edb29046d566e6bc5f4ea144c28a070d4257b0d98407d96` | `2821b52a8a9d3478d99fc89001d045116b9ea1128f7cb8e4739fde7a48f6144a` |
| artifact | 9907668126 | 3482130 | `3e4813bebbad2155ca473fe022cbb34196b1eadf85453f37bc675259b82cb453` | `215ddd7bc9bec5b00c0bbc22d6e8385e9979a9d2e66bff99562cbc900950be58` |
| artifact | 9928300866 | 3482132 | `bfbd790230ffaf37d5f6dc89fd792484c26a2062a32d8c50ab72e9ee7ec6afac` | `d1dae1f17e6658b019c3edf889376649e684923f4d7fb585e181c4a2738eb720` |
| run | 33618605891 | 12663 | `383570c842994c5f79d353417adfdde7471f9a51f943645795bdf43aebf9072c` | `dfb6f5e3b786564bd48214d3df4cfe24073baa77aefe9ecfbb00f34e2da41d1b` |
| run | 33619561988 | 15346 | `8c8fff32dd63ff0a9bf6c5dfe49f7b705e16a358fbb0a843db3406624468f7d1` | `30aa8a67821c1333a4463466968364fda1f3c071f2c33fddacc5d53a4079d945` |
| run | 33620193541 | 18407 | `c64eefc04f0cb9193ec7110187fa0d0d5ca8fa7af5c49bc5296bb604dd9fba59` | `b9d8797c53b4cd4c51639b6cc57e059fc7b3c31f90b25b6c9f92beccc927bfbc` |
| run | 33620819750 | 29857 | `4066ba9518ad792a5b7d5f91b2e063d5036939edf23fcbac804405cc89947a3e` | `7e1f57a1cbcf9ee63e84b743fa30c709c2009757da4f84b9c8d01b7a5298e4c1` |
| run | 33621319168 | 26965 | `a336e27bb383e24b8b0b487cde537850a064bc0f250517afa923e6e6f43c1db0` | `9159ef2f7f4620a931875ccdbe05bcf589f9dfa8c5d9e9375772956ac89d8b58` |
| run | 33622336751 | 27198 | `33095d36a44c27fa5045345738a001244574187c90c6a1ffc8f49ca3cca6e50b` | `e79180b7f5efa02f604634410d9ff3dba25e9fff7ffc7c0bcb466eb6ac41aae9` |
| run | 33622943035 | 27243 | `a1e90d4c51db7339201fb6ee84cb91669cbd6e5ba8642ee2ade9810da565a8e4` | `1d2796d90beef56b13a457ecaaaaccdb8a0eb3c6b7b17760c3abe865cd90431e` |
| run | 33623725680 | 27603 | `b625b2706bb233fdee18998dcfad962645a58dbe48d29351ecb0381276a6a951` | `b3a3960cdd5217e130bdf9fc2408ad2e8643cae188ca14ec9458fa1316c79a54` |
| run | 33624498036 | 27581 | `de100c066c87cb027381535c8dc6cde0bdcad3b9c1e809192cb38a5f1a9b0c0c` | `e2adb5737558e8083ceae8656e65f9d25a538e0338125afa8bd877d9eda4e483` |
| run | 33627948449 | 27362 | `ebed120e8d66132f42077264af927219f20070b432a9704ab52564e1d759be60` | `9ffd18799d8532a44738f63945b54d62ef01600c49c3e75ac0e7f1139e72b25e` |
| run | 33628703809 | 27419 | `f4e78e422be80361cf32a5c391ced1c24d8ef8b8df776268d4ffc360f8017519` | `a2cebeb2f4800b8b28c77e2187f729f9806c2b87e885fd1f09d7cb44bab57d07` |
| run | 33629315937 | 28042 | `7c379b9711cec5df6753e41d7c29ccb5ec623a3138a78dde3179c606c9e57366` | `0bc6d106df5d16f00c5e6e2aa811cb9afbc632232e9a4878035a3b27b8fa5b55` |
| run | 33630033807 | 27508 | `641b6d287f08db045d6f24b06cd236d13f15ef9d5aa3c49bfbb01986b87dddc7` | `8e66b89d5d71bfb09d73c381369466d26d23ab74e672231a7074f243e7694649` |
| run | 33630695772 | 27510 | `841b284e950b37d03a364521e50abd1bd04d3cc90d435f42c4f03650657b1dfc` | `1ca1602df9e84b66d40bc38efe5a46b28f9767630eb3370d889caa9aef5c30af` |
| run | 33631411293 | 27842 | `7bb71e9ba3638a3797b5a74369189076cf11d829558f400f76931ad381b33955` | `b4db565ff3428257ee427be26d3e72c71d0acae999fd62ec57f26dd00b239770` |
| run | 33632233923 | 28085 | `56995995e888a6e421710df1be8e0b03431b6572a92b83a679d4799221b7190a` | `9999e9ec9493741e64bda8c8dffb009539538257e062a84c69ec769d664f51e1` |
| run | 33636367272 | 28203 | `9530a07ef23a7844ed5180d8682e5390a9a044958b755c1d3c504fee2682d0d6` | `8d77dd185cfbb739e04c59b3b1c43b84ce56d8892e272ad912064ba3d3c39134` |
| run | 33640314126 | 28458 | `fbb86984c9b825b54b1da084995a81a2dc6d96e4df076c78b60d4b17728f6d47` | `4d56341e5a83344947b12146b3cd6cfb28912eeca13fe9bac07a434a2fe3e19d` |
| run | 33647656445 | 28100 | `710b4bfe9a4906569cc4f721ab457f8649714f8f71be0e919e7db6b588d88b19` | `f4f3adf319cdb831cbe55a516b4ee92a6dfa3b184050104bfff90ce9c9f20830` |
| run | 33650123093 | 28025 | `8fb68d91b57dbe33004c072ed77e9826f2d56979c9be8b614c294ad01999f001` | `5d295df221b587d83a10889b08e33dfb55ff39c263cf23f7728e6ddf53d638a4` |
| run | 33651963035 | 28297 | `78259c89a1379403977b85f59c2c84466cdab95bc4a843013621aaaf6774f60e` | `01921bfe518af34b293cba2680f1fb22e7af046a90eae17c34c2325488f40f9a` |
| run | 33653988673 | 28217 | `3aad14e1f1f8f6290e50f6b71517e920f818958255294f6f3c3d733fc0bfeb9e` | `89d72b8c1dc12f8753c0b38db68c99c98de90a59c2453e8e4ced1abc82a17c11` |
| run | 33655877488 | 28168 | `bd96747c73f1d9bb3ba09176f7bbd43891154c3eb0c4bb9fee44d1cbbe177731` | `737975442fe7ab3aee78b10ef043094b1efa214c388045495051a96920acf616` |
| run | 33680154193 | 28099 | `b2f1fb0c71704c0b260c60277163d063d478e56e9051d300579860fa5168b06e` | `511f7b3371ae694db2a6d1dea9694c3aca03b38a1904b222a05a7ead825f087e` |
| run | 33734739980 | 28019 | `9d6f64d14fe6374be6368213d79c9a1df8f6d6f4a08111f7d6b8de4ed5dbf75a` | `6e688fc36d6b503a8603555c9d798dd3678b166c67cfe58b969347b96f763a14` |
| run | 33735505663 | 28125 | `85c1822bd67e9fa6be54634d9ecf7c026c2fe247a38b0150e96a432863589e0f` | `275bfadb8a83efa89bf428abca98c2ac97ec05cacf521f79b006d995f172fea1` |
| run | 33737170991 | 28201 | `53f5ddb27d8e176287ada0645b234c03674284772b72663c90f496ded01dabe9` | `34f05e9eb0ea76699ac5f5ac0d2d3b4b57cd9e79a825e54a0f9f644e0f87ef73` |
| run | 33749015890 | 27612 | `54751c6abe8e2d39f779f6b5b1cff18669eb55501b4741fd7c1f8a0e2a61b13e` | `84b214a1388d622b7d626a29bce0b845b36fa0bc5261ff35e6c6a88e180ad0ae` |
| run | 33749654199 | 27625 | `fe7766d99c9dbda9b60a4662b10dc847830e75357d9ae142672647b2d1a74fe4` | `0348f8d37d3ac5458cf97c2fff2b08bd9984fb840f0ee9c9b408bf585ae8d50e` |
| run | 33750280316 | 27815 | `73235d00af12950db0557c497927005a08e8de606a408af0cfdd953813c64afe` | `31320aaf39443bf65e282c547fc3a1e6f0dddac48685ceea8db177749572c6b2` |
| run | 33750818328 | 27360 | `4540e2304b6facfd9fe9fd602ba57367dcbf7e10dca1d138d03849b97025670a` | `9c9628ffd65503ef66218dec27b7f7eaac46fb34cbe20fe0e8f4f361b1790195` |
| run | 33751528044 | 27285 | `e6e5c0a039bfc3c00a39ae1d604ccbce53f558f1a2a8679c6252fc99d30fbab6` | `373f73d3c9058ea6f6f25913a1909b2d72f2e03e60a00a41d0d0532229a314e9` |
| run | 33751528558 | 27609 | `69c09f7b0d9b7142e333be37ba13db334cd48729e791d9eb07e21741e483e7ad` | `00b59ece20729b7a2373afc9f1f9b3c0a6a7ad6216f56f1b75eb90e1cd70e6bc` |
| run | 33752361428 | 27546 | `d4d468db9eb05eb2ea7187ce73e253f241f319d1610ceb84084324f354f62b89` | `c6167fad5a67f9484d80098da8f2f21744264ef3274bee0ffd388f24fe6fbba1` |
| run | 33753024645 | 27651 | `fbee34ec63a7526dd9dc6b9c128e5dc4ce07cea206a228389e64d3dcbcd4497c` | `d8eafb3448d4ed20f60f82832ecb73551d122a9c7443ced8426186ceab65f294` |
| run | 33753592589 | 27620 | `5a2ec943a56731d4bbd73880515a8c6a2b13a7e7917c3fabb8579da2919ae238` | `2098669b9a5ed78d6f4e4b3ebf00d4b5a93a3c834ace6c69401c62cf25906730` |
| run | 33754289126 | 28419 | `d54aa446759d6b50a3961c9d1779581aebb5c48cc40b129d92ed766ec312d542` | `99a85cef69468f3dfbe398eaaf53e9043f4973ec8ef39b86473133379c241832` |
| run | 33755626287 | 13384 | `4ac23cd9ae8a01d08e23a92057e2ce6e257bd410e2bfcd0baa2d908366eb4e02` | `cfec4db20a7d7236a3a2463128a05d787cb3a348e1b2d0c3db73a9383b90f2f2` |
| run | 33757825727 | 28447 | `a926d3841cd3833936ed6f4f6612eebd70d9d2b1d6ff8d388eab84f0b6d16a8b` | `4be1b38ae7f783d037423b49adb112cfa05585da4e826ccbc4804e4120646d17` |
| run | 33758707760 | 27821 | `46ed2918005bde01ecae78546a481fa37bc0775d7d9d01f7decf90804a159817` | `5812d3ac3e1a07336cb0d4f88e054bf4d23612289c78b93dc93fd8877ee1a073` |
| run | 33760658067 | 27404 | `2d81ecc5ba1552270fda0c7d0fc808f30fba653a983c417568f2d78f3cd3e4c2` | `eaa4817f45b6fc834bc40dd2d5c841584195d92978b76707e82339739e0e8c3b` |
| run | 33761455820 | 27820 | `ba89a3b0c712047d5d7a1f343a28a204ef9b2f24622f44e10fa7690b28968901` | `5006f2ed144e68241fcd1248626ec782d2675c64153a8899900fdc6dc0bd1cf9` |
| run | 33763437194 | 28458 | `9645bb048ba41d85015d3fba89679336afd90414e15607107efaf3fe4a43adf5` | `974a992c5f19e8bd4dd6ce1afc8f4a9828dd9494dddffa4260bd02906fb09f9c` |
| run | 33764325699 | 28365 | `b68150a87e50b5e12e5b1ffe4fbafaae73411b118c0682e3a34c97c2a6f4afba` | `5960030e766230bf8f54dd8ca0f2766074fb628dd54732c0bb2c6f00b363dc2c` |
| run | 33790228307 | 19673 | `bc46a553bd683f6d213087f898b6b59e3519955f6ff0f3b3ea0d51fb7089c80a` | `47bae1428870f9e49573f60d29ebae1667f0f35e4cdf83e68c1a7d0162a6e8d0` |
| run | 33790809230 | 28135 | `530d50370db11e2bb070c6c41554525520c7e7269c2bfb8d31702c46f09d0ead` | `0cdb84daa2926d10cf2d91ff5a15a2cdd23ec3887bfbcf818d9236369a22e726` |
| run | 33791539888 | 33889 | `29d03eb9251168f37e2bc5a8f84fd4b895d3930e205f927a798709dcd35c5470` | `29cb347c507b4d724217a2c10518225822e311cdec791e6a1f5f458dfe79b2a0` |
| run | 33850174450 | 33788 | `578bfdfe0623572790b1330b663887b67f56936a9b0beea6657dac7140e129b5` | `9686b03c22464ea8c1ce4e41b8384d58f96e29441a18e7a396fdfd1d026c90d7` |

## Resume and non-authorizations

Plans 03-01 and 03-02 are complete. Both current MIT assents are recorded. The owner now accepts retaining the two exact legacy artifacts despite the unremediated notice finding; their removal and the deletion-token handoff are cancelled, not blocked on credentials. Resume with refreshed MIT source/remote/GitHub exposure bindings, preserving and explicitly disclosing those retained artifacts and their owner-accepted risk. Do not reinterpret this instruction as general acceptance of other findings or as authorization to push, change protections, publish npm or convert repository visibility.

After the remaining evidence and dispositions are complete, request the separate canonical blocking human-action private-preparation authorization for the exact reviewed changes and repository-selected credential. Only after authorized private preparation and a fresh actual remote snapshot may the separate FINAL PUBLICATION AUTHORIZATION be requested. No completed 03-03 summary or Phase 3 completion is justified now.
