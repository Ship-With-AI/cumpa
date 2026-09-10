# Phase 5: Bootstrap & Trusted Stable Publication — Context

**Captured:** 2026-09-09
**Source:** Direct plan-phase owner decision after source-backed provenance research. The owner selected **“New CI-built candidate”** rather than retaining the locally built tarball as the publication input.

<domain>
Deliver PKG-01, PKG-02, REL-01 and REL-02: a usable separate non-latest bootstrap with revoked temporary publication authorization, then exact `@shipwithai/cumpa@1.5.0` public npm availability through a fixed GitHub OIDC workflow with truthful verified provenance. Planning is complete. The owner subsequently selected **Execute Phase 5**, authorizing the planned local implementation, tests and bounded local preparation. Source push, workflow dispatch/upload, credential or hosted-configuration mutation and npm publication still require their distinct actual execution-time authorizations.
</domain>

<decisions>
## Locked decisions

### D-01 — New CI-built stable candidate
- **D-01:** Plan a fresh CI-built stable candidate, actual byte-bound inspection/installation and new human approval, then unchanged-byte publication from the same workflow run and attempt.

The owner selected **“New CI-built candidate”** after being told that the existing local build cannot gain retrospective CI-build provenance. Plan a fresh stable candidate built in GitHub Actions, inspect/install those actual bytes, obtain new attributable SHA-256/byte-length/limitations approval, and publish the same bytes from the **same top-level workflow run and attempt** that built them. The publisher must never rebuild, repack, transform or replace an approved candidate between approval and publication. Do not change CI identity variables or manufacture retrospective provenance.

This changes the future publication designation, not the historical Phase 4 result. The new CI-produced candidate must receive its own actual approval even if deterministic output happened to reproduce an earlier digest. Do not reject/accept based on whether its hash differs from the old one; enforce a real new CI build and its source/run binding.

### D-02 — Preserve the old accepted artifact and evidence
- **D-02:** Preserve the old accepted Phase 4 archive, evidence and approval unchanged as history; no bootstrap derivation, retrospective CI claim or publication fallback.

The Phase 4 archive remains valid, read-only, immutable and retained: SHA-256 `e7766d43f7f804b138e694b298480cdec62ebfc16960f86d4c1e3c7959cf1dca`, byte length `3513998`. Its sealed evidence SHA-256 remains `3bf27f13de08b85527240c76ddc1e4df6c37dc06a5e1bbf006ab9d45f94fb379`. Never modify either, rewrite the old approval, unpack/repack it into a bootstrap, delete it, or pretend its local source `a0f6a10a750d9a1668e594fabdfd432608c35a45` was a CI build.

Record the new CI evidence and approval separately. Explicitly supersede the old **publication designation** only after actual new approval. There is no fallback that publishes the old local artifact if the CI cycle fails. Legacy artifacts `9907668126` and `9928300866` and their backups remain retained under their existing disposition.

### D-03 — Source, credentials, configuration and publication need separate authority
- **D-03:** Planning grants no execution or remote authority; source, credential, configuration, CI build/upload, artifact and publication actions retain explicit separately scoped gates.

Planning approval is not execution approval. Actual source visibility/push, bootstrap artifact approval and publication, temporary npm authentication, token revocation, trusted-publisher/environment configuration, CI candidate build/upload/dispatch, stable artifact approval and stable publication each need explicit scoped gates appropriate to that action. Generic assent, a placeholder digest, prior Phase 3/4 permission or a successful CI check does not authorize a different mutation.

### D-04 — Distinct usable bootstrap and real credential revocation
- **D-04:** Use one complete configured bootstrap under a distinct non-latest version/tag and revoke its isolated temporary npm authorization before stable work.

The bootstrap must be complete, usable and MIT-licensed under a non-`latest` tag and a version distinct from `1.5.0`. It cannot be an empty reservation package or consume `1.5.0` under another tag. Produce it in a separate approved configured source-build cycle, not from the old stable tarball. Temporary interactive npm authorization must be revoked and its created local files removed before stable CI publication becomes actionable. Distinguish operator-confirmed revocation from independently observed server proof; do not claim one as the other.

### D-05 — Main-only source work and no collateral Supabase deployment
- **D-05:** Keep source work on main, publish only the exact reviewed source with documented one-off CI suppression, prove no collateral Supabase deployment and never weaken unrelated policy.

