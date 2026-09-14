# Phase 4: Exact Runtime Tarball — Pattern Map

**Mapped:** 2026-09-08  
**Files analyzed:** prospective runtime packaging, scanner, evidence, and acceptance seams from the scoped files (no Phase 4 CONTEXT exists)  
**Analogs found:** 8 / 8 prospective concerns (all are role/data-flow analogs, not proof of a tarball)

This map is grounded in the Phase 4 roadmap and shared scope. Prospective file names below are recommendations only; no source/runtime implementation is authorized by this artifact. Phase 4 must produce one approved immutable `@shipwithai/cumpa@1.5.0` archive, install and inspect that same archive outside the source checkout, then preserve its bytes for Phase 5. No tarball verification was run here.

## File Classification

| Prospective new/modified seam | Role | Data flow | Closest current analog | Match quality |
|---|---|---|---|---|
| `scripts/pack-runtime.mjs` (prospective) | config/build utility | transform + file I/O | `package.json` `files`/`prepack`; `scripts/build-bin.mjs` and `scripts/build-native-addon.mjs` | role-match; no current archive builder |
| `scripts/verify-production-artifacts.mjs` | artifact scanner | batch file-I/O / request-response CLI | same file | exact scanner role, but currently repacks checkout outputs through `npm pack --ignore-scripts` |
| `tests/package/package-assets.spec.ts` | package contract test | batch archive inspection | `tests/e2e/package-assets.spec.ts` | exact package-asset analog |
| `tests/package/agent-ready-export.test.ts` | evidence test | request-response subprocess + hash evidence | same file | exact evidence analog, currently checkout `dist` |
| `tests/e2e/agent-ready-export.spec.ts` | browser acceptance | streaming subprocess + browser request-response | same file | exact full-flow analog, currently repacks and symlinks checkout dependencies |
| `tests/helpers/agent-ready-export-target.ts` | target capability helper | transform | same file | exact native-target analog |
| `scripts/verify-prerequisites.mjs` | prerequisite/config verifier | request-response CLI | same file | exact version/dependency analog |
| `LICENSE` / `THIRD_PARTY_NOTICES.md` and prospective package asset copy step | licensed bundle assets | file-I/O | canonical root files + `package.json` allowlist | exact source authority; archive inclusion remains unproved |

## Pattern Assignments

### Runtime-only package cutover (prospective `scripts/pack-runtime.mjs`, `package.json`)

**Analogs:** `package.json` and `scripts/build-bin.mjs`.

Current manifest is intentionally not cut over: `private: true` (package metadata), `files: ["dist/", ".kimi-code/skills/cumpa/"]`, `bin.cumpa: "dist/bin/cumpa.mjs"`, and `prepack: "npm run build"`. The Phase 4 boundary in `docs/distribution-operations.md` explicitly says to keep `private: true` and the allowlist unchanged until runtime-only cutover. Planner should treat these as stale guards to remove/change only as part of the approved cutover, not as evidence that the current package is releasable.

`build-bin.mjs` is the existing generated-launcher pattern:

```js
const outputRoot = resolve(import.meta.dirname, '../dist');
const binDirectory = resolve(outputRoot, 'bin');
const executablePath = resolve(binDirectory, 'cumpa.mjs');
await rm(outputRoot, { force: true, recursive: true });
await mkdir(binDirectory, { recursive: true });
await writeFile(executablePath, executable, 'utf8');
await chmod(executablePath, 0o755);
```

Reuse the existing build outputs and deterministic filesystem primitives. Do not add a release framework or approval engine. Runtime inventory must include compiled Node runtime, `dist/web` emitted JS/CSS/worker/font assets, the launcher, `LICENSE`, and every applicable third-party notice; it must exclude TS/Vue source, source maps, tests/fixtures, planning files, workflows, Git data, `.kimi-code/skills/cumpa/` if the runtime-only contract excludes the separately distributed skill, and source checkout `node_modules`.

**Callsite risk:** `prepack` currently invokes `npm run build`, so `npm pack` is both a rebuild and an archive operation. An exact-archive path must not permit a later `prepack`/rebuild to silently replace the approved bytes. `vite.config.ts` writes UI output to `dist/web` and empties that directory; this is the current browser-asset producer, not a tarball manifest.

