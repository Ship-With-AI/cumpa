# Architecture Research

**Domain:** Public distribution of the existing Cumpa Node.js CLI and coding-agent skill
**Researched:** 2026-09-04
**Confidence:** MEDIUM

## Executive Summary

Cumpa v1.5 should add a distribution control plane around the existing package, not a second package or application architecture. The repository already has the correct npm CLI shape: `package.json` names `cumpa`, maps the `cumpa` binary to the generated `dist/bin/cumpa.mjs`, requires Node.js 24, allowlists `dist/` and the existing skill, and builds the browser assets into the same package. Keep that shape.

The recommended release unit is one npm tarball that serves three consumers:

1. `npm install -g cumpa` links its existing `bin.cumpa` launcher onto `PATH`;
2. `npx cumpa`/`npm exec` downloads the same package and invokes that launcher;
3. the ShipWithAI marketplace installs the same exact npm version as a Claude Code plugin and discovers the existing `.kimi-code/skills/cumpa/SKILL.md` through a small plugin manifest.

A protected, immutable GitHub release triggers one fixed GitHub Actions workflow. The workflow builds once, packs once, validates and smoke-tests that exact `.tgz`, then passes that same path to `npm publish`. npm authenticates the GitHub-hosted runner through OIDC, so the workflow contains no `NODE_AUTH_TOKEN` or long-lived npm credential. A post-publication job downloads the exact registry version, compares registry integrity with the approved tarball, verifies its provenance/signatures, and exercises public global and npx installation. Only then should an exact-version entry be submitted to ShipWithAI.

Two external conditions block publication today and must be Phase 0 gates rather than hidden implementation assumptions:

- **The bare npm name is occupied.** As verified on 2026-09-04, `cumpa@2.0.1` is an unrelated function-composition package owned by `gianlucaguarini`. `npm install -g cumpa` and `npx cumpa` cannot deliver this repository until Ship With AI receives an explicit ownership transfer/addition from the current owner. A scoped or renamed fallback changes the stated product contract and requires product approval.
- **The source repository is private.** The authenticated GitHub record for `Ship-With-AI/cumpa` reports `PRIVATE`. npm trusted publishing can authenticate a private-repository workflow, but npm's automatic provenance requires both a public package and a public source repository. The repository must therefore become public before the provenance-bearing release.

## Standard Architecture

### System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Human approval plane                                                        │
│                                                                             │
│ protected default branch → draft GitHub release → publish immutable release │
│                                                     │                       │
│                                      protected npm-production environment    │
└─────────────────────────────────────────────────────┼───────────────────────┘
                                                      │ release.published
                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ One GitHub-hosted release job                                                │
│                                                                             │
│ checkout tagged SHA → validate identity/version → npm ci → existing build   │
│                                                        │                    │
│                                                        ▼                    │
│                                              one cumpa-X.Y.Z.tgz             │
│                                                        │                    │
│                inspect inventory + install/smoke exact tarball              │
│                                                        │                    │
│                          GitHub OIDC ────────────────► npm publish ./file.tgz│
└────────────────────────────────────────────────────────┬────────────────────┘
                                                         │ immutable name/version
                                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ npm public registry                                                         │
│                                                                             │
│ cumpa@X.Y.Z + dist.integrity + registry signature + provenance attestation  │
└──────────────┬──────────────────────────┬───────────────────────────┬────────┘
               │                          │                           │
               ▼                          ▼                           ▼
       npm install -g cumpa         npx cumpa             ShipWithAI catalog
               │                          │                 npm source X.Y.Z
               └──────────────┬───────────┘                           │
                              ▼                                       ▼
                    dist/bin/cumpa.mjs                    Claude plugin cache
                              │                                       │
                              ▼                                       ▼
                existing CLI/server/browser              existing Cumpa skill
                review architecture unchanged            delegates to PATH CLI
