# Feature Research: Cumpa v1.5 Private Distribution

**Domain:** Proprietary public npm CLI from a private GitHub repository, with an independently MIT-licensed public marketplace skill  
**Researched:** 2026-09-06  
**Overall confidence:** MEDIUM — package, trusted-publishing, provenance, and marketplace mechanics are grounded in current first-party documentation and the existing Cumpa artifacts. The proposed release sequencing and clean-environment acceptance design are recommendations derived from those mechanics.

## Scope and Hard Constraint

This research covers only the new v1.5 distribution surfaces:

1. public distribution of the proprietary `@shipwithai/cumpa@1.5.0` package;
2. global and exact-version `npx` use of its existing `cumpa` executable;
3. publication from the private Cumpa GitHub repository through npm trusted publishing without a long-lived CI token;
4. exclusion of private development material from the public npm tarball;
5. independent publication of the existing thin Cumpa skill in the public ShipWithAI marketplace under MIT; and
6. released-artifact proof of the global, `npx`, and marketplace review flows.

Existing branch/worktree selection, browser review, persistence, export, agent-request protocol, and voluntary-support behavior are dependencies, not features to redesign.

### Blocking incompatibility: private repository and npm provenance

The requested conjunction of a **private source repository** and **npm provenance** is not supported. Current npm trusted-publishing documentation says provenance is automatically generated only when the package and source repository are public, and explicitly says provenance generation is not supported for private repositories even when the package is public. GitHub's changelog independently states the same restriction.

Trusted OIDC publishing itself still works from a private GitHub repository. Therefore v1.5 can satisfy repository privacy, public npm distribution, and tokenless trusted publishing, but it cannot also carry npm's provenance attestation under current platform rules.

This is a release-blocking requirement decision, not an implementation detail:

- **Recommended:** keep the repository private, publish through trusted OIDC without npm provenance, and explicitly amend the provenance acceptance criterion.
- **Alternative:** make the source repository public to obtain npm provenance; this violates the milestone's privacy constraint and is not recommended.

Do not set `publishConfig.provenance: true`, pass `--provenance`, claim a provenance badge, or invent a substitute attestation while the source repository remains private. Re-check npm support immediately before release in case the restriction changes.

## Table Stakes

Features users and release operators reasonably expect. Missing any P0 item makes distribution incomplete or misleading.

