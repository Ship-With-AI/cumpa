# Pitfalls Research

**Domain:** Proprietary public npm CLI distribution from a private GitHub repository plus an independently MIT-licensed ShipWithAI marketplace skill
**Researched:** 2026-09-06
**Confidence:** MEDIUM

## Evidence Convention and Scope

- **Verified fact** means the statement was checked against the current repository or a current primary source linked under Sources.
- **Recommendation** means a milestone-specific release control inferred from those facts.
- **Open account fact** means public data cannot establish npm organization ownership, maintainer rights, or authenticated package settings; these must be resolved before publication.
- The research-confidence seam classifies the cross-checked npm documentation as **MEDIUM**. The most consequential finding—the incompatibility between private source and npm provenance—is stated by both npm and GitHub.
- This research covers only v1.5 distribution and skill publication. It does not reopen Cumpa review behavior or voluntary-support design.
- A public npm tarball is downloadable by anyone. Excluding TypeScript, source maps, tests, planning files, and Git history protects private development materials; it does **not** make shipped JavaScript, browser assets, strings, protocols, or algorithms secret.

## Recommended Prevention Phases

1. **Distribution Contract & Legal Boundary** — resolve the private-repository/provenance contradiction; freeze what “proprietary” permits; define accurate package, repository, license, third-party-notice, and MIT-skill boundaries.
2. **Runnable Package Candidate** — produce the compiled-only package, preserve voluntary-support configuration, inspect the actual archive, and prove the bin plus browser runtime from that archive.
3. **npm Bootstrap & Trusted Publication** — establish the scoped public package, configure the exact OIDC identity, remove long-lived publishing credentials, and publish the approved immutable version.
4. **Independent MIT Marketplace Skill** — publish the thin skill in the existing public ShipWithAI skills repository with an actual MIT license, explicit CLI prerequisite and compatibility, and a marketplace/plugin version bump.
5. **Released-Artifact Acceptance** — fetch what the public registries deliver and complete clean global, exact-version npx, and marketplace-driven browser-review flows.

## Release-Blocker Summary

| Rank | Pitfall | Severity | Prevention phase | Gate |
|------|---------|----------|------------------|------|
| 1 | Private GitHub source and npm provenance are currently incompatible | Critical | Phase 1 | Do not plan a `1.5.0` publish until the milestone chooses public source or explicitly drops npm provenance |
| 2 | Development material or secrets enter the permanent public tarball | Critical | Phases 1–2 | Approve the exact archive inventory and scan the archived bytes, not the checkout |
| 3 | Proprietary CLI and MIT skill have false or cross-contaminated license/repository metadata | Critical | Phases 1 and 4 | Each artifact has truthful, scoped terms and points only to its real repository |
| 4 | The npm scope/package cannot be bootstrapped or remains private | Critical | Phase 3 | Authenticated ownership, public access, first-publish path, and trusted-publisher settings are established before `1.5.0` |
| 5 | OIDC is bound to the wrong workflow identity | Critical | Phase 3 | Exact publisher fields, runner, permissions, npm CLI, repository metadata, and publish path agree |
| 6 | The archive omits a runtime asset or is built for the wrong platform | Critical | Phase 2 | Installed archive launches the complete browser workflow without source or dev dependencies |
| 7 | Local candidate evidence is mistaken for evidence about the public artifact | High | Phases 3 and 5 | Registry version, integrity, archive digest, installed bytes, and exercised bytes form one chain |
| 8 | Marketplace and CLI versions drift or the skill becomes a second review authority | High | Phases 4–5 | Published skill bytes, plugin version, CLI prerequisite, protocol compatibility, and clean delegated flow agree |
| 9 | Release packaging changes voluntary support or exposes hosted credentials | High | Phases 2 and 5 | Only the intended public Supabase origin is embedded; support remains optional and feature-neutral |

## Critical Pitfalls

### Pitfall 1: Promise Provenance That npm Will Not Produce From Private Source

**What goes wrong:**

The release workflow uses npm trusted publishing successfully, but `@shipwithai/cumpa@1.5.0` has no npm provenance attestation. Release notes, badges, or acceptance criteria nevertheless claim provenance. The milestone then appears complete while its strongest supply-chain claim is false.

**Why it happens:**

Trusted publishing and provenance are related but distinct. OIDC can authenticate a publication without a long-lived token. Current npm documentation says automatic provenance additionally requires a public package **and a public source repository**, and explicitly says provenance is unsupported for private repositories even when the package is public. GitHub states the same restriction because npm must be able to find the linked source repository and commit when provenance is viewed.

**How to avoid:**

Treat this as a requirements conflict, not a YAML problem. Before implementation, choose one honest contract:

- keep the Cumpa repository private and use trusted publishing **without npm provenance**; or
- make the relevant source repository and commit public and retain npm provenance.

No workflow flag, private mirror, fake public repository URL, or hand-authored badge satisfies both current requirements. If npm later changes policy, re-check the then-current official docs and demonstrate the public attestation before restoring the claim.

**Warning signs:**