```

The public distribution boundary ends at the existing launcher. Once `dist/bin/cumpa.mjs` imports `dist/cli/run.js`, the shipped Node CLI, Git adapter, Fastify loopback server, Vue/Monaco browser application, persistence, review contract, and exports behave exactly as they do now.

### Component Responsibilities

| Component | Status | v1.5 responsibility |
|---|---|---|
| npm ownership for `cumpa` | **External prerequisite** | Transfer/add Ship With AI as an authorized owner before any workflow activation; preserve an explicit record of the transfer. Do not attempt to publish over an unrelated package. |
| `Ship-With-AI/cumpa` visibility | **External prerequisite** | Become public before publication so npm can issue automatic provenance for the public package. |
| `package.json` and root lockfile metadata | **Modify** | Remove `private`, replace `0.0.0` with the approved unused registry version, retain `type`, `engines`, `bin`, and existing runtime dependencies, add exact public repository/homepage/bugs/license metadata, set explicit public publication policy, and include `.claude-plugin/` in `files`. |
| Public license | **New policy/file if not already chosen** | Select a license, add the corresponding root license file, and make `package.json.license` agree. This is a maintainer/legal decision, not a release-script default. |
| `scripts/build-bin.mjs` | **Reuse unchanged** | Continue producing executable `dist/bin/cumpa.mjs` and embedding only the approved `CUMPA_RELEASE_SUPPORT_SERVICE_URL` when the release build supplies it. |
| `scripts/build-native-addon.mjs` and native capability loader | **Reuse with explicit runner choice** | Preserve the current Darwin arm64 addon on a GitHub-hosted arm64 macOS release runner. Other platforms already catch an absent/incompatible addon and expose `reExportUnsupported`; do not create platform package fan-out in this milestone. |
| `scripts/verify-production-artifacts.mjs` | **Modify** | Accept a concrete `.tgz` path and inspect it. Stop creating a second tarball internally. Keep current inventory/protected-value/support-origin checks and add public metadata plus plugin/skill assertions. |
| `tests/e2e/package-assets.spec.ts` | **Modify narrowly** | Reuse the concrete tarball path where possible; retain clean-install launcher coverage and assert the plugin manifest and existing skill are present. Add npx-style tarball execution only if the existing clean-install check does not cover it. |
| `README.md` | **Modify** | Replace private-checkout-only installation as the primary path with `npm install -g cumpa` and `npx cumpa`; state Node 24 and Git prerequisites; document the ShipWithAI install command and that its skill delegates to the separately available CLI. |
| `.kimi-code/skills/cumpa/SKILL.md` | **Reuse; modify only if prerequisite failure is unclear** | Remain the sole skill protocol. It must continue delegating review to `cumpa`, not duplicate review behavior. A missing-CLI diagnostic may point to the public install command. |
| `.claude-plugin/plugin.json` | **New** | Declare plugin name/version/description and `"skills": "./.kimi-code/skills"`, allowing Claude Code to discover the existing skill in the npm package. |
| `.github/workflows/publish-npm.yml` | **New** | Implement the single release-to-registry path with `release.published`, protected environment, OIDC permissions, fixed GitHub-hosted runner, build-once/pack-once verification, exact-tarball publish, and post-publish checks. Its filename becomes part of npm's trusted-publisher identity and must remain stable. |
| `.github/workflows/deploy-supabase-production.yml` | **Unchanged; never reuse for npm** | It is an Ubuntu, secret-rich support-service deployment boundary. Combining npm publication with it would expose unnecessary secrets and omit the Darwin arm64 addon. Keep npm in the new least-privilege OIDC-only workflow. |
| GitHub `npm-production` environment | **External configuration** | Require reviewers, prevent self-review, and restrict deployment refs to the release-tag policy. |
| npm trusted-publisher settings | **External configuration** | Bind `Ship-With-AI`, `cumpa`, exact workflow filename, and exact environment name; allow direct `npm publish`; after success disallow traditional tokens. |
| GitHub immutable releases | **External configuration** | Lock the published release tag/assets and create GitHub's release attestation. |
| ShipWithAI catalog entry | **External upstream change** | Add `cumpa` to `ShipWithAI/shipwithai-plugins/.claude-plugin/marketplace.json` with an npm source pinned to the registry-verified version. |

## Recommended Project Structure

Only distribution files are shown; the existing `src/` review architecture remains unchanged.

```text
.
├── package.json                         # MODIFY: public package/plugin metadata
├── package-lock.json                    # MODIFY: root name/version metadata stays aligned
├── README.md                            # MODIFY: public CLI + marketplace installation
├── LICENSE                              # NEW when maintainers choose the public license
├── .claude-plugin/
│   └── plugin.json                      # NEW: points to existing skill directory
├── .kimi-code/
│   └── skills/
│       └── cumpa/
│           └── SKILL.md                 # EXISTING authority; no copied skill
├── .github/
│   └── workflows/
│       └── publish-npm.yml              # NEW: only npm release workflow
├── scripts/
│   ├── build-bin.mjs                    # EXISTING launcher/support-origin build
│   ├── build-native-addon.mjs           # EXISTING optional Darwin arm64 capability
│   └── verify-production-artifacts.mjs  # MODIFY: verify caller-supplied .tgz
└── tests/
    └── e2e/
        └── package-assets.spec.ts        # MODIFY narrowly: package/plugin install contract

External upstream repository:
ShipWithAI/shipwithai-plugins/
└── .claude-plugin/
    └── marketplace.json                 # ADD exact npm source entry after publish
