# Phase 3: Distribution Contract & Legal Boundary - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning; active milestone source/publication requirements reconciled on 2026-09-07

<domain>
## Phase Boundary

Establish approved proprietary license terms, accurate package metadata and public documentation, third-party notice obligations, and a safe source-publication boundary for `@shipwithai/cumpa@1.5.0`.

**Explicit user-directed scope change:** During this discussion, the user replaced the private-source requirement with publication of the existing `Ship-With-AI/cumpa` repository and its reviewed Git history. Cumpa remains proprietary and source-available, not open source. The user then requested immediate milestone reconciliation; GSD quick task `260907-gdm` updated the active project, requirements, roadmap, and continuity state to v1.5 Proprietary Distribution. The earlier private-source/no-provenance policy is superseded. This documentation reconciliation does not change repository visibility or satisfy the legal and publication gates.

Runtime-only npm packaging, immutable artifact preparation, bootstrap/stable publication, marketplace distribution, and released-artifact acceptance remain the later phases' responsibilities. Existing review, export, agent handoff, and voluntary-support behavior is unchanged.

</domain>

<decisions>
## Implementation Decisions

### Proprietary source and compiled-release permissions
- **D-01:** Make the application source publicly readable under an explicit proprietary, source-available license. Do not call Cumpa open source or apply an open-source license to the application. The independently MIT-licensed marketplace skill remains a separate distribution.
- **D-02:** Permit free personal and commercial use by individuals and organizations. Every review feature remains available without payment; voluntary support does not buy an application-use license or unlock functionality.
- **D-03:** Permit installation, backups, and copying within an organization. Do not grant general public redistribution rights for source or compiled packages, including unchanged mirrors or externally distributed modified builds, except for D-06's independently applicable permissions.
- **D-04:** Permit users to modify source and compiled releases for personal or internal organizational use. Publishing source does not authorize unrestricted external redistribution of those modifications.
- **D-05:** Permission to use an acquired version is perpetual while its license terms are respected. Later releases or changed terms do not withdraw that version's grant. Do not promise updates, maintenance, or support.
- **D-06:** Preserve the permissions required by GitHub's terms for public repositories, including viewing and in-platform forking. The user explicitly accepted this qualification to the redistribution restriction after reviewing GitHub Terms of Service §D.5. Preserve independently applicable statutory and third-party license rights; the proprietary application license must not purport to override them.
- **D-07:** Describe the public source and downloadable compiled assets candidly. Public accessibility is not an open-source license. Do not add obfuscation, DRM, activation, a license server, or payment gates.

### Licensors and exact-text approval
- **D-08:** Name **Alessandro Magionami & Manuel Salvatore Martone** as the individual copyright holders and licensors. Do not substitute ShipWithAI as an assumed legal entity or rights holder. The supplied names express the user's intended attribution; they do not replace verification of rights in contributed or third-party material.
- **D-09:** Draft the proprietary terms from this context, then obtain explicit approval of the exact final text from **both Alessandro and Manuel**. Approval by Alessandro alone on behalf of both was offered and rejected. Discussion completion is not final license approval.
- **D-10:** Omit a special governing-law or exclusive-venue clause. Do not invent a jurisdiction. Include customary as-is warranty and liability limitations only to the extent permitted by applicable law, with no service, update, or maintenance commitment.
- **D-11:** Keep unresolved ownership, historical-license, dependency, bundled-material, and notice obligations as release/publication blockers. Do not assume that naming the licensors, changing package metadata, or adding proprietary text relicenses third-party material or extinguishes rights already granted. The exact wording and rights findings require human approval; an agent draft is not legal certification.

### Existing repository and history publication
- **D-12:** The intended public source repository is the existing **`Ship-With-AI/cumpa`**, including its reviewed Git history. Do not substitute a clean public snapshot, a second source repository, or a separate issue-only repository; those alternatives were not selected.
- **D-13:** Review tracked content and history for sensitive material and licensing obligations before changing visibility. The user was informed that the current checkout tracks 368 `.planning/` files and that a visibility change exposes history. Merely excluding material from the npm tarball or deleting it at HEAD does not establish safe history publication.
- **D-14:** Keep visibility private until the publication review and both licensors' exact-text approvals are satisfied. If remediation requires deleting material or rewriting history, stop for separate approval before destructive changes. Do not publish unresolved credentials, confidential operational material, or content lacking publication rights.
- **D-15:** No repository-visibility change, history rewrite, package publication, or license approval occurs as part of this discussion. These are execution actions subject to the reconciled milestone and the gates above.

