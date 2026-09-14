---
phase: 09-changed-file-tree
audited: 2026-09-13
status: secured
asvs_level: 1
blocking_threshold: high
threats_total: 23
threats_closed: 23
threats_open: 0
unregistered_flags: 0
---

# Phase 09 Security Audit — Changed-File Tree

## Verdict

**SECURED.** All 23 distinct declared threat IDs resolve to `MITIGATED` or a documented `ACCEPTED` residual risk. No implementation gap blocks shipment. The repeated `T-09-SC` declaration is one phase-wide threat ID, verified against the complete phase range.

## Threat Verification

| Threat ID | Status | Category | Code evidence |
|---|---|---|---|
| T-09-01 | MITIGATED | Tampering | `src/web/model/file-tree.ts:204-213` normalizes strings then uses literal `String.prototype.includes`; it constructs no `RegExp`. |
| T-09-02 | ACCEPTED | Denial of service | `src/web/model/file-tree.ts:146-168` retains the declared recursive projection. `src/git/runner.ts:3-5` bounds Git stdout to 1 MiB. Residual risk is recorded below. |
| T-09-03 | MITIGATED | Tampering | `src/web/model/file-tree.ts:160-167` freezes a spread of the existing directory node, retaining its existing `directoryId`; leaves retain their opaque `fileId` (`:153-156`). |
| T-09-04 | ACCEPTED | Information disclosure | `src/web/model/file-tree.ts:206-213` filters the existing tree to a subset only; it creates no new path source or client read. Residual risk is recorded below. |
| T-09-05 | MITIGATED | Tampering | `scripts/css-token-contract.mjs:1-27` defines the exact canonical token set. `scripts/verify-semantic-css.mjs:75-107,192-206,404-420` rejects missing/extra/unused tokens and direct paint colors outside the root or forced-colors repair. |
| T-09-06 | MITIGATED | Spoofing | `src/web/components/FileRow.vue:46-49` binds file selection semantically; `src/web/styles.css:974-989` supplies boundary, selected background, and rail; `:2810-2865` supplies the forced-colors `Highlight`/`HighlightText` repair. |
| T-09-07 | ACCEPTED | Information disclosure | Full file identity remains a Vue-bound `aria-label` and `title` in `src/web/components/PathDisplay.vue:31-44`; visual truncation does not remove it from the accessible name. |
| T-09-08 | MITIGATED | Tampering | `src/web/styles.css:974-978,1198-1200` has the required `box-shadow: none` declarations. `scripts/verify-semantic-css.mjs:209-256` enforces the selected-row shadow allowlist and pressed-control rule. |
| T-09-09 | MITIGATED | Tampering | Repository paths pass through `controlSafeDisplay` in `src/domain/path-bytes.ts:22-43,55-61`, then only Vue text/attribute bindings in `src/web/components/PathDisplay.vue:31-44` and `ui/PathText.vue:16-18`. |
| T-09-10 | MITIGATED | Spoofing | `src/web/components/FileRow.vue:50-57` keeps each visible row keyed by opaque `fileId` while `PathDisplay.vue:35-43` preserves the full path/move identity in `aria-label` and `title`. |
| T-09-11 | MITIGATED | Tampering | `src/web/model/file-tree.ts:99-114,214-215` derives each count exclusively from the current `projectedTree`; `DirectoryRow.vue:31-35,59` renders that matching count and spoken label. |
| T-09-12 | ACCEPTED | Denial of service | The accepted recursive computation is now one traversal per projection (`src/web/model/file-tree.ts:99-114,214-215`) with constant-time row lookup (`DirectoryRow.vue:31-33`); residual recursion-depth risk is recorded below. |
| T-09-13 | MITIGATED | Tampering | `src/web/components/FileTree.vue:159-167` binds the query as an input value and passes it to the model. The full changed implementation contains no `v-html`, `innerHTML`, `outerHTML`, or HTML-insertion API. |
| T-09-14 | MITIGATED | Tampering | `src/web/components/FileTree.vue:34-37,82-85` selects the fixed `[role="treeitem"]` collection and compares `dataset` values; no repository-derived ID is interpolated into a selector. The underlying ID schema is restricted at `src/contracts/api.ts:23`. |
| T-09-15 | MITIGATED | Spoofing | `src/web/components/FileTree.vue:150-154` exposes exactly `Changed files ({{ files.length }})` to accessibility APIs and hides the alternate visual composition; both visible and accessible counts use the same `files.length`. |
| T-09-16 | MITIGATED | Repudiation | `src/web/components/FileTree.vue:71-74` only updates query/model state. `src/web/model/file-tree.ts:325-336` carries `selectedFileId` unchanged; `FileTree.vue:89-93` only clears, reveals, and refocuses. Activation remains explicit at `:57-64,111-120`. |
| T-09-17 | ACCEPTED | Denial of service | Filtering is intentionally immediate in `src/web/components/FileTree.vue:71-74`; each pass is literal string matching over the current tree (`src/web/model/file-tree.ts:204-213`). Residual long-query cost is recorded below. |
| T-09-18 | MITIGATED | Information disclosure | Full inspection of `src/web/components/FileTree.vue:1-145` confirms the retired `defineExpose` and four named imperative methods are absent; the component exposes no replacement public API. |
| T-09-19 | MITIGATED | Tampering | The query is never rendered as markup: its only DOM binding is the input value (`FileTree.vue:159-167`), and its only model use is literal comparison (`file-tree.ts:204-213`). |
| T-09-20 | MITIGATED | Tampering | Invalid UTF-8/control-byte paths are converted to safe display text at `src/domain/path-bytes.ts:22-61` and emitted by Vue interpolation/attribute binding only (`PathDisplay.vue:35-43`, `DirectoryRow.vue:58-59`). |
| T-09-21 | MITIGATED | Spoofing | `src/web/model/file-tree.ts:53-58,236-248` derives row identity and sole tab stop from opaque IDs, while `FileRow.vue:50-54` emits the opaque `fileId`, never the displayed basename. |
| T-09-22 | MITIGATED | Repudiation | Filter and clear paths are non-activating (`FileTree.vue:71-74,89-93,168-176,215-219`); activation is confined to explicit row click/Enter/Space paths (`:57-64,111-120`). |
| T-09-SC | MITIGATED | Tampering | `git diff a1544a5^..HEAD -- package.json package-lock.json` is empty. The phase source delta contains only the listed web model/components/styles; no dependency or installer metadata changed. |