```

### Structure Rationale

- **One package owns every distributable byte.** `package.json.files` remains the allowlist for the launcher, runtime, browser assets, plugin manifest, and canonical skill.
- **The existing skill stays canonical.** A manifest path is enough; copying it into a conventional `skills/` tree would create two sources that can drift.
- **Release policy lives at the repository edge.** The workflow and external GitHub/npm settings do not leak registry concepts into CLI, server, or browser modules.
- **The existing verifier remains the package-policy authority.** Passing it a path is less code and stronger evidence than adding a second release-only scanner.
- **The marketplace owns discovery, not product code.** Its catalog entry identifies an already published npm artifact; it does not carry another Cumpa build.

## Architectural Patterns

### Pattern 1: Single Package, Single Tarball

**What:** Build the existing root package once and produce one `.tgz`. All supported install routes resolve to that artifact.

```text
package.json + lockfile + source + existing build
                         │
                         ▼
                  cumpa-X.Y.Z.tgz
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          global        npx      plugin cache
```

**When to use:** Every v1.5 release.

**Trade-offs:** The npm plugin installation also downloads Cumpa's runtime dependencies even though the skill invokes a separately installed CLI. That duplication is acceptable because it avoids a second package and guarantees the marketplace skill bytes are versioned with the CLI. Split packages only if measured installation cost becomes a product problem.

### Pattern 2: Build Once, Inspect Once, Publish That File

**What:** Explicitly build, then pack with lifecycle scripts disabled, validate the returned tarball path, install that file in clean locations, and publish the same relative path.

```text
npm ci
CUMPA_RELEASE_SUPPORT_SERVICE_URL=<approved-origin> npm run build
npm pack --json --ignore-scripts --pack-destination <release-dir>
node scripts/verify-production-artifacts.mjs <release-dir>/cumpa-X.Y.Z.tgz
npm publish ./<release-dir>/cumpa-X.Y.Z.tgz --access public --tag latest
```

The exact CLI spelling may be wrapped in package scripts, but the artifact identity must remain visible and singular.

**Why:** The current verifier performs `npm pack --dry-run` and then a separate `npm pack`, while a bare `npm publish` would pack yet again. Those inventories are useful but do not prove that the inspected bytes are the uploaded bytes. npm officially accepts a relative gzipped tarball as the `npm publish` package spec.

**Trade-offs:** `--ignore-scripts` means CI must call the build explicitly. This is desirable in release automation because build order and the support-origin input become reviewable rather than implicit in `prepack`. Keep `prepack` for normal local packaging convenience.

### Pattern 3: Human Approval Followed by Ephemeral OIDC Authority

**What:** A maintainer publishes a reviewed draft GitHub release, and an environment reviewer authorizes only the npm publish job. GitHub then issues a short-lived OIDC identity accepted by npm for one configured repository/workflow/environment.

```yaml
on:
  release:
    types: [published]

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    environment: npm-production
    runs-on: macos-15
```

The complete workflow must additionally validate the event/tag/version and set `registry-url: https://registry.npmjs.org`; this excerpt shows the trust boundary, not a copy-paste workflow.

**When to use:** Every public npm release.

**Trade-offs:** The release publication and protected environment are two GitHub approval surfaces. This is intentional for a write-once public registry operation. npm stage-only publishing can add a third, npm-side 2FA approval, but it is optional hardening rather than the required v1.5 flow.

### Pattern 4: Registry-First Marketplace Promotion

**What:** Publish and verify `cumpa@X.Y.Z` before changing the ShipWithAI catalog. The catalog entry pins that exact version.

```json
{
  "name": "cumpa",
  "version": "X.Y.Z",
  "source": {
    "source": "npm",
    "package": "cumpa",
    "version": "X.Y.Z"
  }
}
```

The package's plugin manifest must use the same version and route skills to `./.kimi-code/skills`.

**Trade-offs:** Marketplace availability lags npm publication by an upstream PR and review. That is preferable to a catalog entry which points to missing or unverified bytes. Do not automate cross-repository catalog updates in v1.5.

## Release Data Flow

### Phase 0 Preconditions

1. Obtain an explicit transfer of, or owner access to, the existing unscoped `cumpa` npm package from its current unrelated owner. If this cannot be obtained, stop: a scoped or renamed package cannot meet the stated commands without an approved milestone change.
2. Decide how to handle the unrelated historical `cumpa` versions. The new version must be unused and deliberately versioned; a new higher major is the least misleading continuation after `2.0.1`. Deprecating old unrelated versions should be an authenticated one-time maintainer operation, not a tokenized CI step.
3. Make `https://github.com/Ship-With-AI/cumpa` public and confirm the exact URL is acceptable as the package's provenance source.
4. Select the public license.
5. Reserve the stable workflow filename and environment name before configuring npm's trusted publisher; npm treats those fields as identity, not cosmetic metadata.

### Approved Release to Public Consumers