### Public user documentation and contact metadata
- **D-16:** Use a self-contained npm README covering exact global and `npx` installation, Node.js/Git prerequisites, ordinary review and agent-handoff basics, source-available proprietary licensing, and voluntary support. Keep private-checkout build instructions and operational instructions out of the npm user guide. Public-source publication does not require shipping development material inside the npm archive.
- **D-17:** Use **`https://github.com/Ship-With-AI/cumpa/issues`** for public problem reports and questions once the repository is public and the link is verified without private access. Do not use the marketplace's issue tracker or create another tracker. The current repository has Issues enabled but is still private; it is not yet a functioning public contact channel.
- **D-18:** Omit a separate `homepage` and do not invent a Cumpa website, email address, support SLA, or documentation host. The npm README is the product guide; the verified issue tracker is the contact channel. The ShipWithAI newsletter was offered as a publisher homepage and not selected.
- **D-19:** Retain the exact intended package identity `@shipwithai/cumpa@1.5.0`, `cumpa` executable, Node.js 24+ requirement, proprietary license-file metadata, and real `Ship-With-AI/cumpa` repository identity. Public-facing links must be usable before release documentation claims they are public.

### Milestone reconciliation and release truthfulness
- **D-20:** Reconcile `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, and `.planning/ROADMAP.md` before finalizing downstream plans. Specifically: replace PKG-07's perpetual private-repository/source/history requirement with the approved-publication boundary in D-12–D-15; align PKG-06's source-rights description with D-01–D-06; update REL-04's private-repository wording; and reassess REL-05 and related out-of-scope/future-provenance statements because the private-source premise no longer applies. Preserve existing requirement IDs and phase ownership where possible rather than creating a parallel contract.
- **D-21:** Do not perpetuate the blanket claim that npm provenance is unavailable for this release merely because the repository is private today. npm's documentation checked on 2026-09-07 describes automatic provenance for eligible trusted publishing of public packages from public repositories. Research must check the actual source visibility, workflow, runner, package metadata, and publication conditions; retain documented automatic provenance when eligible and make release claims only from verified emitted evidence. This discussion does not prove a published attestation exists.
- **D-22:** Keep OIDC trusted publishing without long-lived publication credentials, the usable non-`latest` bootstrap and authorization revocation, and the single reviewed immutable tarball contract. Repository publication does not relax PKG-05's archive exclusions: source, source maps/embedded source, tests, fixtures, planning files, workflows, credentials, local state, marketplace skill files, and Git data remain outside the npm artifact.
- **D-23:** Preserve the independently MIT-licensed skill, separately installed CLI prerequisite, CLI-owned review authority, and feature-neutral voluntary-support behavior. No new application functionality or protocol redesign was requested.

### Claude's Discretion
- Exact license drafting and document organization within these permissions; both licensors approve the final legal text.
- Technical inventory, notice assembly, publication-review methods, package license-file naming, and accurate metadata syntax, using existing mechanisms where appropriate.
- Technical provenance integration and verification under current npm documentation and the unchanged exact-artifact/OIDC requirements. Do not silently choose a different license, public repository, redistribution grant, or destructive remediation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Active scope and explicit revision
- `.planning/phases/03-distribution-contract-legal-boundary/03-CONTEXT.md` — This discussion's decisions, including the explicit source-publication reversal and GitHub platform-rights exception.
- `.planning/PROJECT.md` — Product constraints and reconciled proprietary source-available milestone intent.
- `.planning/REQUIREMENTS.md` — Reconciled PKG-06, PKG-07, REL-02, REL-04, REL-05 and linked exclusions; 19 active IDs and phase assignments are preserved.
- `.planning/ROADMAP.md` — Reconciled Phase 3 boundary and unchanged Phases 4–7 dependency order; package exclusions, eligible provenance, and source-publication gates now agree with this context.

### Existing package, documentation, and protection surfaces
- `package.json` — Current private `cumpa@0.0.0`, generated executable, Node baseline, package allowlist, and dependency versions; intended release metadata has not yet been applied.
- `package-lock.json` — Exact dependency graph for rights and notice analysis; do not rely only on top-level dependency names.
- `README.md` — Existing review/agent usage material to reuse; private-checkout installation and bundled-skill instructions are not the selected public installation contract.
- `THIRD_PARTY_NOTICES.md` — Existing third-party material, introduced with Microsoft-specific attribution; not evidence of an approved application license or a complete Cumpa dependency audit.
- `scripts/verify-production-artifacts.mjs` — Existing npm inventory/archive and protected-value checks; useful package protection mechanism, not a Git-history publication audit.
- `.github/workflows/deploy-supabase-production.yml` — Existing protected hosted-deployment boundary; do not weaken it when preparing public-source publication or the separate npm workflow.
- `docs/support-service-operations.md` — Existing canonical-origin, operational-data, and production artifact protection rules; review public exposure rather than treating the payment endpoint as a contact channel.

### Carried-forward product decisions
- `.planning/milestones/v1.4-phases/01-add-voluntary-stripe-support-payment-and-email-recovery/01-CONTEXT.md` — Unrestricted review, voluntary payment, and no support entitlement; its email recovery mechanism was superseded by the next context.
- `.planning/milestones/v1.4-phases/02-move-the-implementation-to-supabase/02-CONTEXT.md` — Active Supabase/GitHub OAuth authority and protected operational boundary; publication must preserve those protections.
- `.kimi-code/skills/spike-findings-cumpa/SKILL.md` — Validated packaged-runtime and source-discovery constraints; no new picker work is in scope.
- `.kimi-code/skills/spike-findings-cumpa/references/cli-source-discovery.md` — Performance and native-Git behavior that distribution changes must not regress.

### External platform and release references
- `https://github.com/Ship-With-AI/cumpa` — Exact repository identity; authenticated GitHub metadata verified PRIVATE, unarchived, and Issues enabled on 2026-09-07. Publication remains gated.
- `https://github.com/Ship-With-AI/cumpa/issues` — Selected future public tracker; verify public accessibility after the approved visibility change.
- `https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#d-user-generated-content` — GitHub public-content permissions, especially §D.5 on viewing/forking; the user accepted preserving required platform rights.
- `https://docs.npmjs.com/trusted-publishers/` — OIDC identity and automatic public-source provenance conditions, checked 2026-09-07; recheck before release.
- `https://docs.npmjs.com/generating-provenance-statements/` — Public repository metadata prerequisites and attestation verification; authentication alone is not attestation evidence.

