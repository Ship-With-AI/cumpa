# Architecture Research

**Domain:** Public-source, licensing, and release architecture for Cumpa v1.5
**Researched:** 2026-09-04
**Confidence:** HIGH for GitHub, npm, SPDX, and current repository mechanics; MEDIUM for the one-time npm namespace bootstrap because npm does not document a pending-package trusted-publisher flow

## Evidence Convention

- **Verified fact** — observed in the current repository or stated by a current primary source.
- **Recommendation** — the architecture proposed for Cumpa v1.5.
- **Implementation gate** — a condition that must be proved before the next irreversible step.

This research concerns only public source, licensing, npm/GitHub release integrity, and the separately distributed ShipWithAI skill. It does not change Cumpa's CLI, review protocol, persistence, local server, browser application, or voluntary-support behavior.

## Executive Summary

Cumpa v1.5 should put a small distribution control plane around the existing application rather than create another runtime architecture. The public `Ship-With-AI/cumpa` repository should become the Corresponding Source authority. One protected source commit and `v1.5.0` tag should identify the GPL application release. A GitHub-hosted workflow should run the existing build, create exactly one npm tarball, inspect and smoke-test that exact file, submit that file to npm with OIDC trusted publishing, and attach the same file to a draft GitHub Release before the release becomes immutable.

The thin skill is a separate work under MIT. Its source can remain beside Cumpa for coordinated review only if the subtree has an explicit MIT license and is excluded from the GPL npm tarball. The installable copy belongs in `Ship-With-AI/skills/skills/cumpa/`. The marketplace transports instructions; the installed `cumpa` executable remains the sole review authority.

Two irreversible transitions must be sequenced explicitly:

1. Making the existing repository public exposes its complete Git history and GitHub Actions history/logs. Audit and revoke exposed credentials before changing visibility, then restore repository rulesets that GitHub disables during the transition.
2. `@shipwithai/cumpa` currently returns HTTP 404 from the npm registry. npm requires a package to exist before trusted-publisher or staged-publishing configuration. Reserve it with a source-accurate prerelease, then configure OIDC and publish stable `1.5.0` without a long-lived token. Do not consume `1.5.0` for bootstrap.

## Current State

### Verified Repository Facts

| Area | Current state | Consequence for v1.5 |
|---|---|---|
| GitHub identity | `origin` is `git@github.com:Ship-With-AI/cumpa.git`; the repository is currently private. | Change visibility in place. Do not copy into a new public repository and thereby split identity/history. |
| npm identity | `package.json` is `cumpa@0.0.0` with `"private": true`. | It cannot publish as requested until changed to `@shipwithai/cumpa@1.5.0` and made public. |
| npm metadata | No `license`, `repository`, `homepage`, `bugs`, or public `publishConfig` fields are present. | Registry, source, and legal identities would be incomplete or inconsistent. |
| executable | `bin.cumpa` points to `dist/bin/cumpa.mjs`. | Preserve this existing public CLI entry point. |
| packlist | `files` currently permits `dist/` and `.kimi-code/skills/cumpa/`. | The MIT skill is currently mixed into the prospective GPL package and should be separated. |
| build | `prepack` runs the existing runtime and web builds. `scripts/build-bin.mjs` creates the executable launcher and can embed only the canonical release support-service URL. | Reuse the build; supply the approved release URL once in the release job. |
| native artifact | `scripts/build-native-addon.mjs` emits `dist/native/directory_exchange.node` only on Darwin arm64 and removes it otherwise. | The release runner platform is part of package assembly and must be chosen intentionally; do not accidentally change existing capability behavior. |
| artifact verification | `scripts/verify-production-artifacts.mjs` already uses `npm pack --dry-run --json --ignore-scripts` as inventory input, creates a real tarball, scans package text for protected values/obsolete hosted-runtime content, and can verify the launcher. | Refactor this boundary to accept and verify the one release `.tgz`, rather than having the verifier and publisher make separate tarballs. |
| automation | The repository has a Supabase deployment workflow but no npm release workflow. | Add a dedicated, fixed-filename release workflow; do not add publishing to the existing deployment workflow. |
| skill | `.kimi-code/skills/cumpa/SKILL.md` is thin and delegates review authority to the installed CLI. | Preserve the delegation model; only licensing, prerequisite, source, and installation guidance change. |
| root license | No root `LICENSE` or `COPYING` file was found. | Public release is blocked until the GPL text and project notice are present. |

