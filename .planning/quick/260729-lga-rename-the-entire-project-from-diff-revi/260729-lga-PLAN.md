---
phase: quick
plan: 260729-lga
type: execute
wave: 1
depends_on: []
files_modified:
  - .gitignore
  - package.json
  - package-lock.json
  - scripts/build-bin.mjs
  - scripts/build-native-addon.mjs
  - scripts/verify-production-artifacts.mjs
  - src/cli/picker.ts
  - src/cli/run.ts
  - src/contracts/api.ts
  - src/contracts/draft.ts
  - src/domain/anchor.ts
  - src/domain/comparison-key.ts
  - src/domain/errors.ts
  - src/export/render-review-markdown.ts
  - src/export/review-export.ts
  - src/git/ignore-status.ts
  - src/git/inventory.ts
  - src/server/app.ts
  - src/server/capabilities.ts
  - src/server/draft-loader.ts
  - src/server/export-store.ts
  - src/server/gitignore-capability.ts
  - src/server/lifecycle.ts
  - src/server/native-exchange-capability.ts
  - src/server/routes.ts
  - src/server/security.ts
  - src/web/App.vue
  - src/web/index.html
  - src/web/api/client.ts
  - src/web/components/DraftRecovery.vue
  - src/web/components/ExportReadinessSummary.vue
  - src/web/components/ExportSection.vue
  - src/web/components/FileMetadataPane.vue
  - src/web/components/GitignoreStatus.vue
  - src/web/components/IdentityHeader.vue
  - src/web/components/ReviewPanel.vue
  - src/web/components/SelectorDriftNotice.vue
  - src/web/components/SummarySection.vue
  - src/web/model/review-draft-state.ts
  - src/web/monaco/diff-adapter.ts
  - src/web/monaco/theme.ts
  - src/web/prototypes/MonacoStabilityPrototype.vue
  - src/web/prototypes/Phase6DiffSemanticsPrototype.vue
  - tests/api/anchor.test.ts
  - tests/api/draft-atomicity.test.ts
  - tests/api/draft-conflict.test.ts
  - tests/api/draft-lifecycle.test.ts
  - tests/api/draft-recovery.test.ts
  - tests/api/draft-reveal.test.ts
  - tests/api/draft.test.ts
  - tests/api/export-publication.test.ts
  - tests/api/export.test.ts
  - tests/api/gitignore.test.ts
  - tests/api/security.test.ts
  - tests/api/selector-drift.test.ts
  - tests/api/session.test.ts
  - tests/cli/errors.test.ts
  - tests/e2e/agent-ready-export-safety.spec.ts
  - tests/e2e/agent-ready-export.spec.ts
  - tests/e2e/anchored-review.spec.ts
  - tests/e2e/complete-review-draft.spec.ts
  - tests/e2e/file-tree.spec.ts
  - tests/e2e/package-assets.spec.ts
  - tests/e2e/pinned-session.spec.ts
  - tests/e2e/responsive-session.spec.ts
  - tests/git/anchored-content.test.ts
  - tests/git/availability.test.ts
  - tests/git/comparison.test.ts
  - tests/git/ignore-status.test.ts
  - tests/git/inventory.test.ts
  - tests/git/selector-drift.test.ts
  - tests/helpers/export-fault-runner.ts
  - tests/helpers/git-fixture.ts
  - tests/helpers/source-control-snapshot.ts
  - tests/integration/agent-ready-export-states.spec.ts
  - tests/integration/anchored-workspace.spec.ts
  - tests/integration/draft-recovery-ui.spec.ts
  - tests/integration/export-receipt-ui.spec.ts
  - tests/integration/selector-drift-ui.spec.ts
  - tests/package/agent-ready-export-safety.test.ts
  - tests/package/agent-ready-export.test.ts
  - tests/unit/build-native-addon.test.ts
  - tests/unit/directory-exchange.test.ts
  - tests/unit/draft-load.test.ts
  - tests/unit/monaco-theme.test.ts
  - tests/unit/review-export.test.ts
  - tests/unit/review-markdown.test.ts
  - README.md
  - PRODUCT.md
  - .planning/PROJECT.md
  - .planning/ROADMAP.md
  - .claude/CLAUDE.md
