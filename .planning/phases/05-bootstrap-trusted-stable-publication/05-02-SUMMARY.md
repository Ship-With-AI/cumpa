---
phase: 05-bootstrap-trusted-stable-publication
plan: 02
subsystem: distribution
tags: [npm, provenance, github-actions, artifacts, vitest]
requires:
  - phase: 04-exact-runtime-tarball
    provides: Producer/scanner/installed-acceptance evidence formats
provides:
  - Strict stable CI candidate sealing and same-run prepublish validation
  - Fixed-registry public byte, npm provenance and consumer verification
  - Standalone standard-library CLI with bounded output
affects: [05-03, 05-05, 05-06]
tech-stack:
  added: []
  patterns: [Preserved producer-core seal, npm-verified provenance policy inspection, Isolated public consumers]
key-files:
  created: [scripts/verify-npm-release.mjs, tests/package/npm-release-verifier.test.ts]
  modified: []
key-decisions:
  - Preserve the complete producer core and inventory rather than normalize away source evidence.
  - Recorded Darwin ARM64 production and live Linux publication are distinct validated contexts.
  - npm owns cryptography; inspect the one verified SLSA bundle while allowing npm's separate verified publish attestation.
requirements-completed: []
requirements-progress: [PKG-01, PKG-02, REL-02]
completed: 2026-09-09
status: complete
---

# 05-02 — Fixed CI and public npm release verifier

One Node-standard-library helper now binds the stable candidate and implements actual read-only registry, audit and consumer operations. It has no publish/authentication/approval operation.

## Implementation and commits

- RED: `4be1447` — collectible missing-entrypoint baseline, candidate/context boundaries and public/provenance fixtures.
- GREEN: `f18f109` — complete verifier plus Main's integration corrections and regressions.
- Exports: `sealCiCandidateEvidence`, `verifyCiCandidateForPublish`, `inspectNpmProvenance`, `verifyPublicNpmRelease`.
- Commands and flags remain exactly those declared in 05-02. No arbitrary package/version/registry/profile, bypass or retry interface was added.
- Sealing preserves producer-core ordering and archive inventory, validates closed report shapes and source/legal/support/native/installed-manifest joins, retains independent scanner/acceptance digests and writes once.
- Prepublish uses no full scanner, configured origin or project dependency. It independently rehashes the archive/seal and binds repository/workflow/source/run/attempt; actual upload-action and REST artifact-digest forms are accepted.
- Public verification requires supported npm 11.19.1 and its paired npx, exact registry metadata/download identities, a populated exact-version audit tree/lockfile, npm's successful cryptographic audit, exact SLSA subject/source/workflow/run/attempt claims and separate global/npx consumers.
- Even npm version discovery uses a private HOME/cache/prefix and distinct empty config files. Publication evidence is written only after consumer scratch cleanup succeeds.

## Observed verification

Main ran all validation; executors intentionally ran none.

- Release verifier suite: **21/21 passed** after cleanup.
- Strict TypeScript checking passed for all three release-boundary fixture files.
- The combined earlier Wave 1 run passed all 37 then-existing tests plus both acceptance-schema cases; the added standalone-symlink regression brought the verifier suite from 20 to 21.
- A real dependency-free copied CLI smoke rejected undeclared registry selection. Smoke testing exposed the macOS/symlink entrypoint no-op; a deterministic regression failed before using Node's native `import.meta.main` and passed afterward on the observed Node 24 LTS runtime.
- Controlled public-consumer fixtures reject absent installed audit targets, absent target attestations, substituted registry bytes, shared consumer state and wrong npx versions. These are not claims of a real public release or real attestation cryptography having run.
- All smoke roots were removed; source manifests/legal inputs and historical Phase 4 archive/evidence remained unchanged.

## Integration corrections

Main corrected producer-core loss, missing installed-manifest binding, insufficient closed/private report validation, additional npm publish-attestation handling, PATH delimiter selection, npm-version command isolation and cleanup-before-receipt ordering. The original test draft's wrong Linux-publisher assumption and historical-digest substitution case were corrected before implementation; historical authority is rejected by source/purpose/context, never by blacklisting a hash.

The audit shape was checked against npm/cli v11.19.1 `lib/utils/verify-signatures.js`, bundled pacote `registry.js` and `workspaces/libnpmpublish/lib/provenance.js`. Public repository owner ID `224984099` was observed through a read-only GitHub API request. No repository/environment mutation was performed.

## Operational boundary

PKG-01, PKG-02 and REL-02 remain globally incomplete until their actual gated operations succeed. No CI candidate was built/uploaded, no real public npm verification was run, and no credential/configuration/publication authority was exercised. The next consumer is the local 05-03 workflow implementation.

## Post-Wave Integration Correction

Independent 05-03 review found two real-output mismatches that these initial synthetic fixtures missed. `bad28f7` now requires the producer's actual clean-diff fingerprint (`sha256(JSON.stringify(['', '']))`) and requires/preserves the aggregator's actual `profile: stable` acceptance field. Main first changed the fixtures to the real formats, observed both failures in sequence, then verified all 21 affected tests and strict typechecking after repair. See `05-REVIEW.md` for the resolved findings; the original local prerequisite work is not an operational success claim.
