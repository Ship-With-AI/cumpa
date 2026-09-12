# Phase 7: Clean Public-Artifact Acceptance — Pattern Map

**Mapped:** 2026-09-11  
**Files analyzed:** 8 likely acceptance assets (2 existing helpers/configs, 2 existing browser suites, 1 new public-install adapter/suite, 1 new OMP harness/evidence adapter, 2 evidence/cleanup surfaces)  
**Analogs found:** 8 / 8 (the new public-install and OMP flows have role-matched analogs; no product source change is indicated)

Phase 7 is an acceptance-harness change, not an application feature. Keep the existing product contracts and browser assertions; change only how the exact public CLI/skill is installed and launched. The local tarball path in the existing helpers is useful for process/browser plumbing, but it is not evidence for ACC-01/02/03.

## File Classification

| New/Modified File or Surface | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `tests/helpers/runtime-artifact.ts` (or a narrowly scoped sibling) | installation adapter / isolation utility | batch install → process launch → evidence | `installRuntimeArtifact`, `protectedEnvironment`, `runRuntimeCommand` | exact isolation, changed input source |
| `tests/e2e/public-artifact-acceptance.spec.ts` (new or extension of existing e2e suite) | browser acceptance / process adapter | request-response + streaming readiness + file export | `tests/e2e/agent-ready-export.spec.ts` | exact browser/export flow, new public install lifecycle |
| `playwright.runtime-artifact.config.ts` | config | batch test selection | existing config | exact, but add only the intended spec(s) |
| `tests/helpers/open-runtime-session.ts` | browser helper | request-response | existing helper | exact; reuse unchanged |
| OMP acceptance harness/evidence recorder (phase-owned script or test adapter) | agent lifecycle adapter | event/process streaming → canonical JSON | `.kimi-code/skills/cumpa/SKILL.md` OMP lifecycle + `startAttachedCli` | role-match; must invoke native OMP, not call helper directly |
| evidence redaction/cleanup in the phase acceptance asset | utility / evidence boundary | transform + filesystem cleanup | `writeRuntimeScenario` and `InstalledRuntimeArtifact.cleanup()` | role-match; preserve bounded evidence and owned-temp cleanup |
| `.kimi-code/skills/cumpa/SKILL.md` (read-only contract) | provider/agent protocol | request-response + supervised process | OMP section and workflow steps 1–8 | exact source contract; do not edit for this phase |
| `tests/e2e/support-restore.spec.ts`, `tests/e2e/support-payment.spec.ts`, `src/server/support-store.ts`, `src/server/support-client.ts` (read-only support analogs) | support-state contract | hosted request-response + persisted state | existing restore/store/client | exact product contract; guards are not live Restore proof |

## Pattern Assignments

### `tests/helpers/runtime-artifact.ts` — isolated installation adapter

**Analog:** `tests/helpers/runtime-artifact.ts`, especially `readRuntimeArtifact`, `protectedEnvironment`, `runRuntimeCommand`, and `installRuntimeArtifact` (lines 179–423; public interfaces and schemas lines 1–177).

**Isolation/import pattern (lines 179–235):**

```ts
function inheritedEnvironment(environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const result: NodeJS.ProcessEnv = {};
  for (const name of ['PATH', 'TMPDIR', 'TMP', 'TEMP', 'LANG', 'LC_ALL', 'TZ']) {
    if (environment[name] !== undefined) result[name] = environment[name];
  }
  if (result.PATH === undefined) fail('PATH is required for isolated npm installation');
  return result;
}

function protectedEnvironment(root: string, source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const home = join(root, 'home');
  const cache = join(root, 'cache');
  const prefix = join(root, 'prefix');
  const config = join(root, 'config');
  mkdirSync(home, { recursive: true, mode: 0o700 });
  mkdirSync(cache, { recursive: true, mode: 0o700 });
  mkdirSync(prefix, { recursive: true, mode: 0o700 });
  mkdirSync(config, { recursive: true, mode: 0o700 });
  const environment = inheritedEnvironment(source);
  Object.assign(environment, {
    HOME: home,
    USERPROFILE: home,
    npm_config_cache: cache,
    npm_config_userconfig: join(config, 'npmrc'),
    npm_config_globalconfig: join(config, 'npmrc-global'),
    npm_config_prefix: prefix,
    npm_config_registry: publicRegistry,
  });
  // create empty config files with wx; never inherit the user's npm config.
  writeFileSync(environment.npm_config_userconfig!, '', { mode: 0o600, flag: 'wx' });
  writeFileSync(environment.npm_config_globalconfig!, '', { mode: 0o600, flag: 'wx' });
  return environment;
}
```