autonomous: true
requirements:
  - QUICK-260729-LGA
must_haves:
  truths:
    - "Users see Cumpa everywhere the active product identifies itself, including browser, terminal, exported Markdown, README, product copy, and current project instructions."
    - "The npm package, command, generated executable, environment variables, Monaco IDs, hash domains, export discriminator, and other project-owned machine identifiers use cumpa/CUMPA/Cumpa consistently."
    - "New drafts and exports live beneath .cumpa/, that root is excluded from comparisons, and the optional ignore flow appends exactly /.cumpa/."
    - "Package metadata, lockfile root metadata, build scripts, package assertions, fixtures, and focused expectations all agree on cumpa and dist/bin/cumpa.mjs."
    - "Historical plans, summaries, audits, debug/forensics records, milestone ledgers, completed phase names, and the physical checkout directory remain untouched."
  artifacts:
    - path: "package.json"
      provides: "cumpa package name and cumpa CLI/bin mapping"
      contains: "dist/bin/cumpa.mjs"
    - path: "package-lock.json"
      provides: "lockfile root metadata synchronized with package.json"
    - path: "src/server/draft-loader.ts"
      provides: ".cumpa draft path authority"
    - path: "src/server/export-store.ts"
      provides: ".cumpa export publication and receipt authority"
    - path: "src/git/inventory.ts"
      provides: ".cumpa internal-path exclusion"
    - path: "src/web/index.html"
      provides: "Cumpa browser title"
    - path: "README.md"
      provides: "Cumpa setup, CLI, persistence, export, and shutdown instructions"
  key_links:
    - from: "package.json"
      to: "scripts/build-bin.mjs"
      via: "cumpa bin mapping targets the generated executable"
      pattern: "cumpa.*dist/bin/cumpa\\.mjs"
    - from: "src/contracts/api.ts"
      to: "src/server/export-store.ts"
      via: ".cumpa receipt-path schemas validate server-produced receipt paths"
      pattern: "\\.cumpa/exports"
    - from: "src/contracts/draft.ts"
      to: "src/export/review-export.ts"
      via: "cumpa/export discriminator is shared by schema and producer"
      pattern: "cumpa/export"
    - from: "src/git/ignore-status.ts"
      to: "src/server/gitignore-capability.ts"
      via: "the .cumpa probe and /.cumpa/ append rule describe the same root"
      pattern: "cumpa.*ignore"
    - from: "src/web/monaco/theme.ts"
      to: "src/web/monaco/diff-adapter.ts"
      via: "Cumpa theme symbols and cumpa-owned Monaco identifiers"
      pattern: "CUMPA_THEME|cumpa-dark"
---

<objective>
Rename the complete tracked active project identity from Diff Review/diff-review to Cumpa/cumpa in one clean cutover.

Purpose: Establish Cumpa as the sole live product, package, CLI, persistence, and machine identity while preserving generic diff terminology and truthful historical records.
Output: Synchronized runtime, package/build, test-fixture, user-copy, and active project-document identifiers with no dependency additions or checkout-root move.
</objective>

<execution_context>
@/Users/alessandro/.agents/gsd-core/workflows/execute-plan.md
@/Users/alessandro/.agents/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@package.json
@package-lock.json
@README.md
@PRODUCT.md
@src/server/draft-loader.ts
@src/server/export-store.ts
@src/git/inventory.ts
@src/contracts/api.ts
@src/contracts/draft.ts
@src/cli/run.ts
@scripts/build-bin.mjs
@tests/e2e/package-assets.spec.ts
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.claude/CLAUDE.md

