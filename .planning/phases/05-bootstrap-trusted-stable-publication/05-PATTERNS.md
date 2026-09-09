# Phase 5: Bootstrap & Trusted Stable Publication — Pattern Map

**Mapped:** 2026-09-09  
**Files analyzed:** 12 candidate integration points (including proposed files)  
**Analogs found:** 11 / 12 (workflow publisher is the only no-producing analog)

## Scope and observed constraints

- Phase 04's approved `@shipwithai/cumpa@1.5.0` archive and its evidence are immutable inputs. A bootstrap must be a separate package version/tag/cycle; it must not repack, rename, or replace the approved tarball.
- `package.json` is currently `1.5.0`; the producer and verifier both hard-code package identity/version. Stable checks must remain exact `1.5.0` checks, not become permissive merely to support bootstrap.
- The current producer is source/build driven: `scripts/pack-runtime.mjs` captures Git `HEAD`, tree, tracked diff, package/lock/input hashes, legal hashes, archive byte length/SHA-256/SHA-1/SHA-512, build identity, and support configuration. It runs `npm run build`, then `npm pack --json --ignore-scripts`.
- The verifier is non-producing and re-hashes the supplied archive without changing it. It validates bounded archive inventory, package identity, source hashes, legal files, native identity, support state, and extracted package content. It currently requires `1.5.0` in both evidence and extracted `package.json`.
- `src/cli/run.ts` already accepts full semver including prerelease identifiers and build metadata (`semanticVersionPattern`); no CLI semver change is needed to *read* a bootstrap version. This is not a release-policy decision: npm tag/version policy still needs to be fixed by the planner.
- `scripts/verify-supabase-support.mjs` is a consumer of runtime producer/verifier output (`verifyRuntimeArtifact`), and its retirement/final-review policy explicitly names package verifier paths. Bootstrap generalization must cover this caller or keep a separate, explicit purpose/contract; do not silently make its stable evidence assertions broad.
- No npm publishing workflow exists. `.github/workflows/deploy-supabase-production.yml` is only an analog; it is not safe to copy its production secrets, Supabase environment, or deployment mutation steps into npm publication.

## File Classification

| Candidate file | Role | Data flow | Closest analog | Match quality |
|---|---|---|---|---|
| `package.json` | config/package metadata | request-response (npm manifest) | existing manifest + `src/cli/run.ts:55-79` | exact |
| `scripts/pack-runtime.mjs` | producer | batch/file-I/O | current producer `main()` and `packageContract()` | exact |
| `scripts/verify-production-artifacts.mjs` | verifier | batch/file-I/O | current verifier `readEvidence()`, `checkArchiveIdentity()`, `verify()` | exact |
| `scripts/verify-supabase-support.mjs` | consumer/orchestrator | batch/event-driven subprocess | `verifyRuntimeArtifact()` lines 282-329; final input binding | exact |
| `tests/helpers/runtime-artifact.ts` | test/consumer helper | batch/install/file-I/O | `readRuntimeArtifact()`, `installRuntimeArtifact()` | exact |
| `tests/helpers/source-control-snapshot.ts` | test guard | snapshot/compare | `captureSourceControlSnapshot()` + `assertSourceControlUnchanged()` | exact |
| `tests/package/runtime-producer.test.ts` | producer boundary test | subprocess/batch | fixture producer and identity assertions | exact |
| `tests/package/runtime-artifact-verifier.test.ts` | verifier boundary test | subprocess/batch | archive identity/re-verification tests | exact |
| `tests/e2e/package-assets.spec.ts` | installed consumer | request-response/browser + file-I/O | global install, CLI version/help, asset graph | role-match |
| `.github/workflows/publish-npm.yml` (proposed) | publisher workflow | event-driven/batch | `.github/workflows/deploy-supabase-production.yml` | role-match; no publishing analog |
| `scripts/verify-npm-release.mjs` (possible) | public registry consumer/verifier | request-response/batch | `verify-production-artifacts.mjs` + `tests/helpers/runtime-artifact.ts` | role-match |
| `tests/package/npm-release-verifier.test.ts` (possible) | verifier test | subprocess/request-response | `runtime-artifact-verifier.test.ts` | role-match |

## Pattern Assignments

### `package.json` (config/package metadata)

**Analog:** current root manifest; runtime reads version from `src/cli/run.ts:55-79`.

**Observed pattern:** package name is `@shipwithai/cumpa`, license is MIT, Node engine is `>=24`, bin is `dist/bin/cumpa.mjs`, and only `dist/`, `README.md`, `LICENSE`, `THIRD_PARTY_NOTICES.md` are packed. `src/cli/run.ts` validates package name and semver with prerelease support before Commander `.version(...)`.