All source work stays on `main`; no GSD worktrees or source branches. CI may check out the exact reviewed main commit, not move a source branch. The existing Supabase workflow triggers on every push to `main`; source publication must not silently authorize that deployment. Plan a separately approved exact source-publication push using documented one-off `[skip ci]` suppression, verify the collateral workflow did not deploy, and stop for an owner decision if actual protection rules make that route unavailable. Do not weaken branch/environment policy or disable unrelated workflows as a fallback. The release workflow is manual-dispatch-only.

### D-06 — Existing configuration, exact legal bytes and bounded records
- **D-06:** Keep the existing GitHub production variable authoritative, preserve exact legal obligations and bounded private-data-safe records, and create no local or permanent duplicate configuration.

Use the existing GitHub `production` environment's `SUPABASE_PROJECT_REF` in memory/environment for both configured bootstrap preparation and CI candidate build. Do not create another local `.env` or duplicate the value into another environment. Preserve the approved MIT LICENSE, prior third-party grants and complete Monaco notices; reconcile real new build output before candidate approval. No cleartext origin/project reference, private custody path, credential, live login URL or raw sensitive log belongs in durable evidence.

The reviewed configured-origin fingerprint remains `89485617b2d50d4778542ebedc3817a3e3fcddb6520a4a9c3a66e37c3a9c6cdf`; a changed GitHub value requires a separate configuration decision rather than silent retargeting.

### D-07 — Preserve the actual native/runtime contract
- **D-07:** Build the CI candidate on supported hosted Darwin ARM64, prove real native re-export and complete installed runtime/browser/support/V2/V3 behavior, and retain explicit limitations elsewhere.

The CI stable build must use a supported GitHub-hosted **Darwin ARM64** runner so it preserves the shipped native addon, rather than silently omitting it by building on Linux. Verify the produced archive's real native re-export and retain the explicit fallback limit elsewhere. The same real configured archive must pass runtime/legal-only inspection and installed browser/worker/codicon/review/support-dismissal/V2/V3 acceptance. Do not substitute source checks, a mock or an unconfigured build.

### D-08 — Same-run publication and truthful provenance
- **D-08:** Use exact protected OIDC publisher identity without long-lived npm credentials, preserve automatic provenance and require actual subject/source/workflow/run/attempt agreement without retries or inflated claims.

Use GitHub OIDC trusted publishing without a long-lived npm credential. Configure the exact repository/workflow/protected publication-environment relationship and explicitly enable direct `npm publish` under npm's current allowed-action model. Preserve eligible automatic provenance. Require the actual emitted subject digest, source commit, repository, workflow, run and attempt to match the fresh CI build and published registry bytes. A signature or UI badge alone is insufficient. Do not claim a SLSA level, exhaustive input capture or an unobserved platform matrix. Missing/mismatched attestations or ambiguous publication outcomes stop the normal success path; do not retry publication or rebuild automatically.

### D-09 — Real public consumer evidence
- **D-09:** Verify real downloaded public registry bytes and actual attestation cryptography/claims, then prove separate clean global and exact-version npx consumption without local/cache fallbacks.

After publication, independently download exact registry bytes and compare length/SHA-256/SHA-1/SHA-512 with the newly approved CI candidate. Verify actual attestation cryptography with supported npm tooling and separately inspect claims. Prove exact global install exposes `cumpa` and exact-version `npx` resolves `1.5.0` in separate clean, credential-free environments. Do not fall back to a local tarball/cache or infer availability from metadata alone.

### D-10 — Accepted first-release `latest` behavior
- **D-10 (2026-09-10):** The owner selected **“Accept until stable CI”** after the verified bootstrap publication also acquired `latest` and an explicitly authorized, authenticated removal was rejected with `E400`. For this first release only, `@shipwithai/cumpa@1.5.0-bootstrap.0` may retain both `bootstrap` and `latest` until a separately approved stable CI publication replaces the latter.

This supersedes only REL-01/05-04's unchanged-`latest` outcome requirement; it does not rewrite the earlier failed criteria or authorize another tag mutation, publication, CI configuration, dispatch or stable artifact. Keep the immutable verified bootstrap, its existing byte approval and all historical artifacts unchanged. The bootstrap is a local interactive publication, not a CI-built/provenance-backed stable release. D-01 through D-09 otherwise remain in force.

The attributable exception and final tag-session revocation confirmation are recorded in `05-BOOTSTRAP-PUBLICATION.json`. Exception SHA-256: `fdf592eef8725d7e5c5d2e6a59a94d9351b8bbca9884ebe4ae85ad9a1021fd19`. Current temporary authorization is revoked at the documented native-client/operator assurance levels, and all eight owned local contexts are cleaned.
</decisions>

