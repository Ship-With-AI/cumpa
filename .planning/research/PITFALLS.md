# Pitfalls Research

**Domain:** Public Git history, GPL-3.0-or-later source and npm distribution, npm trusted publishing, and an independently MIT-licensed ShipWithAI plugin
**Researched:** 2026-09-04
**Confidence:** MEDIUM

## Evidence Convention and Scope

- **Verified fact** means the statement was checked against the current repository or a current primary source linked under Sources.
- **Recommendation** means a release control inferred from those facts. It is not a claim that a platform mandates that exact implementation.
- **Open fact** means authenticated account state could not be established from public data and must be resolved before release.
- The source-provider confidence seam classified the cross-checked web research as **MEDIUM**. The operative GPL, npm, GitHub, SPDX, U.S. Copyright Office, Anthropic, and ShipWithAI facts come from their primary sources; applying copyright and combined-work rules to particular repository material still depends on factual ownership analysis and, where unresolved, counsel.
- This is not legal advice. The U.S. ownership rules cited below are examples from U.S. law; applicable jurisdictions and contracts may differ.
- This research addresses only the new v1.5 public-source, licensing, and distribution work. Cumpa's validated review behavior and voluntary, feature-neutral support behavior are not candidates for redesign.

## Recommended Prevention Phases

1. **Public-Source & Licensing Readiness** — audit everything that will become public; resolve secrets, ownership, third-party permissions, GPL scope, and the MIT subartifact boundary before changing repository visibility.
2. **Immutable Release & npm Trusted Publishing** — establish the final package identity, exact Corresponding Source, packed contents, notices, OIDC publisher, support build input, provenance, tag, and release evidence before publishing `1.5.0`.
3. **Marketplace Publication & Public Install Verification** — publish the self-contained MIT plugin, keep catalog and plugin versions aligned, declare the separate GPL CLI prerequisite, and exercise both public installation paths from clean environments.

## Release-Gate Summary

| Rank | Pitfall | Severity | Status | Prevention phase | Evidence required to open the gate |
|------|---------|----------|--------|------------------|------------------------------------|
| 1 | Make the repository public before auditing history and hosted records | Critical | **RELEASE BLOCKER** | Phase 1 | Audit of all public-bound refs plus GitHub Actions logs/artifacts and other hosted records; every discovered credential revoked or rotated before any cleanup |
| 2 | Apply GPL to material without authority to license it | Critical | **RELEASE BLOCKER** | Phase 1 | Contributor/material ledger and documented rights or removals for every uncertain contribution |
| 3 | Convey incompatible or unattributed third-party material | Critical | **RELEASE BLOCKER** | Phase 1 | Complete dependency/asset inventory, compatibility disposition, and required notice set |
| 4 | Ship object code without exact Corresponding Source, GPL text, or notices | Critical | **RELEASE BLOCKER** | Phases 1–2 | Packed tarball points to the exact release source and contains required license/notice material; source and scripts can generate the shipped work |
| 5 | Assume the npm name can be bootstrapped with OIDC | Critical | **RELEASE BLOCKER** | Phase 2 | Authenticated proof that `@shipwithai/cumpa` is owned and has the intended trusted publisher configured before `1.5.0` is attempted |
| 6 | Publish irreversible `1.5.0` from the wrong commit or bytes | Critical | **RELEASE BLOCKER** | Phase 2 | One approved tarball tied to version, tag, commit, digest/integrity, release, and npm provenance |
| 7 | Misconfigure trusted publishing or provenance identity | High | **RELEASE BLOCKER** | Phase 2 | Successful configured OIDC/staged path from the exact workflow and public repository; no write token; provenance visible and verifiable |
| 8 | Omit, misroute, or leak the support-service release configuration | High | **RELEASE BLOCKER** | Phase 2 | Packed launcher contains exactly the canonical public HTTPS origin and no hosted credentials; GPL rights remain independent of support |
| 9 | Blur the GPL application and MIT marketplace-plugin boundary | High | **RELEASE BLOCKER** | Phases 1 and 3 | Dedicated MIT license and metadata cover only the thin plugin; no GPL application implementation is copied into it |
| 10 | Publish a stale marketplace plugin or omit its CLI prerequisite | High | **RELEASE BLOCKER** | Phase 3 | Catalog/manifest/content versions agree and a fresh marketplace installation successfully delegates to the released public CLI |
| 11 | Leave GitHub release tags and assets mutable | Moderate | **OPTIONAL HARDENING** | Phase 2 | GitHub immutable release enabled and published only after all assets are attached |
| 12 | Leave traditional npm publishing enabled after OIDC is proven | Moderate | **OPTIONAL HARDENING** | Phase 2 | Token publishing disallowed and obsolete automation tokens revoked; optionally require staged approval |

## Critical Pitfalls

### Pitfall 1: Publicize First, Discover Secrets Later

**Severity / status / confidence:** Critical · **RELEASE BLOCKER** · MEDIUM

**What goes wrong:**

Changing the existing private repository to public exposes the complete pushed history, current branches and tags, repository activity, and GitHub Actions history and logs. Anyone can fork it immediately. A secret, private URL, webhook sample, customer identifier, production payload, OAuth value, deployment evidence record, or internal attachment that exists only in an old commit or hosted log can escape even when the current working tree is clean. Deleting it after the visibility change cannot reliably retract clones and forks.

**Why it happens:**

Teams scan only the checked-out tree, equate `.gitignore` with historical removal, or treat generated evidence and CI logs as outside the repository-release boundary. GitHub explicitly states that Actions history and logs become public and that anyone can fork a public repository. Its sensitive-data guidance also states that rewritten commits can remain in clones, forks, cached views, and pull-request references.

**How to avoid:**

Before the visibility flip, inventory and scan every ref that will remain on GitHub, tags, release assets, Actions logs/artifacts, pull-request attachments and references, LFS objects, issue attachments, and public-bound planning/evidence files. Manually review likely secret and privacy-bearing files; a pattern scanner alone is not proof of absence. If a credential is found, revoke or rotate it first. Decide afterward whether history rewriting is still necessary. If rewriting is necessary, coordinate every clone, repeat the audit over rewritten refs, invalidate SHA-bound records, prevent recontamination, and contact GitHub Support when cached views or pull-request references require removal. Re-establish push rulesets after the visibility transition because GitHub disables them.

