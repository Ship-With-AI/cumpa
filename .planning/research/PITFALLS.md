# Pitfalls Research

**Domain:** Public distribution of the Cumpa npm CLI and ShipWithAI coding-agent plugin
**Researched:** 2026-09-04
**Confidence:** HIGH for npm, Node.js, and Claude Code platform contracts; MEDIUM for ShipWithAI submission governance because no formal external-submission or service-level policy was found

## Scope and Phase Vocabulary

This research covers only the v1.5 distribution surface: the public `cumpa` npm package, GitHub Actions trusted publishing with provenance, and publication of the existing `.kimi-code/skills/cumpa/SKILL.md` through the established ShipWithAI marketplace. Existing review behavior is treated as shipped.

Mitigations map to these proposed roadmap phases:

1. **Package Identity & Ownership** — resolve the occupied npm name, public-package metadata, version lineage, repository visibility, and accountable owners.
2. **Reproducible Package Artifact** — create and inspect the exact tarball, including the CLI, browser assets, support-service configuration, and native-addon policy.
3. **Trusted Release Automation** — bind npm OIDC to an exact GitHub workflow, generate provenance, protect approvals, handle reruns, and define npm recovery.
4. **ShipWithAI Plugin Publication** — package the existing skill as a real Claude Code plugin, control source/version drift, and declare CLI compatibility.
5. **Public Installation Gate** — exercise global, `npx`, browser, and marketplace-installed agent flows from clean consumer environments.

## Critical Pitfalls

### Pitfall 1: The required bare npm name belongs to another project

**Confidence:** HIGH

**What goes wrong:**

`npm install -g cumpa` and `npx cumpa` install or resolve the existing public package, not this application. The live registry currently reports `cumpa@2.0.1` as Gianluca Guarini's unrelated “Minimal function composition implementation,” with published versions `1.0.0`, `1.0.1`, `2.0.0`, and `2.0.1`. This repository cannot publish the bare name without being added as an npm owner or receiving a transfer. Even after a transfer, changing an established package to unrelated software can surprise existing users and creates an awkward, immutable semver lineage.

**Why it happens:**

The private repository already uses `"name": "cumpa"`, so local builds make the name look reserved. npm name ownership is registry state, not repository intent. An unscoped name also carries the history and consumers of every previously published version.

**How to avoid:**

**Required launch blocker:** resolve package identity before designing release automation. For the exact acceptance commands, obtain explicit cooperation from the current owner and agree on ownership, consumer communication, dist-tags, and a non-misleading first Cumpa application version. If that cannot be done safely, obtain product approval to change the acceptance criterion to a new or scoped package; `npm install -g @scope/cumpa` can still expose a `cumpa` binary, but `npx cumpa` cannot be made to mean the scoped package. Do not assume a repository rename, npm organization, or package alias claims the bare name.

**Warning signs:**

- `npm view cumpa` identifies the function-composition project or `2.0.1`.
- The npm package access/settings page is unavailable to Cumpa maintainers.
- A proposed first version ignores the existing `1.x`/`2.x` history.
- A plan says “publish `cumpa`” without naming the current npm owner and transfer decision.

**Phase to address:**

Phase 1 — Package Identity & Ownership. No later publishing work should proceed as if this is resolved.

---

### Pitfall 2: Repository metadata still describes a private placeholder package

**Confidence:** HIGH

**What goes wrong:**

Publication is refused because `package.json` has `"private": true`, or a release publishes misleading/incomplete metadata with version `0.0.0`. Trusted publishing also fails because `repository.url` is absent or does not exactly match the GitHub repository. Users cannot reliably locate the source, issue tracker, license, or supported runtime. The current repository has a README but no root license file, and the manifest lacks `license`, `repository`, `bugs`, `homepage`, and an explicit public npm `publishConfig`.

**Why it happens:**

Local package identity was intentionally safe while unpublished. Removing only `private` looks sufficient, but npm treats name plus version as an immutable identifier, uses manifest metadata in the registry, and requires an exact repository URL for GitHub trusted publishing.

**How to avoid:**

**Required:** after the name decision, remove `private`, choose the release version in the inherited npm history, add the exact canonical GitHub `repository.url`, and add truthful license/support/homepage/bugs metadata. Establish a license before inviting public installation. Pin `publishConfig.registry` to `https://registry.npmjs.org/` and `publishConfig.access` to `public`; pin the intended initial dist-tag deliberately. Keep `engines.node: >=24`, but document that npm's engine check is advisory unless consumers enable `engine-strict`. Verify the generated `dist/bin/cumpa.mjs` is in the tarball, executable, and starts with a Node shebang.

**Warning signs:**

- `private: true` or `version: 0.0.0` remains on a release tag.
- npm shows no repository/license links or links the wrong GitHub owner.
- The trusted-publish job reports `ENEEDAUTH` despite OIDC permissions.
- A Node version below 24 installs with only a warning and fails later.

**Phase to address:**

Phase 1 — Package Identity & Ownership; rechecked in Phase 2 against the packed manifest.

---

### Pitfall 3: The inspected build is not the tarball npm receives

**Confidence:** HIGH

**What goes wrong:**

