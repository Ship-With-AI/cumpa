# Stack Research

**Domain:** Proprietary public npm CLI distribution from a private repository, plus independent public agent-skill publication
**Researched:** 2026-09-06
**Confidence:** MEDIUM — current npm, GitHub, Node.js, Claude Code, and Ship With AI primary sources were cross-checked against the repository. The main constraint is explicit and current: npm trusted publishing works from a private GitHub repository, but npm provenance does not.

## Scope

This research covers only Cumpa v1.5 distribution, release metadata, packed-artifact boundaries, trusted publishing, and publication of the existing thin skill. It does not reconsider the validated Node 24, TypeScript, Fastify, Vue, Monaco, Git, review, persistence, export, or voluntary-support design.

## Executive Recommendation

Keep the application stack and add no release library. Use the native mechanisms already present:

1. publish `@shipwithai/cumpa@1.5.0` as a **publicly downloadable, proprietary** scoped npm package;
2. keep `Ship-With-AI/cumpa` private and publish only an allowlisted tarball containing the compiled `dist/` tree, public usage/license documents, and required third-party notices;
3. publish through npm OIDC trusted publishing on a GitHub-hosted runner, with no npm token in GitHub Actions;
4. extend the existing production-artifact verifier to inspect the exact `.tgz` later passed to `npm publish`, including explicit source/source-map denials;
5. publish the existing `.kimi-code/skills/cumpa/SKILL.md` into the public `Ship-With-AI/skills` repository under MIT, while declaring the separately installed CLI as a prerequisite; and
6. preserve voluntary support by using the existing configured release build and scanner rather than adding any payment or hosted-service dependency.

### Hard platform constraint: private repository and npm provenance are incompatible

The milestone can use **npm trusted publishing from the private GitHub repository**. It cannot also receive **npm provenance** while that repository remains private.

npm's current trusted-publisher documentation says automatic provenance requires all three of: OIDC trusted publishing, a public package, and a **public repository**. It explicitly says provenance is unsupported for private repositories even when the package is public. npm provenance publicly links to source and build instructions and records the attestation in a public transparency log, so `--provenance` cannot override this restriction.

Therefore the supported v1.5 stack is:

- private GitHub repository;
- public proprietary npm package;
- OIDC trusted publishing without a long-lived token; and
- registry tarball integrity/signatures, but **no npm provenance attestation**.