No external legal draft, design specification, or counsel opinion was supplied.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `package.json` already declares Node `>=24` and `dist/bin/cumpa.mjs`; retain the working command/runtime boundary while changing release identity and license metadata.
- `README.md` already documents review and agent-handoff behavior. Reuse accurate user-facing content rather than creating a second product contract.
- `THIRD_PARTY_NOTICES.md` is existing material to preserve and reconcile, not a substitute for dependency/source/history rights verification. No application `LICENSE` file was found in the repository scan.
- `scripts/verify-production-artifacts.mjs` already examines npm inventory and extracted archives for protected values and retired runtime content. It does not establish absence of sensitive content in Git history.

### Established Patterns
- Native Git owns review semantics; the CLI owns browser launch, persistence, Finish, and canonical output. This phase changes distribution terms and disclosures, not those behaviors.
- Published-package verification and protected hosted deployment already separate local runtime content from hosted authority. Public source does not authorize publishing credentials or privileged operational inputs.
- Voluntary support remains feature-neutral; payment must not become a license or access gate.

### Integration Points
- Metadata and user documentation converge at `package.json`, the packaged README, the approved application license file, and required notices.
- A visibility change affects the existing source repository and history, not just npm contents. The current 368 tracked planning files make that distinction concrete.
- The Cumpa repository already has Issues enabled; a separate tracker is unnecessary once the approved public-visibility transition is complete.
- Phase 4 retains compiled-runtime-only archive preparation; Phase 5 must consume the reconciled source/provenance policy without rebuilding the approved tarball; Phases 6–7 retain independent skill distribution and clean installation acceptance.

</code_context>

<specifics>
## Specific Ideas

- User's scope-changing statement: “the Cumpa source code can be open, so the repository should become public”.
- Follow-up choices explicitly clarified **public source with a proprietary license**, **the existing repository and history**, and **preservation of GitHub platform rights** — not open-source licensing, a source snapshot, or unrestricted redistribution.
- Final license wording requires approval by both named people, even though the discussion was conducted with Alessandro.

</specifics>

<deferred>
## Deferred and Gated Work

- **Milestone-scope reconciliation completed:** At the user's request, GSD quick task `260907-gdm` applied the explicit source-publication revision to the active project, requirements, roadmap, and continuity state. D-20's reconciliation prerequisite is satisfied; legal approval, rights review, and actual repository publication remain pending execution.
- **Gated execution:** Exact legal drafting/approval, rights and sensitive-history review, repository-visibility mutation, and any separately approved history remediation have not been performed.
- **Later phases:** Runtime tarball production, registry bootstrap/stable publication, marketplace release, and clean released-artifact acceptance remain in Phases 4–7. No new review features were added.

</deferred>

---

*Phase: 03-distribution-contract-legal-boundary*
*Context gathered: 2026-09-07*
