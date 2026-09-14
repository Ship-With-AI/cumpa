# Phase 12 continuity evidence

## RED baseline

A locally packed development-check artifact supplies the four runtime-artifact custody inputs without an operator secret. The synthetic origin below is intentionally format-valid and unreachable; it enables the support-unavailable scenario without recording a real service origin. Custody and evidence destinations are fresh paths outside the repository; the placeholders below must be replaced with fresh, realpath'd `/private/tmp` destinations for each run.

```bash
CUMPA_RELEASE_SUPPORT_SERVICE_URL="https://abcdefghij0123456789.supabase.co" \
  npm run pack:runtime-artifact -- --purpose development-check \
  --custody-dir <fresh-realpath-custody-dir> \
  --evidence <fresh-realpath-evidence-json>

export CUMPA_RUNTIME_CUSTODY_DIR=<fresh-realpath-custody-dir>
export CUMPA_RUNTIME_ARCHIVE_BASENAME=shipwithai-cumpa-1.5.0.tgz
export CUMPA_RUNTIME_EVIDENCE=<fresh-realpath-evidence-json>
export CUMPA_RUNTIME_ARCHIVE_SHA256=$(node -e "process.stdout.write(require(process.env.CUMPA_RUNTIME_EVIDENCE).archive.sha256)")
npm run test:runtime-artifact
```

Observed on the packed artifact: `tests/e2e/package-assets.spec.ts` passed; `tests/e2e/agent-ready-export.spec.ts` failed all six collected scenarios (7 tests total: 1 passed, 6 failed). The package-assets result isolates the problem to stale presentation locators rather than the custody harness. The `afterAll` source-control evidence gate at `tests/e2e/agent-ready-export.spec.ts:71-80` also failed only because no scenario reached its registration; it clears itself once every scenario passes and requires no edit.

| Test declaration | First failing line | Stale locator / operation | Observation |
| --- | --- | --- | --- |
| `agent-ready-export.spec.ts:380` | `:274` | `button "Write summary"` | The summary trigger moved into the Review notes dialog; the click timed out. |
| `agent-ready-export.spec.ts:524` | `:551` | `region "Finish attached review"` → `button "Finish review"` | The attached-Finish region is absent until Review notes opens. |
| `agent-ready-export.spec.ts:581` | `:594` | `button "Finish review"` | The Finish control is absent until Review notes opens. |
| `agent-ready-export.spec.ts:628` | `:274` via `saveSummary` | `button "Write summary"` | The two isolated-draft sessions reach the same relocated summary control. |
| `agent-ready-export.spec.ts:690` | `:716` | `button "Finish review"` | The exact-patch finish click timed out and its paired response did not arrive. |
| `agent-ready-export.spec.ts:780` | `:819` | `button "Finish review"` | The synthetic configured-but-unreachable support path passed its support assertions, then timed out on the relocated Finish control. |

The only `.skip(` remains the pre-existing local-archive guard at `agent-ready-export.spec.ts:782`; a local development-check artifact is `local-archive`, so the support scenario was collected and executed.

## Re-authoring ledger

Each change satisfies `12-UI-SPEC.md:228-234`: the old target was explicitly relocated; the same packaged production flow still runs; the replacement uses the named dialog surface and retains an observable persistence, HTTP, export-byte, or attached-stdout assertion; it fails if the relocated control regresses; and the test names continue to identify their original covered flow.

| Test | Control | Old scope | New scope | Observable retained |
| --- | --- | --- | --- | --- |
| `agent-ready-export.spec.ts:389` | Write summary / Save summary | Bare page `saveSummary()` | `openReviewNotes()` before summary interaction; `Close review notes` before returning | Accepted draft-mutation HTTP 200 and persisted draft bytes. |
| `agent-ready-export.spec.ts:419` | summary preview / Export review / Export review again | Bare resumed page | `openReviewNotes(resumedPage)` before the preview and both exports | Export HTTP 201 or target-aware 409, complete receipt, and exact `review.json` / `review.md` bytes. |
| `agent-ready-export.spec.ts:534` | Finish attached review | Bare comments rail | Open after the rail at `:558`, close after review-draft navigation, reopen after the rail at `:581` | Disabled Finish while composer text is unsaved, then enabled Finish after clearing it. |
| `agent-ready-export.spec.ts:594` | Finish review | Bare comments rail | `openReviewNotes(page)` after the rail disclosure | Finish HTTP 201 and one canonical V2 attached stdout document. |
| `agent-ready-export.spec.ts:642` | Write summary / Save summary / Finish review | Bare pages | Summary helper opens then closes; each page opens Review notes again before Finish | Distinct persisted drafts, each Finish HTTP 201, and independent attached stdout. |
| `agent-ready-export.spec.ts:706` | Finish review | Bare page after comment | `openReviewNotes(page)` before Finish | Finish HTTP 201 and canonical V3 stdout. |
| `agent-ready-export.spec.ts:797` | Finish review | Bare comments rail | `openReviewNotes(page)` after the rail disclosure | Configured-but-unreachable support remains usable, Finish HTTP 201, canonical V2 stdout. |

The test retains all seven `Finish review` locators, the named `Finish attached review` region, every `waitForResponse` pairing, and the single local-archive `.skip(` guard at `agent-ready-export.spec.ts:799`; no `fixme`, early return, broad locator, or assertion removal was introduced.

## GREEN result

```bash
npx playwright test --config playwright.runtime-artifact.config.ts \
  tests/e2e/agent-ready-export.spec.ts
```

