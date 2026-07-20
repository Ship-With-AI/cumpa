---
phase: 01-pinned-local-comparison
plan: 01
subsystem: packaging
tags: [node-24, npm, typescript, vite, vue, playwright, supply-chain, tdd]

requires: []
provides:
  - Audited and exactly pinned Node 24 dependency graph
  - Generated diff-review executable with a compiled production entry
  - Production-built Vue loading shell packaged as hashed Vite assets
  - Focused packaged-artifact RED/GREEN smoke contract
affects: [01-02-native-git-core, 01-03-loopback-session, package-release]

tech-stack:
  added: [commander, inquirer-search, fastify, fastify-static, zod, open, vue, vite, vite-plugin-vue, typescript, node-types, vue-tsc, vitest, playwright]
  patterns: [exact direct dependency pins, generated executable wrapper, production-only package inventory, focused package smoke]

key-files:
  created:
    - package.json
    - package-lock.json
    - tsconfig.json
    - vite.config.ts
    - scripts/build-bin.mjs
    - scripts/verify-prerequisites.mjs
    - src/cli/run.ts
    - src/web/index.html
    - src/web/main.ts
    - src/web/App.vue
    - tests/e2e/package-assets.spec.ts
  modified:
    - .gitignore

key-decisions:
  - "Install only the fourteen independently audited exact releases and reject any unapproved direct dependency."
  - "Generate dist/bin/diff-review.mjs deterministically and have it import the compiled dist/cli/run.js production entry."
  - "Publish only dist runtime output; TypeScript, Vue source, tests, and development configuration stay outside the tarball."

patterns-established:
  - "Package scripts separate generated-bin, Node, Vue, and focused unit/Git/API/package verification boundaries."
  - "The packaged smoke builds, packs, extracts, and executes the release artifact before asserting hashed Vue output."

requirements-completed: []
duration: 11min
completed: 2026-07-20
status: complete
---

# Phase 1 Plan 1: Audited Package and Production Asset Boundary Summary

**Fourteen approved exact releases locked behind an independently audited supply-chain gate, with a generated Node executable and real production-built Vue loading shell proven through the packed artifact.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-07-20T09:06:55Z
- **Completed:** 2026-07-20T09:18:10Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments

- Preserved Task 1's independently gathered registry evidence and recorded the human's approval of all fourteen exact releases plus both compatibility groups before installation.
- Established one Node 24 ESM package with exact direct pins, deterministic executable generation, Node/shared compilation, a Vite production build rooted at `src/web`, and focused test-category scripts.
- Proved the package contract as genuine RED at the missing Vue production output, then GREEN after mounting the exact `App.vue` production root.
- Verified the release tarball contains the generated bin, compiled runtime entry, Vite index, and hashed CSS/JavaScript assets, while excluding TypeScript and Vue source.

## Task Commits

1. **Task 1: Approve every exact package release independently** — approved checkpoint; no repository edit or commit by design.
2. **Task 2: RED — specify the packed executable and production assets** — `cdf6f82` (`test`)
3. **Task 3: GREEN — generate the bin and minimal production Vue asset** — `85733e3` (`feat`)

The plan metadata is committed separately with this summary, `STATE.md`, and `ROADMAP.md` after the required self-check.

## Task 1: Approved Exact-Release Audit

The following evidence is copied from the completed independent audit produced by `Plan0101Fresh`. Each exact release was queried in its own successful `npm view <name>@<version> version maintainers repository time engines peerDependencies scripts dist deprecation` invocation. Supplemental read-only exact-version projections captured publisher, exact publication time, lifecycle scripts, integrity, signatures, attestations/provenance, and deprecation. No install, edit, or commit occurred before approval.

Evidence conventions:

- Every exact registry document returned `deprecation: null` and is recorded as **not deprecated**.
- Every release returned one npm registry signature using key ID `SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U`.
- No release returned `preinstall`, `install`, or `postinstall`. Fastify and Zod returned only publish-time `prepublishOnly` scripts.
- `None published` means the exact-version registry document returned no value for that field.
- No row was classified `SLOP`. The nine `SUS` rows were flagged solely for release freshness and were explicitly approved by the human.

