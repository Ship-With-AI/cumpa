---
phase: quick
plan: 260729-ohr
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - package-lock.json
  - scripts/build-bin.mjs
  - scripts/verify-production-artifacts.mjs
  - tests/package/agent-ready-export.test.ts
  - tests/e2e/package-assets.spec.ts
  - tests/e2e/anchored-review.spec.ts
  - tests/e2e/complete-review-draft.spec.ts
  - tests/e2e/file-tree.spec.ts
  - tests/e2e/agent-ready-export.spec.ts
  - README.md
autonomous: true
requirements:
  - QUICK-260729-OHR
must_haves:
  truths:
    - "A local source install exposes exactly the `cumpa` command, backed by executable `dist/bin/cumpa.mjs`, with no `compare` command alias."
    - "The build, production-artifact check, packed inventory, generated-package launch fixtures, and package evidence all use the same cumpa executable path."
    - "The project remains Compare, the private npm package remains `compare`, and Compare-owned persistence and machine identifiers retain their existing names."
    - "README commands use `cumpa` and clearly, accurately, and respectfully distinguish the Compare project name, `compare` package name, and Neapolitan-derived CLI name."
  artifacts:
    - path: "package.json"
      provides: "Single cumpa npm bin mapping while retaining package name compare"
      contains: "dist/bin/cumpa.mjs"
    - path: "scripts/build-bin.mjs"
      provides: "Generated executable at dist/bin/cumpa.mjs"
      contains: "cumpa.mjs"
    - path: "scripts/verify-production-artifacts.mjs"
      provides: "Executable-bit verification for the generated cumpa artifact"
      contains: "dist/bin/cumpa.mjs"
    - path: "tests/e2e/package-assets.spec.ts"
      provides: "Packed inventory assertion for dist/bin/cumpa.mjs"
      contains: "dist/bin/cumpa.mjs"
    - path: "README.md"
      provides: "Compare-versus-cumpa naming explanation and executable commands"
      contains: "cumpà"
  key_links:
    - from: "package.json"
      to: "scripts/build-bin.mjs"
      via: "bin target matches generated output path"
      pattern: "cumpa.*dist/bin/cumpa\\.mjs"
    - from: "scripts/build-bin.mjs"
      to: "scripts/verify-production-artifacts.mjs"
      via: "generator and executable check resolve the same filename"
      pattern: "cumpa\\.mjs"
    - from: "tests/e2e/agent-ready-export.spec.ts"
      to: "tests/package/agent-ready-export.test.ts"
      via: "scenario evidence reports and validates the same packaged artifact path"
      pattern: "dist/bin/cumpa\\.mjs"
    - from: "README.md"
      to: "package.json"
      via: "documented command and generated path match the sole bin mapping"
      pattern: "cumpa|dist/bin/cumpa\\.mjs"
---

<objective>
Rename only Compare's CLI command and generated executable from `compare` to `cumpa`, as a clean cutover across package metadata, build output, packaged-artifact verification, launch fixtures, and user documentation.

Purpose: Give the executable its intended Neapolitan-derived terminal name without renaming the Compare product, private npm package, persistence directory, schemas, environment variables, or comparison terminology.
Output: One synchronized `cumpa` bin contract, focused package/fixture updates, and README naming guidance; no dependency or runtime-behavior changes.
</objective>

<execution_context>
@/Users/alessandro/.agents/gsd-core/workflows/execute-plan.md
@/Users/alessandro/.agents/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.claude/CLAUDE.md
@package.json
@package-lock.json
@scripts/build-bin.mjs
@scripts/verify-production-artifacts.mjs
@src/cli/run.ts
@src/contracts/draft.ts
@src/export/review-export.ts
@tests/package/agent-ready-export.test.ts
@tests/e2e/package-assets.spec.ts
@tests/e2e/anchored-review.spec.ts
@tests/e2e/complete-review-draft.spec.ts
@tests/e2e/file-tree.spec.ts
@tests/e2e/agent-ready-export.spec.ts
@README.md

