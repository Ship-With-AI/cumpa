# Stack Research

**Domain:** Public distribution for an existing Node.js CLI and coding-agent skill
**Researched:** 2026-09-04
**Confidence:** MEDIUM — platform contracts were verified against current official npm, GitHub, Agent Skills, Claude Code, and live registry/marketplace sources. Confidence is not HIGH because the bare npm namespace transfer, public license, and first Cumpa package version remain owner decisions.

## Executive Recommendation

Do not change Cumpa's shipped application stack. Public distribution needs native npm and GitHub capabilities, not another release framework or runtime dependency:

1. Acquire the existing unscoped `cumpa` npm package from its current owner. The required commands `npm install --global cumpa` and `npx cumpa` are impossible until that happens.
2. Make `Ship-With-AI/cumpa` public after a repository-history and secret review. npm provenance for a public package requires a public source repository.
3. Convert the existing package metadata from private development metadata to a public CLI contract, preserving Node 24, ESM, `bin.cumpa`, and the compiled `dist/` payload.
4. Add a dedicated GitHub release workflow using npm trusted publishing. Build, scan, pack, and publish in one GitHub-hosted `macos-15` job with OIDC and no npm token.
5. Publish the existing skill in `Ship-With-AI/skills/skills/cumpa/SKILL.md`. Use the marketplace's existing plugin and Vercel Skills CLI path rather than creating a Cumpa-specific installer or marketplace.

### Release-blocking prerequisites

