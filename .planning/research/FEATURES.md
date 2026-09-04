# Feature Research

**Domain:** Public-source licensing and public distribution of an existing local-first Node.js CLI and its coding-agent integration
**Researched:** 2026-09-04
**Confidence:** HIGH for npm, GitHub, GPL text, and Claude Code marketplace behavior; MEDIUM for legal interpretation and ShipWithAI acceptance decisions

## Scope and Evidence Convention

This research covers only **Cumpa v1.5 Public Distribution**. Cumpa's review workflow and voluntary-support behavior are already validated and are not redesigned here.

- **Verified** means the behavior is directly supported by a cited primary source or observed public registry/repository state.
- **Recommendation** means roadmap guidance derived from those facts and the constraints in `.planning/PROJECT.md`.
- Licensing conclusions are product research, not legal advice. Confirm ownership of all repository content and the intended license boundary before publication.

The target `@shipwithai/cumpa` package returned HTTP 404 from the public npm registry on the research date. This is useful rather than blocking: the scoped name appears unclaimed. However, npm's trusted-publisher setup begins in an existing package's settings, so the release plan needs a real public bootstrap publication under a non-`latest` tag before configuring OIDC for `1.5.0`. The bootstrap must already contain correctly licensed, usable Cumpa artifacts; it must not be a placeholder package.

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Public repository with complete existing history | “Open source” users expect anonymously cloneable source; this milestone explicitly promises the current repository and full history, not a source snapshot. | HIGH | **Verified:** private-to-public conversion exposes code and can expose Actions history/logs and other repository activity. **Recommendation:** audit every reachable commit, branch, tag, release asset, Actions log/artifact, and repository setting for secrets, personal data, proprietary material, and licensing authority before conversion. Record the intended pre-cutover commit/ref set and prove it remains reachable from an unauthenticated public clone. If sensitive material is found, revoke/rotate first and resolve any necessary history rewrite explicitly rather than publishing it to preserve history. |
| Unambiguous GPL-3.0-or-later application license | Users must be able to determine what they may copy, modify, and redistribute from the repository and npm package. | MEDIUM | **Verified:** the SPDX identifier is exactly `GPL-3.0-or-later`; GPLv3 source conveyance requires appropriate notices, intact license/no-warranty notices, and a copy of the license. **Recommendation:** put the complete license in the repository root and published package, use the SPDX expression in package metadata, add concise copyright/license/no-warranty notices to README/release surfaces, and retain required third-party notices. |
| Accurate third-party license notices in built artifacts | A GPL label does not erase the licenses and attribution obligations of bundled dependencies. | MEDIUM | **Recommendation:** inspect the actual browser/server bundle and npm tarball, preserve generated or upstream third-party notices, and make them reachable to recipients. Do not represent all tarball bytes as original GPL-only Cumpa code when separately licensed components are included. |
| Public scoped package identity and access | `@shipwithai/cumpa@1.5.0` must resolve publicly and expose the `cumpa` executable rather than merely exist as registry metadata. | MEDIUM | **Verified:** scoped packages are private by default unless published with public access; npm `bin` entries create executable links/scripts. **Recommendation:** publish with explicit public access, remove `private: true`, keep one `cumpa` bin, preserve Node `>=24` and Git prerequisites, and make the installed command start the shipped product from package bytes. |
| Discoverable package-to-source linkage | Registry users need to find the exact public source, issues, documentation, and license before installing. | LOW | **Verified:** npm defines `license`, `repository`, `homepage`, `bugs`, `engines`, `bin`, and `files` metadata for these purposes. Trusted publishing additionally requires `repository.url` to exactly match the GitHub repository. **Recommendation:** make all URLs public and canonical, including exact owner/repository casing. |
| One immutable v1.5.0 release identity | Users and maintainers need one answer to “which source produced these package bytes?” | MEDIUM | **Recommendation:** align `package.json` version `1.5.0`, immutable Git tag/release, npm version, release notes, tarball checksum, and provenance subject. Publish the inspected tarball rather than rebuilding a second candidate in the publish step. Release records should link both the exact source tag/commit and npm package page. |
| OIDC trusted publication without a long-lived token | The milestone explicitly requires approved releases to publish without a reusable npm publishing secret. | MEDIUM | **Verified:** npm trusted publishing exchanges CI OIDC identity for short-lived credentials. GitHub Actions requires `id-token: write`; the configured repository, workflow filename, and optional environment are exact, case-sensitive identity fields; GitHub-hosted runners are supported. Public packages from public repositories receive npm provenance automatically. **Recommendation:** authorize only the exact release workflow/environment and the intended `npm publish` action, publish `1.5.0` through it, retain no `NPM_TOKEN`/`NODE_AUTH_TOKEN` publishing secret, then restrict traditional token publishing and revoke obsolete automation tokens after OIDC succeeds. |
| Safe package bootstrap before the OIDC release | A new npm identity needs to exist before its package settings can accept a trusted publisher, while `1.5.0` itself must still be OIDC-published. | MEDIUM | **Verified:** `@shipwithai/cumpa` returned 404 on the research date; npm's setup flow starts from the package's settings. **Recommendation:** interactively publish a usable, GPL-correct pre-1.5 package with public access under a non-`latest` bootstrap tag, configure the trusted publisher, then publish `1.5.0` from the approved workflow. Record this dependency explicitly so the first stable release is not accidentally published from a laptop or tokenized workflow. |
| Complete, deterministic npm payload | A registry entry is useless if its tarball omits the server, browser assets, executable, licenses, or runtime notices. | MEDIUM | **Verified:** `files` controls the payload; package metadata, README, license, and bin targets receive special inclusion treatment; `npm pack` exposes the candidate contents. **Recommendation:** use a narrow allowlist, inspect the resulting `.tgz`, install that exact candidate before publication, and compare released contents/checksum after publication. Exclude credentials, private planning material, local state, and development-only files. |
| Verified global installation from the public registry | The primary persistent installation path must work without access to the source checkout. | MEDIUM | From an isolated npm prefix/cache and a clean fixture Git repository, run `npm install --global @shipwithai/cumpa@1.5.0`, resolve `cumpa` from that prefix, exercise help/startup and one representative local review launch, and confirm browser/runtime assets come from the installed package. Do not allow the repository checkout, workspace `node_modules`, or a pre-existing global install to satisfy the check. |
| Verified exact-version `npx` execution | Users need a no-permanent-install path that runs the requested immutable version. | MEDIUM | **Verified:** npm package specs support exact versions; `npm exec`/`npx` downloads a missing package into the npm cache and exposes its bin for the invocation. From an empty cache and clean fixture repository, run `npx --yes @shipwithai/cumpa@1.5.0`, exercise the same packaged startup path, and prove it did not fall back to a local dependency. |
| Clear install, update, and removal guidance | Users must distinguish persistent global installation, one-off execution, exact reproducibility, and intentionally tracking the latest release. | LOW | Document exact v1.5 commands for launch proof; separately document `npm install --global @shipwithai/cumpa@latest`, `npx @shipwithai/cumpa@latest`, and global uninstall. State Node/Git requirements, Git-repository working-directory behavior, browser launch, and common PATH/cache failures. Do not describe mutable `latest` as reproducible evidence. |
| Separately licensed, thin ShipWithAI marketplace skill | Coding-agent users expect one marketplace install to add the integration while the application remains a separately installed CLI. | MEDIUM | **Verified:** ShipWithAI's public marketplace is MIT-licensed and installs plugins via `/plugin marketplace add ShipWithAI/shipwithai-plugins` then `/plugin install <plugin>@shipwithai`. Claude Code copies a plugin's source directory into its cache, so installed content cannot rely on a license file outside that directory. **Recommendation:** the plugin artifact should carry its own MIT license/metadata, contain only the existing thin instructions and manifest/docs, and delegate review authority to `cumpa` on `PATH`. It must not imply that MIT covers the GPL application. |
| Explicit marketplace prerequisite and lifecycle | Marketplace installation alone does not prove that the external CLI exists or is compatible. | LOW | The listing, plugin details/README, and skill should name `@shipwithai/cumpa@1.5.0`, Node `>=24`, and Git as prerequisites; show the exact global install; stop with actionable guidance when `cumpa` is missing; and state the actual namespaced skill invocation. Document marketplace/plugin refresh and update commands without promising that the plugin updates the CLI. |
| Verified marketplace install and delegation | A valid JSON catalog entry can still ship an undiscoverable skill, stale cache version, missing license, or wrong command. | HIGH | From a clean Claude Code profile, add the real public ShipWithAI marketplace, install its released Cumpa plugin, confirm the skill is discoverable and MIT notice is present, and run it against the separately installed public `@shipwithai/cumpa@1.5.0`. The proof must traverse the installed plugin and npm package, not local paths or copied files. |
| Public contribution, support, and security routes | Once a repository is public, users need to know where normal bugs, usage questions, contributions, and private vulnerability reports belong. | LOW | **Verified:** GitHub surfaces README, LICENSE, CONTRIBUTING, issue templates, and security policy in a public repository's community profile; `SUPPORT.md` is linked from issue creation. **Recommendation:** provide concise CONTRIBUTING, SECURITY, and support/issue guidance. A code of conduct and elaborate issue forms are optional until community volume warrants them. Preserve the already-validated rule that voluntary support never gates features or creates warranty/entitlement promises. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| One auditable identity across source, release, package, and provenance | Users can move from installed bytes to the exact public workflow and source commit instead of trusting a mutable README claim. | MEDIUM | Align version/tag/release/tarball/provenance metadata and retain evidence from the exact uploaded artifact. |
| Full-history transparency | An unauthenticated clone exposes how the local-first reviewer evolved, not only a curated source dump for the release. | HIGH | This is a project commitment beyond GPLv3's definition of Corresponding Source. Preserve history unless security or legal remediation makes that unsafe; document any exception. |
| Clean GPL application / MIT integration boundary | The copyleft application stays modifiable and auditable while a small permissive agent adapter remains easy for ShipWithAI to distribute. | MEDIUM | Keep the marketplace artifact thin, readable, separately licensed, and process-delegating. Avoid copied application code or duplicate review logic in the plugin. This is a product boundary recommendation, not a legal conclusion about derivative works. |
| Evidence-backed distribution matrix | Users get proof that global install, exact-version `npx`, and marketplace delegation work as publicly delivered, not merely in the monorepo. | HIGH | Preserve compact release evidence for all three clean-install paths and their artifact/version identities. |
| Honest lifecycle guidance | Users can intentionally choose stable pinning or updates without hidden installers, auto-updaters, or confusing cross-channel promises. | LOW | Use npm and Claude Code's native install/update mechanisms; keep CLI and skill versions independent but document compatibility. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Cosmetic history rewrite or source-only export | Makes the public repository look cleaner. | Breaks the explicit full-history promise, changes commit IDs, and can disrupt signatures, links, PR context, forks, and clones. | Audit first and publish history intact; rewrite only for necessary security/legal remediation, after rotating secrets and documenting the exception. |
| Publishing secrets to preserve “complete history” | Avoids changing commit IDs. | Public disclosure is irreversible enough that GitHub recommends revocation/rotation and coordinated history cleanup for sensitive data. | Security wins: revoke/rotate immediately, remediate history, then update the milestone's completeness evidence honestly. |
| Stored long-lived npm automation token | Familiar and easy to copy into workflow secrets. | Violates the milestone and leaves a reusable credential with exfiltration and rotation risk. | Exact-workflow OIDC trusted publishing; restrict token publishing after the trusted path is proven. |
| Laptop publication of `1.5.0` | Simplifies the first release. | Bypasses approved-source identity and cannot deliver the required trusted-publisher provenance. | Use an interactive non-`latest` bootstrap only to create package settings, then OIDC-publish `1.5.0`. |
| Rebuilding during publish | Seems equivalent to publishing the inspected source. | The uploaded bytes may differ from the inspected candidate, weakening artifact evidence. | Build and pack once, record its checksum/contents, publish that artifact, and compare the public tarball. |
| Bundling the CLI into the MIT plugin | Makes marketplace installation appear all-inclusive. | Blurs license/runtime ownership, duplicates npm distribution, and creates a second application update path. | Install the MIT plugin in one marketplace command but declare the separately installed GPL CLI prerequisite. |
| Skill-driven global npm installation | Removes a prerequisite step. | An instruction file would mutate global software, cross a trust boundary, and hide network/version/permission choices from the user. | Detect absence or incompatibility and print the exact user-run install command. |
| Duplicating review logic in the marketplace skill | Makes the integration look more capable. | Creates protocol and behavior drift from the already-validated CLI. | Keep one thin delegation layer; all review authority stays in Cumpa. |
| Treating registry presence or `npm pack` as release proof | Produces a quick green checklist. | Neither proves a clean machine can execute the public package with all runtime assets. | Run isolated global and exact-version `npx` flows against the released registry artifact. |
| Testing marketplace files directly from a checkout | Easier than installing from ShipWithAI. | Bypasses catalog source resolution, plugin caching, version detection, namespacing, and copied-artifact boundaries. | Add and install from the real public marketplace in a clean profile, then invoke the installed skill. |
| Mutable-only `latest` acceptance | Keeps commands short. | Future dist-tag changes make evidence irreproducible and can mask which release was tested. | Prove `@1.5.0`; document `@latest` separately as the intentional update path. |
| One license label for both application and plugin | Appears simpler. | Contradicts the required GPL application / MIT marketplace separation and misleads recipients. | Carry explicit license metadata/notices in each artifact and describe the boundary in both listings. |
| Hosted reviews, forge posting, collaboration, new review modes, or payment entitlements | Public launch can invite product expansion. | Reopens already-validated behavior and delays distribution proof. | Ship and verify the existing local-first product; handle new product capabilities in later milestones. |
| Custom installer, bundled Node/Git, or self-update daemon | Could reduce visible prerequisites. | Adds a second distribution/security lifecycle for capabilities npm and Claude Code already provide. | Declare prerequisites and use native npm/marketplace update paths. |