<interfaces>
- `package.json` and the root package record in `package-lock.json` currently pair the private npm package name `compare` with one generated CLI bin. This change alters only that bin key and target; both package-name fields stay `compare`, all dependency records and versions stay byte-for-byte unchanged.
- `scripts/build-bin.mjs` owns the generated wrapper filename and already removes `dist/` before writing one executable wrapper that imports `../cli/run.js`; the wrapper contents and launch behavior do not need another entry point or compatibility alias.
- `scripts/verify-production-artifacts.mjs` checks the generated wrapper with `X_OK`; its web index and asset checks remain unchanged.
- Five E2E files launch or inventory the generated package path: `package-assets.spec.ts`, `anchored-review.spec.ts`, `complete-review-draft.spec.ts`, `file-tree.spec.ts`, and `agent-ready-export.spec.ts`. `tests/package/agent-ready-export.test.ts` also fingerprints and validates that path. Their `compare-*` temporary-directory prefixes and `COMPARE_*` evidence variables identify the Compare product/test protocol, not the executable, and remain unchanged.
- `src/cli/run.ts` contains Compare product copy and `COMPARE_LAUNCH_OPTIONS`; it has no executable filename to migrate and is read-only for this task.
- `src/contracts/draft.ts` and `src/export/review-export.ts` own the stable `compare/export` schema kind. `.compare/` owns repository-local persistence. Neither is part of the command rename.
- README currently distinguishes the `# Compare` project and private `compare@0.0.0` package from shell commands only implicitly; it must make that distinction explicit while changing only executable commands and generated paths.
</interfaces>
</context>

<constraints>
- Clean cutover only: `package.json` exposes one bin key, `cumpa`; do not retain a `compare` bin alias, duplicate wrapper, compatibility script, redirect, symlink, or deprecation notice.
- Preserve product and package identity: headings and prose continue to call the project `Compare`; `package.json` and both root package-name fields in `package-lock.json` remain `compare`.
- Preserve `.compare/` drafts, exports, inventory exclusions, and ignore rules; preserve the `compare/export` schema kind, `COMPARE_*` environment variables, Compare-owned constants/test prefixes, and generic comparison/diff terminology.
- Change only occurrences that denote the shell command, npm bin key, generated executable filename/path, or an assertion/fixture for that generated executable. Do not bulk-replace the word `compare`.
- Make no dependency, version, script topology, CLI runtime, server, API, persistence, schema, export, or UI behavior changes. Do not edit generated `dist/` files directly; regenerate them through the existing build.
- Use `cumpa` as the ASCII terminal spelling of Neapolitan `cumpà`, used colloquially for a friend, mate, or comrade. Do not present the term as the Compare product name, npm package name, standard Italian spelling, or a stereotype.
- Skip formatters, linters, Vitest, Playwright, CLI tests, and project-wide test execution. Verification is limited to the build, production-artifact script, package dry-run/inventory inspection, and focused static contract searches.
</constraints>

<tasks>

<task type="auto">
  <name>Task 1: Cut over the package and generated-bin contract</name>
  <files>package.json, package-lock.json, scripts/build-bin.mjs, scripts/verify-production-artifacts.mjs, tests/package/agent-ready-export.test.ts</files>
  <action>In `package.json`, replace the sole CLI bin entry with key `cumpa` targeting `dist/bin/cumpa.mjs`; leave `name: "compare"`, version, dependencies, files, and scripts unchanged. Apply the identical bin-only change to the root `packages[""]` record in `package-lock.json`, retaining both lockfile package-name fields and every dependency record. Update `scripts/build-bin.mjs` to write and chmod `cumpa.mjs` while preserving its existing one-wrapper implementation, `dist/` cleanup, shebang, import, and `run()` call. Update `scripts/verify-production-artifacts.mjs` to require executable access at the new generated path without changing its web artifact checks. Update every generated-artifact path and filename segment in `tests/package/agent-ready-export.test.ts`, including source fingerprint, report-path expectations, and evidence-record expectations; retain its `compare-*` temporary prefix, `COMPARE_*` protocol variables, `.compare/` receipt paths, and all behavioral assertions. Add no alias and no dependency.</action>
  <verify>
    <automated>npm run build &amp;&amp; npm run verify:production-artifacts &amp;&amp; test -x dist/bin/cumpa.mjs &amp;&amp; test ! -e dist/bin/compare.mjs &amp;&amp; node --input-type=module -e 'import { readFileSync } from "node:fs"; const pkg=JSON.parse(readFileSync("package.json","utf8")); const lock=JSON.parse(readFileSync("package-lock.json","utf8")); const expected={cumpa:"dist/bin/cumpa.mjs"}; if(pkg.name!=="compare"||JSON.stringify(pkg.bin)!==JSON.stringify(expected)) throw new Error("manifest identity/bin mismatch"); if(lock.name!=="compare"||lock.packages[""].name!=="compare"||JSON.stringify(lock.packages[""].bin)!==JSON.stringify(expected)) throw new Error("lockfile identity/bin mismatch");'</automated>
  </verify>
  <done>The private package is still named `compare`, its lockfile metadata is synchronized without dependency drift, the only declared/generated executable is `cumpa` at `dist/bin/cumpa.mjs`, production verification accepts it, and package evidence names that artifact consistently.</done>
