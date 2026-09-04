# Project Research Summary

**Project:** Cumpa
**Domain:** Public distribution of an existing Node.js CLI and coding-agent skill
**Researched:** 2026-09-04
**Confidence:** MEDIUM

## Executive Summary

Cumpa v1.5 is a distribution control-plane milestone, not a review-product rewrite. The existing Node 24 ESM CLI, generated `dist/bin/cumpa.mjs`, browser assets, optional Darwin arm64 native capability, and thin agent skill should remain the product. The recommended release unit is one inspected npm tarball: it serves global installation, `npx`, and the runtime that the marketplace-installed skill delegates to.

The primary launch blocker is external: the unscoped npm name `cumpa` is occupied by an unrelated package at `2.0.1`. Exact `npm install -g cumpa` and `npx cumpa` cannot work until an explicit ownership transfer and identity-migration decision is made; a scoped or renamed package is not an implementation fallback because it changes the promised commands. Other prerequisites are public repository visibility, an approved license and root license file, publishable metadata, and a release version greater than the occupied lineage. Trusted publishing should use a dedicated GitHub-hosted arm64 workflow with exact OIDC binding, no long-lived npm token, and automatic provenance. Marketplace publication follows successful registry verification and must preserve one authoritative skill protocol.

## Key Findings

### Recommended Stack

The four research reports agree that native npm and GitHub capabilities are sufficient; no release framework or runtime dependency is needed. Preserve Node.js `24.x` and `engines.node >=24`, npm CLI 11 (pin `11.19.1`; trusted publishing requires at least `11.5.1`), Commander/Inquirer/Fastify/Vue/Vite/Monaco/Zod and the existing build. Use npm trusted publishing (GitHub OIDC), automatic provenance, `npm pack --ignore-scripts`, and a dedicated `publish-npm.yml` on GitHub-hosted `macos-15`. Keep the package `type: module`, `bin.cumpa`, narrow `files` allowlist, and publishable `npm-shrinkwrap.json`; do not add a release framework, custom installer, postinstall compiler, or `--provenance` flag.

Confirmed platform requirements:

- `package.json` must remove `private`, replace `0.0.0`, set public access/registry, exact `repository.url` for `https://github.com/Ship-With-AI/cumpa.git`, homepage/bugs metadata, accurate description/keywords, and a maintainer-approved SPDX license matching a root `LICENSE` file.
- The release event must check out the immutable tagged SHA, require stable releases unless a prerelease policy is explicitly added, verify `v${package.json.version}`, build once with the protected support origin, inspect and smoke-test one `.tgz`, and publish that same file with `npm publish --ignore-scripts --access public`.
- Trusted-publisher authority is exact and case-sensitive: npm organization/user `Ship-With-AI`, repository `cumpa`, workflow filename `publish-npm.yml`, and the chosen GitHub environment (recommended `npm`/`npm-production`). The workflow needs `contents: read` and `id-token: write`, must run on GitHub-hosted infrastructure, and must not define `NPM_TOKEN` or `NODE_AUTH_TOKEN`.
- Automatic provenance requires both the npm package and source repository to be public and repository metadata to match exactly. Verify registry integrity, `dist.attestations`, and `npm audit signatures` after publication.
- The existing native addon is built only on Darwin arm64. A `macos-15` arm64 release preserves that capability; the `.node` binary is not portable to Linux, Windows, or another CPU. Do not silently claim a universal native matrix or add consumer-side compilation. Other platforms must receive the explicit unsupported capability behavior already in the application.

### Expected Features

**Must (table stakes):**

- Resolve ownership of bare `cumpa` and communicate the breaking identity/version consequence — otherwise the required commands install the unrelated package.
- Make source public with an approved license; complete npm metadata, `--version`, executable/bin mapping, deterministic tarball, Node/Git prerequisite disclosure, and lifecycle documentation for global install, `npx`, upgrade, uninstall, and troubleshooting.
- Publish approved immutable GitHub releases through OIDC trusted publishing with automatic provenance and no long-lived token; verify exact registry bytes, signatures, and provenance in clean consumer environments.
- Publish the existing skill through a valid versioned ShipWithAI plugin/catalog entry, disclose that the CLI is separately installed, and verify the real marketplace-installed skill delegates to the released CLI.