### Verified External Facts

- The npm registry returned HTTP 404 for `https://registry.npmjs.org/%40shipwithai%2Fcumpa` on the research date. The target package does not yet exist.
- npm trusted publishing requires npm CLI 11.5.1 or later and Node 22.14.0 or later. It binds a GitHub organization/user, repository, exact workflow filename, and optionally an exact GitHub Environment. The workflow needs `contents: read` and `id-token: write`; GitHub-hosted runners are supported and self-hosted runners are not.
- npm automatically generates provenance for trusted publication when both the source repository and package are public. Its provenance guidance requires `package.json.repository` to match the public repository case-sensitively.
- npm staged publishing requires npm 11.15.0 or later, requires the package to exist, accepts a package tarball, supports OIDC trust tokens, and defers the live transition to a maintainer's 2FA approval. npm recommends allowing only `npm stage publish` on a trust relationship and disallowing token publication for strongest proof-of-presence.
- A published npm name/version cannot be reused, even after unpublish. The registry records SHA-1 and SHA-512 integrity data for the uploaded tarball.
- GitHub recommends constructing an immutable release as a draft, attaching all assets, then publishing it. Publication locks the associated tag and assets and generates a release attestation over the tag, commit SHA, and assets.
- Changing a GitHub repository from private to public exposes GitHub Actions history and logs, allows public forks, and disables existing push rulesets. Those rulesets must be restored after the transition.
- GPL-3.0 section 1 includes source plus the scripts needed to generate, install, run, and modify object code in Corresponding Source. Sections 4 and 6 require license/notices and a way to obtain that source with object-code distribution. GPL section 5 permits an aggregate with separate independent works, but does not remove either work's notice obligations.
- SPDX identifies the required application expression as `GPL-3.0-or-later` and the skill expression as `MIT`.
- `Ship-With-AI/skills` currently documents `npx skills add Ship-With-AI/skills --skill <name>` as its recommended cross-agent installation shape, with skills at `skills/<name>/SKILL.md`. Its current public root listing has no detected license file, so the v1.5 MIT boundary must be added explicitly rather than inferred.

## Recommended Architecture

### System Overview

```text
Existing private Ship-With-AI/cumpa repository and full history
                              │
                              │ rights + dependency + full-history +
                              │ historical Actions/log exposure gates
                              ▼
Public Ship-With-AI/cumpa source authority
  root GPL-3.0-or-later             nested MIT skill source boundary
  source/build/lock/readme           .kimi-code/skills/cumpa/
  package metadata                  excluded from npm package
              │                                  │
              │ reviewed release commit          │ reviewed promotion copy
              ▼                                  │ after CLI is public
      protected v1.5.0 tag                        │
              │                                  │
              ▼                                  │
GitHub-hosted publish workflow                    │
  exact configured filename/environment          │
  npm ci -> existing build -> npm pack once       │
  inspect/install/smoke the exact .tgz            │
              │                                  │
              ├────────► draft GitHub Release     │
              │          exact .tgz + checksum    │
              │                                  │
              └── OIDC ─► npm stage publish      │
                           exact .tgz             │
                           provenance             │
                                │                 │
                       maintainer 2FA approval    │
                                │                 │
                                ▼                 │
                    @shipwithai/cumpa@1.5.0      │
                    integrity + provenance        │
                                │                 │
                    registry/install verification│
                                │                 │
                                ▼                 │
                    publish GitHub draft release │
                    immutable tag/assets         │
                                │                 │
                                └─────────────────┘
                                                  ▼
                              Ship-With-AI/skills public MIT authority
                              skills/cumpa/SKILL.md + explicit MIT notice
                                                  │
                              npx skills add ... --skill cumpa
                                                  │
                                                  ▼
                              installed instruction-only skill
                                                  │ invokes prerequisite
                                                  ▼
                              installed `cumpa` CLI remains review authority
```

