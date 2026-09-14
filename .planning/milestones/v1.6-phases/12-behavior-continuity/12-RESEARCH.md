# Phase 12: Behavior Continuity - Research

**Researched:** 2026-09-14
**Domain:** Test reconciliation, packaged-acceptance harness operation, mechanical accessibility evidence, live visual evidence
**Confidence:** HIGH

## Summary

Phase 12 is a reconcile-and-evidence phase, and most of it is genuinely already done — but not all of it, and the part that is missing was invisible until this research ran it.

Phases 08–11 reconciled five of the six ROADMAP-named specs (`git diff --stat f810081 HEAD` shows 733 insertions / 349 deletions across `file-tree`, `pinned-session`, `anchored-review`, `complete-review-draft`, `responsive-session`). The sixth, `tests/e2e/agent-ready-export.spec.ts`, has **zero churn across the entire v1.6 milestone** — because it never executes. `playwright.config.ts:6-9` puts it in `testIgnore`, so `npm run test:browser` (103 tests / 20 files) never collects it; its only runner is `tests/package/agent-ready-export.test.ts:135`, which hard-throws without an operator-held `CUMPA_RELEASE_SUPPORT_SERVICE_URL`. It therefore drifted silently through four phases of restyle.

This research built the custody inputs locally and ran it. **All 6 tests fail, single root cause: Phase 11 relocated `Write summary` / `Save summary` / `Export review` / `Finish attached review` out of the always-mounted Review rail and into the `Review notes` modal dialog, and this spec still queries them on the bare page.** That is exactly the CON-02 re-authoring case, not a defect. Critically, the custody prerequisite is **not** an external blocker — `npm run pack:runtime-artifact --purpose development-check` produces every input the Playwright specs need, with zero secrets (proven below).

The other two env-marker specs are a different story and must not be conflated with it. `public-support-states.spec.ts:329` hard-refuses `local-archive` and requires a runtime installed from the **published** npm registry plus a reachable hosted support origin; `marketplace-review.spec.ts:98` polls a marker file written by a supervised registry-installed CLI. Neither is satisfiable locally at any effort, and neither is presentation-sensitive. They are documented external release prerequisites, not skipped covered flows.

**Primary recommendation:** Treat Phase 12 as three small, sharply-bounded pieces of work — (1) re-author the five relocated call sites in `agent-ready-export.spec.ts` behind an `openReviewNotes` helper copied from `complete-review-draft.spec.ts:152-157`, and make that spec runnable locally via a documented `development-check` pack; (2) record the two registry-gated specs as external prerequisites with the evidence below; (3) produce the CON-01 human dossier and CON-03/criterion-4 live evidence in `12-UI-REVIEW.md`. Add **no new dependency, no new production code, and no new end-to-end spec.**

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Review/export/Finish behavior continuity | API / Backend + persistence | Browser | CON-01 mechanics live in Fastify routes, `.cumpa/` drafts, and canonical export bytes; the restyle only moved their triggers |
| Test reconciliation (CON-02) | Test harness (Playwright) | — | No production tier changes; assertions re-point at relocated surfaces |
| Packaged-artifact acceptance | Build/packaging (`scripts/pack-runtime.mjs`) | Test harness | Custody inputs are produced by the packer, consumed by `tests/helpers/runtime-artifact.ts` |
| Accessibility roles/names/focus (CON-03) | Browser / Client (Vue templates) | Test harness | Roles ship in `src/web/components/*.vue`; evidence is mechanical Playwright role queries |
| Live visual evidence (criterion 4) | Browser / Client | CLI + Fastify (ephemeral loopback) | Captures must come from a real packaged CLI session, never Vite |
| Voluntary support gating | API / Backend | Build/packaging | `App.vue:162` reads `session.support.enabled`, which is baked at pack time |

## Standard Stack

No new libraries. Everything Phase 12 needs already ships.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | 1.61.1 | Packaged browser specs, role/name queries, focus assertions, screenshots | Already the repo's only browser harness [VERIFIED: `package.json` devDependencies] |
| `vitest` | 4.1.10 | Contract suites (unit/git/api/package) | Already the repo's only Node test runner [VERIFIED: `package.json`] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `scripts/pack-runtime.mjs` | in-repo | Produces the `.tgz` + producer evidence that unlock the gated specs | Required to run `agent-ready-export.spec.ts` locally |
| `scripts/verify-semantic-css.mjs` | in-repo | Token/colour gate on the built stylesheet | Runs via `npm run verify:semantic-css` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright `getByRole` for CON-03 | `@axe-core/playwright` | **Reject.** No axe dependency exists today [VERIFIED: full dependency list has no axe]. The UI-SPEC's CON-03 matrix is a *named-role/focus-destination* matrix, which is precisely what `getByRole`/`toBeFocused` already assert 290 / 37 times across the six specs. Axe finds generic WCAG violations, not this contract, and would add a dependency for zero contract coverage. |
| A new single CON-01 end-to-end spec | Existing per-step specs + human dossier | **Reject.** See "CON-01 coverage" below — all 8 steps are already covered, and success criterion 1 asks for a *human* completing the journey, not another robot. |