</task>

<task type="auto">
  <name>Task 2: Synchronize every packaged CLI fixture and assertion</name>
  <files>tests/e2e/package-assets.spec.ts, tests/e2e/anchored-review.spec.ts, tests/e2e/complete-review-draft.spec.ts, tests/e2e/file-tree.spec.ts, tests/e2e/agent-ready-export.spec.ts</files>
  <action>Update only generated-executable references in the five focused E2E files. `package-assets.spec.ts` must require `dist/bin/cumpa.mjs` in the packed inventory. The four package-launch fixtures must resolve or report the same generated path, including the segmented source SHA-256 read and scenario evidence payload in `agent-ready-export.spec.ts`. Keep all temporary directory names, `COMPARE_AGENT_READY_*` variables, Compare product messages, `.compare/` paths, test titles, scenario IDs, Git comparison terminology, and runtime behavior unchanged. Do not execute these test suites for this rename.</action>
  <verify>
    <automated>node --input-type=module -e 'import { readFileSync } from "node:fs"; import { spawnSync } from "node:child_process"; const files=["tests/e2e/package-assets.spec.ts","tests/e2e/anchored-review.spec.ts","tests/e2e/complete-review-draft.spec.ts","tests/e2e/file-tree.spec.ts","tests/e2e/agent-ready-export.spec.ts","tests/package/agent-ready-export.test.ts"]; const old=["compare", ".mjs"].join(""); for(const file of files){const text=readFileSync(file,"utf8"); if(text.includes(old)) throw new Error(`${file} retains legacy generated filename`); if(!text.includes("cumpa.mjs")) throw new Error(`${file} lacks cumpa generated filename`);} const npm=process.platform==="win32"?"npm.cmd":"npm"; const packed=spawnSync(npm,["pack","--dry-run","--json","--ignore-scripts"],{encoding:"utf8"}); if(packed.status!==0) throw new Error(packed.stderr||"npm pack dry-run failed"); const [result]=JSON.parse(packed.stdout); const paths=result.files.map(({path})=&gt;path); if(!paths.includes("dist/bin/cumpa.mjs")||paths.includes(["dist/bin/","compare.mjs"].join(""))) throw new Error("packed executable inventory mismatch");'</automated>
  </verify>
  <done>Every focused packed-inventory, generated-process fixture, fingerprint, evidence payload, and evidence assertion points to `dist/bin/cumpa.mjs`; a package dry-run includes it and excludes the former executable, with no test-protocol or persistence rename.</done>
</task>

<task type="auto">
  <name>Task 3: Document Compare and cumpa without renaming protected identities</name>
  <files>README.md</files>
  <action>Keep `# Compare`, Compare product prose, the private `compare@0.0.0` npm package, generic uses of “compare/comparison,” and all `.compare/` storage paths. Near the introduction or local-install section, add a concise naming note that clearly distinguishes the Compare project/product, lowercase `compare` npm package, and `cumpa` command. Explain accurately and respectfully that `cumpa` is the ASCII terminal spelling of Neapolitan `cumpà`, used colloquially for a friend, mate, or comrade. Change the build-output sentence to `dist/bin/cumpa.mjs`, the start-review command block to `cumpa`, and the shutdown instruction to refer to the `cumpa` command while retaining the `## Stop Compare` product heading. Do not turn this focused naming note into a rebrand, language essay, publication claim, or migration/alias guide.</action>
  <verify>
    <automated>node --input-type=module -e 'import { readFileSync } from "node:fs"; const text=readFileSync("README.md","utf8"); const required=["# Compare","compare@0.0.0","dist/bin/cumpa.mjs","`cumpa`","cumpà","friend","mate","comrade",".compare/drafts/",".compare/exports/"]; for(const token of required) if(!text.includes(token)) throw new Error(`README missing ${token}`); const forbidden=[["dist/bin/","compare.mjs"].join(""),["launched `","compare","`"].join(""),"\ncompare\n"]; for(const token of forbidden) if(text.includes(token)) throw new Error(`README retains executable form: ${JSON.stringify(token)}`);'</automated>
  </verify>
  <done>README commands and generated paths use `cumpa`; the naming note distinguishes product, package, and command and explains `cumpà` respectfully; Compare and `.compare/` remain visibly unchanged.</done>