- A plan treats `id-token: write` or “Published by GitHub Actions” as proof of provenance.
- `publishConfig.provenance` is enabled while the source repository remains private.
- The npm package page has no verifiable provenance entry, or its source cannot be resolved publicly.
- A proposed workaround points `repository.url` to the MIT skills repository instead of the private Cumpa source.

**Phase to address:**

Phase 1: Distribution Contract & Legal Boundary. This blocks roadmap execution because the current milestone target is infeasible as written.

---

### Pitfall 2: Confuse a Files Allowlist With Proof of No Leakage

**What goes wrong:**

The npm archive contains `.ts` files, source maps with `sourcesContent`, tests, `.planning` material, internal documentation, fixtures, local paths, environment values, or copied repository metadata. Even if a corrected release is published, the original public name/version cannot be replaced and downloaded copies cannot be recalled.

**Why it happens:**

Teams review `package.json` patterns instead of the final archive. Build tools can emit source maps or copy files under `dist/`; npm always includes `package.json`, README, LICENSE, and bin/main targets regardless of the `files` allowlist. `.git` itself is always excluded by npm, so ordinary packing does not expose Git history directly, but a build or copy step can still place patches, commit data, or source under an allowed path.

The current manifest is not release-safe yet: it is still `cumpa@0.0.0`, `private: true`, and allows both `dist/` and `.kimi-code/skills/cumpa/`. The latter would mix the separately MIT-published skill into the proprietary CLI archive. The current TypeScript configuration does not request source maps, but that default must remain an observed archive property rather than an assumption.

**How to avoid:**

Use a positive top-level allowlist limited to required compiled runtime/browser assets and deliberately included legal/user documentation. Remove the marketplace skill from the CLI package boundary. Inspect paths and contents in the exact archive that will be published; reject TypeScript, map files, tests, planning files, private operational docs, repository exports, and unexpected top-level files. Inspect maps by content if any are ever intentionally introduced. Record the archive digest so later steps cannot silently repack it.

Do not add minification or obfuscation as a secrecy control. Shipped JavaScript remains inspectable, and obfuscation complicates debugging and notice compliance without protecting the requested private materials.

**Warning signs:**

- Review stops at the `files` array or a dry-run path list.
- A broad `dist/` entry is accepted without checking what the build copied there.
- `.kimi-code/skills/cumpa/` remains in the proprietary package allowlist.
- A `.map`, `.ts`, `.planning`, `tests`, Git patch, absolute source path, or `sourcesContent` value appears in the archive.
- Release copy says “closed source” or “secret implementation” merely because `.ts` files are absent.

**Phase to address:**

Phases 1–2: define the boundary first, then enforce it against the exact package candidate.

---

### Pitfall 3: Publish Misleading or Cross-Contaminated License Metadata

**What goes wrong:**

The npm page implies MIT or open-source rights for the proprietary CLI, the marketplace skill lacks an effective MIT grant, or a root license is automatically packed into the wrong artifact. Users cannot tell what they may use, copy, or modify. A `repository` link falsely points to the public skills repository even though that repository cannot reproduce the CLI.

**Why it happens:**

“Public package,” “public source,” and “open source” are treated as synonyms. npm's `UNLICENSED` example is for private/unpublished packages where no use rights are granted; it is not a substitute for the actual proprietary terms under which a publicly installable CLI may be used. For a custom license, npm documents `SEE LICENSE IN <filename>`, with that file included at package root. npm also always packs LICENSE files, so an accidental root MIT file is not hidden by `files`.

The public `Ship-With-AI/skills` plugin manifest declares MIT, but GitHub's repository API currently reports no detected repository license and the root `LICENSE` URL returns 404. Metadata alone is a weak license boundary.

**How to avoid:**

Have the intended proprietary terms approved before publication, put them in the CLI archive, and make npm's `license` field refer to that exact file. State plainly that compiled JavaScript is publicly downloadable and inspectable but is not MIT/open-source software. Use the real private Cumpa GitHub URL in `repository.url` if required for trusted publishing; an inaccessible-but-truthful link is better than a false public source link. Use public homepage, support, security, or documentation URLs for users who cannot access the source repository.

Publish the skill only in the public skills repository, with an actual MIT license file whose scope covers the skill. Do not copy CLI code, its proprietary license, or compiled application assets into that repository. Do not include the MIT skill in the proprietary npm tarball unless the two-license composition is deliberately documented; separation is simpler and matches the milestone.

**Warning signs:**

- The CLI uses `MIT`, `ISC`, `GPL-*`, or bare `UNLICENSED` metadata despite approved proprietary terms.
- The CLI LICENSE grants rights not intended by the package owner.
- `repository.url` points to `Ship-With-AI/skills` or a public placeholder.
- The public skill has `license: MIT` metadata but no license text.
- The same LICENSE file is copied into both artifacts without a scope statement.

**Phase to address:**

Phase 1 for the CLI legal/metadata contract; Phase 4 for the independent MIT skill.

---

### Pitfall 4: Discover the npm Namespace Bootstrap Problem on Release Day

**What goes wrong:**

The production workflow cannot configure or use a trusted publisher because the exact package does not yet exist, the `shipwithai` scope is not controlled by the expected npm organization, the maintainer lacks access, or the scoped package was created as private. Someone then burns `1.5.0` as a placeholder or adds a long-lived token under deadline pressure.