If npm provenance is non-negotiable, the milestone must relax the private-publisher-repository constraint and publish from a public repository. A public distribution-only repository would add a second release authority and its provenance would attest that public workflow, not expose or verify the private TypeScript source; it is not recommended for the stated goal. Do not claim that a GitHub artifact attestation, a hand-written checksum, or Sigstore metadata is npm provenance.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@shipwithai/cumpa` | `1.5.0` | Public scoped npm CLI package | The existing single `bin.cumpa` entry supports both a global `cumpa` command and exact-version `npx @shipwithai/cumpa@1.5.0` execution. Public visibility makes the tarball downloadable; proprietary terms govern permission, not technical visibility. |
| Node.js | `24.20.0` for release; package engine remains `>=24` | Existing runtime and release build | `24.20.0` is the current Node 24 LTS distribution and bundles npm `11.19.0`. It preserves Cumpa's validated runtime and exceeds npm's OIDC minimums. |
| npm CLI | `11.19.0` bundled with Node `24.20.0` | Pack, public scoped publish, trusted-publisher management, global install, and npx execution | npm trusted publishing requires npm `>=11.5.1`; `npm trust` requires `>=11.15.0`. The bundled version satisfies both, so no release dependency or npm upgrade step is needed. |
| npm trusted publishing | Current GitHub Actions OIDC support | Short-lived publish authentication | Binds npm to the exact GitHub owner/repository, workflow filename, optional environment, and allowed action. Requires `id-token: write` and a GitHub-hosted runner; stores no `NPM_TOKEN` or `NODE_AUTH_TOKEN`. |
| npm native pack/publish | npm `11.19.0` | Create one auditable `.tgz` and publish those exact bytes | `npm pack --json --ignore-scripts` honors the `files` allowlist and reports the artifact. `npm publish ./<artifact>.tgz --access public --ignore-scripts` accepts the already packed tarball instead of rebuilding the working tree. |
| GitHub Actions | `actions/checkout@v6`, `actions/setup-node@v6` | Private-repository release automation | These are the current action majors in npm's trusted-publishing example. `setup-node` should select Node `24.20.0`, the npm registry, and `package-manager-cache: false`. |
| GitHub-hosted macOS runner | `macos-15` | Build the existing release artifact and retain the optional Darwin-arm64 native addon | GitHub documents `macos-15` as a standard arm64 hosted runner for private repositories. It satisfies npm's hosted-runner restriction and preserves the current `build-native-addon.mjs` behavior without adding consumer-side compilation. |
| Ship With AI skills repository | Public `Ship-With-AI/skills`; plugin `0.2.0` → `0.3.0` | Public MIT distribution of the thin Cumpa skill | The repository already supports cross-agent single-skill installation and a Claude Code marketplace plugin whose manifest points at `./skills/`. Because the manifest pins an explicit version, Claude Code requires a version bump for installed users to receive the new skill; adding a skill is a SemVer minor feature. |
| Claude Code plugin skill discovery | Current plugin format | Native marketplace loading | `skills/<name>/SKILL.md` is auto-discovered. No plugin runtime, hook, MCP server, or npm wrapper is needed. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | Distribution and publication | npm, Node.js, GitHub Actions, the existing build scripts, and the existing Ship With AI marketplace already provide every required mechanism. |

### Existing Project Tools to Reuse

| Existing tool | Current version / path | Distribution integration |
|---------------|------------------------|--------------------------|
| TypeScript | `7.0.2`; `tsconfig.json` | Continue emitting Node runtime JavaScript to `dist/`. Source maps and declarations are currently not enabled. The tarball verifier, rather than a second compiler configuration, should enforce that `.ts`, `.tsx`, `.d.ts`, and `.map` files are absent. |
| Vite | `8.1.4`; `vite.config.ts` | Continue emitting browser assets to `dist/web/`. Vite's `build.sourcemap` default is false; enforce absence of external or inline source maps at the packed-artifact boundary. |
| CLI build script | `scripts/build-bin.mjs` | Continue generating executable `dist/bin/cumpa.mjs` with the configured canonical support origin only for release builds. The npm `bin` map already targets this file. |
| Native addon build | `scripts/build-native-addon.mjs` | Continue producing `dist/native/directory_exchange.node` only on Darwin arm64. Build on hosted `macos-15`; do not add `node-gyp`, install scripts, or platform-package machinery for this optional optimization. |
| Production artifact verifier | `scripts/verify-production-artifacts.mjs` | Extend this verifier to accept and inspect the exact release `.tgz`. Reuse its secret/origin checks, and add package metadata, inventory, source-map, source, test, planning, and skill-boundary assertions. Do not create a parallel release scanner. |
| Third-party notices | `THIRD_PARTY_NOTICES.md` | Include this existing Monaco-derived notice file explicitly in the npm allowlist because browser code is bundled into `dist/web/`. It is separate from Cumpa's proprietary license. |
| Cumpa skill | `.kimi-code/skills/cumpa/SKILL.md` | Publish the same thin workflow into `Ship-With-AI/skills/skills/cumpa/`; do not fork its review protocol or add a second implementation. |

## Required Package Metadata

The current manifest is development-only (`name: "cumpa"`, `version: "0.0.0"`, `private: true`) and includes the skill in `files`. Replace only the publication-facing metadata while retaining the established dependencies, scripts, ESM mode, engine, and bin target.

| `package.json` field | Required v1.5 treatment | Reason |
|----------------------|-------------------------|--------|
| `name` | `@shipwithai/cumpa` | Exact public registry identity. |
| `version` | `1.5.0` | Exact release requested; the release tag must identify the same commit and version. |
| `private` | Remove | npm refuses to publish a manifest with `private: true`; repository privacy is controlled by GitHub, not this package flag. |
| `license` | `SEE LICENSE IN LICENSE` | npm's documented representation for custom terms without an SPDX identifier. A public proprietary CLI should ship explicit permitted-use terms rather than imply open-source rights. |
| `repository` | `{ "type": "git", "url": "git+https://github.com/Ship-With-AI/cumpa.git" }` | npm trusted publishing requires `repository.url` to match the GitHub repository exactly. This publicly reveals the repository coordinate but does not make its content or history public. |
| `publishConfig` | `{ "access": "public", "registry": "https://registry.npmjs.org/" }` | Makes scoped-public intent and registry explicit. Scoped packages otherwise have historically defaulted to restricted visibility in common publication flows. |
| `files` | `["dist/", "THIRD_PARTY_NOTICES.md"]` | Include generated runtime/browser assets and required notices only. Remove `.kimi-code/skills/cumpa/`; the MIT skill has its own public distribution and license boundary. |
| `bin.cumpa` | Keep `dist/bin/cumpa.mjs` | Global npm installation links the command; npm exec/npx infers the only bin entry for the scoped package. |
| `engines.node` | Keep `>=24` | Existing supported runtime; also above npm trusted-publishing's Node minimum. |
| `description` | Public user-facing CLI description | npm search/package pages must describe the installed product, not the private development repository. |
| `homepage` / `bugs` | Use only public support/product URLs, otherwise omit | Do not point ordinary users at inaccessible private GitHub pages. The `repository` field remains present solely because npm requires the exact publisher binding. |
| `funding` | Do not add for v1.5 | Cumpa already owns its optional support flow. An npm funding URL is unnecessary and could create a second support authority. |

Add a top-level `LICENSE` containing the actual proprietary terms and an owner/copyright notice. npm always includes `package.json`, README, LICENSE, and bin targets even when `files` is an allowlist. The public package README must document installation, Node/Git prerequisites, proprietary licensing, the inspectable compiled-artifact boundary, and the separately installed marketplace skill without linking users to private operational material.

Do not add `main`, `exports`, or `types`: Cumpa exposes a command, not a supported JavaScript import API. Do not add `preferGlobal`, install-time compilation, postinstall code, or a second package wrapper.

## Packed-Artifact Boundary

### What remains private

- the private GitHub repository and its Git history;
- `src/` and all TypeScript/declaration source;
- source maps, including embedded `sourcesContent`;
- tests, fixtures, Playwright artifacts, and performance harnesses;
- `.planning/`, project research, phase artifacts, and internal operational documents;
- GitHub Actions secrets and private workflow history; and
- the repository-local skill copy, because the skill is published separately from the npm artifact.

### What is necessarily public

- the npm package metadata and README/license documents;
- every file in the downloadable npm tarball;
- compiled Node JavaScript and the generated executable launcher;
- bundled/minified browser JavaScript, CSS, HTML, Monaco assets, and any shipped native `.node` binary;
- third-party notices; and
- the public MIT skill source in `Ship-With-AI/skills`.

Compiled or minified JavaScript is inspectable and can be reverse engineered. Proprietary licensing limits legal permission; it does not create technical secrecy. Do not describe the npm package as closed to inspection, encrypted, or source-secret beyond excluding private development materials and history.

### Enforcement pattern

Use one allowlist and one authoritative artifact inspection:

1. run the existing configured production build once, including `CUMPA_RELEASE_SUPPORT_SERVICE_URL` through the current validated release path;
2. pack once with npm lifecycle scripts disabled;
3. pass that exact `.tgz` to the extended `verify-production-artifacts.mjs`;
4. require the expected package name, version, `bin`, engine, proprietary license pointer, public access configuration, notice file, and compiled runtime/browser inventory;
5. reject `src/`, `.git/`, `.planning/`, `.github/`, `.claude/`, `.kimi-code/`, `tests/`, `test-results/`, TypeScript/config source, `*.map`, declaration files, and inline `sourceMappingURL`/`sourcesContent` markers;
6. retain the existing protected-value and canonical support-origin scans; and
7. publish the same verified `.tgz` without rebuilding it.

The npm `files` allowlist is the first boundary, not the proof. npm always includes some root files, and any future generated file beneath `dist/` would match the allowlist. Conversely, `.git` is always ignored by npm, but repository privacy—not packlist behavior—is what protects remote history.

Do not add `.npmignore` next to the `files` allowlist. Two overlapping inclusion systems are harder to audit and do not replace inspection of the actual tarball.

## Trusted-Publishing Integration

Create one release-only workflow, separate from `.github/workflows/deploy-supabase-production.yml`.

Minimum workflow contract:

```yaml
on:
  push:
    tags: ['v1.5.0']

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    runs-on: macos-15
    environment: npm
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24.20.0
          registry-url: https://registry.npmjs.org
          package-manager-cache: false
      # npm ci
      # existing configured release build
      # pack once, scan that tarball, publish that tarball