```text
1. Merge release-ready source, lockfile, package metadata, plugin metadata,
   skill, documentation, verifier, and workflow to the protected default branch.
        │
2. Create a GitHub draft release for vX.Y.Z at that reviewed commit.
        │
3. Review tag target, notes, package/plugin versions, and stable/prerelease state;
   publish the immutable release.
        │ release.published: ref=refs/tags/vX.Y.Z, sha=tagged commit
4. Enter protected npm-production environment; required reviewer approves.
        │
5. Checkout the event SHA on fixed GitHub-hosted arm64 macOS runner.
        │
6. Fail closed unless:
   - tag is exactly v${package.version};
   - package name is exactly cumpa and private is absent/false;
   - version is not 0.0.0 and is not already registered;
   - release is stable unless prereleases are explicitly enabled;
   - tagged commit is allowed by release/default-branch policy;
   - repository URL exactly identifies Ship-With-AI/cumpa;
   - package, plugin, and intended marketplace versions agree;
   - publication access/tag policy is explicit.
        │
7. setup-node Node 24 + npm >=11.5.1, registry URL npmjs, cache disabled;
   npm ci; build once with approved release support origin.
        │
8. npm pack once with --ignore-scripts into an empty release directory.
        │
9. Verify and smoke that exact .tgz.
        │
10. npm publish ./cumpa-X.Y.Z.tgz --access public --tag latest.
    npm CLI exchanges GitHub OIDC for a short-lived credential and emits
    provenance automatically; no NODE_AUTH_TOKEN exists.
        │
11. Fetch exact registry metadata/tarball, prove integrity equivalence,
    install exact version in clean global and npx paths, and verify
    registry signatures/provenance.
        │
12. Confirm unversioned npm install/npx resolve the intended latest version.
        │
13. Submit ShipWithAI catalog entry pinned to X.Y.Z.
        │
14. From clean Claude Code state, install cumpa@shipwithai, confirm skill
    discovery, actionable missing-CLI behavior, and delegation when CLI exists.
```

### Failure and Recovery

- **Before `npm publish`:** fail the job; no registry state changed. Correct source/metadata, create a new reviewed release as appropriate, and rerun only through the approved path.
- **After `npm publish`:** never overwrite or reuse the version. npm permanently reserves a published name/version, and an immutable GitHub release tag cannot move. Deprecate the bad version if necessary and release a new patch version through the full flow.
- **After npm verification but before marketplace merge:** correct the catalog PR without changing npm.
- **After marketplace publication:** publish a corrected npm/plugin version first, verify it, then bump the catalog entry. Never point the catalog at mutable `latest`.

## Artifact Verification Contract

| Stage | Required evidence | What it proves | What it does not prove |
|---|---|---|---|
| Tagged source | `vX.Y.Z`, package version, plugin version, exact repository URL, release SHA/default-branch policy | The reviewed release identifies one source revision and package identity | Generated files are correct |
| Exact local `.tgz` inventory | `dist/bin/cumpa.mjs`, runtime JS, browser HTML/assets, `.claude-plugin/plugin.json`, `.kimi-code/skills/cumpa/SKILL.md`, README/license/package metadata; no TypeScript/Vue source, support-service source, env files, secrets, or unrelated files | npm allowlist and build outputs are correct | Installed command runs |
| Exact local `.tgz` policy scan | executable launcher mode/shebang; canonical support origin exactly once; plugin path/version valid; Node engine/bin mapping intact | Artifact contains the configured launcher and discoverable skill | Registry received these bytes |
| Exact local `.tgz` installation | isolated prefix global-style install and npm-exec/npx-style execution of `cumpa --help` or another noninteractive surface | npm links/resolves the packaged binary without repository files | Public registry resolution works |
| Publish command | `npm publish ./path/to/the-verified.tgz --access public --tag latest` | Uploaded input is the artifact that passed local checks | Registry metadata/provenance is externally visible yet |
| Registry integrity | exact `cumpa@X.Y.Z` metadata; downloaded tarball SHA-512 equals `dist.integrity` and the approved local tarball; `dist-tags.latest` points to X.Y.Z | Registry serves the approved bytes under the intended immutable name/version and default tag | The code is behaviorally correct |
| Public install | clean-cache `npm install -g cumpa@X.Y.Z`; clean-cache literal `npx cumpa@X.Y.Z --help`; then unversioned `npm install -g cumpa`/`npx cumpa` resolution | Both advertised public install paths work against the registry | Agent skill is discoverable |
| Provenance/signatures | clean project installs exact version and `npm audit signatures` reports verified registry signatures and provenance attestations | Registry/Sigstore can connect the public artifact to the trusted workflow/source | Review correctness or absence of malicious source |
| Marketplace install | clean Claude state installs `cumpa@shipwithai`; plugin list and skill invocation show the expected version | ShipWithAI catalog, npm plugin source, manifest, and skill path integrate | Shell-global CLI prerequisite exists |
| Skill delegation | absent CLI gives install guidance; installed CLI launches the existing handoff path | Marketplace skill and public CLI compose correctly | New review behavior; none should be introduced |

The registry comparison and provenance check are complementary. `npm audit signatures` should not be described as comparing the root tarball with a local file; `dist.integrity` plus the downloaded tarball performs that comparison. Conversely, matching bytes alone does not prove which workflow produced them; provenance supplies the origin link.

## Trust and Security Boundaries

