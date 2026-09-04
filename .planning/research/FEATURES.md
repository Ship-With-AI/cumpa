# Feature Research

**Domain:** Public distribution of an existing Node.js CLI and coding-agent skill
**Researched:** 2026-09-04
**Confidence:** HIGH for npm, GitHub Actions, Claude Code, and live-registry contracts; MEDIUM for ShipWithAI acceptance details beyond its public repository conventions

## Scope

This research covers only **Cumpa v1.5 Public Distribution**: publishing the shipped Cumpa CLI for global and `npx` use, releasing it from approved GitHub releases through npm trusted publishing with provenance and no long-lived npm publishing token, and listing the existing thin Cumpa skill in the established ShipWithAI marketplace. It does not revisit Cumpa's review behavior.

## Release Viability Gate

The requested bare npm identity is not presently available. On the research date, the public registry reports `cumpa@2.0.1` as an unrelated “Minimal function composition implementation,” maintained by `gianlucaguarini`, with source at `GianlucaGuarini/cumpa` and no CLI `bin`. Consequently, today's `npx cumpa` cannot launch this project.

Cumpa cannot satisfy the named commands by changing only its local `package.json`. Before implementation planning, maintainers must either:

1. obtain an explicit ownership transfer of the existing `cumpa` package and approve the user/supply-chain consequences of repurposing an unrelated package identity; or
2. change the milestone's package name and installation commands.

A scoped or renamed package can still expose a global binary named `cumpa`, but it cannot make the exact commands `npm install -g cumpa` and `npx cumpa` resolve to this project. That is a product requirement change, not an implementation fallback. If ownership is transferred, the registry history remains and the new version must be greater than `2.0.1`; replacing an unrelated library with a CLI is a breaking identity change and should not be presented as Cumpa `1.0.0`.

The source origin is `Ship-With-AI/cumpa`, but that GitHub URL is not anonymously reachable on the research date. npm automatic provenance for a public package is unsupported when its source repository is private. Public-repository readiness and an explicit license decision are therefore a second go/no-go gate.

## Current Integration Points