**Warning signs:**

- A scan covers only `HEAD` or tracked files in the current checkout.
- Historical `.env`, PEM, key, token, credentials, production payload, database dump, or deployment-evidence paths were never enumerated.
- GitHub Actions logs and artifacts have not been reviewed.
- Secret-looking values are dismissed because they are expired, test-only, or deleted from the latest commit.
- A history rewrite is proposed before credential rotation and clone/fork coordination.
- Release planning assumes existing push rulesets survive the private-to-public transition.

**Phase to address:**

Phase 1: Public-Source & Licensing Readiness. It must finish before the repository becomes public and before public OIDC release workflows can run.

**Release gate:**

Block the visibility change until the audited scope and dispositions are recorded, all confirmed secrets are revoked or rotated, and any rewrite has been rescanned. Treat public disclosure recovery as **HIGH / potentially irreversible**.

**Verified basis:**

GitHub documents that public conversion exposes code, activity, Actions history/logs, permits forking, and disables push rulesets. GitHub's sensitive-data procedure says revocation/rotation is the first step and details the clone, fork, cached-view, pull-request, signature, changed-SHA, and recontamination consequences of rewriting.

**Recommendation:**

Use a one-time deep pre-publication audit plus narrow ongoing push protection. Do not weaken the one-time scope merely to make it fast.

---

### Pitfall 2: Grant GPL Rights the Publisher Does Not Own

**Severity / status / confidence:** Critical · **RELEASE BLOCKER** · MEDIUM

**What goes wrong:**

A top-level GPL file appears to license the complete history even though some contribution is owned by an employer, contractor, collaborator, upstream author, or other party that did not authorize GPL-3.0-or-later distribution. The public grant is then unreliable and may trigger a takedown or force removal after publication.

**Why it happens:**

Git commit authorship, possession of a private repository, and the right to relicense are different facts. Under the cited U.S. rules, copyright initially vests in authors; work-made-for-hire and signed-transfer rules determine when another party owns it. GitHub's “inbound = outbound” term applies when a contribution is added to a repository that already contains a license notice. It does not establish permission for historical contributions made before the new GPL notice existed.

**How to avoid:**

Create a material ledger for the complete history: author/copyright holder, origin, applicable employment or contractor terms, existing license, and evidence of permission. The current Git author inventory shows one author identity, which simplifies the inquiry but does not prove ownership. Resolve employer or client claims, copied snippets, imported examples, commissioned artwork, generated material with uncertain provenance, and any contribution made under earlier terms. Obtain a written permission/assignment where needed or remove/replace the material before publication. Add a current repository notice that expressly states the intended license scope for Cumpa-authored material across the complete history; do not rewrite every historical commit merely to insert a license file.

**Warning signs:**

- “I wrote it” is the only recorded ownership basis despite employment, contracting, or client work.
- The repository historically had no GPL notice, but GitHub Terms are cited as if they retroactively licensed every commit.
- The contributor list is treated as the material-provenance list.
- Copied snippets, generated code, screenshots, icons, fonts, fixtures, or documents have no origin record.
- A blanket GPL declaration is proposed as the cure for uncertain ownership.

**Phase to address:**

Phase 1: Public-Source & Licensing Readiness.

**Release gate:**

Block public visibility and package publication for unresolved title or permission. For a material ownership dispute, obtain qualified legal advice rather than guessing.

**Verified basis:**

The U.S. Copyright Office distinguishes authorship, work made for hire, possession, and signed transfers. GitHub Terms require uploaders to have rights and apply the repository-license default only to content added to a repository already containing that notice.

**Recommendation:**

Keep the ledger concise and evidence-based. One confirmed owner is enough; a new contributor agreement system is unnecessary unless future contribution volume warrants it.

---

### Pitfall 3: Treat “Open Source” as “GPL-Compatible and Notice-Free”

**Severity / status / confidence:** Critical · **RELEASE BLOCKER** · MEDIUM

**What goes wrong:**

Cumpa conveys code, browser bundles, native output, fonts/icons/images, generated material, or copied source whose terms conflict with GPL-3.0-or-later or require copyright, license, attribution, source, or NOTICE text that the npm tarball omits. A dependency can be publicly readable and still be incompatible. A compatible permissive dependency can still require its notice to accompany copies.

**Why it happens:**

The npm manifest exposes direct runtime dependencies, while Vite bundles portions of Vue, Monaco, and browser dependencies into Cumpa's own distributed assets. Consumers do not necessarily receive those bundled projects as separate npm packages with their license files. Transitive dependencies, copied code, native sources, generated output, and non-code assets are easy to miss. “OSI-approved,” “free to use,” and “GPL-compatible” are not interchangeable conclusions.

**How to avoid:**

Inventory direct and transitive packages, bundled browser modules, native code, vendored/copied sources, generated artifacts, fonts, icons, images, and fixtures. Record license identifier, copyright holder, distribution form, compatibility disposition, and required notice. Resolve `UNKNOWN`, custom, noncommercial, source-available, GPL-2.0-only, attribution, patent, or additional-restriction terms individually. Remove, replace, or obtain permission for material whose conditions cannot all be satisfied. Use Vite 8's native `build.license` output for bundled dependency notices instead of adding a new license-scanner dependency, but do not assume it subsumes upstream project notice files: Monaco 0.55.1 separately ships `ThirdPartyNotices.txt`, which must be preserved when applicable. Retain the resulting notices in the actual tarball and preserve legally significant banner comments where a license requires it.

**Warning signs:**

- The audit reads only `dependencies` in `package.json` or only direct packages.
- The minified web bundle contains third-party code but the packed package has no third-party notice set.
- A scanner reports `UNKNOWN`, custom, noncommercial, source-available, GPL-2.0-only, or conflicting license expressions.
- A notice exists in the repository but is outside npm's packed file set.
- The decision says “MIT is compatible” without checking the actual version, copyright text, and distribution form.

**Phase to address:**

Phase 1: Public-Source & Licensing Readiness; Phase 2 must verify that the approved notices survive packing.

**Release gate:**

Block on every unresolved license, provenance, attribution, or notice obligation that applies to conveyed bytes.

**Verified basis:**

GPLv3 sections 5, 7, and 12 require a compliant whole and prohibit incompatible further restrictions. GNU's GPL FAQ explains that compatibility means satisfying both licenses and distinguishes a combined work from an aggregate. The current manifest and build show a Vite/Monaco/Vue browser application and generated `dist` output, so bundled-code notice coverage is a real repository-specific requirement.