**Should have (competitive):**

- One thin skill authority across repository, package, and marketplace rather than divergent protocol copies.
- Cross-channel released-artifact acceptance (exact npm package plus marketplace plugin), provenance-backed release transparency, honest local-first capability/prerequisite language, and explicit version/update/refresh semantics.

**Defer (v2+):**

- Additional package-manager or standalone-binary channels, additional agent marketplaces, custom bootstrap installers, automatic CLI update daemons, hosted/collaborative review features, and broader platform packaging. Stage-only npm promotion is optional v1.x hardening, not a prerequisite for direct trusted publishing.

### Architecture Approach

Keep existing application boundaries unchanged and add a release boundary around them: protected branch/draft release → immutable tag → one GitHub Actions job → one `.tgz` → npm registry → install consumers. The verifier becomes tarball-oriented and must not create a second implicit build. The marketplace owns discovery and plugin packaging; it must point at an already published exact npm artifact and must not carry a second Cumpa runtime or invent review behavior. The checked-in `.kimi-code/skills/cumpa/SKILL.md` remains the protocol authority, but the accepted marketplace source model must be selected and parity-checked.

**Major components:**

1. **Package identity and metadata** — npm name/version ownership, public repository/license, manifest, bin, shrinkwrap, and docs.
2. **Reproducible artifact pipeline** — configured build, native-runner policy, allowlisted tarball, scanner, isolated install/smoke checks.
3. **Trusted release workflow** — release/tag/version gates, protected environment, exact OIDC publisher, provenance, immutable-version recovery.
4. **ShipWithAI plugin/catalog** — versioned marketplace manifest and canonical skill with explicit CLI compatibility and namespaced invocation.
5. **Public installation gate** — exact registry global/npx execution, browser review flow, signature/provenance checks, clean marketplace installation and end-to-end delegation.

### Critical Pitfalls

1. **Occupied npm identity** — stop before automation; obtain explicit owner transfer and decide how to communicate repurposing unrelated `2.0.1` history, or obtain approval to change the product commands.
2. **Private/placeholder metadata** — fail closed on `private`, `0.0.0`, missing license/repository, or mismatched `Ship-With-AI`/`ShipWithAI` spelling; validate manifest again on the release tag.
3. **Publishing a different build than inspected** — build once, pack once with scripts disabled, verify and publish the same tarball; never let directory `npm publish` rerun `prepack`.
4. **Native-addon portability and hidden support configuration** — release on arm64 macOS with the approved support origin, scan for secrets/origins, and test declared platform behavior explicitly.
5. **OIDC, immutable-version, and marketplace drift** — bind the exact workflow/environment, handle reruns as new versions rather than unpublish/retry, and keep catalog/plugin/skill versions and source references synchronized.

## Implications for Roadmap

The following order preserves blockers and separates confirmed platform requirements from decisions still requiring maintainer approval.

### Phase 1: Package Identity, Public Source, and Contract Approval
**Rationale:** Bare-name ownership, legal terms, repository visibility, and version lineage gate every later action.
**Delivers:** Explicit transfer/identity decision; public-readiness review; approved license and `LICENSE`; package name/version policy (recommended first Cumpa version is an unused version greater than `2.0.1`, potentially `3.0.0`, never milestone-derived `1.5.0`); accurate npm/README/plugin contract.
**Addresses:** Bare package, source visibility/license, metadata, `--version`, prerequisites, lifecycle documentation.
**Avoids:** Occupied namespace, misleading republish, private provenance failure, `Ship-With-AI` vs `ShipWithAI` authority confusion.
**Approval still required:** Current npm owner transfer; whether repurposing the occupied identity is acceptable; exact first registry version; public license and author/organization terms.