- `package.json` already declares Node `>=24`, ESM, `bin.cumpa = dist/bin/cumpa.mjs`, a `files` allowlist for `dist/` and `.kimi-code/skills/cumpa/`, and a `prepack` build. It is not publishable while `private: true`, uses placeholder version `0.0.0`, and lacks license, repository, homepage, bugs, keywords, and author/organization metadata.
- `scripts/build-bin.mjs` already generates an executable `dist/bin/cumpa.mjs` with `#!/usr/bin/env node` and mode `0755`; public distribution should preserve and verify this existing contract rather than introduce another launcher.
- `.kimi-code/skills/cumpa/SKILL.md` is already a thin integration: it requires `cumpa` and Git on `PATH`, submits the shipped request protocol, waits for the browser review, validates canonical JSON, and does not duplicate or mutate review behavior.
- `README.md` still describes manual skill copying and says “If Cumpa is published in the future.” Public release must replace that provisional path with exact install, run, upgrade, uninstall, prerequisite, marketplace, and troubleshooting instructions.
- The existing CLI does not expose a standard `--version` option. Public users, release verification, and the skill need a reliable way to identify the installed package version.
- `.github/workflows/<publish-workflow>.yml` and the ShipWithAI catalog entry do not yet provide the two public release channels.

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Bare `cumpa` package ownership | The required commands must resolve to this product, not an unrelated registry package. | HIGH | **External launch blocker.** The name is currently owned by another maintainer at version `2.0.1`. Complete an explicit transfer and identity decision before workflow work, or revise the milestone. npm documents owner-assisted transfer; package names are first-come, first-served. |
| Public source and explicit release license | Users need legal terms and npm provenance needs a public source repository for a public package. | MEDIUM | Make `Ship-With-AI/cumpa` public only after a public-readiness review. Maintainers must choose the license; do not assume MIT. Put the matching SPDX identifier, or `SEE LICENSE IN <filename>`, in npm and plugin metadata and ship the named top-level license file. |
| Real public package identity | npm publication requires a valid name/version and public access rather than a private workspace placeholder. | MEDIUM | Remove `private: true`; replace `0.0.0` with the approved release version; lock public registry/access through `publishConfig`. If the occupied package is transferred, the release version must follow its existing `2.0.1` history. |
| Complete npm discoverability metadata | Registry users expect to identify the product, source, docs, support route, owner, runtime, and license before installing. | LOW | Add accurate description, keywords, repository, homepage, bugs, license, and author/organization metadata. `repository.url` must point exactly, including case, to the public publishing repository for provenance. |
| Working global executable | `npm install -g cumpa` must place a runnable `cumpa` command on `PATH`. | LOW | Reuse `bin.cumpa` and the generated Node shebang/executable mode. Verify from a clean temporary global prefix rather than relying on the checkout or an existing global install. |
| Working `npx cumpa` path | Users expect a one-off run without a permanent global install. | LOW | A single matching `bin` lets npm infer the executable. Verify plain `npx cumpa` after `latest` points to this CLI. Document `npx cumpa@latest` for explicit registry-latest use and `npx --yes cumpa@<exact-version>` for automation; plain `npx` may prompt and may prefer a matching local dependency. |
| Version introspection | Users and the agent skill must be able to diagnose stale or incompatible global installations. | LOW | Add conventional `cumpa --version` backed by the released package version, then use it in install verification and prerequisite troubleshooting. Do not create a separate version source. |
| Complete deterministic tarball | A command that installs but lacks server, browser, native, or skill assets is still a broken release. | MEDIUM | Keep a narrow `files` allowlist and inspect the actual tarball. Include every runtime asset beneath `dist/` and the intentionally shipped canonical skill; npm always includes package metadata, README, license, and `bin` targets under its packaging rules. |
| Actionable runtime prerequisites | npm cannot install Node or Git for the user, and the skill shells out to both the Cumpa CLI and Git. | LOW | State Node.js `>=24` and the product's enforced Git `>=2.43` requirement on the npm page, README, and marketplace listing. Keep runtime failure actionable. A marketplace install alone does not satisfy the CLI prerequisite. |
| Public quick start and lifecycle documentation | Installation is incomplete if users cannot run, upgrade, remove, or distinguish global from transient use. | MEDIUM | Replace provisional README copy with `npm install -g cumpa`, `cumpa`, `npx cumpa`, `npm install -g cumpa@latest`, and `npm uninstall -g cumpa`; explain the Git-repository working-directory requirement, browser launch, Node/Git prerequisites, npm prompt behavior, and troubleshooting. |
| Approved immutable release identity | Maintainers must know which reviewed source/version becomes an immutable npm version. | MEDIUM | Publish only from the selected approved GitHub release/tag path. Fail when Git tag, `package.json` version, and intended npm version disagree; never infer or mutate the version during publish. Re-publishing an existing npm version is impossible. |
| GitHub Actions trusted publishing | The release must authenticate without a stored npm publishing token. | MEDIUM | Configure the npm package's trusted publisher for exact organization `Ship-With-AI`, repository `cumpa`, workflow filename, optional matching GitHub environment, and allowed action. Use a GitHub-hosted runner, Node 24, npm CLI `>=11.5.1`, `actions/setup-node` with the npm registry, and permissions `contents: read` plus `id-token: write`; do not provide `NPM_TOKEN`/`NODE_AUTH_TOKEN` as a publishing credential. |
| Provenance and token restriction | Users need evidence connecting package bytes to the public workflow, while maintainers should not retain a bypassing long-lived automation secret. | MEDIUM | GitHub Actions trusted publishing automatically emits provenance for a public package from a public repository; no `--provenance` flag is needed. After the OIDC path is proven, set npm publishing access to require 2FA and disallow traditional tokens, and revoke obsolete automation tokens. |
| Candidate tarball inspection | Source-tree tests do not prove what npm will receive. | MEDIUM | Run `npm pack --dry-run --json` for the file manifest and create/install the candidate `.tgz` for an executable smoke check before publication. Verify forbidden development/private files are absent and required runtime/skill assets are present. |
| Released npm artifact verification | The milestone promises real public installation paths, not only a successful publish job. | HIGH | Fetch the exact registry version, inspect its tarball/metadata, run `npm audit signatures`, install it globally in isolation, exercise the executable from a temporary Git repository, and separately run the exact-version `npx` path. Confirm loopback/browser behavior from installed bytes. |
| Marketplace-compatible Cumpa plugin entry | ShipWithAI distributes Claude Code plugins, not arbitrary repository files. | MEDIUM | Publish the canonical skill through a valid plugin root/source and add a `shipwithai-cumpa` entry, following the catalog's established naming convention, to `ShipWithAI/shipwithai-plugins/.claude-plugin/marketplace.json`. Reuse one authoritative `SKILL.md`; do not fork its request/result protocol. External GitHub or `git-subdir` sources are supported, subject to ShipWithAI acceptance. |
| Marketplace prerequisite disclosure | Installing the skill does not install the unrelated system CLI it invokes. | LOW | The catalog description, plugin README/details, and skill must lead with Node `>=24`, Git `>=2.43`, and global `cumpa` CLI installation. The skill should check the command/version and stop with the exact install guidance rather than silently invoking npm. |
| Exact marketplace install/use/update guidance | Users need commands matching Claude Code's actual marketplace and namespace model. | LOW | New ShipWithAI users first run `/plugin marketplace add ShipWithAI/shipwithai-plugins`; registered users install with `/plugin install shipwithai-cumpa@shipwithai` (or `claude plugin install shipwithai-cumpa@shipwithai --scope user`). State the actual namespaced skill invocation; a `shipwithai-cumpa` plugin containing the existing `cumpa` skill implies `/shipwithai-cumpa:cumpa`. Mention `/reload-plugins` when prompted and `/plugin marketplace update shipwithai` for an explicit catalog refresh. |
| Skill/plugin version discipline | Users otherwise remain on stale instructions even when the CLI protocol changes. | MEDIUM | Claude Code uses the explicit plugin version as its update cache key; `plugin.json` wins over catalog `version`. Bump the plugin version whenever skill content changes and keep ShipWithAI metadata aligned. State the compatible Cumpa CLI minimum/released version. |
| Released marketplace installation verification | A valid local skill does not prove the public catalog source, cache, namespace, or prerequisite path. | HIGH | Add/update the real ShipWithAI marketplace, install `shipwithai-cumpa@shipwithai` at a clean scope, reload if requested, verify the installed component inventory, invoke the namespaced skill in a temporary Git repository, and complete one review through the exact released npm CLI. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Provenance-backed release transparency | Users can connect public package bytes to an authorized workflow in the public source repository without trusting a reusable secret. | LOW | Incremental cost is small after the public-repository and OIDC gates; preserve automatic provenance and expose verification guidance. |
| Cross-channel released-artifact acceptance | Cumpa proves that the npm CLI and marketplace-installed skill work together as users receive them, catching packaging, catalog, cache, namespace, and protocol drift. | HIGH | Gate completion on exact registry and ShipWithAI artifacts, not repository-local paths. This directly serves the milestone's strongest trust claim. |
| One thin skill authority across channels | npm consumers, repository users, and marketplace users receive the same agent protocol instead of divergent integrations. | MEDIUM | Keep one canonical `SKILL.md` or a mechanically identical packaged source. The marketplace layer contributes only manifest/catalog metadata and prerequisite/install guidance. |
| Honest local-first listing | Marketplace users can see that Cumpa opens a loopback browser, reviews pinned local Git state, does not mutate reviewed code, and returns canonical agent feedback. | LOW | Reuse shipped product facts in catalog/README copy; do not add new review behavior to make the listing sound broader. |
| Explicit install and upgrade semantics | Users know the difference between a persistent global CLI, transient `npx`, and an independently versioned agent plugin. | LOW | Document global upgrade, explicit `@latest`/exact-version npx use, and plugin refresh/reload without promising a hidden updater. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Publish to bare `cumpa` without securing ownership | Keeps the desired product name and commands. | The registry already routes that identity to another maintainer's package; local manifest changes cannot override it. | Resolve an explicit transfer and identity-migration decision first, or formally rename the package and update the milestone. |
| Silently substitute a scoped/renamed npm package | Unblocks engineering without external coordination. | It does not satisfy `npm install -g cumpa` or `npx cumpa`, and hides a product decision inside implementation. | Stop at the name gate and obtain explicit requirement approval. |
| Repurpose the existing package as version `1.0.0` | Gives the CLI a clean semantic starting point. | npm already contains versions through `2.0.1`; versions are immutable and the history belongs to another product. | If transfer is approved, choose a valid greater breaking version and communicate the identity change; otherwise use an approved new name. |
| Custom bootstrap installer or `curl | sh` | Could install the CLI and skill together. | Adds a second distribution/security/update path and bypasses native npm and Claude marketplace controls. | Use npm for the CLI and ShipWithAI for the skill, with explicit prerequisites. |
| npm lifecycle script that copies/registers the skill | Makes global install appear to configure every agent automatically. | Mutates user configuration during install, is agent-specific, and is difficult to undo or secure. | Keep package contents passive; users opt into `/plugin install shipwithai-cumpa@shipwithai`. |
| Skill auto-installs the global CLI | Makes missing prerequisites disappear. | Lets an instruction file modify global software, introduces prompts/network/version ambiguity, and conceals trust consent. | Detect the missing command and show the exact global install/version guidance. |
| Long-lived `NPM_TOKEN` secret | Familiar release setup. | Creates a reusable exfiltration/rotation risk and violates the milestone. | npm trusted publishing with a workflow-bound OIDC identity. |
| Manual laptop or mutable branch publication | Seems quicker for the first release. | Breaks approved-source reproducibility, provenance, and auditability. | Publish the approved immutable release through the authorized GitHub-hosted workflow. |
| Claim provenance while repository remains private | Avoids public-source preparation. | npm explicitly does not generate automatic provenance for a public package from a private repository. | Make the source repository public before the provenance release, after a public-readiness review. |
| Duplicate review logic in the marketplace wrapper | Makes the plugin look self-contained. | The instructions will drift from the CLI's strict request/result and safety authority. | Keep the existing skill thin and delegate all behavior to the installed CLI. |
| New Cumpa-specific marketplace | Gives complete catalog control. | Users asked for the established ShipWithAI discovery/install path; another catalog adds a registration and maintenance burden. | Contribute one entry to `ShipWithAI/shipwithai-plugins`. |
| Promise plain `npx cumpa` is always newest | Makes upgrades sound effortless. | npm may use a matching local dependency, and unversioned resolution is not an explicit reproducibility/latest guarantee. | Use `@latest` when newest is intended and exact versions for automation/verification. |
| Bundle Node, Git, or an update daemon | Reduces visible prerequisites. | Greatly expands platform, security, installer, and lifecycle scope for capabilities users already obtain from standard tools. | Declare supported Node/Git versions and use npm/Claude update mechanisms. |
| Add hosted, forge, collaboration, or new review features | Makes the public launch appear larger. | Reopens shipped product scope and delays distribution validation. | Publish and verify the existing CLI and skill only. |