**Recommendation:**

Use the lockfile and final bundle as inventory inputs, but make the packed tarball the release oracle.

---

### Pitfall 4: Publish Compiled npm Bytes Without Exact Corresponding Source and Notices

**Severity / status / confidence:** Critical · **RELEASE BLOCKER** · MEDIUM

**What goes wrong:**

The npm package distributes compiled Node modules, a browser bundle, and potentially native object code, while its metadata points only to a moving default branch or omits the scripts and public build inputs needed to produce those bytes. The tarball lacks the GPL text, copyright/no-warranty notice, or applicable third-party notices. Recipients cannot identify or obtain the exact Corresponding Source for `1.5.0`.

**Why it happens:**

Making a repository public is mistaken for satisfying object-code conveyance automatically. GPLv3 section 1 defines Corresponding Source as the preferred source plus scripts needed to generate, install, run, and modify the object code. Section 6 requires equivalent machine-readable source access with clear directions beside network-distributed object code. A default branch can move after publication, and npm's packed file allowlist can omit files visible in the checkout.

**How to avoid:**

Publish the full GPL text and a clear copyright/no-warranty notice. Use SPDX `GPL-3.0-or-later` consistently in `package.json`, repository documentation, npm metadata, and release records. Point `repository`, `homepage`, and release notes to the public source and exact `v1.5.0` tag/commit. Ensure that exact source includes all Cumpa source, schemas, native source, and build/install scripts needed for the distributed work. Preserve required third-party notices in the tarball. Record the non-secret canonical support-service origin used to generate the configured launcher so the release bytes are reproducible in their intended mode; never publish production credentials as “source.” Inspect the final tarball's file list and contents rather than inferring them from the repository.

**Warning signs:**

- No root `LICENSE`, `COPYING`, `NOTICE`, or third-party notice artifact.
- `package.json` has no `license` or exact `repository.url`.
- Source links resolve only to the moving default branch.
- Build scripts or native source are private, absent, or different from the tagged source.
- `dist` source maps or build inputs identify a commit other than the release tag.
- A release checklist says “repo is public” but never inspects the tarball.

**Phase to address:**

Phase 1 establishes license/source scope; Phase 2 proves the packed object-code conveyance.

**Release gate:**

Block until recipients can move from the npm `1.5.0` page to the exact machine-readable Corresponding Source and required notices without private access or special credentials.

**Verified basis:**

GPLv3 sections 1, 4, 5, and 6 define the source, notice, license-copy, and network-conveyance obligations. SPDX confirms the exact `GPL-3.0-or-later` identifier. npm documents that `files`, ignore rules, and mandatory-file rules control the tarball. Current `package.json` has no license/repository metadata and the root has no license/notice file.

**Recommendation:**

Prefer an exact tag/commit URL over a separately maintained source archive unless the archive is produced and verified from the same approved commit.

---

### Pitfall 5: Assume a New npm Name Can Be Configured for OIDC Before It Exists

**Severity / status / confidence:** Critical · **RELEASE BLOCKER** · MEDIUM

**What goes wrong:**

The release is ready, but maintainers cannot add the trusted publisher because npm's documented setup begins in an existing package's settings, the scope/name is unavailable, the current account lacks package rights, or a bootstrap publication was never planned. Under pressure, someone publishes `1.5.0` manually, adds a long-lived token to CI, or publishes a placeholder under the irreversible target version.

**Why it happens:**

Repository metadata and npm registry ownership are separate authorities. The public npm registry endpoint for `@shipwithai/cumpa` returned 404 on the research date, while the local manifest is still `name: "cumpa"`, `version: "0.0.0"`, and `private: true`. A public 404 does not prove whether an authenticated private package or reserved organization state exists. npm does not document an unauthenticated pre-registration path on the trusted-publisher page; it directs maintainers to the package settings.

**How to avoid:**

Resolve this while authenticated before release day: confirm the `shipwithai` organization owns or can create the exact scoped package, confirm maintainer rights, establish how the first trusted publisher is added, and prove whether `1.5.0` can be the first OIDC-published public version. If a bootstrap version is necessary, use a documented npm-supported path with short-lived interactive authentication or npm Support, select a pre-`1.5.0` version that cannot be confused with the release, make its licensing and purpose honest, and configure OIDC before publishing `1.5.0`. Never burn `1.5.0` as a placeholder.

**Warning signs:**

- No authenticated screenshot/record of the package settings and trusted-publisher entry.
- The first registry action in the plan is the production `npm publish` job.
- The manifest remains unscoped, private, or `0.0.0` near release.
- The plan assumes a public 404 means the package is definitely claimable.
- A temporary `NPM_TOKEN` appears in the production release workflow.

**Phase to address:**

Phase 2: Immutable Release & npm Trusted Publishing, at its beginning—not on release day.

**Release gate:**

Block the `1.5.0` tag until exact package ownership, public access, publisher configuration, and any required bootstrap sequence are proven.

**Verified basis:**

npm documents per-package trusted-publisher setup through package settings. The unauthenticated public registry returned 404 for the target on 2026-09-04. The current local manifest does not yet represent the target package.

**Recommendation:**

Treat authenticated package bootstrap as the earliest external prerequisite. This is an open account-state fact, not a code problem that can be solved by changing `package.json` alone.

---

### Pitfall 6: Publish Immutable `1.5.0` From the Wrong Commit or Wrong Bytes

**Severity / status / confidence:** Critical · **RELEASE BLOCKER** · MEDIUM

**What goes wrong:**

The tag, GitHub release, npm package, package metadata, and provenance refer to different source states or differently built tarballs. A late rebuild silently changes `dist`, omits assets, embeds a different support endpoint, or includes local files. npm will not allow the same package name/version pair to be reused even after unpublish, so the corrected release must use a new version.

**Why it happens:**

A release process independently runs `npm pack`, `npm publish`, and GitHub asset creation at different times or worktrees. `latest` is a mutable dist-tag, but the version tarball is not. Provenance links a package to its build context; it does not prove that independently uploaded GitHub assets are byte-identical or that the source was safe.

**How to avoid:**