## Feature Dependencies

```text
[Full-history security, privacy, ownership, and license audit]
    └──requires-before──> [Public repository with complete intended history]

[GPL application notices + third-party notices + exact package metadata]
    + [Public source tag/release]
    + [Complete inspected npm tarball]
    └──enables──> [One v1.5.0 release identity]

[Usable public bootstrap package under non-latest tag]
    └──enables──> [npm package settings]
        └──enables──> [Exact GitHub trusted-publisher configuration]
            └──enables──> [OIDC publication of @shipwithai/cumpa@1.5.0 + provenance]
                ├──enables──> [Clean global-install proof]
                └──enables──> [Clean exact-version npx proof]

[Public CLI + exact prerequisite/usage guidance]
    └──required-by──> [Separately MIT-licensed ShipWithAI plugin]
        └──required-by──> [Public marketplace install/delegation proof]

[Cosmetic history rewrite] ──conflicts──> [Complete-history promise]
[Bundled/duplicated CLI logic in plugin] ──conflicts──> [GPL application / MIT adapter boundary]
[Long-lived npm token] ──conflicts──> [Trusted-publishing requirement]
```

### Dependency Notes

- **Disclosure and ownership review precedes visibility:** GitHub's visibility change exposes more than the working tree. A full-history promise cannot be treated as permission to disclose secrets, personal data, proprietary assets, or code Cumpa cannot relicense.
- **Complete history is a milestone requirement, not a GPL synonym:** GPLv3 Section 1 defines Corresponding Source as the preferred form plus material needed to generate, install, run, and modify the object code. It does not make a complete Git history the release's source definition. Preserving history is an additional transparency commitment from `.planning/PROJECT.md`.
- **License state precedes packaging:** the root license, package metadata, included notices, and release records must agree before the candidate tarball is accepted.
- **Package bootstrap precedes OIDC configuration:** `@shipwithai/cumpa` currently has no public package settings page. Keep bootstrap publication distinct from the OIDC-published stable `1.5.0` and off the `latest` tag.
- **Trusted identity must match the job:** npm binds the GitHub owner, repository, workflow filename, optional environment, and allowed action. Configure direct `npm publish` if that is the workflow command; staged publishing is a separate optional approval model.
- **Artifact acceptance precedes and follows publication:** pre-publication packing catches missing/extra files; clean public installs and checksum/content comparison prove what users actually receive.
- **Public CLI precedes marketplace acceptance:** the skill deliberately delegates to `cumpa`; publishing it first would yield an installable but unusable integration.
- **Plugin source directory must be self-contained:** Claude Code copies the selected plugin source directory. Include the MIT license and every required skill/manifest file inside that boundary.
- **CLI and skill update independently:** npm dist-tags/versions update the application; marketplace/plugin versions update the adapter. Compatibility guidance connects them without coupling their release mechanisms.