| Boundary | Authority crossing | Required control |
|---|---|---|
| Current npm owner → Ship With AI | Ownership of the already occupied bare package name | Explicit transfer/owner addition; no impersonation, squatting workaround, or silent fallback name |
| Maintainer → protected default branch | Source and release configuration become eligible | Normal code review/branch protection; release commit must be approved and reachable under the chosen policy |
| Maintainer → GitHub release/tag | A source commit is nominated for irreversible publication | Draft review; exact version/tag check; stable-release guard; immutable releases enabled |
| GitHub environment reviewer → publish job | Human authorizes registry write | `npm-production` required reviewers, prevent self-review, release-tag deployment restrictions |
| Workflow identity → npm registry | Short-lived publish authority | Trusted publisher bound to exact org/repo/workflow/environment; GitHub-hosted runner; `id-token: write`; no npm token |
| Third-party GitHub actions → release runner | Action code can read source and influence artifact | Minimal actions, pin immutable action commit SHAs, minimal job permissions, no package-manager cache in release builds |
| Tagged source/lockfile → `dist/` | Build tools and dependencies generate executable/browser bytes | `npm ci`, fixed Node/npm/runner baseline, committed lockfile, approved support-origin input |
| Build directory → `.tgz` | npm allowlist selects public bytes | Empty output directory, one pack operation, concrete tarball-path verifier, secret/protected-value scan |
| Verified `.tgz` → npm name/version | Bytes become public and immutable | Publish explicit relative tarball path with explicit public access and `latest` tag |
| npm registry → global/npx consumer | Registry selects and serves executable code | Exact-version/integrity/provenance verification; then verify default `latest` resolution |
| npm package → Claude plugin cache | Claude Code installs package as plugin source | Exact catalog version; packaged plugin manifest; no assumption that plugin-local npm bin is shell-global |
| Marketplace skill → local executable | Markdown instructions invoke a process from user `PATH` | Explicit Node 24/Git/CLI prerequisites; preserve existing skill gate and strict canonical handoff |
| Local executable → review runtime | Public install enters application code | Existing prerequisite checks and `127.0.0.1` loopback/token boundaries remain unchanged |

The configured support service origin is public build configuration, not a secret, but it changes launcher behavior and must be supplied before packing and asserted in the exact artifact. npm credentials, GitHub OIDC tokens, and unrelated repository secrets must never be embedded or printed.

## Package and Marketplace Contracts

### Public npm Manifest

Required manifest invariants:

- `name` remains exactly `cumpa` only after ownership is secured;
- `version` is a real, unused registry version and matches the GitHub tag and plugin version;
- `private` is removed or false;
- `type: "module"`, `engines.node: ">=24"`, and `bin.cumpa: "dist/bin/cumpa.mjs"` remain;
- `files` retains `dist/` and `.kimi-code/skills/cumpa/` and adds `.claude-plugin/`;
- `repository.url` exactly matches the public publishing repository because npm provenance validates it;
- `homepage`, `bugs`, `description`, `license`, and useful keywords identify the public product;
- public access and stable dist-tag are explicit through `publishConfig` and/or immutable workflow arguments;
- runtime dependencies stay in `dependencies`; build/test tooling stays in `devDependencies`.

Do not add a wrapper executable, postinstall downloader, platform package family, or separate `@ship-with-ai/cumpa` package while the required public identity is bare `cumpa`.

### Plugin Manifest

A minimal package-local manifest is sufficient:

```json
{
  "name": "cumpa",
  "version": "X.Y.Z",
  "description": "Launches Cumpa's local review flow and consumes its canonical feedback.",
  "skills": "./.kimi-code/skills"
}
```

An explicit manifest version gives this published npm-source plugin a stable Claude Code update/cache key. Because `plugin.json` takes precedence over the marketplace entry, enforce equality with the package and catalog versions during artifact verification rather than generating another manifest system.

### ShipWithAI Catalog

The external entry should use the established marketplace name `shipwithai`, an exact npm version, truthful prerequisites, the public repository/homepage, and the catalog's existing author/category/tag conventions. The npm source is supported by Claude Code and avoids copying the skill into ShipWithAI's repository.

Marketplace registration is a one-time user operation:

```text
/plugin marketplace add ShipWithAI/shipwithai-plugins
```

Once registered, skill installation is one step:

```text
/plugin install cumpa@shipwithai
```

That step installs the plugin into Claude Code's cache. It does **not** establish a shell-global `cumpa`; the listing, README, and any missing-prerequisite diagnostic must say that Node 24, Git, and the public CLI are required. Verify the actual namespaced skill invocation exposed by Claude Code rather than promising an untested alias.

## Required Work Versus Optional Hardening

### Required for v1.5