The published CLI starts but the browser returns missing/stale assets, the launcher lacks production support configuration, or unreviewed files enter the package. Cumpa's `prepack` runs the complete runtime and Vite build. npm runs `prepack` during both `npm pack` and directory-based `npm publish`, so a second build on another runner or with another environment can replace the previously inspected `dist/`. `scripts/build-bin.mjs` also deletes `dist/` before generation, making stage order material.

**Why it happens:**

Teams inspect a repository checkout or CI build directory, then let `npm publish` rebuild implicitly. Here the package combines generated Node files, the executable wrapper, `dist/web/index.html`, hashed Vite assets, and possibly a native binary. The `files` allowlist is necessary but proves only eligible paths, not that required generated paths exist or correspond to one build.

**How to avoid:**

**Required:** make one tarball the release authority. Build once in the release context, run `npm pack --dry-run --json` and `scripts/verify-production-artifacts.mjs`, create the `.tgz`, record its SHA-512 or SHA-256, extract it, and smoke-test that exact artifact. Publish the verified tarball rather than a mutable directory; npm explicitly accepts a gzipped package tarball. The gate must assert at least `dist/bin/cumpa.mjs`, Node runtime files, `dist/web/index.html`, referenced `dist/web/assets/*`, package metadata, and the intended skill files, while rejecting source-only, secret, and hosted-service files. Preserve/check the checksum across GitHub artifact upload/download if build and publish are separate jobs.

**Warning signs:**

- Build, pack, verification, and publish occur in different workspaces without a recorded digest.
- `npm publish` is pointed at `.` after a prior tarball was approved.
- `npm pack --dry-run` is the only check; no extraction or runtime exercise follows.
- The package contains `dist/bin` but no `dist/web/index.html` or referenced Vite chunks.
- The packed checksum changes on a release workflow rerun from the same commit.

**Phase to address:**

Phase 2 — Reproducible Package Artifact; enforced again by Phase 3 and Phase 5.

---

### Pitfall 4: A runner-specific native build silently changes public capability

**Confidence:** HIGH

**What goes wrong:**

A tarball built on `ubuntu-latest` contains no `dist/native/directory_exchange.node`, so macOS arm64 consumers silently receive `reExportUnsupported` even though the feature works from a Darwin arm64 source build. Conversely, a Darwin arm64 `.node` file is not portable to Linux, Windows, or another CPU. Node-API stabilizes the ABI across compatible Node versions; it does not make one native shared object cross-platform.

**Why it happens:**

`scripts/build-native-addon.mjs` deliberately deletes the addon unless the build host is exactly `darwin`/`arm64`, then invokes `/usr/bin/c++`. `src/server/native-exchange-capability.ts` catches missing/load/probe failures and downgrades them to an unsupported capability, which prevents startup failure but can conceal a bad release build. The root `files` allowlist does not include `binding.gyp` or native source, so the current tarball should not compile on consumer install. If a future packaging change includes root `binding.gyp` without an explicit install policy, npm may automatically run `node-gyp rebuild` and impose a compiler/toolchain requirement.

**How to avoid:**

**Required:** choose and document one public native policy before release. The least complex policy consistent with current behavior is to assemble the final universal JavaScript tarball with the supported Darwin arm64 prebuilt addon present, verify that it loads on that target, and verify that other supported targets degrade explicitly without install failure. If no trusted Darwin arm64 build path is available, declare native re-export unavailable in the public package rather than implying parity. Do not add consumer-side compilation casually; if adopted later, ship all sources/tooling and test clean installs on every declared OS/CPU. Add `os`/`cpu` restrictions only if the whole CLI is intentionally platform-limited, not merely because one optional capability is.

**Warning signs:**

- The final pack job runs only on Linux and its inventory has no `.node` file.
- CI treats `reExportUnsupported` as success on the one platform expected to support native re-export.
- An install log unexpectedly runs `node-gyp rebuild`.
- Users need Xcode or a C++ compiler despite documentation promising an ordinary npm CLI install.

**Phase to address:**

Phase 2 — Reproducible Package Artifact; exercised across the declared matrix in Phase 5.

---

### Pitfall 5: OIDC is configured, but the identity or provenance contract does not match

**Confidence:** HIGH

**What goes wrong:**

A release reaches `npm publish` and fails with `ENEEDAUTH`, publishes without provenance, or grants publishing to a broader workflow than intended. npm's GitHub trusted-publisher fields are exact and case-sensitive, are not validated when saved, and bind owner, repository, workflow filename (including `.yml`/`.yaml`), and optionally a GitHub environment. The package's `repository.url` must also exactly match. Provenance requires a public package and public source repository; npm does not generate it for a private GitHub repository. Anonymous access to the configured `Ship-With-AI/cumpa` GitHub API currently returns 404, so public visibility must be confirmed rather than assumed.

**Why it happens:**

The Cumpa repository owner (`Ship-With-AI`) and marketplace organization (`ShipWithAI`) are distinct spellings. There is currently no npm release workflow under `.github/workflows/`, only `deploy-supabase-production.yml`. Reusable/manual workflows add another trap: npm validates the calling workflow name, and both parent and child need `id-token: write`. Self-hosted runners are unsupported. Adding `--provenance` does not fix a private source repository or a mismatched OIDC subject.

**How to avoid:**