**Why it happens:**

Trusted publisher setup begins in an existing package's npm settings. Public registry data for `@shipwithai/cumpa` returns 404 on the research date, but that does not establish authenticated organization ownership, name claimability, or private package state. Scoped packages publish privately by default unless public access is selected. Registry name/version pairs are immutable even after unpublish.

**How to avoid:**

Resolve account state at the start of Phase 3: verify the `shipwithai` organization, maintainer role, exact package spelling, billing/access state, and whether a hidden/private package already exists. Define a one-time bootstrap path before tagging `1.5.0`. If npm requires an initial authenticated publish before trusted-publisher settings exist, use a harmless non-`latest`, pre-`1.5.0` version with the shortest supported credential lifetime, revoke it immediately, and ensure the bootstrap's public/proprietary metadata is still truthful. Then configure OIDC and disallow traditional token publishing. Never use `1.5.0` for bootstrap.

**Warning signs:**

- No authenticated maintainer has opened the target package settings.
- A public 404 is treated as proof that the name is owned and available.
- `private: true`, `name: "cumpa"`, or `version: "0.0.0"` remains near release.
- The plan assumes the first production workflow run both creates the package and configures its trusted publisher.
- A permanent `NPM_TOKEN` appears in repository or organization secrets.

**Phase to address:**

Phase 3: npm Bootstrap & Trusted Publication, before the production version is tagged.

---

### Pitfall 5: Bind Trusted Publishing to the Wrong Identity

**What goes wrong:**

The publish job fails with authentication errors, or a broader/different workflow is authorized than the one reviewed. A reusable workflow publishes under the caller identity while npm was configured for the callee. A self-hosted runner or old npm CLI never obtains the trusted credential. A stale token silently masks the broken OIDC path.

**Why it happens:**

npm requires exact, case-sensitive GitHub owner, repository, workflow filename, and optional environment values. The workflow must live under `.github/workflows`, run on a GitHub-hosted runner, grant `id-token: write`, and use npm CLI 11.5.1 or newer. npm does not validate the binding when it is saved; failure appears only during a publish. npm also requires `package.json.repository.url` to match the GitHub repository. Reusable workflows and manual dispatches can change which workflow identity npm evaluates.

**How to avoid:**

Keep one small release workflow and bind npm to its exact filename and environment. Pin the Node/npm toolchain that satisfies trusted publishing, set read-only repository contents plus OIDC permission, and publish without `NPM_TOKEN` or `NODE_AUTH_TOKEN`. If a reusable workflow is unavoidable, bind and grant OIDC according to the identity npm actually validates. After the trusted path works, set npm publishing access to disallow traditional tokens and revoke bootstrap/automation credentials. Prefer staged publication approval if the account supports it and the extra gate is desired; do not add it merely to solve provenance, because it does not.

**Warning signs:**

- Workflow name/path/case differs between npm settings and the repository.
- `id-token: write` is missing at the effective job or caller.
- The job runs self-hosted.
- A publish succeeds only while `NODE_AUTH_TOKEN` is present.
- The package's repository metadata does not exactly name the private GitHub repository.
- A workflow refactor occurs without recreating the immutable trusted-publisher connection.

**Phase to address:**

Phase 3: npm Bootstrap & Trusted Publication.

---

### Pitfall 6: Publish a Tarball That Packs Successfully but Cannot Run

**What goes wrong:**

Installation succeeds, yet `cumpa` cannot import server modules, find the browser `index.html` or hashed Vite assets, load runtime dependencies, open the browser workflow, or complete an export. The checkout worked because TypeScript, dev dependencies, or stale `dist` files filled gaps that are absent from the installed package.

**Why it happens:**

A file inventory proves presence, not runtime closure. `prepack` can rebuild locally, while consumers receive only the produced archive and do not have private source or dev dependencies. Runtime packages accidentally placed in `devDependencies` disappear in production-only installs. Relative asset paths that work from repository root can fail under a global npm prefix or npx cache.

Cumpa also has a platform-sensitive build: `scripts/build-native-addon.mjs` emits `dist/native/directory_exchange.node` only for Darwin arm64 and removes it for other build platforms. A default Linux release runner therefore produces different bytes from an Apple-arm64 runner. That may be acceptable only if the native capability is intentionally optional and its fallback preserves the promised release behavior.

**How to avoid:**

Define the runtime closure from the installed package: generated bin, compiled CLI/server/contracts/Git modules, browser entry and hashed assets, required native artifact or verified fallback, production dependencies, proprietary license, third-party notices, and public user documentation. Build in a clean release checkout, pack once, install that archive outside the repository, and exercise the actual review/export path. Freeze the supported platform matrix and choose the release runner accordingly; do not accidentally change native capability by choosing the convenient default runner.

The current `THIRD_PARTY_NOTICES.md` is outside the current `files` allowlist and is not one of npm's always-included filenames, so it needs deliberate inclusion if its notices apply to shipped bundles.

**Warning signs:**