Freeze the release commit first. Build and pack once in the approved release job, inspect that exact tarball, record its checksum and npm integrity, and publish that tarball rather than repacking. Attach the same artifact and checksum to the GitHub release where useful. Use GitHub's hosted `macos-15` arm64 runner for the canonical pack unless the native distribution design changes: the current native build script emits `dist/native/directory_exchange.node` only on Darwin arm64 and removes it on Ubuntu, Intel macOS, and other platforms. Cross-check package name/version, `v1.5.0` tag, commit SHA, release, tarball digest, npm integrity, provenance subject, and the `latest` dist-tag. Fail before publication on any mismatch. Never “fix” a published version by moving a tag or replacing an asset.

**Warning signs:**

- GitHub and npm each build their own archive.
- `npm publish` runs from a mutable checkout rather than the approved tag/commit.
- The packed file list and installed behavior are not reviewed before the irreversible publish.
- The canonical tarball is built on Ubuntu or Intel macOS, so the current script removes the validated Darwin-arm64 native addon.
- `latest` is treated as proof of immutable package identity.
- Release evidence records only a version string, not the commit and digest.

**Phase to address:**

Phase 2: Immutable Release & npm Trusted Publishing.

**Release gate:**

Block publication unless the identity chain is internally consistent. If `1.5.0` is wrong, deprecate it with a precise message and publish a corrected higher version; do not attempt replacement.

**Verified basis:**

npm states that a published package name/version pair can never be reused and registry data is immutable. npm tarballs carry integrity digests. GitHub immutable releases can additionally lock the release tag and assets and attest the tag, commit, and assets.

**Recommendation:**

Use one tarball as the release unit. Reproducible independent rebuilds are valuable hardening, but they are not a substitute for publishing the already approved bytes.

---

### Pitfall 7: Configure “Trusted Publishing” That Cannot Publish or Attests the Wrong Repository

**Severity / status / confidence:** High · **RELEASE BLOCKER** · MEDIUM

**What goes wrong:**

The workflow fails with authentication errors or succeeds from an unintended identity. Common causes are a case-sensitive owner/repository/workflow mismatch, missing `id-token: write`, a self-hosted runner, an old npm CLI, `repository.url` not matching the GitHub repository, an unexpected environment restriction, or a trusted publisher configured only for staged publishing while the workflow invokes direct `npm publish`.

**Why it happens:**

npm does not validate the trusted-publisher configuration when it is saved; errors appear at publish time. As of 2026-09-03, newly created configurations always allow `npm stage publish`, while direct `npm publish` is an explicit optional permission. Older examples and assumptions can therefore disagree with a newly created publisher.

**How to avoid:**

Use npm CLI 11.5.1 or later on Node 24 and a GitHub-hosted runner. Give the release job `contents: read` and `id-token: write`, no write-capable npm token, and the minimum other permissions. Configure the exact GitHub owner, repository, workflow filename including case and extension, optional environment, and intended allowed action. Set `package.json.repository.url` to the exact public GitHub repository. Choose one explicit path: direct `npm publish` with that action allowed, or `npm stage publish` followed by a maintainer's 2FA approval. Confirm the public package displays provenance tied to the intended repository, workflow, and commit; verify attestations with the supported npm verification path.

**Warning signs:**

- `NODE_AUTH_TOKEN` or `NPM_TOKEN` has publish permission.
- The workflow runs on `self-hosted` or lacks `id-token: write`.
- The npm trusted-publisher form and checked-in workflow filename differ by path, case, or extension.
- The publisher was created after 2026-09-03 but the plan assumes direct publishing is automatically allowed.
- `repository.url` points to an old, private, forked, or renamed repository.
- The release is called “provenanced” without checking the registry attestation.

**Phase to address:**

Phase 2: Immutable Release & npm Trusted Publishing.

**Release gate:**

Block until the selected direct or staged path succeeds from the final public repository configuration without a long-lived token and the resulting provenance is observed, not merely requested.

**Verified basis:**

npm's trusted-publisher and provenance documentation defines the versions, hosted-runner requirement, identity fields, permissions, repository match, action selection, automatic provenance behavior, and lack of configuration-time validation.

**Recommendation:**

Use staged publishing plus 2FA approval if the team wants the current maximum-security posture. Direct OIDC publishing still meets the stated project goal when deliberately enabled.

---

### Pitfall 8: Treat Support Configuration as Either a Secret or an Uncontrolled Default

**Severity / status / confidence:** High · **RELEASE BLOCKER** · MEDIUM

**What goes wrong:**

A normal unconfigured build is published, so the validated support capability silently disappears; or a developer/test endpoint is embedded; or a production Supabase/Stripe/OAuth credential enters the repository, workflow logs, source, provenance inputs, or npm tarball. Public-facing copy may also imply that payment is required to run, modify, redistribute, or obtain source, contradicting the GPL grant and the already validated feature-neutral behavior.

**Why it happens:**

Cumpa deliberately enables hosted support only when `CUMPA_SUPPORT_SERVICE_URL` is a valid HTTPS value. `scripts/build-bin.mjs` can embed the release's public support origin into the generated launcher from `CUMPA_RELEASE_SUPPORT_SERVICE_URL`. The public endpoint is required release configuration, while hosted service-role keys, webhook secrets, OAuth secrets, and database credentials are not. Generic secret handling often fails to distinguish those categories.

**How to avoid:**

Have the release workflow derive or supply exactly one approved canonical public HTTPS support origin and verify that the packed launcher contains that origin once. Treat it as public reproducibility metadata. Keep all Stripe, Supabase service-role, GitHub OAuth, database, and webhook credentials out of source, build output, provenance metadata, logs, and package contents. Retain the existing behavior that absent/invalid configuration disables only support, never review. Keep package, marketplace, and support copy explicit that payment is voluntary and grants no additional GPL rights.

**Warning signs:**

- The package build runs without the canonical release support input.
- The tarball contains a localhost, branch preview, arbitrary Supabase project, or multiple support origins.
- Secret scanners are bypassed wholesale because the legitimate public origin is flagged.
- Hosted credentials are described as part of GPL Corresponding Source.
- Documentation says “unlock,” “license,” “required,” or otherwise conditions software freedom on payment.

**Phase to address:**

Phase 2: Immutable Release & npm Trusted Publishing; Phase 1's history audit must cover any previous hosted configuration.

**Release gate:**

Block until the final tarball has the approved public origin and no credentials, and public copy preserves voluntary support with unrestricted review use.