**Required:** after package ownership exists, make the source repository public if provenance is an acceptance criterion; add the exact repository URL to the manifest; create one narrowly named release workflow on a GitHub-hosted runner using Node 24 and npm 11.5.1 or later; grant only `contents: read` and `id-token: write` at the publish job; and configure npm with the exact GitHub owner, repository, calling workflow filename, and protected environment if used. Do not set `NODE_AUTH_TOKEN`. Verify the registry version exposes the expected provenance attestation tied to the intended public repository and commit. Trusted-publisher connections cannot be edited, so delete and recreate a bad binding.

**Optional hardening:** configure the trusted publisher as stage-only. New trusted-publisher configurations automatically allow `npm stage publish`; direct `npm publish` must be enabled deliberately. Stage-only adds a separate maintainer review and 2FA approval.

**Warning signs:**

- The workflow uses `ShipWithAI` where the GitHub repository is under `Ship-With-AI`, or vice versa.
- `repository.url` is absent, SSH-only, or names a fork/different owner.
- The job has `contents: write`, repository-wide `id-token: write`, or an npm token “just in case.”
- The source repository is private or unavailable anonymously.
- The npm package page has no provenance despite a successful OIDC publish.
- The publish runs on a self-hosted runner or from a reusable workflow not registered as the caller.

**Phase to address:**

Phase 1 for repository visibility/metadata; Phase 3 for the exact OIDC binding and attestation check.

---

### Pitfall 6: Release-time support configuration is omitted or a secret is shipped

**Confidence:** HIGH

**What goes wrong:**

The public CLI cannot reach the production voluntary-support service because the launcher was built without `CUMPA_RELEASE_SUPPORT_SERVICE_URL`, points to the wrong Supabase project, or includes hosted-service credentials in the tarball. Once a secret is published to npm, removing it from Git history or publishing a fixed version does not retract downloaded tarballs.

**Why it happens:**

`scripts/build-bin.mjs` conditionally embeds one canonical `https://<20-lowercase-alphanumeric>.supabase.co` origin. A release build without the variable is valid for local development but wrong for production distribution. The existing production deployment job carries Supabase, Stripe, and GitHub credentials while also building/package-scanning an artifact. Adding npm's publish identity to that secret-rich job would combine unrelated authority and enlarge the blast radius. Conversely, copying all deployment environment variables into a new publish job risks embedding or logging secrets.

**How to avoid:**

**Required:** give the release build only the canonical non-secret support origin, preferably derived from a protected GitHub environment variable, and no Stripe keys, Supabase service/access tokens, database password, GitHub OAuth secret, or npm token. Keep deployment and npm publication as separate least-privilege jobs/workflows. Run `scripts/verify-production-artifacts.mjs --expected-support-origin <origin> --require-configured-launcher dist/bin/cumpa.mjs` against the release build and scan/extract the exact publish tarball. The launcher must contain exactly one allowed origin assignment and no other Supabase origins or raw project references.

**Warning signs:**

- The publish job inherits the entire `production` secret environment.
- The release works locally only when `CUMPA_SUPPORT_SERVICE_URL` is manually set.
- The artifact scanner runs without `--expected-support-origin` for a production release.
- Tarball text contains `sk_`, `rk_`, `whsec_`, `gh*`, `*_SECRET`, `*_TOKEN`, `*_PASSWORD`, or raw hosted project IDs outside the allowed launcher assignment.

**Phase to address:**

Phase 2 — Reproducible Package Artifact; permissions enforced in Phase 3.

---

### Pitfall 7: Release reruns attempt to overwrite an immutable npm version

**Confidence:** HIGH

**What goes wrong:**

A partially successful workflow is rerun and fails because `name@version` already exists, or maintainers unpublish in an attempt to retry and discover that npm never permits reuse of that name/version. A failed post-publish GitHub release step can leave npm live while GitHub appears failed. A careless second publish may instead advance or corrupt `latest` with an unreviewed new version.

**Why it happens:**

CI workflows are routinely rerun from the top, but npm versions are immutable. Unpublish is restricted, irreversible, and not a rollback mechanism. Staged publishing adds review before a version goes live, but cannot stage a brand-new package and its approve/reject/list/view operations require interactive authentication rather than OIDC.

**How to avoid:**

**Required:** define release state explicitly. Before upload, check whether the exact version exists. If absent, publish/stage the one verified tarball. If present, compare registry integrity, provenance, commit, and expected dist-tag; treat an exact match as an idempotent completed publish and continue only missing post-publish steps, otherwise stop for human recovery. Serialize releases with GitHub concurrency and make version/tag agreement a gate. Never rebuild under an already published version.

**Optional hardening:** after the initial package exists, use `npm stage publish` with npm 11.15.0 or later; have a maintainer download/review the staged tarball and approve it with 2FA. This separates CI upload from public visibility but does not replace rerun handling.

**Warning signs:**

- The workflow always executes `npm publish` on rerun without querying registry state.
- A Git tag and `package.json` version differ.
- Recovery instructions say “unpublish and try the same version again.”
- npm is live but the GitHub release or marketplace update failed afterward.

**Phase to address:**

Phase 3 — Trusted Release Automation.

---

### Pitfall 8: Copying the existing skill into npm is mistaken for marketplace publication

**Confidence:** HIGH for Claude Code packaging behavior; MEDIUM for ShipWithAI acceptance and source governance

**What goes wrong:**