### Scanner accepting caller-supplied archive (prospective scanner change)

**Analog:** `scripts/verify-production-artifacts.mjs`, current `scanText`, `parseArguments`, and archive extraction flow.

Current scanner accepts only either no args or the configured-origin pair:

```js
if (argv.length !== 4 || argv[0] !== '--expected-support-origin' || argv[2] !== '--require-configured-launcher') {
  fail('production scanner accepts only --expected-support-origin ORIGIN --require-configured-launcher PATH');
}
```

It then creates a temp directory, runs `npm pack --dry-run --json --ignore-scripts`, runs `npm pack --json --ignore-scripts --pack-destination directory`, extracts the resulting filename, and scans text files from the resulting `package/` tree. This is useful text-policy logic but cannot prove a caller-selected archive: it repacks the current checkout outputs without rebuilding and selects npm’s newly generated filename. The Phase 4 planner should preserve the scanner’s policy checks while adding an explicit archive input (prospective option/name) that extracts and scans exactly that caller-supplied `.tgz`; no implicit repack.

The scanner’s current protected/legacy checks are reusable: `textFile`, `protectedValue`, `legacyRuntime`, `scanText`, canonical support-origin policy, configured launcher inventory check, and exactly-one launcher assignment check. Add inventory assertions for runtime-only exclusions and required legal/bundle assets at the archive boundary. Keep temporary extraction cleanup (`finally { rmSync(directory, { recursive: true, force: true }) }`).

### Preservation/hash evidence (prospective evidence record)

**Analog:** `tests/package/agent-ready-export.test.ts` and `tests/e2e/agent-ready-export.spec.ts`.

The package evidence test currently runs the Playwright suite, reads a report, validates SHA-256 shape, and compares `report.packageArtifact.packedSha256` with `sourceSha256`. Its hard-coded artifact is checkout output:

```ts
const packagedCli = join(projectRoot, 'dist', 'bin', 'cumpa.mjs');
...
expect(report.packageArtifact.path).toBe('dist/bin/cumpa.mjs');
expect(report.packageArtifact.packedSha256).toBe(report.packageArtifact.sourceSha256);
```

This is a useful evidence-record shape, but `sourceSha256 === packedSha256` only fingerprints one launcher file and is not archive identity. Prospective Phase 4 evidence should hash the approved `.tgz` bytes, record archive filename/version, inventory, extracted installed root, and hash of relevant inspected files; it must bind acceptance to the same immutable archive without rebuilding. Do not claim the existing report proves this.

`tests/e2e/agent-ready-export.spec.ts` has the strongest full-flow process seam. It starts the compiled launcher with `spawn(process.execPath, [executablePath], { cwd: fixture.nestedCwd, ... })`, drives browser review, persists draft, exports JSON/Markdown, relaunches, and checks hashes/receipts. Reuse this scenario and evidence contract, but change its executable/install root to the installed archive outside the source checkout and pass the archive identity into the report.

### Outside-checkout install and full browser review/export/Finish acceptance (prospective test seam)

**Analogs:** `tests/e2e/agent-ready-export.spec.ts` and `tests/package/agent-ready-export.test.ts`.

Current setup is not an independent installed-artifact proof:

```ts
runPrerequisite(npmCommand, ['run', 'build']);
runPrerequisite(npmCommand, ['run', 'verify:production-artifacts']);
const [packed] = JSON.parse(runPrerequisite(npmCommand, ['pack', '--json', '--ignore-scripts', '--pack-destination', packedRoot]));
execFileSync('tar', ['-xzf', join(packedRoot, packed!.filename), '-C', packedRoot);
symlinkSync(join(repositoryRoot, 'node_modules'), join(extractedPackageRoot, 'node_modules'), 'dir');
```

This rebuilds, repacks, extracts into a temp folder, then links the source checkout’s `node_modules`; the test executable is `packedRoot/package/dist/bin/cumpa.mjs`, but dependencies are not installed from the archive. `tests/e2e/package-assets.spec.ts` similarly chooses `npm run build` or `build:runtime`, calls `npm pack`, extracts it, and the “clean install” installs a newly generated local tarball. These helpers cannot prove “same approved archive outside checkout.”