| Feature | Expected behavior | Complexity | Requirement-ready implications |
|---|---|---:|---|
| Public proprietary package identity | npm exposes exactly `@shipwithai/cumpa@1.5.0` with public access while the GitHub repository remains access-controlled. | Medium | Change the release manifest from `cumpa@0.0.0` and remove `private: true`; set public scoped access. Public access permits anyone to download the package and does **not** make its license open source. |
| Installed `cumpa` executable | Global install links a working `cumpa` command; the package retains Node `>=24`, its required Git baseline, and the existing executable entry point. | Low | Keep one `bin` entry pointing to the built Node executable and retain its `#!/usr/bin/env node` shebang. Do not introduce a wrapper installer. |
| Exact global install | `npm install --global @shipwithai/cumpa@1.5.0` installs the released version and `cumpa` launches the existing application. | Low | Acceptance must assert the reported version is `1.5.0` and complete an actual browser review from an unrelated fixture repository. |
| Exact-version one-shot execution | `npx --yes @shipwithai/cumpa@1.5.0` resolves the package's single bin and launches the same application without a prior global install. | Low | Use a clean npm cache and project with no matching local dependency; npm exec may otherwise reuse a local package and create false evidence. Do not accept a mutable `@latest`-only test. |
| Narrow, complete public tarball | The tarball contains only files needed to run and understand the released CLI: compiled Node/native runtime, browser assets, `package.json`, public README, proprietary license, and required third-party notices. | Medium | Use a positive `files` allowlist. Ensure every `bin`/runtime/static-asset target is included. Explicitly exclude TypeScript source, source maps, tests, fixtures, `.planning`, local `.cumpa` state, credentials, workflows, development configuration, and the marketplace skill. npm always includes `package.json`, README, and license files, so those root files must be public-safe. |
| Accurate proprietary license boundary | The application package is clearly proprietary while carrying required notices for bundled third-party software. | Medium | Use `"license": "SEE LICENSE IN LICENSE"` and a top-level proprietary `LICENSE` containing the intended end-user terms. Do not use MIT, GPL, another open-source SPDX identifier, or the skill's license for the application. `UNLICENSED` alone is too ambiguous for a publicly usable package. Obtain the actual terms before release rather than improvising them in build code. |
| Honest public-artifact disclosure | Documentation says the repository, history, TypeScript source, source maps, tests, and planning files remain private, but the npm tarball and every included compiled JavaScript/native/browser asset are publicly downloadable; JavaScript can be inspected. | Low | Describe this as development-material minimization, not source secrecy or technical prevention of reverse engineering. Minification or bundling is not a confidentiality control. |
| Accurate public metadata | npm metadata identifies the package, version, executable, Node requirement, proprietary license file, private repository identity needed by trusted publishing, and only real public-facing links. | Low | The case-sensitive `repository.url` must match the GitHub repository used by trusted publishing, even though unauthorized package users cannot browse it. Do not advertise a private issue tracker as a public support channel or fabricate homepage/bugs URLs. |
| Trusted OIDC publication | Stable releases publish from the exact private GitHub repository/workflow identity through npm trusted publishing, without `NODE_AUTH_TOKEN` or another long-lived publish secret. | High | Use npm `>=11.15.0`, account 2FA, a GitHub-hosted runner, `permissions: { contents: read, id-token: write }`, exact owner/repository/workflow filename/environment values, and a matching `repository.url`. Grant only publish permission unless staged publishing is actually used. |
| First-publication bootstrap | The npm package exists before its trusted-publisher relationship is configured. | Medium | The registry returned 404 for `@shipwithai/cumpa` on 2026-09-06, while `npm trust` requires an existing package. Perform one usable, proprietary prerelease/bootstrap publication through interactive maintainer authentication, under a non-`latest` prerelease version/tag; then configure trusted publishing. Do not publish a placeholder package. `1.5.0` itself must be published through OIDC. |
| Token shutdown after OIDC proof | Once the trusted workflow succeeds, ordinary automation tokens cannot publish the package. | Medium | Verify the OIDC path first, revoke obsolete npm automation tokens, then enable npm's package setting that requires 2FA and disallows tokens. Keep interactive account recovery separate from CI. |
| Explicit provenance resolution | Release criteria state that npm provenance is unavailable while the repository is private. | High | The milestone cannot be declared fully compliant with both original constraints. Record the approved requirement change or block release; do not silently omit provenance or falsely report it. |
| Public self-contained marketplace plugin | ShipWithAI's public marketplace contains a `cumpa` plugin with its own manifest, version, skill file, README/instructions as needed, and plugin-local MIT license. | Medium | Add it to `ShipWithAI/shipwithai-plugins` and `.claude-plugin/marketplace.json` following the existing plugin-directory convention. Set the plugin and skill metadata to MIT without changing the application package's proprietary terms. Installed plugins are copied to a cache, so the public plugin may not depend on files from the private checkout. |
| Separately installed CLI prerequisite | The skill states that `@shipwithai/cumpa` must be installed separately and that the `cumpa` executable must be on `PATH`. | Low | Preserve the existing preflight behavior. If the executable is absent, stop before constructing a review and give the exact install command. Do not bundle, download, or silently install the CLI from the skill. The v1.5 acceptance profile installs `@shipwithai/cumpa@1.5.0` explicitly. |
| Thin delegation to Cumpa | The skill handles prerequisite checking and the existing request/response handoff, while Cumpa remains the sole authority for Git grounding, diff generation, review UI, persistence, Finish semantics, and canonical JSON. | Low | Publish the existing thin skill behavior. Do not recreate Git selection, diff interpretation, review generation, output schemas, or application of feedback in marketplace code; do not have the agent review the diff itself. |
| Independent lifecycle guidance | Users can update or remove the CLI and skill independently without assuming either package manager controls the other. | Low | CLI update: `npm install --global @shipwithai/cumpa@latest`; CLI uninstall: `npm uninstall --global @shipwithai/cumpa`. Marketplace refresh/update follows Claude Code's marketplace auto-update and `/reload-plugins`; plugin removal uses `/plugin uninstall cumpa@shipwithai`. Removing one artifact must not claim to remove the other. |
| Released-artifact acceptance | Fresh global, exact-version `npx`, and marketplace installations each complete the real review contract without reading the Cumpa checkout. | High | Isolate npm prefix/cache, working repository, and Claude profile/cache. Install from the public npm registry and public marketplace, exercise the browser, Finish a review, and validate the canonical output/exit contract where applicable. Capture the resolved package/plugin versions and assert no checkout path, workspace link, local tarball, or prior install supplied the runtime. |
| Voluntary support remains feature-neutral | The published runtime preserves the already validated optional support flow and its canonical hosted endpoint/configuration; reviewing and export remain available without payment. | Low | Treat this as release-artifact preservation, not a support redesign. Do not add license activation, entitlement checks, paid features, nags tied to review completion, or payment-dependent behavior. |