| Blocker | Verified current state | Required resolution |
|---------|------------------------|---------------------|
| Bare npm name | `npm view cumpa` returns an unrelated function-composition package at `2.0.1`, maintained by `gianlucaguarini`; published versions are `1.0.0`, `1.0.1`, `2.0.0`, and `2.0.1`. | Negotiate an npm ownership transfer before implementation assumes the name. npm documents transfer through `npm owner add` followed by removal of the old owner. A scoped fallback does **not** meet the named global-install/npx contract. |
| Public provenance source | Authenticated GitHub metadata reports `Ship-With-AI/cumpa` as `PRIVATE`. | Make the repository public before the npm release. Audit history and repository configuration first; automatic npm provenance requires both package and source repository to be public. |
| Public license | The Cumpa repository has no root license file and `package.json` has no `license`. | Maintainers must choose an SPDX license and add the matching root license file and package metadata. Do not infer legal permission from the MIT license used by the separate ShipWithAI skills repository. |
| Package version | Local `package.json` is `0.0.0`; the occupied registry lineage already reached `2.0.1`. | Choose an unused SemVer after transfer. If the namespace is intentionally repurposed, `3.0.0` is the technically clean first Cumpa version because it is the next major after the unrelated public API. Do not equate the product milestone label “v1.5” with npm `1.5.0`. |

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | `24.x` LTS; package engine `>=24` | Existing CLI/server/runtime and release build | This is already Cumpa's supported runtime. It also exceeds trusted publishing's Node `>=22.14.0` floor and Skills CLI's Node `>=22.20.0` floor. Changing it would expand scope without helping distribution. |
| npm registry + npm CLI | npm `11.19.1` in release CI; trusted-publishing minimum `11.5.1` | Public package, global install, `npx`, packing, versioning, and signature audit | npm already provides the `bin` shim, public package registry, immutable versions, dist-tags, pack inspection, publishable lockfile, and OIDC publishing path. Pinning the current npm 11 release in CI avoids relying on whichever npm minor happens to ship with Node 24. |
| npm trusted publishing | Current GitHub Actions OIDC contract | Authenticate `npm publish` without a stored npm token | npm binds a package to an exact GitHub owner/repository/workflow/environment and exchanges GitHub's short-lived identity token at publish time. It directly satisfies the no-long-lived-token requirement. |
| npm automatic provenance | Built into trusted publishing | Attach verifiable build provenance to the public tarball | For a public package built from a public repository on GitHub-hosted Actions, trusted publishing generates provenance automatically. No Sigstore dependency, signing script, or `--provenance` flag is needed. |
| GitHub Actions | `actions/checkout@v6`, `actions/setup-node@v6`, GitHub-hosted `macos-15` | Release-triggered build, artifact checks, pack, and publish | These are the current versions in npm's trusted-publishing example. `macos-15` is a current GitHub-hosted arm64 runner and preserves Cumpa's existing Darwin-arm64 native addon; the existing Ubuntu production workflow would omit it. |
| GitHub Releases | `release.published` event | Maintainer-controlled, tagged publication boundary | The event checks out the tagged release commit. A stable-only guard prevents a GitHub prerelease from accidentally replacing npm's `latest` tag. |
| ShipWithAI skills marketplace | Existing `Ship-With-AI/skills` repository and plugin | Public skill discovery and installation | The repository already exposes `skills/<name>/SKILL.md`, an Agent Skills-compatible catalog, and one bundled Claude plugin. Cumpa is one more skill, not a new marketplace. |
| Vercel Skills CLI | `skills@1.5.23` verified current | One-command cross-agent skill install | The established ShipWithAI README already uses this installer. `--skill`, `--global`, `--agent`, and `--yes` cover interactive documentation and deterministic smoke verification without changing Cumpa. |
| Agent Skills specification | Current specification | Portable `SKILL.md` metadata contract | Cumpa's existing `name: cumpa` and matching directory already satisfy the required convention. The standard `compatibility` field is the correct place to expose Node, Git, and CLI prerequisites. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | Public distribution | Do not add a runtime or development library for package publication, provenance, release versioning, or skill installation. npm, GitHub Actions, and the existing marketplace already provide the required behavior. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `npm pack --dry-run --json --ignore-scripts` | Inspect the exact public file inventory | Keep using this inside `scripts/verify-production-artifacts.mjs`. The `files` allowlist plus pack inspection is the authoritative payload boundary. |
| `npm pack --json --ignore-scripts` | Produce the release tarball without rerunning `prepack` | Cumpa's `prepack` runs a build. Packing with scripts disabled after the explicitly configured release build prevents an unconfigured second build from replacing `dist/bin/cumpa.mjs`. |
| `npm publish <tarball> --ignore-scripts --access public` | Publish the already packed artifact through OIDC | Publish the tarball generated in the same job, not the working directory. Do not set `NODE_AUTH_TOKEN` or `NPM_TOKEN`. Trusted publishing supplies short-lived credentials. |
| `npm shrinkwrap` | Create the publishable dependency lock for this globally installed CLI | npm explicitly recommends `npm-shrinkwrap.json` for command-line tools intended as global installs. Run it after setting the release package name/version; use it in place of, not beside, `package-lock.json`. |
| `npm version` | Update SemVer metadata and create the release tag | For this single-package repository, native versioning is sufficient. Its default commit/tag behavior is useful once the occupied-name decision is settled. |
| `npm audit signatures` | Verify registry signatures and provenance attestations | Run against a clean installed-project lockfile after publication with a current npm CLI. Also inspect `npm view cumpa@<version> dist.attestations`. |
| `npx skills@1.5.23 add` | Install and smoke-test the marketplace skill | Pin the release-time smoke command for repeatability; user-facing documentation may use unpinned `npx skills add` to follow the marketplace's established convention. |

## Required Package Changes

### `package.json`

