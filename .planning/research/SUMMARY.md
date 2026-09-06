# Project Research Summary

**Project:** Cumpa v1.5 Private Distribution
**Domain:** Proprietary public npm CLI distribution from a private GitHub repository, with an independent public MIT marketplace skill
**Researched:** 2026-09-06
**Confidence:** MEDIUM

## Executive Summary

Cumpa v1.5 is a distribution milestone, not a product-runtime redesign. The researched solution keeps the existing Node 24/TypeScript CLI, browser review behavior, local-first data boundaries, support behavior, and thin agent protocol unchanged, then adds a small release control plane. A public scoped proprietary npm package (`@shipwithai/cumpa@1.5.0`) should be assembled from compiled runtime output, published from the private GitHub repository using npm trusted publishing (GitHub OIDC), and paired with a separately published MIT skill in the existing public ShipWithAI marketplace.

There is one hard, explicit requirement conflict: npm trusted publishing from a private GitHub repository is supported, but npm provenance is not supported for private-source repositories. No workflow flag, checksum, GitHub attestation, public mirror, or misleading repository URL resolves this. Preserve the fixed repository-privacy requirement and use tokenless OIDC trusted publishing without provenance; record provenance as unavailable rather than claiming it. If provenance later becomes non-negotiable, the repository-visibility requirement must change before implementation.

The main risks are irreversible package leakage, publishing an archive different from the reviewed archive, incorrect OIDC identity binding, bootstrap deadlock for a package that does not yet exist, and false clean-install evidence from a checkout or warm cache. Prevent them with an explicit license and artifact contract, positive allowlisting plus exact `.tgz` inspection, build/pack/publish of the same bytes, a one-time non-`latest` bootstrap, exact npm trusted-publisher configuration, and isolated global/npx/marketplace acceptance.

## Key Findings

### Recommended Stack

Keep the existing application stack and add no release framework or publication library. Use npm, Node.js 24/npm 11.19.x, GitHub Actions on a GitHub-hosted `macos-15` runner, the current production build and `scripts/verify-production-artifacts.mjs`, and the existing public ShipWithAI marketplace. The release workflow should use `id-token: write` and no long-lived `NPM_TOKEN`/`NODE_AUTH_TOKEN`; omit every provenance flag while the source repository is private.

**Core technologies:**
- `@shipwithai/cumpa@1.5.0`: public scoped npm CLI with the existing single `cumpa` bin; proprietary terms govern use, not registry visibility.
- Node.js 24 and bundled npm 11.19.x: preserve the supported runtime and satisfy current trusted-publisher tooling requirements.
- GitHub Actions OIDC trusted publishing: short-lived, tokenless npm authentication bound to the exact private repository/workflow/environment.
- `npm pack` plus the existing production-artifact verifier: inspect the exact archive that will be published; do not rebuild between verification and publication.
- Public ShipWithAI marketplace plugin: publish only the thin MIT delegation skill; require the proprietary CLI as a separate prerequisite.

### Expected Features

The release must preserve existing review, persistence, export, Git, browser, and voluntary-support behavior. New acceptance is about what anonymous consumers receive, not what works from the maintainer checkout.

**Must (table stakes):**
- Public proprietary package identity and accurate metadata: scoped name, version, `bin`, Node `>=24`, public access, truthful private repository URL, custom `LICENSE`, README, and third-party notices.
- Complete narrow tarball: compiled Node/browser/native runtime is present while source, maps, declarations, tests, fixtures, planning files, workflows, Git data, and private operational material are absent.
- Exact global and one-shot installs: `npm install --global @shipwithai/cumpa@1.5.0` and isolated `npx --yes @shipwithai/cumpa@1.5.0` launch the same existing application.
- Tokenless trusted publication from the private repository, including safe first-publication bootstrap and subsequent token revocation/disallowance.
- Explicit provenance decision: private repository means no npm provenance; never imply OIDC authentication is provenance.
- Independent self-contained MIT marketplace skill with an actionable separately installed CLI prerequisite and thin delegation only.
- Clean released-artifact acceptance for global, npx, and marketplace paths, including real browser review and canonical output.

**Should have (competitive):**
- Deliberate two-artifact license boundary: proprietary executable versus MIT instruction-only skill.
- Immutable acceptance evidence linking tag, archive digest, registry integrity, resolved versions, and exercised bytes.
- One review authority across every launch path, avoiding duplicated Git/diff/protocol logic.
- Honest disclosure that compiled JavaScript and browser assets are public and inspectable even when development source/history stay private.

**Defer (v2+):**
- Public application source or history, source obfuscation/encryption/DRM, activation or license servers.
- Automatic CLI installation, hooks, MCP servers, custom installers, self-updaters, or another marketplace.
- New review behavior, protocol redesign, payment gates, or a release framework/license-scanner dependency.
- npm provenance from a private source unless npm documents support; this is a platform watch item, not a hidden implementation task.

