---
phase: quick
plan: 260914-hmu
subsystem: distribution
tags: [npm, release, provenance, draft-loss]
requires:
  - phase: quick
    provides: manifest-derived release identity and the widened repository gate
provides:
  - Published @shipwithai/cumpa@1.5.2 carrying the composer draft-loss and roving-tabindex fixes
  - Proof that the shipped fix is present in the published bytes, not only in the version number
affects: [distribution, web workspace]
tech-stack:
  added: []
  patterns: [verify a release payload by bundle delta and commit ancestry, recover a transient transport from the published artifact and verify it by hash alone]
key-files:
  created: []
  modified: [package.json, package-lock.json, tests/integration/monaco-anchor.spec.ts]
key-decisions:
  - "Patch-release the draft-loss fix immediately rather than holding it for the next milestone, since users on 1.5.1 can lose typed comment text."
  - "Treat a UI approval as unproven until pending_deployments is empty; the operator's approval silently failed to register."
  - "Name integration test 6 for what it verifies instead of adding a focus seam to product code for coverage the adapter unit regression already guarantees."
patterns-established:
  - "Never report a publish from the job's exit code: npm returns success while still serving the previous version, so verify the registry."
requirements-completed: []
duration: 2h
completed: 2026-09-14
status: complete
---

# Quick Task 260914-hmu — Release 1.5.2

**Date:** 2026-09-14
**Outcome:** `@shipwithai/cumpa@1.5.2` published to the public npm registry with verified provenance and set as `latest`.

## Why this release

`1.5.1` shipped a user-visible draft-loss defect. `PublicMonacoDiffAdapter.setFile`
awaited Monaco's first diff and then unconditionally restored `saved?.composer`,
which is `undefined` on first load, so an anchor activated during that await
window was discarded together with any text already typed into it. A user could
type a comment and watch it vanish.

The defect was found by the widened CI gate built in quick task `260914-ci6` —
the gate's first catch, and the strongest available argument for it.

Payload:

- `1d8b990` + `505ba43` — composer preserved through the initial diff load
- `0fdc280` — file-tree roving tabindex follows selection (the selected row is
  the tabbable one, so Tab no longer lands on a different row)

## The bump was three lines

`scripts/release-identity.mjs` derives every identity value from the manifest,
so this release changed only `package.json` and `package-lock.json`:

```
 package-lock.json | 4 ++--
 package.json      | 2 +-
```

No version pins were retargeted and **no test needed editing** — 65 files / 524
tests passed unchanged, which is the payoff of the derivation refactor done in
`260913-rel`. The candidate build went green on the first attempt, versus three
failed attempts for `1.5.1`.

## Published identity

| Fact | Value |
|---|---|
| Version | `1.5.2` (`latest`) |
| Archive | `shipwithai-cumpa-1.5.2.tgz`, 3515010 bytes |
| sha256 | `2be9f28f2dba36d0c34f5b157bc6dea69eddd9229c114d3bd9c47d4247e712ae` |
| shasum (sha1) | `11be1ac9b3aaf09416063a2792806a752b00cd34` |
| integrity | `sha512-v+qxjF4z+dDi9Hrd7fCfn9GgzzR/3JaSpWhCVNayj3k+ZhadL9kMQWKX+IwuqACKsUt4zN6R2w19dRsFnLZJVg==` |
| Evidence seal | `a8dccc0b01e58bf5e6bac24f9deee5af42918c104d860622f269eb0b7f6bbf02`, `status: verified` |
| Source commit | `d49ed2c96471ae24ab0bc64c50dc0810b4b57d97` |
| Run / attempt | `34834676966` / 1 |
| Artifact id | `10343698191`, transport digest `sha256:0261e55de4ec53b66c3e34c09120c397d87827511f540e198cfb49e6d464876f` |

The archive was hashed locally before publication and the registry's own shasum
and integrity match those bytes exactly, so the published payload is
byte-identical to the artifact that was inspected and approved.

## Verification

- Pre-flight: 65 files / 524 Vitest tests, 17 deno tests, `typecheck:tests`,
  `tsc --noEmit -p tsconfig.json`, and `typecheck:web` all clean.
- `npm audit signatures --json --include-attestations`: 0 invalid, 0 missing;
  `1.5.2` carries both the npm publish attestation and SLSA provenance.
- Provenance binds subject `pkg:npm/@shipwithai/cumpa@1.5.2` to
  `.github/workflows/publish-npm.yml`, commit `d49ed2c`, and invocation
  `runs/34834676966/attempts/1`.
- Clean isolated global install and literal
  `npx --yes @shipwithai/cumpa@1.5.2 --version` both report `1.5.2`.
- **The fix is provably in the published bytes**, not merely in the version
  number: all three fix commits are ancestors of `d49ed2c`, the adapter fix is
  present in that tree, and the published app bundle changed
  (`index` chunk `0839ed6c…` → `544a912c…`) while the Monaco language chunks
  correctly did not.

`npm publish` again returned success while the registry still served `1.5.1`;
per `docs/distribution-operations.md:93` this triggered read-only reconciliation
only — no retry, rebuild, rerun, or substitution — and `1.5.2` appeared about
five minutes later with the expected digests.

## Approval anomaly worth remembering

The operator approved the `npm-release` gate in the GitHub UI, but the approval
never registered: 40 minutes later the API still reported a live pending
deployment on `npm-release` awaiting reviewer `alemagio`, with no newer run and
the registry still at `1.5.1`. The publish only proceeded after an explicit
API approval (`POST …/pending_deployments`, `state=approved`) bound to the
archive digest.

Lesson: a UI approval is not evidence of approval. Verify
`actions/runs/<id>/pending_deployments` is empty rather than trusting that the
click landed, and never report a publish as done on the strength of an
instruction — check the registry.

## Cleanup

Both temporary transports were removed and their absence confirmed against the
server (zero `CUMPA_*` secrets and variables remain in the `production`
environment): the `CUMPA_RELEASE_BUILD_ORIGIN` secret and the
`CUMPA_RELEASE_SOURCE_SHA` variable.

The build origin was recovered from the published `1.5.1` launcher rather than
from any local record, verified only by comparing its SHA-256 against the
recorded `configuredOriginSha256` (`89485617…6cdf`, exact match, single
candidate), piped to `gh secret set` via stdin, and never printed in cleartext.

## Also in this task

`1a49143` closed advisory `A-001` from the `260914-ci6` verification:
`tests/integration/monaco-anchor.spec.ts` test 6 claimed to restore "focus
side" but asserted only composer text, anchor, and model state — it never
established a focus side divergent from the composer anchor, which is why it
did not catch the saved-focus regression corrected in `505ba43`. The title now
names what the body verifies. Focus-side restoration stays pinned
deterministically at the adapter seam, where a divergent saved focus can be set
directly; asserting it in the browser would have meant adding a seam to product
code for coverage the unit regression already guarantees.

## Open items

- `SKILL.md` still installs `@1.5.0` and states that only 1.5.0 has independent
  release verification. Its checker accepts `>=1.5.0 <2.0.0`, so `1.5.2` is
  compatible, but correcting the marketplace skill needs a separate publication
  authority.
- Restore still ignores an RPC transport error and renders the completion page
  (`260913-apr-SUMMARY.md`). `1.5.1` bounded the hang; it did not make a
  transport failure distinguishable from success.
- `.vue` files remain outside `tsc`; `vue-tsc` would close that gap.
- ACC-04 verified row remains blocked (`live-entitlement-unavailable`).

## Commits

`d49ed2c` release bump · `1a49143` A-001 test naming
