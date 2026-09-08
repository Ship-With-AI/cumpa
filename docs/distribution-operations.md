# Cumpa distribution operations

This is the maintainer evidence policy for `@shipwithai/cumpa@1.5.0`, not a release receipt. The selected source repository is `Ship-With-AI/cumpa`; its Issues tracker is the sole selected problem/question channel. Cumpa uses the standard MIT open-source license.

## Phase 3 — legal and public-source gates

On 2026-09-08, the user replaced the proprietary licensing direction with MIT. The active contract is MIT distribution, including commercial reuse and resale, with the existing repository and reviewed history becoming public only after authorization. Quick task `260908-d25` supersedes the earlier licensing restrictions; do not restore them or the obsolete permanent-private-source premise.

Before repository or package publication, verify the exact MIT LICENSE SHA-256 against both named licensors' attributable entries in `.planning/phases/03-distribution-contract-legal-boundary/03-LICENSE-APPROVAL.md`, together with the bound rights review and notices. The prior proprietary approvals do not approve the MIT bytes. Renewed exact-text MIT assent is recorded: Alessandro's direct approval and his witnessed report of Manuel's own approval, not independently verified assent from Manuel. Missing, unsupported, stale or mismatched evidence blocks publication, not local preparation. Preserve the difference between actual human approval and an agent-authored claim. These are maintainer publication gates, not additional restrictions on MIT recipients. Independently licensed material and prior grants survive.

Plan 03-03 separately reviews the final source/history delta and actual GitHub exposure, including all applicable refs, Actions logs/artifacts, hosted surfaces and protections. Owner acceptance of an earlier reviewed location is not a blanket allowlist for new private data. Store only bounded, redacted evidence and exact artifact digests, not credentials, private identifying values or confidential operational content.

The operator's 2026-09-08 PUB-01 disposition accepts only the six reviewed non-secret CI identifier fingerprints recorded in `03-PUBLICATION-REVIEW.md`. Keep that exact-scope exception distinct from secrets, personal data, new values and the stricter runtime-package/evidence boundaries. Accepted historical logs need not be deleted or their variables migrated to secrets.

Obtain distinct private-preparation and final-publication authorizations bound to the exact reviewed state, repository identity and permitted actions. Use only approved repository-scoped, short-lived mutation authority. A source push may trigger existing workflows; approve those effects before pushing. Public conversion exposes Actions history and disables all push rulesets, so require an approved, supported protection disposition. No unapproved ref push, deletion, history rewrite, protection change or visibility conversion is permitted.

After the authorized conversion, verify repository identity, actual public state, exact main OID, LICENSE bytes and Issues access through genuinely credential-free requests. A configured URL, successful authenticated request or local source inspection does not prove anonymous usability. Keep later local approval/review/SUMMARY commits separate from the exact approved source target; do not automatically push them.

**No npm mutation occurs in Phase 3.** Name/version metadata and documentation are preparation, not registry, artifact or provenance evidence.

## Phase 4 — one reviewed immutable runtime artifact

The Phase 4 manifest is publishable and includes only `dist/`, `README.md`, `LICENSE`, and `THIRD_PARTY_NOTICES.md` alongside npm's mandatory package metadata. The marketplace skill is excluded. Metadata eligibility is not artifact acceptance or permission to publish.

Build and review one immutable tarball. Record its exact digest and contents; bind the approved license/notices and source inputs to that actual artifact. A prepack inventory, old build, source-tree notice file or planning assertion is not final package acceptance. Preserve the approved tarball for Phase 5 rather than rebuilding a replacement with the same version label.

Create bytes explicitly with `npm run pack:runtime-artifact -- --purpose development-check --custody-dir <new-absolute-directory> --evidence <new-absolute-json-path>`. The parent directories must exist. Each invocation performs one build and one scripts-disabled pack; it never overwrites evidence or deletes an emitted archive after failure. The ordinary `prepack` hook is developer convenience, not release authority.

Use `candidate` for final local acceptance and `deployment-check` for disposable deployment checks; both require clean tracked source/index and the canonical `CUMPA_RELEASE_SUPPORT_SERVICE_URL` in the protected environment. `development-check` allows stable uncommitted changes and configured absence, but cannot become an approved release. Never pass the origin in argv. Evidence retains only its configured flag/fingerprint, basename, independent SHA-256/SHA-1/SHA-512 identities, source/build/legal/native facts, and inventories—not custody paths or origin cleartext.

## Phase 5 — registry publication and actual provenance

Only Phase 5 performs the approved registry bootstrap and stable OIDC trusted-publishing flow. Do not introduce long-lived publication credentials. Publish the exact Phase 4 tarball; neither a rebuild nor a different archive with the same name/version is an acceptable substitution.

Preserve automatic npm provenance when the then-current public repository/package, workflow, runner and trusted-publisher conditions are eligible. Do not disable an eligible mechanism to match the obsolete private-source premise. OIDC authentication success or a UI badge alone is not evidence that provenance was emitted.

For the actual `@shipwithai/cumpa@1.5.0` publication, retain and verify:

- Exact registry name/version and integrity, with the downloaded registry artifact matching the approved Phase 4 digest.
- Source repository `Ship-With-AI/cumpa`, full source commit, and the actual publishing workflow and run identity.
- The emitted attestation itself, its exact package subject digest and source claims, and their agreement with the artifact, repository, commit, workflow and run above.
- The real result of consumer availability and artifact checks, rather than an intended command or authentication result.

If no attestation is emitted or any verification mismatches, record that actual outcome and make no provenance claim. Follow the Phase 5 failure gate rather than relabeling the result as successful provenance. Do not expose temporary credentials in evidence; confirm their cleanup/revocation and any temporary evidence cleanup as required by the approved procedure.

## Unchanged product and licensing boundaries

This licensing change does not expand the maintainer release plan to include a source-inclusive tarball, application protocol change, AI/API/schema/UI work, new release framework or approval engine. Do not add activation, DRM, a license server or payment gating. Voluntary support remains feature-neutral and buys no service commitment.

The marketplace skill is a separately distributed MIT-licensed integration requiring a separately installed MIT-licensed CLI. Matching licenses do not merge their installation lifecycles or authorize bundling the skill in the runtime-only package.

## Supabase deployment artifacts during preparation

The existing deployment workflow keeps its repository gates, production deployment and configured package build/scan. It uploads only `supabase-deployment-evidence.json`, not the unaccepted runtime tarball. The existing workflow verifier rejects archive upload targets and additional upload steps.

The owner explicitly directs retaining the two reviewed legacy runtime archives, artifacts 9907668126 and 9928300866, despite their unremediated missing-notice finding. Their private backups remain retained; the earlier selective-removal authorization and deletion-token request are cancelled. This exact owner-accepted risk is not verified third-party permission or notice compliance and does not authorize retention-setting changes or any other remote mutation.