## Feature Dependencies

```text
[Ownership/identity for bare npm `cumpa`]
    └──requires──> [explicit transfer + package-history decision]
                       └──enables──> [publishable release version]

[Public source readiness + chosen license]
    ├──enables──> [public repository Ship-With-AI/cumpa]
    ├──enables──> [accurate npm/plugin metadata]
    └──required-by──> [automatic npm provenance]

[publishable manifest + built runtime + canonical skill]
    └──requires──> [candidate tarball inspection/install]
                       └──enables──> [approved release artifact]

[owned npm package settings]
    + [exact public repository metadata]
    + [authorized GitHub-hosted workflow/environment]
    + [npm >=11.5.1 + id-token: write]
        └──enables──> [OIDC trusted publish without long-lived token]
                          └──automatically-adds──> [provenance]
                          └──enables──> [exact public global/npx verification]

[canonical Cumpa SKILL.md]
    + [marketplace-compatible plugin source/version]
    + [public CLI prerequisite and usage docs]
        └──enables──> [ShipWithAI catalog entry]
                          └──enables──> [marketplace install + namespaced invocation]

[exact released npm CLI]
    + [exact marketplace-installed skill]
        └──required-by──> [end-to-end public distribution acceptance]

[custom installer/lifecycle copying] ──conflicts──> [native opt-in npm + ShipWithAI paths]
[private repository] ──conflicts──> [automatic public-package provenance]
[unversioned plugin edits] ──conflicts──> [reliable skill updates]
```