1. Secure legitimate ownership of the existing `cumpa` npm package name.
2. Make the source repository public and choose a public license.
3. Convert the existing manifest from private/placeholder metadata to the real public package while preserving its existing launcher/build layout.
4. Add the plugin manifest pointing to the existing skill and package it in the same tarball.
5. Refactor the existing artifact verifier to accept the exact tarball path.
6. Add one stable GitHub release workflow using a GitHub-hosted runner, Node 24, npm `>=11.5.1`, protected environment approval, OIDC, and no npm token.
7. Enable immutable GitHub releases and configure the matching npm trusted publisher/environment.
8. Build once, pack once, inspect and smoke the exact tarball, and publish that file explicitly.
9. Verify registry bytes, default tag, provenance/signatures, global install, and npx from clean locations.
10. Publish the exact verified version through the ShipWithAI marketplace and verify skill discovery/delegation.
11. Update public documentation and prerequisite diagnostics without changing review semantics.

### Optional Enhancements

- **npm staged publishing:** Configure the trusted publisher as stage-only and replace direct publication with `npm stage publish`, followed by interactive maintainer approval with 2FA. npm describes this as maximum hardening, but it adds a third approval system and is not necessary when reviewed GitHub releases plus a protected environment are the accepted v1.5 gate.
- **Cross-platform release matrix:** Before publication, fan the exact tarball through additional GitHub-hosted OS jobs and return a checksum-attested artifact to the publish job. Add this when Cumpa explicitly promises more platforms; do not create per-platform packages merely for `--help` coverage.
- **Automated marketplace update PR:** Add only when release frequency makes the small manual exact-version update error-prone. Never let such automation merge before npm verification.
- **Additional release assets:** The npm tarball need not also be a GitHub release asset. Adding it safely would require preparing the asset while the release is still a draft; do not add a second workflow solely for duplication.

## Dependency-Aware Implementation Order

| Phase | Depends on | Deliverable and exit condition |
|---|---|---|
| **0. Distribution identity and policy** | None | npm owner access for bare `cumpa`; public `Ship-With-AI/cumpa`; selected license; approved first Cumpa registry version; stable workflow/environment names. Stop if any required identity cannot be obtained. |
| **1. One-package public contract** | Phase 0 decisions | Public `package.json`/lockfile metadata, `.claude-plugin/plugin.json`, unchanged canonical skill path, README install/prerequisite copy. A local pack inventory contains one CLI+browser+skill artifact. |
| **2. Exact-artifact verification** | Phase 1 | Existing verifier accepts a `.tgz`; build-once/pack-once path checks inventory, support origin, plugin metadata, executable, isolated global install, and npx-style execution without repacking. |
| **3. Approved trusted publication** | Phases 0-2 | Immutable releases, protected `npm-production` environment, exact npm trusted-publisher binding, and `publish-npm.yml` with release/tag guards, fixed GitHub-hosted runner, OIDC, exact-tarball publish, no npm secret. Dry-run/local checks pass before activation. |
| **4. First public registry release** | Phase 3 | Reviewed immutable release publishes the chosen version; registry tarball/integrity/provenance/signatures verified; clean exact and unversioned global/npx flows resolve Cumpa. Record immutable evidence before promotion. |
| **5. ShipWithAI promotion** | Phase 4 | Upstream catalog entry points to the verified exact npm version; clean marketplace installation discovers the existing skill and delegates to the separately installed CLI. |

The ordering is strict at two points: trusted-publisher activation needs legitimate npm package ownership, and the marketplace must not reference a version until npm serves and verifies it.

## Scaling Considerations

Public distribution scales by releases, platforms, and install surfaces rather than server users.

| Growth point | Architecture response |
|---|---|
| Occasional stable releases, current platform scope | One protected workflow, one arm64 macOS-built tarball, one `latest` channel, manual exact-version ShipWithAI PR. |
| More frequent releases | Keep one workflow; add concurrency/idempotency guards and automate evidence capture. Do not introduce a release service or package monorepo. |
| Supported prerelease channel | Add an explicit prerelease branch/tag policy, npm dist-tag such as `next`, separate release guard, and a catalog policy. Do not let a prerelease event overwrite `latest` accidentally. |
| Explicit Linux/Windows/macOS support commitment | Run the exact tarball through a prepublication OS matrix. The current Darwin arm64 addon is optional at runtime; if a native capability later becomes required on every platform, then evaluate npm optional platform packages or portable implementation as a separate architecture decision. |
| Multiple agent marketplaces | Keep the package and canonical skill unchanged; add thin marketplace metadata pointing to exact package versions. Do not fork the skill per marketplace. |

### First Bottlenecks

1. **External coordination, not build throughput:** npm ownership transfer and ShipWithAI PR review dominate lead time. Solve with release checklists and clear ownership, not automation services.
2. **Version synchronization:** package, plugin, GitHub tag, npm dist-tag, and marketplace entry can drift. One verifier comparing declared versions is sufficient; do not add a versioning framework.
3. **Platform evidence:** a macOS-built package can be installed elsewhere because the native addon is optional, but broader support claims require actual clean installs on those systems.

## Anti-Patterns

### Repacking at Publish Time

**What people do:** Inspect `npm pack --dry-run`, run another pack in tests, then execute bare `npm publish` from the working tree.