| Current integration point | Required change | Why |
|---------------------------|-----------------|-----|
| `name: "cumpa"` | Keep only after transfer is complete. | The exact bare name is what makes both required commands work. Publishing a scoped package silently changes the contract. |
| `version: "0.0.0"` | Set the agreed unused release SemVer and require tag `v<package.version>`. | npm permanently reserves every published `name@version`, even after unpublish. Version/tag equality prevents publishing the wrong commit. |
| `private: true` | Remove. | npm refuses publication of private packages. |
| `type: "module"` | Keep unchanged. | Matches the shipped Node 24 ESM application. |
| `engines.node: ">=24"` | Keep unchanged and document it prominently. | Matches the tested runtime. npm's engine field is advisory unless users enable strict engine enforcement, so the CLI should retain its clear unsupported-runtime failure behavior. |
| `bin.cumpa: "dist/bin/cumpa.mjs"` | Keep unchanged. | A single bin whose name matches the package lets npm create a global PATH shim and lets `npx cumpa` infer the executable. `scripts/build-bin.mjs` already writes the required `#!/usr/bin/env node` shebang and executable mode. |
| `files` | Reduce to `dist/` for the public package. | README, license, `package.json`, and bin targets are automatically included. The skill should be installed from the established marketplace; shipping `.kimi-code/skills/cumpa/` inside the npm tarball creates a redundant, non-discoverable copy. |
| Missing repository metadata | Add the exact public source object: `{ "type": "git", "url": "git+https://github.com/Ship-With-AI/cumpa.git" }`. | npm provenance matches this value case-sensitively to the public source repository. |
| Missing project links | Add `homepage: "https://github.com/Ship-With-AI/cumpa#readme"` and `bugs.url: "https://github.com/Ship-With-AI/cumpa/issues"`. | Provides trustworthy registry navigation and issue reporting. |
| Missing license | Add the maintainer-approved SPDX identifier and matching root license file. | Public source visibility is not a license. npm packages should state the actual reuse terms. |
| Description/keywords | Replace development-era copy with public CLI language and a small set of useful keywords such as `git`, `code-review`, `local-first`, and `cli`. | Registry users must be able to distinguish Cumpa from the package's former function-composition identity. This is discovery metadata, not search-engine machinery. |
| Missing `publishConfig` | Add `{ "access": "public", "registry": "https://registry.npmjs.org/" }`. | Locks the package to the intended public registry/access even if a maintainer's local npm configuration differs. |
| `prepack: "npm run build"` | Keep for ordinary local packing, but do not invoke it in the release publish path. | The release must build with `CUMPA_RELEASE_SUPPORT_SERVICE_URL`; an implicit second prepack build without that value can erase the configured launcher. |
| `package-lock.json` | Convert to `npm-shrinkwrap.json` after the final package name/version is set. | A normal package lock is not published; shrinkwrap is npm's native publishable lock for global CLIs and makes installed transitive dependencies match the release. |

Do not add `main` or `exports`: Cumpa is a CLI, not a supported importable library. Do not add `preferGlobal`, a postinstall script, or an agent-directory installer.

### Existing build and artifact integration

| File | Required treatment |
|------|--------------------|
| `scripts/build-bin.mjs` | Reuse unchanged. The workflow must supply the canonical public support origin through `CUMPA_RELEASE_SUPPORT_SERVICE_URL` only during the explicit release build. |
| `scripts/build-native-addon.mjs` | Reuse unchanged and build on GitHub-hosted arm64 macOS. It intentionally emits `dist/native/directory_exchange.node` only for `darwin/arm64`; publishing from Ubuntu would omit an existing capability from every installed package. |
| `scripts/verify-production-artifacts.mjs` | Reuse as the pre-pack inventory/content gate with the existing `--expected-support-origin` and `--require-configured-launcher dist/bin/cumpa.mjs` arguments. Do not mutate files between this scan and the final `npm pack --ignore-scripts`. |
| `.github/workflows/deploy-supabase-production.yml` | Leave responsible for main-branch Supabase deployment. Do not couple registry publication to this Ubuntu workflow or give it npm identity. |
| `README.md` | Replace local-development installation as the primary path with prerequisites, `npm install --global cumpa`, `npx cumpa`, upgrade/uninstall guidance, public repository/license links, and the one-command skill install. Retain source-build instructions as contributor documentation. |
| `.kimi-code/skills/cumpa/SKILL.md` | Keep as Cumpa's reviewed source copy, update installation/prerequisite language, and publish the same behavior in the ShipWithAI marketplace. Exclude it from the npm payload. |

## Trusted Publishing Contract

Create one dedicated `.github/workflows/publish-npm.yml`.

### npm package settings

After the package transfer, configure one GitHub Actions trusted publisher with exact, case-sensitive values:

| npm field | Value |
|-----------|-------|
| Organization or user | `Ship-With-AI` |
| Repository | `cumpa` |
| Workflow filename | `publish-npm.yml` — filename only, not `.github/workflows/publish-npm.yml` |
| GitHub environment | `npm` if the recommended protected environment is used |
| Allowed operation | Direct `npm publish` |

Create a protected `npm` GitHub environment containing only the public release configuration needed by the build, including `SUPABASE_PROJECT_REF` as a variable. Bind the trusted publisher to that exact environment. This avoids exposing the broader `production` deployment environment to a registry job.

Once the first OIDC publication succeeds, set npm package publishing access to **Require two-factor authentication and disallow tokens**, as npm recommends. Do not create or retain an automation token for this workflow. Human package transfer and settings changes may use an interactive npm session/OTP; that is not a CI credential.

### Workflow shape

```yaml
name: Publish npm package

on:
  release:
    types: [published]

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    if: ${{ !github.event.release.prerelease }}
    runs-on: macos-15
    environment: npm
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          registry-url: https://registry.npmjs.org
          package-manager-cache: false
      # Pin/verify npm 11.19.1, npm ci, validate tag/version,
      # derive the canonical support origin, build once, scan,
      # pack with --ignore-scripts, then publish that .tgz with
      # --ignore-scripts and --access public.
```

Required workflow invariants:

1. The GitHub release is not a prerelease. `release: published` fires for both stable releases and published prereleases.
2. `github.event.release.tag_name` equals `v${package.json.version}` before any irreversible action.
3. The checkout is the release tag commit, not mutable `main`.
4. npm is at least `11.5.1`; pin `11.19.1` for this Node 24 release workflow.
5. The job runs on a GitHub-hosted runner. npm trusted publishing does not support self-hosted runners.
6. The runner is arm64 macOS (`macos-15` currently), so the existing native addon is included.
7. `CUMPA_RELEASE_SUPPORT_SERVICE_URL` is derived from the protected public project-ref variable, is present only for the explicit build, and passes the existing artifact scanner.
8. The working tree is not rebuilt or mutated between artifact scan and `npm pack --ignore-scripts`.
9. `npm publish` receives the generated `.tgz`, uses `--ignore-scripts --access public`, and has no `NODE_AUTH_TOKEN`/`NPM_TOKEN`.
10. Publication remains on the default `latest` dist-tag only for stable releases.

Automatic provenance is part of this workflow, not another step. Do **not** add `--provenance`; npm's current trusted-publishing path generates it automatically for a public package from a public repository. `package.json.repository` must exactly match the public GitHub repository.

## Release and Version Mechanics

Use the shortest native release process:

1. Confirm the transferred package has the ShipWithAI maintainer/trusted publisher and the chosen license is committed.
2. Set the next unused SemVer with `npm version <version>` so package metadata, publishable lockfile, commit, and `v<version>` tag remain aligned.
3. Push the tag and publish a stable GitHub Release from it.
4. Let `publish-npm.yml` build and publish once.
5. Verify the registry artifact, provenance, global command, npx command, and marketplace skill from clean temporary locations.

The first Cumpa version cannot be selected from the internal milestone label. If the current owner approves repurposing the unscoped package, `3.0.0` is recommended over `1.5.0`: it is unused, follows the unrelated package's public `2.0.1`, and clearly marks an incompatible product/API change. Record that decision in release notes so existing registry users are not surprised.

No release manager is justified for one package. Add Changesets, release-please, or semantic-release only if Cumpa later becomes a multi-package repository or maintainers explicitly choose automated changelog/version policy.

## ShipWithAI Marketplace Integration

The target repository already has the required catalog structure:

- `.claude-plugin/marketplace.json` contains one `ship-with-ai` plugin with source `./`.
- `.claude-plugin/plugin.json` points `skills` to `./skills/` and is currently version `0.2.0`.
- Skills live at `skills/<name>/SKILL.md`.
- Its README already documents `npx skills add Ship-With-AI/skills --skill <name>`.

Required marketplace changes are therefore small:

1. Add `Ship-With-AI/skills/skills/cumpa/SKILL.md` using the existing Cumpa skill content.
2. Preserve `name: cumpa`; the directory and name already comply with the Agent Skills lowercase/hyphen/max-64 contract.
3. Add a quoted `compatibility` value under the specification's 500-character limit, for example: `Requires Node.js 24+, Git 2.43+, and the public cumpa CLI in PATH (install with npm install --global cumpa).`
4. Update the skill's setup step to link to Cumpa's public npm/README instructions while retaining its existing review-request/export contract. The skill must fail clearly when `cumpa` is absent; it should not install software silently.
5. Add Cumpa to the marketplace README's skill list with the exact one-command install and a link to the public repository.
6. Bump `.claude-plugin/plugin.json` from `0.2.0` to `0.3.0` so Claude marketplace users receive the newly bundled skill.

Do not add another entry to `marketplace.json`: its existing plugin already exposes every directory under `skills/`. Do not publish the skill as a second npm package or add an installer to Cumpa.

## Installation

### Public user paths

```bash
# Persistent CLI command
npm install --global cumpa
cumpa

# Ephemeral npm execution; npm may prompt before first cache install
npx cumpa

# One-command global agent-skill installation through the established marketplace
npx skills add Ship-With-AI/skills --skill cumpa -g
```

A scoped fallback would instead require `npm install --global @ship-with-ai/cumpa` and `npx @ship-with-ai/cumpa`; it must not be presented as satisfying the requested bare commands.

### Post-release verification against public artifacts

```bash
# Exact package version, isolated global prefix
npm install --global cumpa@<version> --prefix <temporary-prefix>
<temporary-prefix>/bin/cumpa --help

# Exact registry version without relying on a prior local build
npx --yes cumpa@<version> --help

# Confirm the stable dist-tag also resolves to Cumpa
npx --yes cumpa --help

# Inspect provenance metadata
npm view cumpa@<version> dist.attestations --json

# Deterministic marketplace install into an isolated home/agent target
npx skills@1.5.23 add Ship-With-AI/skills --skill cumpa -g -a <agent> -y
```

Also create a temporary project, install `cumpa@<version>`, and run `npm audit signatures` with the current npm CLI. The final smoke must use the registry version and public marketplace repository; testing the workspace or local tarball alone does not prove distribution.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Transfer the bare `cumpa` package | Publish `@ship-with-ai/cumpa` | Use only if transfer fails **and** product explicitly changes the required install/npx commands. It cannot satisfy `npm install -g cumpa` or `npx cumpa`. |
| Direct trusted `npm publish` on stable GitHub Release | npm staged publishing | Use if maintainers want a separate npm-side approval after GitHub Release publication. It improves separation of duties but adds an approval stage and changes the one-release action flow. |
| Dedicated `publish-npm.yml` | Extend `deploy-supabase-production.yml` | Couple them only if every npm release must be inseparable from every main-branch production deployment. Today their triggers, runners, permissions, and failure domains differ. |
| `macos-15` build/publish job | Ubuntu publish job | Use Ubuntu only after native addon production is redesigned into separately built platform packages or prebuilt optional dependencies. Current Ubuntu builds omit the Darwin-arm64 addon. |
| Native `npm version` and GitHub Release | Changesets / semantic-release / release-please | Use a release framework when multiple packages or automated version/changelog policy create repeated coordination cost. One package does not justify it. |
| Existing ShipWithAI plugin plus `skills/cumpa` | New Cumpa-only plugin/catalog | Create a separate plugin only if Claude users must install Cumpa independently of the existing bundled ShipWithAI plugin and the product accepts a second marketplace surface. |
| Vercel Skills CLI one-command install | Claude-native marketplace registration plus plugin install | Keep the Claude-native path as secondary documentation. It requires marketplace registration and installs the bundled plugin, so it is not the requested one-step individual-skill path. |
| Publishable `npm-shrinkwrap.json` | Publish with only `package-lock.json` | Omit shrinkwrap only if Cumpa intentionally accepts transitive dependency drift for global installs. npm does not publish normal package locks. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or a classic/granular automation token in Actions | Violates the milestone's no-long-lived-token requirement and adds a rotation/exfiltration secret. | npm trusted publishing with `id-token: write`. |
| Self-hosted release runner | Unsupported by npm trusted publishing and weakens hosted provenance guarantees. | GitHub-hosted `macos-15`. |
| `npm publish` from the working directory after a configured build | Invokes `prepack`, which can rebuild without the protected support origin and change the artifact. | Explicit configured build, scan, `npm pack --ignore-scripts`, then publish the `.tgz` with scripts disabled. |
| `npm publish --provenance` or Sigstore packages | Redundant with current trusted publishing; extra flags/dependencies create a second convention. | Automatic provenance from npm trusted publishing. |
| Standalone legacy `npx` package | Deprecated since npm 7 and unnecessary. | The `npx` shipped with npm 11. |
| Package postinstall/native compilation | Users may lack compilers, it makes install nondeterministic, and current Cumpa already has a release-built optional addon. | Build the addon in the hosted arm64 macOS release job and ship it in `dist/`. |
| Agent-directory mutation from the Cumpa CLI | Couples the product to many agent-specific filesystem layouts and duplicates marketplace tooling. | `npx skills add Ship-With-AI/skills --skill cumpa -g`. |
| A second skill copy inside the npm `files` allowlist | It is not automatically discovered there and will drift from the marketplace copy. | Marketplace repository as the public installation surface; Cumpa repository copy as reviewed source. |
| Publishing before license and repository-visibility decisions | A public GitHub repository without a license grants no general reuse rights; private source cannot receive public npm provenance. | Resolve license, audit history, make source public, then publish. |
| Reusing npm `1.5.0` merely because the milestone is v1.5 | Product milestone and registry SemVer are different, and the registry name already has unrelated 2.x history. | An explicitly approved unused registry version; recommend `3.0.0` after transfer. |