### Dependency Notes

- **Package identity is Phase 0.** The bare name conflict is external and cannot be solved by coding. Do not build a release workflow around an npm package the organization cannot configure.
- **Transfer does not erase history.** Ownership would make trusted-publisher settings available but would not reset versions, consumers, or meaning. The identity-migration decision precedes release versioning and public copy.
- **Public repository readiness precedes provenance.** npm requires a public repository and public package for automatic provenance. Repository metadata must match `Ship-With-AI/cumpa` exactly and case-sensitively.
- **License choice precedes both listings.** npm and ShipWithAI metadata should describe the same legal terms; research cannot choose those terms for the maintainer.
- **Candidate verification precedes publishing.** The packed file list and installed tarball are the nearest prepublication representation of user bytes. A source-tree build is insufficient evidence.
- **Trusted publisher configuration precedes the publish job.** npm binds trust to the exact GitHub organization, repository, workflow filename, optional environment, and allowed action. The workflow must match that identity and actual `npm publish` versus `npm stage publish` choice.
- **OIDC proof precedes token lockdown.** Prove one trusted path, then disallow/revoke traditional tokens so emergency rollback does not accidentally remove the only working publisher.
- **Public CLI precedes marketplace acceptance.** The existing skill intentionally invokes `cumpa` on `PATH`; listing it first would deliver an unusable integration. The marketplace must declare the exact compatible CLI installation.
- **Marketplace packaging must preserve one authority.** Prefer a source/layout that exposes the existing `SKILL.md` as the plugin component. If ShipWithAI requires a wrapper or vendored directory, keep protocol instructions single-sourced and verify parity.
- **Claude plugin namespacing is user-visible.** Marketplace installation does not preserve a standalone `/cumpa` invocation automatically. Following ShipWithAI's plugin naming convention, `shipwithai-cumpa` containing the existing `cumpa` skill yields `/shipwithai-cumpa:cumpa`; any accepted naming change must be reflected in listing and smoke verification.
- **Package and plugin versions are independent.** npm semver identifies executable bytes; Claude plugin version identifies skill bytes. Document compatibility and update each authority when its artifact changes.
- **Real public acceptance comes last.** Only after both artifacts are publicly resolvable can verification catch stale `latest`, missing tarball assets, catalog refresh, plugin cache, namespacing, or protocol mismatch.