**Verified basis:**

The current source enables support only from explicit HTTPS `CUMPA_SUPPORT_SERVICE_URL`, and the build script conditionally writes the release origin into the launcher. GPLv3 sections 4 and 10 preserve recipients' rights and prohibit further restrictions; the license expressly permits charging for copies and support.

**Recommendation:**

Allowlist only the one canonical public origin in release evidence. Do not weaken credential detection to accommodate it.

---

### Pitfall 9: Blur GPL Application and MIT Marketplace-Plugin Licensing

**Severity / status / confidence:** High · **RELEASE BLOCKER** · MEDIUM

**What goes wrong:**

Users cannot tell whether the thin plugin is MIT or GPL, the marketplace labels an artifact MIT while it embeds Cumpa application code, or the npm package's top-level GPL declaration appears to cover the skill without an explicit exception. License metadata and shipped files contradict one another.

**Why it happens:**

The current npm allowlist includes `.kimi-code/skills/cumpa/` alongside compiled application output, while the milestone calls for an independently MIT-licensed ShipWithAI plugin that delegates to a separately installed GPL CLI. File proximity and copied implementation can erase the intended boundary even when marketplace metadata says `MIT`.

**How to avoid:**

Make the marketplace plugin a self-contained directory with its own MIT license text, `plugin.json`, source location, and marketplace `license: "MIT"` metadata. Keep it thin: instructions, preflight, and invocation of the external `cumpa` command only. Do not copy Cumpa server, UI, shared contracts, compiled assets, or substantive GPL implementation into the plugin. In the Cumpa repository's top-level licensing notice, explicitly identify the MIT-scoped plugin/skill path. Decide one source of truth for the marketplace artifact and avoid an unversioned duplicate. Exclude the marketplace skill from the GPL npm tarball unless there is a concrete need to ship it there; if retained, its local MIT license and package documentation must make the mixed-license scope unambiguous.

**Warning signs:**

- Only the marketplace catalog says MIT; the installed plugin directory contains no MIT license.
- The root GPL file claims every file without identifying the independently MIT-licensed subartifact.
- The plugin vendors `dist`, application modules, or substantial implementation text.
- Two copies of `SKILL.md` can change independently.
- npm and marketplace descriptions imply the plugin includes the CLI.

**Phase to address:**

Phase 1 defines the license boundary; Phase 3 packages and verifies it.

**Release gate:**

Block until a recipient can inspect both artifacts and determine their separate licenses, source, and dependency relationship without inference.

**Verified basis:**

Anthropic marketplace entries support SPDX license, repository, and homepage fields; installed plugin directories are copied into a cache and must be self-contained. GPLv3 distinguishes a combined work from a separate aggregate, but labels alone do not make copied implementation independent. Current package metadata includes the existing skill in the npm allowlist.

**Recommendation:**

The smallest durable boundary is one dedicated MIT license in the plugin directory plus one explicit exception/scope statement at the GPL repository root.

---

### Pitfall 10: Publish Marketplace Metadata That Does Not Install the Intended Skill

**Severity / status / confidence:** High · **RELEASE BLOCKER** · MEDIUM

**What goes wrong:**

The ShipWithAI catalog advertises one version while `plugin.json` or installed cached content contains another. Users install a stale skill, or installation succeeds but invocation fails because `cumpa` is absent and the listing never declared how to install the CLI. A local `--plugin-dir` smoke test passes while the real public marketplace flow is broken.

**Why it happens:**

Anthropic treats plugin version changes as release signals: when a version is present, users receive updates only when it changes. Plugin installs copy the directory into a cache. Catalog, plugin manifest, repository source, cached install, and the separately versioned npm CLI can therefore drift independently. ShipWithAI's own version-truth report records real catalog-versus-manifest drift and warns that changing a marketplace version is a release act, not cosmetic reconciliation.

**How to avoid:**

Ship the conventional self-contained plugin layout with `.claude-plugin/plugin.json` and `skills/cumpa/SKILL.md`. Keep the catalog entry, plugin manifest, release notes, and installed content version aligned and bump them for every plugin release. Include `license`, `repository`, and `homepage` metadata. State the CLI prerequisite and exact public commands in the listing/README and actionable missing-command path: `npm install -g @shipwithai/cumpa@1.5.0` for the global `cumpa` executable and `npx @shipwithai/cumpa@1.5.0` for one-off use. Do not have the plugin silently install software. Test by adding the public `ShipWithAI/shipwithai-plugins` marketplace, installing the published plugin into a clean Claude Code profile, confirming the installed license/content/version, then invoking it with the released CLI from a clean Git repository. Account for the plugin cache rather than reusing a development install.

**Warning signs:**

- Marketplace and plugin manifest versions differ.
- The source is a moving branch or mutable directory but the version is unchanged.
- The listing says “one-step install” without distinguishing plugin installation from the CLI prerequisite.
- The skill only says “confirm `cumpa` exists” and provides no recovery command.
- Verification uses a local checkout, local plugin path, local npm tarball, or already-populated global install.

**Phase to address:**

Phase 3: Marketplace Publication & Public Install Verification.

**Release gate:**

Block until a fresh real marketplace install obtains the intended MIT bytes and successfully delegates to the separately installed public `1.5.0` CLI. Verify both global and exact-version `npx` paths independently.

**Verified basis:**

Anthropic documents the plugin layout, copied cache, source behavior, metadata, and version-update rule. ShipWithAI documents its public marketplace commands and has recorded concrete internal version drift. The current thin skill checks for `cumpa` and Git but does not yet give the public npm installation command.

**Recommendation:**

Use an exact source SHA when the plugin is fetched from an external Git source. For a plugin committed inside the marketplace repository, treat the marketplace commit plus matching version fields as the release identity.

---

## Optional Hardening Pitfalls

### Pitfall 11: Leave the GitHub Release Tag and Assets Mutable

**Severity / status / confidence:** Moderate · **OPTIONAL HARDENING** · MEDIUM

**What goes wrong:**

The npm version is immutable, but a maintainer or compromised account later moves the corresponding GitHub tag or replaces release assets. Source and download links then tell a different story from npm provenance.

**How to avoid:**

Enable GitHub immutable releases, create the release as a draft, attach every approved asset and checksum, then publish it. GitHub will lock the tag and assets and generate a release attestation. Restore tag/push protections after the visibility change.

