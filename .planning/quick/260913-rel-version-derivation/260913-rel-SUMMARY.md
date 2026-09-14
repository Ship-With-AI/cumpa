# Quick Task 260913-rel — Derive release identity and publish 1.5.1

**Date:** 2026-09-13 / 2026-09-14
**Outcome:** `@shipwithai/cumpa@1.5.1` published to the public npm registry with verified provenance.

## Goal

Ship the app-side voluntary-support fix (bounded 600 s polling plus a terminal
`notConfirmed` dialog state, so a failed Restore can no longer hold the modal
open forever) as a stable release.

## What changed

### Version derivation

Retargeting roughly 107 hardcoded `1.5.0` pins for every future release was the
alternative; deriving the identity once was chosen instead.

`scripts/release-identity.mjs` is a stdlib-only ESM accessor that reads the
manifest through `new URL('../package.json', import.meta.url)` rather than
`process.cwd()`, asserts the package name and version shape, and exports
`version`, `packageLabel`, `archiveBasename`, `registryTarballUrl`,
`packumentUrl`, `provenanceSubject`, `bootstrapVersion`, plus an
`import.meta.main` CLI (`--github-env`, `--github-output`, `<fieldName>`) so the
workflow can consume the same values it does.

Consumers derived from it: `scripts/pack-runtime.mjs`,
`scripts/verify-production-artifacts.mjs`, `scripts/verify-npm-release.mjs`,
`src/.../runtime-artifact.ts`, `.github/workflows/publish-npm.yml`, and the
matching tests. Future releases are now a version bump.

This is safe because the candidate job's first executable step requires
`vars.CUMPA_RELEASE_SOURCE_SHA` to be 40-hex and exactly equal to `GITHUB_SHA`
before checkout, install, or origin use, so the tree is SHA-pinned before
anything reads a version from it. The publisher still binds to the exact archive
digest the candidate built.

Historical pins stay literal at `1.5.0` on purpose: the bootstrap history in
`docs/distribution-operations.md`, the Phase 7 acceptance pins, the semver
vectors in `tests/cli/check-cumpa.test.ts`, and the acceptance-evidence writer.
`mismatchedVersion` in `npm-release-verifier.test.ts` moved from `'1.5.1'` to
`'9999.0.0'` — the bump would otherwise have made a deliberately-wrong value
correct and silently deleted its own rejection coverage.

The workflow concurrency group also changed from `cumpa-npm-stable-1.5.0` to
`cumpa-npm-stable`, so it serializes all stable publishes rather than only those
of one version.

### Three candidate failures, one root cause

Phase 7 commit `f3b9079` (WR-01) changed the local-archive acceptance record
from `sourceControl: { unchanged }` to
`sourceControl: { unchanged, scenarios: [{ name, unchanged }] }`. Three strict
validators consumed that record, and only one of them runs in the default vitest
suite, so each surfaced one CI run at a time:

1. `tests/package/agent-ready-export.test.ts:121` — schema rejected the new key (`c944d09`)
2. the same file's identity fixtures at `:275` — then reported a missing array (`0acbb7c`)
3. `scripts/verify-npm-release.mjs:266` — the sealer, which failed the
   "Seal the verified same-run candidate" step with a deliberately generic
   `npm release verifier failed` (`7c8363e`)

The sealer now requires a non-empty `scenarios` array whose every entry has a
non-empty `name` and `unchanged === true`, so the evidence is validated rather
than merely permitted. Three rejection rows (absent, empty, unasserted) were
added to that suite's existing mutation table so the guard cannot rot the way
the original single flag did.

`tests/package/agent-ready-export.test.ts` is excluded from the default vitest
run and executes only inside the publish candidate job via
`npm run accept:runtime-artifact`. Running
`npx vitest run --config vitest.runtime-artifact.config.ts` locally reproduces
it, leaving only the test that needs the CI-held
`CUMPA_RUNTIME_ACCEPTANCE_REPORT` input.