`npm stage publish` is the recommended stable-release path because it preserves OIDC authentication for the submitted artifact and adds a human 2FA approval before the immutable registry transition. Direct `npm publish` through the same trusted publisher remains a supported, simpler alternative if maintainers decide the protected GitHub Environment is the only approval gate required. Pick one before creating the npm trust relationship because its allowed actions are security policy, not an incidental CLI option.

### Authority Map

| Authority | Responsibility | Must agree with |
|---|---|---|
| Public `Ship-With-AI/cumpa` repository | GPL application Corresponding Source, build/install scripts, lockfile, notices, development history, MIT exception source if retained | package repository URL, provenance source, release tag |
| Root `LICENSE` plus licensing notice | Full GPL v3 text and explicit `GPL-3.0-or-later` grant for first-party application code | `package.json.license`, README, npm metadata |
| Nested skill `LICENSE` | Full MIT text and copyright notice for the independent thin skill | marketplace copy and marketplace licensing notice |
| Dependency/notice inventory | Third-party copyrights, licenses, and any notices required by bundled output | exact npm tarball contents |
| `package.json` | Package name/version, executable, Node engine, public access, SPDX expression, public source/homepage/issues URLs | tag, tarball, npm registry metadata |
| Existing build scripts | Generate Cumpa's launcher, runtime, UI, and existing optional native capability | release workflow inputs and current runtime tests |
| `npm pack --json` result | Exact filename and file inventory for the publishable unit | verifier, npm upload, GitHub release asset |
| Protected `v1.5.0` tag | Version-to-source-commit identity | package version, GitHub release, provenance |
| Fixed GitHub Actions workflow | Reproducible orchestration and OIDC subject | npm trusted-publisher repository/workflow/environment tuple |
| npm trusted-publisher settings | Which GitHub identity may stage/publish | fixed workflow and protected environment |
| npm registry | Immutable package version, distribution integrity, registry signature/provenance | verified local tarball and source tag |
| Immutable GitHub Release | Human-facing release record and attestation over tag/commit/assets | npm package version and exact attached tarball |
| `Ship-With-AI/skills` repository | Installable MIT skill distribution and discovery | reviewed canonical skill content and public CLI prerequisite |
| Skills CLI | Fetches/installs skill files into supported agent locations | marketplace repository layout |
| Installed `cumpa` executable | All review, result, and voluntary-support behavior | existing validated application contract; not the skill |

## Boundary Changes

### New Boundaries

#### 1. Root GPL Source Boundary

**Recommendation:** Add the complete GPL v3 license text at repository root and a concise licensing section that says first-party Cumpa application code is `GPL-3.0-or-later`. State explicitly that the named skill subtree is an MIT exception. Do not rely only on GitHub's license detector or `package.json.license`.

The public tag must contain the preferred source form, `package-lock.json`, build scripts, package assembly logic, and installation instructions. That immutable source tag is the Corresponding Source location for the compiled npm tarball. The package README and `repository` metadata should give clear directions to it.

**Implementation gate:** Confirm that the organization can grant the license for every first-party file and contribution reachable from the history it will publish. Git author names alone do not establish licensing authority. Preserve third-party licenses and notices; the GPL declaration cannot overwrite them.

#### 2. Explicit MIT Skill Boundary

**Recommendation:** Keep the reviewed thin skill source at `.kimi-code/skills/cumpa/` for this cutover only if that directory carries its own MIT `LICENSE` and the root notice explicitly excludes it from the GPL grant. Exclude the subtree from the npm `files` allowlist. Promote the reviewed file into `Ship-With-AI/skills/skills/cumpa/` after `1.5.0` is publicly installable.

The Cumpa-repository copy is the reviewed upstream source; the marketplace copy is the installable distribution. The promotion PR should record the Cumpa tag/commit and compare content before merge. Do not add a runtime dependency, submodule, generated package, or cross-repository publishing credential merely to copy one small instruction file.

Longer term, if maintainers want only one editable copy, move canonical ownership to the marketplace and remove the Cumpa-repository copy in a deliberate later cutover. For v1.5, an explicit source/distribution relationship is less risky than silently maintaining two peers.

#### 3. Protected Release Workflow and npm Trust Relationship