```

Required invariants:

- Configure npm trust for exact owner/repository `Ship-With-AI/cumpa`, workflow filename (filename only), environment `npm`, and `--allow-publish`.
- Keep the runner GitHub-hosted; npm trusted publishing does not support self-hosted runners.
- Provide `id-token: write`; provide no npm authentication secret.
- Keep `contents: read` unless the workflow later gains a separately justified GitHub release step.
- Assert the tag equals `v${package.json.version}` before the irreversible publish.
- Use the existing configured support build. The Supabase origin is non-secret release configuration; payment, OAuth, and webhook credentials remain absent from the local package.
- Pack and inspect once. Publish the inspected `.tgz`, not the working directory.
- Do not set `publishConfig.provenance`, `NPM_CONFIG_PROVENANCE`, or `--provenance` while the repository is private. Trusted publishing will authenticate, but npm will not generate provenance.

### First-publication bootstrap

`@shipwithai/cumpa` returned registry `404` on the research date. npm `11.19.1` documents that `npm trust` requires the package to already exist, package write access, account-level 2FA, and npm `>=11.15.0`. Therefore the first trust relationship cannot be configured before any version exists.

Use the smallest honest bootstrap:

1. an authorized npm maintainer publishes a safe `0.0.0` artifact interactively with 2FA, public access, and a non-default `bootstrap` dist-tag;
2. configure the trusted publisher with npm `11.19.0+` or npmjs.com for `Ship-With-AI/cumpa`, the release workflow, the `npm` environment, and direct publish permission;
3. end the interactive session and keep its credential out of GitHub; and
4. publish `1.5.0` through GitHub OIDC.

This keeps `1.5.0` tokenless and trusted-published. It does not create provenance while the source repository is private. Do not manually publish `1.5.0` and call it trusted publishing.

## Public Skill Publication

The existing public `Ship-With-AI/skills` repository is the correct platform. It already supports:

- cross-agent cherry-pick installation with `npx skills add Ship-With-AI/skills --skill <name>`; and
- Claude Code marketplace installation through `claude plugin marketplace add Ship-With-AI/skills`, followed by installation of the `ship-with-ai` plugin collection.

Publish Cumpa by adding:

```text
skills/cumpa/
├── SKILL.md
└── LICENSE
```

Use the current `.kimi-code/skills/cumpa/SKILL.md` as the behavior source. Add the full MIT notice adjacent to it, keep the plugin manifest's MIT license, add Cumpa to the public README/catalog descriptions, and bump `.claude-plugin/plugin.json` from `0.2.0` to `0.3.0`. Claude Code uses the explicit plugin version as an update cache key; changing skill contents without bumping it can leave installed users on the old plugin.

The skill must state before its workflow that users install the CLI separately:

```bash
npm install --global @shipwithai/cumpa@1.5.0
```

The skill then calls `cumpa` and delegates all selection grounding, browser review, completion, and result authority to that executable. It may check that the command is available and report the installation prerequisite. It must not:

- embed compiled Cumpa code or TypeScript source;
- install the package automatically through hooks or scripts;
- use the Claude plugin `dependencies` field for an external executable (that field is for plugin dependencies);
- recreate review logic, schemas, Git mutation, diff interpretation, or result synthesis; or
- claim that MIT applies to the separately installed proprietary CLI.

The npm package likewise must not include the skill. This keeps two clean public artifacts: a proprietary executable distribution on npm and a human-readable MIT delegation layer in the marketplace.

## Consumer Installation Interfaces

No distribution dependency is installed into this repository.

```bash
# Proprietary CLI, persistent command
npm install --global @shipwithai/cumpa@1.5.0