**Warning signs:**

- The release is published before assets are finalized.
- The tag can be deleted or moved after npm publication.
- Correcting release bytes means overwriting an existing asset.

**Phase to address:**

Phase 2. This is recommended supply-chain hardening, not a prerequisite imposed by the stated npm/public-source goal.

**Verified basis:**

GitHub documents the tag/asset lock, release attestation, and draft-first workflow for immutable releases.

---

### Pitfall 12: Keep Traditional Publish Tokens Active Indefinitely

**Severity / status / confidence:** Moderate · **OPTIONAL HARDENING** · MEDIUM

**What goes wrong:**

OIDC is installed, but a leaked maintainer or automation token can still publish. The trusted path is no longer the only release authority.

**How to avoid:**

First prove the selected OIDC direct or staged path. Then disallow traditional token publishing for the package and revoke obsolete automation tokens. For stronger separation, keep the trusted publisher stage-only and require a maintainer to approve with 2FA.

**Warning signs:**

- A write-capable npm token remains in GitHub secrets after OIDC succeeds.
- The package accepts both unreviewed token and OIDC publications without a stated reason.
- Token removal is attempted before OIDC is proven, risking a release lockout.

**Phase to address:**

Phase 2, after—not before—the first successful trusted publication.

**Verified basis:**

npm recommends setting up and verifying trusted publishers first, then restricting token access and revoking unused tokens. npm describes stage-only publishing plus 2FA approval as the maximum-security posture.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Add a root GPL file without an ownership/material ledger | Fast visible license | Unresolved title and third-party terms can invalidate the release | Never for the public release |
| Scan only the current tree | Fast, low-noise report | Misses the exact historical and hosted records being made public | Never as the sole pre-public audit |
| Link npm source to the default branch | Minimal metadata | Source drifts away from immutable package bytes | Never for a numbered object-code release |
| Trust source-tree notices without inspecting `npm pack` output | Avoids a release artifact check | License and notice files may not reach recipients | Never |
| Build GitHub and npm artifacts separately | Simple workflows | Creates silent byte/provenance divergence | Only for non-release development artifacts |
| Keep the same plugin version while editing skill content | Avoids version bookkeeping | Existing users remain on stale cached content | Never for marketplace-released changes |
| Duplicate the skill in Cumpa and ShipWithAI repositories | Easy initial copy | License, prerequisite, and behavior drift | Only if one copy is generated from an explicit release source and agreement is checked |
| Leave `.kimi-code/skills/cumpa/` in the npm tarball “because it is already there” | No manifest edit | Mixed-license ambiguity and two installation stories | Only with a documented consumer need and an explicit MIT boundary in the tarball |
| Keep npm token publishing enabled | Easy fallback | Preserves a second, stealable release authority | Temporarily, until OIDC is proven |

## Integration Gotchas

| Integration | Common mistake | Correct approach |
|-------------|----------------|------------------|
| GitHub visibility | Flip visibility, then scan | Audit refs, logs, artifacts, PR references, and attachments first; rotate secrets before cleanup; restore disabled rulesets afterward |
| npm package bootstrap | Assume changing `name` claims the scope | Confirm authenticated organization/package ownership and first-publisher setup before tagging `1.5.0` |
| npm trusted publisher | Enter a workflow path instead of the exact filename, use different case, or run self-hosted | Match owner/repo/filename/environment exactly, use GitHub-hosted runner and `id-token: write` |
| npm allowed actions | Invoke `npm publish` against a newly stage-only publisher | Explicitly allow direct publish or use `npm stage publish` plus 2FA approval |
| npm provenance | Add a flag but keep stale `repository.url` | Match the public repository exactly and observe/verify the resulting attestation |
| npm access | Rely on defaults for a first scoped package | Set and verify public access explicitly |
| npm dist-tags | Treat `latest` as immutable release identity | Verify both immutable `1.5.0` and the mutable `latest` pointer |
| GitHub release | Publish before assets are complete | Draft, attach approved assets/checksums, then publish; optionally make releases immutable |
| Cumpa support service | Publish an unconfigured build or inject hosted secrets | Embed only the approved public HTTPS origin; keep service-role/OAuth/webhook/database credentials server-side |
| ShipWithAI marketplace | Update only catalog or only plugin manifest | Bump and verify catalog, manifest, content, source, and installed cache together |
| Marketplace prerequisite | Assume plugin installation installs `cumpa` | Document and test the separate global and exact-version `npx` CLI paths |
| Marketplace source | Reference files outside the plugin directory | Make the copied plugin directory self-contained |

## Performance Traps

This distribution milestone introduces no new application runtime scaling contract. Do not redesign Cumpa's validated review or support behavior for hypothetical performance. The relevant “scale” risk is audit completeness:

| Trap | Symptoms | Prevention | When it breaks |
|------|----------|------------|----------------|
| Replace full-history audit with a faster current-tree scan | Instant clean result despite years of commits | Deep-audit every public-bound ref and hosted record once before visibility change; use incremental checks afterward | The first secret or unlicensed file exists only historically |
| License-scan direct dependencies only | Small, easy report | Inventory the lockfile and actual bundled/package bytes | The first transitive or browser-bundled component carries a notice or incompatible term |
| Rebuild artifacts repeatedly instead of promoting one tarball | Multiple “equivalent” artifacts | Pack once and move the approved immutable bytes through inspection, publication, and release | The first nondeterministic build input or changed environment alters output |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Rotate after history rewrite or public flip | Credential remains usable while copies spread | Revoke/rotate first, then decide whether cleanup is needed |
| Put a publish-capable npm token in GitHub Actions | Long-lived credential can be stolen or logged | OIDC with `id-token: write`; no write token in the release job |
| Give the release workflow broad repository permissions | Compromise has unnecessary blast radius | `contents: read`, `id-token: write`, and only narrowly justified additions |
| Use a self-hosted runner for npm trusted publishing | Unsupported authentication path and weaker isolation assumptions | Use a GitHub-hosted runner supported by npm |
| Leak hosted support credentials as build inputs | Public tarball/logs can compromise payment or identity authority | Build with only the public canonical service origin; keep all authority credentials server-side |
| Accept any HTTPS support origin | Release can route installation identifiers to an unintended service | Require the one canonical origin and scan the packed launcher |
| Trust provenance as a malware or license verdict | Attestation proves origin/build context, not safety or legal compliance | Independently inspect and approve the tarball and license evidence |
| Forget visibility disables push rulesets | Public repository loses expected push controls | Re-establish and verify rulesets immediately after conversion |