Observed result: **6 passed, 0 failed**. The source-control `afterAll` evidence gate at `agent-ready-export.spec.ts:315-378` cleared without an edit because each scenario registered its unchanged-source result. `npx tsc --noEmit -p tsconfig.json` also passed.
The named explicit-path command shown below then ran the same six flows plus `package-assets.spec.ts`: **7 passed, 0 failed**.

## Runner reachability

The spec had zero executions during the restyle milestone: `playwright.config.ts:6-9` excludes both runtime-artifact specs from the default `test:browser` path, and `tests/package/agent-ready-export.test.ts:134-178` reaches its Playwright command only after requiring `CUMPA_RELEASE_SUPPORT_SERVICE_URL` and an acceptance report. The default-suite exclusion remains intentional: `tests/helpers/runtime-artifact.ts:259-276` throws without all four custody inputs, so adding this spec to `npm run test:browser` would fail every ordinary developer invocation.

`package.json` exposes `test:runtime-artifact`, which runs only `agent-ready-export.spec.ts` and `package-assets.spec.ts` through `playwright.runtime-artifact.config.ts`. It intentionally accepts supplied custody inputs rather than packing or fabricating them.

Local reproduction:

```bash
CUMPA_RELEASE_SUPPORT_SERVICE_URL="https://abcdefghij0123456789.supabase.co" \
  npm run pack:runtime-artifact -- --purpose development-check \
  --custody-dir <fresh-realpath-custody-dir> \
  --evidence <fresh-realpath-evidence-json>

export CUMPA_RUNTIME_CUSTODY_DIR=<fresh-realpath-custody-dir>
export CUMPA_RUNTIME_ARCHIVE_BASENAME=shipwithai-cumpa-1.5.0.tgz
export CUMPA_RUNTIME_EVIDENCE=<fresh-realpath-evidence-json>
export CUMPA_RUNTIME_ARCHIVE_SHA256=$(node -e "process.stdout.write(require(process.env.CUMPA_RUNTIME_EVIDENCE).archive.sha256)")
npm run test:runtime-artifact
```

The bare local command selects only the two local-custody specs. Extra arguments still pass through, so `npm run test:runtime-artifact -- <path>` remains available to pass an explicit path to Playwright. For a real release with a registry-installed public package, live hosted support origin, and `CUMPA_MARKETPLACE_URL_MARKER`, run the full configured set with `npm run test:runtime-artifact:full`; its `public-support-states.spec.ts` and `marketplace-review.spec.ts` prerequisites are documented external prerequisites, not regressions in this local continuity run.

## Documented external prerequisites

`tests/e2e/public-support-states.spec.ts` and `tests/e2e/marketplace-review.spec.ts` remain executable release-acceptance tests, not skips:

1. `public-support-states.spec.ts:328-329` resolves an acceptance runtime and rejects `local-archive`; it requires a registry-installed public package and a live hosted support origin. The `:348` citation in Phase 08 and Phase 11 evidence is stale at HEAD.
2. `marketplace-review.spec.ts:98` requires `CUMPA_MARKETPLACE_URL_MARKER`, a marker written by a supervised, registry-installed CLI; it also uses the live support observation window.
3. Recording these prerequisites does not violate CON-02: neither spec is among the six ROADMAP presentation-sensitive specs, neither is presentation-sensitive, both failed identically before the restyle (`08-VERIFICATION.md:62-70`), and no skip, fixme, weakened assertion, or fabricated marker was introduced.

The covered local flow — review, comment, export, and Finish — remains proven by the locally packed `agent-ready-export.spec.ts`. What remains unproven locally is only the published registry artifact plus live hosted support states.

## Full suite ledger

| Command | Exit | Passed | Failed | Skipped | Compared with Phase 11 |
|---|---:|---:|---:|---:|---|
| `npm run test:unit` | 0 | 186 | 0 | 0 | Unchanged: 186. |
| `npm run test:git` | 0 | 69 | 0 | 0 | Unchanged: 69. |
| `npm run test:api` | 0 | 142 | 0 | 0 | Unchanged: 142. |
| `npm run verify:semantic-css` | 0 | n/a | 0 | n/a | Passed; script reports no test-count summary. |
| `npm run typecheck:web` | 0 | n/a | 0 | n/a | Passed; compiler reports no test-count summary. |
| `npm run build` | 0 | n/a | 0 | n/a | Passed fresh runtime and web build. |
| `npm run test:browser` | 1 | 99 | 2 | 0 | Same 99 passed / two external prerequisites as Phase 11. |
| `npm run test:runtime-artifact` | 0 | 7 | 0 | 0 | Plan 12-01 repaired flow: six `agent-ready-export` cases plus package-assets. |

The browser result executed all 103 collected tests. Its only failures were the documented external prerequisites: `tests/e2e/marketplace-review.spec.ts:97-99` stopped for missing `CUMPA_MARKETPLACE_URL_MARKER`; `tests/e2e/public-support-states.spec.ts:327-329` stopped when no runtime-custody inputs were configured. Neither was skipped or weakened.

## Six named specs

`npm run test:browser` executed `file-tree.spec.ts`, `pinned-session.spec.ts`, `anchored-review.spec.ts`, `complete-review-draft.spec.ts`, and `responsive-session.spec.ts`. The local-custody `npm run test:runtime-artifact` command executed `agent-ready-export.spec.ts` (six scenarios) together with `package-assets.spec.ts` (one scenario). This split is intentional: default browser configuration excludes the custody-bound runtime artifact suite.

## CON-02 verdict

Covered flows execute. The Plan 12-01 re-authored assertions meet all five reconciliation-rule conditions: each targets the relocated named dialog control, retains the production flow, observes persistence/HTTP/export/attached-stdout behavior, fails if the relocated control regresses, and preserves the flow-identifying test name. No covered flow was skipped. Only the two documented external prerequisites remain.
