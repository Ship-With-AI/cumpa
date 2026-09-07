# Phase 3: Distribution Contract & Legal Boundary — Research

**Researched:** 2026-09-07
**Status:** Complete for planning; legal approval and publication clearance remain execution gates
**Requirements:** PKG-06, PKG-07, REL-04, REL-05

## Scope and evidence quality

This memo answers what is needed to plan the phase, not whether the repository is already safe to publish. The research worker returned useful observations but stalled before producing its artifact; the orchestrator recovered this bounded memo from direct official-source reads, current repository metadata, the completed `03-PATTERNS.md`, and explicitly attributed worker observations. No full rights, dependency, Git-history, or GitHub-exposure audit was completed. No source/history/visibility/publishing mutation was performed during research.

Use `03-CONTEXT.md` and the reconciled active requirements/roadmap. The user chose the existing repository and reviewed history, proprietary source-available licensing, both licensors' exact-text approval, and preservation of applicable GitHub platform rights. The former permanent private-source/no-provenance policy is superseded.

## Verified platform constraints

### Public GitHub is a distinct publication surface

GitHub's visibility documentation states that changing private to public makes code, Actions history, and logs visible to everyone, allows forks, and **disables all push rulesets**. Changing back to private does not retract public forks or copies. A current-tree or npm package scan is therefore insufficient, and reversal is not a confidentiality recovery plan.

Before conversion, inventory the actual remotely reachable branches/tags/history and repository-visible data: issues/PRs/comments, discussions if enabled, releases/assets, Actions runs/logs/artifacts, wiki/pages where enabled, and references to other private infrastructure. Check each applicable surface's visibility/access conditions; do not assume a clean Git history clears non-Git data. Review branch protections, ruleset types, fork/Actions permissions, protected production environment settings, and deployment authority. Account explicitly for disabled push rulesets: distinguish them from branch rulesets and environment protections; require an approved supported mitigation or block publication rather than claiming every protection can remain byte-for-byte unchanged.

Keep diagnostic evidence redacted. If a scanner or human finds sensitive material, record a safe identifier/path and classification rather than the secret itself. Resolve credentials and publication rights before conversion. Deletion, force pushes, history rewriting, or destructive GitHub cleanup require separate approval and are not automatically authorized by the request for public source.

Primary source: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility (checked 2026-09-07).

### Proprietary terms cannot negate GitHub's platform grants

GitHub Terms of Service §D.5 requires public-repository viewing and in-platform fork permissions. §D.4 also grants GitHub/Affiliates service and AI-training-related rights; §D.8 addresses public internet accessibility and lawful access. D.5 is not the exhaustive platform grant. The user accepted preserving required GitHub platform rights, so the license must not promise otherwise or invent a no-AI-training restriction. Both licensors' informed approval should acknowledge the applicable platform/publication implications.

This does not make the application open source. The separate proprietary grant may allow the chosen personal/commercial use, internal copying and modifications, and perpetual compliant use of acquired versions while restricting additional public redistribution. Preserve statutory rights and independently licensed third-party material. Drafting and naming licensors do not establish ownership of every historical or contributed file, and new terms do not erase earlier grants.

Primary source: https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#d-user-generated-content (effective date shown: 2026-04-27; checked 2026-09-07).

### npm trusted publishing and provenance

npm documents OIDC trusted publishing without long-lived npm tokens. Its automatic provenance conditions include trusted publishing from a public repository for a public package; GitHub Actions is supported. Package repository identity must match the publishing repository, including case-sensitive identity requirements documented for provenance. Preserve the exact `Ship-With-AI/cumpa` identity and later fixed workflow configuration. Do not infer an attestation from OIDC authentication alone.

Phase 3 should document eligibility, the actual evidence Phase 5 must verify, and honest user-facing wording. Do not retain a blanket private-source unavailability claim or disable eligible automatic provenance. No stable release, bootstrap, npm attestation, or immutable tarball has been proven by this planning work. Phase 4 owns the runtime-only tarball and Phase 5 owns publishing the exact reviewed bytes and recording the real outcome. Recheck current npm policies/CLI conditions at those execution boundaries rather than copying generic examples that rebuild before publish or use a long-lived token.