**Bootstrap implication (implementation choice, not observed):** create a separate configured bootstrap version in a fresh approved build/packing cycle on `main`, using an isolated packing tree or an explicitly guarded metadata projection. Never create/switch a branch/worktree, edit the approved stable archive/evidence, or globally replace exact stable `1.5.0` gates. The existing reader supports prereleases; tag/channel and authorization policy must be explicit.

### `scripts/pack-runtime.mjs` (producer, batch/file-I/O)

**Analog:** itself, especially `parseArguments()` lines 71-87, `supportConfiguration()` lines 100-119, `trackedSource()` lines 133-141, `packageContract()` lines 187-208, and `main()` lines 350-430.

**Concrete patterns to copy:**

- CLI options are an exact allow-list (`--purpose`, `--custody-dir`, `--evidence`); destination paths must not already exist and are validated as absolute safe paths.
- `trackedSource()` records `git rev-parse HEAD`, `HEAD^{tree}`, clean status, and SHA-256 of cached/working binary diffs.
- `preflightSource()` hashes sorted package/build inputs and rejects links/special files. `main()` compares source snapshot and input hash before/after build, preventing build-time source drift.
- `npm pack` is invoked with `--ignore-scripts`, JSON output is required to contain exactly one archive, and `archiveIdentity()` captures byte length plus SHA-256/SHA-1/SHA-512 while checking inode/size stability.
- Errors are bounded and redact the configured support origin in the top-level catch.

**Pitfalls:** `packageContract()` hard-codes `manifest.version === '1.5.0'`; `purposes` only allows candidate/development-check/deployment-check; candidate/deployment purposes require clean source and configured support. Generalizing version handling must not weaken the stable verifier path or accidentally allow configured origin/private custody data into bootstrap evidence.

**Smallest plausible change:** parameterize an explicitly named, policy-approved release identity/version (or add a separate bootstrap producer mode) while retaining an exact stable mode. Reuse all source snapshot, pack, archive identity, and evidence fields; do not create a generic release framework.

### `scripts/verify-production-artifacts.mjs` (verifier, batch/file-I/O)

**Analog:** itself, `readEvidence()` lines 145-220; source/package identity check around lines 350-365; extraction cleanup around lines 377-477.

**Concrete patterns to copy:**

- `readEvidence()` validates exact evidence kind/status/purpose, bounded archive basename/count/sizes, sorted exact dependency versions, all source/legal/native hashes, and support/build agreement.
- `checkArchiveIdentity()` compares archive bytes against both producer evidence and caller-supplied expected SHA-256; SHA-1, SHA-512 integrity, and byte length are independently checked.
- Extraction runs under a mode-077 temporary directory, installs signal cleanup handlers, verifies required roots and package content, then removes the temporary tree in `finally` and restores umask.
- `verify()` checks package/lock/native source hashes against evidence before accepting extracted contents.

**Pitfalls:** exact `1.5.0` is enforced in evidence and extracted manifest (lines 160 and 287-290). `exactVersion` already accepts prereleases, but package identity does not. Keep the stable command's exact identity and add only a narrowly scoped bootstrap identity input/command if needed. Never make `expected-sha256` optional.

### `scripts/verify-supabase-support.mjs` (consumer/orchestrator, subprocess batch)

**Analog:** `verifyRuntimeArtifact()` lines 282-329.

**Concrete pattern:** create a private `mkdtemp(join(tmpdir(), 'cumpa-runtime-'))`, delete support-origin environment, invoke producer with `execFileSync`, parse bounded evidence, hash the archive, invoke non-producing verifier with `--expected-sha256`, assert result kind/status/purpose/archive/support state, and always remove the temporary root plus signal listeners in `finally`.

**Cross-caller coverage:** this consumer currently requests `development-check` but has assertions saying support is unconfigured and labels the output “unconfigured development-check.” Any producer identity/version generalization must preserve those assertions and update the final/retirement input bindings only if the new bootstrap flow is intentionally consumed there. Do not route a publish credential or public origin through this helper.

### `tests/helpers/runtime-artifact.ts` (installed artifact helper, batch/install)

**Analog:** `readRuntimeArtifact()` and `installRuntimeArtifact()`.

**Concrete pattern:** strict Zod schemas for producer evidence, archive identity, package identity, and install proof; safe archive path checks include basename, custody containment, realpath containment, regular non-symlink file, and re-hash with inode/size stability. Installation uses isolated temporary npm prefix/cache/environment and returns cleanup plus an immutable proof (`packageLabel`, `binLabel`, manifest hash, dependency inventory hash).