The prospective acceptance should install the already approved archive with `npm install --ignore-scripts --prefix <outside-root> <approved-tgz>` (or equivalent no-link install), launch `<outside-root>/node_modules/@shipwithai/cumpa/dist/bin/cumpa.mjs`, and run the existing browser review → save comment/summary → export → relaunch/recovery → agent Finish assertions. The review fixture can remain `createDirtyGitFixture` because the reviewed repository is intentionally separate from the package source checkout. Keep the existing `assertSourceControlUnchanged`, receipt-path, canonical JSON/Markdown, and process termination evidence.

For attached Finish, the current helper sends strict JSON over stdin and captures stdout/stderr separately in `startAttachedCli`; this is the right request-response seam for REL-03. It must be exercised from the installed archive path, not `dist` in the source tree.

### Native addon target-aware behavior

**Analogs:** `scripts/build-native-addon.mjs`, `tests/helpers/agent-ready-export-target.ts`, and target rows in `tests/package/agent-ready-export.test.ts`.

The build script derives target from `CUMPA_NATIVE_BUILD_PLATFORM ?? process.platform` and `CUMPA_NATIVE_BUILD_ARCH ?? process.arch`; it emits `dist/native/directory_exchange.node` only for `darwin` + `arm64`, and removes the output otherwise:

```js
if (platform !== 'darwin' || arch !== 'arm64') {
  rmSync(output, { force: true });
  process.exit(0);
}
```

The helper’s declared capability is intentionally narrow:

```ts
export function hasObservedNativeReExport(platform: string, arch: string): boolean {
  return platform === 'darwin' && arch === 'arm64';
}
```

Tests explicitly expect `(darwin, arm64) => true`, `(linux, arm64) => false`, `(darwin, x64) => false`. Preserve this truthfulness in archive inventory and acceptance: native capability limitations must be stated, not silently promised away. Do not package a darwin-arm64 binary as universal or imply native re-export on unsupported targets. A research-sensitive decision for Main is whether one platform-specific Phase 4 archive is approved, or whether runtime artifact handling must be target-specific; current code only provides a real native build for darwin-arm64.

### Exact version and prerequisites

**Analog:** `scripts/verify-prerequisites.mjs` and `package.json`.

The manifest already pins `version: "1.5.0"`, `engines.node: ">=24"`, and exact direct dependency versions. `verify-prerequisites.mjs` checks Node major >=24, exact approved dependency map/count, `git --version`, and `npm ls --depth=0` in the repository root. Reuse the exact-release map and fail-fast style for package metadata/version and install prerequisites. Note that its `npm ls` check validates the checkout, not an outside archive installation; acceptance needs an equivalent check rooted at the installed package or must explicitly distinguish the two.

### Licensed bundle assets

**Canonical refs:** `LICENSE` (standard MIT, SHA-256 recorded in `03-LICENSE-APPROVAL.md` as `c947d781600d41cdeac710b2c81f5cd04ed88bad83dcc2277cffb30768490c7d`), `THIRD_PARTY_NOTICES.md` (canonical independent notices; digest recorded as `847c9cb7...` in the same approval record), `docs/distribution-operations.md`.

`LICENSE` is the authoritative 1,104-byte MIT text with copyright `2026 Alessandro Magionami & Manuel Salvatore Martone`; `THIRD_PARTY_NOTICES.md` preserves independently applicable Monaco/Node/TypeScript/Unicode/W3C and other grants. The notices file itself says its correspondence is source/import evidence and that Phase 4 must determine actual final bundle inventory and retain every applicable direct/transitive notice. Therefore, do not infer inclusion from root files or old `npm pack` inventory: assert both required files (and any required emitted worker/font assets) in the inspected archive and bind their bytes/digests to the approved artifact. The separately distributed `.kimi-code/skills/cumpa/` skill must not be silently bundled as runtime; its package boundary is independently governed.

## Shared Patterns

### Deterministic subprocess and temp-root handling

Reuse `execFileSync` with argument arrays, `mkdtemp`/`mkdtempSync`, explicit `cwd`, and `finally` cleanup from the scanner/e2e helpers. Never shell-interpolate archive paths or use source-checkout symlinks in the acceptance path.