## MVP Definition

### Launch With (v1.5)

- [ ] Resolve the bare `cumpa` npm ownership/identity gate, or explicitly revise the milestone name and commands before implementation.
- [ ] Complete public-repository readiness and choose one license represented consistently in repository, npm, and plugin metadata.
- [ ] Make `package.json` publicly publishable with a valid release version, public registry/access, exact repository/support metadata, a working `bin`, `--version`, Node/Git prerequisites, and complete allowlisted artifacts.
- [ ] Replace provisional README instructions with exact global, npx, upgrade, uninstall, prerequisite, troubleshooting, marketplace registration/install, namespaced use, refresh, and reload guidance.
- [ ] Inspect and install the candidate npm tarball before release; prove required runtime/browser/skill assets are included and private/development material is absent.
- [ ] Publish only the approved immutable GitHub release through the exact npm trusted publisher on a GitHub-hosted runner with OIDC, automatic provenance, and no long-lived npm publishing credential.
- [ ] Verify the exact public npm version through registry metadata/tarball, signature/provenance audit, isolated global install, and exact-version npx launch from a real Git repository.
- [ ] Publish the existing thin skill as a versioned `shipwithai-cumpa` entry in the established ShipWithAI marketplace, declaring the separately installed public CLI and supported Node/Git versions.
- [ ] Install from the real ShipWithAI catalog at a clean scope, verify the namespaced skill is active, and complete one end-to-end review against the exact released npm CLI.
- [ ] After the OIDC path succeeds, disallow traditional publishing tokens and revoke any obsolete npm automation credential.