**How to reuse:** retain this environment shape, cleanup ownership, command execution without a shell, and dependency-tree checks. Add a source selector whose public modes run `npm install --global --prefix <isolated-prefix> @shipwithai/cumpa@1.5.0` and `npx --yes --cache <empty-cache> --prefix <isolated-prefix> @shipwithai/cumpa@1.5.0` (or the smallest equivalent that demonstrably uses public npm). Do not pass an archive path, workspace link, `file:`, `npm link`, checkout path, or generated executable. The source-contract/local-tarball path may remain for inherited tests but must be named/recorded as non-ACC-01/02 evidence.

**Identity and safety pattern (lines 83–178):** use strict package/version checks, regular-file/symlink checks, and exact executable resolution already present in `safeArchivePath`, `readIdentity`, `readRuntimeArtifact`, and `installedManifestSchema`. For public modes, replace archive identity with observed package name/version, npm cache/prefix paths, resolved executable path, and a marker that the reviewed repository is outside the Cumpa checkout. Do not claim “source-independent” merely because a host-denial guard was installed; the import source itself must be public npm.

**Command pattern (lines 281–314):**

```ts
export function runRuntimeCommand(
  command: string,
  args: readonly string[],
  options: { cwd: string; env: NodeJS.ProcessEnv },
): string {
  if (process.platform !== 'win32') {
    return execFileSync(command, args, { ...options, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  }
  // Windows branch keeps arguments out of shell interpolation.
}
```

Use argument arrays and `shell: false` semantics. Keep npm’s registry explicit and the cache initially empty for the npx scenario. Never use a shared user prefix/cache.

**Cleanup pattern (lines 315–423):** `installRuntimeArtifact` creates a `mkdtempSync` root and returns `cleanup()` that is idempotent, recursively removes only its owned root, and asserts removal. Copy this ownership boundary for each public install profile. Cleanup must happen only after the child CLI/OMP process exits and result bytes/evidence are read.

### `tests/e2e/public-artifact-acceptance.spec.ts` — three public installation paths

**Analog:** `tests/e2e/agent-ready-export.spec.ts` (imports/setup lines 1–54; process adapters lines 71–183; browser helpers lines 205–286; full workflow scenarios after line 287).

**Process/readiness pattern (lines 71–183):**

```ts
function startAttachedCli(fixture: DirtyGitFixture, selections: ..., request = ...): RunningAttachedCli {
  const child = spawn(process.execPath, ['--import', installed.fetchGuardPath, installed.nodeEntrypointPath], {
    cwd: fixture.nestedCwd,
    env: { ...installed.env, PATH: `${fakeBinRoot}:${installed.env.PATH ?? ''}`, BROWSER: ... },
    stdio: ['pipe', stdoutDescriptor, stderrDescriptor],
  });
  child.stdin!.end(JSON.stringify(request));
  return { child, ... };
}

async function waitForAttachedLoopbackUrl(running: RunningAttachedCli): Promise<string> {
  // Poll stderr for http://127.0.0.1:<port>/#token=...; fail if child exits first.
}
```

For global and npx paths, replace `installed.nodeEntrypointPath` with the generated executable found in that isolated prefix and launch through the actual executable. For ACC-03, do not directly call this helper as an OMP substitute: the native installed marketplace skill must discover/invoke Cumpa, and its supervised process must be retained until Finish and terminal exit. A test-side fetch guard can prove the unavailable/dismissed branch only; remove/bypass it for live Restore and do not interpret a denied request as verified support.

