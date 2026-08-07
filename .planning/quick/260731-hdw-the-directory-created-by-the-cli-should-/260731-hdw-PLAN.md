---
phase: quick
plan: 260731-hdw
type: execute
wave: 1
depends_on: []
files_modified:
  - .claude/CLAUDE.md
  - .kimi-code/skills/spike-findings-diff-review/SKILL.md
  - .kimi-code/skills/spike-findings-diff-review/sources/002-staged-source-discovery/README.md
  - .kimi-code/skills/spike-findings-cumpa/SKILL.md
  - .kimi-code/skills/spike-findings-cumpa/sources/002-staged-source-discovery/README.md
  - .planning/MILESTONES.md
  - .planning/spikes/WRAP-UP-SUMMARY.md
autonomous: true
requirements:
  - QUICK-260731-HDW
must_haves:
  truths:
    - "All CLI-managed repository data continues to be created only beneath `.cumpa/`: drafts in `.cumpa/drafts/`, exports in `.cumpa/exports/`, exact internal-path exclusion at `.cumpa`, and the optional ignore append exactly `/.cumpa/`."
    - "Live project configuration, generated/package/bin/theme contracts, project skill metadata, user documentation, and current planning authority contain no intended `diff-review` product or `.diff-review` path reference."
    - "The Cumpa product, private `cumpa` package, sole `cumpa` command, generated `dist/bin/cumpa.mjs`, `cumpa/export` discriminator, and `cumpa-dark` Monaco theme remain unchanged."
  artifacts:
    - path: "src/server/draft-loader.ts"
      provides: "`draftsDirectory` authority for `.cumpa/drafts`"
      contains: "const draftsDirectory = '.cumpa/drafts'"
    - path: "src/server/export-store.ts"
      provides: "`ensureManagedExportsRoot` and `receipt` authority for `.cumpa/exports`"
      contains: "join(root, '.cumpa')"
    - path: "src/git/inventory.ts"
      provides: "`cumpaPath` and `cumpaPathPrefix` exact internal-path exclusion"
      contains: "Buffer.from('.cumpa'"
    - path: "src/git/ignore-status.ts"
      provides: "`cumpaIgnoreProbe` fixed effective-ignore probe"
      contains: ".cumpa/.cumpa-ignore-probe"
    - path: "src/server/gitignore-capability.ts"
      provides: "`cumpaIgnoreRule` fixed append-only rule"
      contains: "/.cumpa/"
    - path: "package.json"
      provides: "Private `cumpa` package and sole `cumpa -> dist/bin/cumpa.mjs` mapping"
      contains: "dist/bin/cumpa.mjs"
    - path: "src/web/monaco/theme.ts"
      provides: "`CUMPA_THEME_ID` current product theme identity"
      contains: "cumpa-dark"
    - path: ".kimi-code/skills/spike-findings-cumpa/SKILL.md"
      provides: "Live Cumpa spike skill metadata"
      contains: "name: spike-findings-cumpa"
  key_links:
    - from: "src/server/draft-loader.ts"
      to: "tests/api/draft.test.ts"
      via: "draft load/mutation returns and writes repository-relative `.cumpa/drafts/<comparison-key>.json`"
      pattern: "\\.cumpa/drafts"
    - from: "src/server/export-store.ts"
      to: "tests/api/export-publication.test.ts"
      via: "published stable pair and receipt paths remain under `.cumpa/exports/<base>..<head>`"
      pattern: "\\.cumpa/exports"
    - from: "src/git/ignore-status.ts, src/server/gitignore-capability.ts, src/git/inventory.ts"
      to: "tests/api/gitignore.test.ts, tests/git/inventory.test.ts"
      via: "effective ignore, append-only consent, exact-root exclusion, and near-match retention"
      pattern: "\\.cumpa"
    - from: "package.json"
      to: "scripts/build-bin.mjs, scripts/verify-production-artifacts.mjs, tests/e2e/package-assets.spec.ts"
      via: "sole `cumpa` mapping and generated executable path agree"
      pattern: "dist/bin/cumpa\\.mjs"
    - from: "src/web/monaco/theme.ts"
      to: "tests/unit/monaco-theme.test.ts, .planning/MILESTONES.md"
      via: "runtime theme ID, regression test, and current milestone ledger agree on `cumpa-dark`"
      pattern: "cumpa-dark"
---