### Complete approved release rows and dispositions

| # | Exact release | Identity and publication | Runtime contract | Lifecycle and deprecation | Distribution evidence | Audit verdict | Human disposition |
|---:|---|---|---|---|---|---|---|
| 1 | [`commander@15.0.0`](https://www.npmjs.com/package/commander/v/15.0.0) | Publisher `abetomo`; maintainers `shadowspawn`, `abetomo`; repo `github.com/tj/commander.js`; published `2026-05-29T09:16:23.076Z` | Node `>=22.12.0`; peers none published | No lifecycle scripts; not deprecated | Integrity `sha512-z67u4ZhzCL/Tydu1lJARtEZYWbWaN7oYLHbsuzocr6y4N6WZAagG3RQ4FW61V1/0+jImpj293XfrcYnd1qxtPg==`; shasum `96f3961f12adac1799ef3fbd8bc61d40572d1b11`; 1 signature; no attestation published | `OK` | **Approved exact release.** Established upstream and maintainers; signed; Node 24 satisfies engine. |
| 2 | [`@inquirer/search@4.2.1`](https://www.npmjs.com/package/@inquirer/search/v/4.2.1) | Publisher `sboudrias`; maintainers `sboudrias`, `mischah`; repo `github.com/SBoudrias/Inquirer.js`; published `2026-05-29T21:56:36.764Z` | Node `>=23.5.0 || ^22.13.0 || ^20.17.0`; peer `@types/node >=18` | No lifecycle scripts; not deprecated | Integrity `sha512-xJj8QWKRSrfKoBIITLZK61dD3zwo0Rz11fgDImku30/Oe81zMdIdGgrLY2h6RkJ+KZ/GhNYIRMKnH/62qBTA5g==`; shasum `c8f4b78ab3f866fdf0503fac0cd08c4a6661c11e`; 1 signature; no attestation published | `OK` | **Approved exact release.** Node 24 and `@types/node@24.11.1` satisfy its ranges. |
| 3 | [`fastify@5.10.0`](https://www.npmjs.com/package/fastify/v/5.10.0) | Publisher `eomm`; maintainers `jsumners`, `delvedor`, `matteo.collina`, `eomm`, `climba03003`; repo `github.com/fastify/fastify`; published `2026-07-05T09:37:01.564Z` | Engines none published; peers none published | `prepublishOnly = cross-env PREPUBLISH=true borp --reporter=@jsumners/line-reporter && npm run test:validator:integrity && npm run build:sync-version`; no install-time lifecycle; not deprecated | Integrity `sha512-A9L0ziuWGQHgEEVgF3davQ9vbD93IuX+lo2IsxapQmu5b/Y/ynn9m9K5JHt9dvyJXOFc5iN0Zk5GHEOqnzhWjg==`; shasum `3c94a52439259a66889dbad14e0fc3d6b1bc934e`; 1 signature; no attestation published | `SUS` — release freshness only | **Approved exact release.** Known Fastify identity; signed; no install hook; static compatibility approved. |
| 4 | [`@fastify/static@9.3.0`](https://www.npmjs.com/package/@fastify/static/v/9.3.0) | Publisher `eomm`; maintainers `simoneb`, `delvedor`, `matteo.collina`, `jsumners`, `zekth`, `eomm`, `fox1t`, `airhorns`, `kibertoad`, `climba03003`, `galvez`, `simenb`, `gurgunday`, `tony133`, `metcoder95`, `jean-michelet`, `ilteoood`, `fdawgs`; repo `github.com/fastify/fastify-static`; published `2026-07-08T16:09:11.804Z` | Engines none published; peers none published | No lifecycle scripts; not deprecated | Integrity `sha512-9YMYRpCOtMBrqKYWcqiw7ykOrn4D0jogHpJrFS0KGeSuOwzKMM5/mjj7B0CFLVoQ6htqKYw//Zs7APn9DBq05w==`; shasum `9f1cba8dafca7c1178110e5b29bae6e81b1ce0a9`; 1 signature; no provenance field returned | `SUS` — release freshness only | **Approved exact release.** Official compatibility table admits Fastify 5.10.0. |
| 5 | [`zod@4.4.3`](https://www.npmjs.com/package/zod/v/4.4.3) | Publisher `GitHub Actions <npm-oidc-no-reply@github.com>`; maintainer `colinhacks`; repo `github.com/colinhacks/zod`; published `2026-05-04T07:06:40.819Z` | Engines none published; peers none published | `prepublishOnly = tsx ../../scripts/check-versions.ts`; no install-time lifecycle; not deprecated | Integrity `sha512-ytENFjIJFl2UwYglde2jchW2Hwm4GJFLDiSXWdTrJQBIN9Fcyp7n4DhxJEiWNAJMV1/BqWfW/kkg71UDcHJyTQ==`; shasum `b680f172885d18bbebf21a834ea25e55a1bbf356`; 1 signature; SLSA v1 `https://registry.npmjs.org/-/npm/v1/attestations/zod@4.4.3` | `OK` | **Approved exact release.** Known maintainer, trusted OIDC, signature and SLSA provenance, no install hook. |
| 6 | [`open@11.0.0`](https://www.npmjs.com/package/open/v/11.0.0) | Publisher/maintainer `sindresorhus`; repo `github.com/sindresorhus/open`; published `2025-11-15T08:22:54.225Z` | Node `>=20`; peers none published | No lifecycle scripts; not deprecated | Integrity `sha512-smsWv2LzFjP03xmvFoJ331ss6h+jixfA4UUV/Bsiyuu4YJPfN+FIQGOIiv4w9/+MoHkfkJ22UIaQWRVFRfH6Vw==`; shasum `897e6132f994d3554cbcf72e0df98f176a7e5f62`; 1 signature; no attestation published | `OK` | **Approved exact release.** Established publisher; signed; no install hook; Node 24 satisfies engine. |
| 7 | [`vue@3.5.39`](https://www.npmjs.com/package/vue/v/3.5.39) | Publisher `GitHub Actions <npm-oidc-no-reply@github.com>`; maintainers `yyx990803`, `posva`; repo `github.com/vuejs/core`; published `2026-06-25T09:44:00.706Z` | Engines none published; peer `typescript *` | No lifecycle scripts; not deprecated | Integrity `sha512-xmZCYabFGcirU8r0fTuvl/LICc1OU620rnqepaJDL/a141ZigkG7AyaxQLdqJ02ZRYzWe6YPaDHeQx7MfknQfA==`; shasum `0bb8d63bf2a75860e282bc054d19e625f5834224`; 1 signature; SLSA v1 `https://registry.npmjs.org/-/npm/v1/attestations/vue@3.5.39` | `SUS` — release freshness only | **Approved exact release.** Official identity and trusted OIDC; TypeScript 7 and plugin-vue ranges are compatible. |
| 8 | [`vite@8.1.4`](https://www.npmjs.com/package/vite/v/8.1.4) | Publisher `GitHub Actions <npm-oidc-no-reply@github.com>`; maintainers `yyx990803`, `vitebot`; repo `github.com/vitejs/vite`, directory `packages/vite`; published `2026-07-09T04:44:45.017Z` | Node `^20.19.0 || >=22.12.0`; peers `tsx ^4.8.1`, `jiti >=1.21.0`, `less ^4.0.0`, `sass ^1.70.0`, `yaml ^2.4.2`, `stylus >=0.54.8`, `terser ^5.16.0`, `esbuild ^0.27.0 || ^0.28.0`, `sugarss ^5.0.0`, `@types/node ^20.19.0 || >=22.12.0`, `sass-embedded ^1.70.0`, `@vitejs/devtools ^0.3.0` | No lifecycle scripts; not deprecated | Integrity `sha512-bTT9PsdWO+MQMNG9ZXIP/qM9wGh37DFxTV/sPq9cFpHr3w4jkgef032PkAL9jAqhk3Nz8NQw3O8n6/xFkqO4QQ==`; shasum `3cd711f31de805e5154ab47948349e693314d581`; 1 signature; attestation URL `https://registry.npmjs.org/-/npm/v1/attestations/vite@8.1.4` | `SUS` — release freshness only | **Approved exact release.** Node/types ranges satisfied; plugin-vue explicitly peers with Vite 8. |
| 9 | [`@vitejs/plugin-vue@6.0.7`](https://www.npmjs.com/package/@vitejs/plugin-vue/v/6.0.7) | Publisher `GitHub Actions <npm-oidc-no-reply@github.com>`; maintainers `yyx990803`, `vitebot`, `sxzz`; repo `github.com/vitejs/vite-plugin-vue`, directory `packages/plugin-vue`; published `2026-05-15T04:07:59.852Z` | Node `^20.19.0 || >=22.12.0`; peers `vue ^3.2.25`, `vite ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0` | No lifecycle scripts; not deprecated | Integrity `sha512-km+p+XdSz9Sxm5rqUbqcSfZYaAniKxWBj1KURl+Jr7UaPvvX7BmaWMdP69I5rrFDeQGyxAG7NXdc57vz+snhWg==`; shasum `194235d364a2c601c521b0410e524e521119059f`; 1 signature; SLSA v1 `https://registry.npmjs.org/-/npm/v1/attestations/@vitejs%2fplugin-vue@6.0.7` | `OK` | **Approved exact release.** Exact peers admit Vite 8.1.4 and Vue 3.5.39; Node 24 admitted. |
| 10 | [`typescript@7.0.2`](https://www.npmjs.com/package/typescript/v/7.0.2) | Publisher `microsoft1es`; maintainers `microsoft1es`, `typescript-bot`, `weswigham`, `andrewbranch`, `typescript-deploys`, `microsoft-oss-releases`, `jakebailey`; repo `github.com/microsoft/TypeScript`; published `2026-07-08T15:55:18.431Z` | Node `>=16.20.0`; peers none published | No lifecycle scripts; not deprecated | Integrity `sha512-8FYau96o3NKOhbjKi/qNvG/W5jhzxkbdm5sj9AbZ/5T5sWqn3hJgLfGx27sRKZWTvyzCP8dLRBTf5tBTSRVUNA==`; shasum `9ec773d7954a8c182c17cc5bbd575aa28bc51582`; 1 signature; no attestation published | `SUS` — release freshness only | **Approved exact release.** Microsoft identity/signature; Node 24 satisfies engine; Vue and vue-tsc peers admit it. |
| 11 | [`@types/node@24.11.1`](https://www.npmjs.com/package/@types/node/v/24.11.1) | Publisher/maintainer `types <ts-npm-types@microsoft.com>`; repo `github.com/DefinitelyTyped/DefinitelyTyped`, directory `types/node`; published `2026-03-05T23:32:56.384Z` | Engines none published; peers empty object | No lifecycle scripts; not deprecated | Integrity `sha512-MOw3rIVR4djfMH7ft9ZJLPViaJwkZvMfrzumElas79IwMUEl8ykkuQmgL9MAMz7vO8G3vuz9b7Gu+keYZx7Xrw==`; shasum `3509391e756e3786d47fb356b550272771588771`; 1 signature; no attestation published | `SUS` — latest-publication seam; intentionally pinned to Node 24 major | **Approved exact release.** DefinitelyTyped/Microsoft signed release; satisfies Inquirer, Vite, and Vitest ranges. |
| 12 | [`vue-tsc@3.3.7`](https://www.npmjs.com/package/vue-tsc/v/3.3.7) | Publisher `GitHub Actions <npm-oidc-no-reply@github.com>`; maintainers `johnsoncodehk`, `kazariex`; repo `github.com/vuejs/language-tools`, directory `packages/tsc`; published `2026-07-08T03:44:57.611Z` | Engines none published; peer `typescript >=5.0.0` | No lifecycle scripts; not deprecated | Integrity `sha512-+C+rgD49wAQ5bUTl2sp5a8Bzg4YoldMNXM+g7CFe604MYcQ8PrZPMQhIjJSzKXtPBCa+C5ayMipqjbA7splekQ==`; shasum `bbe14cd97b3cb72618ed775253d01b76d2992014`; 1 signature; SLSA v1 `https://registry.npmjs.org/-/npm/v1/attestations/vue-tsc@3.3.7` | `SUS` — release freshness only | **Approved exact release.** TypeScript 7 satisfies `>=5`; known Vue repo and trusted OIDC/SLSA provenance. |
| 13 | [`vitest@4.1.10`](https://www.npmjs.com/package/vitest/v/4.1.10) | Publisher trusted GitHub OIDC `GitHub Actions`, approved by `oreanno`; maintainers `ariperkkio`, `antfu`, `hiogawa`, `oreanno`, `yyx990803`; repo `github.com/vitest-dev/vitest`, directory `packages/vitest`; published `2026-07-06T06:44:42.684Z` | Node `^20.0.0 || ^22.0.0 || >=24.0.0`; peers `vite ^6 || ^7 || ^8`, `jsdom *`, `happy-dom *`, `@vitest/ui 4.1.10`, `@types/node ^20 || ^22 || >=24`, `@edge-runtime/vm *`, `@opentelemetry/api ^1.9.0`, `@vitest/coverage-v8 4.1.10`, `@vitest/browser-preview 4.1.10`, `@vitest/coverage-istanbul 4.1.10`, `@vitest/browser-playwright 4.1.10`, `@vitest/browser-webdriverio 4.1.10` | No lifecycle scripts; not deprecated | Integrity `sha512-R9jUTe5S4Qb0HCd4TNqpC7oGcrMssMRGXLW80ubjWsW9VH5GF8y1Y0SFLY9AbqSk6nt0PnOx4H4WNJYZ13GUPw==`; signed distribution; trusted-publisher metadata present | `SUS` — release freshness only | **Approved exact release.** Node 24, Vite 8.1.4, and Node types 24.11.1 satisfy exact ranges. |
| 14 | [`@playwright/test@1.61.1`](https://www.npmjs.com/package/@playwright/test/v/1.61.1) | Publisher `GitHub Actions <npm-oidc-no-reply@github.com>`; maintainers `pavelfeldman`, `yurys`, `dgozman-ms`, `playwright-bot`; repo `github.com/microsoft/playwright`; published `2026-06-23T19:49:12.825Z` | Node `>=18`; peers none published | No lifecycle scripts; not deprecated | Integrity `sha512-8nKv6+0RJSL9FE4jYOEGXnPeM/Hg12qZpmqzZjRh3qM0Y7c3z1mrOTfFLids72RDQYVh9WpLEfR5WdpNX4fkig==`; shasum `48568dc22af7819e55fa5e8e3bc79b7e6a3e6675`; 1 signature; SLSA v1 `https://registry.npmjs.org/-/npm/v1/attestations/@playwright%2ftest@1.61.1` | `SUS` — release freshness only | **Approved exact release.** Microsoft Playwright identity, trusted OIDC/signature/SLSA evidence; Node 24 admitted. |

### Human-approved aggregate disposition

- **Approve exact release:** all fourteen rows above.
- **Replace:** none.
- **Reject:** none; no `SLOP` indicators were found.
- **Approve compatibility group:** `fastify@5.10.0` + `@fastify/static@9.3.0`.
- **Approve compatibility group:** `vite@8.1.4` + `@vitejs/plugin-vue@6.0.7` + `vue@3.5.39` + `typescript@7.0.2` + `vue-tsc@3.3.7`, with Node 24 and `@types/node@24.11.1` supporting constraints checked.

### Compatibility approval evidence

**Fastify/static:** The official `@fastify/static` compatibility table states plugin `>=8.x` supports Fastify `^5.x`, and the plugin declaration documents `fastify: '5.x'`. Exact versions 9.3.0 and 5.10.0 are therefore compatible. Neither exact document publishes a Node engine restriction or an install-time lifecycle script. **Human disposition: approved.**

**Vite/Vue/plugin-vue/TypeScript/vue-tsc:** Node 24 satisfies Vite and plugin-vue's `^20.19.0 || >=22.12.0` engine range. Plugin-vue admits Vite `^8` and Vue `^3.2.25`. Vue admits TypeScript `*`; vue-tsc admits TypeScript `>=5.0.0`; Vite admits `@types/node >=22.12.0`. Vitest's supporting peer edges admit Vite 8 and Node types 24. No published engine or peer conflict exists in the approved exact set. **Human disposition: approved.**

## TDD Evidence

### RED — `cdf6f82`

1. Installed the approved manifest only, using exact version strings and `npm install --save-exact --ignore-scripts`.
2. Ran `npm run verify:prerequisites` — **exit 0**. It reported Node `v24.15.0`, Git available, fourteen approved exact direct releases installed, and successfully generated/compiled the runtime boundary.
3. Ran `npm run test:package -- tests/e2e/package-assets.spec.ts --grep "packed executable contains production Vue assets"` — **exit 1 as required**.
4. The smoke built, packed, extracted, and executed the bin successfully. It reached the named behavioral assertion and failed only because the inventory was `dist/bin/diff-review.mjs`, `dist/cli/run.js`, and `package.json`, without expected `dist/web/index.html`. The exact failing assertion was `expect(inventory).toContain('dist/web/index.html')`.

This proves the RED gate was behavioral rather than a dependency, TypeScript, package, archive, or generated-runtime prerequisite failure.

### GREEN — `85733e3`

- Added `src/web/index.html`, mounted the exact `src/web/App.vue` root from `src/web/main.ts`, and emitted the verified loading state `h1` plus live status.
- Applied the verified system sans stack, dominant/secondary dark surfaces, primary/secondary text tokens, and the 2px `#58A6FF` visible focus token.
- Re-ran the same named package test — **1 passed in 2.8s; exit 0**.
- Ran `npm pack --dry-run` — **exit 0** after the full runtime and Vite production builds.

### TDD gate compliance

`git log --oneline --all --grep="(01-01)"` showed the required ordering:

1. `cdf6f82 test(01-01): specify packed executable and Vue assets`
2. `85733e3 feat(01-01): ship generated bin and production Vue assets`

No separate refactor commit was needed.

## Package Scripts and Generated Entry

| Script | Command | Contract |
|---|---|---|
| `build:bin` | `node scripts/build-bin.mjs` | Removes stale `dist`, writes `dist/bin/diff-review.mjs`, and marks it executable. |
| `build:node` | `tsc --project tsconfig.json` | Compiles Node/shared TypeScript into `dist`. |
| `build:runtime` | `npm run build:bin && npm run build:node` | Generates the executable and its compiled production entry. |
| `build:web` | `vite build` | Builds the Vue root from `src/web` into `dist/web`. |
| `build` | `npm run build:runtime && npm run build:web` | Produces the complete publishable runtime. |
| `prepack` | `npm run build` | Rebuilds runtime output immediately before packaging. |
| `verify:prerequisites` | `node scripts/verify-prerequisites.mjs && npm run build:runtime` | Enforces Node 24, Git availability, installed direct graph, and all fourteen exact approved pins before behavioral tests. |
| `test:unit` | `vitest run tests/unit` | Focused unit category for later dependency-ordered plans. |
| `test:git` | `vitest run tests/git` | Focused real-Git category for Plan 01-02. |
| `test:api` | `vitest run tests/api` | Focused Fastify/API category for later Phase 1 plans. |
| `test:package` | `playwright test` | Focused packaged executable/browser category used here and by Plan 01-03. |

The declared package bin is `diff-review -> dist/bin/diff-review.mjs`. The deterministic generated wrapper imports `../cli/run.js`, so the packed executable reaches compiled production output rather than TypeScript source or an undeclared development path. Its current observable boundary is: `Diff Review production entry reached; local session launch is not wired yet.` Listener/session composition remains correctly deferred to Plan 01-03.

## Dry-Run Pack Inventory

`npm pack --dry-run` built with Vite 8.1.4 and reported six files:

| Packed path | Size | Purpose |
|---|---:|---|
| `dist/bin/diff-review.mjs` | 71 B | Declared executable wrapper |
| `dist/cli/run.js` | 176 B | Compiled production entry |
| `dist/web/assets/index-CqW9eiNa.js` | 59.5 kB | Hashed production Vue JavaScript |
| `dist/web/assets/index-DkK-MnOj.css` | 616 B | Hashed production loading-shell CSS |
| `dist/web/index.html` | 445 B | Production Vite document |
| `package.json` | 1.3 kB | Package metadata and bin mapping |

Tarball evidence: `diff-review-0.0.0.tgz`, 24.9 kB packed, 62.1 kB unpacked, six files, shasum `407cff16c0c1bdf6fe96a3e3640e286980cbce5e`. No `.ts`, `.vue`, `src/`, test, development proxy, or development configuration path appeared in the inventory.

## Files Created/Modified

- `.gitignore` — excludes dependency, generated build, Playwright report, and tarball output without changing `.diff-review/` handling.
- `package.json` — Node 24 ESM package, exact direct releases, generated bin mapping, production build, and focused test scripts.
- `package-lock.json` — npm lockfile for the approved direct graph and its transitive closure.
- `tsconfig.json` — strict NodeNext compilation into `dist`.
- `vite.config.ts` — Vue production build rooted at `src/web`, relative asset base, and isolated `dist/web` output.
- `scripts/build-bin.mjs` — deterministic executable generator.
- `scripts/verify-prerequisites.mjs` — Node/Git/install and exact-approved-release gate.
- `src/cli/run.ts` — compiled not-yet-wired production launch boundary reached by the bin.
- `src/web/index.html` — production Vite document.
- `src/web/main.ts` — exact `App.vue` mount point.
- `src/web/App.vue` — minimal verified loading shell.
- `tests/e2e/package-assets.spec.ts` — package, inventory, extraction, executable, and Vue asset smoke.

## Decisions Made

- Kept all direct versions as exact strings and made the prerequisite verifier reject missing, changed, or additional direct dependencies.
- Used `files: ["dist/"]` as the publish allowlist instead of a source denylist.
- Made the generated wrapper call compiled `dist/cli/run.js`; no TypeScript runtime loader or source fallback is allowed.
- Kept the initial Vue state strictly to the verified loading boundary; Git, listener, session, API, and Monaco behavior remain absent until their dependency-ordered plans.

## Deviations from Plan

None - plan executed exactly as written. The prerequisite verifier, compiled CLI boundary, and generated-artifact ignore rules are direct supporting parts of the planned executable/package contract.

## Issues Encountered

None. The planned RED failure occurred at the exact missing Vue asset assertion and was resolved by the planned GREEN production bootstrap.

## Known Stubs

The CLI intentionally reports the plan-specified not-yet-wired launch boundary. This is not a fake fallback: it is the observable production entry required by this plan, and Plan 01-03 owns loopback session composition. No stub prevents Plan 01-01's package/build/asset goal.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 01-02 can extend the compiled CLI entry and use the existing `test:git` category without creating a second package or runtime boundary.
- Plan 01-03 can extend the exact mounted `App.vue` root and existing `test:package` category for loopback lifecycle behavior.
- No blocker remains for the next dependency-ordered plan.

## Self-Check: PASSED

- All eleven key created artifacts and this summary exist on disk.
- RED commit `cdf6f82` and later GREEN commit `85733e3` exist in history in the required order.
- Focused GREEN package smoke and dry-run pack audit both exited 0.

---
*Phase: 01-pinned-local-comparison*
*Completed: 2026-07-20*
