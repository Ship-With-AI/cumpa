# Phase 12: Behavior Continuity - Pattern Map

**Mapped:** 2026-09-14
**Files analyzed:** 6 (2 spec files, 1 runner-reachability surface, 2 planning artifacts, 1 throwaway capture script)
**Analogs found:** 6 / 6 (all exact or role-match; zero "no analog")
**Production source files changed:** 0 — confirmed by reading every analog below

> Phase 12 writes **no** `src/` code. Every artifact it touches is a test, a runner config, a planning document, or a throwaway script. The analogs below are therefore all test-harness and evidence-document analogs.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tests/e2e/agent-ready-export.spec.ts` (modify) | test (packaged e2e) | request-response + file-I/O | `tests/e2e/complete-review-draft.spec.ts` | **exact** (same harness, same dialog, helper already written) |
| `package.json` `scripts` (modify — W2 reachability) | config | batch | `package.json:45` `accept:runtime-artifact` + `tests/package/agent-ready-export.test.ts:178` | **role-match** (same runner, same config file, currently invoked only from Vitest) |
| `tests/e2e/responsive-session.spec.ts` (modify — CON-03 Tab order) | test (packaged e2e) | event-driven (keyboard) | `tests/e2e/responsive-session.spec.ts:1089-1104` (own `keyboard-only 320px journey` step) | **exact** (self-analog: same file, same step idiom) |
| `.planning/phases/12-behavior-continuity/12-UI-REVIEW.md` (create) | doc (evidence dossier) | transform | `.planning/phases/11-workspace-shell-review-surfaces/11-UI-REVIEW.md:1-107` | **exact** |
| `.planning/phases/12-behavior-continuity/12-VERIFICATION.md` (create) | doc (command ledger) | transform | `.planning/phases/11-workspace-shell-review-surfaces/11-VERIFICATION.md:95-99` + `08-VERIFICATION.md:62-70` | **exact** |
| throwaway capture script (create, delete in cleanup) | utility (one-off) | file-I/O | `11-UI-REVIEW.md:21-34` measurement shape + `agent-ready-export.spec.ts:104-160` packaged-CLI launch idiom | **role-match** (no capture script exists in `scripts/`) |

---

## Pattern Assignments

### 1. `tests/e2e/agent-ready-export.spec.ts` (test, request-response + file-I/O) — W1

**Analog:** `tests/e2e/complete-review-draft.spec.ts` — same packaged harness, already re-pointed at the Review notes dialog during Phase 11.

#### Pattern to copy verbatim: `openReviewNotes` helper

`tests/e2e/complete-review-draft.spec.ts:152-157` — **copy this, do not invent a second convention**:

```ts
async function openReviewNotes(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: 'Review notes', exact: true });
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.getByRole('dialog', { name: 'Review notes' })).toBeVisible();
}
```

Three further copies of the same shape already exist, confirming it is the settled convention (do **not** add a fourth variant):

- `tests/integration/anchored-workspace.spec.ts:1066-1071`
- `tests/e2e/selector-drift-ui.spec.ts:346-349`
- `tests/e2e/export-receipt-ui.spec.ts:184-185`

#### What the existing helper does — and why it is now insufficient

`tests/e2e/agent-ready-export.spec.ts:245-249` (**not** `:269-271`; see Contradictions):

```ts
async function ensureReviewOpen(page: Page): Promise<void> {
  const review = page.getByRole('button', { name: 'Review', exact: true });
  if (await review.getAttribute('aria-expanded') === 'false') await review.click();
  await expect(review).toHaveAttribute('aria-expanded', 'true');
}
```

`Review` is the **comments rail** disclosure — `ReviewToolbar.vue:81-90` (`aria-controls="review-panel"` at `:84`, `:aria-expanded="reviewExpanded"` at `:85`). Phase 11 split summary/export/Finish away from that rail into a separate modal. `ensureReviewOpen` must be **kept** (the comment-history assertions at `:412-413` still need the rail) and `openReviewNotes` **added alongside** it.

Note the sibling helper `complete-review-draft.spec.ts:141-150` keeps both helpers side by side — an exact precedent for two coexisting disclosure helpers in one spec.

#### Relocation target — where the controls now live

`src/web/components/ReviewNotesDialog.vue`:

```vue
  <ModalDialog
    :open="open"
    title="Review notes"                      <!-- :111 -->
    close-aria-label="Close review notes"     <!-- :112 -->
    @close="emit('close')"
  >
```

```vue
    <section v-if="attached" class="attached-completion" aria-labelledby="finish-attached-review-heading">  <!-- :189 -->
      <header class="attached-completion__heading">
        <h3 id="finish-attached-review-heading">Finish attached review</h3>                                  <!-- :191 -->