<objective>
Remove the remaining live legacy product/path/theme references while preserving the already-correct `.cumpa` production implementation and `cumpa` command.

Purpose: Complete the clean cutover at the few mutable authorities still advertising the old name, without adding migration aliases, dual roots, or broad historical rewrites.
Output: Renamed Cumpa spike skill, synchronized current project/skill indexes and milestone theme ledger, plus focused production-boundary evidence for `.cumpa` behavior.
</objective>

<execution_context>
@/Users/alessandro/.agents/gsd-core/workflows/execute-plan.md
@/Users/alessandro/.agents/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/PROJECT.md
@.planning/MILESTONES.md
@README.md
@PRODUCT.md
@package.json
@package-lock.json
@src/server/draft-loader.ts
@src/server/export-store.ts
@src/git/inventory.ts
@src/git/ignore-status.ts
@src/server/gitignore-capability.ts
@src/contracts/api.ts
@src/contracts/draft.ts
@src/web/monaco/theme.ts
@scripts/build-bin.mjs
@scripts/verify-production-artifacts.mjs
@tests/api/draft.test.ts
@tests/api/draft-recovery.test.ts
@tests/api/export-publication.test.ts
@tests/api/gitignore.test.ts
@tests/git/inventory.test.ts
@tests/package/agent-ready-export.test.ts
@tests/unit/monaco-theme.test.ts

<interfaces>
- Production is already authoritative and must not be reimplemented: `draftsDirectory` is `.cumpa/drafts`; `ensureManagedExportsRoot()` creates `.cumpa/exports`; `receipt()` emits `.cumpa/exports/...`; `cumpaPath`/`cumpaPathPrefix` exclude only the exact root; `cumpaIgnoreProbe` checks `.cumpa/.cumpa-ignore-probe`; `cumpaIgnoreRule` appends only `/.cumpa/`.
- Package identity is `cumpa`; the protected shell command and generated bin are `cumpa` and `dist/bin/cumpa.mjs`. `scripts/build-bin.mjs`, `scripts/verify-production-artifacts.mjs`, and package fixtures already agree.
- Protected machine/UI identities are `cumpa/export`, Monaco authority `cumpa`, and `CUMPA_THEME_ID = 'cumpa-dark'`. Generic Git diff terminology and the historical phase title “Anchored Diff Review” are not legacy product identifiers.
- `README.md`, `PRODUCT.md`, `DESIGN.md`, active runtime/build source, and tests have no lowercase legacy literal and already document/verify Cumpa, `cumpa`, and `.cumpa`; leave them unchanged unless the focused checks expose a real inconsistency.
- Remaining mutable references are exact and small: `.claude/CLAUDE.md` points at the old skill name; `.kimi-code/skills/spike-findings-diff-review/` encodes the old product in its directory, metadata, project heading/copy, and one bundled spike sentence; `.planning/spikes/WRAP-UP-SUMMARY.md` points at that old skill path; `.planning/MILESTONES.md` names the obsolete `diff-review-dark` theme instead of runtime `cumpa-dark`.
- Completed phase plans, summaries, audits, security/verification records, old quick plans, debug/forensics reports, cached research, branch/workspace names, absolute checkout paths, and the generic archived `02-anchored-diff-review` phase slug are immutable historical evidence rather than live product authority. Do not rewrite or rename them. The active-literal gate below excludes only those evidence locations and fails on every other tracked occurrence.
</interfaces>
</context>

<constraints>
- Clean cutover only: no legacy directory reads, migration, copy/move of user data, compatibility skill, alias, symlink, deprecated export, or second path constant.
- Preserve `cumpa` exactly as the sole command and `dist/bin/cumpa.mjs` as its generated executable. Preserve Cumpa product/package identity and generic diff-domain terminology.
- Do not edit generated `dist/` or `build/` output. Do not add dependencies, reformat unrelated files, or modify production/tests that already satisfy the contract.
- Use filesystem move semantics for the skill directory, then update every live pointer; do not leave both skill directories.
- Immutable evidence is retained only in the enumerated historical locations. Any live occurrence outside that allowlist is a defect, not evidence.
</constraints>

<tasks>