- Smoke checks invoke `dist/bin/cumpa.mjs` in the source checkout rather than the installed package.
- The release job builds on Linux while local evidence assumes the Darwin-arm64 addon.
- The archive has the bin file but no `dist/web/index.html`, hashed assets, server modules, or applicable notice file.
- An install hook is proposed to compile private TypeScript on the user's machine.
- The browser opens but returns a static-file 404 or export capability changes by platform.

**Phase to address:**

Phase 2: Runnable Package Candidate; repeat from the public archive in Phase 5.

---

### Pitfall 7: Break Global and Exact-Version npx Invocation Differently

**What goes wrong:**

A global install exposes no `cumpa` command, or exact-version `npx @shipwithai/cumpa@1.5.0` fails, invokes the unrelated unscoped `cumpa`, uses a stale cache, or reports a version different from the registry package. One path passes because it accidentally resolves a checkout or prior global install.

**Why it happens:**

Global installation and npm exec/npx exercise different locations. npm creates executable links from the `bin` map and expects a Node shebang. The scoped package identity and executable name are deliberately different: package `@shipwithai/cumpa`, command `cumpa`. Exact-version npx correctness also depends on publishing a single usable bin and on all its imports being present in the fetched archive.

The current generated bin has the correct Node shebang and the manifest maps `cumpa` to it, but the CLI currently declares no Commander version option. Without a runtime version surface, a user cannot distinguish a stale executable from `1.5.0` by behavior alone.

**How to avoid:**

Keep exactly one public bin mapping, preserve executable mode and shebang, and source displayed version from the packaged manifest or a single release-injected value. Document only the scoped package spec; never suggest installing bare `cumpa`. Exercise global and exact-version npx in isolated locations with clean PATH/cache assumptions, and prove the actual browser-review completion rather than only `--help`.

**Warning signs:**

- Documentation alternates between `cumpa`, `@shipwithai/cumpa`, and the unrelated unscoped package as install identities.
- `which`/PATH resolves a development shim or previous global install during acceptance.
- `npx` works only with a warm local cache.
- The package says `1.5.0` while the CLI has no version output or reports another value.
- The bin target exists only because npm always includes it, while its imported files are missing.

**Phase to address:**

Phase 2 for the package contract; Phase 5 for both released installation paths.

---

### Pitfall 8: Leak Secrets or Omit the Intended Public Support Configuration

**What goes wrong:**

A build token, OAuth credential, Stripe/Supabase secret, private endpoint, customer data, or CI value is embedded in JavaScript/native output or printed into logs. The opposite failure is also possible: the release omits the canonical public Supabase origin, silently removing the shipped voluntary-support flow. A marketplace instruction then implies support controls access.

**Why it happens:**

Compiled output can inline build-time environment values. A files allowlist excludes source paths, not secret strings copied into allowed bytes. Regex scanners cover only known shapes and file types. Cumpa's current launcher intentionally embeds `CUMPA_RELEASE_SUPPORT_SERVICE_URL` as a public canonical origin; that non-secret configuration can be confused with provider credentials or omitted when CI differs from the approved release build.

**How to avoid:**

Expose only the already-approved public Supabase origin to the release build. Keep service-role keys, Stripe secrets, OAuth secrets, npm credentials, and production payloads out of build inputs entirely. Scan the extracted archive—including generated JavaScript, HTML, CSS, JSON, and any native binary strings—against both known credentials and unexpected origins. Keep logs free of environment dumps. Verify that the configured release retains the existing optional, non-gating support behavior; the public MIT skill should merely launch the CLI and should not implement, mention as a prerequisite, or reinterpret payment state.

**Warning signs:**

- Release jobs dump environment or package contents containing credentials.
- `VITE_*`, launcher templates, or generated JSON receive broad environment objects.
- The scanner checks only source files or only a short regex list.
- The configured origin is absent, duplicated, non-HTTPS, or not the canonical Supabase origin.
- Review availability changes when support is dismissed, unavailable, or unpaid.

**Phase to address:**

Phase 2 for archive/configuration controls; Phase 5 for released behavior.

---

### Pitfall 9: Audit One Tarball and Publish Another

**What goes wrong:**

The approved candidate is safe and runnable, but the publish command runs `prepack` again from different source, environment, runner, or dependency state. npm receives different bytes. Because `@shipwithai/cumpa@1.5.0` is immutable, it cannot be overwritten with the approved archive.

**Why it happens:**

Build, pack, scan, and publish are treated as repeatable commands rather than one artifact pipeline. Current `prepack` executes the full build, and the bin build deletes `dist` before regenerating it. Repacking after review can therefore change every runtime byte and the embedded support origin. A matching version string does not establish byte identity.

**How to avoid:**

Build and pack once in the approved release context. Inspect and exercise that archive, retain its digest, then publish that exact file without a later source-directory publish or rebuild. Bind version, Git commit, workflow run, archive digest, registry integrity, and dist-tag in release evidence. If the published bytes are wrong, deprecate `1.5.0` precisely and issue a higher version; never move a source tag or claim replacement.

**Warning signs:**

- Candidate verification and publication are separate jobs that each build.
- Publication targets the package directory instead of the approved `.tgz`.
- Support configuration or runner differs between pack and publish.
- Evidence records only `1.5.0`, not archive digest and registry integrity.
- A recovery plan assumes unpublish permits reuse of `1.5.0`.