**Recommendation:** Add one dedicated release workflow with a stable filename. Configure a protected GitHub Environment and bind that exact organization, repository, workflow filename, and environment in npm. Use a GitHub-hosted runner, no dependency cache, and only the permissions needed by each job. The npm stage/publish job needs:

```yaml
permissions:
  contents: read
  id-token: write
```

A separate release-finalization job may require narrowly scoped `contents: write`; do not give the OIDC publication step unrelated write permissions. Do not configure `NODE_AUTH_TOKEN` in the trusted workflow.

#### 4. Immutable GitHub Release Record

**Recommendation:** Enable immutable releases before the stable release. Prepare `v1.5.0` as a draft, attach the already verified npm tarball and its checksum, then publish only after npm has accepted and public verification has matched the registry artifact. This follows GitHub's documented draft-first pattern and avoids publishing an immutable empty or incomplete release.

#### 5. Public Install Verification Boundary

**Recommendation:** Run a post-publication job that starts from the public registry and marketplace, not the checkout artifact. It should verify exact version metadata and provenance, install the exact package globally into an isolated prefix, execute the exact package through `npx`, and then install the Cumpa skill from `Ship-With-AI/skills` in an isolated agent home. This is release evidence, not a redesign of application tests.

### Modified Existing Boundaries

| Existing boundary | Modification | What remains unchanged |
|---|---|---|
| GitHub repository visibility | Convert the existing repository in place from private to public after the exposure audit; restore push/tag rulesets immediately. | Repository identity and full history. |
| `package.json` | Set `name: "@shipwithai/cumpa"`, `version: "1.5.0"`, remove/disable `private`, add `license: "GPL-3.0-or-later"`, case-correct public source/homepage/bugs metadata, and public publish configuration. Remove the skill directory from `files`. | Node `>=24`, `bin.cumpa`, existing runtime dependencies and scripts unless packaging requires a narrow adjustment. |
| `package-lock.json` | Keep root package name/version aligned with the manifest. | Resolved dependency graph. |
| `scripts/build-bin.mjs` | Supply the already approved production support-service URL in the release environment. | Launcher generation and voluntary-support behavior. |
| `scripts/build-native-addon.mjs` | Pin and document the GitHub-hosted release runner platform that produces the intended current artifact. Verify fallback behavior from the same tarball on another supported platform. | Existing Darwin-arm64-only emission and runtime fallback; no platform package split. |
| `scripts/verify-production-artifacts.mjs` | Accept an explicit tarball path; inspect its inventory, metadata, licensing files/notices, protected values, executable, and support origin. | Existing scanner policy and launcher checks. |
| README | Make public npm and `npx` flows primary; link exact public source/license/issues; explain the separately installed skill and prerequisite. | Product usage and existing behavior. |
| Existing skill | Add explicit public CLI prerequisite/install guidance and source/version relationship; retain thin delegation. | Review protocol and canonical result handling. |

## Artifact and Data Flow

### Source-to-Registry Flow

1. A reviewed release commit contains GPL/MIT boundaries, exact public metadata, application source, lockfile, and release automation.
2. A protected `v1.5.0` tag points to that exact commit. The workflow fails closed unless the tag equals `v${package.version}` and the package identity is exactly `@shipwithai/cumpa`.
3. A fixed GitHub-hosted runner checks out the tag SHA, uses Node 24 and a pinned npm CLI satisfying trusted/staged-publishing minimums, disables dependency caching, runs `npm ci`, and invokes the existing build exactly once.
4. `npm pack --json --ignore-scripts --pack-destination <empty-release-dir>` creates one tarball without rerunning `prepack`. The workflow consumes the filename returned by npm instead of predicting a scoped-package filename.
5. The artifact verifier examines that exact tarball. A clean temporary install exercises its `cumpa` binary before any network publication.
6. The workflow creates a draft GitHub Release at the protected tag and uploads that exact tarball plus a checksum. The draft remains recoverable and mutable.
7. The trusted workflow submits the exact tarball with `npm stage publish ./<returned-file> --access public --tag latest`. OIDC identifies the public GitHub repository, workflow, environment, and commit; no npm token is supplied.
8. A maintainer inspects the staged record/download and approves it with 2FA. If direct trusted publish is chosen instead, step 7 uses `npm publish` and this approval is the protected GitHub Environment gate.
9. A registry verification job fetches `@shipwithai/cumpa@1.5.0`, checks name/version/license/repository and `dist.integrity`, compares the downloaded registry tarball with the locally approved file, and verifies registry signatures/provenance.
10. The workflow publishes the already complete draft GitHub Release. Repository immutability locks the tag/assets and creates GitHub's release attestation.
11. A no-secrets public-install job exercises the published global and `npx` paths from clean temporary state.