### Phase 2: Reproducible Public Artifact
**Rationale:** A registry release is only trustworthy if the exact bytes users install are complete and inspected before authentication/publication.
**Delivers:** Public manifest and shrinkwrap, configured support-origin build, arm64 native-addon policy, tarball inventory scanner, isolated global/npx install checks, and no source/secrets/consumer compiler requirement.
**Uses:** Existing Node/npm/build scripts, `npm pack --ignore-scripts`, existing launcher and artifact verifier.
**Implements:** Single-package/single-tarball architecture.
**Avoids:** Implicit `prepack` rebuild, missing browser assets, omitted native capability, leaked support credentials, accidental files.

### Phase 3: Trusted Release Automation and Registry Verification
**Rationale:** OIDC settings and workflow gates should be established only after identity and artifact contracts are settled.
**Delivers:** Dedicated `publish-npm.yml`, exact tagged-release/version checks, protected GitHub environment, GitHub-hosted `macos-15`, OIDC direct publish, automatic provenance, immutable-version/rerun recovery, and post-publication integrity/signature verification.
**Uses:** npm trusted publishing with `id-token: write`; no npm token; default `latest` only for stable releases.
**Avoids:** Wrong workflow authority, self-hosted unsupported publisher, prerelease replacing `latest`, publishing uninspected bytes, and unrepeatable version overwrite attempts.

### Phase 4: ShipWithAI Plugin Publication
**Rationale:** The skill depends on a separately installed public CLI; marketplace promotion must follow a verified registry artifact and cannot repair a broken CLI.
**Delivers:** Accepted versioned plugin/catalog entry, canonical skill parity, compatibility declaration (Node 24+, Git 2.43+, `cumpa` on PATH), namespaced install/use/update guidance, and source/version synchronization.
**Implements:** Marketplace-as-discovery architecture; no second runtime package or install-time mutation.
**Avoids:** Treating `.kimi-code/skills` inside npm as marketplace publication, stale Claude cache, mutable source drift, silent CLI auto-install.
**Unresolved contradiction requiring planning/maintainer validation:** STACK/one report describes adding `Ship-With-AI/skills/skills/cumpa/SKILL.md` through the existing Vercel Skills CLI catalog, while FEATURES/ARCHITECTURE/PITFALLS describe `ShipWithAI/shipwithai-plugins` with a `shipwithai-cumpa` plugin and Claude namespaced invocation. Do not choose silently; validate the accepted upstream marketplace source and install contract first, then implement one authoritative model.

### Phase 5: Public Installation and Cross-Channel Acceptance
**Rationale:** Local tests cannot prove registry resolution, npm packaging, Claude caching, or cross-channel protocol compatibility.
**Delivers:** Clean-prefix `npm install -g cumpa@X.Y.Z`, exact-version and stable `npx` execution, real Git repository/browser smoke, `npm audit signatures`, provenance inspection, clean marketplace install, and one end-to-end review/delegation flow.
**Addresses:** Cross-channel acceptance and all active v1.5 requirements.
**Avoids:** Checkout-only confidence, stale marketplace cache, missing external CLI, and package/skill version drift.

### Phase Ordering Rationale

- External identity, license, and visibility decisions precede metadata, provenance, and any irreversible registry operation.
- Artifact production is isolated from trusted publication so one tarball is inspected, installed, and then published without an implicit rebuild.
- Marketplace promotion is registry-first and exact-version pinned; it is deliberately a separate upstream change and may lag npm review.
- The final gate exercises the bytes and plugin consumers actually receive, not repository-local files.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** npm owner-transfer procedure, legal license approval, occupied-name migration communication, and first-version policy are unresolved decisions.
- **Phase 4:** ShipWithAI marketplace/plugin source model and acceptance governance are inconsistent across reports and lack a formal public submission SLA.
- **Phase 5:** Real Claude marketplace cache/namespace behavior and cross-platform native capability require live external-artifact validation.