<interfaces>
- `package.json`, `package-lock.json`, `scripts/build-bin.mjs`, and `scripts/verify-production-artifacts.mjs` jointly own the npm name, command, generated binary path, and packaged-artifact assertions.
- `draft-loader.ts`, `export-store.ts`, `ignore-status.ts`, `gitignore-capability.ts`, `inventory.ts`, and API receipt schemas jointly own the repository-local persistence root and its safety boundaries.
- `draft.ts` and `review-export.ts` jointly own the canonical export discriminator; `anchor.ts` and `comparison-key.ts` own versioned hash-domain identifiers.
- `theme.ts` and `diff-adapter.ts` own project-specific Monaco IDs. Generic diff concepts such as DiffSide, diff rendering, DiffWorkspace, and Git diff terminology are not project-name identifiers and must remain unchanged.
- The package is private at 0.0.0 and the live README explicitly says it is unpublished. Perform the requested clean cutover without compatibility commands, aliases, dual persistence roots, or deprecated API names. Do not delete or mutate any pre-existing untracked `.diff-review/` directory; it is outside tracked-source scope.
- `.planning/PROJECT.md` mixes current project identity with historical milestone prose. Update current identity and current persistence statements, but retain completed phase titles and time-bound v1.0/v1.1 statements when changing them would rewrite history.
</interfaces>
</context>

<constraints>
- Use `Cumpa` in user-facing product prose and `cumpa` for package, CLI, generated binary, persistence directory, URI/action/theme IDs, export discriminator, hash domains, temporary fixture prefixes, and other machine identifiers; use `CUMPA_` for project-owned environment variables and constants.
- Clean cutover only: do not leave `diff-review` command aliases, old exported symbol aliases, dual-read persistence paths, deprecation shims, or compatibility re-exports.
- Do not rename generic diff-domain concepts, files, components, types, CSS selectors, or prose merely because they contain the word `diff`; rename only identifiers that encode the old project identity.
- Do not physically move or rename `/Users/alessandro/projects/diff-review`; the checkout root is outside versioned source scope.
- Do not add dependencies. Do not modify historical completed plans, summaries, audits, security/verification/UAT records, milestone archives, debug/forensics reports, retrospective records, or historical entries in `.planning/STATE.md`.
- Verification for this quick plan uses build, package metadata/inventory, and tracked searches only. Do not run formatters, linters, Vitest, Playwright, or project-wide test commands.
</constraints>

<tasks>

