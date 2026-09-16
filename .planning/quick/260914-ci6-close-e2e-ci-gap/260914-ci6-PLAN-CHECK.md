# Plan check — 260914-ci6 "Close the e2e CI gap"

**Verdict: NO-GO as written.**

Tasks 1 and 2 are correct and were verified by direct measurement. **Task 3 is
wrong**: as specified it turns the repository gate red on the very commit that
widens it, because the workflow's Playwright command line is a contract asserted
by `scripts/verify-supabase-support.mjs` and by `tests/e2e/support-payment.spec.ts`
— neither of which appears in the plan's `files_modified`. Two further specs
entering CI for the first time depend on a browser-opener interception that only
works on macOS.

Re-plan Task 3 and the two opener-bound specs, then this is a GO.

---

## Measured facts (all observed 2026-09-14 on this checkout, sequential `--list`)

| Measurement | Command | Result |
|---|---|---|
| Main config today | `npx playwright test --list` | **97 tests in 19 files** |
| Custody config today | `npx playwright test --config playwright.runtime-artifact.config.ts --list` | **14 tests in 4 files** |
| Overlap today | set intersection of the two file lists | `marketplace-review.spec.ts`, `public-support-states.spec.ts` |
| Per-spec | grep of the main list | marketplace-review **4**, public-support-states **3** |
| e2e / integration split inside the 97 | grep of the main list | **46 / 51** |
| Spec files under `tests/` | `find tests -name '*.spec.ts'` | **21** (13 e2e, 8 integration) |
| **Post-change main config** | temp config at repo root importing the custody list, `--list` | **90 tests in 17 files** |
| Post-change partition | union / intersection vs the 21 repo specs | **17 + 4 = 21, disjoint, no orphan (`diff` exact)** |
| Siblings preserved | grep of post-change list | `agent-ready-export-states.spec.ts` **4**, `agent-ready-export-safety.spec.ts` **2** |
| `npm run build` | `/usr/bin/time -p` | **3.70 s real** |
| `npm pack` | `/usr/bin/time -p` | **0.74 s real** |

Every number the planner recorded reproduces exactly, including the corrected
`90 tests in 17 files`. The planner's arithmetic correction to the brief is right.

The temp config used for the post-change measurement was created at the repo root
and deleted in the same shell invocation; `git status --porcelain` afterwards shows
only the pre-existing untracked operator files. No tracked file was modified.

---

## Blocking findings

### B1 — Task 3 breaks the workflow contract verifier and its spec (blocking)

`scripts/verify-supabase-support.mjs` hard-codes the exact gate command in three
enforcement sites:

- `scripts/verify-supabase-support.mjs:1733` — `required` substring list
- `scripts/verify-supabase-support.mjs:1738` — repository `- run:` command set
- `scripts/verify-supabase-support.mjs:1747` — `repository-gates` job command set

all containing the literal
`npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-restore.spec.ts`.

Measured, against a copy of the workflow with Task 3's edit applied:

```
$ node scripts/verify-supabase-support.mjs --verify-workflow .github/workflows/deploy-supabase-production.yml
exit=0

$ node scripts/verify-supabase-support.mjs --verify-workflow /tmp/after.yml     # line 30 -> "npx playwright test"
supabase support verifier rejected: workflow is missing required npx playwright test tests/e2e/support-payment.spec.ts tests/e2e/support-restore.spec.ts
exit=1
```

`tests/e2e/support-payment.spec.ts:233-238` feeds the **real** workflow file
through that verifier once per mutation case and asserts a *specific* stderr
substring (`reject()` at `:13-16` uses `expect.stringContaining(message)`). The
`required` loop at `scripts/verify-supabase-support.mjs:1736` fails before the
project-ref, retired-input, domain and ordering checks are ever reached, so those
cases receive the wrong message. Measured:

```
case 'project ref'   expected: "workflow does not map the protected project ref"
                     actual:   "workflow is missing required npx playwright test tests/e2e/..."
case 'reordered'     expected: "workflow database gates are out of order"
                     actual:   "workflow is missing required npx playwright test tests/e2e/..."
```

Also stale after the change: the case table entry at
`tests/e2e/support-payment.spec.ts:224`, and the recorded gate command at
`scripts/verify-supabase-support.mjs:582` (`localPackageSecurityReview` evidence).

`tests/e2e/support-payment.spec.ts` runs in CI **today** and is one of the 90 after
the change, so this fails the gate on both the old and new command lines.

**Consequence for the plan:** Task 3 is not a one-file change and is not
independently committable. `files_modified` must gain
`scripts/verify-supabase-support.mjs` and `tests/e2e/support-payment.spec.ts`, and
the three-or-four edits must land in one commit. Task 3's stated verification
("workflow's only Playwright step is `npx playwright test`; nothing else in the
file changes") would pass while the repository is broken.

The production deploy job is **not** directly affected: `verifyWorkflow` is reached
only through `--verify-workflow` (`scripts/verify-supabase-support.mjs:1690`), and
`deploy-supabase-production.yml:64` invokes `--run-deployment`. The damage is
confined to the gate — which is the whole point of the task.

### B2 — `anchored-review.spec.ts` cannot resolve its URL on Linux (blocking, 2 tests)

`tests/e2e/anchored-review.spec.ts:78` only returns the loopback URL once
`fakeOpenerInterceptedUrl()` (`:56-58`) confirms the fake opener wrote its marker.
The fake opener is intercepted purely by `PATH` injection of a binary named `open`
(`:106-107`, `:206-208`).

`node_modules/open/index.js` (open@11.0.0) dispatches:

- `:151-152` — `if (platform === 'darwin') { command = 'open' }` → PATH lookup, fake wins
- `:227` — otherwise `command = useSystemXdgOpen ? 'xdg-open' : localXdgOpenPath`, where
  `localXdgOpenPath = path.join(__dirname, 'xdg-open')` (`:23`) — an absolute path into
  `node_modules/open/`, **never** a PATH lookup

On `ubuntu-latest` the injected `open` is never executed, the marker file is never
written, and `waitForLoopbackUrl` exhausts its 10 s deadline and throws
`[behavioral] timed out waiting for CLI output`. Both tests in the file call it.

Note the spec sets no `BROWSER`; the custody spec `agent-ready-export.spec.ts:134`
does (`BROWSER: join(fakeBinRoot, 'open')`), which is what the bundled `xdg-open`
honours. That asymmetry is the tell.

### B3 — `pinned-session.spec.ts` opener-evidence assertions fail on Linux (blocking, 2 of 11 tests)

Same root cause as B2. `tests/e2e/pinned-session.spec.ts:417-420` and `:469` call
`waitForText(running.openerLogPath, content => content.length > 0)` and then assert
the recorded argv and captured terminal text (`:425-429`). On Linux the log is never
created; `waitForText` rejects after 10 s.

### B4 — The plan widens CI to a suite it has not proven green (blocking)

The plan's own baseline records `npx playwright test` → **"92 passed, 3 failed, 2 did
not run"**, then diagnoses exactly one failure (`file-tree.spec.ts:331`) and declares
it "the one real failure". No task identifies the other two failures or the two
tests that did not run. Task 3 promotes that unexplained state into the gate that
guards production deploys.

B2 and B3 predict four Linux-only failures on top of whatever those are. Task 3 must
not land until the full local run is green and the remaining two failures are named.

---

## Advisory findings

### A1 — The plan's causal story is right, but names the wrong trigger

Reproduced the failure directly:

```
$ npx playwright test tests/e2e/file-tree.spec.ts
  Expected: "0"   Received: "-1"
  locator resolved to <div tabindex="-1" aria-level="2" role="treeitem" aria-selected="true" ...>
  at tests/e2e/file-tree.spec.ts:331
```

The plan attributes the mismatch to "the app restores a selection that is not the
tree's first leaf". The concrete mechanism is narrower and worth recording, because
it answers the obvious objection *"selection and focus are both seeded from the first
visible leaf — why does this fail at all?"*:

- `src/web/model/file-tree.ts` `createFileTreeModel` seeds focus from
  `initialRows.find(row => row.kind === 'file')` — the first visible leaf, **with no
  availability filter**. In this fixture that is `binary.dat` (added, NUL byte →
  `unsupported`, `tests/e2e/file-tree.spec.ts:144`), an `aria-level="1"` root file.
- `src/web/App.vue:390-391` auto-selects `reviewable[0]`, where `reviewable` is
  `session.files.filter(file => file.availability.kind === 'text')` (`:388`) —
  `binary.dat` is excluded, so App picks a *different, nested* file.
- `src/web/components/FileTree.vue:137-146` then calls `selectFile(thatId)` on the
  immediate watch, which today preserves the stale `focusedRowId`.

The received element's `aria-level="2"` confirms the selected row is nested while
focus sits on the level-1 root leaf. The two seeds are **structurally guaranteed to
diverge** whenever the tree's first leaf is not reviewable — not merely "whenever the
app restores a selection". The planned fix is correct for this path: every directory
is expanded at construction, so the selected row is present in `frozenVisibleRows`,
the visibility guard passes, and the tabindex moves. The identity short-circuit does
not bite here, because the two ids differ.

No change required — the fix is right. Recording it so the executor does not
"discover" a contradiction mid-task and re-diagnose.

### A2 — The visibility guard has no hole (advisory, cleared)

Traced `toggleDirectory` and `handleKey` in `src/web/model/file-tree.ts` as asked:

- `toggleDirectory` always sets `focusedRowId` to `directoryRowId(directoryId)` — the
  row being toggled, which is by definition visible. Collapsing never orphans focus.
- `handleKey`'s inert branch (`focusedIndex < 0` → return `model` unchanged) is
  unreachable through the guarded `selectFile`, which is precisely what the guard buys.
- `focusedRowId` is `null` only for a tree with no leaves; `App.vue:1184` renders
  `FileTree` behind `v-if="session.files.length > 0"`, and any non-empty file list
  produces at least one leaf. There is no reachable state with nothing tabbable.
- Selected-but-hidden is not permanently unreachable: focus stays on a visible row,
  arrow keys still work, and expanding the ancestor re-reveals the selected row.

One genuine UX gap, out of this plan's scope: a comment jump (`App.vue:275` path) to a
file inside a directory the user collapsed will select a row the tree does not reveal.
That is a missing "expand ancestors" behaviour, not an a11y violation, and the plan
should not grow to cover it.

### A3 — Neither Playwright config is typechecked by anything (advisory)

`tsconfig.json`, `tsconfig.test.json` and `tsconfig.web.test.json` include only
`src/**` and `tests/**` subsets; no project includes `playwright.config.ts` or
`playwright.runtime-artifact.config.ts`. Task 4's three typecheck rows therefore give
**zero** coverage of Task 2's new cross-config import. `--list` is the only real gate
for Task 2 — which the plan does specify, so this is a caveat on the evidence table,
not a missing check.

(The plan's claim that `tests/unit/file-tree.test.ts` is covered via
`typecheck:tests:web` is correct: `tsconfig.web.test.json` includes it explicitly.)

### A4 — The import works, both specifier forms (advisory, cleared)

Empirically verified, not reasoned. A temp config at the repo root importing the
custody config and using its `testMatch` as `testIgnore`:

```
./playwright.runtime-artifact.config.ts  ->  Total: 90 tests in 17 files   exit=0
./playwright.runtime-artifact.config.js  ->  Total: 90 tests in 17 files   exit=0
```

Playwright's loader resolves both. Evaluating the second config's `defineConfig`
default export is inert — `outputDir: node_modules/.cache/cumpa-runtime-playwright`
belongs to a separate config object and does not bleed into the main run; no output
directory was created and no config warning appeared.

### A5 — `testIgnore` entries cannot swallow siblings (advisory, cleared)

`playwright.runtime-artifact.config.ts:6-11` holds four exact filenames prefixed
`**/e2e/`, with no wildcards inside the basenames. Measured in the post-change list:
`agent-ready-export-states.spec.ts` contributes **4** tests and
`agent-ready-export-safety.spec.ts` contributes **2**. Both remain in the main run.

### A6 — Task 2 does not change the publish candidate (advisory, cleared)

`tests/package/agent-ready-export.test.ts:182` invokes the custody config with
**explicit positional spec paths**, and `tests/package/public-artifact-acceptance.test.ts:15`
uses the same config. Task 2 moves the array into a named const without changing its
contents, so the custody config's effective `testMatch` is byte-equivalent and the
publish job's selection is untouched. Custody `--list` remains 14 tests in 4 files.

Caveat: if the executor writes `export const custodyGatedSpecs = [...] as const`, the
resulting `readonly string[]` would not satisfy Playwright's `testIgnore` type — but
per A3 nothing typechecks these files, so it would pass silently. Prefer a plain
`string[]`.

### A7 — `pinned-session.spec.ts:535` will pass on Linux for the wrong reason (advisory)

`expect(existsSync(result.openerLogPath)).toBe(false)` asserts the opener was *not*
invoked for a non-interactive request. On Linux the log is never created for any
invocation (B2/B3), so this assertion becomes vacuous. Not a failure — a silent loss
of coverage worth knowing about when B3 is fixed.

### A8 — `beforeAll` budget is the thinnest margin in the newly-included set (advisory)

`tests/e2e/file-tree.spec.ts:261-262`, `tests/e2e/pinned-session.spec.ts:348-349` and
`tests/e2e/responsive-session.spec.ts:725-726` each run `npm run build` + `npm pack` +
`tar -xzf` + a `node_modules` symlink inside `beforeAll`, under the **default 30 s**
hook timeout — these three files set no `test.setTimeout`. By contrast
`tests/e2e/anchored-review.spec.ts:32` and `tests/e2e/complete-review-draft.spec.ts:35`
declare `test.setTimeout(90_000)`.

Measured on this host: build **3.70 s**, pack **0.74 s**. Roughly 6× headroom, so
`ubuntu-latest` should fit — but this is the assumption most likely to produce a
first-run surprise, and it is the only one that degrades into a flake rather than a
clean failure.

Related, cleared: `scripts/pack-runtime.mjs` (used by `anchored-review` and
`complete-review-draft` `beforeAll`) has **no** platform gate; `--purpose
development-check` makes the support origin optional (`:107-109`) and tolerates a
dirty tracked source (`:413`), and a missing native binary returns `binary: null`
rather than failing (`:248`). It is CI-safe.

### A9 — Font and geometry sensitivity: watch list, no predicted failure (advisory)

Checked every metric assertion in the newly-included specs against Linux font
fallback:

- `tests/e2e/responsive-session.spec.ts:967-979` asserts computed `font-family`
  **strings** (`-apple-system, "system-ui", "Segoe UI", sans-serif`). Chromium returns
  the declared list, not the resolved face — platform-independent. Safe.
- `tests/e2e/responsive-session.spec.ts:554` — `selectedBox.height <= 48`. An *upper*
  bound with a fixed 20 px line-height; padding-driven, but the only assertion in the
  suite that a taller fallback face could break.
- `tests/integration/monaco-anchor.spec.ts:79-82` — paired view-zone alignment within
  1 px. Monaco's `ui-monospace, SFMono-Regular, Menlo, Consolas` all miss on Linux, but
  both zones share the resolved metrics, so the *difference* should hold.
- `tests/e2e/file-tree.spec.ts:338-339` (≥40 px), `tests/e2e/pinned-session.spec.ts:606-608`
  (≥44 px), `tests/e2e/agent-ready-export-safety.spec.ts:265,268` (≥44 px) — lower
  bounds on touch targets; fallback faces shift these upward, not downward. Safe.

### A10 — Cleared host assumptions

- **git identity**: `tests/helpers/git-fixture.ts:82-83,275-276` sets local
  `user.name`/`user.email` and `commit.gpgSign=false`. No CI identity failure.
- **Opener failure is non-fatal**: `src/cli/run.ts:305-312` prints the URL *before*
  opening and wraps `openBrowser` in `try/catch`. Specs that only read the URL from
  stdout survive a failing `xdg-open` — which is why B2/B3 are limited to the two
  specs that assert opener *evidence*.
- **`assertChromiumPrerequisite`** (`tests/e2e/file-tree.spec.ts`) checks only the
  project/browser name is `chromium`. Platform-agnostic.
- **Invalid-UTF-8 fixture paths** (`tests/e2e/file-tree.spec.ts:150-158`) are written
  through `git update-index --index-info`, never the filesystem. Portable.
- **The 51 integration tests are the lowest-risk group**: they start an in-process Vite
  dev server (`tests/integration/monaco-anchor.spec.ts:37-38`,
  `tests/e2e/agent-ready-export-safety.spec.ts:100-101`) with no packaging, no
  subprocess CLI and no opener. Nothing platform-specific found.
- **No hosted support origin** is required by any main-run spec;
  `CUMPA_RELEASE_SUPPORT_SERVICE_URL` appears only on custody and publish paths.
- **No `pbcopy`, no absolute macOS paths, no `process.platform === 'darwin'` branches**
  in any of the 17 main-run specs. `process.arch`/`darwin` checks live only in
  `agent-ready-export.spec.ts:45,449` and `package-assets.spec.ts:97,114` — both
  custody specs, both correctly excluded.

---

## Task-by-task

| Task | Independently committable | Verdict |
|---|---|---|
| 1 — roving tabindex follows selection | Yes | **Sound.** Fix is at the root (`selectFile`), covers all four callers, guard is correct (A2), failure reproduced (A1). Both planned unit assertions test observable model state. |
| 2 — one owner for the custody spec list | Yes | **Sound.** Import resolves (A4), partition exact and measured, siblings preserved (A5), publish candidate untouched (A6). |
| 3 — widen the CI gate | **No** | **Must be redesigned.** B1: also requires `scripts/verify-supabase-support.mjs` (`:582`, `:1733`, `:1738`, `:1747`) and `tests/e2e/support-payment.spec.ts:224`, in the same commit. B2/B3/B4 must be resolved before it lands. |

## Required before execution

1. **Rewrite Task 3** as a single atomic commit across four files: the workflow, the
   three enforcement sites plus the evidence list in
   `scripts/verify-supabase-support.mjs`, and the case table in
   `tests/e2e/support-payment.spec.ts:224`. Update `files_modified`. Add a verification
   step: `node scripts/verify-supabase-support.mjs --verify-workflow .github/workflows/deploy-supabase-production.yml`
   must exit 0 after the edit.
2. **Add a task for the darwin-only opener interception** covering
   `tests/e2e/anchored-review.spec.ts:56-58,78` and
   `tests/e2e/pinned-session.spec.ts:417-420,469`. The bundled `xdg-open` honours
   `$BROWSER`, so setting `BROWSER` alongside the existing `PATH` injection is the
   smallest fix that makes interception work on both platforms; `agent-ready-export.spec.ts:134`
   is the in-repo precedent.
3. **Diagnose the remaining two local failures and two not-run tests** recorded in the
   plan's own baseline. Task 3 must not land against an unexplained red suite.
4. Leave Tasks 1 and 2 exactly as written.
