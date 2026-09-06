# Architecture Research

**Domain:** Private-source npm CLI distribution and public marketplace-skill publication for Cumpa v1.5
**Researched:** 2026-09-06
**Confidence:** MEDIUM overall — repository integration points are HIGH-confidence direct observations; npm behavior is grounded in current official documentation, but the requested private-repository-plus-provenance combination is explicitly unsupported

## Executive Finding: One Requirement Set Is Not Implementable as Written

The distribution work should add a small release control plane around the existing Cumpa package. It should not change the CLI, Fastify server, Vue/Monaco browser application, review protocols, repository-local persistence, export contracts, or voluntary-support rules.

A private GitHub repository can publish a public npm package through npm trusted publishing. npm exchanges the GitHub Actions OIDC identity for a short-lived publish credential, so no npm token needs to remain in CI. However, npm's current trusted-publishing documentation states that automatic provenance requires both a public package and a public source repository, and explicitly says provenance is not supported for private repositories even when the package is public. Therefore these three requirements cannot all hold simultaneously:

1. the publishing/source repository remains private;
2. the stable package is published from that repository; and
3. npm publishes a provenance attestation for it.

The milestone needs a decision before stable publication:

| Priority | Feasible result | Consequence |
|----------|-----------------|-------------|
| Preserve the private application repository (recommended because it is the milestone's privacy boundary) | Publish `@shipwithai/cumpa@1.5.0` through trusted OIDC from the private repository, without npm provenance | All distribution goals except npm provenance are achievable; the milestone must not claim provenance |
| Require npm provenance | Make the publishing source repository public | Violates the explicit repository/source/history privacy goal |
| Use a public “publication broker” repository | Provenance would attest that public broker's workflow, not the private source build | Misstates the source/build authority, conflicts with npm's exact `repository.url` check, and should not be added |

Do not hide the conflict by setting a provenance flag, uploading a homemade statement, or calling registry integrity “provenance.” Registry integrity, GitHub artifact attestations, and npm provenance are distinct claims. Stable `1.5.0` must not be published until the owner either removes the provenance acceptance criterion or changes the repository-visibility requirement.

A second bootstrap dependency exists: the npm registry currently returns 404 for `@shipwithai/cumpa`, while `npm trust` requires the package to already exist. The namespace must first be created with one correctly licensed, compiled-only prerelease published using an expiring, narrowly scoped maintainer credential and 2FA. That credential is then revoked, the trusted publisher is configured, and stable `1.5.0` is published through OIDC. This is a one-time bootstrap exception, not a second ongoing release path and not a long-lived CI token.

## Standard Architecture

### System Overview

```text
PRIVATE APPLICATION AUTHORITY
┌──────────────────────────────────────────────────────────────────────┐
│ Private GitHub repository: Ship-With-AI/cumpa                       │
│                                                                      │
│ package.json + package-lock.json      Proprietary LICENSE            │
│ src/** + tests/** + .planning/**      THIRD_PARTY_NOTICES.md         │
│ existing build scripts               fixed publish workflow          │
│ existing support deployment workflow reviewed release tag            │
└───────────────────────┬──────────────────────────────────────────────┘
                        │ checkout exact tag on GitHub-hosted runner
                        │ npm ci; configured existing build
                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│ RELEASE ASSEMBLY BOUNDARY                                             │
│                                                                      │
│ npm pack once ──> exact .tgz ──> inventory/security/behavior gates   │
│                                                                      │
│ Public payload: package.json, README, proprietary LICENSE, notices,  │
│ compiled dist/** (inspectable JS/CSS/HTML/assets; no source maps)     │
└───────────────────────┬──────────────────────────────────────────────┘
                        │ protected environment + GitHub OIDC
                        │ exact repository/workflow/environment tuple
                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│ npm registry                                                          │
│ public immutable @shipwithai/cumpa@1.5.0                             │
│ registry integrity + trusted-publisher identity                       │
│ NO npm provenance while source repository is private                  │
└───────────────────────┬──────────────────────────────────────────────┘
                        │ global install or exact-version npx
                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Existing installed Cumpa runtime                                     │
│ cumpa bin -> Node CLI -> loopback Fastify -> packaged Vue/Monaco UI  │
│ -> repository-local draft/export -> canonical agent result            │
└──────────────────────────────────────────────────────────────────────┘

PUBLIC SKILL AUTHORITY (separate work and license)
┌──────────────────────────────────────────────────────────────────────┐
│ Public Ship-With-AI/skills repository                                │
│ skills/cumpa/SKILL.md + explicit MIT license                         │
└───────────────────────┬──────────────────────────────────────────────┘
                        │ marketplace / Skills CLI install
                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Installed instruction-only skill                                     │
│ checks separately installed `cumpa` prerequisite                     │
│ delegates request, browser review, completion, and result authority  │
│ to the proprietary CLI                                                │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Status | Component | Responsibility | Concrete integration |
|--------|-----------|----------------|----------------------|
| Modified | `package.json` | Define the public package identity and exact archive surface | Change to `@shipwithai/cumpa@1.5.0`; remove `private`; retain Node `>=24` and `bin.cumpa`; set public scoped access; add custom proprietary-license metadata; allow only compiled output and required notices |
| Modified | `package-lock.json` | Keep the root package identity/version and dependency closure aligned | Update only root metadata caused by the manifest cutover; the lockfile remains private and is not shipped |
| New | Root proprietary `LICENSE` | Grant consumers the intended limited rights to install/run the package | Use approved proprietary terms and `license: "SEE LICENSE IN LICENSE"`; do not use MIT/GPL and do not use `UNLICENSED` if consumers need an express right to execute the product |
| Modified | Root `README.md` | Become the public npm package readme that npm force-includes | Replace source-checkout-only install guidance with global, exact-version npx, and separate marketplace-skill guidance; do not promise source secrecy or public repository access |
| Modified | `THIRD_PARTY_NOTICES.md` packaging | Carry notices required by the bundled browser/runtime output | Add it to the package allowlist if legal review confirms the current file is the release notice inventory |
| Unchanged | `scripts/build-bin.mjs` | Generate the executable launcher and optionally embed only the canonical public Supabase origin | The release workflow supplies `CUMPA_RELEASE_SUPPORT_SERVICE_URL`; no Stripe, GitHub OAuth, Supabase service-role, or webhook secret enters the package |
| Unchanged | TypeScript and Vite builds | Emit Node runtime and browser assets into `dist/` | Current `tsconfig.json` emits no source maps; current Vite config leaves production source maps disabled |
| Unchanged | `scripts/build-native-addon.mjs` | Emit the optional Darwin-arm64 native directory exchange only on that build target | The existing Ubuntu configured-release path omits it and runtime falls back explicitly; do not add a platform package matrix in this milestone |
| Modified | `scripts/verify-production-artifacts.mjs` | Enforce the public archive boundary and existing protected-value/origin rules | Accept the already-created tarball and inspect that exact file; fail on source, maps, tests, planning, skill, workflow, Supabase deployment, or repository-only paths |
| New | `.github/workflows/publish-npm.yml` (fixed name recommended) | Sole stable npm publication orchestrator | Exact release-tag checkout, clean build, one pack, exact-tarball checks, protected environment, OIDC publish, and public-registry acceptance; no npm secret |
| Existing, not publication authority | `.github/workflows/deploy-supabase-production.yml` | Deploy and verify the hosted voluntary-support authority | Its current configured package artifact is support deployment evidence only; it must never publish to npm or substitute for the tag-built release artifact |
| Modified | `tests/e2e/package-assets.spec.ts` and existing packaged-flow fixtures | Preserve the generated-package contract after the scoped-name cutover | Update `node_modules/cumpa` assumptions to `node_modules/@shipwithai/cumpa`, strengthen forbidden-path coverage, and retain real packaged browser behavior |
| New | Released-artifact acceptance lane | Exercise what anonymous consumers receive rather than a checkout-local substitute | Isolated global install, exact-version npx, and marketplace-installed skill flows all start from public endpoints and complete the existing browser-review contract |
| Promoted then removed from package source | `.kimi-code/skills/cumpa/SKILL.md` | Supply the already-reviewed thin skill content for initial public promotion | Copy into the public marketplace once; remove it from the npm allowlist, and make the public marketplace copy the canonical future source to avoid two drifting authorities |
| New in public repository | `Ship-With-AI/skills/skills/cumpa/` | Public MIT-licensed skill distribution | `SKILL.md` plus an explicit MIT license/notice; README/catalog discoverability follows that repository's conventions |

## Recommended Project Structure

### Private `Ship-With-AI/cumpa` Repository

```text
cumpa/
├── .github/workflows/
│   ├── deploy-supabase-production.yml   # existing support deployment authority
│   └── publish-npm.yml                   # new, fixed OIDC publication identity
├── scripts/
│   ├── build-bin.mjs                    # existing configured launcher generator
│   ├── build-native-addon.mjs           # existing optional native build
│   └── verify-production-artifacts.mjs  # modified exact-tarball boundary
├── src/                                 # private preferred source; never packed
├── tests/                               # private release gates; never packed
├── .planning/                           # private planning; never packed
├── dist/                                # generated public compiled payload
├── LICENSE                              # new proprietary package terms
├── THIRD_PARTY_NOTICES.md               # required public notices
├── README.md                            # npm-visible consumer documentation
├── package.json                         # public package contract
└── package-lock.json                    # private reproducibility input
```

### Public `Ship-With-AI/skills` Repository

```text
skills/
├── .claude-plugin/
│   ├── marketplace.json                 # existing marketplace catalog
│   └── plugin.json                      # existing plugin manifest; MIT metadata
├── skills/
│   └── cumpa/
│       ├── SKILL.md                     # instruction-only delegation
│       └── LICENSE                      # explicit MIT terms/notice
└── README.md                            # add Cumpa discovery/prerequisite entry
```

### Structure Rationale

- **One private application repository:** source, history, tests, release automation, and planning remain together and access-controlled. Do not create a public source mirror.
- **One generated package directory:** the existing `dist/` already contains `dist/bin/cumpa.mjs`, compiled Node modules, and `dist/web/**`. Publishing this output avoids a second runtime or wrapper package.
- **One public skill authority:** after promotion, the public marketplace owns the skill. Keeping packaged and marketplace copies would create version and license drift.
- **No release staging project inside the repository:** npm's `files` allowlist plus an exact-tarball verifier is sufficient. A second package workspace would duplicate manifest and dependency metadata.

## Private/Public Boundaries

| Boundary | Private side | Public side | Required guard |
|----------|--------------|-------------|----------------|
| Application source | `.git/**`, history, `src/**`, TypeScript/Vue/native source, build/release scripts | Compiled JavaScript, CSS, HTML, fonts/workers and any emitted native binary in `dist/**` | Positive `files` allowlist plus exact archive inventory; never rely only on `.npmignore` |
| Development evidence | `tests/**`, `.planning/**`, local notes, workflow logs/artifacts with private context | Only release outcome and public package metadata | Explicit forbidden top-level paths and extensions |
| Source maps | Compiler inputs and mappings | None | Keep TypeScript/Vite source-map emission disabled; reject `.map` and source-map payloads |
| Repository identity | Repository contents and history are access-controlled | `package.json.repository` may reveal the private owner/repository name because npm trusted publishing requires an exact match | Promise content privacy, not repository-name secrecy or public source access |
| Package legal terms | Approved proprietary source license text is maintained privately | The same `LICENSE` and `license: "SEE LICENSE IN LICENSE"` ship with every tarball | License text/version must be an explicit release input |
| Marketplace legal terms | No proprietary application grant | Cumpa skill instructions and MIT notice are public | Keep the skill out of the app tarball and the app code out of the skill repository |
| Support integration | Provider deployment credentials, webhook authority, OAuth secrets and database state | One canonical Supabase origin embedded in the configured launcher; optional support UI behavior | Reuse the current origin validator/scanner; never add support secrets to release inputs |
| User repositories | Git objects, worktrees, drafts, exports and review content remain on the user's machine | Nothing new is uploaded by distribution | Installed CLI retains loopback-only and local-first boundaries |

The public npm tarball is downloadable by anyone. Its compiled JavaScript and bundled browser code are inspectable and can be reformatted or reverse engineered. Excluding TypeScript, source maps, tests, planning, and history reduces disclosed development material; it does not make shipped behavior secret. Release documentation must say exactly that.

## Authority Map

| Authority | Owns | Must not own |
|-----------|------|--------------|
| Private reviewed Git tag | Source commit selected for release and version-to-commit intent | Registry mutation by itself |
| `package.json` | Name, version, engine, bin, dependency, license, access, repository and archive contract | Review behavior beyond pointing to the existing executable |
| Proprietary `LICENSE` | Rights granted for the npm application artifact | Rights for the separately MIT-licensed skill |
| Exact `.tgz` | The bytes approved for publication | Source/history secrecy claims or publication permission |
| GitHub protected release environment | Human authorization for the OIDC publication job | Long-lived npm credentials |
| npm trusted-publisher configuration | Exact private repository, workflow filename, environment and allowed publish action | Source build logic |
| GitHub Actions OIDC token | Short-lived proof of the authorized workflow context | General npm account access or non-publish commands |
| npm registry | Public immutable name/version, dependency metadata, dist integrity and install delivery | Provenance for a private source repository under current npm rules |
| Public `Ship-With-AI/skills` repository | Canonical skill text, MIT license, marketplace discovery and review history | Cumpa runtime, npm installation, review protocol implementation, results or user repositories |
| Installed `cumpa` executable | Request validation, Git grounding, browser session, review state, completion and canonical result | Marketplace installation/discovery |
| Installed skill | Agent-facing prerequisite check and delegation instructions | Auto-installation, a second review implementation, fallback review, or result synthesis |
| Existing Supabase/Stripe support authority | Voluntary-support payment and restore state | Feature licensing or npm access control |

## Trust Boundaries

### 1. Maintainer to Release Tag

Only reviewed, protected release refs should reach the publication workflow. The workflow must fail closed unless the tag, manifest version, and requested npm version all identify `1.5.0`. npm versions are immutable and cannot be corrected by republishing the same version.

### 2. Private Checkout to GitHub-Hosted Runner

The runner temporarily receives the full private checkout and resolved dependencies. Release jobs should be GitHub-hosted, use a clean dependency install with the lockfile, disable dependency caching for the release build as npm recommends, and grant no write permission until the publish job's protected environment is approved. Workflow logs and uploaded artifacts remain sensitive even though the final tarball is public.

### 3. Runner to npm

Grant only `contents: read` and `id-token: write` to the publication job. Bind npm trust to the exact case-sensitive `Ship-With-AI/cumpa` repository, the fixed workflow filename, and the protected environment. Do not set `NODE_AUTH_TOKEN` for stable publication. After bootstrap, configure npm publishing access to require 2FA and disallow traditional token publication.

`id-token: write` permits the workflow to request an OIDC token; it does not grant repository content writes. npm accepts the token only during supported publish/stage operations. A workflow filename or environment rename is a trust-boundary change, not routine refactoring.

### 4. Tarball to Anonymous Consumer

Consumers receive executable code and transitive dependencies from npm. The package must include accurate proprietary terms and required third-party notices. npm's integrity hash detects transport mismatch, not malicious or accidentally over-broad package contents; archive inventory and behavioral acceptance remain Cumpa's responsibility.

### 5. Public Skill to Coding Agent

A public skill is executable instruction supply-chain input. Its repository review protections and MIT notice matter even though it contains no application binary. The skill should check for the separate `cumpa` command and provide the exact supported installation prerequisite when absent, but it must not install or update the CLI automatically. Once found, all review authority remains in the CLI and its existing stdin/stderr/stdout contract.

## Architectural Patterns

### Pattern 1: Positive Artifact Allowlist

**What:** Keep `package.json.files` as the primary boundary: `dist/` and any explicitly required notice file. npm force-includes `package.json`, README, LICENSE, and the bin target.

**When to use:** Every pack and publish.

**Trade-offs:** Safer and simpler than a growing denylist, but generated output itself still needs inspection because private strings or source maps can appear inside allowed `dist/**` files.

Recommended manifest shape, subject to approved legal/product URLs:

```json
{
  "name": "@shipwithai/cumpa",
  "version": "1.5.0",
  "license": "SEE LICENSE IN LICENSE",
  "bin": { "cumpa": "dist/bin/cumpa.mjs" },
  "files": ["dist/", "THIRD_PARTY_NOTICES.md"],
  "publishConfig": { "access": "public" }
}
```

Do not include `.kimi-code/skills/cumpa/`; the skill is independently licensed and distributed.

### Pattern 2: Pack Once, Promote the Same Bytes

**What:** Build once, run `npm pack` once, capture its returned filename/inventory, and make that exact `.tgz` the input to scanner, clean-install behavior, and npm publication.

**When to use:** Bootstrap prerelease and every stable release.

**Trade-offs:** The verifier must accept an archive path rather than silently creating its own archive. This small change removes the larger risk of testing one tarball and publishing another.

The current `verify-production-artifacts.mjs` performs a dry-run pack and a second real pack internally. Change that integration so the release workflow owns archive creation and the verifier owns only inspection. Keep the existing protected-value, obsolete-hosted-runtime, configured-origin, and configured-launcher checks.

### Pattern 3: OIDC as Publication Capability

**What:** npm issues a short-lived publish credential only to the configured GitHub workflow/environment identity.

**When to use:** Stable `1.5.0` and all later releases after namespace bootstrap.

**Trade-offs:** No long-lived secret exists, but exact workflow/repository/environment names become external configuration. Private-repository publication still has no npm provenance.

### Pattern 4: Thin Skill as an Adapter, Not a Runtime

**What:** The MIT skill tells an agent how to invoke the separately installed proprietary binary, wait for browser completion, and consume the canonical result.

**When to use:** Marketplace installation and agent review invocation.

**Trade-offs:** Users perform two installations, but the separation prevents license mixing, version-shadowing, automatic code download, and duplicated review semantics.

The existing skill already preserves the important boundary: it does not review diffs itself, mutate Git state, or invent output when the CLI fails. Keep that content. Add only prerequisite/package/version guidance and public marketplace licensing.

### Pattern 5: Released-Artifact Acceptance

**What:** Acceptance begins from npm and the public skill repository, under isolated npm prefix/cache/home and agent configuration, not from the private checkout's `dist/` directory or symlinked `node_modules`.

**When to use:** After registry publication and after marketplace promotion.

**Trade-offs:** It is slower than source-local checks, but it is the only proof that packaging metadata, bin linking, runtime dependencies, browser assets, and skill discovery work for consumers.

## Data Flow

### Release State Flow

```text
reviewed private commit
    -> protected release tag
    -> clean configured build
    -> one exact tarball
    -> archive approved
    -> protected environment approved
    -> OIDC publish
    -> immutable npm version visible
    -> clean global and npx acceptance
    -> public MIT skill promotion
    -> clean marketplace-to-CLI acceptance
```

A failed step before npm publication can be corrected without consuming `1.5.0`. A failure after npm accepts the version must not trigger a republish attempt; investigate the immutable published artifact and issue a new version only if remediation is required.

### Source-to-Registry Flow

1. The release tag selects the exact private source commit.
2. A GitHub-hosted Node 24 job installs the lockfile's dependency graph.
3. The workflow derives the same canonical Supabase origin already used by the configured production build and passes it only to `build-bin.mjs` through the existing environment variable.
4. Existing TypeScript and Vite build paths emit `dist/bin`, compiled server/CLI/contracts/Git modules, and `dist/web`.
5. One pack operation creates the scoped package tarball. The skill, source, source maps, tests, planning, Supabase deployment, workflows, lockfile, and Git history are absent.
6. The verifier inspects and installs that same tarball. Existing packaged browser-review scenarios remain the application behavior oracle.
7. After protected-environment approval, npm exchanges GitHub OIDC for a short-lived credential and accepts that exact tarball as public `@shipwithai/cumpa@1.5.0`.
8. The registry exposes immutable package metadata and integrity. It does not expose npm provenance while the repository is private.

### Global Installation Flow

1. An anonymous clean environment resolves exact `@shipwithai/cumpa@1.5.0` from npm.
2. npm installs declared runtime dependencies and links the single `cumpa` bin to `dist/bin/cumpa.mjs`.
3. The existing CLI discovers the user's Git repository, starts its loopback-only Fastify server, serves the packaged Vue/Monaco assets, and opens the browser.
4. Existing review, draft, export, attached-agent, and voluntary-support behavior proceeds unchanged.

### Exact-Version npx Flow

1. A clean environment requests exact `@shipwithai/cumpa@1.5.0` through npx.
2. npm fetches it into its execution cache and infers `cumpa` because the package has one bin entry.
3. The same `dist/bin/cumpa.mjs` path and same review workflow execute; there is no npx-specific wrapper or reduced mode.

### Marketplace-to-CLI Delegation Flow

1. The public marketplace installs `skills/cumpa/SKILL.md` and its MIT notice from `Ship-With-AI/skills` into an isolated agent home.
2. The skill checks that Git and a separately installed compatible `cumpa` binary are available. If Cumpa is absent, it reports the exact global prerequisite; it does not silently download it.
3. The skill prepares the existing strict request and starts the binary under the agent's process supervisor from the repository being reviewed.
4. Cumpa validates and grounds the request, emits only readiness/diagnostics to stderr, and owns the browser session.
5. The developer finishes through the existing UI. Cumpa alone writes the canonical JSON result to stdout on successful completion.
6. The skill validates and reports that result without reviewing, editing, applying, staging, committing, pushing, or synthesizing fallback feedback.

### Voluntary-Support Preservation Flow

The published launcher retains the current configured-release default origin. Only the signature-verified hosted webhook remains payment authority; support remains optional and feature-neutral. The distribution layer adds no license server, entitlement check, npm authentication, payment gate, or new user-data flow. Ordinary unconfigured local builds remain support-disabled.

## Integration Points

### External Services

| Service | Integration pattern | Notes |
|---------|---------------------|-------|
| GitHub private repository | Protected tag plus fixed GitHub-hosted workflow | Source/history remain private; logs and intermediate artifacts need private retention controls |
| GitHub Actions OIDC | `id-token: write` in the publication job | Token identifies repository/workflow/environment; no stored npm secret |
| npm registry | Trusted publisher accepts exact tarball as public scoped package | Current package name is absent; bootstrap first. Private repo means no npm provenance |
| npm package settings | Exact trusted-publisher tuple, public access, 2FA, tokens disallowed after bootstrap | npm does not validate the tuple at configuration time; mismatch appears at publish time |
| Supabase production project | Existing canonical public origin is a build input | No service credential enters the application package or npm job |
| `Ship-With-AI/skills` | Public PR adds `skills/cumpa` and MIT notice | Repository README says a new directory is enough for skill discovery; update human-facing catalog text as needed |
| Skills CLI / Claude plugin marketplace | Installs the public skill directory | It transports instructions, not the proprietary app |

### Internal Boundaries

| Boundary | Communication | Rule |
|----------|---------------|------|
| `publish-npm.yml` ↔ `package.json` | Exact name/version/tag checks | Workflow must not compute or rewrite release identity opportunistically |
| Release workflow ↔ build scripts | Existing npm scripts and one canonical support-origin input | Do not fork a release-only application build implementation |
| Release workflow ↔ artifact verifier | Explicit tarball path plus expected origin | Verifier must never pack a replacement archive |
| Tarball ↔ installed CLI | `bin.cumpa` to `dist/bin/cumpa.mjs` | Preserve shebang/executable mode and Node `>=24` |
| CLI ↔ packaged browser | Existing loopback HTTP/static assets | No CDN, hosted UI, or remote review service |
| Skill ↔ CLI | Existing strict stdin request, stderr readiness/diagnostics, one stdout result | CLI owns all validation, Git grounding, browser review and completion |
| CLI ↔ voluntary support | Existing canonical hosted origin and current signed authority | Payment never controls CLI availability or review features |

## Dependency-Ordered Build Phases

### Phase 0 — Resolve Distribution Constraints

**Purpose:** Prevent an irreversible release built on contradictory acceptance criteria.

1. Record the official limitation that npm provenance is unavailable for private repositories.
2. Choose either private source plus trusted publishing without provenance (recommended) or public source plus provenance. Reject a public broker because it attests the wrong authority.
3. Obtain approved proprietary application terms that grant the intended consumer rights.
4. Confirm npm organization ownership of `@shipwithai` and a maintainer able to perform the one-time namespace bootstrap with 2FA.

**Exit gate:** The provenance/privacy decision and proprietary license text are explicit. Stable `1.5.0` remains unpublished.

### Phase 1 — Establish the Proprietary Package Contract

**Purpose:** Make one inspectable archive the complete public boundary before adding publication power.

1. Cut over `package.json`/lockfile identity to `@shipwithai/cumpa@1.5.0`, public access, the existing single bin, private-repository metadata, and approved custom-license metadata.
2. Restrict `files` to `dist/` and required notices; remove the skill path.
3. Make README consumer-facing and add the proprietary license.
4. Modify the existing artifact verifier to consume one explicit tarball and reject all private development materials and source maps while retaining support-origin/secret checks.
5. Update existing packaged-flow fixtures for the scoped install path; preserve the real CLI/server/browser test surface.

**Exit gate:** One tarball contains only the intended public compiled/metadata surface and still runs the existing browser review behavior.

### Phase 2 — Establish Publication Authority

**Purpose:** Give exactly one reviewed workflow the right to publish stable versions.

1. Add a dedicated fixed-name, tag-triggered npm release workflow; do not attach npm publication to the support deployment workflow.
2. Bind its publish job to a protected GitHub environment, GitHub-hosted runner, minimal permissions, clean dependency install, existing configured build, and one-pack artifact flow.
3. Because the package is currently absent and npm trust requires an existing package, publish a correctly licensed compiled-only prerelease under a non-stable dist-tag with an expiring granular credential and 2FA.
4. Configure npm trust for the exact private repository, fixed workflow filename, and environment. Permit only the chosen stable publication action.
5. Revoke the bootstrap credential and set npm publishing access to require 2FA and disallow traditional tokens.

**Exit gate:** The package namespace exists, no bootstrap credential remains, and only the protected OIDC workflow can publish stable versions. Do not claim provenance.

### Phase 3 — Publish and Accept the Public CLI

**Purpose:** Prove both consumer entry points against the immutable registry artifact.

1. Tag the reviewed private commit only after Phases 0–2 pass.
2. Build, pack, inspect and behavior-check one tarball, then publish those exact bytes as stable `1.5.0` through OIDC.
3. From clean environments with no source checkout, complete both exact global-install and exact-version npx browser-review flows.
4. Confirm the configured voluntary-support experience remains optional and ordinary review behavior remains unrestricted.

**Exit gate:** Anonymous users can complete the existing browser review from both package entry points, and registry metadata/integrity matches the approved artifact.

### Phase 4 — Promote and Accept the MIT Skill

**Purpose:** Publish the independent agent integration only after its prerequisite is genuinely available.

1. Promote the reviewed thin skill to `Ship-With-AI/skills/skills/cumpa/` with explicit MIT terms and compatible CLI prerequisite guidance.
2. Add marketplace discovery text required by that public repository; do not embed or vendor the proprietary package.
3. Make the public marketplace copy canonical and remove the private packaged copy/reference so two skill authorities do not drift.
4. From a clean agent home, install the marketplace skill and separately installed exact CLI, invoke a review, finish in the browser, and consume the CLI's canonical result.

**Exit gate:** Marketplace installation completes the same CLI-owned review flow without duplicated review logic or hidden CLI installation.

### Ordering Rationale

Legal/privacy feasibility precedes artifact work because it changes what may truthfully ship. The artifact contract precedes publication authority because OIDC turns packaging mistakes into immutable public releases. CLI publication precedes skill promotion because the skill declares a real external prerequisite. Marketplace acceptance comes last because it composes both independently published artifacts.

## Existing Behavior Preservation

The release layer must preserve these established invariants:

- Node.js 24 remains the runtime baseline.
- The installed command remains `cumpa`, backed by `dist/bin/cumpa.mjs`.
- Git CLI remains repository authority; distribution adds no Git library or hosted repository access.
- Fastify remains bound to `127.0.0.1` on an ephemeral port; no LAN or hosted review service is introduced.
- The packaged Vue/Monaco application is served locally from `dist/web/**`.
- Drafts and exports remain repository-local under `.cumpa/`.
- Interactive TTY selection and attached agent stdin/stdout modes remain unchanged.
- The skill does not become a second request schema, diff engine, persistence layer, result author, or code-changing agent.
- Voluntary support remains configured only in the canonical release launcher, feature-neutral, credential-free locally, and independent of package installation rights.
- Existing Ubuntu release behavior and explicit fallback remain authoritative for the optional Darwin-only native exchange; cross-platform native packaging is not added in v1.5.

## Scaling Considerations

| Scale | Architecture adjustment |
|-------|-------------------------|
| Initial release / low install volume | One npm package, one release workflow, one marketplace skill; no custom distribution service |
| More releases | Keep immutable version/tag discipline and automate exact archive inventory; do not add channels until a real prerelease need exists beyond bootstrap |
| High install volume | npm and the public Git host absorb delivery; Cumpa still needs no application backend beyond existing optional support services |
| Multiple OS-specific native requirements | Only then consider optional platform packages or prebuilds; the current runtime already treats the addon as optional |

The first practical pressure is package size and cold npx download time because Monaco and language workers are shipped. Measure the released artifact before considering asset pruning. User count does not justify splitting the CLI/server/UI into services.

## Anti-Patterns

### Anti-Pattern 1: Claiming Provenance from a Private Repository

**What people do:** Enable `--provenance` or rely on trusted publishing and report that the package has provenance.

**Why it is wrong:** npm explicitly does not generate provenance for private source repositories. The statement is false even if OIDC publication and registry integrity succeed.

**Do this instead:** Resolve the visibility/provenance requirement in Phase 0 and report the chosen guarantee precisely.

### Anti-Pattern 2: Public Provenance Broker

**What people do:** Move only the final publish command into a public repository and pass it a privately built tarball.

**Why it is wrong:** The attestation identifies the public broker workflow, not the private source build, and npm requires repository metadata to match the publishing repository. It creates a misleading authority and another supply-chain handoff.

**Do this instead:** Publish directly from the private source repository with trusted OIDC and no provenance, or make the actual source repository public if provenance becomes more important than privacy.

### Anti-Pattern 3: Verify One Archive, Publish Another

**What people do:** Let `prepack`, the verifier, and the publisher each rebuild/repack.

**Why it is wrong:** Generated asset hashes, environment-dependent launcher content, native output, or accidental files can differ.

**Do this instead:** Pack once and promote the same `.tgz` through every gate.

### Anti-Pattern 4: Denylist-Only Packaging

**What people do:** Start from the whole private checkout and add `.npmignore` entries as leaks are discovered.

**Why it is wrong:** New private directories are public by default; README/LICENSE/bin are force-included by npm regardless.

**Do this instead:** Keep a narrow `files` allowlist and inspect the final archive.

### Anti-Pattern 5: Mixing the MIT Skill into the Proprietary Tarball

**What people do:** Retain `.kimi-code/skills/cumpa/` in `package.json.files` and also copy it to the marketplace.

**Why it is wrong:** It creates two distribution authorities, confuses license scope, and makes a separate CLI prerequisite impossible to explain cleanly.

**Do this instead:** Public marketplace owns the MIT skill; npm owns only the proprietary compiled app.

### Anti-Pattern 6: Skill-Managed CLI Installation or Review Fallback

**What people do:** Have the skill auto-run mutable `latest`, download binaries, recreate review logic, or synthesize feedback if Cumpa fails.

**Why it is wrong:** It bypasses explicit user installation, changes versions silently, and creates a second unaudited authority.

**Do this instead:** Declare/check the prerequisite and delegate to the installed CLI with the established protocol.

### Anti-Pattern 7: Reusing the Support Deployment Workflow as npm Publisher

**What people do:** Add npm credentials/publication to `.github/workflows/deploy-supabase-production.yml` because it already builds a configured package.

**Why it is wrong:** Hosted support deployment and immutable package publication have different triggers, permissions, approval state and rollback behavior. A main-branch artifact is not necessarily the tagged release artifact.

**Do this instead:** Keep support deployment and npm publication as separately authorized workflows that reuse the same build input contract.

## Explicit Non-Goals: What Not to Add

- No application architecture refactor, monorepo conversion, second package workspace, wrapper CLI, bootstrapper, auto-updater, installer service, CDN, license server, entitlement check, telemetry, or remote review backend.
- No JavaScript obfuscation or claims that compiled code is secret.
- No public mirror of TypeScript source, tests, planning, workflows, or Git history.
- No source maps in the npm artifact.
- No MIT grant for the proprietary application and no proprietary restriction on the public skill.
- No long-lived npm token or stable token-based release path.
- No npm publication permission in the Supabase deployment workflow.
- No bundled skill in the npm tarball and no bundled CLI in the skill repository.
- No duplicated review, Git, persistence, export, support, or result logic in the skill.
- No platform-specific package matrix until the optional native capability becomes a measured distribution requirement.
- No provenance substitute presented as npm provenance.

## Sources

### Current Repository — HIGH Confidence (direct observation)

- `.planning/PROJECT.md` — canonical v1.5 scope, private/public boundaries, validated behavior and voluntary-support constraints.
- `package.json` — current `cumpa@0.0.0`, `private: true`, `bin.cumpa`, `files: ["dist/", ".kimi-code/skills/cumpa/"]`, build/prepack scripts, Node 24 and dependency contract.
- `scripts/build-bin.mjs` — generated executable and canonical Supabase-origin embedding.
- `scripts/build-native-addon.mjs` — Darwin-arm64-only optional output and non-target removal.
- `scripts/verify-production-artifacts.mjs` — current two-pack inventory/extraction flow, protected-value scan and support-origin checks.
- `tsconfig.json` and `vite.config.ts` — compiled output locations and absent production source-map emission.
- `.github/workflows/deploy-supabase-production.yml` — existing hosted-support deployment and configured package artifact; not an npm publisher.
- `tests/e2e/package-assets.spec.ts` — current packed inventory, clean tarball install, launcher and workflow assertions.
- `.kimi-code/skills/cumpa/SKILL.md` — existing instruction-only skill and CLI-owned review/result contract.
- npm registry response for `https://registry.npmjs.org/%40shipwithai%2Fcumpa` — HTTP 404 on the research date.

### External Documentation — MEDIUM Confidence (current official docs via research seam)

- [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) — OIDC requirements, exact publisher identity, GitHub-hosted runner, automatic provenance conditions, explicit private-repository provenance exclusion, token restrictions and troubleshooting. Page last edited 2026-09-03.
- [npm trust command](https://docs.npmjs.com/cli/v11/commands/npm-trust/) — npm 11.15 trust-management requirements, 2FA/write access, existing-package prerequisite and GitHub workflow/repository/environment fields. Page last edited 2026-06-02.
- [npm provenance statements](https://docs.npmjs.com/generating-provenance-statements/) — public matching repository, hosted CI, OIDC permission, public-access and verification model.
- [npm package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) — `files`, force-included files, `bin`, `license`, custom `SEE LICENSE IN` form and `UNLICENSED` guidance.
- [npm npx](https://docs.npmjs.com/cli/v11/commands/npx/) — exact package specifiers, cache execution and single-bin inference. Page last edited 2025-10-05.
- [GitHub OIDC reference](https://docs.github.com/en/actions/reference/security/oidc) — repository, visibility, workflow, ref, runner and environment claims; `id-token: write` boundary.

### Public Marketplace Snapshot — LOW Provider Confidence, Directly Observed Repository State

- [Ship-With-AI/skills](https://github.com/Ship-With-AI/skills) — current `skills/<name>/SKILL.md` layout, Skills CLI and Claude plugin install paths, and statement that adding a skill directory requires no additional discovery metadata.
- [Ship-With-AI marketplace manifest](https://github.com/Ship-With-AI/skills/blob/main/.claude-plugin/marketplace.json) — existing public marketplace authority.
- [Ship-With-AI plugin manifest](https://github.com/Ship-With-AI/skills/blob/main/.claude-plugin/plugin.json) — current plugin-level MIT metadata and `skills: "./skills/"` path.

---
*Architecture research for: Cumpa v1.5 Private Distribution*
*Researched: 2026-09-06*