**Pitfalls:** `packageName`, `packageVersion`, `RuntimeInstallProof.packageLabel`, and proof output hard-code `@shipwithai/cumpa@1.5.0`; tests also expect the public registry URL. A bootstrap consumer needs a separate expected-version/tag input, not a global replacement, so existing stable installation checks remain exact.

### `tests/helpers/source-control-snapshot.ts` (snapshot guard, snapshot/compare)

**Analog:** `captureSourceControlSnapshot()` / `assertSourceControlUnchanged()`.

**Concrete pattern:** capture tracked entries/modes/bytes, staged and unstaged deltas, and permitted `.cumpa` ignore changes; compare entries byte-for-byte and modes exactly. Forbidden Git/network command lists protect tests from source mutation/publication.

**Bootstrap use:** wrap any local bootstrap preparation/publication script or test that temporarily changes package metadata. The smallest safe approach is a separate clean source checkout/copy or explicit snapshot-and-restore guard; never use a branch/worktree switch. Preserve source-change evidence as a new record rather than rewriting Phase 04 evidence.

### `.github/workflows/publish-npm.yml` (proposed publisher, event-driven/batch)

**Closest analog:** `.github/workflows/deploy-supabase-production.yml`.

**Observed workflow patterns to reuse:** `actions/checkout@v4`, `actions/setup-node@v4` with Node 24, explicit `permissions`, `concurrency`, repository gates before mutation, and separate deployment/publish job. Existing workflow verifies the workflow text itself in `verify-supabase-support.mjs` and rejects secrets in credential-free gates.

**Publisher-specific implementation choice:** the stable publisher is strictly non-producing: approved exact-source gate, separately authorized transport, independent archive/evidence hash checks, and `npm publish` of the supplied unchanged `.tgz` through OIDC. Never build or pack a replacement in the stable publisher. Any fresh bootstrap build is a separate explicitly approved cycle. Use `id-token: write` only on the publishing job; use no long-lived npm token and copy no Supabase deployment secrets or mutations. Keep original build-source metadata distinct from the later reviewed publishing-workflow commit; do not rewrite Phase 04 evidence to force equality.

**Pitfalls:** current workflow is push-to-main and has no npm publication precedent; names beyond this file are proposals. Any workflow contract verifier should assert job ordering, source/ref restrictions, credential-free gates, and trusted-publishing permission without printing repository-origin-bearing payloads.

**Observed source-publication side effect:** the existing deployment workflow runs on every push to `main` (`:3-5`) and subsequently invokes `--run-deployment` (`:62-71`). Adding a dispatch-only npm workflow does not prevent that separate deployment. A Phase 5 source-visibility push must use a documented one-off suppression route or obtain separate explicit deployment authority; do not silently change persistent deployment policy or infer hosted-support permission from artifact/source approval.

### `scripts/verify-npm-release.mjs` (possible new verifier, request-response/batch)

**Closest analogs:** `verify-production-artifacts.mjs` archive verifier and `tests/helpers/runtime-artifact.ts` registry/install helper.

**Smallest plausible responsibility:** resolve the fixed package/version/tag from the public registry, capture bounded metadata, download into a private temporary directory, compare all hashes/length with the original approved evidence, and perform isolated global/npx checks. Stable verification reads the sealed Phase 04 evidence unchanged; bootstrap uses its own separately approved record. Write only new publication observations to a bounded release receipt. Do not create a fresh stable evidence identity, build a general registry client, or introduce an approval framework.

**Security/cleanup patterns:** use temporary npm `HOME`, prefix, cache, and config; never inherit publication credentials; cleanup in `finally` and on SIGINT/SIGTERM. Reuse safe archive identity and bounded result schema concepts. Public registry metadata may be recorded, but no private origin/project/custody path may be emitted.

### `tests/package/npm-release-verifier.test.ts` (possible new test, subprocess/request-response)

**Closest analog:** `tests/package/runtime-artifact-verifier.test.ts`.

**Test only genuinely uncertain boundaries:** exact tag/version resolution, tarball hash/integrity/size binding, package name/bin contract, refusal of a mismatched version or archive, and cleanup/isolated npm environment. Keep stable `1.5.0` tests unchanged; parameterize fixture versions only if the implementation introduces a reusable explicit identity input.

## Shared Patterns

