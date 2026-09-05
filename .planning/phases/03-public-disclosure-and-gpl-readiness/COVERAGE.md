# Phase 3 External API Coverage

## Detection

Phase 3 integrates authenticated GitHub REST and GraphQL reads plus attachment downloads. The configured `plan:pre` detector could not run because its prescribed `gsd-core/bin/lib/api-coverage.cjs` module is absent from both the installed GSD runtime and this repository. This matrix therefore applies the hook's required exhaustive capability review directly.

## Authentication and safety boundary

- Use the authenticated `gh` CLI and argument arrays. Never persist or print its token, headers, or credential-bearing command lines.
- Require the exact private `Ship-With-AI/cumpa` repository identity and sufficient read permission. Do not broaden OAuth scopes automatically.
- Follow download redirects manually. Send GitHub authorization only to the exact GitHub/API origin that requires it; strip authorization before any cross-origin redirect. Record normalized source/final origins and status, never a token-bearing URL.
- Treat `403`, `404`, `410`, expired objects, missing totals, pagination gaps, malformed responses, and unavailable GraphQL fields as incomplete, not empty.
- Store response bodies/downloads only in a mode-restricted OS temporary directory under generated neutral names; persist only normalized metadata, counts, digests, and redacted findings; delete temporary content in `finally`.

## Capability matrix

