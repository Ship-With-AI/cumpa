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
npx playwright test --config playwright.runtime-artifact.config.ts \
  tests/e2e/agent-ready-export.spec.ts tests/e2e/package-assets.spec.ts
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