### Public Consumer Flows

```text
npm install --global @shipwithai/cumpa@1.5.0
  -> npm verifies registry integrity
  -> package bin mapping installs `cumpa`
  -> existing CLI/server/browser flow

npx --yes @shipwithai/cumpa@1.5.0
  -> npm resolves the exact public package
  -> executes the same packaged `cumpa` bin

npx skills add Ship-With-AI/skills --skill cumpa
  -> Skills CLI fetches public marketplace repo
  -> installs MIT SKILL.md for selected agent(s)
  -> skill checks for separately installed `cumpa`
  -> delegates review to existing CLI
```

The skill must not download code, embed a second launcher, invoke a mutable `latest` package automatically, or reproduce Cumpa's review rules. Its missing-prerequisite path should display the exact supported npm install command and public source URL.

## Dependency-Ordered Release Sequence

### 0. Resolve Legal and Exposure Preconditions

1. Establish copyright/licensing authority for the complete current application and retained history.
2. Inventory third-party code and generated bundles; preserve required notices and confirm GPL compatibility.
3. Audit all reachable Git history plus historical Actions logs/artifacts for credentials, personal data, private URLs, or other material that cannot become public.
4. Revoke or rotate every discovered credential first. If unrotatable sensitive data must be removed, stop: publishing an unchanged complete history and removing that data are incompatible requirements that need owner resolution.
5. Add the root GPL and nested MIT notices without rewriting history merely to insert license files into old commits. State that the current grant covers the repository history the organization has authority to license, with the named MIT exception.

### 1. Establish the Deterministic Package Contract

1. Update manifest/lockfile identity and public metadata.
2. Exclude the skill from the npm package allowlist; retain only application runtime output plus npm-always-included README/license/package metadata and any required notice file.
3. Make the verifier consume one concrete tarball.
4. Prove the release build on the intended GitHub-hosted runner and the package's current cross-platform fallback behavior.
5. Add the fixed release workflow and version/tag guards while the repository is still private.

### 2. Make Source Public and Restore Governance

1. Perform the in-place private-to-public visibility change.
2. Verify the public repository, full history, source links, README, root license, and MIT exception render as intended.
3. Re-enable or recreate default-branch, push, and release-tag rulesets that the visibility change disabled.
4. Enable immutable releases and the protected npm release Environment.
5. Only after the public repository exists, proceed to npm provenance/trust configuration.

### 3. Bootstrap the New npm Package, Then Remove Bootstrap Credentials

**Implementation gate:** `@shipwithai/cumpa` does not exist, while npm trusted and staged publishing settings require an existing package. npm's official documentation does not provide a pending-package trust relationship.

Recommended one-time resolution:

1. From a public, GPL-complete prerelease commit/tag such as `v1.5.0-rc.0`, build and verify a source-accurate prerelease tarball through the same package contract.
2. Publish it publicly under a non-`latest` prerelease tag using the shortest-lived, narrowly scoped npm credential the owners can create, with 2FA/provenance where npm supports them. Do not publish stable `1.5.0` in this step and do not claim this seed used trusted publishing.
3. Configure the trusted publisher against the stable workflow's exact public repository, workflow filename, and environment. Prefer allowing stage publication only.
4. Set package access to require 2FA and disallow token publication, remove the bootstrap repository secret/workflow if any, and revoke the credential immediately.
5. Exercise an OIDC prerelease/stage if needed to prove the trust tuple before stable `1.5.0`.

This exception is temporary namespace bootstrapping, not a permanent alternate release path.

### 4. Publish Canonical `1.5.0`