<task type="auto">
  <name>Task 1: Cut over runtime, package, CLI, and persistence identity</name>
  <files>.gitignore, package.json, package-lock.json, scripts/build-bin.mjs, scripts/build-native-addon.mjs, scripts/verify-production-artifacts.mjs, src/cli/picker.ts, src/cli/run.ts, src/contracts/api.ts, src/contracts/draft.ts, src/domain/anchor.ts, src/domain/comparison-key.ts, src/domain/errors.ts, src/export/render-review-markdown.ts, src/export/review-export.ts, src/git/ignore-status.ts, src/git/inventory.ts, src/server/app.ts, src/server/capabilities.ts, src/server/draft-loader.ts, src/server/export-store.ts, src/server/gitignore-capability.ts, src/server/lifecycle.ts, src/server/native-exchange-capability.ts, src/server/routes.ts, src/server/security.ts, src/web/App.vue, src/web/index.html, src/web/api/client.ts, src/web/components/DraftRecovery.vue, src/web/components/ExportReadinessSummary.vue, src/web/components/ExportSection.vue, src/web/components/FileMetadataPane.vue, src/web/components/GitignoreStatus.vue, src/web/components/IdentityHeader.vue, src/web/components/ReviewPanel.vue, src/web/components/SelectorDriftNotice.vue, src/web/components/SummarySection.vue, src/web/model/review-draft-state.ts, src/web/monaco/diff-adapter.ts, src/web/monaco/theme.ts, src/web/prototypes/MonacoStabilityPrototype.vue, src/web/prototypes/Phase6DiffSemanticsPrototype.vue</files>
  <action>Replace the active project identity end to end: set npm name and sole bin key to `cumpa`, target `dist/bin/cumpa.mjs`, and regenerate only lockfile root metadata with `npm install --package-lock-only --ignore-scripts`; update build/verification scripts accordingly. Rename project-owned exported types, schemas, functions, methods, constants, local names, environment variables, Monaco action/model/theme IDs, picker sentinel, native-build fixture prefixes, hash-domain strings, and the canonical export kind to Cumpa/cumpa/CUMPA forms, migrating every tracked caller in this task rather than retaining aliases. Change all default draft, export, receipt, inventory-exclusion, ignore-probe, and `.gitignore` rule authorities from `.diff-review` to `.cumpa`, preserving existing atomicity, symlink, bounded-path, and security behavior. Update terminal/browser/export copy and development prototypes to the `Cumpa` product name. Keep generic diff-domain identifiers intact. Because the package is private, version 0.0.0, and documented as unpublished, do not add a compatibility CLI, deprecated symbols, or a dual-read persistence path; leave any untracked legacy directory untouched rather than deleting or rewriting user bytes.</action>
  <verify>
    <automated>node -e "const p=require('./package.json'),l=require('./package-lock.json'); if(p.name!=='cumpa'||p.bin?.cumpa!=='dist/bin/cumpa.mjs'||l.name!=='cumpa'||l.packages[''].name!=='cumpa'||l.packages[''].bin?.cumpa!=='dist/bin/cumpa.mjs') process.exit(1)"</automated>
    <automated>npm run build && test -x dist/bin/cumpa.mjs && test ! -e dist/bin/diff-review.mjs</automated>
    <automated>npm pack --dry-run --json</automated>
    <automated>sh -c 'git grep -nEI "Diff Review|diff-review|DIFF_REVIEW|DiffReview|diffReview" -- .gitignore package.json package-lock.json scripts src; test "$?" -eq 1'</automated>
  </verify>
  <done>The built project exposes only package/CLI `cumpa`, produces `dist/bin/cumpa.mjs`, uses `.cumpa` for all new persistence and ignore behavior, emits Cumpa product copy, and contains no old project identifiers in active runtime/build source.</done>
</task>

<task type="auto">
  <name>Task 2: Migrate fixtures and assertions to the Cumpa contract</name>
  <files>tests/api/anchor.test.ts, tests/api/draft-atomicity.test.ts, tests/api/draft-conflict.test.ts, tests/api/draft-lifecycle.test.ts, tests/api/draft-recovery.test.ts, tests/api/draft-reveal.test.ts, tests/api/draft.test.ts, tests/api/export-publication.test.ts, tests/api/export.test.ts, tests/api/gitignore.test.ts, tests/api/security.test.ts, tests/api/selector-drift.test.ts, tests/api/session.test.ts, tests/cli/errors.test.ts, tests/e2e/agent-ready-export-safety.spec.ts, tests/e2e/agent-ready-export.spec.ts, tests/e2e/anchored-review.spec.ts, tests/e2e/complete-review-draft.spec.ts, tests/e2e/file-tree.spec.ts, tests/e2e/package-assets.spec.ts, tests/e2e/pinned-session.spec.ts, tests/e2e/responsive-session.spec.ts, tests/git/anchored-content.test.ts, tests/git/availability.test.ts, tests/git/comparison.test.ts, tests/git/ignore-status.test.ts, tests/git/inventory.test.ts, tests/git/selector-drift.test.ts, tests/helpers/export-fault-runner.ts, tests/helpers/git-fixture.ts, tests/helpers/source-control-snapshot.ts, tests/integration/agent-ready-export-states.spec.ts, tests/integration/anchored-workspace.spec.ts, tests/integration/draft-recovery-ui.spec.ts, tests/integration/export-receipt-ui.spec.ts, tests/integration/selector-drift-ui.spec.ts, tests/package/agent-ready-export-safety.test.ts, tests/package/agent-ready-export.test.ts, tests/unit/build-native-addon.test.ts, tests/unit/directory-exchange.test.ts, tests/unit/draft-load.test.ts, tests/unit/monaco-theme.test.ts, tests/unit/review-export.test.ts, tests/unit/review-markdown.test.ts</files>
  <action>Update every affected fixture, import, symbol reference, environment variable, temporary-directory prefix, package/bin path, persistence path, exported discriminator, Git identity label, browser/terminal assertion, and package evidence record to the Task 1 Cumpa contract. Preserve the intent and strength of each existing assertion, including near-match inventory cases: translate `.diff-reviewish.txt`, `diff-review.txt`, and nested internal-path fixtures to equivalent `.cumpa`/`cumpaish`/`cumpa.txt` cases rather than deleting them. Do not rename generic diff test concepts. Do not execute Vitest, Playwright, or any project-wide test command in this quick task; the build/package/search gates are the requested verification boundary.</action>
  <verify>
    <automated>sh -c 'git grep -nEI "Diff Review|diff-review|DIFF_REVIEW|DiffReview|diffReview" -- tests; test "$?" -eq 1'</automated>
    <automated>git diff --check -- tests</automated>
  </verify>
  <done>All tracked fixtures and assertions describe Cumpa, `.cumpa`, `cumpa/export`, `CUMPA_*`, and `dist/bin/cumpa.mjs` without weakening persistence, packaging, security, UI-copy, or near-match contracts.</done>