## MVP Definition

This is not a new product MVP. It is the minimum complete **v1.5 Public Distribution** milestone for the already-validated Cumpa product.

### Launch With (v1.5)

- [ ] **Public source and complete history** — an unauthenticated clone contains the recorded pre-cutover reachable commit/tag set, after security/privacy/ownership/license review.
- [ ] **Consistent GPL-3.0-or-later application licensing** — repository, source notices, npm metadata, tarball, registry page, and release record agree; required third-party notices remain present.
- [ ] **Public `@shipwithai/cumpa` identity** — a usable non-`latest` bootstrap creates package settings without consuming the stable release or relying on a stored automation token.
- [ ] **Approved immutable release identity** — tag, GitHub Release, `package.json`, inspected tarball, checksum, npm `1.5.0`, source links, and provenance identify the same release.
- [ ] **OIDC trusted publication** — the exact GitHub-hosted workflow publishes `@shipwithai/cumpa@1.5.0` with public access, automatic provenance, and no long-lived npm publishing credential.
- [ ] **Public global-install proof** — isolated installation of `@shipwithai/cumpa@1.5.0` yields `cumpa` and exercises packaged startup/review assets in a clean Git fixture.
- [ ] **Public `npx` proof** — `npx --yes @shipwithai/cumpa@1.5.0` runs from an empty cache without local-package fallback and exercises the packaged path.
- [ ] **Complete public lifecycle docs** — exact install/usage plus latest-update, uninstall, Node/Git, working-directory, PATH/cache, source, issue, support, contribution, and security guidance are public.
- [ ] **Independent MIT marketplace artifact** — ShipWithAI lists the thin Cumpa plugin with its own MIT notice, exact public CLI prerequisite, actual skill namespace, and no application logic or automatic global installation.
- [ ] **Public marketplace proof** — a clean Claude Code profile installs the real ShipWithAI listing and delegates one representative review to the separately installed public `@shipwithai/cumpa@1.5.0`.
- [ ] **Post-proof token restriction** — traditional token publishing is restricted and obsolete automation tokens are revoked only after the OIDC path is demonstrated.

