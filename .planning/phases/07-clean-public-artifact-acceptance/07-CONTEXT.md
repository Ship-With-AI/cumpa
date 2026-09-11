# Phase 7: Clean Public-Artifact Acceptance - Context

**Gathered:** 2026-09-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Satisfy ACC-01 through ACC-04 by completing the existing browser-review workflow through all three public installation paths: exact global `@shipwithai/cumpa@1.5.0`, literal `npx --yes @shipwithai/cumpa@1.5.0` with an initially empty npm cache and no prior/local Cumpa installation, and the public marketplace skill invoking the separately installed exact CLI. Review and export remain unrestricted when voluntary support is unpaid, dismissed, or verified.

The application under acceptance must come from public npm, never the Cumpa source checkout, a workspace link, a local tarball, or a rebuilt substitute. A disposable Git repository supplies review content; it is not an application source dependency.

Phase 5 published the exact CLI and verified public bytes and version-only consumer commands. Phase 6 published the skill in the existing `ship-with-ai` collection version `0.3.0`, at marketplace commit `984e28c5838176ec15d2af8b996d0307e45b28d5`. Those records are prerequisites, not proof of Phase 7's complete public-install browser workflows. Dated progress statements in PROJECT.md do not supersede the later release and marketplace evidence.
</domain>

<decisions>
## Implementation Decisions

### Clean-environment coverage
- **D-01:** Use **isolated local environments**, not a fresh machine/VM and not both approaches. The user explicitly selected this after asking what clean-environment acceptance means.
- **D-02:** Separate fresh HOME/settings, npm cache/configuration/install prefix, and browser profile state for the installation paths. Run outside the Cumpa checkout against disposable review repositories. Preserve the user's existing installations, caches, settings, skills, authentication, and review data; prevent accidental resolution to an existing Cumpa executable or shared cached package.
- **D-03:** Report the actual host platform and isolation boundary. Local isolation is not fresh-machine proof or an operating-system/browser compatibility matrix. Do not claim platforms or agent runtimes that were not exercised.

### Marketplace agent proof
- **D-04:** Use **OMP** for ACC-03: an isolated OMP profile installs the public native marketplace collection, discovers the installed Cumpa skill, invokes the separately installed exact `1.5.0` CLI, waits through browser review and Finish, and consumes the validated canonical result.
- **D-05:** Claude Code, Codex, Pi, and OMP remain the documented targets from Phase 6, but this phase selects OMP for the new clean-profile end-to-end proof. Do not reopen the waived Phase 6 four-agent installation/authentication/discovery/prerequisite/lifecycle exercise or turn its waived rows into passed results. OMP success establishes no new runtime proof for the other three targets.
- **D-06:** Preserve the published skill's separate-install and supervision contract: no automatic CLI installation/upgrade, npx fallback inside the skill, duplicate review logic, agent-authored review in place of the browser, automatic feedback application, or review-completion claim based only on readiness. The independent npx acceptance path remains required by ACC-02.

### Verified-support proof
- **D-07:** Obtain genuinely verified support through **Restore with an already-paid GitHub account**. The user handles any required protected sign-in during execution. Do not make a new support purchase, fabricate a paid flag, mock a successful hosted response, or manually seed production payment data to claim real verification.
- **D-08:** Availability of a usable paid account and successful restoration are execution prerequisites, not observations made during this discussion. If restoration cannot be completed, finish reachable checks but leave verified-state acceptance and ACC-04 blocked/incomplete. Never substitute earlier unavailable/dismissal evidence for the missing verified-state result.
- **D-09:** Preserve the real hosted authority and ordinary Restore effects. No new payment, deployment, provider configuration change, or manual database mutation is selected. All three installation paths still need evidence of unrestricted review/export across the required support states; the chosen proof source does not narrow ACC-04.

### Review walkthrough
- **D-10:** Use an **automated walkthrough of the actual browser**, not a mandatory hands-on review or automation followed by a separate manual acceptance pass. Human intervention is limited to protected steps such as the Restore sign-in.
- **D-11:** Exercise and validate the existing review contract: comments, accepted summary, persistence/resume, readable Markdown and canonical JSON exports, and attached Finish/result delivery. Reuse the existing range and exact-patch acceptance scenarios where applicable; do not replace them with launch-only or version-only checks. The agent must receive actual canonical output after successful terminal completion, not a fixture or synthesized result.

### Scope and authority
- **D-12:** This discussion authorizes local planning records only. It starts no installer, agent/provider request, login, browser acceptance, payment, publication, push, or deployment. Phase 5 and Phase 6 publication authorities are consumed and cannot be reused. Keep subsequent source work on the established main-only path without GSD branches/worktrees; preserve unrelated user work and immutable historical release evidence.

### Implementation discretion

No extra product decisions were delegated through a "you decide" response. The researcher and planner should resolve ordinary implementation details from existing patterns: public-install adapters, browser automation reuse, isolated OMP profile and supported authentication handling, disposable review fixtures, bounded evidence, and owned scratch cleanup. Do not invent a new release/test framework, duplicate application contracts, or request the waived four-agent sign-ins. Identify genuine protected execution prerequisites without silently reducing acceptance scope.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.** References are repository-relative; the marketplace identity above is bound by the local publication evidence.