</task>

<task type="auto">
  <name>Task 3: Rename live documentation and current planning identity</name>
  <files>README.md, PRODUCT.md, .planning/PROJECT.md, .planning/ROADMAP.md, .claude/CLAUDE.md</files>
  <action>Rename current user-facing and project-authority prose to `Cumpa`, including README setup/launch/stop commands, private package identity, generated binary, draft/export locations, ignore-flow copy, PRODUCT facts, the current project heading/description/status/persistence contract, roadmap title, and the loaded `.claude/CLAUDE.md` project/persistence block. Preserve the rationale that Cumpa reads as English “cumpa” and Italian “comrade/friend” in the current product description. In `.planning/PROJECT.md`, leave completed phase names and explicitly time-bound v1.0/v1.1 statements unchanged where the old name records what shipped or what a completed milestone was called. Do not edit `.planning/STATE.md`, `.planning/MILESTONES.md`, milestone archives, phase artifacts, debug/forensics records, prior quick plans/summaries, or the checkout directory.</action>
  <verify>
    <automated>sh -c 'git grep -nEI "Diff Review|diff-review|DIFF_REVIEW|DiffReview|diffReview" -- README.md PRODUCT.md .claude/CLAUDE.md .planning/ROADMAP.md; test "$?" -eq 1'</automated>
    <automated>git grep -nE '^# Cumpa$|^Cumpa is |^Cumpa now delivers' -- .planning/PROJECT.md && git grep -nF '.cumpa/' -- .planning/PROJECT.md && git grep -nE '^# Roadmap: Cumpa$' -- .planning/ROADMAP.md</automated>
    <automated>git diff --check -- README.md PRODUCT.md .planning/PROJECT.md .planning/ROADMAP.md .claude/CLAUDE.md</automated>
  </verify>
  <done>Live documentation and current planning/instruction identity consistently use Cumpa while completed historical records remain accurate and the physical checkout root is unchanged.</done>
</task>

</tasks>