## Stack Patterns by Variant

**If the bare package transfer succeeds:**
- Keep package/bin name `cumpa`.
- Publish the next approved unused version through the OIDC workflow.
- Verify both `npm install --global cumpa` and `npx cumpa` against `latest`.

**If the transfer fails:**
- Stop the bare-name publication track and escalate a product-contract decision.
- A scoped package is technically viable but changes both promised install commands; do not silently substitute it.

**If stable releases only are in scope:**
- Keep the `release.published` trigger plus `prerelease == false` guard.
- Publish to `latest` and avoid prerelease dist-tag policy entirely.

**If prerelease publication is later required:**
- Map it explicitly to a non-`latest` dist-tag such as `next` and include prerelease SemVer/tag verification.
- Do not let a GitHub prerelease update `latest` accidentally.

**If npm-side approval becomes mandatory:**
- Change the trusted publisher permission to stage-only and use `npm stage publish` plus npm approval.
- Keep OIDC; do not reintroduce a token.

## Version Compatibility

| Component | Compatible With | Notes |
|-----------|-----------------|-------|
| Cumpa package `engines.node >=24` | Node.js `24.x` LTS | Preserve the existing runtime floor. Node 24 also satisfies all distribution-tool minimums below. |
| npm trusted publishing | npm CLI `>=11.5.1`, Node `>=22.14.0` | Pin npm `11.19.1` in the Node 24 release job rather than trusting a bundled minor. |
| GitHub trusted publisher | GitHub-hosted runner only | Self-hosted Actions runners are unsupported. Workflow filename, owner/repository casing, and optional environment name must match npm settings exactly. |
| Cumpa native addon build | `darwin/arm64`; GitHub `macos-15` runner | The current script emits no addon on Linux, Windows, or Intel macOS. JavaScript fallback remains available there. |
| Automatic npm provenance | Public npm package + public GitHub repository + exact repository metadata | No provenance is generated while `Ship-With-AI/cumpa` remains private. |
| `npx cumpa` | npm 11 single matching `bin` inference | First uncached execution may prompt; use `--yes` in automation. |
| `skills@1.5.23` | Node `>=22.20.0` | Cumpa's Node 24 prerequisite is sufficient. |
| Cumpa skill | Agent Skills `SKILL.md` contract | Directory `cumpa` must match `name: cumpa`; `compatibility` is optional, max 500 characters. |
| Claude bundled marketplace plugin | Existing plugin version `0.2.0` → recommended `0.3.0` | Claude marketplace updates require a version bump when a plugin version is declared. No new plugin entry is necessary. |
| Cumpa runtime | Git `>=2.43` | npm cannot enforce external executable versions; document it in README and skill compatibility. |