### Add After Validation (v1.5.x)

- [ ] **Expanded issue forms and code of conduct** — add when public participation volume makes free-form CONTRIBUTING/SECURITY/SUPPORT guidance insufficient.
- [ ] **Automated recurring public-install matrix** — add when repeated patch releases justify automating the clean global, `npx`, and marketplace checks that are manually evidenced for launch.
- [ ] **Staged npm publication with separate 2FA approval** — add if maintainers want npm's stage/approve model in addition to a protected GitHub release environment.
- [ ] **Marketplace discovery polish** — refine screenshots, tags, examples, or troubleshooting when actual install feedback shows a discovery problem; do not change review behavior for listing copy.

### Future Consideration (v2+)

- [ ] **Additional package-manager or standalone-binary channels** — defer until npm adoption demonstrates demand; each adds packaging, signing, update, and platform obligations.
- [ ] **Additional coding-agent marketplaces** — defer until a named ecosystem justifies another thin adapter and independently verifiable distribution path.
- [ ] **Automatic update notification** — defer until stale-version support cost is measured; explicit npm and Claude Code update paths already exist.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Full-history public repository readiness and proof | HIGH | HIGH | P1 |
| GPL application and third-party notice consistency | HIGH | MEDIUM | P1 |
| Public scoped package bootstrap and metadata | HIGH | MEDIUM | P1 |
| Immutable source/package/release identity | HIGH | MEDIUM | P1 |
| OIDC trusted publishing and provenance | HIGH | MEDIUM | P1 |
| Complete inspected npm payload | HIGH | MEDIUM | P1 |
| Clean global-install verification | HIGH | MEDIUM | P1 |
| Clean exact-version `npx` verification | HIGH | MEDIUM | P1 |
| Install/update/removal and public support/security docs | HIGH | LOW | P1 |
| Independent MIT ShipWithAI plugin and prerequisite | HIGH | MEDIUM | P1 |
| Clean marketplace install/delegation verification | HIGH | HIGH | P1 |
| Token restriction after OIDC proof | HIGH | LOW | P1 |
| Issue-form/code-of-conduct polish | LOW | LOW | P2 |
| Recurring automated public-install matrix | MEDIUM | MEDIUM | P2 |
| Staged npm approval model | MEDIUM | MEDIUM | P2 |
| Additional registries/installers/agent marketplaces | LOW | HIGH | P3 |
| Automatic update notification | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v1.5 launch
- P2: Add after public-release evidence or user demand
- P3: Future consideration; not part of this milestone