## Differentiators

These are valuable because they make a proprietary local-first application installable without confusing its legal, trust, or agent boundaries.

| Feature | Value | Complexity | Notes |
|---|---|---:|---|
| Deliberate two-artifact license boundary | Users can inspect and share the small integration layer under MIT without receiving open-source rights to the application. | Medium | npm package: proprietary terms. Public marketplace plugin: MIT metadata and license text. Third-party notices retain their own terms. |
| Private development, honest public runtime | Cumpa withholds repository history and development artifacts without pretending public executable bytes are secret. | Low | This is a truthful and supportable boundary; obfuscation would not strengthen the legal license or npm transport. |
| One review authority across all launch paths | Global, `npx`, and marketplace launches all reach the same existing Cumpa review engine and canonical export contract. | Low | The skill delegates rather than creating a second review implementation that could drift. |
| Immutable acceptance evidence | Exact versions and isolated caches prove what users receive rather than what happens to work in a maintainer checkout. | Medium | Record `1.5.0`, plugin version, registry/catalog sources, and completed review outputs. Keep `latest` only for intentional upgrade guidance. |
| Tokenless stable publication from private CI | A compromised long-lived npm automation token is removed from the stable release path while private source remains in the private repository. | Medium | OIDC improves publication authentication even though npm provenance remains unavailable for the private source repository. |

## Anti-Features

Explicitly out of scope or harmful for v1.5:

| Anti-feature | Why not add it | Use instead |
|---|---|---|
| Public Cumpa source repository or history | Violates the defining privacy constraint. | Private GitHub repository plus public npm runtime artifact. |
| Open-source license for the application | MIT/GPL/Apache metadata would grant rights the proprietary product is not intended to grant. | Custom proprietary terms referenced by `SEE LICENSE IN LICENSE`. |
| Claim that npm distribution hides implementation | Public npm packages are downloadable and compiled JavaScript/browser assets are inspectable. | State the real boundary: private development artifacts and history, public compiled runtime. |
| TypeScript source or source maps in the package | Source maps can disclose source paths or embedded source and are unnecessary for the requested public runtime. | Production compiled assets without `.ts`, `.tsx`, `.map`, inline source maps, or `sourcesContent`. |
| Tests, fixtures, planning files, CI/configuration, or Git data in the package | They increase disclosure and package size without helping users run Cumpa. | Positive runtime allowlist plus packed-manifest inspection. |
| Marketplace skill inside the proprietary npm tarball | It blurs licensing and lifecycle boundaries and recreates the old copy-from-global-package installation path. | Publish the independently MIT-licensed plugin in `shipwithai-plugins`. |
| CLI bundled or installed by the skill | Plugin installation should not execute an implicit application install or own the npm lifecycle. | Declare the external CLI prerequisite and fail with an actionable command. |
| Review/Git/protocol logic copied into the skill | A second implementation will drift and can violate local Git or export guarantees. | Existing thin request/response adapter delegating to `cumpa`. |
| Long-lived npm publish token in GitHub secrets | Defeats the trusted-publishing requirement and expands credential risk. | OIDC trusted publisher for `1.5.0` and subsequent stable releases. |
| Placeholder bootstrap package | It creates a public, installable package that misrepresents the product and can capture `latest`. | Usable proprietary prerelease under a non-`latest` dist-tag, followed by trusted `1.5.0`. |
| Provenance flag or badge from the private repository | npm does not support the claimed attestation and an attempted forced configuration can fail publication. | Explicitly resolve the requirement conflict; re-evaluate only when npm documents support. |
| Public release-repository mirror as provenance theater | A second repo of prebuilt bytes would add operational weight and could misrepresent where the package was built from. | Keep one private source/release repository and use trusted OIDC honestly. |
| Checkout-, workspace-, link-, or local-tarball-based acceptance | It can pass while the released package or marketplace artifact is incomplete. | Isolated installs from the public registry/catalog only. |
| `@latest` as the only acceptance target | It is mutable and does not prove the named release. | Exact `@shipwithai/cumpa@1.5.0`; document `@latest` only as update intent. |
| Custom installer, self-updater, or uninstall daemon | npm and Claude Code already own those lifecycles. | Native npm and marketplace commands. |
| New review behavior | Existing product behavior is already validated and outside the replacement milestone. | Package and delegate the existing behavior unchanged. |
| Payment or license activation gates | Contradicts voluntary support and changes product semantics. | Preserve the optional support path with all review features available regardless of payment. |

## Feature Dependencies

```text
Existing compiled CLI/server/browser runtime
    ├── public-safe README + proprietary LICENSE + third-party notices
    ├── release metadata (@shipwithai/cumpa, 1.5.0, bin, engines, repository)
    └── positive runtime files allowlist
            └── packed artifact completeness/privacy inspection
                    └── usable bootstrap prerelease (package must exist)
                            └── npm trusted-publisher configuration
                                    └── OIDC publication of 1.5.0
                                            ├── clean global review proof
                                            └── clean exact-version npx review proof

Private GitHub repository
    ├── enables private source/history
    ├── can use npm trusted OIDC publication
    └── blocks npm provenance under current npm rules  <-- requirement conflict

Existing Cumpa agent request/Finish/canonical JSON contract
    └── existing thin skill
            ├── self-contained public plugin + MIT license
            ├── explicit separately installed cumpa prerequisite
            └── public ShipWithAI marketplace entry
                    └── clean marketplace review proof
                            └── depends on released CLI and global artifact proof

Existing voluntary-support behavior + release configuration
    └── included in released runtime unchanged
            └── available but non-gating in every launch path
```

### Dependency notes

- **Legal and artifact boundaries precede publication.** Because npm always packs metadata and certain root documentation/license files, those files must be public-safe before the first bootstrap publication, not only before `1.5.0`.
- **Bootstrap precedes trust.** Current `npm trust` requires an already-existing package. The registry returned 404 for `@shipwithai/cumpa` on the research date, so a one-time interactive publication is unavoidable unless npm changes this rule before implementation.
- **OIDC proof precedes token lockdown.** Disallowing tokens before the trusted workflow works can strand the release. Prove OIDC, then revoke/disallow tokens.
- **Packed completeness precedes clean install proof.** Global and `npx` tests must consume the actual registry artifact; local builds cannot compensate for missing files.
- **The CLI precedes the skill.** The marketplace plugin is useful only when the independently managed `cumpa` executable is present.
- **The skill depends on contracts, not implementation files.** Its stable dependency is the existing CLI request/Finish/canonical JSON behavior; it must not import private modules.
- **Marketplace acceptance comes last.** First prove the released CLI alone, then prove the public plugin delegates to that same installed artifact.
- **Repository privacy conflicts with provenance.** No dependency ordering resolves this; a requirement decision or future npm capability is required.