**Phase to address:**

Phases 2–3: create one candidate, then publish that candidate.

---

### Pitfall 10: Let the Marketplace Skill and CLI Version Independently Drift

**What goes wrong:**

The installed skill sends a request shape, interprets completion, or expects CLI behavior that its installed Cumpa version does not support. Users update the marketplace but not the global CLI, or update the CLI while an old cached plugin remains active. Failures look like invalid JSON, empty output, hung review sessions, or fabricated “completed” feedback.

**Why it happens:**

The two artifacts have independent release and update mechanisms. The current skill checks only that `cumpa` exists; it does not establish a compatible version, and the current CLI has no version option. Claude Code copies marketplace plugins into a versioned cache. Official plugin docs state that when `plugin.json` declares a version, users receive updates only when that field changes. The existing ShipWithAI plugin currently declares version `0.2.0`, so merely adding or editing `skills/cumpa/SKILL.md` without a plugin version bump can leave installed copies stale.

**How to avoid:**

Give the CLI a reliable version output, declare the skill's supported CLI range in its public documentation/instructions, and fail clearly before launch when the prerequisite is absent or incompatible. Bump the ShipWithAI plugin version whenever the Cumpa skill bytes or compatibility statement change. Document marketplace refresh/plugin update and CLI update as separate operations. Acceptance must start with no prior plugin cache or global CLI, then separately test the supported update path.

**Warning signs:**

- “Latest CLI” is the entire compatibility policy.
- Marketplace metadata changes without a plugin version bump.
- The skill accepts any executable named `cumpa` on PATH.
- A successful URL readiness message is mistaken for the completed canonical result.
- Clean install passes, but upgrade from the previous marketplace version is never considered.

**Phase to address:**

Phase 4 defines and publishes compatibility; Phase 5 proves clean and update behavior.

---

### Pitfall 11: Turn the MIT Skill Into a Second Review Implementation

**What goes wrong:**

The public skill begins calculating diffs, validating anchors, interpreting repository state, summarizing code, applying feedback, or silently falling back when the CLI is unavailable. Its behavior diverges from Cumpa while MIT licensing unintentionally exposes copied proprietary implementation material.

**Why it happens:**

Agent instructions can appear cheaper to change than the CLI. The existing thin skill necessarily performs integration work—resolve the requested revisions, construct the versioned request, supervise the process, and consume canonical JSON—but it already says the CLI is the review/protocol authority and forbids reviewing or mutating the repository itself. Adding “helpful” fallback logic erodes that boundary.

**How to avoid:**

Keep the public artifact to installation/prerequisite guidance and the minimum adapter needed to invoke the documented CLI contract. The CLI must remain responsible for trust-boundary validation, Git grounding, browser review, persistence, export validation, and errors. The skill must stop on missing/incompatible CLI, nonzero exit, empty/invalid output, or unsupported protocol; it must never invent feedback. Promote skill content through one canonical source/digest path rather than hand-editing private and public copies.

**Warning signs:**

- The skill contains a diff parser, review rubric, anchor verifier, JSON repair, fallback review, or repository mutation command.
- CLI errors are converted into an agent-authored review.
- Private TypeScript or compiled modules appear in the public skills repository.
- The public and private `SKILL.md` copies differ without an explicit compatibility release.

**Phase to address:**

Phase 4: Independent MIT Marketplace Skill.

---

### Pitfall 12: Verify Local Intent Instead of Publicly Delivered Artifacts

**What goes wrong:**

All checks pass against the private checkout, a local `.tgz`, or a local clone of `Ship-With-AI/skills`, but registry consumers receive a different archive, dist-tag, cached plugin version, license, or skill. Maintainers cannot prove which public bytes completed the browser review.

**Why it happens:**

A private repository prevents consumers from comparing the package with source, and npm provenance is unavailable under the private-source decision. That makes registry integrity, package signatures, retained private build evidence, and black-box behavior more important—not equivalent to provenance, but the evidence that remains. Marketplace installation also copies files into a local versioned cache rather than executing the repository checkout.

**How to avoid:**

After publication, resolve the exact registry version (not merely `latest`), record its registry integrity and archive digest, fetch it as an unauthenticated consumer, inspect its contents, and execute global plus empty-cache npx flows. Separately install the public ShipWithAI marketplace/plugin from its public repository, confirm the installed cached skill bytes/version, and complete one real delegated browser review yielding valid canonical JSON. Record clearly that registry signature/integrity proves the delivered archive and that private release records tie it to the private commit; neither is npm provenance or public source reproducibility.

**Warning signs:**

- Acceptance uses a file path, workspace link, `npm link`, private GitHub checkout, or local skill directory.
- Only `latest` is checked, so a dist-tag move can hide the tested version.
- Evidence identifies no archive digest, registry integrity, plugin version, or installed skill digest.
- A provenance badge is claimed despite the private-source limitation.
- The browser opens, but Finish and canonical-result consumption are not completed.

**Phase to address:**