1. Create/protect `v1.5.0` at the reviewed release commit.
2. Build, pack, inspect, install, and smoke-test one tarball.
3. Create the draft GitHub Release and attach that exact tarball/checksum.
4. Stage it through npm trusted publishing; review and approve with 2FA.
5. Fetch and verify the public registry package, integrity, source metadata, and provenance.
6. Publish the GitHub draft, making the tag and assets immutable.
7. Verify the immutable release and attached tarball with `gh release verify` and `gh release verify-asset`.
8. Exercise both public CLI installation paths from clean state.

### 5. Promote the MIT Skill

1. Copy the reviewed thin skill into `Ship-With-AI/skills/skills/cumpa/`, carrying explicit MIT licensing and the upstream Cumpa tag/commit in the promotion record.
2. Add it to marketplace discovery/documentation as required by that repository's current conventions.
3. Merge only after the exact CLI prerequisite is publicly installable.
4. Exercise `npx skills add Ship-With-AI/skills --skill cumpa` in an isolated agent home, then invoke the skill with the separately installed CLI and confirm the canonical Cumpa result path is used.

## Integration Points

### npm Trusted Publisher

**Producer:** protected GitHub Actions workflow running on a GitHub-hosted runner.

**Consumer:** npm trust configuration for `@shipwithai/cumpa`.

**Contract:** exact GitHub owner, repository, workflow filename, optional environment, allowed action, public source repository, npm/Node minimums, and `id-token: write` all agree. Changing the workflow filename or environment requires deleting and recreating the npm trust relationship; it is not an internal refactor.

### GitHub Release

**Producer:** the same release orchestration that produced the tarball.

**Consumer:** GitHub immutable-release storage/attestation and public users.

**Contract:** release tag equals package version, release commit equals provenance source commit, and attached tarball equals the npm registry tarball. Release notes may remain editable; assets and tag may not.

### npm Package to Public Source

**Producer:** packaged `package.json` and README.

**Consumer:** npm provenance service and GPL recipients.

**Contract:** case-correct `Ship-With-AI/cumpa` repository URL, exact version/tag directions, root GPL text, required notices, and corresponding build scripts remain available at the immutable source tag.

### Cumpa to ShipWithAI Marketplace

**Producer:** reviewed MIT skill source associated with the public CLI release.

**Consumer:** `Ship-With-AI/skills/skills/cumpa/` and the Skills CLI.

**Contract:** one thin `SKILL.md`, explicit MIT notice, public `@shipwithai/cumpa@1.5.0` prerequisite, source/support links, and no copied review implementation. The marketplace version may lag the application release; it must never lead it.

## Verification Evidence

| Boundary | Required evidence | Proves | Does not prove |
|---|---|---|---|
| Public source | Public clone can reach existing history; root GPL and nested MIT notices visible; tag resolves to intended commit | Source/history and license materials are available | Organization owns every right; that needs the rights gate |
| Local release tarball | npm-reported inventory, SHA-512/SHA-256, expected executable/assets/license/README/notices, no skill subtree/secrets/obsolete URLs | Exact candidate package composition | Registry received it |
| Local clean install | Isolated install of tarball and execution of `cumpa` surface | Packaged bin and runtime are coherent | Public registry resolution |
| npm trusted stage/publish | OIDC run associated with configured workflow/environment and no npm token | Authentication path for artifact submission | Public bytes match until registry fetch |
| npm registry | Exact metadata and downloaded tarball digest/integrity match candidate | Public package is expected immutable artifact | Source origin without provenance |
| npm provenance/signatures | Current npm CLI `npm audit signatures` succeeds for exact installed version and package page links expected source | Registry attestation links package to public workflow/source | Application behavior or code safety |
| GitHub immutable release | `gh release verify v1.5.0` succeeds | Release/tag/asset attestation exists and is immutable | Registry equality |
| GitHub asset | `gh release verify-asset v1.5.0 <local-tarball>` succeeds | Local tarball equals release asset | npm equality unless digest also compared |
| Public global install | Clean `npm install --global @shipwithai/cumpa@1.5.0` and actual CLI invocation succeed | Supported global public path | `npx` path |
| Public npx | Clean `npx --yes @shipwithai/cumpa@1.5.0` invocation succeeds | Supported ephemeral public path | Marketplace path |
| Marketplace install | Isolated Skills CLI install finds `cumpa`, installs MIT skill, missing-CLI guidance is correct, installed CLI receives invocation | Public marketplace and prerequisite compose | New review behavior; none is intended |

