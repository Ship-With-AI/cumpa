# Project Research Summary

**Project:** Cumpa
**Domain:** Public-source licensing and trusted npm/ShipWithAI distribution for an existing local-first Node.js CLI
**Researched:** 2026-09-04
**Confidence:** MEDIUM-HIGH

## Executive Summary

Cumpa v1.5 is a distribution and source-integrity milestone, not a review-product redesign. Research converges on a small control plane around the existing TypeScript/Node application: make the existing `Ship-With-AI/cumpa` repository public in place (preserving its complete history), publish the application as `@shipwithai/cumpa@1.5.0` under GPL-3.0-or-later, and distribute the thin coding-agent adapter separately under MIT. npm, GitHub Actions, GitHub Releases, the existing artifact scanner, and native npm/Vite capabilities are sufficient; no release framework, license-scanner dependency, custom installer, or second runtime is warranted.

The irreversible risks are disclosure and identity, not feature complexity. Before changing visibility, audit every reachable ref, historical Actions log/artifact, release asset, dependency, copied/generated asset, and contributor right; revoke or rotate exposed credentials before deciding whether any history remediation is unavoidable. GPL Corresponding Source is more precise than “the repo is public”: the exact tagged source, lockfile, build/install scripts, notices, and license must let recipients reproduce and modify the distributed object code. Establish package ownership and a usable non-`latest` bootstrap version before configuring npm trusted publishing, then build, inspect, install-smoke-test, and publish exactly one tarball from a protected `v1.5.0` commit. The same tarball, digest, tag, release, registry metadata, and npm provenance must form one release identity. Existing review and voluntary-support behavior remain unchanged.

## Key Findings

### Recommended Stack

The validated application stack remains Node.js 24 LTS, ESM TypeScript, Commander plus `@inquirer/search`, native Git subprocesses, Fastify 5, Vue 3/Vite, Monaco, Zod, JSON persistence, Vitest, and Playwright. For distribution, use npm's native packlist/publish and OIDC trusted publishing in one dedicated GitHub-hosted workflow; use the existing `gh` CLI for the release record. Build on `macos-15` when retaining the current Darwin-arm64 native addon behavior. Vite 8's `build.license` output plus Monaco 0.55.1's verbatim `ThirdPartyNotices.txt` cover bundled browser notices without adding a general-purpose license dependency.

**Core technologies:**
- **Node 24/npm 11:** build, package, publish, and execute one CLI runtime; meets trusted-publishing floors.
- **GitHub Actions OIDC:** short-lived npm credential bound to exact owner, repository, workflow filename, and optional protected environment; no long-lived npm token.
- **npm pack/publish and registry provenance:** inspect and publish one returned `.tgz`; trusted publication automatically emits provenance for this public package/repository.
- **GitHub immutable Releases plus `gh`:** attach the exact published tarball and checksum to the human-facing tag/release identity.
- **Vite license output + Monaco notice:** preserve actual bundled dependency notices with the runtime payload.

### Expected Features

**Must (table stakes):**
- **Public complete-history source:** convert the existing repository in place only after security, privacy, ownership, and rights review; a mirror, shallow copy, squash, or cosmetic rewrite fails the milestone.
- **GPL-3.0-or-later application conveyance:** root GPL text, SPDX metadata, copyright/no-warranty and source directions, exact Corresponding Source, and all required third-party notices must agree across source, package, registry, and release.
- **Public package identity and payload:** `@shipwithai/cumpa@1.5.0`, public scoped access, `cumpa` bin, Node `>=24`, precise repository metadata, and a narrow `files: ["dist/"]` boundary excluding the MIT skill.
- **One immutable release identity:** protected `v1.5.0` tag, reviewed commit, one inspected tarball, checksum/integrity, GitHub Release asset, registry version, and provenance must correspond.
- **Clean public acceptance flows:** exact-version global install and empty-cache `npx` invocation must run packaged startup/assets; the installed public marketplace skill must be self-contained, MIT-noticed, and delegate to the separately installed GPL CLI.

**Should have (competitive):**
- **Auditable source-to-byte chain:** retain build evidence and compare the registry tarball with the exact GitHub asset rather than rebuilding.
- **Clear channel lifecycle guidance:** document exact pinning, intentional `latest` updates, uninstall, Node/Git and repository prerequisites, issue/support/security routes, and the independent skill prerequisite.
- **Independent MIT adapter boundary:** keep the skill thin, readable, and process-delegating; never duplicate review logic or imply MIT covers the GPL application.

**Defer (v2+):**
- Additional registries, standalone installers, bundled Node/Git, self-update daemons, extra agent marketplaces, automatic update notifications, and staged npm approval unless real demand or maintainer policy justifies them.
- Hosted reviews, collaboration, new review modes, payment/entitlement changes, and full GitHub review mechanics; these are explicitly outside this distribution milestone.

### Architecture Approach