<source_audit>
| Source | ID | Requirement | Task | Status |
|---|---|---|---|---|
| GOAL | QUICK-260729-LGA | Complete tracked active rename to Cumpa/cumpa | 1, 2, 3 | COVERED |
| CONTEXT | Product contract | Cumpa in user prose; cumpa/CUMPA for machine identity | 1, 2, 3 | COVERED |
| CONTEXT | Clean cutover | No aliases, deprecated paths, dual roots, or dependency additions | 1 | COVERED |
| CONTEXT | Scope boundary | Do not move checkout root or rewrite historical records | 3 | COVERED |
| CHANGE | Product copy | Browser, terminal, export, README, PRODUCT, active project instructions | 1, 3 | COVERED |
| CHANGE | npm/package/build | Package and lockfile, CLI/bin, build and packaged-artifact references | 1, 2 | COVERED |
| CHANGE | Persistence | `.cumpa` drafts/exports, schemas, exclusion, probe, optional ignore append | 1, 2 | COVERED |
| CHANGE | Machine identifiers | Symbols, environment variables, Monaco IDs, hash domains, export kind | 1, 2 | COVERED |
| CHANGE | Test contracts | Fixtures and assertions follow renamed observable and machine contracts | 2 | COVERED |
| ACCEPTANCE | Search driven | Scoped tracked searches reject old identifiers outside preserved history | 1, 2, 3 | COVERED |
| ACCEPTANCE | Verification boundary | Build/package/search only; no formatter, linter, Vitest, Playwright, or full suite | 1, 2, 3 | COVERED |
| RESEARCH | — | No research artifact requested or needed; existing conventions only | — | EXCLUDED |
</source_audit>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| Package metadata → generated executable | The published command and packaged bin must resolve to the same renamed artifact. |
| Repository root → managed persistence | Draft/export paths, receipts, ignore checks, and inventory exclusion must agree on one safe root. |
| Stored/exported data → shared schemas | The producer and validator must agree on the renamed discriminator and receipt paths. |
| Git/browser data → user-visible copy | Untrusted repository labels and paths remain under existing safe rendering while only fixed product prose changes. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-QUICK-260729-LGA-01 | Tampering | `.cumpa` persistence boundary | mitigate | Rename path authorities, schemas, exclusion, probe, append rule, and adversarial fixtures together; preserve existing atomic/symlink checks. |
| T-QUICK-260729-LGA-02 | Spoofing | package/CLI identity | mitigate | Require exact package, lockfile, bin, build output, and dry build/search agreement on `cumpa`. |
| T-QUICK-260729-LGA-03 | Information Disclosure | browser/terminal copy | mitigate | Change fixed product text only; retain existing control-safe labels, generic denial copy structure, and path redaction assertions. |
| T-QUICK-260729-LGA-04 | Tampering | legacy untracked persistence | accept | Clean cutover does not read, delete, move, or rewrite an existing untracked `.diff-review/` directory; private 0.0.0/unpublished metadata provides no released compatibility contract. |
| T-QUICK-260729-LGA-SC | Tampering | package supply chain | accept | No dependency versions or package graph change; lockfile edit is limited to root package identity/bin metadata. |
</threat_model>

<verification>
1. Synchronize lockfile root metadata, then run `npm run build`; do not run formatters, linters, Vitest, Playwright, or the project-wide suite.
2. Assert package and lockfile expose only `cumpa -> dist/bin/cumpa.mjs`, and the build leaves no old generated executable.
3. Run the scoped tracked searches from Tasks 1–3; old identifiers may remain only in intentionally excluded historical planning/debug/forensics artifacts and this quick plan/summary.
4. Run `git diff --check` only on the renamed tests and live documentation.
5. Confirm the checkout remains `/Users/alessandro/projects/diff-review`; no physical directory move is part of the change.
</verification>

<success_criteria>
- Active tracked product prose consistently says Cumpa.
- Package, CLI command, generated executable, lockfile, build scripts, and package evidence consistently use cumpa.
- Project-owned machine identifiers use cumpa/CUMPA naming without aliases or deprecated exports.
- Drafts, exports, receipts, ignore handling, and reviewed-inventory exclusion consistently use `.cumpa/`.
- Existing tests and fixtures are mechanically migrated to the renamed contract without being executed or weakened.
- README, PRODUCT, current project/roadmap identity, and loaded project instructions are current; historical records remain truthful.
- No dependencies are added and the physical checkout root is not moved.
</success_criteria>

<output>Create `.planning/quick/260729-lga-rename-the-entire-project-from-diff-revi/260729-lga-SUMMARY.md` after execution. This planning task creates only `.planning/quick/260729-lga-rename-the-entire-project-from-diff-revi/260729-lga-PLAN.md`.</output>