**Why it is wrong:** Each lifecycle/build/pack invocation is another opportunity for inputs or bytes to differ. The evidence no longer identifies the uploaded file.

**Do this instead:** Pack once, pass that concrete path to every verifier/smoke, and publish the same `.tgz` path.

### Parallel CLI and Skill Packages

**What people do:** Publish one package for the CLI and another package or copied repository subtree for the skill.

**Why it is wrong:** Versions, docs, and handoff protocol can drift, while users cannot know which pair is compatible.

**Do this instead:** Put one plugin manifest beside the already packaged existing skill and expose the root npm package as the marketplace source.

### Treating Marketplace Installation as CLI Installation

**What people do:** Assume Claude Code's npm-source plugin cache makes `cumpa` globally available on the user's `PATH`.

**Why it is wrong:** Plugin installation and shell-global npm installation are separate mechanisms. The existing skill invokes a system command.

**Do this instead:** State and test the CLI prerequisite. Keep `/plugin install cumpa@shipwithai` one-step for the skill after marketplace registration.

### Token-Based Publishing “Just for the First Release”

**What people do:** Add `NPM_TOKEN` to GitHub secrets as a bootstrap shortcut.

**Why it is wrong:** It violates the no-long-lived-token goal and creates rotation/exfiltration work. In this case the package already exists, so proper ownership transfer should permit trusted-publisher configuration before the first Ship With AI release.

**Do this instead:** Resolve ownership and configure OIDC first. If npm reveals an unhandled bootstrap constraint, stop and resolve it as a one-time authenticated maintainer operation without committing an automation token.

### Publishing from a Private Repository and Claiming Provenance

**What people do:** Observe that trusted OIDC authentication succeeded and assume provenance was emitted.

**Why it is wrong:** npm explicitly requires a public repository and public package for automatic provenance.

**Do this instead:** Make the repository public before the release and fail post-publication verification when the attestation is absent.

### Treating Provenance as a Functional Test

**What people do:** Use the provenance badge as evidence that the package runs or that the correct assets were included.

**Why it is wrong:** Provenance links bytes to source/build identity; it does not validate Cumpa behavior or package inventory.

**Do this instead:** Combine provenance with exact-tarball inspection, integrity comparison, and real install/execute checks.

### Publishing the Marketplace Entry First

**What people do:** Merge the catalog entry while npm publication is pending.

**Why it is wrong:** Users receive a one-step installation command that resolves to a missing or unrelated package/version.

**Do this instead:** Registry publication and verification are hard dependencies of marketplace promotion.

### Solving Native Packaging Prematurely

**What people do:** Create several platform packages or install-time compilation merely because one optional Darwin arm64 addon exists.

**Why it is wrong:** The current loader already degrades safely to `reExportUnsupported`, and platform fan-out creates release coordination unrelated to public CLI discovery.

**Do this instead:** Build the single release artifact on fixed GitHub-hosted arm64 macOS to preserve the existing addon, document current support, and add platform packaging only when a required cross-platform native feature justifies it.

## Integration Points

### External Services
The identities are intentionally different and must not be normalized: the source/trusted-publisher repository owner is `Ship-With-AI`, while the marketplace organization is `ShipWithAI`.


| Service | Integration pattern | Notes |
|---|---|---|
| npm registry | Trusted publisher plus explicit `.tgz` `npm publish` | Bare name currently has unrelated owner/history. Configure direct publish, exact workflow/environment, public access and stable tag after transfer. |
| GitHub Releases | Draft review followed by `release.published` | Event identifies tag ref/commit; immutable releases lock tag/assets and create a GitHub release attestation. |
| GitHub Environments | `environment: npm-production` on publish job | Required reviewers, prevent self-review, and deployment-tag restriction are the final human gate before registry write. |
| GitHub OIDC | `id-token: write` on GitHub-hosted runner | npm CLI `>=11.5.1`; setup-node registry URL; no `NODE_AUTH_TOKEN`; automatic npm provenance only after repository is public. |
| ShipWithAI marketplace | External catalog entry with exact npm source version | Repository is `ShipWithAI/shipwithai-plugins`; marketplace name is `shipwithai`; upstream acceptance remains external. |
| Claude Code plugin manager | npm source plus `.claude-plugin/plugin.json` | Installs plugin in cache and discovers custom skill path; does not promise global binary installation. |
| Public support service | Existing build-time canonical origin | Preserve current build/scan contract; it is not a release credential. |

### Internal Boundaries