## v1.5 Launch Definition

### Required before release

1. **Resolve the provenance contradiction.** Preserve the private repository and formally accept trusted OIDC without npm provenance, or do not claim the milestone is complete.
2. **Define the proprietary distribution terms.** Provide the actual application `LICENSE`; retain applicable third-party notices; keep the marketplace plugin's MIT terms separate.
3. **Create a public-safe release manifest and documentation.** Use `@shipwithai/cumpa@1.5.0`, public scoped access, the existing `cumpa` bin, Node `>=24`, exact private repository metadata, a narrow runtime allowlist, and install/update/uninstall guidance. Remove old checkout/link/copy-the-skill guidance from public package documentation.
4. **Prove the packed boundary.** Confirm required runtime/browser/native assets are present and prohibited development artifacts, source maps, and the skill are absent. Record the tarball filename, integrity/hash, file list, unpacked size, and package metadata as release evidence.
5. **Bootstrap the package safely.** Publish a complete proprietary prerelease interactively under a non-`latest` tag because the package must exist before trusted-publisher configuration.
6. **Configure and prove trusted publishing.** Bind npm to the exact GitHub Actions workflow on a GitHub-hosted runner with `contents: read` and `id-token: write`; publish `1.5.0` without a long-lived token; then revoke/disallow obsolete tokens.
7. **Prove clean npm flows.** From isolated npm prefixes/caches and an unrelated Git fixture, install/run exact `1.5.0`, complete a browser review, and verify the resulting contract. Repeat through exact-version `npx` with no global or local match.
8. **Publish the MIT marketplace plugin.** Copy only the existing thin skill into a self-contained `cumpa` plugin in `ShipWithAI/shipwithai-plugins`, add accurate manifest/catalog versions and MIT license text, and declare the separately installed CLI prerequisite.
9. **Prove the clean marketplace flow.** From an isolated Claude profile and unrelated Git fixture, add the public ShipWithAI marketplace, install `cumpa@shipwithai`, install the CLI separately, invoke the namespaced skill, finish a browser review, and validate canonical JSON. Prove the runtime came from npm and the skill came from the marketplace cache, not the private checkout.
10. **Preserve support behavior.** Ensure the release build carries the existing voluntary-support configuration and that declining or ignoring support never changes review availability or output.

### Clean acceptance matrix

| Flow | Clean setup | Required exercise | Evidence |
|---|---|---|---|
| Global | Fresh npm prefix and cache; no Cumpa checkout, link, local dependency, or prior `cumpa` on `PATH` | `npm install --global @shipwithai/cumpa@1.5.0`; verify exact version; launch from an unrelated Git fixture; select/confirm commits; open browser; save feedback; export/finish as appropriate | Registry URL/version/integrity, resolved executable path under isolated prefix, browser completion, output files or canonical result, successful exit |
| Exact `npx` | Fresh npm cache and empty project; no global or local Cumpa | `npx --yes @shipwithai/cumpa@1.5.0`; complete the same real review path | Exact resolved package version and cache origin, no global/local package, browser completion and resulting output |
| Marketplace | Fresh Claude profile/plugin cache plus isolated global npm prefix; no copied skill or checkout path | Add `ShipWithAI/shipwithai-plugins`; install `cumpa@shipwithai`; separately install `@shipwithai/cumpa@1.5.0`; invoke `/cumpa:cumpa`; complete Finish in the browser | Marketplace/plugin versions, plugin cache origin, npm executable origin/version, zero exit plus parseable canonical JSON, no checkout references |
| Missing CLI | Fresh Claude profile with the plugin installed but no `cumpa` executable | Invoke the skill | Immediate actionable prerequisite error; no fake review, implicit install, Git mutation, or partial canonical output |
| Lifecycle independence | Both artifacts installed | Update/remove each using its native manager | CLI update/uninstall does not mutate plugin state; plugin update/uninstall does not mutate global npm state; remaining artifact reports the missing prerequisite cleanly where relevant |

