# Stack Research

**Domain:** GPL source publication and trusted distribution for an existing Node.js CLI
**Researched:** 2026-09-04
**Confidence:** MEDIUM — current npm, GitHub, SPDX, GNU, Vite, Node, and Monaco primary sources were cross-checked against this repository. The remaining unknowns are maintainer-controlled legal authority, npm organization access, and the one-time first-package bootstrap.

## Scope

This document covers only Cumpa v1.5 public-source, licensing, packaging, and release tooling. It does not reconsider the validated Node 24, TypeScript, Fastify, Vue, Monaco, Git, persistence, review, export, or voluntary-support design.

Labels used below:

- **Verified fact** — stated by a cited primary source or directly observed in the current repository/registry.
- **Recommendation** — the minimum project-specific change inferred from those facts.

## Executive Recommendation

Keep the application stack. Add no release framework and no licensing dependency. Use:

1. the existing `Ship-With-AI/cumpa` GitHub repository, changed from private to public so its complete existing history remains in place;
2. a root GPL-3.0-or-later license plus an explicit nested MIT boundary for the thin skill;
3. npm's native package metadata, packlist, shrinkwrap, tarball publishing, OIDC trusted publishing, and automatic provenance;
4. one dedicated GitHub-hosted release workflow using current official actions and the preinstalled `gh` CLI;
5. Vite 8's built-in `build.license` output plus Monaco's existing `ThirdPartyNotices.txt`; and
6. the existing artifact scanner, extended rather than replaced, to make one inspected `.tgz` the npm artifact and GitHub release asset.

## Verified Current Baseline

| Area | Verified fact | Consequence |
|------|---------------|-------------|
| Source repository | `.git/config` points at `git@github.com:Ship-With-AI/cumpa.git`. Git history currently reports one commit-author identity. | Change this repository's visibility; do not create a new public snapshot, squash, or rewrite history merely to publish it. Maintainers must still confirm copyright authority before relicensing. |
| npm target | `https://registry.npmjs.org/@shipwithai%2Fcumpa` returns `404` on the research date. | `@shipwithai/cumpa` is not yet an existing npm package, so documented trusted-publisher setup cannot be the first-ever registry operation. See **First-publication bootstrap**. |
| Package manifest | `package.json` is `name: "cumpa"`, `version: "0.0.0"`, `private: true`, has no `license`, repository, bugs, homepage, or `publishConfig`, and exposes `bin.cumpa` from `dist/bin/cumpa.mjs`. | Convert metadata to `@shipwithai/cumpa@1.5.0`, remove `private`, add the public-source/license fields, and preserve the existing bin/runtime contract. |
| Packed files | The current allowlist is `dist/` plus `.kimi-code/skills/cumpa/`. npm always includes `package.json`, README, LICENSE, and bin targets even with an allowlist. | Publish only `dist/` as application payload; keep the MIT skill as a separately licensed marketplace artifact, not a second copy inside the GPL npm package. |
| Release build | `prepack` runs the full build. The production workflow instead builds with the configured Supabase origin, scans it, then uses `npm pack --ignore-scripts`. | Preserve the explicit build → scan → pack ordering. Publish the resulting tarball, not the working directory, so `prepack` cannot produce a different unconfigured build. |
| Existing release workflow | `.github/workflows/deploy-supabase-production.yml` deploys on `main`, uses Ubuntu, and has no npm OIDC permission. | Leave Supabase deployment separate. Add a release workflow with a narrower trigger and npm identity. |
| Browser assets | Vite bundles Vue and Monaco into `dist/web`. No standalone font, image, icon, Wasm, or checked-in native binary asset exists. | Generate notices for code actually bundled into the browser; do not invent an asset pipeline. |
| Monaco notices | `monaco-editor@0.55.1` declares MIT and ships both `LICENSE` and a separate 448-line `ThirdPartyNotices.txt`. | Vite's package-license generation does not replace Monaco's own nested third-party notice; copy that file verbatim into the browser distribution. |
| Native addon | `src/native/directory-exchange.cc` is repository-authored Node-API C++; `scripts/build-native-addon.mjs` emits `dist/native/directory_exchange.node` only on Darwin arm64 and otherwise removes it. Loading failure is already treated as unsupported. | Use a GitHub-hosted arm64 macOS release runner if retaining that optimized asset in the package. Do not add consumer-side compilation or prebuild dependencies. |

