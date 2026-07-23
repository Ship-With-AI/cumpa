# Phase 04 Plan 01 Reconciliation

## Status

**Approved for Phase 4 source planning only.** Native exchange remains unbuilt and unapproved.

## Grounded seam owners

| Seam | Owner | Evidence | Substitution |
|---|---|---|---|
| sharedSchema | `src/contracts/draft.ts` | `ReviewDraftV1Schema` | `shared-schema` |
| draftStore | `src/server/draft-store.ts` | `createDraftStore` | `draft-store` |
| draftAnchorVocabulary | `src/contracts/draft.ts` | `DurableAnchorV1Schema` | `draft-anchor-vocabulary` |
| exactPathIdentity | `src/domain/path-bytes.ts` | `compareExactPaths` | `exact-path-identity` |
| comparisonInventory | `src/git/inventory.ts` | `createChangedFileInventory` | `comparison-inventory` |
| selectorDriftResolver | `src/git/selector-drift.ts` | `createSelectorDriftObserver` | `selector-drift-resolver` |
| safeGitRunner | `src/git/runner.ts` | `createGitRunner` | `safe-git-runner` |
| securedRouteRegistry | `src/server/routes.ts` | `registerSessionRoutes` | `secured-route-registry` |
| capabilityRegistry | `src/server/capabilities.ts` | `createCapabilityRegistry` | `capability-registry` |
| apiClient | `src/web/api/client.ts` | `createSessionClient` | `api-client` |
| canonicalBrowserState | `src/web/model/review-draft-state.ts` | `createReviewDraftState` | `canonical-browser-state` |
| reviewPanel | `src/web/components/ReviewPanel.vue` | `defineExpose` | `review-panel` |
| uiPrimitives | `src/web/components/ui/UiPrimitives.vue` | `defineProps` | `ui-primitives` |
| filesystemFaultPort | `src/server/draft-store.ts` | `DraftFileSystem` | `filesystem-fault-port` |
| platformRevealAdapter | `src/cli/run.ts` | `revealDraftFile` | `platform-reveal-adapter` |
| packageRunner | `scripts/run-focused-vitest.mjs` | `vitestArguments` | `package-runner` |
| browserRunner | `playwright.config.ts` | `defineConfig` | `browser-runner` |

## Focused commands

- `04-02-canonical`: `/Users/alessandro/.local/share/fnm/node-versions/v24.15.0/installation/bin/node` `scripts/run-focused-vitest.mjs` `tests/unit`
- `04-03-export-api`: `/Users/alessandro/projects/diff-review/node_modules/.bin/vitest` `run` `tests/api`
- `04-03-native-exchange`: `/Users/alessandro/.local/share/fnm/node-versions/v24.15.0/installation/bin/node` `scripts/run-focused-vitest.mjs` `tests/unit`
- `04-03-publication-faults`: `/Users/alessandro/projects/diff-review/node_modules/.bin/vitest` `run` `tests/api`
- `04-04-inventory-ignore`: `/Users/alessandro/.local/share/fnm/node-versions/v24.15.0/installation/bin/node` `scripts/run-focused-vitest.mjs` `tests/git`
- `04-04-gitignore-api`: `/Users/alessandro/projects/diff-review/node_modules/.bin/vitest` `run` `tests/api`
- `04-05-export-ui-states`: `/Users/alessandro/.local/share/fnm/node-versions/v24.15.0/installation/bin/node` `scripts/run-focused-vitest.mjs` `tests/unit`
- `04-06-receipt-ignore-ui`: `/Users/alessandro/projects/diff-review/node_modules/.bin/playwright` `test` `tests/integration`
- `04-07-source-snapshot`: `/Users/alessandro/.local/share/fnm/node-versions/v24.15.0/installation/bin/node` `scripts/run-focused-vitest.mjs` `tests/git`
- `04-07-real-fs-recovery`: `/Users/alessandro/projects/diff-review/node_modules/.bin/vitest` `run` `tests/api`
- `04-08-packaged-export`: `/Users/alessandro/.local/share/fnm/node-versions/v24.15.0/installation/bin/node` `test` `tests/e2e`

## Package and publication disposition

- Package manager: npm; required installs: none.
- Manifest: `package.json`; lockfile: `package-lock.json`.
- Declared packaging targets: 0.
- Publication policy: `native-exchange-probe-pending`; every target capability is pending.
- Reusable reveal adapter: `src/cli/run.ts`; no export-directory reveal route is asserted.

## Failures

None.
