---
phase: quick
plan: 260913-rel
type: execute
mode: quick
autonomous: true
branch: main
files_modified:
  - scripts/release-identity.mjs
  - scripts/pack-runtime.mjs
  - scripts/verify-production-artifacts.mjs
  - scripts/verify-npm-release.mjs
  - .github/workflows/publish-npm.yml
  - docs/distribution-operations.md
  - tests/package/runtime-producer.test.ts
  - tests/package/runtime-artifact-verifier.test.ts
  - tests/package/agent-ready-export.test.ts
  - tests/helpers/runtime-artifact.ts
  - tests/package/npm-release-verifier.test.ts
  - tests/package/runtime-package-contract.test.ts
  - README.md
  - package.json
  - package-lock.json
---

# Derive the release version from `package.json`, then bump to 1.5.1

## Why

`@shipwithai/cumpa@1.5.0` is published and immutable. The only surviving payload for a new
release is an app-side fix (bounded voluntary-support polling with a terminal `notConfirmed`
state in `src/web/App.vue` / `src/web/components/SupportDialog.vue`). Cutting `1.5.1` today
means hand-editing **107 lines / 114 occurrences** of `1.5.0` across **22 tracked files**, with a
keep-or-retarget judgement per site — and repeating that on every future patch. This plan makes
the release pipeline read the version from `package.json`, so the next release is a version bump.

## Safety argument this plan preserves (does not weaken)

`.github/workflows/publish-npm.yml`'s candidate job's **first executable step**
(`Require the separately authorized source before checkout`, lines 27–36) requires
`vars.CUMPA_RELEASE_SOURCE_SHA` to be a 40-hex SHA exactly equal to `GITHUB_SHA` — **before**
checkout, `npm install`, or any origin use. The source tree is SHA-pinned before anything reads
it, so `package.json` in that tree is exactly as trusted as a string literal in the same tree.
Deriving from it adds no new trust.

Independently, the publisher binds to the exact archive it built: `archive-sha256` /
`archive-byte-length` job outputs re-checked against the downloaded bytes (lines 158–180),
evidence sealed to the same `GITHUB_RUN_ID` + `GITHUB_RUN_ATTEMPT` (`verify-candidate`, line 188),
and `npm publish` on the unchanged absolute archive path with `--tag latest --access public
--ignore-scripts --fetch-retries=0` (lines 214–216).