## Recommended Stack

### Core Technologies

| Technology | Version / capability | Purpose | Why Recommended |
|------------|----------------------|---------|-----------------|
| Node.js | `24.20.0` current Node 24 LTS release; package engine stays `>=24` | Existing build/runtime and release runner | Node 24.20.0 bundles npm 11.19.0, above both trusted-publish and trust-management minimums. No runtime change is required. |
| npm registry and CLI | npm `11.19.0` from Node 24.20.0; trusted publishing requires `>=11.5.1`; `npm trust` requires `>=11.15.0` | Scoped public package, bin installation, packing, shrinkwrap, publishing, and registry metadata | These native capabilities cover the whole package lifecycle without another release dependency. |
| npm trusted publishing | GitHub Actions OIDC | Publish `@shipwithai/cumpa@1.5.0` without a stored npm token | npm binds the package to an exact GitHub owner/repository/workflow/environment and exchanges the workflow OIDC token for a short-lived publish credential. |
| npm automatic provenance | Enabled automatically for trusted publication of a public package from a public GitHub repository | Registry build/source attestation | No `--provenance`, Sigstore client, or GitHub attestation action is needed for npm provenance. |
| GitHub Actions | `actions/checkout@v6`, `actions/setup-node@v6`, GitHub-hosted `macos-15` | Build, scan, pack, publish, and create the GitHub release | These are the action majors in npm's current trusted-publishing example. `macos-15` is a standard public-repository arm64 runner and preserves Cumpa's existing Darwin-arm64 addon. |
| GitHub Releases | Tag-based release, immutable releases enabled | Human-visible v1.5.0 record and exact `.tgz` asset | Immutable releases lock the tag and assets and automatically create a GitHub release attestation. |
| Vite | Existing `8.1.4`; `build.license` | Generate bundled-browser dependency license text | Vite 8 can emit Markdown or JSON containing all bundled dependencies and their license text. It removes the need for a license-checker package. |
| SPDX | `GPL-3.0-or-later` | Unambiguous application license identifier | This is the SPDX identifier for GPLv3 or any later version; `GPL-3.0-only` would contradict the milestone. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | Distribution and licensing | npm, Vite, Node, GitHub Actions, and `gh` already provide every required capability. |

### Development and Platform Tools

| Tool | Purpose | Minimum project-specific use |
|------|---------|------------------------------|
| `npm shrinkwrap` | Produce publishable `npm-shrinkwrap.json` for the globally installed CLI | Generate after final package name/version are set. npm explicitly recommends shrinkwrap for command-line applications installed globally; do not publish both it and a divergent lockfile. |
| `npm pack --json --ignore-scripts` | Produce and report the exact publishable tarball | Run only after the configured build and artifact scan. Retain its filename/integrity in workflow state and do not rebuild afterward. |
| `npm publish ./<file>.tgz --access public` | Publish the already inspected bytes | Use through OIDC with no `NPM_TOKEN` or `NODE_AUTH_TOKEN`. Trusted publishing supplies provenance automatically. |
| `npm trust github` or npm package settings | Bind package to the release workflow | Exact binding: GitHub owner `Ship-With-AI`, repository `cumpa`, workflow filename only (recommended `publish-npm.yml`), protected environment `npm`, and permission for direct `npm publish`. |
| Existing `scripts/verify-production-artifacts.mjs` | Enforce package inventory, configured launcher, and absence of protected values | Extend this scanner for package name/version/license/source/notices and forbidden paths. Do not introduce a parallel publication validator. |
| Vite `build.license` | Emit `dist/web/third-party-licenses.md` | Configure a stable filename under `dist/` so the existing package allowlist includes it automatically. |
| Node `fs.copyFile` in the existing build path | Copy Monaco's `ThirdPartyNotices.txt` verbatim | Add the smallest build step needed to place a stable notice file under `dist/web/`; verify it against locked `monaco-editor@0.55.1`. |
| `gh release create --verify-tag` | Create a release from an already-pushed `v1.5.0` tag and attach the exact `.tgz` | GitHub CLI creates a draft, uploads assets, then publishes; with immutable releases enabled, the tag and asset lock at publication. No release action is needed. |
| GitHub environment `npm` | Approval and tag/deployment protection | Bind the job and npm trusted-publisher record to this exact environment. Store only non-secret release configuration such as the canonical support project reference; do not expose the broader Supabase deployment environment. |
| `npm install --global` and `npx --yes` | Real post-publication installation smoke paths | Run from a clean job with exact `@shipwithai/cumpa@1.5.0`; exercise the installed `cumpa --help` or other bounded non-browser command. |