</task>

</tasks>

<source_audit>

| Source | ID | Feature / requirement | Task | Status | Notes |
|---|---|---|---|---|---|
| GOAL | QUICK-260729-OHR | Rename only Compare's CLI command/generated executable to cumpa and document the naming | 1–3 | COVERED | One synchronized package/build/fixture/documentation cutover. |
| REQ | CLI-BIN | Bin key is `cumpa`; generated executable is `dist/bin/cumpa.mjs`; no alias | 1, 2 | COVERED | Manifest, lockfile, generator, verifier, package inventory, and fixture evidence agree. |
| REQ | CLI-SCOPE | Preserve Compare product, `compare` package, `.compare/`, `compare/export`, machine identifiers, and generic diff terminology | 1–3 | COVERED | Explicit action boundaries and positive identity checks prevent bulk rename. |
| REQ | CLI-DOC | README distinguishes Compare from cumpa and explains the Neapolitan name accurately and respectfully | 3 | COVERED | Includes ASCII/accented forms and colloquial meaning. |
| REQ | CLI-VERIFY | Targeted build, package, and search verification without test suites | 1–3 | COVERED | Build/artifact gate, npm pack dry-run, and focused static scans only. |
| RESEARCH | — | No external research or dependencies | — | N/A | Level 0 rename using existing package/build contracts; research explicitly excluded. |
| CONTEXT | — | Clean CLI cutover and protected identifier boundaries | 1–3 | COVERED | Every supplied constraint appears in actions, constraints, or verification. |

</source_audit>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| npm link/global bin → generated wrapper | Manifest bin metadata must resolve to the one executable the build actually creates. |
| packed archive → package launch fixtures | Static inventory and runtime fixtures must agree on the packaged executable path. |
| README shell commands → developer terminal | Documentation must invoke the shipped command without implying a project or package rebrand. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-QUICK-OHR-01 | Tampering | package.json/package-lock.json bin metadata | mitigate | Assert one exact `cumpa` mapping while positively asserting package names remain `compare`. |
| T-QUICK-OHR-02 | Denial of service | generated and packaged executable paths | mitigate | Build, require executable access, inspect dry-run inventory, and reject the former artifact path. |
| T-QUICK-OHR-03 | Spoofing | README naming | mitigate | Explicitly identify product, package, command, original accented spelling, and colloquial meaning. |
| T-QUICK-OHR-04 | Tampering | persistence/schema/machine identifiers | mitigate | Keep source files out of modification scope and statically preserve `.compare/`, `compare/export`, and `COMPARE_*` contracts. |
| T-QUICK-OHR-SC | Tampering | package supply chain | accept | No package install or dependency change occurs; npm pack runs only against the existing lockfile and local build. |
</threat_model>

<verification>
Execute the three task checks in order. They are the complete verification set: existing build plus production-artifact verification, executable presence/absence and manifest/lock contract assertions, npm pack dry-run inventory inspection, focused generated-name searches, and README naming acceptance. Do not run formatters, linters, Vitest, Playwright, CLI tests, or project-wide tests. Confirm the final implementation diff is limited to the eleven `files_modified` entries and contains no changes under `src/`, no dependency/version changes, and no generated `dist/` files.
</verification>

<success_criteria>
- `package.json` exposes exactly `cumpa -> dist/bin/cumpa.mjs`; `package-lock.json` matches; both retain package name `compare`.
- The build creates executable `dist/bin/cumpa.mjs`, creates no former-name executable, and production/package verification accepts the new path.
- All six focused generated-package test/fixture files agree on the new path without executing their suites or renaming Compare-owned protocol identifiers.
- README retains Compare and `compare@0.0.0`, uses `cumpa` for every executable command/path, and explains `cumpa`/`cumpà` accurately and respectfully.
- `.compare/`, `compare/export`, `COMPARE_*`, product copy, generic comparison/diff terminology, dependencies, and runtime behavior remain unchanged.
</success_criteria>

<output>Create `.planning/quick/260729-ohr-change-the-compare-cli-command-and-gener/260729-ohr-SUMMARY.md` after execution with the implementation commit hash and the build, package-dry-run, focused-search, and README-acceptance results.</output>