### Architecture Approach

Add a release control plane around the unchanged application. A reviewed private tag enters one fixed workflow, receives a clean configured build, is packed once, passes archive and secret/content checks, and the exact tarball is published through protected OIDC. The published CLI remains the sole review authority; the public skill is an adapter that checks for `cumpa`, delegates to it, and consumes the existing completion contract. Keep the application and release authority in the private repository, and make the public marketplace the sole authority for the promoted skill.

**Major components:**
1. **Package contract and artifact boundary** — manifest, proprietary license, public README, notices, positive `files` allowlist, and exact archive verifier.
2. **Release workflow** — fixed tag/version checks, GitHub-hosted build, one pack, protected environment, exact npm trusted-publisher binding, OIDC publish, and no provenance flags.
3. **Published CLI** — existing compiled runtime, loopback server/browser review, Git grounding, persistence/export, and optional support behavior unchanged.
4. **Public MIT skill** — self-contained marketplace metadata and thin prerequisite/delegation instructions; no embedded CLI or duplicated review implementation.
5. **Released-artifact acceptance lane** — isolated npm prefix/cache and agent profile proving global, npx, and marketplace behavior from public artifacts only.

### Critical Pitfalls

1. **Promise npm provenance from a private source** — resolve the contradiction in the distribution contract phase; preserve privacy, publish with OIDC without provenance, and state the limitation plainly.
2. **Treat `files` as proof of no leakage** — inspect extracted bytes and reject source, maps/` sourcesContent`, tests, planning data, secrets, unexpected paths, and the separately published skill.
3. **Publish a second archive** — build, pack, inspect, install, and publish the same `.tgz`, retaining digest/integrity evidence; npm versions are immutable.
4. **Mis-bind or deadlock trusted publishing** — verify npm scope/ownership and package settings, bootstrap a truthful non-`latest` version with tightly controlled 2FA, then bind exact case-sensitive repository/workflow/environment fields and remove traditional tokens.
5. **Mistake local evidence for consumer evidence** — use isolated caches, prefixes, profiles, and unrelated fixture repositories; prove the exact global, npx, and marketplace paths complete a real review.
6. **Break platform/runtime or support boundaries** — build on the intended hosted runner, verify native/browser closure, keep only the approved public support origin, and never ship credentials or make support payment-gating.

## Implications for Roadmap

The dependency order is mandatory because npm package metadata and legal boundaries are force-included before any trusted-publisher setup, and marketplace acceptance depends on a released CLI.

### Phase 1: Distribution contract, decision, and legal boundary

**Rationale:** The private-repository/provenance incompatibility blocks the milestone as originally phrased and must be resolved before release work. Freeze the recommended contract: private source repository, public proprietary npm runtime, tokenless OIDC trusted publishing, no npm provenance, and independent MIT skill. Approve proprietary terms, public links, third-party notices, package metadata, and the separation of CLI and skill. Update public-facing guidance without changing product behavior.

**Delivers:** requirement-ready package/license/channel boundaries and the explicit provenance decision.

**Avoids:** provenance theater, false open-source metadata, accidental MIT/proprietary mixing, and an unsafe bootstrap artifact.

**Research flag:** Re-check npm's current private-repository provenance policy immediately before release; legal/account ownership facts also need planning-time confirmation.

### Phase 2: Runnable package candidate and archive proof

**Rationale:** Prove the compiled package is complete and safe before registry mutation. Change only publication-facing manifest/readme/license/allowlist details, reuse the existing build and verifier, pack once, and install the archive outside the checkout. Preserve Node 24, native runner assumptions, browser assets, notices, and voluntary support.

**Delivers:** a digest-recorded, compiled-only `.tgz` that launches the existing application and contains no private development material.

**Avoids:** leakage, missing runtime assets, wrong-platform output, secret embedding, and checkout-only smoke evidence.

**Research flag:** Mostly standard npm packaging, but platform/native closure and the actual archive require targeted implementation research or direct acceptance.

### Phase 3: npm bootstrap and trusted publication

**Rationale:** npm trusted-publisher configuration generally requires an existing package, while the target package currently does not exist. Publish a complete truthful prerelease under a non-`latest` tag through tightly controlled interactive 2FA, configure the exact OIDC relationship, prove the workflow with no CI token, then revoke/disallow obsolete token publication and publish `1.5.0` from the approved tarball.

**Delivers:** public `@shipwithai/cumpa@1.5.0` with tokenless trusted publication and recorded tag/version/archive/registry evidence, explicitly without provenance.