## Minimum Repository and Package Changes

### 1. License boundary

**Verified facts**

- A public GitHub repository is visible source, not permission to copy or modify it.
- SPDX identifies the requested license as `GPL-3.0-or-later`.
- GPL section 6 permits object code to be distributed while Corresponding Source is offered from a network server, including a different server, if equivalent access and clear directions are provided next to the object distribution.
- The MIT license requires its copyright and permission notice to remain with copies or substantial portions.

**Recommendations**

1. Add root `LICENSE` containing the unmodified GPLv3 text and use `license: "GPL-3.0-or-later"` in `package.json`.
2. Add a concise root README license/source section stating that the Cumpa application and complete published repository history are offered under GPL-3.0-or-later, identifying the maintainer-confirmed copyright holder, and pointing package version `1.5.0` to public tag `v1.5.0` as Corresponding Source.
3. Put a complete MIT license and copyright notice inside the thin skill directory/listing. State the exception in the root README so the nested skill is not accidentally presented as GPL.
4. Exclude `.kimi-code/skills/cumpa/` from the npm `files` array. The npm package then has one clear GPL license, while the public marketplace copy retains MIT.
5. Do not rewrite every historical commit to add license files. Publish the current licensing declaration from the existing repository and preserve the complete graph. Rewrite only if a pre-publication secret/rights problem makes publication unsafe, and record that this conflicts with a literal unchanged-history goal.
6. Confirm rights before release. A single Git author identity is useful evidence, not a legal proof of ownership or permission for copied/vendor material.

### 2. `package.json`

Apply this public package contract while retaining current dependencies, scripts, ESM type, Node engine, and bin target:

| Field | Required value/treatment | Reason |
|-------|--------------------------|--------|
| `name` | `@shipwithai/cumpa` | Exact requested registry scope/name. |
| `version` | `1.5.0` | Exact requested release; require Git tag `v1.5.0`. |
| `private` | Remove | `private: true` blocks publication. |
| `license` | `GPL-3.0-or-later` | Exact SPDX expression requested. |
| `repository` | `{ "type": "git", "url": "git+https://github.com/Ship-With-AI/cumpa.git" }` | npm trusted publishing requires `repository.url` to match the GitHub repository exactly. |
| `homepage` | `https://github.com/Ship-With-AI/cumpa#readme` | Registry source/documentation navigation. |
| `bugs.url` | `https://github.com/Ship-With-AI/cumpa/issues` | Public issue route. |
| `publishConfig` | `{ "access": "public", "registry": "https://registry.npmjs.org/" }` | Makes scoped public intent and registry explicit regardless of local npm config. |
| `files` | `["dist/"]` | Generated runtime only; npm adds package.json, README, LICENSE, and bin automatically. Third-party notices live under `dist/`. |
| `bin.cumpa` | Keep `dist/bin/cumpa.mjs` | npm creates the global `cumpa` shim and infers the single executable for `npx @shipwithai/cumpa`. |
| `engines.node` | Keep `>=24` | Existing supported runtime and above OIDC tooling floors. |
| `description` | Replace development copy with accurate public CLI wording | Registry users should see the actual product contract. |