Use the public Cumpa repository as Corresponding Source authority and preserve its history. Add a root GPL boundary and an explicit nested MIT license boundary for the thin skill; exclude that subtree from the npm allowlist while promoting a reviewed copy to `Ship-With-AI/skills/skills/cumpa/`. A fixed workflow checks out the tag SHA, runs `npm ci` and the existing configured build once, packs once with lifecycle scripts disabled, verifies and smoke-tests the concrete tarball, then submits that same file through OIDC and attaches it to a GitHub Release. The skill remains an adapter: marketplace installation supplies instructions only, and the separately installed `cumpa` executable remains the sole review authority.

**Major components:**
1. **Public-source/licensing boundary** — repository history, GPL text, nested MIT notice, rights ledger, dependency/asset inventory, Corresponding Source and build inputs.
2. **Package contract and artifact verifier** — manifest/lock identity, `dist/` payload, launcher/native output, generated notices, forbidden-path checks, exact tarball inventory and digest.
3. **Protected release workflow** — tag/version assertions, pinned Node/npm and hosted runner, one build/pack, OIDC trust, provenance, environment approval, and exact GitHub asset.
4. **Registry/GitHub identity records** — npm version/integrity/provenance and immutable GitHub tag/release must cross-reference the same commit and bytes.
5. **MIT marketplace adapter** — independently licensed, self-contained skill with exact GPL CLI install prerequisite and clean marketplace installation proof.

### Critical Pitfalls

1. **Publicize first, discover secrets later** — audit all refs, Actions logs/artifacts, assets, LFS, attachments, and historical material; rotate/revoke first, and block visibility if unresolved exposure cannot be remediated.
2. **Grant GPL rights without authority** — maintain a concise material/contributor ledger; resolve employer, contractor, copied, generated, and upstream rights before licensing. Git author identity is evidence, not ownership proof.
3. **Treat “public repo” as Corresponding Source** — tag the exact source and include scripts, lockfile, native source, notices, GPL text, and directions sufficient to generate/install/run/modify shipped object code; distinguish this GPL obligation from the extra complete-history promise.
4. **Assume dependencies or GPL label erase notice obligations** — inventory direct/transitive/bundled/native material, resolve incompatible terms, emit Vite notices, and copy Monaco's upstream notice verbatim into `dist`.
5. **Assume a new npm name can be trusted-published before it exists** — npm's documented trust setup starts from an existing package. Publish a usable GPL-correct pre-1.5 bootstrap under a non-`latest` tag via a narrowly scoped interactive maintainer session, configure OIDC, revoke/logout, and never burn stable `1.5.0` manually. If npm documents package reservation, use it instead.
6. **Publish wrong bytes or wrong identity** — freeze the tag, pack once, inspect/smoke-test that file, attach and publish it without repacking, and cross-check commit/version/tag/digest/integrity/provenance.
7. **Blur GPL/MIT boundaries or ship a stale skill** — keep the plugin separate and self-contained, exclude it from npm, state each artifact's license, and test the real public marketplace and registry paths rather than checkout files.

## Implications for Roadmap

The milestone should be sequenced as four dependency-ordered phases. Each phase has a hard gate; no later phase should be used to discover an earlier legal, disclosure, or identity problem.

### Phase 1: Public-source and licensing readiness

**Rationale:** Repository visibility and licensing are irreversible enough to require review before implementation or release setup. **Delivers:** complete-history exposure audit; rights/material ledger; dependency and generated-bundle inventory; root GPL-3.0-or-later text and source directions; nested MIT license/notice; public-repository and community/security/support guidance as appropriate. **Uses:** public source, license consistency, third-party notices, and MIT boundary table stakes. **Avoids:** historical secret disclosure, unauthorized relicensing, incompatible dependencies, and confusing GPL Corresponding Source with full Git history. Visibility must remain blocked for unresolved secrets, ownership, or incompatible material.

### Phase 2: Deterministic package and one-artifact release contract

**Rationale:** The package and artifact are the bridge between source and every public channel. **Delivers:** `@shipwithai/cumpa@1.5.0` manifest/lock identity, public metadata, `dist/` allowlist excluding the skill, generated and Monaco notices, configured build input, and an extended existing scanner that accepts one concrete `.tgz`. **Uses:** package payload and Corresponding Source requirements. **Avoids:** mixed-license tarballs, missing runtime assets, lifecycle-script rebuilds, platform-specific native-addon drift, and a package that is only registry metadata.

### Phase 3: npm namespace bootstrap and trusted release control plane

**Rationale:** The target package currently does not exist, while npm's documented trusted-publisher settings require an existing package. This external prerequisite must be resolved before `v1.5.0` is tagged. **Delivers:** ownership/access confirmation; a usable pre-1.5 package under a non-`latest` tag through temporary interactive auth (or a newly documented reservation path); exact trusted-publisher binding to the fixed workflow/environment; protected `v1.5.0` tag; immutable GitHub Releases; OIDC/provenance configuration with no long-lived publishing credential. **Avoids:** placeholder stable release, laptop-published `1.5.0`, wrong repository/workflow identity, and accidental use of deployment secrets. Bootstrap credentials are revoked immediately after trust is proven.

### Phase 4: Canonical publication and clean public acceptance