**Browser startup pattern:** `openRuntimeSession(page, url)` is the shared analog. It waits for `/api/session`, waits for the diff editor, and dismisses an unverified support prompt after a successful refresh. Reuse it rather than creating another readiness abstraction. Record that dismissal behavior when interpreting support evidence.

**Review/export pattern:** reuse `ensureReviewOpen`, `addHeadComment`, `saveSummary`, `readOnlyDraft`, and the existing scenarios. The strongest existing contract is the installed relaunch test: add a comment and summary, close the first process, relaunch, assert durable draft bytes and rendered comment/summary, export, then assert `review.json` and `review.md` and parse with `ReviewExportV1Schema`/`ExportReviewResultSchema`. Continue through Finish for attached/agent flow and require the actual canonical result, not a fixture or synthesized JSON.

**Exact-patch analog:** the same suite's attached exact-patch scenario exercises `createGroundedExactPatch` and canonical V3 export. Use it only where the phase scenario needs exact-patch coverage; do not broaden Phase 7 into new review semantics.

**Test configuration analog:** `playwright.runtime-artifact.config.ts` runs Chromium headless, one worker, no retries, and currently includes only `package-assets.spec.ts` and `agent-ready-export.spec.ts`. Add the phase-owned public suite to `testMatch` only if the planner chooses a separate file; otherwise extend an existing suite and avoid duplicate browser setup.

### CLI selection and launch — reuse product contracts, do not reimplement

**Analogs:** `src/cli/picker.ts` (`pickOrderedSources`, `buildSourceSearchItems`) and `src/cli/run.ts` (`runCli`, `runOrdinaryAction`, `launchPinnedSession`, `launchAttachedSession`).

The picker’s locked semantics are ordered base then head, with merge-base and full-OID resolution delegated to existing Git code. The acceptance adapter should supply deterministic fixture selections through the existing `CUMPA_LAUNCH_OPTIONS`/attached request seams used by `agent-ready-export.spec.ts`, not add a second selector or synthesize Git semantics. For the marketplace skill, preserve the skill’s contract: first run the installed checker, then resolve base/head in the reviewed repository, then send full OIDs and merge-base to Cumpa.

**Browser opener analog:** `src/cli/run.ts` exposes `createBrowserUrlOpener` and the tests’ fake `open` executable records the URL marker. Reuse that marker technique to prove launch without touching the user browser profile. Loopback readiness is only readiness; it is never Finish/completion.

### OMP marketplace harness/evidence — native lifecycle only

**Analog:** `.kimi-code/skills/cumpa/SKILL.md`, OMP section and workflow steps 1–8 (read-only contract).

Required sequence to encode in the plan:

1. Isolated OMP profile installs the public `ship-with-ai` marketplace collection; discover the installed `skills/cumpa` copy.
2. The installed skill runs `node "<installed-skill-directory>/scripts/check-cumpa.mjs"` before Git resolution.
3. The checker gates an independently installed exact `@shipwithai/cumpa@1.5.0`; no auto-install, npx fallback, source checkout, or local tarball.
4. OMP invokes `/skill:cumpa`; use native `hub` supervision with a stable process name, not a direct helper invocation, detached shell, or readiness-only assertion.
5. Retain the process until browser Finish; observe actual terminal exit and read the one canonical stdout JSON object only after exit 0.

The skill’s concrete handoff shape is:

```json
{"kind":"cumpa.review-request","schemaVersion":1,"mode":"revisions","revisions":{"base":"<full-merge-base-oid>","head":"<full-head-oid>"}}
```

Accept only non-empty parseable `kind: "cumpa/export"` output after successful Finish. The output must include actual summary/comments and canonical result delivery; readiness URL, skill discovery, `--version`, or a direct script call are insufficient. Preserve Phase 6’s four-agent waiver; OMP success is not evidence for Claude Code, Codex, or Pi.