Do not add `main`, `exports`, or `types`: Cumpa exposes a CLI, not a supported import API. Do not add `preferGlobal`, a postinstall hook, or install-time native compilation.

### 3. Browser and native notices

**Recommendations**

- Set Vite 8.1.4 `build.license` to a stable Markdown output under `dist/web/`.
- Copy locked Monaco 0.55.1's `ThirdPartyNotices.txt` to `dist/web/monaco-third-party-notices.txt`; do not translate, summarize, or regenerate its contents.
- Extend the existing artifact scanner to require both files in the packed inventory and to fail if the locked Monaco notice source is absent.
- Keep the root GPL `LICENSE` separate from third-party notices. The generated/browser notices describe incorporated dependencies; they do not change Cumpa's GPL license.
- Build the release on GitHub-hosted `macos-15` if the current Darwin-arm64 `.node` optimization is intended in public packages. The C++ file contains project source and only includes standard/POSIX/Node-API headers; no additional vendored native license payload was found.
- Do not add `node-gyp`, `prebuild`, `prebuildify`, or platform-package machinery. The existing addon is optional and its missing/incompatible load already falls back safely. Add multi-platform native packaging only if native exchange becomes a required public contract.

### 4. Public repository and release

**Verified facts**

- GitHub warns that making a private repository public exposes code, Actions history, and Actions logs to everyone and disables existing push rulesets during the visibility change.
- A GitHub Release is based on a Git tag and can carry arbitrary release assets.
- Immutable releases lock their tag and assets after publication and automatically generate a release attestation.

**Recommendations**

1. Review the complete Git history and existing Actions logs/artifacts before changing visibility. Remove unsafe workflow artifacts/logs and rotate any exposed credentials before, not after, the flip.
2. Change the visibility of `Ship-With-AI/cumpa` itself. Do not create a new public repository or push only the current tree; either would fail the complete-history requirement.
3. Re-establish public-repository rulesets/tag protection after the visibility change because GitHub documents that push rulesets are disabled by the transition.
4. Enable immutable releases before publishing v1.5.0.
5. Push a `v1.5.0` tag that identifies the same commit used by the npm workflow. Require `gh release create v1.5.0 <exact-tarball> --verify-tag` so GitHub CLI cannot silently tag mutable default-branch state.
6. Attach the exact `.tgz` passed to `npm publish`, not a second pack. GitHub's autogenerated source archives remain useful but are not a substitute for the npm artifact.

### 5. Trusted-publishing workflow

Create `.github/workflows/publish-npm.yml`; do not add npm identity to the Supabase deployment workflow.

Minimum workflow contract:

```yaml
on:
  push:
    tags: ['v1.5.0']

permissions:
  contents: write
  id-token: write

jobs:
  publish:
    runs-on: macos-15
    environment: npm
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v6
        with:
          node-version: 24.20.0
          registry-url: https://registry.npmjs.org
          package-manager-cache: false
      # npm ci; assert tag/package version; configured build; existing scanner;
      # npm pack once; npm publish that .tgz; clean public install smoke;
      # gh release create --verify-tag with that same .tgz.
```

The complete implementation must preserve these invariants:

- The tag is exactly `v${package.json.version}` and the version is `1.5.0` before irreversible publication.
- The package repository URL, GitHub owner/repository, workflow filename, and environment match npm's trusted-publisher record exactly; these values are case-sensitive.
- The runner is GitHub-hosted. npm does not currently support self-hosted runners for trusted publishing.
- The job receives `id-token: write`; it receives no `NPM_TOKEN` or `NODE_AUTH_TOKEN`.
- The canonical support origin is non-secret release configuration and is supplied to the same existing configured build/scanner path. Ordinary source builds remain unconfigured as already designed.
- The build happens once. The scanned `.tgz` is the bytes passed to `npm publish` and attached to GitHub Release.
- Do not pass `--provenance`. npm trusted publishing automatically emits provenance for a public package from a public repository.
- `contents: write` exists only because this minimal single job creates the GitHub Release. If release creation is later separated, reduce the publish job back to `contents: read`.