## Competitor / Distribution Channel Analysis

These channels complement rather than compete. Each has one bounded job and license identity.

| Concern | Public GitHub source | npm package | ShipWithAI marketplace | Cumpa v1.5 rule |
|---------|----------------------|-------------|------------------------|-----------------|
| Primary role | Audit, modification, contribution, immutable source history/releases | Install and execute the application | Discover and install the thin coding-agent integration | Do not make any channel impersonate another. |
| License presented | GPL-3.0-or-later application source plus retained third-party notices | GPL-3.0-or-later package plus included license/notices | MIT plugin artifact | State each boundary explicitly; MIT does not cover the CLI and GPL does not silently relabel the marketplace artifact. |
| Version identity | `v1.5.0` tag/release and exact commit | `@shipwithai/cumpa@1.5.0`, tarball checksum, provenance | Independently versioned Cumpa plugin/catalog entry | Record compatible versions and link exact CLI install; do not force identical plugin/app version numbers. |
| Installation | `git clone` is for source, not the supported end-user install | Global `cumpa` or exact-version `npx` | Marketplace add once, one plugin install, then namespaced skill | Document native commands only; no custom bootstrap installer. |
| Update path | Fetch tags/releases/history | Global reinstall with `@latest`; `npx @latest` for intentionally mutable execution | Marketplace refresh plus plugin update/reload behavior | Separate reproducible pins from mutable update instructions. |
| Acceptance evidence | Anonymous clone and recorded history/ref comparison | Candidate tarball inspection plus isolated public global/`npx` runs | Clean public marketplace add/install/discovery/delegation | “Published” is not “usable”; validate released bytes in every channel. |