**Avoids:** release-day namespace deadlock, wrong workflow identity, accidental private scoped package, long-lived credentials, and repacking.

**Research flag:** Needs release-time account/namespace validation and current npm/GitHub documentation check; these cannot be inferred from public registry data alone.

### Phase 4: Independent MIT marketplace skill

**Rationale:** Promote the existing thin skill only after CLI contracts and license boundaries are stable. Copy it into the existing public ShipWithAI marketplace convention, add explicit MIT terms and version metadata, and state the separately installed exact CLI prerequisite. Do not bundle or auto-install the CLI.

**Delivers:** independently installable public skill that delegates to the released executable without duplicating review logic.

**Avoids:** license contamination, checkout dependence, hidden installation, version drift, and a second review authority.

**Research flag:** Existing marketplace conventions are sufficiently documented; validate exact repository/catalog/plugin details during implementation.

### Phase 5: Clean released-artifact acceptance and release evidence

**Rationale:** Acceptance must exercise public registry/catalog bytes, not local output. In isolated npm prefixes/caches and agent profiles, run exact global, exact npx, and marketplace flows against unrelated fixture repositories, finish a real browser review, validate canonical output, test missing-CLI failure, and verify independent update/uninstall behavior.

**Delivers:** requirement-ready evidence that every public launch surface preserves existing behavior and support neutrality.

**Avoids:** warm-cache/local-link false positives, stale executable selection, broken browser assets, plugin/CLI drift, and support/payment regressions.

**Research flag:** No broad architecture research needed; this phase needs focused end-to-end environment/runbook design.

### Explicit anti-features and non-goals

Do not make the repository public, claim compiled artifacts are secret, add source maps or development files, bundle the skill, auto-install the CLI, create a public source mirror for provenance, add custom installers or release frameworks, redesign review behavior, or gate review on payment/license activation. Do not “solve” provenance by changing the fixed privacy requirement without an explicit decision.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core recommendations use current npm/GitHub/Node documentation and existing repository tools; account settings and future provenance policy need release-time checks. |
| Features | MEDIUM | Table stakes and acceptance matrix are grounded in first-party package/marketplace mechanics and existing Cumpa contracts; clean-environment execution remains to be performed. |
| Architecture | MEDIUM | Repository integration points and authority boundaries are directly observed; the provenance constraint is a documented platform limitation. |
| Pitfalls | MEDIUM | Critical failure modes are cross-checked against official npm/GitHub behavior and the current manifest/build; environment-specific account and runner facts remain open. |

**Overall confidence:** MEDIUM

### Gaps Address

- **npm organization/package ownership and 2FA state:** verify authenticated scope ownership, package settings, and maintainer permissions before bootstrap.
- **Exact proprietary license terms and notice inventory:** obtain approved legal text before the first public prerelease; do not improvise license code or rely on metadata alone.
- **Runner/native artifact matrix:** confirm the intended `macos-15` output and fallback behavior in the packaged acceptance environment.
- **Marketplace repository/catalog state:** validate the current plugin path, manifest version conventions, and MIT license placement before promotion.
- **Provenance policy:** re-check official npm documentation immediately before each release-policy revision; enable provenance only if private-source support is explicitly documented.

## Sources

### Primary

- [npm package.json reference](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) — `private`, `license`, `files`, `bin`, `repository`, `engines`, and always-included files.
- [npm scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/) — public access for scoped packages.
- [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/) — OIDC requirements, supported runners/tooling, and provenance limitation for private repositories.
- [npm pack](https://docs.npmjs.com/cli/v11/commands/npm-pack/) — publishable tarball creation and inspection.
- [npm exec / npx](https://docs.npmjs.com/cli/v11/commands/npm-exec/) — cache and local-package resolution semantics.
- [GitHub/npm provenance documentation and changelog](https://github.blog/changelog/2023-04-19-npm-provenance-public-beta/) — provenance requires a public source repository.
- [ShipWithAI plugin conventions](https://raw.githubusercontent.com/Ship-With-AI/shipwithai-plugins/main/plugins/starter/.claude-plugin/plugin.json) — public plugin metadata precedent.

### Secondary

- `.planning/research/STACK.md` — stack, packaging, trusted-publishing, bootstrap, and channel recommendations.
- `.planning/research/FEATURES.md` — table stakes, differentiators, anti-features, dependencies, and acceptance matrix.
- `.planning/research/ARCHITECTURE.md` — control-plane architecture, authority map, boundaries, and data flow.
- `.planning/research/PITFALLS.md` — prevention phases, critical pitfalls, warning signs, and release safeguards.
- Existing Cumpa artifacts (`package.json`, README, build/verifier scripts, skill) — current contracts and integration points.

---
*Research completed: 2026-09-06*
*Ready roadmap: yes*