### Evidence boundaries

Reuse structured evidence objects with schema/version, run ID, target platform/arch, artifact path, SHA-256, and observable outcomes from `tests/package/agent-ready-export.test.ts`. Add archive hash and installation root as first-class fields. A hash-shaped string or a source-tree digest is not tarball verification.

### Product behavior unchanged

Reuse browser review/export/agent handoff tests rather than creating a second workflow. Existing tests already preserve loopback launch, comments, summary, canonical export, relaunch, Finish stdout, and support-neutral behavior. Phase 4 changes only packaging/install authority.

## Existing Seams That Cannot Prove This Phase

| Existing seam | Why insufficient for Phase 4 |
|---|---|
| `package.json` `prepack: npm run build` | Rebuilds at pack time; no immutable caller-supplied archive identity. |
| `scripts/verify-production-artifacts.mjs` no-arg/default path | Calls `npm pack` itself and scans the newly generated checkout package. |
| `tests/e2e/package-assets.spec.ts` | Builds source, packs source, and installs a newly generated local tarball; no preserved approved archive. |
| `tests/e2e/agent-ready-export.spec.ts` setup | Builds/re-packs and symlinks source `node_modules` into extracted package. |
| `tests/package/agent-ready-export.test.ts` | Reports `dist/bin/cumpa.mjs`, and compares one launcher hash, not archive bytes. |
| `scripts/verify-prerequisites.mjs` | Verifies repository `node_modules`, not a clean outside-checkout install. |
| `dist/` in the working tree | Generated output is not an immutable release artifact and may be stale. |
| Root `LICENSE`/`THIRD_PARTY_NOTICES.md` | Canonical sources only; inclusion in an archive is unverified until extracted inspection. |

## Stale or Conflicting Assumptions Requiring Clean Cutover

- Current tests assume building and packing from the source checkout is the acceptance authority; replace that authority with one caller-supplied approved `.tgz` while retaining source-build checks only as preparation.
- Current e2e setup assumes a checkout `node_modules` symlink is acceptable; remove this from Phase 4 acceptance because it masks missing runtime dependencies/assets.
- Current evidence calls `dist/bin/cumpa.mjs` the package artifact and equates packed/source launcher hashes; rename/reframe around the complete archive digest and installed path.
- `scripts/verify-production-artifacts.mjs` currently rejects all arguments except support-origin configuration; its CLI contract must be extended deliberately, without weakening configured-origin scanning.
- `package.json` intentionally remains `private: true` and allowlist-limited until the cutover; do not treat current `npm pack` output as approved release contents.
- README’s “availability gate” correctly makes registry availability conditional; Phase 4 must not change it to claim npm publication. Phase 5 owns registry/provenance evidence.
- `THIRD_PARTY_NOTICES.md` explicitly warns that current notices are not final npm-artifact evidence; retain that distinction.

## No Analog / Research-Sensitive Decisions for Main

1. **Archive naming and handoff location:** prospective exact-archive path/manifest and how Phase 5 consumes the preserved bytes are not established by current code.
2. **Native target scope:** current build is only darwin-arm64; decide whether Phase 4 approves one target-specific archive or requires a target matrix. Do not silently promise other platforms.
3. **License/notice placement:** root `LICENSE` and `THIRD_PARTY_NOTICES.md` are canonical, but whether npm metadata also requires `license`/`notice` fields or additional dependency notices needs research/toolchain confirmation.
4. **Whether `private` removal and `prepack` replacement happen in the same cutover:** current operations policy requires the guard/allowlist cutover, but exact sequencing should preserve one approved immutable tarball.

## Metadata

**Analog search scope:** `package.json`, `scripts/{build-bin,build-native-addon,verify-production-artifacts,verify-prerequisites}.mjs`, `vite.config.ts`, `tests/package`, `tests/e2e`, `tests/helpers`, `README.md`, `LICENSE`, `THIRD_PARTY_NOTICES.md`, `.planning/ROADMAP.md`, `docs/distribution-operations.md`, Phase 3 canonical approval/publication refs.  
**Files scanned:** scoped files and nearest package/e2e/helper analogs; no broad source exploration.  
**Pattern extraction date:** 2026-09-08