| Boundary | Communication | Notes |
|---|---|---|
| release workflow → existing build | npm scripts plus one public support-origin environment value | No review-runtime code change. |
| existing build → exact tarball | `npm pack --json --ignore-scripts` | JSON output supplies the sole artifact filename. |
| exact tarball → existing verifier | explicit path argument | Verifier must not call `npm pack`. |
| package manifest → npm global/npx | existing `bin.cumpa` mapping | Generated launcher must remain executable and included. |
| package manifest → Claude plugin | `files` allowlist includes manifest and existing skill | Custom `skills` path avoids duplication. |
| skill → CLI | `cumpa` process on `PATH` and existing JSON handoff protocol | Keep CLI prerequisite explicit; canonical feedback contract unchanged. |
| launcher → CLI/server/browser | existing import and loopback launch path | Distribution does not add remote service exposure or change review behavior. |

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| Existing repository/package integration | HIGH | Direct inspection of current manifest, build scripts, verifier, native capability fallback, tests, README, and skill. |
| npm global/npx/package/tarball behavior | MEDIUM | Current npm CLI and official npm documentation were checked through Context7 and direct official pages; exact workflow still needs implementation proof. |
| npm trusted publishing/provenance | MEDIUM | Current official npm documentation checked on 2026-09-04; product blockers and first transfer/configuration must be exercised on the real package. |
| GitHub release/environment/immutability | MEDIUM | Current official GitHub documentation supports the design; repository settings and plan-specific environment protections must be verified in the real repository. |
| npm identity/visibility blockers | HIGH | Live npm registry metadata/`npm view` and authenticated `gh repo view` were checked on 2026-09-04. Resolution depends on external owners/settings. |
| Claude Code npm plugin contract | MEDIUM | Current official Claude Code docs support npm sources, exact versions, plugin manifests, and custom skills paths; installed invocation must be verified in clean Claude Code. |
| ShipWithAI acceptance | MEDIUM | Current public catalog/README confirm marketplace name and contribution flow, but upstream maintainers control acceptance and currently show no npm-source example. |

Overall confidence is MEDIUM because the architecture uses documented native mechanisms and existing repository seams, but successful delivery depends on an external npm ownership transfer, public-repository conversion, real OIDC/provenance publication, and upstream marketplace acceptance that research cannot perform.

## Sources

### Official npm

- [Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers/) — OIDC prerequisites, GitHub-hosted runners, workflow/environment binding, no-token operation, automatic provenance, allowed actions, stage-only option, and token restrictions. [MEDIUM]
- [Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements/) — public repository/public package requirements and `npm audit signatures` attestation verification. [MEDIUM]
- [`npm publish`](https://docs.npmjs.com/cli/v11/commands/npm-publish) — explicit gzipped-tarball package spec, immutable name/version, integrity publication, public access and tags. [MEDIUM]
- [`package.json` `bin`](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#bin) and [`npx`/`npm exec`](https://docs.npmjs.com/cli/v11/commands/npx) — global executable links and temporary package execution. [MEDIUM]
- [Verifying registry signatures](https://docs.npmjs.com/verifying-registry-signatures/) — installed-package signature verification. [MEDIUM]
- [Package name guidelines](https://docs.npmjs.com/package-name-guidelines) — unique, first-party public package identity expectations. [MEDIUM]
- [Live `cumpa` registry metadata](https://registry.npmjs.org/cumpa/latest) — unrelated `cumpa@2.0.1`, maintainer/repository, tarball and integrity metadata. Verified with `npm view cumpa` on 2026-09-04. [HIGH]

### Official GitHub

- [Events that trigger workflows: `release`](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#release) — `published` activity and tag SHA/ref behavior. [MEDIUM]
- [Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments) — required reviewers, prevent-self-review, and deployment branch/tag rules. [MEDIUM]
- [Immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases) — locked tags/assets, release attestations, and draft-then-publish flow. [MEDIUM]
- [GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners) — fixed macOS arm64 labels; trusted publishing independently requires GitHub-hosted execution. [MEDIUM]
- Authenticated `gh repo view Ship-With-AI/cumpa` on 2026-09-04 — repository visibility was `PRIVATE`; this operational fact has no public page while private. [HIGH]

### Claude Code and ShipWithAI

- [Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) — npm package sources, exact versions, marketplace registration and installation. [MEDIUM]
- [Plugins reference](https://code.claude.com/docs/en/plugins-reference) — `.claude-plugin/plugin.json`, custom skill paths, cache/update version precedence, and plugin installation behavior. [MEDIUM]
- [ShipWithAI marketplace catalog](https://github.com/ShipWithAI/shipwithai-plugins/blob/main/.claude-plugin/marketplace.json) — marketplace identity and current entry conventions. [MEDIUM]
- [ShipWithAI marketplace README](https://github.com/ShipWithAI/shipwithai-plugins) — registration/install commands and contribution expectation to keep versions honest and test on real projects. [MEDIUM]

### Repository Integration Evidence

- `package.json`
- `scripts/build-bin.mjs`
- `scripts/build-native-addon.mjs`
- `scripts/verify-production-artifacts.mjs`
- `src/server/native-exchange-capability.ts`
- `tests/e2e/package-assets.spec.ts`
- `.kimi-code/skills/cumpa/SKILL.md`
- `README.md`
- `.planning/PROJECT.md`

---
*Architecture research for: Cumpa v1.5 Public Distribution*
*Researched: 2026-09-04*