**Rationale:** Only now can an irreversible stable release be made from approved source and bytes. **Delivers:** one macOS-arm64 (if native addon remains) workflow run that builds, packs, verifies, smoke-tests, attaches, and OIDC-publishes the same tarball as `@shipwithai/cumpa@1.5.0`; registry integrity/provenance checks; isolated global and empty-cache `npx` proofs; public `Ship-With-AI/skills` marketplace install proof; exact installation/update/removal and support/security documentation. **Avoids:** accepting local `npm pack`, checkout marketplace files, mutable `latest`, or a second independently built GitHub asset as release evidence. Existing review/support flows are exercised only as installation smoke paths, not redesigned.

**Research flags:**
- **Phase 1:** research likely unnecessary for GitHub mechanics, but maintainer/legal authority and historical exposure are account- and fact-specific gates requiring explicit human resolution.
- **Phase 2:** standard npm/Vite packaging patterns are well documented; retain focused research only if the native addon or bundled dependency inventory changes.
- **Phase 3:** **needs targeted research/verification** in the authenticated npm organization: package ownership, bootstrap mechanics, trusted-publisher tuple, environment protection, and whether staged publication is desired.
- **Phase 4:** public-install and marketplace acceptance need execution evidence against released services; do not substitute build/test results for these flows.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Existing repository facts and npm, GitHub, Vite, Node, Monaco primary docs agree; authenticated npm organization state and first-package bootstrap remain open. |
| Features | HIGH | User expectations and required v1.5 boundaries are clear; marketplace acceptance details are verified against public behavior, while legal application remains recommendation. |
| Architecture | HIGH | Source-to-artifact boundaries, one-tarball flow, GitHub/npm identity contracts, and unchanged application scope are internally consistent and source-backed. |
| Pitfalls | MEDIUM | Platform pitfalls are strongly documented; rights, combined-work licensing, and historical disclosure disposition require factual ownership review or counsel. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Maintainer authority and rights:** confirm the organization can license every first-party historical contribution and resolve any employer, contractor, copied, generated, or third-party material; legal conclusions here are recommendations, not legal advice.
- **Authenticated npm bootstrap:** confirm scope ownership, package settings, package access, and exact trust configuration before release day. The 404 and documented settings flow do not prove reservation availability.
- **History and hosted-record exposure:** manually review reachable refs, Actions logs/artifacts, releases, attachments, and LFS; rotate credentials before any cleanup and document any unavoidable exception to the complete-history promise.
- **Dependency/license disposition:** resolve unknown/custom/incompatible terms and ensure bundled notices are present in the actual tarball; do not infer compatibility from package names alone.
- **Release runner behavior:** decide explicitly whether Darwin-arm64 native output is part of the public package and verify the chosen runner preserves existing fallback semantics.
- **Marketplace source ownership/versioning:** keep the v1.5 duplicate boundary deliberate, compare promotion content, and decide later whether canonical skill ownership moves wholly to the marketplace repository.

## Sources

### Primary (HIGH confidence)

- [npm package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) — `license`, repository, engines, bin, files, and package metadata.
- [npm creating scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/) — scoped access and pre-publication checks.
- [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/) — OIDC identity binding, hosted-runner limits, permissions, and automatic provenance.
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements/) — public repository/package provenance conditions and verification.
- [npm staged publishing](https://docs.npmjs.com/creating-a-package/staged-publish) — stage/approval behavior and version floors.
- [GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.html) — Corresponding Source, notices, license-copy, conveyance, and aggregate provisions.
- [SPDX license list](https://spdx.org/licenses/) — exact `GPL-3.0-or-later` identifier.
- [GitHub setting repository visibility](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility) — exposure and ruleset consequences.
- [GitHub removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) — rotation, rewriting, and clone/fork consequences.
- [GitHub immutable releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) — draft-first release and tag/asset attestation behavior.
- [Vite build.license](https://vite.dev/config/build-options.html#build-license) — generated bundled dependency license output.
- [Monaco Editor repository](https://github.com/microsoft/monaco-editor) — canonical editor licensing and third-party notices.
- [Node.js releases](https://nodejs.org/en/about/previous-releases) — Node 24 LTS baseline.
- [Fastify server reference](https://fastify.dev/docs/latest/Reference/Server/) — existing server stack facts.

### Secondary (MEDIUM confidence)

- [ShipWithAI public marketplace](https://github.com/Ship-With-AI/skills) — thin skill distribution and installation boundary.
- [diffmux](https://github.com/Nicomalacho/diffmux) and [PRless](https://github.com/muhammadZihad/prless) — local review/distribution precedents used only as context.
- Current repository artifacts and existing scanner/build workflows — concrete package, native addon, support configuration, and release-boundary observations recorded in STACK/ARCHITECTURE.

### Tertiary (LOW confidence)

- None relied on for a release gate. Legal ownership and combined-work conclusions remain fact-specific and should be confirmed by the maintainer or qualified counsel.

---
*Research completed: 2026-09-04*
*Ready roadmap: yes*