The npm tarball contains `.kimi-code/skills/cumpa/SKILL.md`, yet `/plugin install cumpa@shipwithai` cannot find or load a valid plugin. Claude Code installs a plugin directory into its cache; files outside that directory are not copied, and relative references escaping it fail. ShipWithAI expects plugin/catalog metadata and a `plugins/<plugin>/skills/<skill>/SKILL.md`-style package, not merely Cumpa's existing npm allowlist path.

**Why it happens:**

The previous local/manual installation deliberately shipped one checked-in skill file without an installer or plugin framework. A ShipWithAI listing is a second distribution contract: the root marketplace catalog, plugin source, plugin manifest, skill registry, README/changelog, and skill files must agree. The marketplace can vendor a plugin or point to another GitHub source, and those choices have different ownership and update behavior.

**How to avoid:**

**Required:** choose one explicit plugin source model with ShipWithAI maintainers:

- **Vendored in `ShipWithAI/shipwithai-plugins`:** copy the approved skill into a complete plugin directory and add an automated/manual byte-equivalence gate against `.kimi-code/skills/cumpa/SKILL.md` for every release; or
- **Cumpa-owned external source:** add a complete plugin directory in the Cumpa repository and reference it from the ShipWithAI catalog with a full 40-character commit SHA (and optional readable tag/ref).

In either model, keep one authoritative skill body, validate the marketplace/plugin manifests, install the real catalog entry, and invoke the installed namespaced skill. Do not rely on `../` references into the npm package or another repository.

**Warning signs:**

- The implementation changes only `package.json.files` or the current `.kimi-code` directory.
- The ShipWithAI catalog entry has no installable plugin directory/source.
- A plugin works with `--plugin-dir` from a checkout but fails after cached installation.
- The marketplace copy and repository copy of `SKILL.md` differ.

**Phase to address:**

Phase 4 — ShipWithAI Plugin Publication.

---

### Pitfall 9: Marketplace version and source metadata drift, leaving users on stale code

**Confidence:** HIGH for Claude Code update/cache behavior; MEDIUM for ShipWithAI operational enforcement

**What goes wrong:**

A corrected skill is merged, but existing users retain the old cached plugin; the root marketplace catalog advertises one version while `plugin.json`, README, manifest, or fetched source supplies another. Rollback by changing files without changing the resolved version also has no effect. ShipWithAI's own `marketplace-version-truth.md` documents real catalog/plugin/README version drift.

**Why it happens:**

Claude Code copies plugins into a versioned cache. If an explicit plugin version is declared, users update only when that value changes. If both the marketplace entry and `plugin.json` declare a version, `plugin.json` wins without warning. Marketplace source and external plugin source are pinned independently. An unpinned default branch updates unexpectedly; an immutable SHA never updates until the catalog changes. Users also need a marketplace refresh before the catalog change is visible.

**How to avoid:**

**Required:** use a single version authority where ShipWithAI conventions permit it, bump it for every content change, and synchronize the root catalog, plugin manifest/registry, README, and changelog in one PR. Prefer an immutable 40-character SHA for a cross-repository Cumpa plugin and update both SHA and plugin version deliberately. Preserve the stable plugin name; if it must change or be removed, use Claude Code's append-only top-level `renames` mapping. Validate after every catalog edit and prove update from the previously released version, not only a clean install.

**Warning signs:**

- The same version appears in both catalog and `plugin.json` and they disagree.
- Skill bytes change without a plugin-version or source-SHA change.
- The listing points at a mutable default branch.
- A maintainer says “pull main” while installed users still execute cached content.
- A plugin rename removes the old name without a `renames` entry.

**Phase to address:**

Phase 4 — ShipWithAI Plugin Publication; update behavior verified in Phase 5.

---

### Pitfall 10: The skill installs successfully but cannot drive the released CLI

**Confidence:** HIGH

**What goes wrong:**

Claude Code reports the plugin installed, but the skill finds no `cumpa` command, finds the unrelated registry package, runs on unsupported Node/Git, or sends a request the released CLI no longer accepts. The current skill depends on external `cumpa` and Git executables, sends strict `schemaVersion: 1` revision/patch JSON over stdin, and accepts only exit zero plus one `kind: "cumpa/export"` JSON object. Its example shell command uses POSIX `env -u`, which is not a portable Windows command.

**Why it happens:**

Marketplace installation copies instructions; it does not install or version the external CLI. Plugin version and npm version are independent. Testing against a source checkout, globally linked CLI, or local dependency can hide both the npm name collision and protocol drift. `npx` can also resolve a matching local dependency before fetching a remote package.

**How to avoid:**

**Required:** the listing and plugin README must state the exact public CLI prerequisite (`npm install -g cumpa` only after the name issue is resolved), Node `>=24`, Git `>=2.43.0`, supported platforms, and the compatible Cumpa npm/plugin or protocol range. Keep the existing strict result validation. Test from clean homes/caches with the actual registry tarball, no `npm link`, and no local `cumpa` dependency: global command flow, `npx` flow, then the marketplace-installed skill's full stdin/stderr/stdout handoff. If Windows is supported, replace or supplement `env -u` and POSIX redirection with platform-appropriate instructions. Bump the plugin whenever its prerequisite or protocol contract changes.

**Optional enhancement:** expose a cheap `cumpa --version`/protocol compatibility query so agents and support diagnostics can identify the installed artifact. Do not make this a v1.5 blocker if exact end-to-end artifact tests and documentation prove compatibility.