Phase 5: Released-Artifact Acceptance.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Publish the directory after approving a prior archive | Fewer artifact-handling steps | Rebuild/repack invalidates every earlier check | Never for `1.5.0` |
| Leave `.kimi-code/skills/cumpa/` in npm `files` | Existing manual install still works | Blurs proprietary/MIT scope and creates two skill channels | Never after marketplace publication |
| Use `UNLICENSED` without actual proprietary terms | One metadata value | Users lack the grant needed to use the public CLI; npm page is misleading | Never for this public package |
| Keep a long-lived npm token “as fallback” | Easy recovery from OIDC errors | Broken trusted publishing stays hidden; token can leak or outlive need | Never after bootstrap |
| Copy the skill manually between repositories | No release tooling | Silent protocol/version drift | Acceptable only if the release gate compares exact bytes/digest |
| Depend on `latest` for tests or docs | Shorter commands | Cannot prove `1.5.0`; later dist-tag moves change behavior | Never in release acceptance |
| Add obfuscation/minification to claim secrecy | Smaller/more opaque-looking JS | False assurance, worse debugging, possible notice loss | Minification only for measured web size, never secrecy |
| Install/build the CLI from the marketplace skill | One apparent install action | Executes extra supply-chain code and violates separately installed prerequisite | Never in v1.5 |

## Integration Gotchas

| Integration | Common mistake | Correct approach |
|-------------|----------------|------------------|
| npm scoped publication | Assume a scoped package is public by default | Establish `@shipwithai/cumpa` under the correct org and explicitly set public access |
| npm trusted publisher | Configure an approximate repo/workflow identity | Match case-sensitive owner, repository, workflow filename, environment, and `repository.url`; use supported npm and hosted runner |
| GitHub Actions OIDC | Keep `NODE_AUTH_TOKEN` while claiming tokenless publication | Grant OIDC at the effective job and remove publishing tokens after bootstrap |
| npm provenance | Treat OIDC as automatic provenance from private source | Resolve the requirement conflict; current npm does not support private-repo provenance |
| npm packlist | Expect `files` to exclude every unlisted root file | Remember package.json, README, LICENSE, and bin/main targets are forced in; inspect the archive |
| npm npx/exec | Invoke the bare package name or test with an existing global install | Use the exact scoped version in a clean environment and confirm the fetched archive's bin |
| ShipWithAI plugin | Add the skill without changing plugin version/catalog copy | Add `skills/cumpa/SKILL.md`, update public inventory/description as needed, and bump the plugin version |
| Marketplace cache | Test the source checkout | Test the copied installed plugin and document marketplace refresh versus plugin update |
| Public MIT license | Rely only on `license: MIT` JSON | Add actual MIT text scoped to the public skill/repository |
| Supabase support | Treat the public origin as a secret or pass real credentials to the build | Embed only the approved canonical origin; keep every credential server-side |

## Performance Traps

Distribution introduces no user-count scaling problem. The relevant scale is artifact size and cold installation.

| Trap | Symptoms | Prevention | When it breaks |
|------|----------|------------|----------------|
| Pack source maps, tests, or duplicate skill/application copies | Slow cold npx, larger cache, more disclosure surface | Compiled-runtime allowlist and exact archive inventory | Immediately for empty-cache npx; cost grows with every bundled asset |
| Validate only warm npx | Fast local demo, slow or failing first run | Include an empty-cache released-artifact path | First-time users and clean CI environments |
| Rebuild native output per platform under one version | Different capability/performance for same version | Freeze supported platforms and release runner; verify fallback or ship deliberate platform artifacts | As soon as release runner differs from tested machine |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Long-lived npm token remains available to release jobs | Persistent package takeover credential | One-time short-lived bootstrap only if necessary; OIDC thereafter; disallow tokens and revoke old credentials |
| Publish workflow accepts an unreviewed ref or mutable input | Wrong private commit becomes permanent public bytes | Release only the approved immutable ref/archive with environment approval if used |
| Build receives broad production secrets | Secrets become archive strings, logs, or subprocess environment | Give build only public configuration; keep hosted credentials out of the job |
| Secret scanner checks only known text extensions | Native output, maps, compressed assets, or novel token formats escape | Scan extracted inventory and unexpected origins; manually review generated configuration |
| Marketplace skill automatically installs/runs arbitrary CLI versions | Supply-chain substitution or incompatible protocol execution | Separately documented exact package, compatible versions, and explicit failure on mismatch |
| False provenance/repository metadata | Users trust a source/build relationship that does not exist | Publish only verifiable claims and truthful private-repository metadata |

## UX Pitfalls

| Pitfall | User impact | Better approach |
|---------|-------------|-----------------|
| Package and command names are conflated | Users install the unrelated bare package or cannot invoke Cumpa | Always distinguish `@shipwithai/cumpa` (package) from `cumpa` (command) |
| Skill installation appears to install the CLI | Invocation fails with “command not found” | Put the separate CLI prerequisite, Node 24+, and Git requirement before first use |
| Plugin update is presented as a CLI update | Old executable remains incompatible | Document marketplace/plugin and npm CLI update paths separately |
| Private repository link is the only support/documentation link | Public users hit 404/authorization walls | Provide public docs, support, and security contacts while keeping repository metadata truthful |
| Support copy sounds like a license or feature gate | Users believe payment is required | Preserve voluntary, feature-neutral wording and unrestricted review behavior |
| “Closed source” overpromises secrecy | Users later discover readable compiled JavaScript | Say exactly which development materials are excluded and that shipped code is inspectable |