### Post-validation improvements

- Add release-operator automation that compares the packed file manifest with an approved allowlist and records artifact integrity, if the first release shows manual inspection is error-prone.
- Add another agent marketplace only after there is concrete demand; keep the same thin delegation contract rather than introducing a shared plugin framework in advance.
- Re-check npm's private-repository provenance restriction for every release-policy revision. Enable provenance only after npm documents and supports the exact private-repository path.

### Explicitly deferred

- Additional review capabilities or protocol versions.
- Source obfuscation, encryption, DRM, activation, or license servers.
- Automatic CLI installation from the marketplace plugin.
- A public application source/history mirror.
- A custom updater or installer.
- Paid tiers, entitlements, or changes to voluntary support.

## Prioritization Matrix

| Feature | User/release value | Implementation cost | Priority |
|---|---:|---:|---|
| Resolve private-repo/provenance contradiction | Critical | Low decision cost; platform constraint | **P0 blocker** |
| Proprietary license and public metadata boundary | Critical | Medium | **P0** |
| Complete positive tarball allowlist and disclosure notice | Critical | Medium | **P0** |
| Exact global and `npx` acquisition | Critical | Low | **P0** |
| Usable bootstrap publication | Critical | Medium | **P0** |
| OIDC trusted publication without a long-lived token | Critical | High | **P0** |
| Token revocation/disallow after trusted publish | High | Low | **P0** |
| Independent MIT marketplace plugin | Critical | Medium | **P0** |
| External CLI prerequisite and thin delegation | Critical | Low | **P0** |
| Clean released-artifact acceptance matrix | Critical | High | **P0** |
| Independent update/uninstall documentation | High | Low | **P0** |
| Preserve voluntary support unchanged | High | Low | **P0** |
| Automated packed-manifest comparison | Medium | Low/Medium | P1 after first-release validation |
| Additional marketplaces | Low until requested | Medium | Future |
| npm provenance from private source | High | Impossible under current npm support | Future platform watch; not a hidden P1 |

## Channel Responsibility Analysis

The npm package and marketplace plugin are complementary distribution channels, not substitute products.

| Concern | Public npm package | Public ShipWithAI marketplace plugin |
|---|---|---|
| Artifact | `@shipwithai/cumpa@1.5.0` tarball | `cumpa` plugin entry and self-contained skill files |
| License | Proprietary application terms via top-level `LICENSE`; third-party notices retained | MIT metadata and plugin-local MIT `LICENSE` |
| Contains | Compiled CLI/server/native runtime, required browser assets, package metadata, public usage docs | Thin skill instructions, plugin manifest/metadata, MIT license; no CLI bytes |
| Must not contain | TypeScript, source maps, tests, planning/dev files, private history, marketplace skill | Proprietary implementation, embedded npm package, copied Git/diff/review logic |
| Acquisition | Exact global install or exact `npx` from npm's public registry | Add public `shipwithai` marketplace, then install `cumpa@shipwithai` |
| Primary job | Run the complete local review application | Let the coding agent delegate a review request to the separately installed application |
| Runtime authority | Git grounding, browser review, persistence, Finish, canonical JSON | Prerequisite gate and request/response orchestration only |
| Privacy reality | Public tarball and compiled assets are downloadable/inspectable; repository and excluded development material remain private | Entire plugin is public and intentionally reviewable/reusable under MIT |
| Update | Global reinstall with intentional `@latest`; exact `npx` remains pinned when specified | Marketplace refresh/auto-update followed by plugin reload or next session; bump plugin/catalog version when content changes |
| Uninstall | `npm uninstall --global @shipwithai/cumpa` | `/plugin uninstall cumpa@shipwithai`; removing the marketplace also removes its installed plugins |
| Acceptance | Isolated prefix/cache and exact registry version | Isolated agent profile/cache plus independently installed exact CLI |