## First-Publication Bootstrap

**Verified constraint:** `@shipwithai/cumpa` currently does not exist. npm's current `npm trust` documentation requires that the package already exist and that the caller have package write access. The website flow likewise starts from an existing package's settings. Therefore the documented platform cannot configure OIDC trust before the first-ever package version exists.

**Minimum recommendation:**

1. After the repository is public and the GPL/package contents are correct, publish the actual Cumpa package once as an earlier non-`latest` bootstrap version (the existing `0.0.0` is available) using an authorized maintainer's interactive npm session, 2FA, `--access public`, and a `bootstrap` dist-tag.
2. Immediately configure the GitHub trusted publisher for `publish-npm.yml` and the `npm` environment using npm 11.19.0 or the npm website.
3. Log out/revoke the interactive session; never copy its credential into GitHub.
4. Publish `1.5.0` through GitHub OIDC. After the OIDC release succeeds, set npm publishing access to “Require two-factor authentication and disallow tokens,” as npm recommends.

This preserves the acceptance criterion that `@shipwithai/cumpa@1.5.0` is published through trusted publishing without a long-lived npm automation token. Do not disguise a manual 1.5.0 publish as trusted publication. If npm adds a documented package-reservation/bootstrap path before implementation, prefer it and omit the bootstrap version.

## Public Installation Verification

Use a post-publication job with no checkout and fresh temporary locations so local workspace bins and caches cannot satisfy the checks:

```bash
npm install --global @shipwithai/cumpa@1.5.0 --prefix <temporary-prefix>
<temporary-prefix>/bin/cumpa --help

npm_config_cache=<fresh-cache> npx --yes @shipwithai/cumpa@1.5.0 --help
```

Also verify, using native clients rather than a new test tool:

- registry metadata resolves name `@shipwithai/cumpa`, version `1.5.0`, license `GPL-3.0-or-later`, exact repository URL, public access, tarball integrity, and provenance/attestations;
- the downloaded tarball contains the same inventory/hash as the workflow-packed and GitHub-release asset;
- README and root LICENSE are present, both browser notice files are present, and the MIT skill is absent from the npm tarball; and
- the separately installed marketplace skill contains its MIT license and declares the exact `npm install --global @shipwithai/cumpa@1.5.0` prerequisite.

Do not treat a local `npm pack`, workspace execution, or marketplace source checkout as proof of the real public install paths.

## Installation

No package installation is recommended for the distribution stack.