## Published identity

| Fact | Value |
|---|---|
| Version | `1.5.1` (`latest`) |
| Archive | `shipwithai-cumpa-1.5.1.tgz`, 3514964 bytes |
| sha256 | `c5d0fc640c95490bc3d9eb4b0c6b6908f08901df80a2b4aface846bcc4333696` |
| shasum (sha1) | `d4f7c1cf4afb2f9ae0cc9904911ddd343d67b5f2` |
| integrity | `sha512-L191G9S9x1vMchK28q9z+LBSDO01KLPJ7cyeZ8aZJdu65FGFUxftJT3JX+S8uKaFMCZaSAbEQ12vtHMNjHlr4A==` |
| Evidence seal | `2af2924a39a64eb3d49fe134486c9233b00e774b205b27c53b2fcfc4c2e4d5c9` |
| Source commit | `7c8363ee590940f85bf69ecd8e6feea93714bc72` |
| Run / attempt | `34781677356` / 1 |
| Artifact id | `10325108520`, transport digest `sha256:136e41341cadc1e92047e9ec7abcd3bf293d4e23448e1523aaffbd26b03cdf99` |

The archive was hashed locally before publication and the registry's own
integrity and shasum match those bytes exactly, so the published payload is
byte-identical to the artifact that was inspected and approved.

## Verification

- Refactor proven green at `1.5.0` before the bump: 520 tests / 65 files,
  17 deno tests, all typechecks clean, zero non-bootstrap `1.5.0` literals left
  in the pipeline. The bump itself touched only `package.json` and
  `package-lock.json` (3 lines) and needed no test edits.
- `npm audit signatures --json --include-attestations`: 0 invalid, 0 missing;
  `@shipwithai/cumpa@1.5.1` carries both the npm publish attestation and SLSA
  provenance (transparency-log index `2827290386`).
- Provenance binds subject `pkg:npm/@shipwithai/cumpa@1.5.1` to workflow
  `.github/workflows/publish-npm.yml`, commit `7c8363ee`, and invocation
  `runs/34781677356/attempts/1`.
- Clean isolated global install and literal
  `npx --yes @shipwithai/cumpa@1.5.1 --version` both report `1.5.1`.

`npm publish` returned success while the registry still served `1.5.0`, because
npm reported the package as asynchronously processing. Per
`docs/distribution-operations.md:93` this triggered read-only reconciliation
only — no retry, rebuild, rerun, or substitution — and `1.5.1` appeared about
five minutes later with the expected digests.

## Cleanup

Both temporary transports created for this release were removed and their
absence confirmed against the server: the `production/CUMPA_RELEASE_BUILD_ORIGIN`
secret and the `production/CUMPA_RELEASE_SOURCE_SHA` variable. The origin value
was never printed in cleartext; it was verified only by comparing its SHA-256
against the published `1.5.0` launcher's recorded `configuredOriginSha256`.

## Open items

- `SKILL.md` still installs `@1.5.0` and states that only 1.5.0 has independent
  release verification. Its checker accepts `>=1.5.0 <2.0.0`, so `1.5.1` is
  compatible, but updating the marketplace skill needs a separate publication
  authority.
- `.vue` files remain outside `tsc`; `vue-tsc` would close that gap.
- `tests/e2e/file-tree.spec.ts:297` fails pre-existing and unrelated
  (`DirectoryRow.vue:41` renders `tabindex="-1"` for the selected row where the
  spec expects `"0"`). Proven pre-existing by reverting `src/` to `5d2c51a`.
  CI's deploy gate runs only the two support specs, so roughly 95 e2e tests
  never run in CI.

## Commits

`d13e9ba` accessor · `12a7aa5` `8ad94bc` `daeab74` `e5c56e5` `d59d8e8` consumers ·
`87296f6` bump to 1.5.1 · `c944d09` `0acbb7c` `7c8363e` the three WR-01 consumers
