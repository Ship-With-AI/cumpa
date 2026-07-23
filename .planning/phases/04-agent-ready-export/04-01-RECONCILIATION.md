# Phase 04 Plan 01 Reconciliation

## Status

**Approved for Phase 4 source planning only.** This ledger is based on implemented repository files, not prior plan paths. It establishes substitutions for later plans; it does not approve an export implementation or any native exchange behavior.

## Grounded seam owners

| Seam | Owner | Symbol / integration evidence | Substitution |
|---|---|---|---|
| Shared schema | `src/contracts/draft.ts` | `ReviewDraftV1Schema` | `shared-schema` |
| Draft store | `src/server/draft-store.ts` | `createDraftStore` | `draft-store` |
| Draft anchor vocabulary | `src/contracts/draft.ts` | `DurableAnchorV1Schema` | `draft-anchor-vocabulary` |
| Exact path identity | `src/domain/path-bytes.ts` | `compareExactPaths` | `exact-path-identity` |
| Comparison inventory | `src/git/inventory.ts` | `createChangedFileInventory` → `createGitRunner` | `comparison-inventory` |
| Selector drift resolver | `src/git/selector-drift.ts` | `createSelectorDriftObserver` | `selector-drift-resolver` |
| Safe Git runner | `src/git/runner.ts` | `createGitRunner`; `shell: false` | `safe-git-runner` |
| Secured route registry | `src/server/routes.ts` | `registerSessionRoutes`; `app.get(` | `secured-route-registry` |
| Capability registry | `src/server/capabilities.ts` | `createCapabilityRegistry` | `capability-registry` |
| API client | `src/web/api/client.ts` | `createSessionClient` | `api-client` |
| Canonical browser state | `src/web/model/review-draft-state.ts` | `createReviewDraftState` | `canonical-browser-state` |
| Review panel | `src/web/components/ReviewPanel.vue` | `defineExpose({ focusHeading })` | `review-panel` |
| UI primitives | `src/web/components/ui/UiPrimitives.vue` | `defineProps<{` | `ui-primitives` |
| Filesystem fault port | `src/server/draft-store.ts` | `DraftFileSystem` | `filesystem-fault-port` |
| Platform reveal adapter | `src/cli/run.ts` | launch-owned `revealDraftFile`; `open(canonicalPath)` | `platform-reveal-adapter` |
| Focused package runner | `scripts/run-focused-vitest.mjs` | `vitestArguments`; `spawnSync(` | `package-runner` |
| Browser runner | `playwright.config.ts` | `defineConfig(` | `browser-runner` |

The JSON ledger records each complete-file and inclusive-range SHA-256 value. The validator recomputes them, confirms every path is contained, readable, regular, and non-symlink, and checks every symbol/signature/integration token before accepting a seam.

## Focused commands

The ledger contains exactly these existing-runner command keys: `04-02-canonical`, `04-03-export-api`, `04-03-native-exchange`, `04-03-publication-faults`, `04-04-inventory-ignore`, `04-04-gitignore-api`, `04-05-export-ui-states`, `04-06-receipt-ignore-ui`, `04-07-source-snapshot`, `04-07-real-fs-recovery`, and `04-08-packaged-export`. Every command has an absolute executable, explicit argv, repository-root cwd, and hash-bound runner/config evidence. Their planned Phase 4 cases do not yet exist and are not claimed to pass.

## Package, lock, and toolchain evidence

- Package manager: npm, inferred from `package-lock.json`; `package.json` declares no `packageManager`, so the ledger records that fact rather than inventing one.
- Manifest: `package.json`, SHA-256 `339e943ec4ed3c0789fc12c2dc99470e4568dc1f3b46bf1c447b32e582e76d4d`.
- Lockfile: `package-lock.json` (npm lockfile v3), SHA-256 `29880c424203020a1122c4ecf75c29dbe99ea257f0f2fde46a5f336bd903bf1e`.
- Reusable installed dependencies: `zod@4.4.3`, `fastify@5.10.0`, `vitest@4.1.10`, and `@playwright/test@1.61.1`; manifest and lock agree.
- `requiredInstalls` is exactly `[]`.
- Existing build facts are Node `>=24`, `tsconfig.json`, `vite.config.ts`, package `files: ["dist/"]`, and `scripts/build-bin.mjs`. No native compiler, linker, N-API configuration, or OS/architecture packaging target is declared.

## Reveal and publication disposition

The reusable platform reveal behavior is the launch-owned fixed draft-file adapter in `src/cli/run.ts`; it is not an export-directory route. The secured registry and capability registry are separately grounded above. No export-directory reveal endpoint and no native exchange adapter are claimed to exist.

`publicationPolicy.kind` is exactly `native-exchange-probe-pending`. There are no declared packaging targets to preapprove. Plan 04-03 alone may build and probe a narrow adapter for a declared target; only a successful exact-primitive observation and same-filesystem continuous old-or-new probe may promote it. Unexecuted, unsupported, or failed targets must become `reExportUnsupported` and must not use portable/stable-to-backup fallback, absent stable path, or first-export overwrite behavior.

## Failures

None. Validation remains fail-closed: a stale file, ambiguous owner, malformed command, package disagreement, install claim, or unsupported publication policy is a prerequisite error for later plans.