## UX Pitfalls

| Pitfall | User impact | Better approach |
|---------|-------------|-----------------|
| Call the marketplace plugin “one-step Cumpa installation” | Plugin installs but `cumpa` is missing | Say “install plugin,” then show the separate CLI prerequisite and recovery command |
| Document only a global install | Users cannot try a pinned version without modifying global state | Show both `npm install -g @shipwithai/cumpa@1.5.0` and `npx @shipwithai/cumpa@1.5.0` |
| Document only `npx` while the skill shells out to `cumpa` | Agent invocation fails in a later shell | State whether the plugin expects the global command and how one-off invocation differs |
| Hide Node/Git prerequisites | Fresh installs fail with confusing runtime errors | State Node 24 and the supported Git prerequisite beside install guidance |
| Let marketplace cache mask stale content | Maintainer sees local edits while users receive old skill | Verify a clean public install and inspect installed version/content |
| Phrase voluntary support as access or licensing | Users think GPL rights or review features require payment | Preserve explicit “optional support; all review features remain available” copy |
| Correct an npm mistake silently | Users cannot distinguish compromised or bad bytes | Deprecate the exact version with a precise message and publish a higher corrected version |

## “Looks Done But Isn't” Checklist

- [ ] **Public history:** Current tree is clean, but old refs/logs/artifacts were omitted — verify every public-bound Git and GitHub surface before changing visibility.
- [ ] **Secret response:** History was rewritten, but usable credentials remain — verify revocation/rotation happened first and rewritten refs were rescanned.
- [ ] **Repository controls:** Visibility changed successfully — verify disabled push rulesets and intended tag/release protections were restored.
- [ ] **Ownership:** Git shows one author identity — verify copyright ownership, employment/contract terms, copied/generated material, and license authority rather than equating authorship with title.
- [ ] **Full-history license:** A GPL file exists only at current `HEAD` — verify the current notice expressly scopes Cumpa-authored material across the complete history and preserves third-party/MIT exceptions.
- [ ] **Third-party compliance:** A dependency scanner is green — verify bundled, transitive, native, copied, generated, font/icon/image, and notice obligations too.
- [ ] **GPL package:** `package.json` says `GPL-3.0-or-later` — verify the tarball contains the license/no-warranty/notice material and directs users to exact Corresponding Source.
- [ ] **Package identity:** The manifest was renamed — verify authenticated ownership of `@shipwithai/cumpa`, `private` removal, version `1.5.0`, explicit public access, and correct repository URL.
- [ ] **OIDC bootstrap:** Workflow is checked in — verify the package settings already trust that exact workflow and the target name can be published without sacrificing `1.5.0`.
- [ ] **Allowed action:** Trusted publisher was created — verify whether it permits direct `npm publish` or requires `npm stage publish` and 2FA approval.
- [ ] **No token:** Workflow contains no `NPM_TOKEN` — verify dependency installation also needs no private registry token; if it does, any token is read-only.
- [ ] **Provenance:** Publication requested provenance — verify the public npm page/attestation names the intended repository, workflow, and release commit.
- [ ] **Artifact identity:** GitHub and npm both show `1.5.0` — verify tag, commit, tarball checksum, npm integrity, provenance subject, and release asset agree.
- [ ] **Dist-tag:** `1.5.0` exists — verify `latest` points to it.
- [ ] **Support configuration:** Review features work — verify the packed launcher also contains exactly the canonical public support origin and no hosted credential.
- [ ] **MIT boundary:** Marketplace metadata says MIT — verify the installed plugin has its own MIT license and contains no GPL application implementation.
- [ ] **Marketplace version:** Catalog entry was merged — verify catalog, `plugin.json`, skill content, source commit, and cached installed version agree.
- [ ] **CLI prerequisite:** Listing mentions `cumpa` — verify it contains exact global and `npx` public commands and a clear missing-command recovery path.
- [ ] **Real npm global flow:** Local tarball works — repeat from the public registry in a clean environment and observe the `cumpa` executable.
- [ ] **Real npm `npx` flow:** Local command works — run exact `npx @shipwithai/cumpa@1.5.0` from a clean Git repository.
- [ ] **Real marketplace flow:** Local plugin path works — add `ShipWithAI/shipwithai-plugins`, install the released plugin into a clean profile, and invoke it against the public CLI.

## Recovery Strategies