### Scope and carried-forward decisions
- `.planning/ROADMAP.md` — Phase 7 goal and all four success criteria.
- `.planning/REQUIREMENTS.md` — ACC-01 through ACC-04, separate installation lifecycles, and unchanged product scope.
- `.planning/PROJECT.md` — established review, export, agent-handoff, and feature-neutral support contracts; use later phase evidence for current publication status.
- `.planning/phases/03-distribution-contract-legal-boundary/03-CONTEXT.md` — standard MIT and independent application/skill distribution boundaries.
- `.planning/phases/05-bootstrap-trusted-stable-publication/05-CONTEXT.md` — immutable release history, clean public consumers, and separate/consumed publication authority.
- `.planning/phases/06-independent-mit-marketplace-skill/06-CONTEXT.md` — supported targets, thin delegation, version policy, and explicit D-07/D-11 test waiver and D-12 consumed publication authority.

### Published prerequisites and operational boundaries
- `.planning/phases/05-bootstrap-trusted-stable-publication/05-VERIFICATION.md` — completed publication checks and their limitations.
- `.planning/phases/05-bootstrap-trusted-stable-publication/05-RELEASE-EVIDENCE.json` — exact published CLI identity and bounded public consumer proof.
- `.planning/phases/06-independent-mit-marketplace-skill/06-VERIFICATION.md` — retained marketplace proof versus waived runtime observations.
- `.planning/phases/06-independent-mit-marketplace-skill/06-PUBLICATION-EVIDENCE.json` — published collection commit/file identities and consumed authority.
- `README.md` — public installation commands, prerequisites, and review/handoff guidance.
- `docs/distribution-operations.md` — immutable artifact, public-consumer, configuration, and evidence boundaries.
- `docs/support-service-operations.md` — existing hosted deployment and support boundary; this phase is not a deployment task.
- `.kimi-code/skills/cumpa/SKILL.md` — repository-owned published-skill contract, native OMP installation/invocation, supervision, Finish, and canonical-result consumption. Acceptance must use the public installed copy, not this checkout copy.

### Existing acceptance assets and support contracts
- `tests/helpers/runtime-artifact.ts` — protected installation state, runtime dependency observations, and current local-tarball/hosted-denial assumptions.
- `tests/helpers/open-runtime-session.ts` — browser readiness and support dismissal behavior.
- `tests/e2e/package-assets.spec.ts` — installed browser-asset graph acceptance.
- `tests/e2e/agent-ready-export.spec.ts` — installed review/resume/export, exact-patch Finish, and support-unavailable scenarios.
- `playwright.runtime-artifact.config.ts` — existing Chromium acceptance suite configuration.
- `src/server/support-store.ts` — installation-wide unverified/verified state and persistence contract.
- `src/server/support-client.ts` — canonical hosted start/status API used by the real support flow.
- `.kimi-code/skills/spike-findings-cumpa/SKILL.md` and `.kimi-code/skills/spike-findings-cumpa/references/cli-source-discovery.md` — preserve native Git authority and avoid mutating the reviewed repository for convenience.

No separate Phase 7 SPEC.md or external acceptance specification was present. The roadmap, requirements, inherited contracts, and decisions above define the scope.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/helpers/runtime-artifact.ts` already creates private temporary HOME/cache/prefix/config state and checks the installed package and generated executable. Reuse relevant isolation patterns rather than adding another installation framework.
- The existing package-assets and agent-ready-export suites already exercise the real browser, installed assets, durable review state, export recovery, range/exact-patch handoff, and support-unavailable dismissal.
- The published skill documents OMP native marketplace discovery and `hub`-supervised CLI lifetime. Readiness and successful Finish are distinct observations.

### Established Patterns
- Existing runtime-artifact acceptance installs a supplied local archive. That installation source cannot satisfy Phase 7; the accepted application must be fetched via each actual public installation path.
- Existing artifact acceptance blocks non-loopback hosted access using a test-side fetch guard and browser routing. That proves unavailable/dismissed behavior, not live unpaid status or successful paid restoration. Do not carry the denial setup into the live Restore proof and claim equivalent coverage.
- `openRuntimeSession` automatically dismisses an unverified support prompt after a successful refresh. Support-state evidence must account for that behavior rather than assume it independently exercises every state.
- The hosted support client obtains installation status from the configured service; the store persists verified status installation-wide. Real Restore is the selected entry into verified state; manually writing the store is not the acceptance proof.
- Phase 5's clean global/npx consumer commands verify `--version`, not the complete browser-review workflow now required.

### Integration Points
- Connect public global/npx process launch to the existing real-browser review and canonical-result assertions while preserving separation from source builds/local archives.
- Execute the actual installed marketplace skill in an isolated OMP profile with a separately installed exact CLI; a direct helper invocation alone does not prove agent discovery and handoff.
- Gather bounded installation, browser, support-state, export, and process-completion evidence. Preserve the existing exclusion of credentials, live authentication URLs, private paths, and raw sensitive provider data from durable records.
</code_context>

<specifics>
## Specific Ideas

The user's explicit choices were **"go for isolated local env"**, **OMP**, **Restore existing support**, and **Automated walkthrough**. The user then selected **Ready to record context**. No acceptance run or protected action was performed during this discussion.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. A fresh machine/VM, an unobserved cross-platform matrix, new purchases, and an additional mandatory hands-on review were not selected. These are not promises of future work. The existing Phase 6 four-agent waiver remains intact.
</deferred>

---

*Phase: 07-clean-public-artifact-acceptance*
*Context gathered: 2026-09-11*