## Roadmap Implications

Order matters:

1. **Namespace/license/public-readiness gate:** negotiate npm transfer, approve package version and license, audit repository history, and make the repository public.
2. **Package contract:** update metadata, public README, `files`, and publishable shrinkwrap while preserving the existing build/bin behavior.
3. **Release automation:** configure the protected environment and npm trusted publisher, then add the separate OIDC workflow and stable release/tag guards.
4. **Marketplace publication:** land `skills/cumpa/SKILL.md`, compatibility metadata, README listing, and plugin version bump in `Ship-With-AI/skills`.
5. **Public-artifact verification:** release once and verify registry metadata/provenance, isolated global install, exact/unqualified npx execution, and deterministic skill installation.

The first gate is not parallelizable with publication: until ownership transfer and repository visibility are resolved, the promised bare npm commands and automatic provenance cannot exist.

## Sources

### npm — primary/official

- [Trusted publishers](https://docs.npmjs.com/trusted-publishers) — npm/Node minimums; hosted-runner requirement; exact GitHub binding; OIDC permissions; automatic provenance; post-migration token policy.
- [Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements) — public package/repository requirement; exact repository metadata; verification guidance.
- [package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json) — `name`, SemVer, `bin`, `files`, `repository`, `engines`, license, and `publishConfig` behavior.
- [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish) — immutable `name@version`, public access, `latest`, and pack inspection.
- [npm version](https://docs.npmjs.com/cli/v11/commands/npm-version) — package/lock updates and default version commit/tag behavior.
- [npx](https://docs.npmjs.com/cli/v11/commands/npx) — cache installation, prompt behavior, and single-bin inference.
- [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json) — publishable lockfile explicitly recommended for globally installed command-line tools.
- [Lifecycle scripts](https://docs.npmjs.com/cli/v11/using-npm/scripts#life-cycle-operation-order) — `prepack` execution during pack/publish and why the configured artifact must avoid an implicit rebuild.
- [Transferring a package](https://docs.npmjs.com/transferring-a-package-from-a-user-account-to-another-user-account) — supported ownership-transfer process.
- [Live `cumpa` registry metadata](https://registry.npmjs.org/cumpa/latest) — unrelated current package `2.0.1`; corroborated with `npm view cumpa ... --json` on the research date.
- [Live `skills` registry metadata](https://registry.npmjs.org/skills/latest) — `skills@1.5.23`, Node `>=22.20.0`.

### GitHub and Node.js — primary/official

- [Events that trigger workflows: release](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#release) — `published` behavior, tag ref, and prerelease inclusion.
- [GitHub-hosted runners reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners) — current public-repository runner labels and `macos-15` arm64 architecture.
- [Node.js releases](https://nodejs.org/en/about/previous-releases) — supported LTS release policy and Node 24 line.
- [Ship-With-AI/cumpa](https://github.com/Ship-With-AI/cumpa) — authenticated repository query reported `PRIVATE` on the research date.

### Skills marketplace — primary/official project sources

- [ShipWithAI skills marketplace](https://github.com/Ship-With-AI/skills) — current repository structure, marketplace/plugin manifests, README install convention, and MIT repository license.
- [Vercel Skills CLI](https://github.com/vercel-labs/skills) — `add`, `--skill`, `--global`, `--agent`, and `--yes` contract.
- [Agent Skills specification](https://agentskills.io/specification) — required frontmatter, directory/name matching, naming limits, and compatibility metadata.
- [Claude Code plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) — marketplace/plugin manifest contract and version-bump behavior.

---
*Stack research for: Cumpa v1.5 Public Distribution*
*Researched: 2026-09-04*