<task type="auto">
  <name>Task 1: Remove the remaining live legacy skill and theme references</name>
  <files>.claude/CLAUDE.md, .kimi-code/skills/spike-findings-diff-review/SKILL.md, .kimi-code/skills/spike-findings-diff-review/sources/002-staged-source-discovery/README.md, .kimi-code/skills/spike-findings-cumpa/SKILL.md, .kimi-code/skills/spike-findings-cumpa/sources/002-staged-source-discovery/README.md, .planning/spikes/WRAP-UP-SUMMARY.md, .planning/MILESTONES.md</files>
  <action>Move `.kimi-code/skills/spike-findings-diff-review/` to `.kimi-code/skills/spike-findings-cumpa/` in one clean cutover. In `SKILL.md`, change the frontmatter skill name, description, project heading, and product sentence to Cumpa; in the bundled staged-discovery README, change only the product-name sentence while retaining the Git-safety finding. Update `.claude/CLAUDE.md` and `.planning/spikes/WRAP-UP-SUMMARY.md` to the new skill display name and path. Change `.planning/MILESTONES.md`’s current theme ledger from `diff-review-dark` to the actual `cumpa-dark` ID. Do not alter technical spike results, product command/package contracts, or historical archives.</action>
  <verify>
    <automated>test -f .kimi-code/skills/spike-findings-cumpa/SKILL.md &amp;&amp; test ! -e .kimi-code/skills/spike-findings-diff-review &amp;&amp; git grep -nF 'spike-findings-cumpa' -- .claude/CLAUDE.md .planning/spikes/WRAP-UP-SUMMARY.md .kimi-code/skills/spike-findings-cumpa/SKILL.md &amp;&amp; git grep -nF 'cumpa-dark' -- .planning/MILESTONES.md src/web/monaco/theme.ts</automated>
  </verify>
  <done>Exactly one live Cumpa spike skill exists and both indexes resolve to it; its bundled copy names Cumpa; the current milestone ledger names the runtime `cumpa-dark` theme; no compatibility path or duplicate skill remains.</done>
</task>

<task type="auto">
  <name>Task 2: Prove the `.cumpa` CLI boundary and absence of intended legacy references</name>
  <files>package.json, package-lock.json, scripts/build-bin.mjs, scripts/verify-production-artifacts.mjs, src/server/draft-loader.ts, src/server/export-store.ts, src/git/inventory.ts, src/git/ignore-status.ts, src/server/gitignore-capability.ts, src/contracts/api.ts, src/contracts/draft.ts, src/web/monaco/theme.ts, README.md, PRODUCT.md, DESIGN.md, tests/api/draft.test.ts, tests/api/draft-recovery.test.ts, tests/api/export-publication.test.ts, tests/api/gitignore.test.ts, tests/git/inventory.test.ts, tests/package/agent-ready-export.test.ts, tests/unit/monaco-theme.test.ts</files>
  <action>Do not perform a blind replacement and do not change already-correct production code or tests. Run the existing focused contracts: draft creation/load/recovery must use `.cumpa/drafts`; export publication and packaged CLI evidence must use `.cumpa/exports` and server-confirmed relative receipts; inventory must exclude the exact root and retain `.cumpaish`, `cumpa.txt`, and nested `src/.cumpa`; ignore inspection/append must probe `.cumpa` and append exactly `/.cumpa/`; package/build/theme assertions must retain `cumpa`, `cumpa`, `dist/bin/cumpa.mjs`, `cumpa/export`, and `cumpa-dark`. Then run a tracked repository-wide legacy literal search. Fail if any match occurs outside the explicitly enumerated immutable evidence locations; inspect the allowed output to ensure it is historical evidence, a generic archived phase slug, or a physical checkout/branch path rather than live guidance.</action>
  <verify>
    <automated>npm exec -- vitest run tests/api/draft.test.ts tests/api/draft-recovery.test.ts tests/api/export-publication.test.ts tests/api/gitignore.test.ts tests/git/inventory.test.ts tests/unit/monaco-theme.test.ts</automated>
    <automated>npm run test:package-contract</automated>
    <automated>node --input-type=module -e 'import {readFileSync} from "node:fs"; const p=JSON.parse(readFileSync("package.json","utf8")); const l=JSON.parse(readFileSync("package-lock.json","utf8")); if(p.name!=="cumpa"||p.bin?.cumpa!=="dist/bin/cumpa.mjs"||Object.keys(p.bin).length!==1||l.name!=="cumpa"||l.packages[""]?.bin?.cumpa!=="dist/bin/cumpa.mjs") process.exit(1)'</automated>
    <automated>node --input-type=module -e 'import {spawnSync} from "node:child_process"; const r=spawnSync("git",["grep","-IlF","diff-review","--","."],{encoding:"utf8"}); if(![0,1].includes(r.status)) process.exit(r.status??1); const allowed=[".planning/milestones/",".planning/quick/",".planning/debug/",".planning/forensics/",".planning/research/.cache/"]; const bad=r.stdout.trim().split("\n").filter(Boolean).filter((f)=&gt;!allowed.some((prefix)=&gt;f.startsWith(prefix))); if(bad.length){console.error(bad.join("\n"));process.exit(1)}'</automated>
  </verify>
  <done>The focused contracts pass through the packaged production boundary; drafts, exports, exact inventory exclusion, effective-ignore handling, and explicit ignore append all use `.cumpa`; protected `cumpa`/Cumpa/package/theme identities remain intact; the repository-wide literal inventory contains no intended live legacy reference and every retained match is confined to reviewed immutable evidence.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| Git repository → CLI-managed filesystem | Repository-controlled paths must not redirect draft/export/ignore operations outside the fixed `.cumpa` authority. |