<canonical_refs>
- `.planning/ROADMAP.md` Phase 5 goal, criteria and requirements.
- `.planning/REQUIREMENTS.md` PKG-01, PKG-02, REL-01, REL-02; carry forward REL-03's exact inspected/installed/published byte invariant.
- `.planning/phases/04-exact-runtime-tarball/04-ARTIFACT-APPROVAL.md` and sealed `04-ARTIFACT-EVIDENCE.json` — immutable historical input and limits, never rewritten.
- `.planning/phases/05-bootstrap-trusted-stable-publication/05-RESEARCH.md` — current npm/GitHub semantics. Its earlier local-tar/draft-Release proposal is superseded by D-01; factual protocol/credential/identity findings remain applicable.
- `.planning/phases/05-bootstrap-trusted-stable-publication/05-PATTERNS.md` — producer/verifier/helper and workflow analogs.
- `docs/distribution-operations.md` — operative policy must be updated during execution to reflect D-01 without rewriting historical Phase 3/4 approvals.
- `.github/workflows/deploy-supabase-production.yml` — collateral push-triggered deployment and existing production-variable source.
</canonical_refs>

<specifics>
## Planning defaults within maintainer discretion

- Proposed bootstrap identity: `@shipwithai/cumpa@1.5.0-bootstrap.0`, dist-tag `bootstrap`. Confirm vacancy/authority during execution; collisions stop rather than overwrite or silently choose another version.
- Fixed proposed workflow: `.github/workflows/publish-npm.yml`; stable version remains `1.5.0`.
- Use native Actions artifact transfer inside the same CI run rather than a draft Release upload path for the old local stable tarball. Artifact IDs/transport digests supplement, never replace, direct `.tgz` and evidence hash checks.
- Use a separately protected `npm-release` environment for the publish job if native protection is available, without copying the production support variable into it. The build job reads the existing `production` environment. Actual protection capabilities/reviewer identities are execution-time verified setup inputs, not assumed settings.
- Do not interpolate the non-secret production variable directly into a logged `run`, action input or `env` preamble and then claim late masking hid it. For CI transport, use one separately authorized, temporary masked secret `CUMPA_RELEASE_BUILD_ORIGIN` in the **existing production environment**, derived in memory from the authoritative variable and sent through stdin to the native GitHub CLI. Require the reserved key to be absent; never overwrite another value. Delete only this owned temporary transport after the candidate-build job terminates (including failure/cancellation), verify its absence, and do not copy it into `npm-release`. The original variable remains the sole configuration source; no local `.env` or permanent duplicate is created.
- Bind the authorized source before any CI build work: under the same scoped setup authorization, create an absent-only temporary `production` variable `CUMPA_RELEASE_SOURCE_SHA` with the reviewed public commit and read it back. The first candidate-job step must reject empty/non-40-hex/mismatched values against `GITHUB_SHA` before checkout, dependency installation or origin use. Delete only this owned guard variable with the temporary origin transport after the candidate job terminates; subsequent publication validates the sealed same-run CI context rather than reading the deleted guard. This avoids a main-branch movement causing an unapproved build without adding unrecorded dispatch inputs.
- Recovery refines the normal cleanup timing: partial setup with no possible CI job cleans immediately; abort/competition may remove the proven-owned source guard first to fence later admission, retaining origin only until already-running consumers are terminal. Private bounded operation receipts preserve ownership across interruption; uncertain effects/ownership block instead of deleting unrelated state or claiming cleanup. A live guarded bootstrap authentication transaction plus private cleanup-first recovery covers the separate npm session; no permanent credential manager is introduced.
- A narrow explicit bootstrap profile may generalize existing producer/verifier/acceptance code. Default stable checks remain exact; the app's version reader already accepts prereleases and needs no change.
- Reuse existing scripts, Node standard library, npm/GitHub CLI and the existing test harness. Do not add a generic release framework, approval engine, credential manager or new dependency without a demonstrated need.
- Granularity is coarse, TDD is enabled for uncertain boundary logic, ASVS level 1/HIGH blocking applies, and the phase has no product UI, database-schema or AI-system change.
</specifics>

<deferred>
- Marketplace skill publication and full clean public browser acceptance remain Phases 6 and 7.
- npm staged publishing, draft-Release transport of the old stable artifact, custom retrospective provenance, alternate source branches/worktrees, new hosted infrastructure and automatic publish retries are not part of the selected approach.
</deferred>