**Warning signs:**

- Plugin installation is the only acceptance test.
- `which cumpa`/`Get-Command cumpa` points to a linked checkout or unrelated package.
- Tests run inside this repository, allowing `npx` to prefer local dependencies.
- The skill and CLI advertise different schema versions or export kinds.
- Public docs say cross-platform while the skill publishes only POSIX invocation syntax.

**Phase to address:**

Phase 4 for the compatibility declaration; Phase 5 for clean end-to-end proof.

---

### Pitfall 11: One person or one repository becomes an unrecoverable release dependency

**Confidence:** MEDIUM because platform permissions are known but ShipWithAI continuity policy is not published

**What goes wrong:**

Cumpa cannot publish, update, deprecate, or repair either distribution channel because the only npm owner is unavailable, the ShipWithAI catalog maintainer cannot merge, or ownership between `Ship-With-AI/cumpa` and `ShipWithAI/shipwithai-plugins` is unclear. Adding many npm owners as a shortcut increases takeover risk because npm owner access is full maintainer access, not a granular read/write role.

**Why it happens:**

The npm package, GitHub workflow/environment, Cumpa source, and external marketplace have separate access systems. The ShipWithAI repository currently describes a one-developer team, and no formal external submission SLA or ownership-transfer policy was found. Marketplace `owner` metadata is contact information, not enforcement of source ownership.

**How to avoid:**

**Required:** record at least two accountable maintainers for package continuity; require 2FA; protect release tags/environments; audit npm owners and trusted-publisher connections; and document who can merge the ShipWithAI listing and who owns the Cumpa plugin source. After OIDC succeeds, revoke automation tokens and select npm's “Require two-factor authentication and disallow tokens” package setting. Keep npm owners few because each can publish and add more owners. Agree with ShipWithAI on update/rollback responsibility before launch.

**Warning signs:**

- Only one person can see npm package settings or approve a staged package.
- A long-lived npm token is retained as the undocumented emergency path.
- No one owns marketplace version bumps after the initial PR.
- The catalog's owner field is treated as proof of repository or npm authority.

**Phase to address:**

Phase 1 for ownership; Phase 3 and Phase 4 for operational controls on each channel.

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Treat local `name: cumpa` as a registry reservation | Avoids an early product decision | Release automation is built around an identity the team cannot publish | Never |
| Remove `private` but leave placeholder/public metadata unfinished | Small manifest diff | Misleading immutable release, failed OIDC repository match, unclear license/support | Never for a public release |
| Publish from the working directory after separately approving a tarball | One fewer artifact handoff | `prepack` rebuild can publish different bytes | Never |
| Let native support equal the release runner platform | Simple workflow | Capability changes silently by runner | Never without explicitly declaring the reduced capability |
| Add `binding.gyp`/native source so consumers compile | Avoids prebuild distribution | Installs depend on compilers, Python/node-gyp, headers, and target ABI | Only after a deliberate supported-platform design and clean-install matrix |
| Duplicate `SKILL.md` in ShipWithAI by hand | Fast initial PR | Marketplace and npm/source copies drift | Only with an enforced equivalence/version update gate |
| Point the catalog at a default branch | Updates without release work | Installed content changes outside an immutable release review | Only for development, never stable public distribution |
| Declare plugin version in two places | Looks explicit | Stale `plugin.json` silently masks catalog updates | Never |
| Keep a classic npm automation token as fallback | Familiar emergency path | Reintroduces long-lived publish credentials | Never after trusted publishing is verified |
| Document release recovery only in a maintainer's memory | No documentation task | Reruns, deprecation, dist-tags, and marketplace rollback become improvisation | Never before first public release |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| npm registry identity | Assume the GitHub/project name grants the unscoped npm name | Resolve the live `cumpa` owner/history first; transfer plus migration plan or change the product requirement |
| npm manifest | Leave `private`, missing `repository.url`, ambiguous tag/access, or no license | Finalize public metadata and verify the packed `package/package.json` |
| npm pack/publish lifecycle | Inspect `dist/`, then allow `prepack` to rebuild at publish | Build, pack, digest, inspect, smoke, and publish one immutable `.tgz` |
| Vite/Fastify | Verify Node CLI files only | Extract the tarball, start its CLI, load `dist/web/index.html`, and fetch every referenced asset |
| Native addon | Confuse Node-API ABI stability with OS/CPU portability | Include/test each intended target binary or explicitly degrade/restrict support |
| npm trusted publisher | Enter an approximate repo/workflow, or configure the callee of a reusable workflow | Match exact case-sensitive owner/repo/calling filename/environment; add `id-token: write`; use cloud-hosted runner |
| npm provenance | Expect OIDC alone to attest a private source repository | Make source repo and package public and verify the emitted attestation |
| Support service | Copy deployment secrets into publication | Pass only the canonical public Supabase origin; scan the exact tarball |
| Staged publishing | Use it for the first-ever package version or attempt OIDC approval | Bootstrap an existing owned package first; CI stages, a human reviews and approves with 2FA |
| ShipWithAI catalog | Treat `.kimi-code/skills/cumpa/` as a plugin | Create a self-contained plugin source and all required catalog/manifest metadata |
| Claude plugin cache | Change skill content without a resolved version change | Bump one version authority and immutable source pin; test an update from prior release |
| External CLI prerequisite | Assume plugin installation installs Cumpa | State and verify CLI, Node, Git, platform, and protocol requirements separately |
| Organization names | Conflate `Ship-With-AI` source owner with `ShipWithAI` marketplace owner | Use exact platform identifiers and document cross-repository responsibility |