### Support Restore and host-denial limits

**Analogs:** `src/server/support-client.ts` (validated HTTPS-only `start`/`status`, bounded response bytes, timeout/abort); `src/server/support-store.ts` (`SupportStateV1Schema`, installation-wide persisted `unverified`/`verified` state). `tests/e2e/support-restore.spec.ts` and `tests/e2e/support-payment.spec.ts` contain support evidence/verifier checks, not an already-implemented live Restore browser walkthrough.

Reuse the product UI and support APIs. The existing fetch guard and `openRuntimeSession` dismissal cover unavailable/dismissed scenarios only. ACC-04 also needs real unpaid status and genuinely verified Restore: use an already-paid account, let the user handle protected sign-in, then observe real status and unrestricted review/export in each installation path. Never write the installation-wide support store or mock `support-client` to manufacture verified state.

### Evidence redaction and owned cleanup

**Analogs:** `writeRuntimeScenario` in `tests/helpers/runtime-artifact.ts`, `InstalledRuntimeArtifact.cleanup`, `closeAttachedCliFiles`/`stopGeneratedCli` in `tests/e2e/agent-ready-export.spec.ts`, and the bounded support client above.

Persist only bounded facts: installation mode (`global`, `npx`, `omp`), exact package/collection identity and version, actual host/platform/arch, isolated-root boundary (not private path), browser/export/Finish observations, live unpaid (`unverified`), dismissed and genuinely `verified` support observations, canonical output kind/schema, and cleanup completion. Keep support-unavailable evidence separate from live unpaid proof. Hashes may bind artifacts without including contents. Exclude credentials, live auth URLs, tokens, private absolute paths, raw provider payloads, and full stderr/stdout. Close file descriptors, wait for terminal process exit, then remove only owned scratch directories. Keep immutable Phase 5/6 publication evidence referenced by identity; do not overwrite or regenerate it.

## Shared Patterns

### Public source independence

**Apply to:** global, npx, and OMP acceptance adapters.

The existing archive verifier’s `readRuntimeArtifact`/`installRuntimeArtifact` demonstrates strong identity validation but takes a supplied archive. For Phase 7, the adapter must make the public registry and exact package resolution the source of truth, verify installed package/version/direct executable, and run from a disposable repository outside the Cumpa checkout. A local tarball test remains useful regression coverage but cannot be reported as ACC evidence.

### Browser contract

**Apply to:** every installation mode.

Use `openRuntimeSession` plus the existing comment, summary, persistence/resume, Markdown/JSON export, and Finish assertions. Keep browser automation against the actual loopback URL. Do not replace the walkthrough with launch-only/version-only checks.

### Process completion

**Apply to:** CLI and OMP paths.

Use stderr loopback observation as a readiness gate, then wait on the same child/native supervision handle for actual exit. Only then parse canonical stdout/result file and clean up. Successful start, browser-open marker, or URL publication is not completion.

### Support state

**Apply to:** support-unavailable and verified Restore scenarios.

Keep denial guards confined to the unavailable branch. Verified Restore must use the real hosted client and persisted state, with no fake payment, provider response, database write, or manually seeded flag.

## No Analog / Genuine New Boundary

No existing file is an exact analog for **public npm install with an initially empty cache**, **native OMP marketplace discovery in a fresh profile**, or **three installation modes running the complete browser-to-Finish workflow**. These are thin adapters over the analogs above, not new product abstractions or a replacement acceptance framework. The planner should add the minimum phase-owned harness/evidence code and preserve all existing local-tarball tests.

## Metadata

**Analog search scope:** `.planning/phases`, `tests/helpers`, `tests/e2e`, `tests/package`, `src/cli`, `src/server`, `.kimi-code/skills/cumpa`, and `playwright.runtime-artifact.config.ts`  
**Files/symbols scanned:** runtime isolation, installed CLI launch, browser session/export workflows, support client/store, CLI picker/run, marketplace skill lifecycle  
**Pattern extraction date:** 2026-09-11