## Sources

### First-party npm and GitHub documentation

- [npm package.json reference](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) — `private`, `license`, `files`, `bin`, `repository`, `engines`, and always-included files.
- [Creating and publishing scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/) — explicit public access for scoped packages.
- [About public packages](https://docs.npmjs.com/about-public-packages/) — public packages are downloadable by anyone.
- [npm pack](https://docs.npmjs.com/cli/v11/commands/npm-pack/) — creation and inspection of publishable tarballs.
- [npm install](https://docs.npmjs.com/cli/v11/commands/npm-install/) — exact-version installation semantics.
- [npm exec / npx](https://docs.npmjs.com/cli/v11/commands/npm-exec/) — cache installation, local-package reuse, and executable inference.
- [npm uninstall](https://docs.npmjs.com/cli/v11/commands/npm-uninstall/) — global removal behavior.
- [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/) — GitHub Actions OIDC requirements, automatic provenance conditions, private-repository limitation, repository matching, and post-migration token controls.
- [npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/) — npm version, 2FA, existing-package prerequisite, workflow identity, and permission flags.
- [Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements/) — supported CI, public repository matching, publish configuration, and verification.
- [GitHub: npm provenance from private source repositories is no longer supported](https://github.blog/changelog/2023-07-25-publishing-with-npm-provenance-from-private-source-repositories-is-no-longer-supported/) — independent confirmation of the private-source restriction.
- [npm registry record for `@shipwithai/cumpa`](https://registry.npmjs.org/@shipwithai%2Fcumpa) — returned 404 on 2026-09-06, establishing the bootstrap dependency on the research date.

### First-party Claude Code and ShipWithAI documentation

- [Claude Code plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) — catalog/plugin structure, copied cache behavior, metadata, versioning, update, and uninstall paths.
- [Discover and install plugins](https://code.claude.com/docs/en/discover-plugins) — add/install syntax, namespacing, refresh, and external-binary prerequisite precedent.
- [Claude Code skills](https://code.claude.com/docs/en/skills) — skill directory and invocation conventions.
- [ShipWithAI public marketplace repository](https://github.com/ShipWithAI/shipwithai-plugins) — public marketplace identity and MIT license.
- [ShipWithAI marketplace catalog](https://raw.githubusercontent.com/ShipWithAI/shipwithai-plugins/main/.claude-plugin/marketplace.json) — marketplace name and plugin entry convention.
- [ShipWithAI starter plugin manifest](https://raw.githubusercontent.com/ShipWithAI/shipwithai-plugins/main/plugins/starter/.claude-plugin/plugin.json) and [plugin-local MIT license](https://raw.githubusercontent.com/ShipWithAI/shipwithai-plugins/main/plugins/starter/LICENSE) — self-contained plugin metadata/license precedent.

### Existing Cumpa artifacts treated as dependencies

- `.planning/PROJECT.md` — canonical v1.5 goal and constraints.
- `package.json` — current private `cumpa@0.0.0` manifest, bin, files, Node engine, and build packaging behavior.
- `README.md` — current checkout-only install and skill-copy guidance that must be replaced for the public artifact.
- `.kimi-code/skills/cumpa/SKILL.md` — existing thin prerequisite, request, Finish, and canonical-output delegation behavior to publish under MIT.

---

*Research completed 2026-09-06 for the replacement v1.5 Private Distribution milestone. Revalidate platform documentation, registry state, and marketplace state at release time.*
