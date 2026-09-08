# Phase 3: Distribution Contract & Legal Boundary — Context

**Gathered:** 2026-09-07
**Reconciled:** 2026-09-08
**Status:** Active MIT distribution contract; publication remains gated.

<domain>
## Phase Boundary

Establish the standard MIT license, accurate package metadata and public documentation, third-party notice obligations, and a safe source-publication boundary for `@shipwithai/cumpa@1.5.0`.

On 2026-09-08 the user explicitly ended the proprietary/anti-resale exploration: “Let's make MIT license.” This active choice supersedes the earlier proprietary source-available direction and its tentative bespoke-permission restrictions. Cumpa is MIT-licensed. The prior discussion and its exact approval record remain historical evidence only; neither reinstates proprietary terms nor approves the different MIT bytes.

Runtime-only npm packaging, immutable artifact preparation, bootstrap/stable publication, marketplace distribution, and released-artifact acceptance remain later phases' responsibilities. Existing review, export, agent handoff, and voluntary-support behavior is unchanged.
</domain>

<decisions>
## Active Decisions

### MIT application license
- **D-01:** Use the unmodified standard MIT license for Cumpa, with only the copyright holder/year substitution: **Copyright (c) 2026 Alessandro Magionami & Manuel Salvatore Martone**.
- **D-02:** MIT downstream recipients may use, copy, modify, merge, publish, distribute, sublicense, and sell copies, subject only to the standard MIT notice condition and disclaimer. Do not add anti-resale, noncommercial, hosted-service, support, permission, approval, or other bespoke conditions to those grants.
- **D-03:** Maintainer publication gates—renewed exact-text assent, rights/exposure review, scoped mutation authority, and final publication authorization—govern whether maintainers publish this repository/package. They do not restrict rights already granted by MIT to a recipient.
- **D-04:** Preserve independently applicable third-party notices and grants. The MIT application license neither removes them nor establishes ownership of material the licensors cannot license.
- **D-05:** Do not add DRM, activation, license servers, payment gates, or support obligations. Voluntary support remains feature-neutral.

### Licensors and refreshed exact-text assent
- **D-06:** Name **Alessandro Magionami & Manuel Salvatore Martone** as the copyright holders in the current MIT text. Do not substitute ShipWithAI as an assumed rights holder.
- **D-07:** The proprietary approval record is historical and explicitly superseded for the current MIT LICENSE. Record the exact current MIT digest; obtain attributable renewed assent to those exact bytes from both named licensors before any maintainer publication. Do not fabricate, proxy, or infer either assent.
- **D-08:** Outstanding ownership, historical-license, dependency, bundled-material, notice, rights, or sensitive-exposure findings remain publication blockers. An agent record is not legal certification.

### Existing repository and publication boundary
- **D-09:** The intended public source repository is the existing **`Ship-With-AI/cumpa`**, including its reviewed Git history. Do not substitute a clean snapshot, second source repository, or separate issue-only repository.
- **D-10:** Review tracked content, history, GitHub surfaces, and protections before changing visibility. A clean HEAD or npm scan does not clear historical or non-Git exposure.
- **D-11:** Keep the repository private until the current MIT exact-text assents, rights/exposure review, scoped private-preparation authorization where applicable, and final publication authorization are satisfied. Separate approval is required for destructive remediation.
- **D-12:** No repository-visibility change, history rewrite, package publication, or renewed license assent occurs merely by recording this context.

### Package, documentation, and later-phase boundaries
- **D-13:** The npm README uses the exact package identity, Node.js/Git prerequisites, ordinary review and agent-handoff guidance, MIT licensing, and the verified public Issues link when available. It does not invent a homepage, contact channel, service commitment, or recipient permission process.
- **D-14:** Keep `@shipwithai/cumpa@1.5.0`, `cumpa`, Node.js 24+, the current package boundary, and runtime-only npm scope. Phase 4 owns the final tarball and included LICENSE/notices.
- **D-15:** Phase 5 owns registry publication and actual provenance evidence. Preserve eligible trusted-publishing/provenance behavior but claim only verified emitted evidence.
- **D-16:** The existing skill remains independently distributed; matching MIT licensing does not merge package boundaries or installation lifecycles.
</decisions>

<historical_record>
## Superseded Historical Direction

The 2026-09-07 proprietary source-available interview, decision labels D-01 through D-23, completed plan summaries, research, and rights review document the state and evidence available then. They are not an active grant, a current publication authorization, or evidence of assent to the 1,104-byte MIT LICENSE. Preserve them without rewriting history; this context and the active approval/publication records control current work.
</historical_record>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/phases/03-distribution-contract-legal-boundary/03-CONTEXT.md` — active MIT terms and publication-only gate distinction.
- `.planning/phases/03-distribution-contract-legal-boundary/03-LICENSE-APPROVAL.md` — current MIT digest, pending renewed assent, and preserved proprietary approval evidence.
- `.planning/phases/03-distribution-contract-legal-boundary/03-PUBLICATION-REVIEW.md` — current-state supersession plus preserved exposure, artifact-removal, protection, and security gates.
- `LICENSE` — authoritative standard MIT bytes.
- `THIRD_PARTY_NOTICES.md` — independently applicable notice material.
- `docs/distribution-operations.md` — maintainer publication and later artifact/provenance boundaries.

The top-level project, requirements, roadmap, and state documents retain the 19 requirement IDs, phase sequence, dependencies, and runtime-only npm scope under the v1.5 MIT Distribution milestone.
</canonical_refs>

<deferred>
## Deferred and Gated Work

- Renewed attributable exact-text MIT assent from both named licensors is pending; prior proprietary approvals cannot satisfy it.
- The existing source/history and GitHub-surface review, legacy artifact-removal gate, protection disposition, scoped mutation authority, and final publication authorization remain pending.
- Phase 4 owns the exact runtime-only tarball and notice inclusion. Phase 5 owns registry publication and actual provenance evidence. No application or support behavior changes are in scope.
</deferred>

---

*Phase: 03-distribution-contract-legal-boundary*
*Current contract reconciled: 2026-09-08*