## Performance Traps

There is no relevant server-scale performance problem in this distribution milestone. The material costs happen on every install or `npx` cold run.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Shipping unintended files or duplicate build trees | Slow downloads, large npm `unpackedSize`, secret-scan noise | Keep the narrow `files` allowlist; record file count/packed/unpacked sizes and diff them per release | Every global install and cold `npx` run |
| Consumer-side native compilation | Installs take minutes or fail looking for Python/compiler/headers | Prefer verified prebuilt optional binary behavior; keep `binding.gyp` out unless compilation is intentional | First consumer without the exact native toolchain |
| Re-downloading a large external plugin repository | Slow marketplace add/update | Use ShipWithAI's established catalog and a focused plugin source/subdirectory; do not add generated/build assets | First clean marketplace install on a slow network |
| Testing warm `npx` only | Fast CI hides cold download/start failures | Test once with isolated npm cache and home, then separately test warm repeat behavior | First new user's invocation |

## Security Mistakes

Domain-specific security issues beyond general application security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Long-lived npm token in GitHub Secrets | **CRITICAL:** repository/workflow compromise yields reusable publish authority | OIDC trusted publishing only; omit `NODE_AUTH_TOKEN`; disallow tokens after verification |
| Publishing from the secret-rich production deployment job | **HIGH:** one compromised build step gains support infrastructure secrets plus npm identity | Separate least-privilege release job/workflow; pass only non-secret support origin |
| Private source or disabled provenance | **HIGH:** public package lacks verifiable source/build attestation | Public repository/package, GitHub OIDC, provenance enabled, registry attestation gate |
| Mutable marketplace branch source | **HIGH:** installed skill bytes can change outside a pinned review | Pin external plugin source by full SHA and deliberately bump version/SHA |
| Unscanned generated tarball | **CRITICAL:** credentials or private hosted-service code become permanently downloadable | Scan/extract the exact tarball; rotate immediately if anything leaks |
| Broad npm ownership | **HIGH:** any owner can publish, alter metadata, and add owners | Minimal set of at least two accountable 2FA owners; audit regularly |
| Unprotected tag/release trigger | **HIGH:** unauthorized commit can obtain a valid workflow OIDC token | Protected tags/environment approval and exact trusted-publisher workflow binding |
| Unexpected install scripts/native build | **HIGH:** consumer install executes compilation or lifecycle code not reviewed as runtime | Inspect packed manifest/files and clean install logs; ship no install hook unless explicitly designed |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Advertising `npx cumpa` before name resolution | Users fetch an unrelated function-composition package or get no `cumpa` executable | Do not publish the command until the live registry identity is correct and verified |
| Calling marketplace setup “one step” from a fresh machine | Users discover they must first register the marketplace | Say `/plugin install cumpa@shipwithai` is one install step **after** `/plugin marketplace add ShipWithAI/shipwithai-plugins` |
| Plugin installs but prerequisite does not | `/cumpa` fails only when invoked | Show CLI/Node/Git requirements in listing and fail with direct installation guidance |
| Engine constraint treated as enforcement | Older Node may install with a warning and fail at runtime | State Node 24 prominently and emit a clear runtime prerequisite error |
| Native capability silently absent | macOS arm64 user receives weaker behavior than source builds | Publish/verify intended binary or clearly label unsupported re-export capability |
| Stale marketplace cache | User follows updated docs but runs old skill | Bump resolved plugin version and document marketplace/plugin update commands |
| POSIX-only skill commands under cross-platform claims | Windows agents cannot execute `env -u` or shell redirection as written | Declare platform scope or provide tested platform-specific invocation |
| No inspectable version identity | Support cannot tell which CLI/plugin pair is running | Keep release metadata visible; optional `cumpa --version` improves diagnosis |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **npm identity:** Current owner, transfer/migration decision, inherited version history, and exact acceptance command are resolved—not merely the local package name.
- [ ] **Public manifest:** `private` is removed; release version, license, repository, bugs/homepage, Node engine, access, registry, bin, and dist-tag are intentional in the packed manifest.
- [ ] **Exact tarball:** The artifact that passed inventory, secret/support scan, extraction, and checksum verification is the artifact submitted to npm.
- [ ] **Browser bundle:** An extracted clean install starts and serves `index.html` plus every referenced Vite asset.
- [ ] **Native policy:** The final tarball has the intended Darwin arm64 addon behavior and cleanly handles every other declared platform without consumer compilation surprises.
- [ ] **Support configuration:** Exactly one canonical production Supabase origin is embedded; no secret, raw project ref, or legacy hosted runtime is present.
- [ ] **Trusted publisher:** Exact `Ship-With-AI/cumpa` repository, calling workflow filename, optional environment, hosted runner, `contents: read`, and `id-token: write` agree with npm settings.
- [ ] **No publish token:** The workflow has no npm automation token; package settings require 2FA and disallow tokens after migration.
- [ ] **Provenance:** Source repository and package are public, and the released npm version visibly carries the expected repository/commit attestation.
- [ ] **Release rerun:** Re-executing a successful or post-publish-failed workflow recognizes an identical existing version and never tries to overwrite it.
- [ ] **Rollback:** Maintainers can deprecate a bad version, publish a corrected higher version, and repair dist-tags without assuming unpublish/version reuse.
- [ ] **Global install:** `npm install -g cumpa@<released-version>` in a clean prefix exposes the generated `cumpa` executable and launches the browser surface.
- [ ] **npx install:** `npx --yes cumpa@<released-version>` in a clean project/home/cache resolves the registry release rather than a local dependency or old package.
- [ ] **Marketplace package:** The ShipWithAI catalog entry resolves a self-contained valid plugin, not only `.kimi-code/skills/cumpa/SKILL.md` inside npm.
- [ ] **Marketplace version truth:** Catalog, plugin manifest/registry, README/changelog, immutable source pin, and installed cached version agree.
- [ ] **One-step claim:** The docs distinguish initial marketplace registration from the subsequent one-command plugin install.
- [ ] **Skill prerequisite:** Listing declares public CLI command, Node 24, Git 2.43, platform scope, and supported CLI/protocol version.
- [ ] **Agent handoff:** A marketplace-installed skill drives the released npm CLI through real stdin/stderr/stdout and accepts only the canonical successful JSON result.
- [ ] **Plugin update/rollback:** Updating from the previous cached plugin selects the new version; a corrected rollback release also changes the resolved version.
- [ ] **Operational ownership:** At least two accountable 2FA maintainers can manage npm continuity, and ShipWithAI/Cumpa responsibilities are recorded.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Bare npm name cannot be acquired safely | HIGH | Stop release automation against `cumpa`; obtain product approval for a new/scoped name and update the acceptance commands, or negotiate an explicit owner migration. There is no technical alias that makes `npx cumpa` resolve a scoped package. |
| `private`/metadata blocks publish before upload | LOW | Correct manifest on a new commit/tag, re-pack, re-verify, then publish. No registry recovery is needed. |
| Bad bytes published under a version | HIGH | Deprecate the bad version with a precise message, publish a corrected new immutable version, verify it, and move the intended dist-tag. Do not plan to reuse the version. |
| Wrong dist-tag only | MEDIUM | Verify the desired version's integrity/provenance, then move the dist-tag; leave immutable version records intact. |
| Secret published in tarball | CRITICAL | Revoke/rotate it immediately, audit use, deprecate the release, publish clean new version, and follow npm unpublish policy only if eligible; assume downloaded bytes persist. |
| Missing browser assets/support origin/native addon | HIGH | Deprecate affected version, fix the artifact pipeline, publish a new version, repeat clean global/npx/browser matrix. |
| Trusted publisher misbound | MEDIUM | Delete the immutable connection, recreate it with exact owner/repo/calling workflow/environment, and retry only if the package version was not published. |
| Publish succeeded but workflow later failed | MEDIUM | Verify registry integrity/provenance against the expected tarball; if identical, mark publish complete and resume only downstream GitHub/marketplace steps. |
| Release lacks provenance | HIGH | Fix repository visibility/OIDC/provenance settings and issue a new verified version; do not describe the unattested version as provenance-backed. |
| Bad staged package | LOW before approval | Reject interactively with 2FA, repair, rebuild, and create a new stage. Do not approve solely because CI succeeded. |
| Marketplace content wrong but version unchanged | MEDIUM | Correct content, bump the resolved plugin version/source SHA, update catalog/docs together, validate, and tell affected users to refresh/update. |
| Plugin/CLI protocol mismatch | HIGH | Roll forward whichever artifact is wrong, declare the compatible pair, bump its immutable version, and rerun the marketplace-installed end-to-end flow. |
| Plugin renamed/removed | MEDIUM | Restore the stable name or add an append-only `renames` entry; validate migration and update managed settings that cannot be rewritten automatically. |
| Sole maintainer unavailable | HIGH | Use the second accountable owner for npm recovery and the agreed ShipWithAI maintainer path; if neither exists, contact platform support and pause releases. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Occupied bare npm name | Phase 1 | Cumpa maintainers can access the live package settings; owner/history/migration and acceptance-command decision are recorded |
| 2. Private placeholder manifest | Phase 1 | Packed `package.json` has intentional immutable version, public metadata/access, exact repository URL, license, engines, and bin |
| 3. Inspected bytes differ from published bytes | Phase 2 | One recorded tarball digest survives build, scan, extraction, smoke, artifact transfer, and publish |
| 4. Runner-specific native capability | Phase 2 | Declared target loads the prebuilt addon; every other supported target installs/starts and reports the intended fallback |
| 5. OIDC/provenance mismatch | Phase 3 | Token-free GitHub-hosted workflow publishes/stages successfully and npm attestation names the expected public repo/commit |
| 6. Support config omission/leak | Phase 2 | Exact tarball contains one allowed origin assignment and zero protected/legacy values |
| 7. Immutable-version rerun failure | Phase 3 | Workflow rerun recognizes identical live version; documented bad-version recovery uses deprecation/new version/dist-tag |
| 8. npm skill mistaken for plugin | Phase 4 | `/plugin install cumpa@shipwithai` installs a self-contained plugin from the real catalog |
| 9. Marketplace version/source drift | Phase 4 | Previous cached install updates to reviewed bytes; catalog, manifest, docs, version, and source pin agree |
| 10. Installed skill cannot drive CLI | Phase 5 | Clean marketplace-installed skill completes one real canonical request against the registry-installed CLI |
| 11. Ownership continuity | Phases 1, 3, 4 | Two accountable 2FA maintainers and cross-repository release/rollback responsibility are demonstrated/documented |
| Global and `npx` resolution ambiguity | Phase 5 | Isolated prefix/project/home/cache runs resolve the exact expected npm version and executable |
| Misstated one-step marketplace UX | Phase 4 | Fresh-user docs show marketplace add once and one-command plugin installation afterward |