# Proprietary CLI, exact one-off execution
npx --yes @shipwithai/cumpa@1.5.0

# Public MIT skill, cross-agent single-skill path
npx skills add Ship-With-AI/skills --skill cumpa

# Public MIT skill, Claude Code marketplace path
claude plugin marketplace add Ship-With-AI/skills
```

The marketplace skill's documented prerequisite is the first command. The npx flow is a separate supported CLI launch surface, not an implementation detail the skill should silently substitute.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Native npm/GitHub Actions workflow | Changesets, semantic-release, release-please | Add only if repeated multi-package versioning or changelog automation becomes a demonstrated burden. One package and one fixed release do not justify them. |
| `files` allowlist plus exact-tarball inspection | `.npmignore` denylist | Use a denylist only if most of the repository is intentionally public package content. Cumpa needs the opposite: a small compiled allowlist. |
| Publish one inspected `.tgz` | Publish the repository directory | Directory publication is acceptable only when lifecycle rebuilds cannot change the artifact. Cumpa's configured release launcher makes pack-once publication safer. |
| Private repository + trusted publishing without provenance | Public publisher repository + npm provenance | Use only if maintainers explicitly prioritize npm provenance over the private-repository publication constraint and accept a second public release authority. |
| Custom `LICENSE` + `SEE LICENSE IN LICENSE` | `UNLICENSED` | Use `UNLICENSED` only if recipients receive no right to use the package. Cumpa needs explicit proprietary use terms for an intentionally distributed CLI. |
| Existing `Ship-With-AI/skills` marketplace | New skill repository or npm-bundled skill | Use a separate repository only if Ship With AI changes its catalog model. The existing repo already provides single-skill and Claude marketplace paths. |
| Hosted `macos-15` release build | Consumer compilation or platform packages | Add platform packaging only if the optional native addon becomes a required cross-platform contract. |
| Existing artifact verifier | New license/scanning framework | Add heavyweight compliance tooling only if dependency or policy scale exceeds the existing single-package scanner. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Long-lived `NPM_TOKEN` or `NODE_AUTH_TOKEN` in Actions | Violates the milestone and adds rotation/exfiltration risk. | npm OIDC trusted publishing with `id-token: write`. |
| `--provenance` from the private repository | npm explicitly does not support provenance for private source repositories. | Publish through OIDC without provenance, or change the repository-visibility requirement. |
| Self-hosted release runner | Unsupported by npm trusted publishing. | GitHub-hosted `macos-15`. |
| Obfuscation, encryption, or minification as secrecy | Public npm tarballs and included JavaScript remain downloadable and inspectable. | Exclude development source/maps/history and state the proprietary boundary accurately. |
| Source maps or declaration/source files | They disclose source structure/content beyond the intended compiled distribution. | Current no-map builds plus packed-artifact denials. |
| `.npmignore` beside `files` | Creates a second drifting inclusion convention. | One positive `files` allowlist and exact-tarball scanner. |
| Publishing from the working directory | Can run lifecycle scripts and produce bytes different from the inspected package. | Pack once with scripts disabled, scan, publish that `.tgz`. |
| `npm-shrinkwrap.json` solely for this milestone | Adds a second lock artifact and exposes more development dependency metadata; direct runtime dependencies are already exact-pinned. | Keep the existing lockfile private and package runtime dependencies exact. Revisit only if transitive install drift becomes a released-product problem. |
| Release framework or license-scanner dependency | Existing platform and scripts already cover the required workflow. | npm CLI, GitHub Actions, and the existing verifier. |
| Bundling `.kimi-code/skills/cumpa/` in npm | Mixes the MIT delegation layer into the proprietary package and creates duplicate installation authority. | Publish the skill only through `Ship-With-AI/skills`. |
| Plugin hooks, MCP servers, or auto-install scripts | The skill is a thin instruction layer and the CLI must be separately installed. | `SKILL.md` prerequisite plus direct `cumpa` delegation. |
| Runtime/UI dependency upgrades | Outside the milestone and risks invalidating established behavior. | Keep the current application dependency graph. |

## Stack Patterns by Variant

**When the GitHub repository remains private (recommended and required by current scope):**
- Use OIDC trusted publishing.
- Omit all provenance flags/configuration.
- Report npm provenance as unavailable, not as a completed release property.

**If npm later documents private-repository provenance support:**
- Re-check the current trusted-publisher and provenance prerequisites at implementation time.
- Let trusted publishing generate provenance automatically; do not add a separate signing client.

**For the first-ever npm version:**
- Bootstrap package ownership with an interactive 2FA publication under a non-default tag.
- Configure trust only after the package exists.
- Publish `1.5.0` through the bound workflow.

**For marketplace users:**
- Install the public MIT skill from `Ship-With-AI/skills`.
- Install `@shipwithai/cumpa@1.5.0` separately.
- Keep all review authority in the CLI.

## Version Compatibility

| Component | Compatible With | Notes |
|-----------|-----------------|-------|
| `@shipwithai/cumpa@1.5.0` | Node `>=24` | Preserve the existing engine floor and single `cumpa` bin. |
| Node `24.20.0` | npm `11.19.0` bundled | Current Node 24 LTS distribution on the research date. |
| npm trusted publishing | npm `>=11.5.1`, Node `>=22.14.0`, GitHub-hosted Actions | Cumpa's release versions exceed both minimums. |
| `npm trust github` | npm `>=11.15.0`, existing package, package write access, account 2FA | Explains the one-time bootstrap for the currently nonexistent package. |
| npm automatic provenance | OIDC + public npm package + public repository | **Not compatible with Cumpa's private repository.** |
| `actions/checkout@v6` / `actions/setup-node@v6` | Current npm trusted-publishing example | Use only in the new release workflow; unrelated workflow upgrades are unnecessary. |
| GitHub `macos-15` | Private-repository standard hosted arm64 runner | Preserves the existing Darwin-arm64 optional native addon and satisfies npm's hosted-runner rule. |
| npm exec / npx `11.19.x` | `@shipwithai/cumpa@1.5.0` with one bin entry | Exact package spec selects the requested version; single bin permits executable inference. |
| Ship With AI plugin `0.3.0` | `skills/cumpa/SKILL.md` | Minor bump is required because current `0.2.0` is an explicit update cache key. |
| Public Cumpa skill | CLI `@shipwithai/cumpa@1.5.0` | Skill MIT license and CLI proprietary license remain separate. |

## Sources

Primary sources accessed 2026-09-06:

- [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/) — OIDC and Node/npm minimums, supported hosted runners, exact GitHub binding, `id-token: write`, automatic provenance conditions, private-repository exclusion, and current `actions/*@v6` example.
- [npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/) — npm `>=11.15.0`, existing-package requirement, write access, 2FA, GitHub flags, and allowed publish actions.
- [npm package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) — `files` allowlist, always-included/ignored files, `bin`, `private`, repository metadata, and `SEE LICENSE IN <filename>` / `UNLICENSED` license forms.
- [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish/) — tarball package specs, immutable name/version combinations, public access, packlist behavior, and artifact integrity.
- [Creating and publishing scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/) — scoped-public access and organization prerequisites.
- [About public packages](https://docs.npmjs.com/about-public-packages/) — public packages are downloadable by anyone.
- [npm exec / npx](https://docs.npmjs.com/cli/v11/commands/npm-exec/) — exact package/version syntax, cache installation, prompting, and single-bin inference.
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements/) — public source/build linkage and public transparency-log semantics.
- [GitHub changelog: private source repositories no longer supported for npm provenance](https://github.blog/changelog/2023-07-25-publishing-with-npm-provenance-from-private-source-repositories-is-no-longer-supported/) — corroborates the private-repository restriction.
- [Node.js `latest-v24.x` distribution index](https://nodejs.org/dist/latest-v24.x/) and [release index](https://nodejs.org/dist/index.json) — current Node `24.20.0` and bundled npm `11.19.0`.
- [GitHub-hosted runners reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners) — `macos-15` is a standard arm64 hosted runner available to private repositories.
- [Claude Code plugins reference](https://code.claude.com/docs/en/plugins-reference) — `skills/<name>/SKILL.md` discovery, MIT metadata, component paths, explicit version update behavior, and SemVer guidance.
- [Ship-With-AI/skills README](https://github.com/Ship-With-AI/skills/blob/main/README.md), [plugin manifest](https://github.com/Ship-With-AI/skills/blob/main/.claude-plugin/plugin.json), and [marketplace catalog](https://github.com/Ship-With-AI/skills/blob/main/.claude-plugin/marketplace.json) — current public installation paths, repository layout, plugin version `0.2.0`, MIT metadata, and `./skills/` discovery.
- Repository observations: `package.json`, `tsconfig.json`, `vite.config.ts`, `scripts/build-bin.mjs`, `scripts/build-native-addon.mjs`, `scripts/verify-production-artifacts.mjs`, `THIRD_PARTY_NOTICES.md`, and `.kimi-code/skills/cumpa/SKILL.md`.

---
*Stack research for: Cumpa v1.5 Private Distribution*
*Researched: 2026-09-06*