Primary sources, checked 2026-09-07:
- https://docs.npmjs.com/trusted-publishers/
- https://docs.npmjs.com/generating-provenance-statements/

## Repository observations and integration points

- Authenticated GitHub metadata verified `Ship-With-AI/cumpa` as PRIVATE, unarchived, and Issues enabled. Its issue URL is not yet publicly usable. No separate tracker or homepage is needed after the approved transition.
- The current repository tracks 368 `.planning/` files. These, historical versions, commit messages, and deleted material are part of the exposure question, not automatically cleared because they are documentation.
- The research worker reported local main `7533a4c4…` ahead of remote main `7c9b2280…` by 25 commits during its 2026-09-07 read-only observation. This is not a future publication target or approval. Visibility exposes remote contents, not unpushed local work. Execution must authorize the exact private fast-forward, enforce its expected old OID as well as ancestry, and re-snapshot remote refs. No unconditional force, non-fast-forward update, mirror, unapproved branch, or history deletion is authorized. See the verified guard clarification below.
- `package.json` currently uses private `cumpa@0.0.0`, Node `>=24`, the existing `cumpa` bin path, and an allowlist that still includes the marketplace skill. An application `LICENSE` was not found in the scan. The lockfile repeats root metadata.
- `THIRD_PARTY_NOTICES.md` begins with Microsoft-specific notices. It is useful existing material, not a full Cumpa application/dependency/history rights assessment. Inventory lockfile dependencies and actually copied/bundled/generated content; preserve required license texts and notices. Do not assert GPL contamination from an old conversation without source evidence, and do not assume every dependency is MIT or every dev-only package is redistributed.
- `README.md` has reusable review/agent guidance but still advertises private-checkout installation and a bundled skill. Public documentation should distinguish the planned exact npm installation commands from actual release availability until Phase 5 publishes.
- `scripts/verify-production-artifacts.mjs` examines current npm inventory/archive and protected-value patterns. Its scope is not all Git history or GitHub metadata. Reuse it where applicable, not as a universal publication-clearance engine.
- `03-PATTERNS.md` maps existing notices, package fixtures, support operations, and v1.4 redacted/digest-bound evidence patterns. Exact-text approval can be a small attributable record; a bespoke approval database, generic scanner framework, or new release service is unnecessary.

## Minimal planning recommendation

1. **03-01 — Rights, notices, and exact license approval.** Inventory current/historical ownership and actual notice obligations; record redacted scope/findings, draft `LICENSE`, reconcile notices, and obtain explicit approval of the exact final text from both Alessandro Magionami and Manuel Salvatore Martone. Unresolved rights remain blocking. Do not auto-certify copyright ownership or silently remediate history.
2. **03-02 — Approved metadata and truthful user/release documentation.** Update package/root-lock identity and license/repository metadata; retain `private: true` and the current package allowlist until Phase 4's safe artifact cutover. Write the self-contained npm guide, no homepage, selected issue link with current availability stated accurately, and a compact secret-free provenance/publication policy. Do not claim a public npm release or attestations exist yet.
3. **03-03 — Final exposure review, authorized private sync, and public transition.** Review final committed content after 03-02, refresh the historical/GitHub exposure scope, resolve protection consequences, authorize any reviewed main fast-forward with exact-old/ancestry guards, snapshot actual remote refs, obtain final publication authorization, recheck drift, change only the existing repository's visibility, and verify public source/Issues and approved protections. Returning to private is not confidentiality rollback.

The later metadata/docs commits can invalidate the initial review. The final gate must refresh relevant findings and require renewed approval if legal text or the material exposure changed. Exact licensor approvals and final visibility authorization must remain blocking even under auto-execution/end-of-phase human-verification settings.

## Verification and threat model guidance

Each plan needs an ASVS-level-1 threat model with high-severity blocking for secret/history exposure, insufficient publication rights, stale approvals/refs, accidental package publishing, misleading license/provenance claims, and disabled or weakened repository/deployment protections.