## Focused Boundary Checks

### Query input

- **Markup injection:** no interpolation of `query` exists outside the search input's bound value; there is no HTML sink in any changed tree component or model.
- **Regex/glob metacharacters:** `(`, `[`, `+`, `*`, `?`, and glob syntax are plain literal characters under `includes` (`file-tree.ts:204-213`), so they neither compile nor throw.
- **Unicode:** JavaScript `trim()`/`toLowerCase()`/`includes()` accepts Unicode and malformed-surrogate strings without regex compilation. Matching is locale-independent simple lowercasing, not Unicode normalization: canonically equivalent spellings (for example composed versus decomposed accents) may produce a false negative, but cannot select another file, execute markup, or reach a file read.
- **Very long query:** there is no query-length ceiling. This is the declared accepted local responsiveness risk T-09-17, not a remote or persistence-backed denial-of-service path.

### Repository path rendering and ARIA truthfulness

- Path bytes are control-safe before display, then Vue emits them as text or attribute values; neither markup nor `title`/`aria-label` composition can create DOM nodes or attributes.
- `DirectoryRow.vue:25-27` computes `expanded` from the same set that `DirectoryRow.vue:62` uses to render child `role="group"` content. Thus `aria-expanded` is true exactly when child rows render, and false exactly when they do not.
- `FileRow.vue:48-49` derives `aria-selected` and `tabindex` from model state. `file-tree.ts:236-248` makes the sole visible selected row the tab stop, with no tab stop when filtering yields no rows.

### Client reachability and dependencies

The complete Phase 09 source delta is confined to `src/web/model/file-tree.ts`, tree/path Vue components, and `src/web/styles.css`. Static inspection found no `fetch`, filesystem API, subprocess, path-resolution, or new route in those files. Client interactions emit existing opaque IDs only. No path traversal or client-reachable file read was introduced, and package metadata is byte-unchanged over the phase range.

## Accepted Risks

| Threat ID | Accepted residual risk | Rationale and current containment |
|---|---|---|
| T-09-02 | Recursive projection can consume stack/CPU on pathological trees. | The phase deliberately accepts real-repository depth; Git output is byte-limited at `src/git/runner.ts:3-5`. |
| T-09-04 | Filtering exposes the same full paths already available in the tree. | Projection only removes rows (`src/web/model/file-tree.ts:206-213`); it introduces no new data source. |
| T-09-07 | Visual ellipsis can hide part of the path. | The full identity remains in the accessible name and native title (`PathDisplay.vue:35-43`). |
| T-09-12 | Recursive descendant accounting retains a depth-dependent cost. | It is one traversal per projection and uses `ReadonlyMap` lookups per rendered directory (`file-tree.ts:99-114,214-215`; `DirectoryRow.vue:31-33`). |
| T-09-17 | A reviewer can paste an arbitrarily long local filter query, with no debounce or length limit. | The query is local-only, is not sent to an endpoint, and cannot invoke regex evaluation, markup insertion, or file loading. |

## Unregistered Flags

None. `09-01` through `09-06` summaries contain no `## Threat Flags` section or unmatched threat flag.

## Scoped Verification

`npm run test:unit -- --grep "createFileTreeModel"` passed: 1 test file, 17 tests; 28 files and 166 tests skipped by the focused filter. This exercises the model's filter projection, selection preservation, expansion state, opaque-ID replacement, and tab-stop contracts. No project-wide suite was run.