## Sources

### Primary platform documentation — HIGH confidence

- [npm registry metadata for `cumpa`](https://registry.npmjs.org/cumpa) and [`cumpa/latest`](https://registry.npmjs.org/cumpa/latest) — live package identity, current owner/project, versions, latest version, and tarball integrity.
- [npm package name guidelines](https://docs.npmjs.com/package-name-guidelines/) — uniqueness and non-confusing unscoped names.
- [npm `package.json` documentation](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) — `private`, `files`, `bin`, `engines`, `os`/`cpu`, metadata, and `publishConfig` contracts.
- [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish/) — immutable name/version, accepted tarball input, included-files inspection, access, and dist-tags.
- [npm lifecycle scripts](https://docs.npmjs.com/cli/v11/using-npm/scripts/) — `prepack` ordering and implicit `node-gyp rebuild` when packed root `binding.gyp` is present without install scripts.
- [npm owner](https://docs.npmjs.com/cli/v11/commands/npm-owner/) — full maintainer powers and owner management.
- [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/) — OIDC requirements, exact GitHub identity, npm/Node minimums, hosted-runner limitation, provenance prerequisites, token disallowance, allowed actions, and connection replacement.
- [npm staged publishing](https://docs.npmjs.com/staged-publishing/) — existing-package prerequisite, stage/review/download/approve flow, npm 11.15.0 minimum, and interactive 2FA approval.
- [npm unpublish policy](https://docs.npmjs.com/policies/unpublish/) — time/dependency/download/owner restrictions, irreversibility, 24-hour name hold, and permanent version non-reuse.
- [npm `npx`](https://docs.npmjs.com/cli/v11/commands/npx/) — local dependency precedence, cache installation, install prompt, and single-bin inference.
- [Node.js C++ addons](https://nodejs.org/api/addons.html) and [Node-API](https://nodejs.org/api/n-api.html) — native shared-library deployment and ABI stability boundaries.
- [Claude Code plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) — marketplace/install separation, self-contained cached plugins, source pins, version resolution, updates, validation, and append-only renames.

### Established marketplace evidence — HIGH for current repository structure, MEDIUM for future acceptance/governance

- [ShipWithAI plugin marketplace repository](https://github.com/ShipWithAI/shipwithai-plugins) — established marketplace and public install path.
- [ShipWithAI root marketplace manifest](https://raw.githubusercontent.com/ShipWithAI/shipwithai-plugins/main/.claude-plugin/marketplace.json) — current catalog entries, owners, sources, categories, tags, and versions.
- [ShipWithAI repository conventions](https://raw.githubusercontent.com/ShipWithAI/shipwithai-plugins/main/CLAUDE.md) — plugin/skill/manifest layout, synchronization rules, line limits, and project testing expectations.
- [ShipWithAI marketplace version-truth report](https://raw.githubusercontent.com/ShipWithAI/shipwithai-plugins/main/docs/marketplace-version-truth.md) — documented catalog/plugin/README drift and cross-repository source-version ambiguity.
- [ShipWithAI starter plugin manifest](https://raw.githubusercontent.com/ShipWithAI/shipwithai-plugins/main/plugins/starter/.claude-plugin/plugin.json) — concrete plugin metadata and skill path declaration.

### Cumpa repository evidence — HIGH confidence for current implementation

- `package.json` — private `cumpa@0.0.0`, Node `>=24`, bin target, `dist/` and `.kimi-code/skills/cumpa/` allowlist, and full-build `prepack`.
- `.git/config` — origin `Ship-With-AI/cumpa`, which differs from the `ShipWithAI` marketplace organization spelling.
- `.github/workflows/deploy-supabase-production.yml` — only current workflow; combines production deployment secrets with package build/artifact generation and runs on Ubuntu.
- `scripts/build-bin.mjs` — generated launcher and canonical optional release support-origin embedding.
- `scripts/build-native-addon.mjs` — Darwin arm64-only compilation and deletion on every other build target.
- `scripts/verify-production-artifacts.mjs` — current package inventory, secret/legacy-runtime scan, and exact support-origin assignment checks.
- `vite.config.ts` and `src/server/app.ts` — `dist/web` production output and Fastify's relative static-root contract.
- `src/server/native-exchange-capability.ts` — missing/load/probe failures downgrade to `reExportUnsupported`.
- `.kimi-code/skills/cumpa/SKILL.md` — external CLI/Git prerequisites, POSIX invocation, request schema 1, exit/result validation, and canonical export contract.

---
*Pitfalls research for: Cumpa v1.5 Public Distribution*
*Researched: 2026-09-04*