Use existing tools and bounded records. Native Git can enumerate refs and historical paths/objects; GitHub CLI/API can read repository and exposure settings. The executor must use exhaustive pagination for applicable remote inventories, document inaccessible/unreviewed surfaces as blockers, and avoid recording credential contents. Scanner results supplement human classification and licensing review; they do not prove legal sufficiency.

Approvals must identify the exact license text and reviewed publication scope. A meaningful gate demonstrates refusal on missing approval, unresolved high-severity findings, changed text/refs, or mismatched target identity before any mutation. These can be checked through a documented dry run and manual checkpoint; do not invent permanent source-text tests or a custom approval engine solely for the phase.

After an authorized transition, use unauthenticated reads for public repository/license/Issues accessibility and authenticated metadata for settings that cannot be inspected publicly. Verify expected main OID and the actual protection state, with explicit treatment of push-ruleset disablement. Record real observations, not successful-command intent.

## Review-driven protocol clarifications

- **Non-bypassable approvals:** GSD's `references/checkpoints.md` states that human-verify can auto-approve or defer under end-of-phase mode, whereas `checkpoint:human-action` still stops. Use `checkpoint:human-action` with `gate="blocking"`, instructions, verification and exact resume signals for the dual-license, private-preparation and final-publication authorizations. Their human assent cannot be generated by a CLI; prose inside a human-verify task is not an override.
- **Fast-forward compare-and-swap:** A disposable local Git experiment verified three cases: a changed old tip was rejected by `--force-with-lease=refs/heads/main:<approved-old>`; a matching approved fast-forward succeeded; a non-fast-forward target was rejected before pushing by `git merge-base --is-ancestor <same-approved-old> <approved-target>`. The explicit lease and ancestry proof must use the same fixed old OID. This is not authority for a history rewrite, unconditional force, implicit refreshed lease, or bypassing a policy that forbids the flag. The temporary fixture was removed; GitHub was untouched.
- **No fictitious immutable-ID visibility API:** Live read-only GraphQL introspection on 2026-09-07 showed no `visibility` field in `UpdateRepositoryInput` and no public repository-visibility mutation. A review suggestion to use that field was rejected. `gh repo edit --help` confirms the supported visibility/consequence flags. Bind identity before/after and restrict the mutation credential's write authority to the approved repository; do not use broad ambient credentials that could authorize a replacement at a rebound slug.
- **Scoped credentials:** GitHub documents fine-grained tokens restricted to selected repositories and individual permissions. Reuse suitable existing short-lived scoped authority or have the owner provide expiring selected-repository authentication through the human-action gate; do not build a GitHub App or credential service. Never expose token bytes or silently broaden scope. Official reference: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#fine-grained-personal-access-tokens (checked 2026-09-07).
- **Stable, complete observations:** Exclude transport/capture timestamps and counters from snapshot hashes without excluding relevant content/security fields. Wait for exposure-producing jobs to finish and maintain an operator no-write/no-rename window through conversion. No-sync is valid only if remote main already matches the reviewed source target. Recheck after private preparation, not before only.
- **Anonymous verification and cleanup:** A token-unsetting prefix does not disable Git credential helpers. Use requests with no Authorization header to verify public repository ID, main ref and exact LICENSE SHA-256 at that ref, plus Issues access. Download sensitive review material only into mode-0700 temporary storage under umask 077 with finally/signal cleanup; unconfirmed cleanup remains a blocker.

## Remaining execution prerequisites

- Full current/history/contributor rights and shipped-notice inventory.
- Exact legal text and separate approvals by both named licensors.
- Then-current intended local/remote source boundary, repository-scoped mutation authentication, and any authorized private fast-forward protected by both the exact-old lease and ancestry check.
- Exhaustive applicable GitHub exposure inventory, confidential-material review, and repository/environment protection disposition.
- Explicit final public-visibility authorization and post-change observations.
- Phase 4 publishable runtime-only archive and Phase 5 actual registry/provenance proof.

These are explicit executable gates, not missing planning decisions or claims that the phase is already implemented.