| Historical planning evidence → live executor guidance | Archived names must not be mistaken for current package, command, persistence, skill, or theme authority. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-QUICK-260731-HDW-01 | Tampering | `.cumpa` managed roots | mitigate | Preserve existing no-follow identity checks and exact server-owned constants; prove draft/export/ignore/inventory behavior with current tests rather than adding a second root. |
| T-QUICK-260731-HDW-02 | Spoofing | skill/theme/product identity | mitigate | Rename the sole live skill and synchronize current indexes/ledger; retain no alias or duplicate directory. |
| T-QUICK-260731-HDW-SC | Tampering | package supply chain | accept | No dependency, version, lock graph, or package-install change is permitted. |
</threat_model>

<verification>
1. Confirm the diff contains only the seven Task 1 move/edit paths plus execution summary/state bookkeeping; production, test, generated, dependency, and user-data files remain untouched.
2. Run the focused Vitest list and packaged production contract from Task 2. The package scenario must create/observe drafts and exports through the shipped `cumpa` entry and report `.cumpa` paths.
3. Confirm package/lock/bin/theme source contracts remain exactly `cumpa`, sole `cumpa`, `dist/bin/cumpa.mjs`, `cumpa/export`, and `cumpa-dark`.
4. Run the repository-wide lowercase literal inventory and reject every path outside the immutable evidence allowlist. Review allowed matches semantically; historical evidence is retained, but no active source, test, docs, config, skill, current ledger, or generated-name authority may use the old product/path name.
</verification>

<success_criteria>
- CLI-created and CLI-served draft/export/ignore behavior remains exclusively under `.cumpa`, with exact-root inventory filtering and near-match preservation proven.
- No migration shim, old-directory read, alias, duplicate skill, second bin, or generated legacy artifact is introduced.
- Cumpa remains the product and private package; `cumpa` remains the sole command; `cumpa-dark` remains the theme.
- Live source, tests, docs, project config, skill metadata/indexes, and current milestone authority have no intended legacy lowercase product/path literal.
- Retained occurrences are limited to reviewed immutable historical records and physical historical paths; they cannot affect current behavior or guidance.
</success_criteria>

<multi_source_coverage>
| Source | Item | Covered by |
|---|---|---|
| GOAL | CLI-managed repository directory is `.cumpa` | Task 2 focused draft/export/ignore/inventory/package contracts |
| GOAL | Remove intended live legacy naming | Task 1 clean cutover plus Task 2 repository-wide literal gate |
| REQ | Identify source path constants, package/bin/theme, tests, docs, planning/config | Frontmatter artifacts/key links, interfaces map, both tasks |
| CONTEXT | Preserve `cumpa` and Cumpa; no migration shims | Constraints and Task 2 protected-identity checks |
| CONTEXT | Distinguish unrelated immutable evidence only after exact occurrence inventory | Interfaces classification and allowlisted repository-wide gate |
| RESEARCH | None | Quick mode Level 0; existing production implementation is authority |
</multi_source_coverage>

<output>
Create `.planning/quick/260731-hdw-the-directory-created-by-the-cli-should-/260731-hdw-SUMMARY.md` when done.
</output>