| Pitfall | Recovery cost | Recovery steps |
|---------|---------------|----------------|
| Secret exposed by public history/logs | **HIGH / potentially irreversible** | Revoke/rotate immediately; remove exposed hosted logs/assets; assess whether rewrite is warranted; coordinate clones/forks; rescan; contact GitHub Support for eligible cached views/PR refs; document residual exposure |
| Ownership or incompatible license found before release | **MEDIUM** | Stop the gate; obtain permission, replace, or remove the material; regenerate notices and artifacts |
| Ownership or incompatible license found after release | **HIGH** | Halt affected distribution; deprecate the npm version; preserve evidence; remove/replace material; seek counsel; publish a corrected higher version |
| Wrong npm `1.5.0` bytes or metadata | **HIGH** | Deprecate `1.5.0` with a precise warning; correct source and release process; publish a higher version; never attempt name/version reuse |
| Wrong `latest` dist-tag only | **LOW** | Move the dist-tag to the approved immutable version; retain evidence explaining the correction |
| Wrong mutable GitHub tag/asset | **MEDIUM/HIGH** | Do not silently overwrite evidence; publish a corrected tag/release/version, reconcile npm/source links, then enable immutability for future releases |
| Trusted publisher mismatch | **LOW before publish / HIGH if it caused a manual release** | Correct exact owner/repo/workflow/environment/action settings; rerun the approved OIDC or staged flow; never add a long-lived fallback token under pressure |
| Missing/wrong support public origin | **HIGH after `1.5.0`** | Deprecate affected package if behavior or routing is wrong; correct the build input and publish a higher version; rotate credentials immediately if any were embedded |
| Marketplace version/content drift | **LOW/MEDIUM** | Correct plugin content and prerequisite; bump the plugin/catalog version as a real release; update marketplace; verify a clean cached installation |
| Missing MIT license in plugin | **MEDIUM** | Stop distribution until scope is clear; add dedicated license/metadata, bump the plugin release, and verify installed contents |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention phase | Verification |
|---------|------------------|--------------|
| Publicize before history/hosted audit | Phase 1 | Recorded scope covers refs, tags, Actions logs/artifacts, attachments, and any cleanup/rotation; visibility remains private until accepted |
| Lack authority to GPL history | Phase 1 | Material ledger resolves holder/origin/permission; unresolved material removed or counsel clears it |
| Third-party incompatibility/notices | Phase 1, packed proof in Phase 2 | Inventory covers lockfile plus actual bundle/assets; tarball contains required notices |
| Missing Corresponding Source/GPL material | Phases 1–2 | Exact release source/tag and scripts are public; tarball metadata/license/notices/source directions agree |
| npm scope/bootstrap uncertainty | Start of Phase 2 | Authenticated package ownership and trusted-publisher setup recorded before the `1.5.0` tag |
| Irreversible wrong tarball | Phase 2 | One approved tarball digest maps to tag, commit, GitHub release, npm integrity, and provenance |
| Trusted publisher/provenance mismatch | Phase 2 | Final GitHub-hosted workflow uses exact identity, `id-token: write`, selected action, no write token; attestation verified |
| Support release misconfiguration | Phase 2 | Tarball scanner finds exactly the approved public origin and no credential; optional behavior remains feature-neutral |
| GPL/MIT boundary blurred | Phase 1 definition, Phase 3 packaging | Root scope notice and plugin-local MIT license agree; plugin contains delegation only |
| Stale marketplace/prerequisite | Phase 3 | Catalog/manifest/source/content versions agree; fresh public install finds exact CLI guidance and completes delegation |
| Mutable GitHub release | Phase 2 optional hardening | Immutable badge/attestation present after all assets were attached |
| Traditional token authority remains | Phase 2 optional hardening | OIDC first proven, then token publishing disabled and obsolete tokens revoked |

## Sources

### Licensing and ownership

- [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html) — primary license text; sections 1, 4–7, 10, and 12 are most relevant.
- [GNU GPL FAQ](https://www.gnu.org/licenses/gpl-faq.html) — FSF guidance on compatibility, combined works/aggregates, source correspondence, network distribution, and charging/support.
- [SPDX: GPL-3.0-or-later](https://spdx.org/licenses/GPL-3.0-or-later.html) — canonical SPDX identifier and “or later” distinction.
- [U.S. Copyright Office, Title 17 Chapter 2](https://www.copyright.gov/title17/92chap2.html) — U.S. initial ownership, work-made-for-hire, material-object distinction, and signed-transfer rules.
- [GitHub Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service) — uploader responsibility, public repository rights, and contributions under an existing repository license.

### GitHub publication and release integrity

- [Setting repository visibility](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility) — public conversion consequences, visible Actions history/logs, forks, and disabled push rulesets.
- [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) — rotate-first guidance and rewrite/clones/forks/cache/PR/signature risks.
- [Immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases) — locked tags/assets, release attestations, and draft-first publication.
- [Managing releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) — GitHub release workflow.
- [GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners) — current standard public-repository runner labels include `macos-15` on Apple M1 arm64 and separate Intel labels.

### npm publication

- [Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers/) — OIDC requirements, exact identity fields, allowed actions, configuration timing, token hardening, and troubleshooting.
- [Staged publishing](https://docs.npmjs.com/staged-publishing/) — staging and required maintainer 2FA approval.
- [Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements/) — repository match, supported build environment, automatic trusted-publisher provenance, first-public access, and verification.
- [`npm publish`](https://docs.npmjs.com/cli/v11/commands/npm-publish) — immutable name/version, integrity, file inclusion, access, and dist-tag behavior.
- [`package.json`](https://docs.npmjs.com/cli/v11/configuring-npm/package-json) — license and repository metadata.
- [npm Unpublish Policy](https://docs.npmjs.com/policies/unpublish/) — registry immutability and deprecation as the normal recovery tool.
- [Public registry lookup for `@shipwithai/cumpa`](https://registry.npmjs.org/%40shipwithai%2Fcumpa) — returned HTTP 404 without authentication on 2026-09-04; authenticated ownership remains an open fact.
- [Vite `build.license`](https://vite.dev/config/build-options.html#build-license) — built-in bundled-dependency license output; disabled by default.
- [Monaco Editor 0.55.1 third-party notices](https://unpkg.com/monaco-editor@0.55.1/ThirdPartyNotices.txt) — upstream notice file that must not be assumed equivalent to Vite's generated dependency report.

### Marketplace publication

- [Anthropic: Create and distribute a plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces) — plugin layout, copied cache, source pinning, metadata fields, and version-update rules.
- [ShipWithAI plugin marketplace](https://github.com/ShipWithAI/shipwithai-plugins) — official public MIT marketplace and install commands.
- [ShipWithAI marketplace manifest](https://raw.githubusercontent.com/ShipWithAI/shipwithai-plugins/main/.claude-plugin/marketplace.json) — repository-specific catalog structure and metadata.
- [ShipWithAI marketplace version truth](https://raw.githubusercontent.com/ShipWithAI/shipwithai-plugins/main/docs/marketplace-version-truth.md) — repository-specific operational evidence of catalog/manifest drift; not a universal platform contract.

### Current repository evidence

- [`package.json`](../../package.json) — currently `cumpa@0.0.0`, `private: true`, missing public license/repository metadata, and includes `dist/` plus `.kimi-code/skills/cumpa/` in the package allowlist.
- [Thin Cumpa skill](../../.kimi-code/skills/cumpa/SKILL.md) — delegates to `cumpa` and checks prerequisites, but does not yet provide the public npm install command.
- [Release launcher builder](../../scripts/build-bin.mjs) — conditionally embeds the public support-service origin into the generated launcher.
- [Native addon builder](../../scripts/build-native-addon.mjs) — emits the packaged directory-exchange addon only on Darwin arm64 and removes it on other build platforms.
- [Support capability boundary](../../src/server/app.ts) — enables hosted support only for an explicit HTTPS `CUMPA_SUPPORT_SERVICE_URL`.

---
*Pitfalls research for: Cumpa v1.5 Public Distribution*
*Researched: 2026-09-04*