### Exact identity and immutable evidence
**Sources:** `pack-runtime.mjs:187-208, 350-430`; `verify-production-artifacts.mjs:145-220, 350-365`; `tests/helpers/runtime-artifact.ts:24-31, 174-195`.

Stable evidence binds package name/version, package and lock hashes, Git head/tree/diff, input hash, archive basename/size/SHA-256/SHA-1/SHA-512, legal hashes, and native identity. A later publisher may record/compare those fields against the original build inputs in a new publication record; it must not rewrite `04-ARTIFACT-EVIDENCE.json` or approval bytes.

### Bounded schemas and redaction
**Sources:** verifier `readEvidence()`; helper Zod schemas; support verifier `assertExactKeys()`/digest binding.

Reject unknown or malformed identity fields where existing contracts are strict, limit archive/file counts and sizes, and return hashes/statuses rather than absolute paths, tokens, origins, or command stderr. The npm consumer should follow this shape rather than exposing raw npm JSON.

### Temporary custody and cleanup
**Sources:** `verify-supabase-support.mjs:282-329`; `verify-production-artifacts.mjs:377-477`; `tests/helpers/runtime-artifact.ts` isolated installation.

Use private temporary directories, isolated npm HOME/prefix/cache/config, no inherited auth, signal handlers, and unconditional `finally` cleanup. Hash before and after operations where archive/source identity matters.

### Source-change snapshots and protected origin handling
**Sources:** `pack-runtime.mjs:133-141, 350-374`; `tests/helpers/source-control-snapshot.ts`; support verifier's `delete environment.CUMPA_RELEASE_SUPPORT_SERVICE_URL` and redacted catch behavior.

Build/publication must prove source inputs did not change. A complete configured bootstrap uses the existing GitHub production variable in memory/environment; do not strip its required configured capability or create a duplicate local configuration file. Strip the origin only from the already configured-absent development/retirement children. Never serialize the cleartext value. Separate bootstrap preparation must not consume/replace stable bytes or switch branches/worktrees. Compare later publisher metadata with recorded hashes/commit/tree in a new record, without rewriting Phase 04 evidence.

## Hard-coded stable assumptions requiring cross-caller review

| Location | Current assumption | Bootstrap impact |
|---|---|---|
| `package.json:3` | version `1.5.0` | Separate approved bootstrap version cycle; preserve stable manifest/evidence. |
| `scripts/pack-runtime.mjs:197-198` | package name + exact `1.5.0` | Add explicit narrow identity mode or retain stable producer and use a separately approved source cycle. |
| `scripts/verify-production-artifacts.mjs:160,288` | evidence/extracted package must be `1.5.0` | Bootstrap verifier needs explicit expected identity; stable verifier must remain exact. |
| `tests/helpers/runtime-artifact.ts:24-25,111,411` | helper expects stable package/version and proof label | Parameterize helper expectation or add a bootstrap-only consumer. |
| `tests/e2e/package-assets.spec.ts:92,103` | installed CLI/manifest exact `1.5.0` | Keep as stable publication gate; add separate bootstrap smoke only if required. |
| `tests/package/agent-ready-export.test.ts:26,30,195-203` | bounded scenario schema labels stable package/version | Do not rewrite stable scenario contract; use a distinct bootstrap scenario/version if consumed. |
| `tests/package/runtime-producer.test.ts` fixtures | fake archive `cumpa-1.5.0.tgz`, manifest `1.5.0` | Fixture identity must be explicit per mode; avoid broad replacement. |
| `scripts/verify-supabase-support.mjs:282-329` | consumer expects development-check, unconfigured support, verifier output | Maintain exact caller assertions and update only if deliberately adding bootstrap consumption. |
| `verify-supabase-support.mjs` retirement contract paths | publication scripts/verifier are policy-scanned | If adding publisher scripts, decide whether/how they are allowlisted without weakening retirement scans. |

## No Analog Found

| File | Role | Data flow | Reason |
|---|---|---|---|
| `.github/workflows/publish-npm.yml` | publisher workflow | event-driven/batch | Repository has no npm-producing workflow; use deploy workflow only for structural gates and permissions, not deployment behavior. |

## Metadata

**Analog search scope:** `package.json`, `src/cli/run.ts`, `scripts/pack-runtime.mjs`, `scripts/verify-production-artifacts.mjs`, `scripts/verify-supabase-support.mjs`, `.github/workflows/deploy-supabase-production.yml`, package/e2e helpers and tests.  
**Policy:** observed behavior is labeled above; publisher/bootstrap changes are explicitly marked implementation choices.  
**No builds, tests, formatters, linters, package creation/install, publication, or remote mutation were run.**