```

```vue
        <button ref="completionAction" type="button" class="ui-button ui-button--primary attached-completion__action" :disabled="attachedReady !== true" @click="finishAttachedReview">Finish review</button>  <!-- :324 -->
```

**Locator shapes that survive unchanged** (only the enclosing dialog must be opened first):

- `getByRole('region', { name: 'Finish attached review' })` — `<section aria-labelledby>` is still exposed as `region`. Spec line `:549` needs **no rewrite**.
- `getByRole('button', { name: 'Finish review', exact: true })`, `'Write summary'`, `'Save summary'`, `'Export review'`, `'Export review again'` — all unchanged names.

**Why the closed dialog yields zero matches** — `src/web/components/ui/ModalDialog.vue:5-17`:

```ts
const props = withDefaults(defineProps<{
  readonly open: boolean;
  …
  readonly keepMounted?: boolean;
  …
}>(), {
  closeLabel: 'Close',
  keepMounted: false,      // ← ReviewNotesDialog does not opt in; closed ⇒ not in the DOM
  restoreFocus: true,
});
```

#### Complete call-site ledger (verified by grep, superset of RESEARCH's list)

| Test | Line needing `openReviewNotes(page)` inserted before it | Current code at that line |
|---|---|---|
| `:380` resume after relaunch | `:274` (inside `saveSummary`) | `await page.getByRole('button', { name: 'Write summary' }).click();` |
| `:380` | `:416` | `await resumedPage.getByRole('button', { name: 'Export review', exact: true }).click();` |
| `:380` | `:443` | `await resumedPage.getByRole('button', { name: 'Export review again', exact: true }).click();` |
| `:524` unsaved composer | `:549` | `const completion = page.getByRole('region', { name: 'Finish attached review' });` |
| `:581` attached range | `:594`, `:597` | `await expect(page.getByRole('button', { name: 'Finish review', exact: true })).toBeVisible();` / `.click()` |
| `:628` equivalent ranges | `:274` ×2 (via `saveSummary` at `:643`, `:644`), `:654`, `:661` | `Finish review` clicks on `page` and `secondPage` |
| `:690` exact-patch V3 | `:716` | `await page.getByRole('button', { name: 'Finish review', exact: true }).click();` |
| `:780` configured support | `:819` | `await page.getByRole('button', { name: 'Finish review', exact: true }).click();` |

`saveSummary` (`:273-279`) is the single cheapest insertion point for four of these — put `await openReviewNotes(page)` as its first statement, mirroring how `complete-review-draft.spec.ts` scopes summary work to the dialog.

#### Cascading assertion that clears itself

`tests/e2e/agent-ready-export.spec.ts:71-80` — the `afterAll` evidence gate fails while any scenario is missing; it needs no edit:

```ts
function sourceControlEvidence(): Readonly<{
  readonly unchanged: true;
  readonly scenarios: readonly Readonly<{ readonly name: string; readonly unchanged: true }>[];
}> {
  expect([...sourceControlAssertions].sort()).toEqual([...requiredScenarios].sort());
```

#### Support-scenario gating (why `:780` also needs a packed origin, not a spec edit)

`tests/e2e/agent-ready-export.spec.ts:782` and `:297-301`:

```ts
  test.skip(acceptance.source !== 'local-archive', 'support-unavailable is local-archive-only evidence');
```

```ts
test.beforeAll(() => {
  acceptance = resolveAcceptanceRuntime();
  requiredScenarios = acceptance.source === 'local-archive'
    ? [...sourceIndependentScenarios, 'support']
    : sourceIndependentScenarios;
```

Gated in the UI by `src/web/App.vue:162` and `src/web/components/IdentityHeader.vue:117-118,126`:

```ts
const supportEnabled = computed(() => session.value?.support?.enabled === true);
```

```vue
      <button
        v-if="supportEnabled"
        …
        Support Cumpa
      </button>
```

Format-only validation of the origin — `scripts/pack-runtime.mjs:231-248`:

```js
function supportConfiguration(value, purpose) {
  if (value === undefined) {
    if (purpose !== 'development-check') fail('configured support origin is required for this purpose');
    return { configured: false };
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    fail('support origin must be canonical');
  }
  const ref = url.hostname.slice(0, -'.supabase.co'.length);
  if (
    value !== `https://${ref}.supabase.co`
    || url.protocol !== 'https:'
    || !/^[a-z0-9]{20}$/u.test(ref)
  ) fail('support origin must be canonical');
  return { configured: true, originSha256: sha256(value) };
}
```

No outbound dial anywhere in that function — a syntactically valid synthetic origin is sufficient and is exactly the "configured but unreachable" state the test asserts.

---

### 2. Runner reachability (config, batch) — W2

**Analogs: the two configs that decide where the spec runs.**

`playwright.config.ts:1-14` — the exclusion mechanism (a spec is routed *away* from `npm run test:browser` / `npm run test:package` by `testIgnore`):

```ts
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  testIgnore: [
    '**/e2e/package-assets.spec.ts',
    '**/e2e/agent-ready-export.spec.ts',
  ],
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'line',
  timeout: 30_000,
```

`playwright.runtime-artifact.config.ts:3-13` — the alternative runner (a spec is routed *to* it by explicit `testMatch`):

```ts
export default defineConfig({
  testDir: './tests',
  outputDir: 'node_modules/.cache/cumpa-runtime-playwright',
  testMatch: [
    '**/e2e/package-assets.spec.ts',
    '**/e2e/agent-ready-export.spec.ts',
    '**/e2e/public-support-states.spec.ts',
    '**/e2e/marketplace-review.spec.ts',
  ],
```

**Today the only caller of that config is a Vitest driver behind an operator secret** — `tests/package/agent-ready-export.test.ts:134-136` and `:174-178`:

```ts
test('accepts one supplied candidate through isolated installed browser and Finish workflows', { timeout: 600_000 }, async () => {
  const origin = process.env.CUMPA_RELEASE_SUPPORT_SERVICE_URL;
  if (!origin) throw new Error('CUMPA_RELEASE_SUPPORT_SERVICE_URL is required for candidate acceptance');
```

```ts
  for (const key of ['CUMPA_RUNTIME_CUSTODY_DIR', 'CUMPA_RUNTIME_ARCHIVE_BASENAME', 'CUMPA_RUNTIME_ARCHIVE_SHA256', 'CUMPA_RUNTIME_EVIDENCE']) childEnvironment[key] = process.env[key]!;
  …
  runChild(process.execPath, [join(projectRoot, 'node_modules/@playwright/test/cli.js'), 'test', '--config', 'playwright.runtime-artifact.config.ts', 'tests/e2e/package-assets.spec.ts', 'tests/e2e/agent-ready-export.spec.ts'], childEnvironment, origin);
```

**Script-naming analog** — `package.json:39-48` already distinguishes default-config suites from artifact-config suites; a W2 addition follows the `accept:` / `test:` prefix convention already there:

```json
"test:package": "playwright test",                                                                    // :40
"test:browser": "npm run build:web && playwright test",                                               // :41
"pack:runtime-artifact": "node scripts/pack-runtime.mjs",                                             // :43
"accept:runtime-artifact": "vitest run --config vitest.runtime-artifact.config.ts --no-file-parallelism", // :45
```

(Non-contiguous lines, shown together for comparison.)

---

### 3. Custody-input contract (utility, file-I/O) — prerequisite for W1/W2

**Analog:** `tests/helpers/runtime-artifact.ts:259-287` — the four required inputs and the cross-checks that make hand-written evidence impossible:

```ts
export function readRuntimeArtifact(environment: NodeJS.ProcessEnv = process.env): RuntimeArtifact {
  scenarioBridge(environment);
  const profile = runtimeProfile(environment);
  const custody = requiredEnvironment(environment, 'CUMPA_RUNTIME_CUSTODY_DIR');
  const archiveBasename = requiredEnvironment(environment, 'CUMPA_RUNTIME_ARCHIVE_BASENAME');
  const expectedSha256 = requiredDigest(requiredEnvironment(environment, 'CUMPA_RUNTIME_ARCHIVE_SHA256'), 'CUMPA_RUNTIME_ARCHIVE_SHA256', sha256Pattern);
  const evidence = producerEvidence(requiredEnvironment(environment, 'CUMPA_RUNTIME_EVIDENCE'), profile);
  const archivePath = safeArchivePath(custody, archiveBasename);
  const archive = readIdentity(archivePath, archiveBasename);
  if (archive.sha256 !== expectedSha256) fail('archive SHA-256 does not match CUMPA_RUNTIME_ARCHIVE_SHA256');
  const evidenceArchive: RuntimeArchiveIdentity = {
    basename: evidence.archive.basename,
    byteLength: evidence.archive.byteLength,
    sha256: requiredDigest(evidence.archive.sha256, 'producer evidence archive SHA-256', sha256Pattern),
    npmShasumSha1: requiredDigest(evidence.archive.npmShasumSha1, 'producer evidence archive SHA-1', sha1Pattern),
    npmIntegritySha512: requiredDigest(evidence.archive.npmIntegritySha512, 'producer evidence archive SHA-512 integrity', sha512Pattern),
  };
  sameIdentity(archive, evidenceArchive, 'producer evidence archive identity');
```

**Producer-side argument contract** — `scripts/pack-runtime.mjs:204-219`:

```js
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!['--purpose', '--custody-dir', '--evidence'].includes(name) || !value || options.has(name)) {
      fail('invalid runtime producer options');
    }
    options.set(name, value);
  }
  const purpose = options.get('--purpose');
  if (!purposes.has(purpose)) fail('invalid runtime producer purpose');
  const custodyDirectory = safeAbsoluteDirectory(options.get('--custody-dir'), 'custody directory');
  const evidencePath = safeAbsoluteDirectory(options.get('--evidence'), 'evidence path');
  if (lstatExists(custodyDirectory) || lstatExists(evidencePath)) fail('custody and evidence destinations must not already exist');
```

`--custody-dir` and `--evidence` are **mandatory**, and both destinations must not pre-exist. The symlink rejection lives in `safeAbsoluteDirectory` at `scripts/pack-runtime.mjs:187-190` (RESEARCH cites `:213-215`, which is the *call site*, not the check):

```js
function safeAbsoluteDirectory(path, label) {
  if (!isAbsolute(path)) fail(`${label} must be an absolute path`);
  const parent = dirname(path);
  let parentStat;
```

`development-check` is also the only purpose that tolerates a dirty tree — `scripts/pack-runtime.mjs:537`:

```js
  if (!sourceBefore.clean && options.purpose !== 'development-check') fail('clean tracked source is required for this purpose');
```

Secret redaction the plan must not defeat — `scripts/pack-runtime.mjs:654-656`:

```js
  const origin = process.env.CUMPA_RELEASE_SUPPORT_SERVICE_URL;
  const detail = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`runtime producer failed: ${origin ? detail.replaceAll(origin, '[redacted]') : detail}\n`);
```

---

### 4. `tests/e2e/responsive-session.spec.ts` (test, event-driven) — CON-03 Tab traversal

**Analog: the file's own existing step idiom.** `tests/e2e/responsive-session.spec.ts:1089-1104` is the closest shape for a named-destination traversal — a `for (const [name, destination] of [...] as const)` table plus focus + activation assertions:

```ts
    await test.step('keyboard-only 320px journey keeps existing destinations and discard flow reachable', async () => {
      await page.setViewportSize({ width: 320, height: 640 });

      for (const [name, destination] of [
        ['Skip to diff', 'cumpa-heading'],
        ['Skip review', 'review-heading'],
      ] as const) {
        const skipLink = page.getByRole('link', { name, exact: true });
        await skipLink.focus();
        await expectFocusIndicatorUnclipped(skipLink);
        await page.keyboard.press('Enter');
        await expect.poll(() => new URL(page.url()).hash).toBe(`#${destination}`);
      }
```

**Tab-hop assertion style** — `tests/e2e/responsive-session.spec.ts:1584-1587` (dialog wrap) and `:1342-1344` (single hop):

```ts
    const lastControl = dialog.locator('button:not(:disabled)').last();
    await lastControl.focus();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
```

```ts
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await expect(reviewButton).toBeFocused();
```

Further one-hop precedents: `tests/e2e/pinned-session.spec.ts:615-617`, `tests/integration/draft-recovery-ui.spec.ts:335-337`, `tests/integration/anchored-workspace.spec.ts:1075-1077`.

**The six control names to traverse** — copy the locator block from `tests/integration/anchored-workspace.spec.ts:549-567`:

```ts
    const previousFile = page.getByRole('button', { name: 'Previous file', exact: true });
    const nextFile = page.getByRole('button', { name: 'Next file', exact: true });
    const previousChange = page.getByRole('button', { name: 'Previous change', exact: true });
    const nextChange = page.getByRole('button', { name: 'Next change', exact: true });
    const review = page.getByRole('button', { name: 'Review', exact: true });
    const keyboardHelp = page.getByRole('button', { name: 'Keyboard help', exact: true });

    await expect(previousFile).toBeDisabled();
    await expect(nextFile).toBeEnabled();
    await expect(previousChange).toBeEnabled();
    await expect(nextChange).toBeEnabled();
    await expect(review).toBeVisible();
    await expect(keyboardHelp).toBeVisible();

    for (const control of [previousFile, nextFile, previousChange, nextChange]) {
      await expect(control).toHaveClass(/ui-button--icon/);
```

Middle-file fixture idiom (so `Previous file` is enabled) — `tests/e2e/responsive-session.spec.ts:1118-1121`:

```ts
      await page.keyboard.press('Alt+Shift+]');
      await expect(page.locator('.active-file-toolbar__file')).toContainText('beta-after-a-very-long-rename.ts');
      await page.keyboard.press('Alt+Shift+[');
      await expect(page.locator('.active-file-toolbar__file')).toContainText('alpha.ts');
```

---

### 5. `ReviewToolbar` semantic-group gap — record, do not patch

**Bare-div `aria-label` pattern** — `src/web/components/ReviewToolbar.vue:25,26,51`:

```vue
  <div class="review-toolbar" aria-label="Diff navigation">          <!-- :25 -->
    <div class="review-toolbar__group" aria-label="File navigation">  <!-- :26 -->
```

```vue
    <div class="review-toolbar__group" aria-label="Change navigation"> <!-- :51 -->
```

Third group, `src/web/components/ReviewToolbar.vue:76` — carries **neither** `role` nor `aria-label`, and holds `Review` (`:81-90`) and `Keyboard help` (`:93`), two of the six controls the UI-SPEC matrix requires inside the named group:

```vue
    <div class="review-toolbar__group review-toolbar__group--actions">
```

**Correctly-roled named-group contrast, same repo.** A `<section>` with an accessible name *is* exposed as `region`, which is why the spec's `getByRole('region', { name: 'Finish attached review' })` locator is still valid:

```vue
    <section class="review-notes-dialog__counts" aria-label="Review comment counts">   <!-- ReviewNotesDialog.vue:165 -->
```

```vue
    <section v-if="attached" class="attached-completion" aria-labelledby="finish-attached-review-heading">  <!-- ReviewNotesDialog.vue:189 -->
```

```vue
  <section class="review-summary" role="region" :aria-label="`Summary ${status}`">     <!-- SummarySection.vue:130 -->
```

```vue
    <ul v-if="expanded" class="tree-group" role="group">                                <!-- DirectoryRow.vue:62 -->
```

`aria-label` on a `<div>` with no `role` resolves to `generic`, where ARIA does not support naming — so the name is dropped from the accessibility tree. **Independent confirmation:** `getByRole('group'` appears **zero** times across `tests/` (grep, whole tree), i.e. nothing in the suite has ever been able to assert the `Diff navigation` group. `git log f810081..HEAD -- src/web/components/ReviewToolbar.vue` is empty (RESEARCH), so the gap predates the restyle. Record as an **Owning-phase finding (Phase 11)**; assert the six buttons individually plus Tab order, both of which pass today.

---

### 6. `12-UI-REVIEW.md` (doc, transform) — W4/W5/W6

**Analog:** `.planning/phases/11-workspace-shell-review-surfaces/11-UI-REVIEW.md` — reproduce its structure, not a new one.

Front matter + verdict — `11-UI-REVIEW.md:1-11`:

```markdown
---
phase: 11
status: passed
audit: ui-six-pillars
score: 24/24
reviewed: 2026-09-14
---

# Phase 11 UI Review

## Verdict
```

Live-evidence provenance block — `11-UI-REVIEW.md:17-27` (note the explicit "not Vite or fixed development port" and the retained directory):

```markdown
## Live evidence

Screenshots are safely ignored by `.planning/ui-reviews/.gitignore`. Captures are from a real packaged CLI session, served by an ephemeral **127.0.0.1** Fastify (not Vite or a fixed development port), retained in `.planning/ui-reviews/11-live-20260914-r2/`:

- `desktop.png` — **1440×900** workspace with three changed files and a real saved Head-side comment.
- `full-desktop.png` — **1650×900** workspace with wide sidebar composition.
```

Numeric overflow table — `11-UI-REVIEW.md:29-34` (the exact shape Phase 12's `page.evaluate` measurements must fill):

```markdown
| Viewport | `clientWidth` | `scrollWidth` | Result |
|---|---:|---:|---|
| 1440×900 | 1440 | 1440 | PASS |
| 1650×900 | 1650 | 1650 | PASS |
| 420×900 | 420 | 420 | PASS |
```

Evidence-per-check table — `11-UI-REVIEW.md:60-71` style, each row citing `file:line`:

```markdown
| # | Check | Result | Evidence |
|---|---|---|---|
| 5 | Review notes overlays without narrowing diff | **PASS** | `review-notes.png` shows summary, comment counts, readiness, export, ignore status. …
```

Capture-directory naming and ignore policy are already in place — `.planning/ui-reviews/.gitignore:1-8`:

```gitignore
# Screenshot files — never commit binary assets
*.png
*.webp
```

Existing sibling directories: `.planning/ui-reviews/{09-live-20260913, 10-20260913-live, 11-live-20260914, 11-live-20260914-r2}` → Phase 12 uses `12-live-<date>/`.

**Packaged-CLI launch idiom for the throwaway capture script** — `tests/e2e/agent-ready-export.spec.ts:120-142`, the only in-repo pattern that drives the *installed packaged* binary over ephemeral loopback. Note it spawns `acceptance.launch.command`, **not** `process.execPath`:

```ts
function startGeneratedCli(
  fixture: DirtyGitFixture,
  selections: Readonly<{ readonly base: string; readonly head: string }>,
): RunningCli {
  const outputPath = join(acceptance.root, `terminal-${crypto.randomUUID()}.log`);
  const markerPath = join(acceptance.root, `browser-open-${crypto.randomUUID()}.log`);
  const outputDescriptor = openSync(outputPath, 'w');
  const child = spawn(acceptance.launch.command, [...acceptance.launch.args], {
    cwd: fixture.nestedCwd,
    env: {
      ...acceptance.env,
      PATH: `${fakeBinRoot}:${acceptance.env.PATH ?? ''}`,
      CUMPA_BROWSER_OPEN_MARKER: markerPath,
      BROWSER: join(fakeBinRoot, 'open'),
      CUMPA_LAUNCH_OPTIONS: JSON.stringify({
        cwd: fixture.nestedCwd,
        base: { label: selections.base.slice('refs/heads/'.length), revision: selections.base },
        head: { label: selections.head.slice('refs/heads/'.length), revision: selections.head },
      }),
    },
    stdio: ['ignore', outputDescriptor, outputDescriptor],
  });
```

The `spawn(process.execPath, [executablePath], …)` shape in `complete-review-draft.spec.ts:107-130` launches the **built dist entrypoint**, not the packed tarball — the capture script must use the `acceptance.launch` form above so the evidence origin is a real packaged CLI, as `12-UI-SPEC.md` "Evidence origin" requires.

URL harvest from stderr — `tests/e2e/agent-ready-export.spec.ts:182-186`:

```ts
async function waitForAttachedLoopbackUrl(running: RunningAttachedCli): Promise<string> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const stderr = existsSync(running.stderrPath) ? readFileSync(running.stderrPath, 'utf8') : '';
```

---

### 7. `12-VERIFICATION.md` (doc, transform) — W3

**Analog for the documented-external-prerequisite precedent** (the established way prior phases recorded a gated spec *without* skipping it).

`.planning/phases/08-semantic-visual-foundation/08-VERIFICATION.md:62-70`:

```markdown
## Browser residuals — external to Phase 08

The full browser run reproduced **only** the three already-known failures:

1. `tests/e2e/file-tree.spec.ts:331` expects selected treeitem `tabindex="0"`, received `"-1"` — pre-existing failure attributed by the supplied investigation to `b960bb7e`.
2. `tests/e2e/marketplace-review.spec.ts:97` — `CUMPA_MARKETPLACE_URL_MARKER required`.
3. `tests/e2e/public-support-states.spec.ts:348` — `CUMPA_RUNTIME_CUSTODY_DIR required`.

No additional browser failure appeared. These environmental/pre-existing failures do not change the Phase 08 verdict.
```

`.planning/phases/11-workspace-shell-review-surfaces/11-VERIFICATION.md:95-99` — the same precedent as a command-ledger row, with an explicit scope disclaimer:

```markdown
| --- | --- | --- | --- |
| `npm run test:browser` run 1 | 99 passed, 2 failed | `marketplace-review.spec.ts:97` requires `CUMPA_MARKETPLACE_URL_MARKER`; `public-support-states.spec.ts:348` requires `CUMPA_RUNTIME_CUSTODY_DIR` | Known external environment prerequisites, outside Phase 11 |
| `npm run test:browser` run 2 | 99 passed, 2 failed | Same two prerequisite failures | Identical result; no Phase 11/browser-order regression |

The previously blocked ordered flow now passes in the actual configured suite ordering and in the explicit ordered two-spec replay. The two failures are only the documented environment-marker tests and do not exercise or contradict Phase 11 scope.
```

**Command-ledger table shape** — `08-VERIFICATION.md:55-60`:

```markdown
| `npm run typecheck:web` | Passed. |
| `npm run build` | Passed as the first half of `npm run build && npm run test:browser`. |
| `npm run build && npm run test:browser` | Build passed. Browser result: 91 passed; exactly the three known external failures below; no Phase 08 regression. |
```

**The two genuinely external gates, at their current lines:**

`tests/e2e/marketplace-review.spec.ts:98-99`:

```ts
  const marker = process.env.CUMPA_MARKETPLACE_URL_MARKER;
  if (!marker) throw new Error('[marketplace-review] CUMPA_MARKETPLACE_URL_MARKER is required');
```

`tests/e2e/public-support-states.spec.ts:328-330`:

```ts
  acceptance = resolveAcceptanceRuntime();
  if (acceptance.source === 'local-archive') throw new Error('[public-support-states] live support states require a public runtime, never local-archive');
  supportHome = publicSupportHomeOf(acceptance) ?? (() => { throw new Error('[public-support-states] public runtime did not supply shared support HOME'); })();
```

---

## Shared Patterns

### Packaged-spec locator convention

**Source:** `tests/e2e/complete-review-draft.spec.ts:152-157`, `tests/integration/anchored-workspace.spec.ts:549-554`
**Apply to:** every edit in `agent-ready-export.spec.ts` and `responsive-session.spec.ts`

Role + exact accessible name, never CSS class, for anything the contract names:

```ts
page.getByRole('button', { name: 'Review notes', exact: true })
page.getByRole('dialog',  { name: 'Review notes' })
page.getByRole('region',  { name: 'Finish attached review' })
```

CSS-class locators remain acceptable **only** for Monaco internals and unnamed presentational probes — `agent-ready-export.spec.ts:412-413`:

```ts
    await expect(resumedPage.locator('.review-summary__preview')).toContainText(summary);
    await expect(resumedPage.locator('.comments-rail__comment')).toContainText(body);
```

### Accepted-HTTP-plus-bytes assertion pairing

**Source:** `tests/e2e/agent-ready-export.spec.ts:276-278`, `:596-599`, `:601-604`
**Apply to:** every re-authored call site — this is what satisfies UI-SPEC re-authoring condition 3/4

```ts
  const accepted = page.waitForResponse((response) => response.url().includes('/api/draft/mutations'));
  await page.getByRole('button', { name: 'Save summary' }).click();
  expect((await accepted).status()).toBe(200);
```

```ts
    const finished = page.waitForResponse((response) => response.url().includes('/api/review-completion/finish'));
    await page.getByRole('button', { name: 'Finish review', exact: true }).click();
    expect((await finished).status()).toBe(201);
    expect(await waitForAttachedExit(running)).toBe(0);
```

```ts
    const stdout = readFileSync(running.stdoutPath);
    expect(stdout.at(-1)).not.toBe(0x0a);
    expect(parseCanonicalReviewExport(stdout)).toMatchObject({
      schemaVersion: 2,
```

Opening the dialog changes **none** of this — which is the proof the re-authoring is presentational-only.

### Focus-destination assertion

**Source:** `tests/e2e/responsive-session.spec.ts:1110`, `:1116`, `:1133`, `:1139`, `:1187`, `:1198`, `:1582-1590`
**Apply to:** all CON-03 additions

```ts
      await expect(filter).toBeFocused();
```

```ts
      await expect(page.locator('.active-file-toolbar h1')).toBeFocused();
```

### Evidence table with `file:line` citation

**Source:** `11-UI-REVIEW.md:60-71`, `11-VERIFICATION.md:95-99`
**Apply to:** `12-UI-REVIEW.md` and `12-VERIFICATION.md` — every claim carries a command, a count, or a `file:line`.

---

## RESEARCH ↔ Repo Contradictions (proof included)

| # | RESEARCH claim | Repo reality | Proof | Planner impact |
|---|---|---|---|---|
| C1 | "spec's `ensureReviewOpen()` (`:269-271`)" | It is at `agent-ready-export.spec.ts:245-249`. `:269-271` is inside `addHeadComment` (composer fill / `waitForResponse` / `Add comment` click). | grep `^async function` on the spec: `:245 ensureReviewOpen`, `:251 addHeadComment`, `:273 saveSummary` | A plan task that edits "`:269-271`" would corrupt the comment-creation helper. Use `:245-249`. |
| C2 | Call sites needing the helper are "`:274`, `:277`, `:416`, `:443`, `:549`, `:716`, `:818`" | Incomplete. Also `:594` and `:597` (test `:581`) and `:654` and `:661` (test `:628`). | grep `Finish review` → `:550, :594, :597, :654, :661, :716, :819` | Two of the six failing tests (`:581`, `:628`) would still fail after applying RESEARCH's list verbatim. This is exactly the "one or two iteration rounds" RESEARCH's own assumption A1 predicts — but it is avoidable, since the full ledger is knowable statically. |
| C3 | Test `:780` fails at `:818` | `:818` is `const finished = page.waitForResponse(...)`; the failing locator click is `:819`. | read `agent-ready-export.spec.ts:816-822` | Off-by-one only; no behavioural consequence. |
| C4 | `npm run pack:runtime-artifact --purpose development-check` (Standard-Approach table short form) | Cannot work. `--custody-dir` and `--evidence` are mandatory, and without `--` npm passes nothing to the script. | `scripts/pack-runtime.mjs:204-219` (`safeAbsoluteDirectory(options.get('--custody-dir'), …)` on `undefined`) | The plan must use the long form from RESEARCH's `[VERIFIED]` block, with a realpath'd, non-existent custody dir **and** evidence path. |
| C5 | `safeAbsoluteDirectory` at `pack-runtime.mjs:213-215` | `:213-215` are the two *call sites*; the definition and symlink/parent check are at `:187-190+`. | grep `function safeAbsoluteDirectory` → `:187` | Cite `:187` when describing the rejection. |
| C6 | `supportConfiguration()` format check at `pack-runtime.mjs:240-245` | The regex/canonical check is at `:242-247`; the function starts at `:231`. | read `scripts/pack-runtime.mjs:231-248` | Cosmetic. |
| C7 | CONTEXT.md frames `public-support-states.spec.ts` as blocked only on `CUMPA_RUNTIME_CUSTODY_DIR`, implying custody inputs would unblock it | It has **two** gates: it needs the custody inputs *and* it hard-refuses `local-archive`. Supplying custody locally does **not** unblock it. | `tests/e2e/public-support-states.spec.ts:329` | RESEARCH's disambiguation is correct; the plan must not promise that W2's custody work fixes this spec. |
| C8 | `08-VERIFICATION.md:68` / `11-VERIFICATION.md:96` cite `public-support-states.spec.ts:348` as the throw site | At HEAD, `:348` is inside `beforeAll`'s pre-restore support-state guard; the env/local-archive throws are at `:328-329`. | read `tests/e2e/public-support-states.spec.ts:340-349` | Prior-phase line numbers are stale. `12-VERIFICATION.md` should cite `:328-329` so the ledger stays checkable. |
| C9 | RESEARCH names only `ReviewToolbar.vue:25,26,51` as unroled | The third group at `:76` (`review-toolbar__group--actions`) has neither `role` nor `aria-label`, and it owns `Review` and `Keyboard help`. | read `src/web/components/ReviewToolbar.vue:76-96` | The Phase 11 finding should name all four containers so the owning phase sees the whole gap. A single `role="group"` at `:25` would satisfy the UI-SPEC matrix regardless. |

**RESEARCH claims independently confirmed (no contradiction):**

- `playwright.config.ts:6-9` excludes `agent-ready-export.spec.ts` — verified verbatim. Note it also removes the spec from `npm run test:package` (`package.json:40` = bare `playwright test`), not just `test:browser`.
- `ReviewNotesDialog.vue:111`, `:112`, `:191` line numbers — verified exactly.
- `ReviewToolbar.vue:25,26,51` line numbers — verified exactly.
- `App.vue:162`, `IdentityHeader.vue:117-118` support gating — verified exactly.
- `tests/package/agent-ready-export.test.ts:135` operator-secret hard-throw — verified at `:135-136`.
- `mockups/01b-desktop.png` and `01b-desktop-full.png` are byte-identical — `md5sum` both `04cd8d6b7937df44d4a452060a88c76b`; `01b-mobile.png` differs (`0343f14b…`).
- No capture script exists in `scripts/` — no analog; the throwaway script is genuinely new.
- `getByRole('group'` is used **zero** times in `tests/` — the `Diff navigation` group has never been assertable.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| throwaway live-capture script | utility | file-I/O | No screenshot/measurement script exists anywhere in `scripts/` or `tests/`. Phases 09–11 captured ad hoc and retained nothing. Composite analog only: packaged-CLI launch from `agent-ready-export.spec.ts:115-135,182-186` + the measurement *output* shape from `11-UI-REVIEW.md:21-34`. Must be deleted in cleanup — it is not a permanent script. |

---

## Metadata

**Analog search scope:** `tests/e2e/`, `tests/integration/`, `tests/package/`, `tests/helpers/`, `src/web/components/`, `src/web/components/ui/`, `scripts/`, `playwright*.config.ts`, `package.json`, `.planning/phases/*/`, `.planning/ui-reviews/`, `mockups/`
**Files read:** 24
**Grep sweeps:** 11
**Production source files this phase must modify:** 0
**Pattern extraction date:** 2026-09-14