### Add After Validation (v1.x)

- [ ] Stage-only npm publishing with separate 2FA promotion — add if maintainers want npm's maximum-security approval layer in addition to the approved GitHub release; configurations created after 2026-09-03 allow staging by default, while direct `npm publish` must be explicitly allowed.
- [ ] Broader OS/shell installation matrix — add when public usage identifies supported environments beyond those exercised by the initial release gate; do not claim unverified portability.
- [ ] ShipWithAI relevance/suggestion metadata — add only if the marketplace's managed recommendation features are used; it is not needed for direct install.
- [ ] Richer npm/marketplace discovery assets — add screenshots, demonstrations, or category refinements when listing analytics or user feedback shows discovery, rather than installation correctness, is the constraint.

### Future Consideration (v2+)

- [ ] Additional package-manager or standalone binary channels — defer until npm adoption demonstrates demand; each adds signing, update, and platform obligations.
- [ ] Additional agent marketplaces — defer until a named ecosystem justifies another packaged adapter; keep the Cumpa protocol authority single-sourced.
- [ ] Automated CLI update notifications — defer until stale-version support burden is measured; npm's explicit global update and `npx @latest` paths already work.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Resolve bare npm name ownership/identity | HIGH | HIGH | P1 |
| Public source readiness and explicit license | HIGH | MEDIUM | P1 |
| Publishable manifest, metadata, bin, and version command | HIGH | MEDIUM | P1 |
| Complete deterministic candidate tarball | HIGH | MEDIUM | P1 |
| Global install and `npx` execution | HIGH | LOW | P1 |
| Public lifecycle/prerequisite documentation | HIGH | MEDIUM | P1 |
| Approved OIDC trusted release | HIGH | MEDIUM | P1 |
| Automatic provenance and token restriction | HIGH | MEDIUM | P1 |
| Exact public npm artifact verification | HIGH | HIGH | P1 |
| Versioned ShipWithAI entry using canonical skill | HIGH | MEDIUM | P1 |
| Marketplace CLI prerequisite and namespaced usage | HIGH | LOW | P1 |
| Real marketplace-installed end-to-end verification | HIGH | HIGH | P1 |
| Stage-only npm promotion | MEDIUM | MEDIUM | P2 |
| Broader installation platform matrix | MEDIUM | HIGH | P2 after demand |
| Marketplace relevance/richer discovery metadata | LOW | LOW | P2 after evidence |
| New distribution channels or update daemon | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for v1.5 public launch
- P2: Add only after public-path validation or evidence of need
- P3: Future consideration; not part of this milestone

## Competitor / Ecosystem Feature Analysis

| Feature | Manual repository/skill copy | Native npm + generic Claude marketplace | Cumpa v1.5 approach |
|---------|------------------------------|-----------------------------------------|---------------------|
| CLI installation | Clone/build or copy from a checkout; no stable public identity. | npm provides global linking and transient execution from registry packages. | Publish one allowlisted Node 24 package with global `cumpa`, `npx`, explicit upgrades, and exact-version verification—only after resolving the occupied name. |
| Skill installation | User copies `SKILL.md` into an agent-specific directory and repeats that work for updates. | Registered marketplace users install a versioned plugin by catalog name and choose scope. | Add `shipwithai-cumpa@shipwithai`; first-time users add ShipWithAI once, then use its normal one-command install and Claude namespace behavior. |
| External prerequisite | Often buried in copied instructions and fails later on `PATH`. | Claude plugins can depend on system executables but do not inherently provision unrelated global CLIs. | Put Node, Git, public Cumpa CLI, version, and exact install guidance in catalog details, README, and the skill's preflight failure. |
| Updates | Copy again and guess whether instructions match the executable. | npm uses semver/dist-tags; Claude caches plugins and detects explicit version changes or source hashes. | Version CLI and skill independently, state compatibility, document global/`@latest` updates plus marketplace refresh/reload, and verify them together. |
| Release trust | Trust the checkout/source and local build. | npm trusted publishing can bind public artifacts to CI with provenance; marketplaces disclose plugin source/components. | Combine workflow-bound OIDC provenance with an established public catalog and no install-time mutation. |
| Acceptance evidence | Local source may work while copied/published contents fail. | Each ecosystem offers pack/install/validation primitives, but cross-channel behavior is project-owned. | Exercise candidate tarball, exact registry artifact, real ShipWithAI install/cache/namespace, and one completed CLI-backed review. |
| Behavior authority | Copied instructions can easily fork product logic. | Plugins may bundle extensive behavior or just delegate to tools. | Keep the existing skill thin: Cumpa's shipped CLI remains the sole request, review, and canonical-result authority. |

