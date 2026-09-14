# Quick Task 260914-ci6 — Close the e2e CI gap

**Date:** 2026-09-14  
**Outcome:** The credential-free repository gate now runs the complete non-custody Playwright suite on Ubuntu. Custody specs retain their separate runtime-artifact config and still fail loudly without the required custody environment.

## Delivered

1. `0fdc280 fix(web): move roving tabindex selected file row`
   - `selectFile` makes a visible selected file the roving-tabindex row without assigning focus to a hidden row. The browser regression now proves selection and keyboard navigation remain coherent.
2. `9dd364b refactor(test): share custody spec list between Playwright configs`
   - `playwright.runtime-artifact.config.ts` owns the four exact custody paths; `playwright.config.ts` imports that plain `string[]` as `testIgnore`.
3. `e06db2a test(e2e): separate platform opener evidence from loopback URL acquisition`
   - Loopback URL acquisition is cross-platform. Opener invocation evidence is an explicit Darwin-only test, never a silently conditional assertion.
4. `a60c7b4 fix(test): normalize computed UI font serialization`
   - The authored root UI-font token remains exact; the browser assertion accepts only Chromium's two valid computed serializations.
5. `7e3e476 fix(test): wait for paired Monaco zones to settle`
   - Bounded settlement polls preserve the strict paired-zone geometry, no-reflow, and semantic assertions.
6. `f8a725e test(e2e): isolate darwin draft reveal opener evidence`
   - Fixed reveal remains covered cross-platform; its PATH-intercepted opener marker is Darwin-only.
7. `1d8b990 fix(web): preserve composer through initial diff load`
   - Fixes the real composer draft-loss race exposed while widening the suite.
8. `0a1a359 ci: run the full Playwright suite in the repository gate`
   - The workflow now runs `npx playwright test`; its verifier's substring and exact command-set contracts plus the mutation test were updated atomically.

## Composer draft-loss defect found by the widened gate

This was a **pre-existing product defect that had shipped in `@shipwithai/cumpa@1.5.1`**, not a test tolerance problem. The widened Linux run made the race reproducible.

Instrumenting the pre-fix Noble run of `inline comment persistence --repeat-each=10` yielded **9 passed / 1 failed**. The failed iteration recorded:

```text
[DEBUG-ci6-composer] {"sameNode":false,"inputValue":"","modelText":""}
```

Successful iterations recorded the same DOM node with both values `Please explain this context.`. The replaced textarea and blank live `CommentComposer` prop prove controlled state was lost, not merely observed too early.

Root cause: `PublicMonacoDiffAdapter.setFile()` assigned `currentFile` then awaited its first `onDidUpdateDiff`. If an anchor was activated in that interval, completion unconditionally restored `saved?.composer`; on an initial load this was `undefined`, so the active composer was cleared and zones rebuilt blank. The fix preserves an in-flight active composer for the same file, derives focus from it, and otherwise retains the saved-state restoration path for file switches.

The deterministic adapter regression deliberately holds that first diff callback, activates `head:10`, releases the callback, and requires the active anchor to remain. It was RED before the source change:

```text
expected { fileId: "file_a", side: "head", line: 10 }
received undefined
```

It is GREEN after the fix: `npx vitest run tests/unit/monaco-diff-adapter.test.ts` → **2 passed**. The real unprivileged Noble browser reproduction improved from **9/10 to 10/10**.

## Linux proof gate

The full suite was proven before the CI command changed with:

```sh
docker run --rm \
  -v /Users/alessandro/projects/diff-review:/work \
  -v cumpa-ci6-composer-debug:/work/node_modules \
  -w /work \
  mcr.microsoft.com/playwright:v1.61.1-noble \
  bash -lc 'apt-get update && apt-get install -y --no-install-recommends build-essential && chown -R ubuntu:ubuntu /work/node_modules && su -s /bin/bash ubuntu -c "umask 022 && git config --global --add safe.directory /work && cd /work && npm ci && npm run build && npx playwright test"'
```

It ran as UID 1000 with `umask 022`: root would preserve archive permissions differently, and the image default `umask 0002` would make built source assets `0664`, unlike the package verifier's expected normalized `0644`. Result: **90 passed, 4 skipped, 0 failed, 0 did not run** in 1.8 minutes.

The only skips were these four explicit Darwin-only tests, all for the same stated reason: the fake opener is intercepted only through `PATH`, which `open` consults for `open` on Darwin; elsewhere `open@11` spawns its bundled absolute `xdg-open`.

1. `tests/e2e/anchored-review.spec.ts` — `packaged anchored review records the darwin opener invocation`
2. `tests/e2e/pinned-session.spec.ts` — `generated CLI records the darwin opener invocation`
3. `tests/e2e/pinned-session.spec.ts` — `generated invalid range does not invoke the darwin opener`
4. `tests/e2e/complete-review-draft.spec.ts` — `newer draft fixed reveal invokes the darwin opener`

## Final verification

| Check | Observed |
|---|---|
| Main Playwright list | `npx playwright test --list` → **94 tests in 17 files** |
| Custody Playwright list | `npx playwright test --config playwright.runtime-artifact.config.ts --list` → **14 tests in 4 files**: package-assets, agent-ready-export, public-support-states, marketplace-review |
| Partition | Main config ignores the exact four paths selected by the custody config: **17 + 4 = all 21 spec files**, disjoint with no orphan |
| Full macOS Playwright | `npx playwright test` → **94 passed**, 0 skipped, 0 failed, 0 did not run (2.2 minutes) |
| Full unprivileged Noble Playwright | **90 passed, 4 skipped**, 0 failed, 0 did not run (1.8 minutes); skips are enumerated above |
| Workflow contract | `node scripts/verify-supabase-support.mjs --verify-workflow .github/workflows/deploy-supabase-production.yml` → exit 0, no output |
| Narrowing rejection | Verifier against a copy narrowed to `tests/e2e/support-payment.spec.ts` → exit 1: `workflow is missing required npx playwright test` |
| Workflow mutation suite | `npx playwright test tests/e2e/support-payment.spec.ts` → **8 passed** |
| Vitest | `npx vitest run --no-file-parallelism` → **65 files, 523 tests passed** |
| Node/test typechecks | `npm run typecheck:tests` → clean |
| Runtime typecheck | `npx tsc --noEmit -p tsconfig.json` → clean |
| Web typecheck | `npm run typecheck:web` → clean |
| Deno | `deno test --allow-env --config supabase/functions/deno.json supabase/functions/tests` → **17 passed** |

The former local baseline's three failures and two did-not-run tests are fully accounted for: the visible file-tree roving-tabindex defect was fixed; the two local custody-environment failures and serially cancelled follow-ups are no longer selected by the main config, while those four custody specs remain active in their dedicated config rather than skipped.

## Cleanup and boundaries

No push, deployment, registry action, remote mutation, formatter, or project-wide linter was run. The temporary `cumpa-ci6-composer-debug` Docker volume is removed after this evidence was recorded.