## Failure Handling Across Immutable Systems

GitHub and npm do not offer an atomic cross-service transaction. The draft-first sequence limits the partial states:

- **Before npm acceptance:** reject the npm stage and replace/delete the GitHub draft; neither public immutable authority has accepted `1.5.0`.
- **npm accepts but GitHub draft publication fails:** keep the protected tag and attached draft, compare its tarball with the public registry, and retry only release finalization. Never rebuild or republish `1.5.0`.
- **A retry finds `1.5.0` already present:** treat that as success only after downloading it and proving its integrity equals the approved tarball. Otherwise stop and investigate.
- **A bad npm version is public:** deprecate it if appropriate and issue a new version. npm will never permit reuse of the name/version.
- **An immutable GitHub release is wrong:** do not try to move its tag or replace assets. Correct with a new application version/release.
- **Marketplace instructions are wrong after merge:** correct the skill, but if they require a changed CLI contract, publish and verify a new CLI version first.

## Anti-Patterns

### Making the Repository Public Before the Exposure Gate

Historical Git objects, Actions history, and logs become public together. Rotating credentials after visibility changes is too late. Rewriting history casually also changes commit IDs, invalidates signatures/PR context, and contradicts the complete-history goal.

### Treating `package.json.license` as the License

The SPDX field is metadata, not the license grant or required notice. Ship the full root GPL text, explicit `-or-later` project notice, third-party notices, and nested MIT text.

### Mixing the MIT Skill into the GPL npm Tarball

GPL can coexist with a separate independent MIT work, but the current mixed packlist creates needless ambiguity about package licensing and distribution authority. The CLI tarball should contain the application; the marketplace should contain the skill.

### Packing More Than Once

`npm pack`, an artifact verifier that packs internally, and bare `npm publish` can create three candidates. Build once, pack once, inspect one explicit file, and pass that file to npm and GitHub.

### Publishing the GitHub Release Before Assets Are Complete

With immutable releases enabled, later asset replacement is intentionally blocked. Use a draft, attach everything, complete npm verification, then publish.

### Publishing From Pull Requests, Arbitrary Branches, or a Mutable Tag

OIDC proves workflow identity, not release intent. Require a protected semantic-version tag, tag/package equality, protected Environment approval, and a fixed workflow file.

### Renaming the Workflow After Trust Configuration

The filename is part of npm's trusted-publisher identity. A “cleanup” rename breaks release authentication and requires a new trust relationship.

### Leaving a Fallback npm Token

A dormant token defeats the reason for OIDC. After bootstrap and trust verification, disallow token publication and revoke/delete the bootstrap credential and secret.

### Publishing the Marketplace Skill First

The skill depends on a public executable it does not contain. Marketplace publication before the registry path is verified produces an installable broken integration.

### Rebuilding an Accepted Version

Neither npm `1.5.0` nor an immutable GitHub release can be repaired in place. Preserve the accepted bytes and ship a new version.

## Recommended Phase Ordering

| Phase | Scope | Depends on | Completion signal |
|---|---|---|---|
| 1. Licensing and public-readiness | Rights inventory, GPL root, MIT exception, dependency notices, history/Actions exposure audit | none | Owner approves all material for public release |
| 2. Deterministic package contract | Scoped manifest, package/source metadata, skill exclusion, single-tarball verifier, release workflow | phase 1 legal boundary | One locally verified release tarball can be traced to one commit |
| 3. Public source governance | In-place visibility change, public source/license verification, restored rulesets, immutable releases/environment | phases 1-2 | Public repository is safe and protected |
| 4. npm namespace and trust | Source-accurate prerelease seed, trusted publisher binding, OIDC proof, token revocation/disallowance | phase 3; npm package must exist before trust | Stable workflow can authenticate without a token |
| 5. Canonical `1.5.0` | Protected tag, one tarball, trusted stage/publish, registry/provenance checks, immutable GitHub release, real global/npx installs | phase 4 | Public npm and GitHub artifacts match and both install paths run |
| 6. MIT marketplace promotion | Reviewed skill copy, explicit MIT licensing, public CLI prerequisite, real Skills CLI install/invocation | phase 5 | Fresh agent install delegates to public Cumpa CLI |