**Installation:** none. `git diff --stat package.json package-lock.json` must remain empty for this phase.

## Package Legitimacy Audit

Phase 12 installs **no external packages**. No registry lookups, no new `dependencies` or `devDependencies` entries. The legitimacy gate is not applicable; any plan that adds a package contradicts this research and the UI-SPEC's "no component library, no registry" rule (`12-UI-SPEC.md` Design System table).

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## What Actually Remains

This is the section the planner should read first. Padding this phase is a worse outcome than a short plan.

### Already satisfied — do not re-do

| Item | Evidence |
|------|----------|
| Five of six named specs reconciled | `git diff --stat f810081 HEAD --` on the six specs: `anchored-review` +21/-, `complete-review-draft` +27/-, `file-tree` +275/-, `pinned-session` +162/-, `responsive-session` +597/-; `agent-ready-export` **absent from the diff** |
| Default browser suite green | 99 passed of 103 collected (`npx playwright test --list` → "Total: 103 tests in 20 files"); 2 env-blocked, 2 window-skipped |
| Vitest contract suites green | unit 186, git 69, api 142 [user-reported ground truth] |
| Gates green | `verify:semantic-css`, `typecheck:web`, `build` [user-reported ground truth] |
| Phase 11 security | All 8 threats CLOSED (`11-SECURITY.md`) |
| Phase 11 visual acceptance | PASS 24/24, live 1440×900 / 1650×900 / 420×900, no overflow at any viewport (`11-UI-REVIEW.md:9-27`) |
| Packer flakiness | Atomic lock + dead-owner takeover (`8bdfe4c`, `a08a47b`); `NODE_ENV` forced to production at `pack-runtime.mjs:462` (`5a3e1b1`). Re-verified: two packs in this session succeeded in 5.15s and 5.30s with no lock contention |
| Single `aria-live` owner | `App.vue` holds exactly one region; verified by Phase 11 and asserted by `8ad1b9f` |
| Diff-nav button names/operation | `integration/anchored-workspace.spec.ts:549-567` names and exercises all six toolbar controls; `anchored-review.spec.ts:262-263` drives Next/Previous file |

### Genuinely outstanding

| # | Work | Requirement | Size |
|---|------|-------------|------|
| W1 | Re-author 5 relocated call sites in `agent-ready-export.spec.ts`; add local `openReviewNotes` helper | CON-02 | small, mechanical |
| W2 | Make `agent-ready-export.spec.ts` reachable in a documented local command (it is currently in `testIgnore` and gated behind an operator secret) | CON-02 | small |
| W3 | Record the two registry-gated specs as external prerequisites with rationale | CON-02 | doc only |
| W4 | CON-01 human journey dossier in `12-UI-REVIEW.md` (8 steps) | CON-01 | human run |
| W5 | CON-03 mechanical matrix + record the `ReviewToolbar` group gap as a Phase 11 finding | CON-03 | evidence |
| W6 | Three live captures at 1440×1000 / 1650×900 / 420×900 + dialog/warning captures | criterion 4 | human run |

Nothing else. There is no production source change in this phase.

## The Two Env-Marker Specs — CON-02 Resolution

The Phase 12 CONTEXT framed these as one problem. They are two different problems, and only one of them is real.

### `CUMPA_RUNTIME_CUSTODY_DIR` — **locally satisfiable, no external prerequisite**

`readRuntimeArtifact()` (`tests/helpers/runtime-artifact.ts:259-288`) requires four inputs: `CUMPA_RUNTIME_CUSTODY_DIR`, `CUMPA_RUNTIME_ARCHIVE_BASENAME`, `CUMPA_RUNTIME_ARCHIVE_SHA256`, `CUMPA_RUNTIME_EVIDENCE`. All four are produced by the in-repo packer.

The decisive detail: `ProducerEvidenceSchema` (`runtime-artifact.ts:47-48`) accepts `purpose: 'development-check'` / `status: 'development-check'`, and the stable-profile branch only requires `evidence.status === evidence.purpose` (`:254-256`). And `supportConfiguration()` (`pack-runtime.mjs:229-233`) returns `{configured:false}` without failing **only** for `development-check` — every other purpose demands the operator-held support origin.

[VERIFIED: commands run in this session]

```bash
npm run pack:runtime-artifact -- --purpose development-check \
  --custody-dir /private/tmp/cumpa-p12-custody \
  --evidence /private/tmp/cumpa-p12-evidence.json
# → "Created development-check runtime artifact evidence." (5.15s)
# → shipwithai-cumpa-1.5.0.tgz, 3525264 bytes
# → {"kind":"cumpa.runtime-artifact-evidence/v1","purpose":"development-check","status":"development-check"}
```

Then the specs run directly against the runtime-artifact config, bypassing the Vitest driver that demands the secret:

```bash
export CUMPA_RUNTIME_CUSTODY_DIR=/private/tmp/cumpa-p12-custody
export CUMPA_RUNTIME_ARCHIVE_BASENAME=shipwithai-cumpa-1.5.0.tgz
export CUMPA_RUNTIME_EVIDENCE=/private/tmp/cumpa-p12-evidence.json
export CUMPA_RUNTIME_ARCHIVE_SHA256=$(node -e "process.stdout.write(require(process.env.CUMPA_RUNTIME_EVIDENCE).archive.sha256)")
npx playwright test --config playwright.runtime-artifact.config.ts \
  tests/e2e/agent-ready-export.spec.ts tests/e2e/package-assets.spec.ts
```

Result: **`package-assets.spec.ts` 1 passed; `agent-ready-export.spec.ts` 6 failed** (450.94s total).

One nuance the planner must know: the `support` scenario is required only for `local-archive` runs (`agent-ready-export.spec.ts:299-301`), and `Support Cumpa` renders only when `session.support.enabled` is true (`IdentityHeader.vue:117-118` `v-if="supportEnabled"` → `App.vue:162`). A bare `development-check` pack writes `support:{"configured":false}`, so test `:780` fails at `:800` for an *environmental* reason. `supportConfiguration()` only **format**-checks the origin (`pack-runtime.mjs:240-245`: `https://<20 lowercase alnum>.supabase.co`) — it never dials it. Supplying a syntactically valid synthetic origin makes support configured-but-unreachable, which is literally what that test asserts ("remains unavailable without outbound access"):

```bash
CUMPA_RELEASE_SUPPORT_SERVICE_URL="https://abcdefghij0123456789.supabase.co" \
  npm run pack:runtime-artifact -- --purpose development-check ...
# → support: {"configured":true,"originSha256":"2b3588b9…"}
```

[VERIFIED] With that artifact, test `:780` advanced past the support dialog (lines 799–815 all passed: button visible, clicked, `Support Cumpa — $49.99` enabled, outbound fetch blocked, `Not now` dismissed) and failed at `:818` on `Finish review` — **the same relocation as the other five.**

**Conclusion: with a synthetic support origin, all 6 failures have one root cause and zero external prerequisites.**

### `CUMPA_MARKETPLACE_URL_MARKER` and `public-support-states` — **genuine external prerequisites**

These cannot be satisfied locally at any effort:

- `public-support-states.spec.ts:329` — `if (acceptance.source === 'local-archive') throw new Error('[public-support-states] live support states require a public runtime, never local-archive')`. It demands `CUMPA_PUBLIC_INSTALL_SOURCE=public-global|public-npx`, which installs the **published** `@shipwithai/cumpa` from `https://registry.npmjs.org/` and asserts `runtime.proof.resolvedVersion === PINNED_PUBLIC_ARTIFACT.version` (`acceptance-runtime.ts:43`). It then observes *real* hosted `unverified` → `verified` support transitions against a live Supabase origin.
- `marketplace-review.spec.ts:98-99` — throws without a marker file that a supervised, registry-installed CLI writes a loopback URL into; it also reads `CUMPA_SUPPORT_STATE_WINDOW`.

Both are **release-acceptance** specs for the published-package path. Neither is presentation-sensitive; neither is among the six ROADMAP-named specs; both have failed for this identical reason since before the restyle began (`08-VERIFICATION.md:67-68` records exactly these two, alongside a since-fixed `file-tree` tabindex failure).

**Recommendation:** record them in `12-VERIFICATION.md` as *documented external prerequisites* with the rationale above. This does **not** violate the CON-02 no-skip rule, and the plan should say why in these words:

1. No `test.skip`, `fixme`, weakened assertion, or broadened locator is introduced — the specs remain collected by `playwright.config.ts` and still fail loudly when their inputs are absent. Nothing is being made green.
2. The *covered flow* — review → comment → export → Finish — is not lost. `marketplace-review.spec.ts` re-runs the same review contract the local suite already runs; only the **install source** is substituted. That flow is proven by `agent-ready-export.spec.ts` on `local-archive` once W1 lands.
3. What is genuinely unproven locally is "the published registry artifact + live hosted support states", which is a v1.6 release-gate concern, not a restyle-continuity concern.

Do **not** invent fake markers for these two. A synthetic origin is legitimate for `agent-ready-export.spec.ts:780` because that test asserts *unreachability*; a synthetic marker for `marketplace-review` would fabricate a registry install that never happened.

## The `agent-ready-export.spec.ts` Reconciliation — Exact Work

All six failures, with the locator that fails and the line to change [VERIFIED: two full runs, 450.94s and 130.02s]:

| Test | Fails at | Locator not found | Cause |
|------|----------|-------------------|-------|
| `:380` resume after relaunch | `:274` (via `saveSummary`) | `button 'Write summary'` | moved into Review notes dialog |
| `:524` blocks Finish, unsaved composer | `:551` | `region 'Finish attached review' > button 'Finish review'` | moved into Review notes dialog |
| `:581` attached range silent until Finish | `:594` | `button 'Finish review'` | moved into Review notes dialog |
| `:628` equivalent attached ranges | `:274` (via `saveSummary`) | `button 'Write summary'` | moved into Review notes dialog |
| `:690` exact-patch V3 | `:715-716` | `button 'Finish review'` | moved into Review notes dialog |
| `:780` configured support | `:818` (with support origin) | `button 'Finish review'` | moved into Review notes dialog |

Plus a cascading teardown failure at `:75` (`sourceControlEvidence` asserts every scenario recorded); it clears itself once the six pass.

The relocated surfaces now live in `ReviewNotesDialog.vue` — `title="Review notes"` (`:111`), `close-aria-label="Close review notes"` (`:112`), `<h3 id="finish-attached-review-heading">Finish attached review</h3>` (`:191`). The spec's `ensureReviewOpen()` (`:269-271`) opens the **comments rail**, which Phase 11 split away from Review notes; it is no longer sufficient.

The canonical fix already exists and must be copied, not invented — `complete-review-draft.spec.ts:152-157`:

```ts
async function openReviewNotes(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: 'Review notes', exact: true });
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.getByRole('dialog', { name: 'Review notes' })).toBeVisible();
}
```

Call sites needing it: `:274` and `:277` (inside `saveSummary`), `:416` (`Export review`), `:443` (`Export review again`), `:549` (`Finish attached review` region), `:716`, `:818`.

**This satisfies all five CON-02 re-authoring conditions:** (1) the old assertion targeted a surface Phase 11 explicitly relocated; (2) the same packaged installed flow still runs; (3) the replacement asserts role/name + accepted HTTP result + emitted canonical bytes, not component structure; (4) it would still fail if Finish regressed while the dialog stayed mounted; (5) test names are untouched, so the coverage ledger still identifies the flow.

## CON-01 Coverage — No New Spec Needed

Every step of the UI-SPEC's 8-step journey already has automated coverage. There is no single spec spanning all 8, and adding one would be expensive (a seventh multi-minute packaged spec) and redundant.

| Step | Existing automated coverage |
|------|------------------------------|
| 1. Launch | `pinned-session.spec.ts:395` "generated CLI opens immutable pinned session" |
| 2. Select file (keyboard) | `file-tree.spec.ts:363` "preserves opaque selection and keyboard semantics" |
| 3. Line comment | `complete-review-draft.spec.ts:314`; `anchored-review.spec.ts:216` |
| 4. Resolve | `complete-review-draft.spec.ts:314` (edits, resolves, reopens, deletes); `review-panel-resolved.spec.ts` |
| 5. Summary | `complete-review-draft.spec.ts:390` "saves a safe summary and relaunches it" |
| 6. Export | `agent-ready-export.spec.ts:380` (target-aware second export) — **after W1** |
| 7. Recover | `complete-review-draft.spec.ts:670,706` (corrupt/failed recovery); `agent-ready-export.spec.ts:380` (resume, exact bytes) |
| 8. Finish attached | `agent-ready-export.spec.ts:581` "stays silent until Finish then emits one canonical V2 document" |

Success criterion 1 says "**a human** reviewer completes…". The deliverable is a recorded dossier in `12-UI-REVIEW.md`, per the UI-SPEC's own instruction that "a network response or screenshot alone does not replace the user-visible result, and a UI message alone does not replace persisted/exported bytes." Assert the coverage table above; run the journey by hand once; record both.

## Accessibility (CON-03) — Cheapest Correct Path

**Tooling already present:** Playwright's role engine. Across the six specs there are 290 `getByRole` calls and 37 `toBeFocused` assertions (responsive-session 66/17, file-tree 37/9, pinned-session 70/5, complete-review-draft 67/1, anchored-review 22/5, agent-ready-export 28/0). **No axe-style dependency exists and none is required** — see Alternatives Considered.

Existing coverage of the UI-SPEC matrix, by attribute:

| Matrix element | Already asserted in |
|---|---|
| `aria-level` | `file-tree.spec.ts`, `responsive-session.spec.ts` |
| `aria-selected` | `file-tree.spec.ts`, `pinned-session.spec.ts`, `review-panel-resolved.spec.ts` |
| `aria-expanded` | 9 specs incl. all six named |
| roving `tabindex` | `file-tree.spec.ts`, `review-panel-resolved.spec.ts` |
| `treeitem` / `tree` / `navigation` roles | `file-tree.spec.ts`, `pinned-session.spec.ts`, `responsive-session.spec.ts` |
| `aria-modal`, `aria-haspopup` | `responsive-session.spec.ts`, `pinned-session.spec.ts` |
| `Close details`, `Close review notes`, `Clear file filter`, `Filter files`, `Keyboard actions` | `responsive-session.spec.ts`, `file-tree.spec.ts`, `complete-review-draft.spec.ts` |
| Six diff-nav button names + enable/disable | `integration/anchored-workspace.spec.ts:549-567` |