| Provider | Capability | Disposition | Coverage contract |
|---|---|---|---|
| GitHub REST | `GET /repos/{owner}/{repo}` repository identity/settings | INTEGRATE | Bind owner/name/database ID/default branch/visibility and issues/wiki/Discussions settings before and after collection; require private visibility and exact identity. |
| GitHub REST | `GET /repos/{owner}/{repo}/actions/runs?per_page=100` | INTEGRATE | Paginate all runs; reconcile `total_count` with unique IDs; record attempt count/head SHA/event/status/conclusion and require every run terminal at freeze. |
| GitHub REST | `GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/logs` | INTEGRATE | Download and scan every attempt from 1 through the run's latest attempt; deleted/inaccessible attempts block without explicit non-exposure evidence. |
| GitHub REST | `GET /repos/{owner}/{repo}/actions/artifacts?per_page=100` | INTEGRATE | Paginate repository artifacts; reconcile totals and unique IDs; record name/size/expiry/workflow/run identity. |
| GitHub REST | `GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}` | INTEGRATE | Download every non-expired artifact, hash and scan opaque bytes/archives; expired, `410`, unsafe, skipped, or failed downloads block. |
| GitHub REST | `GET /repos/{owner}/{repo}/releases?per_page=100` | INTEGRATE | Paginate public and draft releases available to the authenticated caller; retain IDs, tag/target, draft/prerelease state, body digest, and asset inventory. |
| GitHub REST | `GET /repos/{owner}/{repo}/releases/assets/{asset_id}` | INTEGRATE | Authenticated download, hash, and scan every release asset; reconcile release asset IDs/counts. |
| GitHub REST | `GET /repos/{owner}/{repo}/issues?state=all&per_page=100` | INTEGRATE | Paginate all issue-shaped records for body/title/attachment discovery; distinguish pull requests without omitting them. |
| GitHub REST | `GET /repos/{owner}/{repo}/pulls?state=all&per_page=100` | INTEGRATE | Paginate all pull requests, including closed/unmerged; bind base/head refs/OIDs and body digest. |
| GitHub REST | `GET /repos/{owner}/{repo}/issues/comments?per_page=100` | INTEGRATE | Paginate repository-wide issue and PR conversation comments; hash normalized bodies and discover attachments. |
| GitHub REST | `GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews?per_page=100` | INTEGRATE | Paginate every review for every PR; retain review ID/state/commit/user/body digest and attachment sources. |
| GitHub REST | `GET /repos/{owner}/{repo}/pulls/comments?per_page=100` | INTEGRATE | Paginate repository-wide inline review comments; retain path/line/commit/context/body digest and attachments. |
| GitHub REST | `GET /repos/{owner}/{repo}/comments?per_page=100` | INTEGRATE | Paginate commit comments; retain commit/path/position/body digest and attachments. |
| GitHub GraphQL | Repository Discussions, comments, and replies | INTEGRATE | When Discussions are enabled, cursor-paginate every discussion, its comments, and replies; retain database/node IDs, categories, states, body digests, and attachment sources. Disabled is valid only when repository settings prove it. |
| GitHub wiki Git remote | Read-only clone/fetch of `{repository}.wiki.git` | INTEGRATE | When wiki is enabled, retrieve complete wiki Git history/pages into temporary storage, inventory/hash/scan it, and discover attachments. Disabled is valid only when settings prove it. |
| GitHub REST | `GET /repos/{owner}/{repo}/environments?per_page=100` | INTEGRATE | Paginate environment names/IDs/protection metadata for downstream credential-name scope. |
| GitHub REST | `GET /repos/{owner}/{repo}/actions/secrets/public-key` and `GET /repos/{owner}/{repo}/actions/secrets?per_page=100` | INTEGRATE | Verify readable repository secret-name scope and record names/timestamps only; never request or infer values. |
| GitHub REST | `GET /repos/{owner}/{repo}/actions/variables?per_page=100` | INTEGRATE | Paginate repository variable names/metadata; values are protected data and must not be persisted. |
| GitHub REST | `GET /repositories/{repository_id}/environments/{environment_name}/secrets?per_page=100` | INTEGRATE | For every environment, paginate secret names/metadata only; exact repository ID/environment scope prevents name confusion. |
| GitHub REST | `GET /repositories/{repository_id}/environments/{environment_name}/variables?per_page=100` | INTEGRATE | For every environment, paginate variable names/metadata and scan values only in memory with redacted findings; do not persist values. |
| GitHub REST | `GET /orgs/{org}/actions/secrets?per_page=100` and organization variable metadata | INTEGRATE-CONDITIONAL | Attempt only with existing authorization. A permission gap blocks unless an organization owner supplies exact-scope attestation and no unresolved finding depends on unknown organization scope; never request broader scope automatically. |
| HTTP(S) | Attachment URLs extracted from issues, PRs, reviews, comments, releases, Discussions, and wiki | INTEGRATE | Normalize/deduplicate URLs while retaining every source record ID; download with bounded redirects/size/time, strip cross-origin credentials, hash and scan opaque payloads; unfetchable still-exposed content blocks. |
| GitHub REST | Workflow jobs/annotations | OPT-OUT | Run/attempt logs are the required disclosure content. Job metadata/annotations add no separate content surface once every attempt log and run identity is complete; integrate only if a log endpoint cannot establish attempt coverage. |
| GitHub REST | Checks, deployments, statuses, and repository traffic | OPT-OUT | Not named disclosure surfaces and do not host source review bodies, logs, release assets, attachments, credential names, or LFS objects for this phase. |
| GitHub REST | Commits/trees/blobs/refs/tags reads | OPT-OUT | Installed Git CLI is the required semantic authority for all intended refs, commit/tag metadata, reachable objects, and blobs; using GitHub APIs would create a second incomplete Git model. |
| GitHub REST | Contents/search/code-scanning/dependency APIs | OPT-OUT | Full native Git/object scans and actual conveyed-byte/package inventories cover source and notices. Search APIs are non-exhaustive and must not substitute for history scanning. |
| GitHub REST/GraphQL | Collaborators, invitations, forks, watchers, stars, projects, milestones | OPT-OUT | These are not content surfaces required by Phase 3. If sensitive-data cleanup is required, collaborator/fork cleanup is a separately approved consequential action, not collector behavior. |
| GitHub REST/GraphQL | Create/update/delete issues, comments, reviews, Discussions, or wiki | OPT-OUT | Mutation cannot improve disclosure completeness and could destroy or add audited records. |
| GitHub REST | Cancel/rerun/delete workflow runs or logs; delete artifacts | OPT-OUT | Destructive or state-changing; all existing attempts/logs/artifacts must remain visible to the audit. Any required cleanup needs explicit maintainer approval and rescan. |
| GitHub REST | Create/update/delete releases/assets or generate release notes | OPT-OUT | Phase 3 audits releases and assets but does not create, alter, or remove them. Release creation belongs to Phase 5. |
| GitHub REST/Git | Create/delete/update refs, merge/rebase, force-push, mirror | INTEGRATE-CONDITIONAL | The collector and Plan 03 are read-only. Plan 04 may update only `refs/heads/main` after strict current-state pre-push authorization: either the exact ordinary atomic refspec or deterministic rewritten-main cleanup that first adopts the authorized new OID as canonical local main and then pushes that same OID with exact old-OID force-with-lease. Bare force, mirror/wildcard/tag/extra refs, and any push without fresh authorization remain forbidden. |
| GitHub REST | Update repository settings or visibility | OPT-OUT | Phase 3 must prove the repository remains private. Phase 4 owns the explicit visibility transition. |
| GitHub REST | Create/update/delete secrets, variables, environments, keys, webhooks, apps, or deploy keys | OPT-OUT | Phase 3 inventories names/scopes only. Provider/GitHub credential mutation is consequential and requires explicit authority outside the collector. |
| GitHub REST | Packages/npm publication and attestations | OPT-OUT | Package identity/bootstrap/trusted publishing is Phase 4; stable npm publication/provenance is Phase 5. |
| Provider APIs | Credential value lookup, revoke, rotate, or delete | INTEGRATE-CONDITIONAL | Values are never retrieved. Plan 04 may perform exactly one provider-native revoke/rotate operation only after strict non-ref authorization, then fully recollect, validate strict owner-only result input against authorization/following evidence, append the result to the action ledger, and delete the input before any next action. |
| GitHub Support | Cached-view, pull-ref, or LFS purge | INTEGRATE-CONDITIONAL | Use only for one exact maintainer-authorized purge request after rotate/revoke proof; automate an available API/CLI, otherwise use blocking human-action for the already authorized request, then recollect and ledger a strict verified non-secret result before continuing. |

## Completeness gate

All `INTEGRATE` and applicable `INTEGRATE-CONDITIONAL` rows must have a strict result with reconciled counts/IDs, status, digest, and scan outcome. Any missing row, unclassified response, permission gap, download gap, parser warning, missing authorization, or missing/broken action-ledger entry sets the evidence and final gate to `blocked`. An `OPT-OUT` capability must remain unused unless later evidence proves it is necessary; crossing that boundary requires an explicit maintainer decision and subsequent full rescan.