**None of this changes.** No task in this plan touches the SHA-pin step, the digest or
byte-length checks, the same-run/attempt sealing, the publish flags, or any existing assertion's
strictness. Two tasks *strengthen* checks (T4 adds a basename-rejection row; T5 makes the
publisher re-derive and cross-check the basename against the builder's output).

---

## 1. Complete `1.5.0` inventory — every site classified

Enumerated over `git ls-files`, excluding `.planning/**`, `.kimi-code/**`, `node_modules`.
**22 files, 107 lines, 114 occurrences.** `.planning/**` and `.kimi-code/**` are not touched by
any task in this plan.

Legend: **DERIVE** = must become a function of `package.json` version.
**LITERAL** = must stay the frozen string `1.5.0` (or `1.5.0-bootstrap.0`).

### 1a. Single source of truth

| file:line | occ | class | note |
|---|---|---|---|
| `package.json:3` | 1 | **SOURCE** | `"version": "1.5.0"` — the one value everything derives from |
| `package-lock.json:3` | 1 | **SOURCE-MIRROR** | root lock `version`; npm keeps it in lockstep |
| `package-lock.json:9` | 1 | **SOURCE-MIRROR** | `packages[""].version`; same |

### 1b. DERIVE — Node scripts

| file:line | occ | class | what it is |
|---|---|---|---|
| `scripts/pack-runtime.mjs:27` | 1 | **DERIVE** | `stableVersion = '1.5.0'`; only consumer is the `manifest.version !== stableVersion` guard at `:205` (against the manifest it just read) plus the bootstrap projection at `:383,:398` |
| `scripts/pack-runtime.mjs:28` | 1 | **DERIVE** (deviation — §5) | `bootstrapVersion = '1.5.0-bootstrap.0'` |
| `scripts/verify-production-artifacts.mjs:25` | 1 | **DERIVE** | `profiles.stable.version`; consumed by `assertManifest` `:327` and the bootstrap projection guard `:341,:344` |
| `scripts/verify-production-artifacts.mjs:26` | 1 | **DERIVE** (deviation — §5) | `profiles.bootstrap.version` |
| `scripts/verify-npm-release.mjs:11` | 1 | **DERIVE** | `packageVersion`; feeds `packageLabel` `:12`, `validatePackage` `:157,:161`, `inspectNpmProvenance` `:401`, `exactDist` `:513`, `readInstalledTarget` `:528,:531`, consumer assertions `:576,:579,:584,:587` |
| `scripts/verify-npm-release.mjs:130` | 1 | **DERIVE** | `archiveIdentity` basename gate `!== 'shipwithai-cumpa-1.5.0.tgz'` |
| `scripts/verify-npm-release.mjs:148` | 1 | **DERIVE** | `validateArchive` basename gate |
| `scripts/verify-npm-release.mjs:412` | 1 | **DERIVE** | provenance subject `pkg:npm/%40shipwithai/cumpa@1.5.0` |
| `scripts/verify-npm-release.mjs:427` | 1 | **DERIVE** | same subject echoed into the `checks[]` receipt |
| `scripts/verify-npm-release.mjs:515` | 1 | **DERIVE** | `exactDist` registry tarball `https://registry.npmjs.org/@shipwithai/cumpa/-/cumpa-1.5.0.tgz` |
| `scripts/verify-npm-release.mjs:531` | 1 | **DERIVE** | `readInstalledTarget` lock `resolved` target (same URL) |
| `scripts/verify-npm-release.mjs:553` | 1 | **DERIVE** | packument `https://registry.npmjs.org/@shipwithai%2fcumpa/1.5.0` |

### 1c. DERIVE — workflow

| file:line | occ | class | what it is |
|---|---|---|---|
| `.github/workflows/publish-npm.yml:10` | 1 | **DERIVE-IMPOSSIBLE → replace** | `concurrency.group: cumpa-npm-stable-1.5.0` — evaluated before any step; cannot read a file. See §3 |
| `:76` | 1 | **DERIVE** | scanner `--archive "$payload/shipwithai-cumpa-1.5.0.tgz"` |
| `:84` | 1 | **DERIVE** | `export CUMPA_RUNTIME_ARCHIVE_BASENAME=shipwithai-cumpa-1.5.0.tgz` |
| `:93` | 1 | **DERIVE** | `seal-candidate --archive "$payload/shipwithai-cumpa-1.5.0.tgz"` |
| `:102` | 1 | **DERIVE** | sealing step expected payload `names` array |
| `:116` | 1 | **DERIVE** | `identities.get('shipwithai-cumpa-1.5.0.tgz')` |
| `:168` | 1 | **DERIVE** | publisher expected downloaded payload `names` array |
| `:176` | 1 | **DERIVE** | `readFileSync(join(directory, 'shipwithai-cumpa-1.5.0.tgz'))` |
| `:188` | 1 | **DERIVE** | `verify-candidate --archive "$payload/shipwithai-cumpa-1.5.0.tgz"` |
| `:195` | 1 | **DERIVE** | publish step archive path |

### 1d. DERIVE — docs

| file:line | occ | class | what it is |
|---|---|---|---|
| `docs/distribution-operations.md:3` | 1 | **DERIVE** | "maintainer evidence policy for `@shipwithai/cumpa@1.5.0`" — a standing policy, not a receipt |
| `docs/distribution-operations.md:67` | 1 | **DERIVE** | names the concurrency group `cumpa-npm-stable-1.5.0`; must track §3 |
| `docs/distribution-operations.md:91` | 1 | **DERIVE** | instruction to run "literal `npx --yes @shipwithai/cumpa@1.5.0 --version`" — a forward instruction for the release being verified |
| `docs/distribution-operations.md:55` | 3 | **LITERAL** | the historical bootstrap step: "`@shipwithai/cumpa@1.5.0-bootstrap.0` under tag `bootstrap` … Source package/lock stay at 1.5.0". A record of what was done in Phase 5, already complete. Rewriting it would falsify history |

### 1e. DERIVE — tests on the release/publish path

| file:line | occ | class | what it is |
|---|---|---|---|
| `tests/helpers/runtime-artifact.ts:26` | 1 | **DERIVE — HIGHEST CONSEQUENCE** | `runtimeProfiles.stable.version`, used as a Zod `z.literal` (`:40`) and `z.enum` (`:59`). **`vitest.runtime-artifact.config.ts` includes `tests/package/agent-ready-export.test.ts`, and the publish workflow runs it at line 88 (`npm run accept:runtime-artifact`).** Left literal, the 1.5.1 publish run *builds a candidate and then fails acceptance* |
| `tests/helpers/runtime-artifact.ts:27` | 1 | **DERIVE** (deviation — §5) | `runtimeProfiles.bootstrap.version` |
| `tests/package/agent-ready-export.test.ts:29` | 1 | **DERIVE** | `profileIdentity()` stable `version: '1.5.0' as const`; on the publish path (see above) |
| `tests/package/agent-ready-export.test.ts:28` | 1 | **DERIVE** (deviation — §5) | `profileIdentity()` bootstrap version |
| `tests/package/agent-ready-export.test.ts:232` | 2 | **DERIVE** (stable) + **DERIVE** (bootstrap, §5) | `profile === 'bootstrap' ? '1.5.0-bootstrap.0' : '1.5.0'` |
| `tests/package/runtime-producer.test.ts:45` | 1 | **DERIVE** | `createFixture()` writes a synthetic `package.json` at `1.5.0`; `pack-runtime.mjs` is copied into that fixture and resolves its manifest relative to `import.meta.url`, so the fixture version must equal what the real script expects. Derive it so the fixture tracks the repo |
| `tests/package/runtime-producer.test.ts:345` | 1 | **DERIVE** | `expect(evidence.package.version).toBe('1.5.0')` |
| `tests/package/runtime-producer.test.ts:347` | 1 | **DERIVE** | `basename: 'cumpa-1.5.0.tgz'` — the fake `npm pack` names it `'cumpa-' + manifest.version + '.tgz'` (`:135`), already version-derived; only the expectation is frozen |
| `tests/package/runtime-producer.test.ts:462` | 1 | **DERIVE** | `lstat(join(fixture.custody, 'cumpa-1.5.0.tgz'))` |
| `tests/package/runtime-producer.test.ts:402` | 1 | **DERIVE** | `manifestProjection.sourceVersion: '1.5.0'` |
| `tests/package/runtime-producer.test.ts:383,399,403,414` | 4 | **DERIVE** (deviation — §5) | bootstrap projection expectations (`1.5.0-bootstrap.0`, `cumpa-1.5.0-bootstrap.0.tgz`) |
| `tests/package/runtime-artifact-verifier.test.ts:245` | 1 | **DERIVE** | `readRuntimeArtifact(stableEnvironment).package.version` — produced from the real repo tree |
| `tests/package/runtime-artifact-verifier.test.ts:216` | 1 | **DERIVE** | negative fixture sets `package.version = '1.5.0'` on bootstrap evidence to prove cross-profile rejection; must be the *real stable* version or it stops isolating the intended corruption |
| `tests/package/runtime-artifact-verifier.test.ts:221` | 1 | **DERIVE** | `manifestProjection.sourceVersion` in a `field: 'name'` corruption fixture; same reasoning |
| `tests/package/runtime-artifact-verifier.test.ts:199,222,255` | 3 | **DERIVE** (deviation — §5) | bootstrap version expectations |
| `tests/package/npm-release-verifier.test.ts:60` | 1 | **DERIVE** | fixture `basename: 'shipwithai-cumpa-1.5.0.tgz'` — must match the script's derived gate |
| `tests/package/npm-release-verifier.test.ts:71` | 1 | **DERIVE** | fixture `packageIdentity.version` |
| `tests/package/npm-release-verifier.test.ts:95` | 1 | **DERIVE** | acceptance `install.packageLabel` |
| `tests/package/npm-release-verifier.test.ts:107` | 1 | **DERIVE** | provenance statement subject |
| `tests/package/npm-release-verifier.test.ts:129` | 1 | **DERIVE** | `npm audit signatures` fixture `version` |
| `tests/package/npm-release-verifier.test.ts:130` | 1 | **DERIVE** | attestations URL `…/attestations/@shipwithai%2fcumpa@1.5.0` |
| `tests/package/npm-release-verifier.test.ts:159,163` | 2 | **DERIVE** | fake npm/npx argv gates on `@shipwithai/cumpa@1.5.0` |
| `tests/package/npm-release-verifier.test.ts:160` | 1 | **DERIVE** + **COLLISION** | `mode === 'wrong-npx' ? '1.5.1' : '1.5.0'` — see §6 trap 1 |
| `tests/package/npm-release-verifier.test.ts:170,174` | 2 | **DERIVE** | installed fixture manifest + fake global `cumpa --version` output |
| `tests/package/npm-release-verifier.test.ts:177` | 1 | **DERIVE** | fixture lock `version` + `resolved` tarball URL |
| `tests/package/npm-release-verifier.test.ts:198,199` | 2 | **DERIVE** | stubbed packument `version` + `dist.tarball` |
| `tests/package/runtime-package-contract.test.ts:106` | 1 | **DERIVE** | `stdout: '1.5.0\n'` from the packaged CLI. `src/cli/run.ts:757` already calls `readPackageVersionFromManifest()`, so **the app derives its version today**; only this expectation is frozen |
| `tests/package/runtime-package-contract.test.ts:122` | 1 | **DERIVE** | `expect(manifest).toMatchObject({ … version: '1.5.0' })` against the real root manifest |
| `README.md:5` | 1 | **DERIVE-IMPOSSIBLE → de-version** | "The prepared package identity is **`@shipwithai/cumpa@1.5.0`**" |
| `README.md:23` | 1 | **DERIVE-IMPOSSIBLE → de-version** | `npm install --global @shipwithai/cumpa@1.5.0` |
| `README.md:29` | 1 | **DERIVE-IMPOSSIBLE → de-version** | `npx --yes @shipwithai/cumpa@1.5.0` |

`README.md` is **not in the batch-context classification** and is an addition (see §5). It is
shipped inside the tarball (`package.json` `files` allowlist). Static Markdown cannot derive, and
no test asserts its text — `verify-production-artifacts.mjs:518` and
`agent-ready-export.test.ts:59` only hash it. Publishing 1.5.1 with a README that instructs
`install @shipwithai/cumpa@1.5.0` ships a false statement to every user. The fix that is correct
*and* removes the site permanently is to drop the version from the commands (`npm install
--global @shipwithai/cumpa` resolves `latest`, which is what a reader wants) and from the
identity sentence.

### 1f. LITERAL — immutable history and accepted artifacts

Every entry below stays exactly `1.5.0`. **Do not touch these files.**

| file:line | occ | class | justification |
|---|---|---|---|
| `tests/helpers/public-artifact-identity.ts:6,8,9` | 3 | **LITERAL** | `PINNED_PUBLIC_ARTIFACT` binds one immutable published artifact: `packageLabel`, `version`, `tarballUrl` **together with** `byteLength: 3514800`, `sha256 dc8f7929…`, `npmShasumSha1 2d58866c…`, `npmIntegritySha512 sha512-gUBrMYwL8u…`. Deriving the version while the digests stay frozen produces an internally false pin: a `1.5.1` label carrying `1.5.0` bytes. `assertPinnedRegistryDist` / `assertPinnedInstalledResolution` would then assert a triple that can never exist. **Deriving here strictly reduces safety** |
| `tests/unit/public-artifact-identity.test.ts:29,31,32,45,57,60` | 6 | **LITERAL** | asserts that pin, including negative rows (`registry.example.test` tarball, mutated shasum, mutated integrity). Its whole value is that the pin cannot drift |
| `scripts/write-acceptance-evidence.mjs:10` | 1 | **LITERAL** | `allowedHttpsUrls` is a **closed allowlist** — a security control bounding which URLs may appear in an acceptance record. Deriving widens it to whatever the manifest says, which is the opposite of an allowlist. **Deriving here strictly reduces safety** |
| `scripts/write-acceptance-evidence.mjs:139,142,363` | 3 | **LITERAL** | the Phase 7 acceptance record's bindings (`packageLabel`, `resolvedVersion`, `tarballUrl`) for the artifact that *was* accepted. A Phase 7 record for 1.5.0 must keep saying 1.5.0 forever |
| `tests/unit/acceptance-evidence.test.ts:14,142,143,144,156` | 8 | **LITERAL** | drives the above; same frozen record |
| `tests/package/public-artifact-acceptance.test.ts:22,25,210` | 3 | **LITERAL** | ACC-01/ACC-02 drivers. `publicProofSchema` uses `z.literal('@shipwithai/cumpa@1.5.0')` / `z.literal('1.5.0')` to accept the **published public** artifact. Not a pipeline check — an acceptance record of a completed phase |
| `tests/package/marketplace-profile-acceptance.test.ts:235` | 1 | **LITERAL** | ACC-03 marketplace acceptance of the same published artifact (alongside the pinned `SKILL.md` digest `8974c947…`) |
| `scripts/pack-runtime.mjs` bootstrap *history* — see §5 | — | — | the `1.5.0-bootstrap.0` **doc record** stays literal; the **producer constant** derives |
| `docs/distribution-operations.md:55` | 3 | **LITERAL** | historical bootstrap release, per 1d |
| `tests/cli/check-cumpa.test.ts:20` | 1 | **LITERAL** | mirrors the recovery string emitted by `.kimi-code/skills/cumpa/scripts/check-cumpa.mjs:27`, which is **operator-owned and untouchable**. The marketplace skill is independently versioned and accepts any `>= 1.5.x` CLI (`check-cumpa.mjs:16-17`); this string is minimum-version guidance, not a release binding |
| `tests/cli/check-cumpa.test.ts:87,89,101,104,106,107,108,109,110,111,112,122,128,139` | 14 | **LITERAL** | **semver-parser test vectors**, not release references: `'1.5.0+build.001'`, `'1.5.0-rc.1'`, `'01.5.0'`, `'1.5.00'`, `'v1.5.0'`, `'Cumpa 1.5.0'`, `'1.5.0\n1.6.0'`, `'1.5.0+'`. Their value is the *shape* they exercise. Mass-rewriting them would destroy the coverage |
| `tests/unit/publish-scenario-record.test.ts:25` | 1 | **LITERAL** | `localArchiveRecord()` `package: { version: '1.5.0' }` is an **opaque pass-through payload**; the assertions only check `status`/`scenario`/`observation`. No release semantics. Incidental — leave it |
| `tests/package/npm-release-verifier.test.ts:364` | 1 | **LITERAL** | `['verify-candidate', ['--package', '@other/package@1.5.0']]` — a deliberately **invalid CLI option** in the malformed-input rejection row at `:354`. `parseArguments` rejects it on the unknown `--package` flag, never on the version. Incidental; deriving it would imply the version matters here, and it does not. Leave it (this is the 15th site in the file; the other 14 are DERIVE, §1e) |

**Corrections to the batch-context classification, with evidence:**

1. `tests/helpers/runtime-artifact.ts` and `tests/package/agent-ready-export.test.ts` were listed
   only as "test files asserting pipeline basenames/URLs" (2 and 3 sites). They are in fact
   **on the publish path**: `publish-npm.yml:88` runs `npm run accept:runtime-artifact` →
   `vitest.runtime-artifact.config.ts` → `tests/package/agent-ready-export.test.ts` →
   `tests/helpers/runtime-artifact.ts` `runtimeProfiles`. Highest-consequence DERIVE sites.
2. `tests/package/runtime-package-contract.test.ts` was counted at 2 sites — correct (`:106`, `:122`).
3. `tests/package/runtime-producer.test.ts` was counted at 9 — correct, but note `:45` is the
   *fixture manifest* (a cause, not an assertion) and 5 of the 9 are bootstrap sites.
4. `README.md` (3 sites) was not classified. Added above.
5. `package-lock.json` (2 sites) was not mentioned. It materially changes §4's expected bump diff.
6. `tests/cli/check-cumpa.test.ts` (15 sites) and `tests/unit/publish-scenario-record.test.ts`
   (1 site) were not classified. Both LITERAL/incidental — explicitly out of scope so no agent
   "helpfully" rewrites the semver vectors.
7. `pack-runtime.mjs` `bootstrapVersion` — deviation, see §5.

---

## 2. Derivation mechanism for the stdlib-only ESM scripts

**New file: `scripts/release-identity.mjs`.** Node ESM, **zero imports outside `node:`**, no
top-level `await`, no new dependency. Must be importable by the publish job, which runs
**without `npm ci`** — no `node_modules` exists there.

```
import { readFileSync } from 'node:fs';   // the only import
```

Reads the manifest as `new URL('../package.json', import.meta.url)` — resolved relative to the
**module**, never `process.cwd()`. Rationale: cwd-relative resolution would let the invoker's
working directory decide which version the verifier binds to. That is a real safety regression
and is rejected.

Module-level, evaluated once at import:

- `name` — asserted `=== '@shipwithai/cumpa'`; `fail()` otherwise.
- `version` — `manifest.version`, asserted against
  `/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u`
  (the exact-version pattern already used at `verify-production-artifacts.mjs:41` and
  `pack-runtime.mjs:187`); `fail()` otherwise. This single assertion is also the
  `GITHUB_ENV`-injection guard (§3): the pattern admits no newline and no `=`.
- Derived exports, each a plain template of the two validated values:

  | export | value | current literal | consumers |
  |---|---|---|---|
  | `packageLabel` | `` `${name}@${version}` `` | `@shipwithai/cumpa@1.5.0` | `verify-npm-release.mjs:12` |
  | `archiveBasename` | `` `shipwithai-cumpa-${version}.tgz` `` | `shipwithai-cumpa-1.5.0.tgz` | `verify-npm-release.mjs:130,148`; workflow `:76,84,93,102,116,168,176,188,195` |
  | `registryTarballUrl` | `` `https://registry.npmjs.org/@shipwithai/cumpa/-/cumpa-${version}.tgz` `` | same at `1.5.0` | `verify-npm-release.mjs:515,531` |
  | `packumentUrl` | `` `https://registry.npmjs.org/@shipwithai%2fcumpa/${version}` `` | same at `1.5.0` | `verify-npm-release.mjs:553` |
  | `provenanceSubject` | `` `pkg:npm/%40shipwithai/cumpa@${version}` `` | same at `1.5.0` | `verify-npm-release.mjs:412,427` |
  | `bootstrapVersion` | `` `${version}-bootstrap.0` `` | `1.5.0-bootstrap.0` | `pack-runtime.mjs:28`; `verify-production-artifacts.mjs:26` |

  **Note the two distinct tarball spellings** — this is not a typo and must not be "unified":
  `npm pack` on a scoped package emits `shipwithai-cumpa-<v>.tgz` (scope flattened, `@` dropped),
  while the registry serves it at path `…/@shipwithai/cumpa/-/cumpa-<v>.tgz` (unscoped
  basename). Both appear verbatim in the current code and both must be reproduced exactly.

- **CLI mode**, guarded by `if (import.meta.main)` (the idiom already used at
  `verify-npm-release.mjs:622`), for the workflow, which cannot `import` from a heredoc without
  base-URL ambiguity:
  - `--github-env` → prints `CUMPA_RELEASE_VERSION=<v>` and
    `CUMPA_RELEASE_ARCHIVE_BASENAME=<b>`, one per line.
  - `--github-output` → prints `version=<v>` and `archive-basename=<b>`.
  - `<fieldName>` (one of the exports above) → prints that value with no trailing newline.
  - anything else → `fail()`, non-zero exit.

At `1.5.0` every derived string is **byte-identical to the literal it replaces**. That is what
makes T1–T6 verifiable before the version moves (§4).

**Hard constraint discovered — `verify-npm-release.mjs` self-containment.**
`tests/package/npm-release-verifier.test.ts:424` ("seals a fixture through the standalone
symlinked CLI without project dependencies") copies **only** `scripts/verify-npm-release.mjs`
into a flat temp dir and executes it through a symlink. Any `import './release-identity.mjs'`,
*and equally any inline `new URL('../package.json', import.meta.url)`*, fails there:
`ERR_MODULE_NOT_FOUND` / `ENOENT`. So the test must be updated regardless of which derivation
shape is chosen. T4 fixes it by reproducing the real layout in the fixture — write both files
into `<root>/scripts/`, write `<root>/package.json` as `{ name, version }` from the accessor, and
symlink `<root>/entry.mjs` → `<root>/scripts/standalone.mjs`. Node resolves `import.meta.url` for
a symlinked entry to the real path (no `--preserve-symlinks`), so `../package.json` lands on the
fixture manifest and the symlink-through-launcher behaviour under test is preserved. The test's
actual claim — *no `node_modules` required* — is unchanged: two first-party source files from the
SHA-pinned checkout are exactly as standalone as one.

**TS side: no second accessor.** `tsconfig.test.json` sets `allowJs: true`, and typechecked tests
already import `.mjs` scripts directly (`tests/unit/acceptance-evidence.test.ts:12`,
`tests/package/npm-release-verifier.test.ts:10`). Tests import
`../../scripts/release-identity.mjs`. One accessor, one source of truth.
Expected type fallout, both covered by the `npm run typecheck:tests` gate:
- `as const` annotations on version literals become `string`. Drop the `as const`.
- If `z.enum([stable, bootstrap])` rejects non-literal input under `tsc`, replace with
  `z.union([z.literal(stable), z.literal(bootstrap)])` — identical runtime behaviour.

---

## 3. The workflow problem, solved explicitly

### 3a. `concurrency.group` — cannot read a file

`concurrency` is evaluated before any step runs. Only `github.*`, `vars.*`, `inputs.*`,
`secrets.*` etc. are in scope. `package.json` is unreachable. Three options were considered:

| option | verdict |
|---|---|
| `cumpa-npm-stable-${{ github.sha }}` | **rejected.** Available in context and version-faithful (version is a function of the SHA), but strictly **weaker**: two dispatches on different SHAs run concurrently, both racing the `latest` dist-tag |
| `cumpa-npm-stable-${{ vars.CUMPA_RELEASE_SOURCE_SHA }}` | **rejected.** Same weakness, plus the serialization boundary becomes a mutable repo variable |
| `cumpa-npm-stable` (version-independent), `cancel-in-progress: false` | **chosen** |

**Chosen: `group: cumpa-npm-stable`, `cancel-in-progress: false`.**

Tradeoff, stated precisely. Today's group prevents concurrent stable publishes **of the same
version**. The replacement prevents concurrent stable publishes **of any version** — a strict
superset. It therefore cannot allow two simultaneous publish runs, which is the property that
matters: the single `npm publish … --tag latest` (line 214) mutates the `latest` dist-tag, and two
runs racing it is the failure being prevented. The cost is that a 1.5.1 dispatch queues behind an
in-flight 1.5.2 dispatch instead of running beside it. For a workflow that is `workflow_dispatch`
only, publishes exactly one immutable version per run, and takes ~60 minutes, serialization is
the correct default, not a regression. `cancel-in-progress: false` is unchanged, so a queued run
never cancels the in-flight publisher mid-`npm publish`.

### 3b. The nine in-step basename references

One new step per job computes the basename into `$GITHUB_ENV`; every reference reads it.

**Candidate job.** Insert **after** the existing `Require the pinned source and supported Darwin
ARM64 tools` step (line 45, which re-asserts `git rev-parse HEAD` = `$GITHUB_SHA`) and **before**
`npm ci` (line 56) — i.e. between current lines 55 and 56. It therefore lands:

- **after** the SHA-pin precondition at line 27, which **remains the first executable step**;
- after checkout, so the manifest exists;
- after the in-tree SHA re-check, so the manifest read is provably from the pinned tree;
- before `npm ci` (proving no dependency on `node_modules`) and before the first use at line 76.

```yaml
- name: Derive the release archive identity from the pinned source
  id: release
  run: |
    node scripts/release-identity.mjs --github-env >> "$GITHUB_ENV"
    node scripts/release-identity.mjs --github-output >> "$GITHUB_OUTPUT"
```

Add `archive-basename: ${{ steps.release.outputs.archive-basename }}` to the job's `outputs:`
block (lines 20–25). Injection into `$GITHUB_ENV` is impossible: the accessor fails before
printing unless the version matches the exact-semver pattern, which admits no newline.

Then, mechanically:

| line | from | to |
|---|---|---|
| `:76` | `"$payload/shipwithai-cumpa-1.5.0.tgz"` | `"$payload/$CUMPA_RELEASE_ARCHIVE_BASENAME"` |
| `:84` | `=shipwithai-cumpa-1.5.0.tgz` | `="$CUMPA_RELEASE_ARCHIVE_BASENAME"` |
| `:93` | `"$payload/shipwithai-cumpa-1.5.0.tgz"` | `"$payload/$CUMPA_RELEASE_ARCHIVE_BASENAME"` |
| `:102` | `const names = ['evidence.json', 'shipwithai-cumpa-1.5.0.tgz'];` | read `process.env.CUMPA_RELEASE_ARCHIVE_BASENAME`, guard it against `/^[A-Za-z0-9][A-Za-z0-9._-]*\.tgz$/u`, then `const names = ['evidence.json', archiveName].sort();` |
| `:116` | `identities.get('shipwithai-cumpa-1.5.0.tgz')` | `identities.get(archiveName)` |

Lines 102 and 168 sit inside `<<'NODE'` quoted heredocs, so the shell does not expand `$VAR` —
`process.env` is the correct and only channel. Explicitly `.sort()` the expected `names` array
(it is currently hand-sorted and happens to stay sorted for any `shipwithai-…` name; sorting makes
the comparison against `readdirSync(payload).sort()` prefix-agnostic rather than luck).

**Publish job.** The publisher does **not** run `npm ci`, so it must not need `node_modules` — the
accessor does not. Extend the existing `Require the pinned publishing tools and source` step
(line 144, already after checkout and already re-asserting `git rev-parse HEAD` = `$GITHUB_SHA`)
to both re-derive and cross-check:

```yaml
env:
  EXPECTED_ARCHIVE_BASENAME: ${{ needs.build-candidate.outputs.archive-basename }}
# appended to the existing run: block
derived="$(node scripts/release-identity.mjs archiveBasename)"
test "$derived" = "$EXPECTED_ARCHIVE_BASENAME"
printf 'CUMPA_RELEASE_ARCHIVE_BASENAME=%s\n' "$derived" >> "$GITHUB_ENV"
```

This is a **strengthening**, matching the existing independent-recheck pattern for
`archive-sha256` / `archive-byte-length`: the publisher accepts the builder's name only if its own
pinned checkout derives the same string. It runs before `download-artifact` (line 153) and before
the first use at line 168.

| line | from | to |
|---|---|---|
| `:168` | `const names = ['evidence.json', 'shipwithai-cumpa-1.5.0.tgz'];` | env-read + shape guard + `.sort()`, as `:102` |
| `:176` | `readFileSync(join(directory, 'shipwithai-cumpa-1.5.0.tgz'))` | `readFileSync(join(directory, archiveName))` |
| `:188` | `"$payload/shipwithai-cumpa-1.5.0.tgz"` | `"$payload/$CUMPA_RELEASE_ARCHIVE_BASENAME"` |
| `:195` | `join(…, 'shipwithai-cumpa-1.5.0.tgz')` | `join(…, archiveName)` with the same guard |

Unchanged: the SHA-pin step and its position; the digest and byte-length comparisons (158–180);
`verify-candidate`'s evidence/run/attempt binding (188); the publish flags and the absolute
archive path (214–216); the isolated npm HOME/cache/config construction (196–213).

---

## 4. Verify at 1.5.0 first, bump second

T1–T6 change no observable value: at `version === '1.5.0'` every derived string is
byte-identical to the literal it replaces. So the full gate list (T7 acceptance) passes
**before** the version moves, which is the proof that the refactor is behaviour-preserving. Only
then does T7 move the version.

**Expected T7 diff — a correction to the stated expectation.** Not `package.json` only.

```
package.json       "version": "1.5.0" → "1.5.1"          (1 line)
package-lock.json  "version": "1.5.0" → "1.5.1"          (lines 3 and 9)
```

`package-lock.json` embeds the root version at `:3` and `packages[""].version` at `:9`. npm keeps
these in lockstep and `pack-runtime.mjs:217` hashes the lock into `source.packageLockSha256`, so
they must move together. Regenerate with `npm install --package-lock-only --ignore-scripts` (no
dependency graph change: `--package-lock-only` will not alter any resolved dependency) and confirm
the diff is exactly those three lines. If T7's diff touches anything else, the derivation is
incomplete — fix the derivation, do not hand-edit the extra site.

---

## 5. Deviations from the batch-context classification, with justification

### 5a. `bootstrapVersion` — DERIVE, not LITERAL

Batch context assigns `pack-runtime.mjs:28` `bootstrapVersion = '1.5.0-bootstrap.0'` (and by
extension `verify-production-artifacts.mjs:26`) to LITERAL as "the historical bootstrap release".
The evidence disagrees for the **code constant**, and this plan derives it as
`` `${version}-bootstrap.0` ``. Reasoning:

1. **Nothing in the repo verifies the published bootstrap artifact.** `verify-npm-release.mjs
   verify-public` checks only the stable `packageVersion`. `write-acceptance-evidence.mjs` and
   `tests/helpers/public-artifact-identity.ts` pin only the stable tarball. So this constant is
   not a binding to immutable history — it is a **producer input** that decides what a *future*
   bootstrap pack would be labelled.
2. **Keeping it literal creates a new hazard the current code does not have.** At 1.5.1,
   `--purpose bootstrap` would pack 1.5.1 sources and stamp them `1.5.0-bootstrap.0` — a
   provably false identity that, by semver, sorts *before* the already-published 1.5.0, and
   collides with an existing npm version. `pack-runtime.mjs:383`'s
   `sameValue(manifest, {…, version: stableVersion})` round-trip would still pass, because it
   only proves *one field* changed — it cannot notice that the field is wrong.
3. **Deriving is byte-identical today** (`'1.5.0' + '-bootstrap.0'`) so the existing 520 tests
   prove it at 1.5.0, and truthful tomorrow (`1.5.1-bootstrap.0` is genuinely a bootstrap
   prerelease of 1.5.1).
4. The **historical record** of the bootstrap release stays literal where history actually
   lives: `docs/distribution-operations.md:55` (§1d) and the untouched `.planning/**`.

Alternative if the operator prefers strict literal: keep the constant and add
`if (!bootstrapVersion.startsWith(`${stableVersion}-`)) fail(…)` so the false-identity path is
impossible. **Not chosen** — that guard makes `--purpose bootstrap` throw at 1.5.1, which breaks
`runtime-producer.test.ts` and `runtime-artifact-verifier.test.ts` bootstrap cases and so drags
test deletions into T7's diff. Deriving achieves the same safety with no test churn.

### 5b. `README.md` — added to DERIVE (as de-versioning)

Not in the batch-context list; see §1e for the evidence and the reason static Markdown is
de-versioned rather than derived.

### 5c. `tests/helpers/runtime-artifact.ts` + `agent-ready-export.test.ts` — reclassified as
publish-path-critical

See §1e and correction 1. Same DERIVE verdict, materially higher consequence.

---

## 6. Post-bump collision traps

Three sites hold values that are *deliberately wrong today* and become **correct** at 1.5.1,
silently destroying rejection coverage. Found by scanning for `1.5.1|1.5.2|1.6.0|1.12.3|2.0.0`.

| trap | file:line | today | problem at 1.5.1 | fix (in T4) |
|---|---|---|---|---|
| 1 | `tests/package/npm-release-verifier.test.ts:160` | `mode === 'wrong-npx' ? '1.5.1' : '1.5.0'` | the `wrong-npx` fixture reports the **correct** version; `verify-public` stops failing and the `wrong-npx` row asserts nothing | introduce `const mismatchedVersion = '9999.0.0';` and assert `expect(mismatchedVersion).not.toBe(releaseVersion)` inside the test so it can never silently collide again |
| 2 | `tests/package/npm-release-verifier.test.ts:311` | `['acceptance package', … .version = '1.5.1']` | the "crossed observation" is no longer crossed; `seal()` stops rejecting and the row asserts nothing | use `mismatchedVersion` |
| 3 | `tests/package/runtime-package-contract.test.ts:140,143,144` | `'1.5.1-beta.1'`, `'1.5.1'` | **safe** — these are written into a `mkdtemp` manifest to prove `readPackageVersionFromManifest` reads *that* file, and `:144`'s rejection is driven by `name: 'cumpa'`, not the version | no change; documented so no agent "fixes" it |

`tests/cli/check-cumpa.test.ts:88,100,109` (`1.12.3`, `2.0.0`, `1.6.0`) are semver-parser vectors
that cannot equal `1.5.1`. No change.

---

## 7. Preserving rejection coverage against derived values

Rule for every test task: **replace the frozen string with the derived value; never relax the
comparison.** Concretely:

- A positive expectation `toBe('1.5.0')` becomes `toBe(version)` — still an exact equality, not a
  regex or a `toContain`.
- A Zod `z.literal('1.5.0')` becomes `z.literal(version)` — still a literal schema, not
  `z.string()`. Downgrading a `z.literal` to `z.string()` in
  `tests/helpers/runtime-artifact.ts`, `agent-ready-export.test.ts`, or
  `public-artifact-acceptance.test.ts` is **prohibited**: that would delete the check rather than
  derive it.
- A negative expectation keeps proving rejection, expressed against a value derived to be wrong —
  e.g. `` `shipwithai-cumpa-${mismatchedVersion}.tgz` `` rather than a frozen `1.5.1` string.
- **T4 adds one new row** to the `substitutions` list at
  `tests/package/npm-release-verifier.test.ts:309`:
  `['producer archive basename', ({ producer }) => { (producer.archive as Record<string, unknown>).basename = `shipwithai-cumpa-${mismatchedVersion}.tgz`; }]`.
  It earns its place because it is exactly the regression this refactor can introduce — a
  mis-derived basename, or a dropped basename gate at `verify-npm-release.mjs:130`/`:148`. No
  existing row covers a basename mismatch. It fails if either gate is removed.

---

## Tasks

File-disjoint. Wave 2 tasks may run concurrently. Each script is paired with the tests that
exercise it, so each task is independently green and independently committable.

### Wave 1

#### T1 — Add the shared release-identity accessor

**Files:** `scripts/release-identity.mjs` (new)

**Action:** Build the module exactly as specified in §2: single `node:fs` import; manifest via
`new URL('../package.json', import.meta.url)`; `name` and `version` assertions (version against
the exact-version pattern, which is also the `GITHUB_ENV` injection guard); the six derived
exports with the two distinct tarball spellings preserved verbatim; `import.meta.main` CLI with
`--github-env`, `--github-output`, `<fieldName>`, and `fail()` on anything else. No import
outside `node:`. No top-level `await`. No `process.cwd()`.

**Verify:**
```
node -e "import('./scripts/release-identity.mjs').then(m=>{const a={version:'1.5.0',packageLabel:'@shipwithai/cumpa@1.5.0',archiveBasename:'shipwithai-cumpa-1.5.0.tgz',registryTarballUrl:'https://registry.npmjs.org/@shipwithai/cumpa/-/cumpa-1.5.0.tgz',packumentUrl:'https://registry.npmjs.org/@shipwithai%2fcumpa/1.5.0',provenanceSubject:'pkg:npm/%40shipwithai/cumpa@1.5.0',bootstrapVersion:'1.5.0-bootstrap.0'};for(const[k,v]of Object.entries(a))if(m[k]!==v)throw new Error(k+': '+m[k]);console.log('identical')})"
node scripts/release-identity.mjs --github-env
node scripts/release-identity.mjs archiveBasename
```

**Done:** the first command prints `identical` (every derived string is byte-identical to the
literal it will replace at 1.5.0); `--github-env` prints exactly
`CUMPA_RELEASE_VERSION=1.5.0` and `CUMPA_RELEASE_ARCHIVE_BASENAME=shipwithai-cumpa-1.5.0.tgz`;
an unknown field name exits non-zero. Delete the throwaway `node -e` check after it passes — it
is a one-off proof, not a test to keep.

**Commit:** `feat(quick-260913-rel): derive release identity from the package manifest`

### Wave 2 — concurrent, file-disjoint

#### T2 — Derive in the runtime producer

**Files:** `scripts/pack-runtime.mjs`, `tests/package/runtime-producer.test.ts`

**Action:**
- `pack-runtime.mjs`: replace the `:27`/`:28` constants with
  `import { version as stableVersion, bootstrapVersion } from './release-identity.mjs';`
  (§5a for `bootstrapVersion`). Keep `:205`'s manifest guard — note that with `stableVersion`
  now derived from the same manifest the *version* comparison is tautological, so **replace that
  one clause** with an assertion that `manifest.version === stableVersion` still holds through the
  accessor's validation, i.e. drop the redundant clause and leave the accessor as the single
  version validator; every other clause at `:204-212` (name, engines, bin, `private`, `files`)
  stays exactly as-is. `:383`'s round-trip stays meaningful: it still proves only the `version`
  field differs between source and projected manifest.
- `runtime-producer.test.ts`: import `version` and `bootstrapVersion` from
  `../../scripts/release-identity.mjs`. Add
  `writeFile(join(scripts, 'release-identity.mjs'), await readFile(identitySource))` to
  `createFixture()`'s `Promise.all` (line 43–57) — **required**, because `createFixture` copies
  only `pack-runtime.mjs` (`:56`) and the new sibling import would otherwise throw
  `ERR_MODULE_NOT_FOUND`. Derive the fixture manifest version (`:45`) and the expectations at
  `:345,347,383,399,402,403,414,462`.

**Verify:** `npx vitest run --no-file-parallelism tests/package/runtime-producer.test.ts`

**Done:** suite green with zero `1.5.0` literals left in either file; `git diff` shows no
loosened assertion (no `toBe` → `toContain`, no removed clause other than the tautological
version comparison described above).

**Commit:** `refactor(quick-260913-rel): derive packed version in the runtime producer`

#### T3 — Derive in the artifact scanner and its acceptance path

**Files:** `scripts/verify-production-artifacts.mjs`, `tests/helpers/runtime-artifact.ts`,
`tests/package/agent-ready-export.test.ts`, `tests/package/runtime-artifact-verifier.test.ts`

**Action:**
- `verify-production-artifacts.mjs`: `import { version, bootstrapVersion } from
  './release-identity.mjs';` and build `profiles` (`:24-27`) from them. Leave the `--profile`
  default (`stable`) and `assertManifest`'s bootstrap projection guard (`:333-346`) semantically
  unchanged.
- `tests/helpers/runtime-artifact.ts`: derive `runtimeProfiles` (`:26,27`). Keep
  `ManifestProjectionSchema`'s `z.literal` shape (`:40,41`) and the `package.version` schema
  (`:59`) as literal/union schemas — see §7. If `z.enum` rejects non-literal input under `tsc`,
  use `z.union([z.literal(stable), z.literal(bootstrap)])`.
- `agent-ready-export.test.ts`: derive `profileIdentity` (`:28,29`) and `:232`; drop the now-
  invalid `as const` annotations.
- `runtime-artifact-verifier.test.ts`: derive `:199,216,221,222,245,255`.

**Verify:**
```
npx vitest run --no-file-parallelism tests/package/runtime-artifact-verifier.test.ts
npm run accept:runtime-artifact
```

**Done:** both green. The second is the exact command the publish workflow runs at
`publish-npm.yml:88` — this is the gate that would otherwise fail *after* a 1.5.1 candidate was
already built. Every `z.literal` that was a literal before is still a literal.

**Commit:** `refactor(quick-260913-rel): derive scanned and accepted runtime version`

#### T4 — Derive in the npm release verifier

**Files:** `scripts/verify-npm-release.mjs`, `tests/package/npm-release-verifier.test.ts`

**Action:**
- `verify-npm-release.mjs`: `import { name as packageName, version as packageVersion,
  packageLabel, archiveBasename, registryTarballUrl, packumentUrl, provenanceSubject } from
  './release-identity.mjs';` replacing `:10,11,12`. Substitute at `:130`, `:148` (`archiveBasename`),
  `:412`, `:427` (`provenanceSubject`), `:515`, `:531` (`registryTarballUrl`), `:553`
  (`packumentUrl`). Every comparison stays an exact `!==` / `===`. Do not touch `maxArchiveBytes`,
  the redirect/size limits, `fetchBytes`'s `hostname !== 'registry.npmjs.org'` gate, the npm
  version pin, or the isolated-environment construction.
- `npm-release-verifier.test.ts`: import from `../../scripts/release-identity.mjs`. Derive
  `:60,71,95,107,129,130,159,163,170,174,177,198,199`. Add `const mismatchedVersion = '9999.0.0';`
  with `expect(mismatchedVersion).not.toBe(version)` and use it at `:160` and `:311` (§6 traps 1
  and 2). Add the new basename-rejection row from §7 to the `substitutions` list at `:309`.
  Rewrite the standalone test at `:424` per §2: `mkdir(join(fixture.root,'scripts'))`; write
  `scripts/standalone.mjs` (verifier) **and** `scripts/release-identity.mjs`; write
  `fixture.root/package.json` as `{ name, version }` from the accessor; symlink
  `fixture.root/entry.mjs` → `scripts/standalone.mjs`; keep `cwd: fixture.root`, the
  `env: { PATH, ...currentCi() }` isolation, and both existing assertions verbatim.

**Verify:** `npx vitest run --no-file-parallelism tests/package/npm-release-verifier.test.ts`

**Done:** suite green including the new basename row and the rewritten standalone test. Proof the
new row bites: temporarily delete the `:130` basename gate and confirm the suite fails; restore
it. The standalone test still proves no `node_modules` is needed (fixture contains no
`node_modules`, and `PATH` is the only inherited variable).

**Commit:** `refactor(quick-260913-rel): derive verified npm release identity`

#### T5 — Derive the workflow archive identity and fix the concurrency group

**Files:** `.github/workflows/publish-npm.yml`, `docs/distribution-operations.md`

**Action:** Apply §3 exactly.
- `:9-11` → `group: cumpa-npm-stable`, `cancel-in-progress: false` unchanged.
- Insert the `Derive the release archive identity from the pinned source` step between current
  lines 55 and 56; add `archive-basename` to the candidate job `outputs:` block.
- Extend the publish job's line-144 step with the re-derive + `test "$derived" =
  "$EXPECTED_ARCHIVE_BASENAME"` cross-check and the `$GITHUB_ENV` export.
- Substitute lines 76, 84, 93, 102, 116, 168, 176, 188, 195 per the two tables in §3b, including
  the `/^[A-Za-z0-9][A-Za-z0-9._-]*\.tgz$/u` shape guard and explicit `.sort()` inside each
  heredoc.
- `docs/distribution-operations.md`: `:3` drop `@1.5.0` from the policy's package identity; `:67`
  `cumpa-npm-stable-1.5.0` → `cumpa-npm-stable` and record the strictly-stronger serialization
  tradeoff from §3a; `:91` replace the literal `@1.5.0` with "the exact released version".
  **Leave `:55` untouched** (historical bootstrap, §1d).

**Verify:**
```
node -e "const y=require('node:fs').readFileSync('.github/workflows/publish-npm.yml','utf8');const l=y.split('\n');if(/1\.5\.0/.test(y))throw new Error('literal remains');if(!/Require the separately authorized source before checkout/.test(l.slice(26,36).join('\n')))throw new Error('SHA-pin step moved');const d=l.findIndex(x=>x.includes('release-identity.mjs')),p=l.findIndex(x=>x.includes('CUMPA_RELEASE_SOURCE_SHA')),u=l.findIndex(x=>x.includes('CUMPA_RELEASE_ARCHIVE_BASENAME')&&x.includes('payload'));if(!(p<d&&d<u))throw new Error('derivation step ordered wrong');console.log('ordering ok')"
command -v actionlint >/dev/null && actionlint .github/workflows/publish-npm.yml || echo "actionlint absent - ordering assertion above is the gate"
```

**Done:** no `1.5.0` remains in the workflow; the SHA-pin step is still at lines 27–36 and still
the first executable step; the derivation step appears **after** the SHA-pin line and **before**
the first `$CUMPA_RELEASE_ARCHIVE_BASENAME` consumer (the ordering assertion prints
`ordering ok`); `concurrency.group` contains no version; the publish job cross-checks its
re-derived basename against `needs.build-candidate.outputs.archive-basename`; the digest,
byte-length, evidence-sealing, and publish-flag lines are byte-unchanged in `git diff`. Delete the
throwaway ordering check after it passes.

**Commit:** `refactor(quick-260913-rel): derive workflow archive identity and generalize the publish lock`

#### T6 — Derive the package contract expectation and de-version the README

**Files:** `tests/package/runtime-package-contract.test.ts`, `README.md`

**Action:**
- `runtime-package-contract.test.ts`: derive `:106` (`stdout: \`${version}\n\``) and `:122`
  (`version` in the `toMatchObject`). **Leave `:140,143,144` exactly as they are** — §6 trap 3.
- `README.md`: `:5` → identity is `` **`@shipwithai/cumpa`** ``; `:23` →
  `npm install --global @shipwithai/cumpa`; `:29` → `npx --yes @shipwithai/cumpa`. Adjust the
  surrounding prose that says "that exact version" so it matches the de-versioned commands, and
  leave the Phase 3 availability-gate paragraph (`:7`) intact.

**Verify:**
```
npx vitest run --no-file-parallelism tests/package/runtime-package-contract.test.ts
node -e "const t=require('node:fs').readFileSync('README.md','utf8');if(/1\.5\.0/.test(t))throw new Error('README still pins a version');if(!/npm install --global @shipwithai\/cumpa\n/.test(t))throw new Error('install command missing');console.log('readme ok')"
```

**Done:** suite green; README contains no version literal and no longer promises an exact version
it cannot keep. Delete the throwaway README check after it passes.

**Commit:** `refactor(quick-260913-rel): derive package contract version and de-version the README`

### Wave 3

#### T7 — Bump to 1.5.1

**Files:** `package.json`, `package-lock.json`

**Depends on:** T1–T6 all merged and green.

**Action:** `package.json:3` `1.5.0` → `1.5.1`. Regenerate the lock with
`npm install --package-lock-only --ignore-scripts`. Change nothing else. If the diff touches any
file other than these two, or any line other than `package.json:3` and `package-lock.json:3,9`,
**stop**: the derivation is incomplete. Fix the derivation in the owning task; do not hand-edit
the leftover site.

**Verify — full gate list:**
```
npm run typecheck:tests
npx tsc --noEmit -p tsconfig.json
npm run typecheck:web
npx vitest run --no-file-parallelism
deno test --allow-env --allow-net --allow-read supabase/functions/tests
npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-restore.spec.ts
npm run build && npm run accept:runtime-artifact
git diff --stat HEAD~1
```

**Done — every item must hold:**
- `npm run typecheck:tests` clean (both `:node` and `:web` projects).
- `npx tsc --noEmit -p tsconfig.json` clean.
- `npm run typecheck:web` clean.
- `npx vitest run --no-file-parallelism` = **65 files / 520 tests passing** — same counts as the
  pre-refactor baseline. A changed count means a test was added or dropped outside §7's one
  sanctioned addition (T4's basename row, +1 assertion inside an existing test, not a new test
  file or case), so reconcile before proceeding.
- `deno test … supabase/functions/tests` = **17 passing**.
- `npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-restore.spec.ts` =
  **12 passing**.
- `npm run accept:runtime-artifact` green — the publish workflow's own acceptance step, now at
  1.5.1.
- `git diff --stat HEAD~1` shows exactly `package.json` and `package-lock.json`, 3 changed lines
  total.
- `node scripts/release-identity.mjs archiveBasename` prints `shipwithai-cumpa-1.5.1.tgz`.
- **`tests/e2e/file-tree.spec.ts` is a known PRE-EXISTING failure** (selected row renders
  `tabindex="-1"` where the spec expects `"0"`). It is **out of scope**, must remain untouched,
  and must not be "fixed", skipped, or quarantined by this work. It is excluded from the
  Playwright command above; if a full `npx playwright test` is run for any reason, that single
  failure is expected and is not a regression of this plan.

**Commit:** `chore(quick-260913-rel): release 1.5.1`

---

## Out of scope — do not modify

- `.planning/**`, `.kimi-code/**` (including `.kimi-code/skills/cumpa/scripts/check-cumpa.mjs`).
- Untracked operator-owned paths: `.gsd/`, `EVIDENCE.md`, `mockups/`, and the existing quick
  `PLAN.md` files.
- Every LITERAL file in §1f — in particular `tests/helpers/public-artifact-identity.ts`,
  `tests/unit/public-artifact-identity.test.ts`, `scripts/write-acceptance-evidence.mjs`,
  `tests/unit/acceptance-evidence.test.ts`, `tests/package/public-artifact-acceptance.test.ts`,
  `tests/package/marketplace-profile-acceptance.test.ts`,
  `tests/unit/publish-scenario-record.test.ts`, and all 15 sites in
  `tests/cli/check-cumpa.test.ts`.
- `tests/e2e/file-tree.spec.ts`.
- The app-side voluntary-support fix (`src/web/App.vue`,
  `src/web/components/SupportDialog.vue`) — that is the 1.5.1 payload, landed separately; this
  plan only makes the release mechanism version-agnostic.
- Branching, pushing, dispatching, publishing, and any registry / provider / DB mutation. The
  orchestrator owns the push and the release dispatch. No `git commit --no-verify`.
- No new dependency in any task.