## "Looks Done But Isn't" Checklist

- [ ] **Requirements:** Private-source npm provenance conflict has an explicit approved resolution; no unsupported provenance claim remains.
- [ ] **Package identity:** Public artifact is exactly `@shipwithai/cumpa@1.5.0`; executable is `cumpa`; runtime version agrees.
- [ ] **Archive boundary:** No TypeScript, source maps, tests, `.planning`, repository exports/history, private skill copy, or unexpected generated file is present.
- [ ] **Runtime closure:** CLI, server, web entry/assets, runtime dependencies, required native capability or fallback, licenses, and notices work from the installed archive.
- [ ] **Legal metadata:** Proprietary terms are present and accurately referenced; repository/homepage/bugs/security URLs do not imply public source or MIT application licensing.
- [ ] **Trusted publishing:** Exact package-level OIDC binding works without a publishing token and traditional tokens are disabled/revoked after bootstrap.
- [ ] **Public access:** Scoped package is actually public and exact version is unauthenticated-downloadable.
- [ ] **Artifact identity:** Approved archive digest and npm registry integrity identify the same published bytes; no repack occurred.
- [ ] **Global path:** A clean global install exposes and runs `cumpa` through the full browser-review completion path.
- [ ] **npx path:** A clean empty-cache exact-version invocation fetches and runs `@shipwithai/cumpa@1.5.0`, not a local/global substitute.
- [ ] **MIT skill:** Public skill repository contains actual MIT terms and no proprietary CLI/source bytes.
- [ ] **Marketplace version:** Plugin/catalog/inventory changes are published with a version bump and the installed cached copy contains the intended skill.
- [ ] **Compatibility:** Missing or incompatible CLI fails explicitly; no skill-generated fallback review exists.
- [ ] **Delegation:** Marketplace flow reaches Cumpa, waits for Finish, and consumes one valid canonical result.
- [ ] **Support:** Canonical public Supabase origin is present, no credential is present, and unpaid/dismissed support leaves all review behavior available.

## Recovery Strategies

| Pitfall | Recovery cost | Recovery steps |
|---------|---------------|----------------|
| Private-source provenance contradiction found before publish | MEDIUM | Amend milestone/roadmap to choose private source without provenance or public source with provenance; update all claims consistently |
| Secret published in npm archive | HIGH | Revoke/rotate first, assess exposure, request unpublish if eligible, deprecate affected version, publish corrected higher version; assume downloads persist |
| TypeScript/source map/planning file published | HIGH | Treat as irreversible disclosure, deprecate/unpublish where eligible, correct allowlist/build, publish higher version; do not claim recall |
| Wrong license or repository metadata in immutable archive | HIGH | Obtain legal disposition, deprecate affected version, correct metadata and license text in a higher version, correct mutable public documentation without pretending tarball changed |
| `1.5.0` runtime broken | HIGH | Deprecate with precise message and publish a fixed higher version; never reuse the version |
| Trusted publisher misconfigured before publish | LOW | Correct/recreate the package-level binding and workflow identity; do not add a persistent token workaround |
| Bootstrap package accidentally private | MEDIUM | Correct npm access with authenticated owner rights before stable release and re-check unauthenticated visibility |
| Marketplace skill stale or wrong | MEDIUM | Correct the public skill, bump plugin version, update catalog/docs, and direct users through marketplace refresh/plugin update; old caches may persist |
| Skill incompatible with CLI | MEDIUM | Publish corrected skill/plugin version or corrected higher CLI version according to which contract is wrong; state the compatible pair explicitly |
| Support configuration omitted | HIGH | Deprecate the misconfigured package if it violates release requirements and publish a corrected higher version from the approved configured artifact |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention phase | Verification outcome |
|---------|------------------|----------------------|
| Unsupported private-repo provenance | Phase 1: Distribution Contract & Legal Boundary | Release contract contains no mutually impossible or unverifiable provenance claim |
| Source/history/development-material leakage | Phase 2: Runnable Package Candidate | Exact archive inventory and extracted contents satisfy the compiled-only boundary |
| Proprietary/MIT license contamination | Phases 1 and 4 | CLI and skill each carry only their intended license and repository metadata |
| Namespace/bootstrap/access failure | Phase 3: npm Bootstrap & Trusted Publication | Authenticated settings and unauthenticated package visibility prove the correct scope/package |
| Trusted publisher identity mismatch | Phase 3 | Approved workflow publishes without long-lived token under the exact binding |
| Secret or support-config error | Phase 2 | Archive contains only the approved public origin and preserves voluntary support |
| Runtime omissions/platform variance | Phase 2 | Archive-installed full browser workflow succeeds on declared target environments |
| Global/npx bin failure | Phases 2 and 5 | Both clean paths invoke exact `1.5.0` bytes and complete the workflow |
| Candidate/published byte mismatch | Phases 3 and 5 | Candidate digest, registry integrity, downloaded archive, and tested bytes agree |
| Skill/CLI version drift | Phases 4 and 5 | Published compatibility plus clean installed pair succeed; incompatible pair fails clearly |
| Duplicated review authority | Phase 4 | Skill only adapts/supervises; CLI owns validation, Git grounding, UI, export, and errors |
| Public artifact unverifiable | Phase 5 | Publicly fetched package/plugin evidence is recorded with honest no-provenance limitation |