## Sources

### Licensing and Source Publication

- [SPDX: GPL-3.0-or-later](https://spdx.org/licenses/GPL-3.0-or-later.html) — exact SPDX identifier and complete GPLv3 text, including Sections 1, 4, 5, and 6 and the “How to Apply” appendix.
- [GitHub: Setting repository visibility](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility) — consequences of changing a private repository to public.
- [GitHub: Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) — rotate/revoke first, history-rewrite consequences, collaborator coordination.
- [GitHub: About community profiles for public repositories](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/about-community-profiles-for-public-repositories) — recognized public repository community files.
- [GitHub: Adding a security policy](https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository) — supported-version and private vulnerability-reporting guidance.
- [GitHub: Adding support resources](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-support-resources-to-your-project) — `SUPPORT.md` behavior in the issue flow.

### npm Distribution

- [npm: `package.json`](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) — license, repository, homepage, bugs, engines, files, and bin metadata and package-content rules.
- [npm: Creating and publishing scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/) — scoped public-access behavior and pre-publish sensitive-data warning.
- [npm: Trusted publishing](https://docs.npmjs.com/trusted-publishers/) — OIDC setup, exact publisher identity, supported runners, allowed actions, workflow permissions, automatic provenance, troubleshooting, and post-proof token restriction.
- [npm: `npm trust`](https://docs.npmjs.com/cli/v11/commands/npm-trust/) — CLI configuration/list/revoke surface for package trusted-publisher relationships.
- [npm: `npm install`](https://docs.npmjs.com/cli/v11/commands/npm-install/) — exact package-version and global installation semantics.
- [npm: `npm exec` / `npx`](https://docs.npmjs.com/cli/v11/commands/npm-exec/) — remote package resolution, cache installation, executable inference, and `--yes` behavior.
- [npm: `npm pack`](https://docs.npmjs.com/cli/v11/commands/npm-pack/) — candidate package construction and inspection.
- [Public npm registry lookup for `@shipwithai/cumpa`](https://registry.npmjs.org/@shipwithai%2Fcumpa) — returned HTTP 404 on 2026-09-04; current-state observation, not a permanent availability guarantee.

### Marketplace Distribution

- [Claude Code: Create and distribute a plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces) — marketplace/plugin manifests, sources, installation, copied plugin boundaries, versioning, refresh, and update behavior.
- [ShipWithAI `shipwithai-plugins`](https://github.com/ShipWithAI/shipwithai-plugins) — established public MIT marketplace, installation convention, prerequisites, and completion checks.
- [ShipWithAI marketplace manifest](https://raw.githubusercontent.com/ShipWithAI/shipwithai-plugins/main/.claude-plugin/marketplace.json) — live marketplace name, plugin entries, versions, metadata, and source patterns observed on 2026-09-04.

### Project Evidence

- `.planning/PROJECT.md` — authoritative v1.5 scope, acceptance criteria, out-of-scope boundaries, GPL application / MIT skill decision, and no-long-lived-token requirement.
- `package.json` — current private `cumpa@0.0.0` manifest, `cumpa` bin, Node requirement, and payload allowlist to be migrated.
- `README.md` — current private-source installation and manual skill-copy guidance that public lifecycle documentation must replace.
- `.kimi-code/skills/cumpa/SKILL.md` — existing thin delegation behavior that must remain authoritative rather than being redesigned.

---
*Feature research for: Cumpa v1.5 Public Distribution*
*Researched: 2026-09-04*