This order keeps every irreversible public action behind evidence from the preceding reversible phase.

## Open Decisions and Gates

1. **Who owns all copyright needed for the GPL grant?** Resolve before public visibility; this research is architectural, not legal advice.
2. **Does the history contain material that cannot become public after credential rotation?** If yes, the owner must resolve the conflict between unchanged complete history and safe publication before proceeding.
3. **Which GitHub-hosted runner produces the intended existing native artifact?** Pin it based on the already validated runtime contract; do not let runner availability silently alter package contents.
4. **Stage-only or direct trusted publishing for stable releases?** Recommendation: stage-only plus maintainer 2FA. Direct OIDC publication is acceptable if the protected GitHub Environment is deliberately chosen as the sole human gate.
5. **How will the brand-new npm package be seeded?** npm documents no trusted-publisher-before-package flow. Use a non-stable, source-accurate bootstrap release and immediately remove the temporary credential; re-check npm capabilities at implementation time.
6. **Where will the long-term editable skill source live?** Recommendation for v1.5: Cumpa repository is reviewed upstream, ShipWithAI marketplace is distribution. Revisit only if drift appears; do not build synchronization infrastructure preemptively.

## Primary Sources

### npm

- [Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers/) — supported providers/runners, required workflow permissions, exact trust identity, minimum Node/npm, automatic provenance, cache guidance, and post-migration token policy.
- [Staged publishing](https://docs.npmjs.com/staged-publishing/) — staged review and 2FA approval with trusted publishers.
- [`npm stage` CLI](https://docs.npmjs.com/cli/v11/commands/npm-stage/) — existing-package prerequisite, tarball package spec, trust-token support, allowed-action policy, version uniqueness, and npm's stage-only recommendation.
- [Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements/) — public source/package requirements, case-sensitive repository match, and `npm audit signatures` verification.
- [`npm publish`](https://docs.npmjs.com/cli/v11/commands/npm-publish/) — tarball input, public scoped access, packlist behavior, integrity fields, and immutable name/version rule.
- [`package.json`](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) — SPDX `license`, repository metadata, `files`, always-included README/license/package metadata, `bin`, and publish configuration.
- [Creating and viewing access tokens](https://docs.npmjs.com/creating-and-viewing-access-tokens) — granular package/scope permissions, minimum one-day expiration, and organization permissions not granting package publication rights.
- [Current registry lookup for `@shipwithai/cumpa`](https://registry.npmjs.org/%40shipwithai%2Fcumpa) — returned 404 on 2026-09-04.
- [npm documentation issue #1926](https://github.com/npm/documentation/issues/1926) — current open report documenting the first-publication OIDC/bootstrap gap. This is supporting evidence for an undocumented edge, not normative npm policy.

### GitHub

- [Setting repository visibility](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility) — public Actions history/log exposure, public forks, and disabled push rulesets after private-to-public conversion.
- [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) — revoke credentials first and the consequences/recontamination risks of rewriting history.
- [Immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases) — locked tag/assets, release attestation, and draft-attach-publish best practice.
- [Verifying release integrity](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/verify-release-integrity) — `gh release verify` and `gh release verify-asset`.

### Licensing

- [SPDX GPL-3.0-or-later](https://spdx.org/licenses/GPL-3.0-or-later.html) — canonical identifier and GPL v3 text, including Corresponding Source and conveyance requirements.
- [SPDX MIT](https://spdx.org/licenses/MIT.html) — canonical MIT identifier and required copyright/license text.

### Skill Distribution

- [Ship-With-AI/skills README](https://github.com/Ship-With-AI/skills/blob/main/README.md) — current marketplace layout and one-command cross-agent installation.
- [vercel-labs/skills README](https://github.com/vercel-labs/skills/blob/main/README.md) — upstream Skills CLI source formats, `--skill`, agent targets, and installation scopes.

---

*Architecture research for Cumpa v1.5 Public Distribution; application/runtime behavior intentionally out of scope.*