## Explicit Non-Additions

- Do not add an obfuscator, source-map scrubber dependency, or minifier to claim secrecy; exclude private development artifacts and describe the remaining visibility honestly.
- Do not publish a fake public source mirror, empty repository, or the MIT skills repository as Cumpa's `repository.url` to manufacture provenance.
- Do not add a long-lived npm token as an OIDC fallback.
- Do not add install/postinstall hooks that fetch private source, compile on consumer machines, install the CLI from the skill, or mutate global software.
- Do not embed Cumpa runtime code, review logic, payment logic, or a fallback reviewer in the MIT skill.
- Do not create a second package name, registry, installer, or marketplace solely to avoid resolving the approved `@shipwithai/cumpa` bootstrap.
- Do not redesign validated review behavior or voluntary-support behavior during distribution work.

## Sources

### npm and GitHub primary sources

- [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) — OIDC requirements, exact publisher binding, hosted runners, token restrictions, automatic provenance conditions, private-repository limitation, and troubleshooting. **Confidence: MEDIUM (research seam; primary source).**
- [npm provenance statements](https://docs.npmjs.com/generating-provenance-statements) — public repository metadata prerequisite, hosted CI, public first publication, and attestation verification. **Confidence: MEDIUM (research seam; primary source).**
- [GitHub: npm provenance from private source repositories is no longer supported](https://github.blog/changelog/2023-07-25-publishing-with-npm-provenance-from-private-source-repositories-is-no-longer-supported/) — independent confirmation that public packages cannot carry npm provenance from private GitHub source. **Confidence: MEDIUM (cross-checked primary source).**
- [npm package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json) — files allowlist, forced inclusions/exclusions, bin/shebang, repository, and custom-license metadata. **Confidence: MEDIUM (research seam; primary source).**
- [npm scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages) — scoped packages default private, explicit public access, sensitive-data warning, and staged publishing. **Confidence: MEDIUM (research seam; primary source; page last edited 2026-05-20).**
- [npm pack](https://docs.npmjs.com/cli/v11/commands/npm-pack) — archive behavior, dry-run/JSON inventory, destination, and script controls. **Confidence: MEDIUM (research seam; primary source).**
- [npm unpublish policy](https://docs.npmjs.com/policies/unpublish) — immutable registry data, non-reusable name/version pairs, and deprecation as normal recovery. **Confidence: MEDIUM (primary source).**

### Marketplace primary sources

- [Ship-With-AI/skills](https://github.com/Ship-With-AI/skills) — current public marketplace layout, install paths, one-plugin structure, and skill inventory. **Confidence: MEDIUM (current repository).**
- [Current marketplace catalog](https://raw.githubusercontent.com/Ship-With-AI/skills/main/.claude-plugin/marketplace.json) and [plugin manifest](https://raw.githubusercontent.com/Ship-With-AI/skills/main/.claude-plugin/plugin.json) — `ship-with-ai@ship-with-ai-skills`, root source, `./skills/`, version `0.2.0`, and declared MIT metadata. **Confidence: MEDIUM (current public artifacts).**
- [GitHub repository API for Ship-With-AI/skills](https://api.github.com/repos/Ship-With-AI/skills) — repository public and current API `license: null`; root LICENSE fetch returned 404 on the research date. **Confidence: MEDIUM (current GitHub state).**
- [Claude Code plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) and [plugins reference](https://code.claude.com/docs/en/plugins-reference) — marketplace/plugin version behavior, skill discovery, installation cache, update mechanics, and validation model. **Confidence: MEDIUM (primary platform documentation).**

### Current Cumpa repository evidence

- `.planning/PROJECT.md` — canonical v1.5 goal, privacy boundary, package identity, separate MIT skill, clean flows, and voluntary-support constraint.
- `package.json` — current pre-release identity, `private: true`, bin, `files`, runtime dependencies, and `prepack` build.
- `tsconfig.json` and `vite.config.ts` — current compiled outputs and absence of an intentional source-map contract.
- `scripts/build-bin.mjs` — generated executable/shebang, destructive `dist` regeneration, and public support-origin embedding.
- `scripts/build-native-addon.mjs` — Darwin-arm64-only native output and nonmatching-platform removal.
- `scripts/verify-production-artifacts.mjs` — current pack/extract scan scope and support-origin checks.
- `.kimi-code/skills/cumpa/SKILL.md` — current thin delegation contract and separately installed CLI assumption.
- `THIRD_PARTY_NOTICES.md` — existing notice set currently outside the npm `files` allowlist.
- Public registry lookup for `@shipwithai/cumpa` returned 404 on 2026-09-06; this is not proof of authenticated ownership or availability.

---
*Pitfalls research for: Cumpa v1.5 Private Distribution*
*Researched: 2026-09-06*