Phases standard patterns (skip research-phase):
- **Phase 2:** npm manifest/files/bin/pack and Node build patterns are official and already represented by existing scripts.
- **Phase 3:** GitHub release events, OIDC permissions, npm trusted publishing, and provenance have authoritative npm/GitHub contracts once exact values are configured.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Official npm/GitHub/Agent Skills contracts verified; namespace transfer, license, and first version remain owner decisions. |
| Features | HIGH | npm and GitHub requirements are live/officially verified; marketplace acceptance details are MEDIUM. |
| Architecture | MEDIUM | Existing package boundaries and single-tarball flow are clear; marketplace source model remains contradictory. |
| Pitfalls | HIGH | npm, Node, GitHub, and Claude packaging failure modes are well evidenced; ShipWithAI governance is MEDIUM. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Bare npm transfer:** Confirm written transfer/access with current owner and document consumer/dist-tag migration before implementation.
- **Legal terms:** Maintainer must choose an SPDX license and add the matching root file; research cannot select legal terms.
- **First registry version:** Approve an unused SemVer greater than `2.0.1`; do not use `1.5.0` by analogy with the milestone.
- **Marketplace authority:** Resolve whether publication targets `Ship-With-AI/skills` via Vercel Skills CLI or `ShipWithAI/shipwithai-plugins` via Claude marketplace, including source, manifest, namespace, and version authority.
- **Native platform promise:** Decide declared supported OS/CPU behavior; arm64 macOS is the only build with the current addon, while other platforms must explicitly expose unsupported capability.
- **Trusted-publishing environment:** Confirm the exact protected environment name and whether direct publish or optional stage-only promotion is desired; npm authority remains the `Ship-With-AI` GitHub owner/repository/workflow tuple, not the similarly named marketplace organization.

## Sources

### Primary (HIGH confidence)

- [npm live `cumpa` registry document](https://registry.npmjs.org/cumpa/latest) — occupied unscoped name, unrelated maintainer/package, latest `2.0.1`, no CLI bin.
- [npm package.json documentation](https://docs.npmjs.com/cli/v11/configuring-npm/package-json) — identity, metadata, license, files, bin, repository, engines, publication behavior.
- [npm exec / npx](https://docs.npmjs.com/cli/v11/commands/npm-exec) — executable inference, cache, prompts, `--yes`, explicit versions.
- [npm trusted publishers](https://docs.npmjs.com/trusted-publishers) and [provenance](https://docs.npmjs.com/generating-provenance-statements) — OIDC identity, supported runners, public-source requirement, automatic attestations.
- [npm package transfer policy](https://docs.npmjs.com/transferring-a-package-from-a-user-account-to-another-user-account) and [name disputes](https://docs.npmjs.com/policies/disputes) — owner-assisted transfer and first-come namespace behavior.
- [npm signature verification](https://docs.npmjs.com/verifying-registry-signatures) — `npm audit signatures`.
- [GitHub Actions release/OIDC documentation](https://docs.github.com/en/actions) — release event, immutable tag checkout, permissions, environments.
- [Agent Skills specification](https://agentskills.io/specification) — `SKILL.md`, naming, compatibility metadata.
- [Vercel Skills CLI](https://github.com/vercel-labs/skills) and [Ship-With-AI skills repository](https://github.com/Ship-With-AI/skills) — existing catalog layout and install convention.

### Secondary (MEDIUM confidence)

- `.planning/research/STACK.md` — exact npm/ShipWithAI stack recommendations, workflow invariants, version and runner guidance.
- `.planning/research/FEATURES.md` — table stakes, differentiators, anti-features, dependency ordering, and marketplace contract alternatives.
- `.planning/research/ARCHITECTURE.md` — single-tarball architecture, artifact data flow, registry-first promotion, and external boundaries.
- `.planning/research/PITFALLS.md` — release, native-addon, OIDC, immutable-version, and marketplace drift failure modes.
- [Claude Code plugin documentation](https://docs.anthropic.com/en/docs/claude-code/plugins) — marketplace installation, cache, namespacing, and version behavior.

### Tertiary (LOW confidence)

- ShipWithAI submission/acceptance governance — no formal external policy or service-level contract was found; validate live with maintainers before Phase 4.

---
*Research completed: 2026-09-04*
*Ready roadmap: yes*