**Recommendation: extend `responsive-session.spec.ts`; do not add an accessibility spec.** It is already the single dedicated "responsive keyboard and accessibility contract" test (`:834`, 1638 lines) and absorbed the largest reconciliation of the milestone (597 lines). Two matrix rows are not yet mechanically asserted anywhere:

1. Sequential Tab traversal `Previous file → Next file → Previous change → Next change → Review → Keyboard help` in a middle-file fixture.
2. `getByRole('group', { name: 'Diff navigation', exact: true })` scoping those six controls — **currently impossible**, see below.

Everything else in the matrix is covered; assert the ledger rather than duplicating it.

### The ReviewToolbar semantic-group gap

`ReviewToolbar.vue:25` ships `<div class="review-toolbar" aria-label="Diff navigation">` with **no `role`**. An `aria-label` on a bare `div` with no role is not exposed, so the container is unqueryable as a named group. [VERIFIED: read of `ReviewToolbar.vue:24-96`; no test anywhere queries `role="group"` name `Diff navigation` — repo-wide grep returns only `DirectoryRow.vue:62`'s tree `role="group"`.]

Yes, the fix is literally one attribute (`role="group"`). **But Phase 12 must not apply it.** `12-UI-SPEC.md:182` is explicit: *"Record this CON-03 gap against the Phase 11-owned toolbar surface. It is not a new Phase 12 visual requirement, and Phase 12 must not implement or visually redesign around it."*

Ownership evidence strongly supports that ruling: `git log f810081..HEAD -- src/web/components/ReviewToolbar.vue` is **empty** — the file is byte-unchanged across the entire v1.6 milestone. The gap is pre-existing, predates the restyle, and nothing regressed. Success criterion 3 says structurally changed surfaces must **retain** roles and names; this surface did not structurally change and retained exactly what it had.

**Recommendation:** record it in `12-UI-REVIEW.md` as an **Owning-phase finding (Phase 11)** with the `git log` emptiness as evidence, assert the six buttons individually and their Tab order (both of which work today), and let the milestone owner decide whether to reopen Phase 11 or defer. Do not silently patch it — a one-line source edit in a phase whose contract forbids source changes is precisely the "silently redesign around it" the UI-SPEC prohibits.

Also note: the two inner `review-toolbar__group` divs (`:26`, `:51`) carry `aria-label="File navigation"` / `"Change navigation"` with no role either — the same latent issue. Mention in the finding; do not fix.

## Visual Evidence (Criterion 4) — Repeatable Procedure

**No capture script exists** (`ls scripts/` — none of the 14 scripts captures screenshots). Phases 09/10/11 each did this as a live ad-hoc audit; evidence dirs `.planning/ui-reviews/{09-live-20260913, 10-20260913-live, 11-live-20260914, 11-live-20260914-r2}` exist and `.planning/ui-reviews/.gitignore` ignores `*.png`.

It is scriptable and should be: a throwaway Playwright script driving a real packaged CLI session over ephemeral loopback, taking the six captures plus the computed-style and overflow measurements. That is strictly better than a manual audit because the UI-SPEC requires *numeric* evidence (`documentElement.clientWidth === scrollWidth` at all three viewports, plus computed toolbar/footer/type/boundary values) which is tedious and error-prone by hand and trivial in `page.evaluate`. Phase 11 already produced exactly this shape (`11-UI-REVIEW.md:21-27`), so the plan should reproduce that method, not reinvent it.

Two viewport facts the planner must get right:

1. **Desktop is `1440×1000`, not `1440×900`.** Phase 11 captured at 1440×900 (`11-UI-REVIEW.md:11`). The Phase 12 contract requires `desktop.png` at `1440×1000` to permit exact-viewport overlay against `mockups/01b-desktop.png`. [VERIFIED: PNG IHDR read — `01b-desktop.png` is `1440x1000`, `01b-mobile.png` is `420x900`.]
2. **`mockups/01b-desktop-full.png` is a byte-identical duplicate of `01b-desktop.png`** — same `1440x1000`, same 111917 bytes, md5 `04cd8d6b7937df44d4a452060a88c76b` for both. [VERIFIED: `md5sum`.] This is hard evidence for the UI-SPEC's rule that `full-desktop.png` (`1650×900`) must be assessed **only** against the Phase 11 wide contract and retained live evidence, never against that relabeled raster. Any plan that diffs `full-desktop.png` against `01b-desktop-full.png` is comparing against a mislabeled desktop shot.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Opening the Review notes dialog in a spec | A new bespoke helper | Copy `openReviewNotes` from `complete-review-draft.spec.ts:152-157` | A second convention beside a working one is prohibited; this one already passes in 8 tests |
| Custody inputs for gated specs | Hand-crafted evidence JSON | `npm run pack:runtime-artifact --purpose development-check` | The evidence schema cross-checks archive basename/byteLength/sha256/sha1/sha512 against the real file (`runtime-artifact.ts:274-283`); hand-written JSON cannot pass |
| Accessibility auditing | A new axe dependency | Playwright `getByRole` / `toBeFocused` | The contract is a named-role matrix, not generic WCAG scanning; zero new deps |
| CON-01 proof | A new 8-step mega-spec | Existing per-step specs + human dossier | Criterion 1 asks for a human; the robots already cover all 8 steps |
| Visual measurement | Eyeballing screenshots | `page.evaluate` computed styles + overflow, as `11-UI-REVIEW.md:21-27` did | The contract demands numeric values |

**Key insight:** every capability this phase needs already exists in the repo and was exercised in Phases 09–11. The failure mode here is inventing parallel machinery, not missing machinery.

## Common Pitfalls

### Pitfall 1: Assuming the suite being green means the six specs pass
**What goes wrong:** "99 passed" hides that `agent-ready-export.spec.ts` was never collected.
**Why it happens:** `playwright.config.ts:6-9` `testIgnore` silently excludes it and `package-assets.spec.ts`; `npx playwright test --list` reports 103 tests in 20 files and that spec's 6 tests are not among them.
**How to avoid:** run the runtime-artifact config explicitly. Verification must state both commands and both counts.
**Warning signs:** a spec with zero git churn across a milestone that restyled everything it touches.

### Pitfall 2: Going through the Vitest driver and concluding it is externally blocked
**What goes wrong:** `npm run accept:runtime-artifact` / `tests/package/agent-ready-export.test.ts:135` throws `CUMPA_RELEASE_SUPPORT_SERVICE_URL is required`, and it looks like the specs are unreachable. `07-06-SUMMARY.md:101` records exactly this dead end.
**Why it happens:** the driver additionally performs scanner verification and acceptance-report writing, which do need the secret. The Playwright specs do not — the driver forwards only the four custody vars (`agent-ready-export.test.ts:~174`).
**How to avoid:** invoke `npx playwright test --config playwright.runtime-artifact.config.ts` directly.

### Pitfall 3: Packing into a symlinked path
**What goes wrong:** `npm run pack:runtime-artifact -- --custody-dir /tmp/...` fails instantly with `runtime producer failed: custody directory parent must be a directory`.
**Why it happens:** on macOS `/tmp` is a symlink to `/private/tmp`; `safeAbsoluteDirectory` (`pack-runtime.mjs:213-215`) rejects it, and also rejects destinations that already exist.
**How to avoid:** use a realpath'd parent (`/private/tmp/...`) and a fresh, non-existent custody dir and evidence path each run. [VERIFIED: reproduced then resolved in this session.]

### Pitfall 4: Treating the `:780` support failure as a restyle regression
**What goes wrong:** a bare `development-check` pack writes `support:{"configured":false}`, `IdentityHeader.vue:117` `v-if="supportEnabled"` drops the button, and the test fails at `:800` looking unrelated to the dialog relocation.
**How to avoid:** pack with a syntactically valid synthetic origin. Confirmed to move the failure to `:818`, unifying all six root causes.

### Pitfall 5: Conflating the two registry-gated specs with the custody-gated one
**What goes wrong:** a plan either declares all three externally blocked (missing the real CON-02 work) or tries to fake markers for all three (fabricating evidence).
**How to avoid:** custody-gated → satisfy locally; registry-gated → document as prerequisites. `public-support-states.spec.ts:329` refuses `local-archive` outright, which is the bright line.

### Pitfall 6: Touching production source and tripping the semantic CSS gate
**What goes wrong:** `scripts/verify-semantic-css.mjs` fails on a second `:root`, a non-canonical custom property, a token with no consumer (`:106`), a direct colour outside the token root or the single terminal forced-colors block (`:203`, `:215`), any gradient/glow/glass/drop-shadow or remote URL (`:211`), a duplicate `box-shadow` (`:237`), or a non-allowlisted inset shadow (`:245`).
**How to avoid:** Phase 12 changes no CSS and no `.vue` file. If a plan proposes one, that is the signal an earlier phase's contract was wrong — raise it as an owning-phase finding instead.

### Pitfall 7: Re-introducing packer flakiness
**What goes wrong:** historically, a Vite dev server from an earlier spec leaked `NODE_ENV=development` into the packer, shipping a development Vue runtime.
**Status:** fixed — `pack-runtime.mjs:462` forces `NODE_ENV: 'production'`, and packing is serialized by an atomic lock with dead-owner takeover (`:28`). Two packs this session took 5.15s and 5.30s with no contention. Nothing similar remains; no action needed, only do not regress it.

## Runtime State Inventory

Not applicable in the rename/migration sense — Phase 12 changes no identifiers and no stored data. The state that matters is *harness* state:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no schema, draft, or export format changes | none |
| Live service config | None | none |
| OS-registered state | None | none |
| Secrets/env vars | `CUMPA_RELEASE_SUPPORT_SERVICE_URL` (operator-held) needed only by the Vitest acceptance driver, not by the Playwright specs | document; do not require |
| Build artifacts | `dist/web/` is real state, but `verify:semantic-css` and `test:browser` both force `npm run build:web` first, so stale output cannot fake a pass | none |
| Test-run custody | Transient `.tgz` + evidence produced per run under a realpath'd temp dir; both must not pre-exist | document the commands; clean up after |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | everything | ✓ | ≥24 (`engines`) | — |
| Chromium (Playwright) | all browser specs | ✓ | bundled with 1.61.1 | — |
| Git CLI | fixtures | ✓ | — | — |
| `npm pack` + local build | custody inputs | ✓ | proven this session | — |
| `CUMPA_RELEASE_SUPPORT_SERVICE_URL` (real Supabase origin) | `accept:runtime-artifact` driver; real hosted support states | ✗ | — | **Synthetic valid-format origin** for `agent-ready-export.spec.ts:780` (asserts unreachability). No fallback for real verified-state observation. |
| Published `@shipwithai/cumpa` on npm registry | `public-support-states`, `marketplace-review` | ✗ | — | **None.** Documented external prerequisite. |

**Missing dependencies with no fallback:**
- Registry-published artifact + live hosted support origin → `public-support-states.spec.ts` and `marketplace-review.spec.ts` remain externally blocked. Record, do not fake.

**Missing dependencies with fallback:**
- Operator support origin → synthetic format-valid origin fully unblocks `agent-ready-export.spec.ts`.

## Security Domain

`security_enforcement: true`, ASVS level 1. Phase 12 ships **no production code**, so it introduces no new attack surface. The relevant controls are about not *weakening* existing ones through test edits.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | no auth surface; loopback-only |
| V3 Session Management | yes | fragment token guards the loopback API (`pinned-session.spec.ts:1512`) — must keep passing |
| V4 Access Control | yes | server binds `127.0.0.1` on an ephemeral port; captures must come from that, never Vite |
| V5 Input Validation | yes | Zod contracts on draft/export/API — unchanged by this phase |
| V6 Cryptography | yes | SHA-256/SHA-1/SHA-512 archive identity in `runtime-artifact.ts:169-172`; never hand-roll or bypass |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Fabricated acceptance evidence | Spoofing | Evidence is cross-checked against real archive bytes (`runtime-artifact.ts:274-283`); hand-written JSON cannot pass. Never author evidence by hand. |
| Synthetic support origin misread as a real hosted claim | Spoofing | Legitimate only for the *unreachable* support test; `12-VERIFICATION.md` must state the origin was synthetic and no hosted claim is made. |
| Weakening a spec to reach green | Tampering | CON-02 five-condition rule; no `skip`/`fixme`/broadened locator. |
| Supply-chain drift via new dependency | Tampering | `git diff --stat package.json package-lock.json` must be empty (the check Phase 11 used at `11-06-PLAN.md:248`). |
| Secret leakage into artifacts | Information disclosure | `pack-runtime.mjs:654-656` redacts the origin from error output; durable evidence stores only `originSha256`, never the URL. Do not print raw origins into `12-UI-REVIEW.md`. |

## Project Constraints (from CLAUDE.md)

- Node 24 + TypeScript end to end; Fastify bound to `127.0.0.1` on an ephemeral port; Vue 3 + Vite + Monaco; Zod contracts; versioned JSON in `.cumpa/`; Vitest + Playwright. All satisfied by making no production change.
- GSD workflow enforcement: edits go through the phase execution flow, not ad-hoc.
- Project skill `spike-findings-cumpa` exists for implementation patterns.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Re-pointing the five call sites behind `openReviewNotes` makes all 6 tests pass, with no second hidden relocation deeper in each test | Reconciliation | Low — the first failure in each test is the only one observed, but tests abort at first failure, so a later assertion in the same test could hit another relocated surface. The plan should expect one or two iteration rounds, not assume a single-pass fix. |
| A2 | A synthetic support origin is acceptable to the maintainer as local-run configuration | CON-02 | Low — it only exercises the unreachable path the test asserts; if rejected, test `:780` alone reverts to externally blocked. |
| A3 | `full-desktop.png` at `1650×900` has no valid raster reference | Visual evidence | Low — backed by md5 equality of the two mockup files and by the UI-SPEC's own instruction. |

Everything else in this document is `[VERIFIED]` by a command run in this session or a direct file:line read.

## Open Questions (RESOLVED)

1. **What actually remains?** — Six items, W1–W6 above. Five of six named specs are already reconciled; the sixth was never executed and is broken in exactly one way. No production source change.
2. **What do the two env markers require, and what is the honest CON-02 resolution?** — They are two different problems. `CUMPA_RUNTIME_CUSTODY_DIR` is **locally satisfiable** with `--purpose development-check` (proven), and satisfying it is required work because it unblocks the sixth named spec. `CUMPA_MARKETPLACE_URL_MARKER` and the public-support path require a registry-published artifact and a live hosted support origin; record them as documented external prerequisites with the three-point rationale above. No skips, no fabricated markers.
3. **CON-03 tooling and cheapest correct path?** — Playwright's role engine, already used 290× / 37×. **No axe, no new dependency.** Extend `responsive-session.spec.ts` with the Tab-order traversal; assert the existing matrix coverage as a ledger rather than duplicating it.
4. **Is the ReviewToolbar gap a one-line fix, and who owns it?** — Yes, `role="group"` on `ReviewToolbar.vue:25`. **Phase 11 owns it and Phase 12 must not apply it** (`12-UI-SPEC.md:182`). The file is byte-unchanged across the milestone, so nothing regressed; record it as an owning-phase finding with that `git log` evidence and escalate to the milestone owner.
5. **CON-01: one spec or several? Worth adding an end-to-end proof?** — Spread across five specs covering all 8 steps (table above). **Not worth adding one** — a seventh packaged mega-spec costs minutes of runtime and duplicates existing coverage, and criterion 1 explicitly wants a human. Assert the coverage table, run the journey by hand, record the dossier.
6. **Visual evidence: scriptable or inherently manual?** — Scriptable, and should be scripted as a throwaway Playwright capture script driving the real packaged CLI, reproducing the `11-UI-REVIEW.md:21-27` measurement shape. Capture desktop at **1440×1000** (not Phase 11's 1440×900) and never overlay `full-desktop.png` against the duplicate `01b-desktop-full.png`.
7. **Remaining flakiness / semantic-CSS risk?** — The packer lock and `NODE_ENV` issues are fixed and re-verified (two clean 5s packs). The live risks are the symlinked-tmp packer rejection (Pitfall 3) and the support-config gating (Pitfall 4), both documented with workarounds. The semantic CSS gate cannot be tripped by a phase that changes no CSS; if a plan proposes a CSS change, that is an owning-phase finding.

## Sources

### Primary (HIGH confidence)
- Commands run this session: `npm run pack:runtime-artifact` (×3, 2 successes), `npx playwright test --config playwright.runtime-artifact.config.ts` (×3: 6 failed / 1 passed in 450.94s; 1 failed in 15.52s; 1 failed in 130.02s), `npx playwright test --list` (103 tests / 20 files), `git diff --stat f810081 HEAD`, `git log f810081..HEAD -- src/web/components/ReviewToolbar.vue` (empty), `md5sum mockups/01b-desktop*.png`, PNG IHDR reads.
- Direct file reads: `playwright.config.ts:6-9`, `playwright.runtime-artifact.config.ts:5-11`, `tests/helpers/runtime-artifact.ts:47-48,169-172,254-288`, `tests/helpers/acceptance-runtime.ts:66-88`, `tests/package/agent-ready-export.test.ts:135-175`, `tests/e2e/agent-ready-export.spec.ts:268-280,299-301,549-551,812-822`, `tests/e2e/public-support-states.spec.ts:327-331`, `tests/e2e/marketplace-review.spec.ts:97-99`, `tests/e2e/complete-review-draft.spec.ts:152-157`, `tests/integration/anchored-workspace.spec.ts:544-580`, `scripts/pack-runtime.mjs:30,200-217,229-247,462-463`, `scripts/verify-semantic-css.mjs:60-245`, `src/web/components/ReviewToolbar.vue:24-96`, `src/web/components/ReviewNotesDialog.vue:110-113,190-191`, `src/web/components/IdentityHeader.vue:112-130`, `src/web/App.vue:162`, `.planning/config.json`.
- Planning artifacts: `12-UI-SPEC.md`, `12-CONTEXT.md`, `ROADMAP.md:140-175`, `REQUIREMENTS.md:52-54,65,106-108`, `11-UI-REVIEW.md:1-60`, `11-SECURITY.md`, `11-VERIFICATION.md`, `08-VERIFICATION.md:66-68`, `07-06-SUMMARY.md:101`, `04-03-PLAN.md:95`.

### Secondary (MEDIUM confidence)
- User-reported current state (unit 186, git 69, api 142, browser 99 passed, gates green) — treated as ground truth per assignment, not re-run.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- What remains: HIGH — every claim is a command run or a file:line read this session.
- CON-02 resolution: HIGH — the local custody path and the single shared root cause were both executed and observed.
- CON-03 path: HIGH — dependency list and assertion counts are mechanical; the toolbar gap is confirmed by source read plus empty milestone git log.
- Visual evidence: HIGH on the raster facts (md5, IHDR), MEDIUM on scriptability (Phase 09–11 did it live; no script was retained to copy).
- Reconciliation effort: MEDIUM — see assumption A1; tests abort at first failure, so a second relocated surface may surface during execution.

**Research date:** 2026-09-14
**Valid until:** 2026-10-14 (stable — no fast-moving external dependency; invalidated only by further source changes to `src/web/`)