## Sources

### npm and Registry (HIGH confidence)

- [Live `cumpa` registry document](https://registry.npmjs.org/cumpa/latest) — observed latest `2.0.1`, unrelated function-composition description/repository/maintainer, and no CLI `bin` on 2026-09-04.
- [npm `package.json` documentation](https://docs.npmjs.com/cli/v11/configuring-npm/package-json) — package identity, metadata, license, `files`, `bin`, repository, engines, and publication behavior.
- [npm exec / `npx`](https://docs.npmjs.com/cli/v11/commands/npm-exec) — executable inference, local/remote resolution, install prompt, cache, `--yes`, and explicit package specs.
- [npm pack](https://docs.npmjs.com/cli/v11/commands/npm-pack) — dry-run JSON file inspection and packing/fetching package specs.
- [Transfer a package between npm users](https://docs.npmjs.com/transferring-a-package-from-a-user-account-to-another-user-account) — owner-assisted maintainer transfer.
- [npm package/username policy](https://docs.npmjs.com/policies/disputes) — first-come, first-served registry names.
- [Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers) and its [current source](https://raw.githubusercontent.com/npm/documentation/main/content/packages-and-modules/securing-your-code/trusted-publishers.mdx) — supported runners, minimum npm/Node, exact publisher identity, allowed actions, workflow permissions, token restriction, and automatic provenance.
- [Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements) — public repository/package and repository metadata constraints.
- [Verifying registry signatures](https://docs.npmjs.com/verifying-registry-signatures) — `npm audit signatures` verification.

### Claude Code and ShipWithAI (HIGH platform confidence; MEDIUM marketplace acceptance confidence)

- [ShipWithAI plugin marketplace repository](https://github.com/ShipWithAI/shipwithai-plugins) — established marketplace identity and install convention.
- [ShipWithAI marketplace registry](https://raw.githubusercontent.com/ShipWithAI/shipwithai-plugins/main/.claude-plugin/marketplace.json) — live `shipwithai` catalog and local/external plugin source patterns.
- [ShipWithAI repository conventions](https://raw.githubusercontent.com/ShipWithAI/shipwithai-plugins/main/CLAUDE.md) — plugin/skill layout, metadata, documentation, and evaluation expectations; acceptance remains subject to its maintainers.
- [Create and distribute a Claude Code plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces) — marketplace schema, plugin sources, cache isolation, install command, component metadata, and version behavior.
- [Discover and install Claude Code plugins](https://code.claude.com/docs/en/discover-plugins) — add/install stages, scope confirmation, named-catalog refresh, reload, update, and uninstall behavior.
- [Create Claude Code plugins](https://code.claude.com/docs/en/plugins) — plugin layout, skill namespacing, single-skill plugin support, and local validation.
- [Claude Code plugins reference](https://code.claude.com/docs/en/plugins-reference) — manifest precedence, plugin validation, version cache keys, and update semantics.

### Repository Evidence (HIGH confidence)

- `package.json` — current placeholder/private manifest, `bin`, `files`, Node engine, and `prepack` integration.
- `scripts/build-bin.mjs` — current generated shebang and executable mode.
- `src/cli/run.ts` and `src/git/repository.ts` — current public command shape and enforced Git minimum.
- `.kimi-code/skills/cumpa/SKILL.md` — existing canonical thin coding-agent integration and CLI/Git prerequisite.
- `README.md` — current manual/provisional installation guidance.
- `git remote get-url origin` and anonymous access to `https://github.com/Ship-With-AI/cumpa` — exact source identity and current non-public reachability.

---
*Feature research for: Cumpa v1.5 Public Distribution*
*Researched: 2026-09-04*