```bash
# No new dependencies.
# Use the npm CLI bundled with pinned Node 24.20.0,
# Vite 8.1.4 already in devDependencies, and GitHub's preinstalled gh CLI.
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Native npm/GitHub release workflow | Changesets, semantic-release, release-please | Add only when multiple packages or repeated automated changelog/version policy create real coordination cost. One fixed v1.5 release does not. |
| Direct OIDC `npm publish` | npm staged publishing | Use if maintainers explicitly require an additional npm-side human approval. It adds a stage/approve lifecycle; stage approval is interactive and not performed by OIDC. |
| Vite `build.license` + Monaco notice copy | `license-checker`, ORT, ScanCode, custom dependency crawler | Use heavyweight compliance tooling only after dependency volume, multiple ecosystems, or policy reporting outgrows Vite's actual-bundle inventory. |
| Existing repository visibility change | New public mirror or source snapshot | Use a mirror only if the requirement changes from complete authoritative history. It does not satisfy the current goal. |
| Public tag source link for GPL Corresponding Source | Include the whole TypeScript repository in the npm tarball | Include source in npm only if offline source delivery becomes a requirement. GPL permits clear equivalent network access, and the public tagged repository is the preferred modification form. |
| GitHub-hosted `macos-15` | Ubuntu release runner | Use Ubuntu only if the Darwin-arm64 addon is intentionally omitted from the public package or is moved to a separately built optional platform package. |
| One protected `npm` environment | Reuse `production` | Reuse only if maintainers explicitly accept giving the registry job access to the deployment environment. The release needs no Supabase secrets. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Long-lived `NPM_TOKEN` / `NODE_AUTH_TOKEN` in Actions | Violates the milestone and adds credential rotation/exfiltration risk. | OIDC trusted publishing with `id-token: write`. |
| `npm publish --provenance` or `actions/attest-build-provenance` for the npm package | Redundant with npm's automatic trusted-publisher provenance. | Let npm emit registry provenance automatically. GitHub immutable release attestation covers the GitHub Release separately. |
| Self-hosted release runner | Unsupported by npm trusted publishing. | Standard GitHub-hosted runner. |
| Publishing the working directory | Runs lifecycle scripts and can rebuild different bytes after the configured scan. | Pack once with scripts disabled, then publish that `.tgz`. |
| `.npmignore` beside the existing `files` allowlist | Two inclusion conventions are easier to drift and audit incorrectly. | Keep one explicit `files: ["dist/"]` boundary plus npm's mandatory files. |
| General-purpose license-checker dependency | Vite already knows the actual browser bundle; lockfile-wide reports over-report dev/build-only packages and still miss Monaco's nested notice. | Vite `build.license`, explicit Monaco notice copy, and the existing package scanner. |
| REUSE/SPDX header tooling as a release blocker | Per-file header normalization would create broad churn without improving the clear root/nested license boundary required for v1.5. | Root GPL license, root source statement, nested MIT license, and generated bundled notices. Add REUSE later only if contributor volume requires machine-enforced file-level declarations. |
| npm SBOM as a substitute for notices | An SBOM inventories components; it does not itself preserve required license/notice text or decide compatibility. | Generated license text and retained upstream notices. Generate an SBOM later if consumers request it. |
| `node-gyp`, install scripts, or prebuilt-platform packages | Adds nondeterministic consumer compilation and platform-release machinery for an optional capability. | Existing release-built Darwin-arm64 addon and safe fallback. |
| Bundling the MIT skill inside the npm tarball | Creates a duplicate install surface and mixed-license ambiguity under a GPL package manifest. | Publish the skill through ShipWithAI with its own MIT license; link the separate CLI prerequisite. |
| New public repository, shallow mirror, squash, or history rewrite | Loses the complete-history requirement and weakens tag/provenance continuity. | Change visibility of `Ship-With-AI/cumpa` after audit. |
| Extra community/process files as release prerequisites | CONTRIBUTING, governance, CLA, CODEOWNERS, and release bots are not needed to grant the requested rights or install the package. | Add only when actual contributor/project-governance needs appear. |

## Stack Patterns by Variant

**If the native addon must remain in v1.5:**
- Publish from GitHub-hosted `macos-15` arm64.
- Include the resulting `.node` under the existing `dist/native/` path.
- Keep the current graceful fallback for all incompatible systems.

**If the project intentionally omits the optional native addon:**
- Use `ubuntu-latest` and record the omission as an explicit package decision.
- Do not add consumer compilation merely to recreate it.

**If npm enables first-package trusted-publisher reservation before execution:**
- Reserve/configure `@shipwithai/cumpa` using the documented owner flow.
- Skip the interactive `0.0.0` bootstrap and publish only `1.5.0` through OIDC.

**If npm-side approval is required:**
- Configure stage-only trust and use `npm stage publish`.
- Approve interactively with 2FA; OIDC cannot run stage view/approve/reject.

## Version Compatibility

| Component | Compatible With | Notes |
|-----------|-----------------|-------|
| Cumpa `@shipwithai/cumpa@1.5.0` | Node `>=24` | Preserve existing engine floor. |
| Node `24.20.0` | npm `11.19.0` bundled | Verified in Node's release index; satisfies npm trusted publishing `>=11.5.1` and `npm trust` `>=11.15.0`. |
| npm trusted publishing | GitHub-hosted Actions, exact workflow/repository/environment binding | Self-hosted runners unsupported; `npm whoami` does not test OIDC because exchange occurs only during publish/stage publish. |
| Automatic npm provenance | Public npm package + public GitHub repository | No provenance for a private source repository. |
| `actions/checkout@v6` / `actions/setup-node@v6` | Current npm trusted-publishing example | Use in the new release workflow; upgrading unrelated workflows is optional. |
| Vite `8.1.4` | `build.license` Markdown/JSON output | Existing dependency; no plugin required. |
| Monaco `0.55.1` | MIT package license + bundled `ThirdPartyNotices.txt` | Preserve both package-level and nested third-party notices in browser distribution. |
| Native addon | Darwin arm64 Node-API build | Existing code safely reports unsupported if absent or unloadable. |
| GitHub immutable releases | Git tag + uploaded assets | Tag/assets lock only after release publication; title/notes remain editable. |
| npm scoped executable | `bin: { "cumpa": "dist/bin/cumpa.mjs" }` | Global install exposes `cumpa`; `npx @shipwithai/cumpa@1.5.0` can select the package's single bin. |

## Sources

Primary sources (all accessed 2026-09-04):

- [npm trusted publishers](https://docs.npmjs.com/trusted-publishers) — OIDC requirements, exact bindings, hosted-runner limitation, token restrictions, and automatic provenance.
- [npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust) — npm `>=11.15.0`, 2FA/write access, existing-package prerequisite, and GitHub provider flags.
- [npm package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json) — SPDX license, repository/homepage/bugs/bin/files/engines/publishConfig fields and mandatory packed files.
- [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish) — tarball publishing, immutable name/version pairs, packlist parity, public access, and integrity.
- [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json) — publishable lock and recommendation for globally installed command-line tools.
- [Node distribution index](https://nodejs.org/dist/index.json) and [latest Node 24 artifacts](https://nodejs.org/dist/latest-v24.x/) — Node 24.20.0 LTS and bundled npm 11.19.0.
- [Vite build options: `build.license`](https://vite.dev/config/build-options.html#build-license) — native bundled-dependency license generation and output formats.
- [SPDX GPL-3.0-or-later](https://spdx.org/licenses/GPL-3.0-or-later.html) — exact identifier, full license text, and standard application notice.
- [GNU GPL v3 text](https://www.gnu.org/licenses/gpl-3.0-standalone.html) — notice preservation, Corresponding Source, network distribution, and separate aggregate works.
- [GitHub repository visibility](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility) — public exposure of source/Actions history/logs and visibility-change consequences.
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) — tag-based releases, source archives, and uploaded assets.
- [GitHub immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases) — tag/asset locking and automatic release attestation.
- [GitHub environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments) — approval, branch/tag restrictions, secrets, and variables.
- [GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners) — current public-repository `macos-15` arm64 capability.
- [`gh release create`](https://cli.github.com/manual/gh_release_create) — `--verify-tag`, asset upload, draft-before-publication behavior, and immutable-release interaction.
- [Monaco Editor 0.55.1 registry metadata](https://registry.npmjs.org/monaco-editor/0.55.1) — MIT identifier and exact locked version; the installed package's `ThirdPartyNotices.txt` was also inspected directly.

Repository evidence:

- `package.json`
- `.git/config`
- `.github/workflows/deploy-supabase-production.yml`
- `scripts/build-bin.mjs`
- `scripts/build-native-addon.mjs`
- `scripts/verify-production-artifacts.mjs`
- `src/native/directory-exchange.cc`
- `src/server/native-exchange-capability.ts`
- `vite.config.ts`
- `.kimi-code/skills/cumpa/SKILL.md`
- `node_modules/monaco-editor/LICENSE`
- `node_modules/monaco-editor/ThirdPartyNotices.txt`

---
*Stack research for: Cumpa v1.5 Public Distribution*
*Researched: 2026-09-04*
