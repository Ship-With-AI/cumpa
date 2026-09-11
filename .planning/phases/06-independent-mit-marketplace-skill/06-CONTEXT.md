# Phase 6: Independent MIT Marketplace Skill - Context

**Gathered:** 2026-09-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Publish the existing thin Cumpa skill in the public `Ship-With-AI/skills` marketplace as an independently MIT-licensed delegate to the separately installed Cumpa CLI. Satisfy SKL-01, SKL-02 and SKL-03 without bundling or installing the application, duplicating its review logic, or changing its protocol.

Phase 5 is complete: `@shipwithai/cumpa@1.5.0` is publicly available with verified bytes, provenance, normal global installation and exact-version npx execution. Its publication authority is consumed. Older progress statements in PROJECT.md are not current release evidence; use the Phase 5 verification and release records below.

Phase 6 covers skill distribution, explicit compatibility/prerequisite behavior, and installation/discovery guidance and targeted checks for the selected agents. Full clean public-artifact browser-review acceptance remains Phase 7.
</domain>

<decisions>
## Implementation Decisions

### Marketplace packaging
- **D-01:** Add Cumpa to the existing `ship-with-ai` collection in `Ship-With-AI/skills`, under the established `skills/cumpa/` layout. Do not create a standalone Cumpa plugin or a new marketplace. Native Claude Code plugin users receive the collection; Skills CLI users can select only Cumpa.
- **D-02:** Carry a self-contained MIT license with the Cumpa skill. Preserve the approved standard MIT text and the existing copyright attribution to Alessandro Magionami & Manuel Salvatore Martone from the source repository. This carries forward the legal boundary already decided; it does not relicense other marketplace skills, merge application and skill installation lifecycles, or invent new legal assent.

### Installed CLI compatibility
- **D-03:** Accept stable Cumpa CLI versions **`>=1.5.0 <2.0.0`**. Reject prereleases, older versions, major version 2 or later, and unparseable version output. The user explicitly chose this broader 1.x compatibility policy over an exact-version or 1.5.x-only gate.
- **D-04:** If `cumpa` is missing, incompatible, or reports an unparseable version, stop and show the exact command `npm install --global @shipwithai/cumpa@1.5.0`, together with the Node.js 24+ and Git 2.43.0+ prerequisites. Never automatically install, upgrade, fall back to npx, or substitute a source checkout/local tarball.
- **D-05:** Keep the distinction between policy and proof: 1.5.0 is the independently verified release. Accepting future stable 1.x versions is not evidence that those versions have been tested. Do not claim future compatibility has already been exercised.

### Supported agent paths
- **D-06:** Explicitly support **Claude Code, Codex, Pi, and OMP**. Pi and OMP are distinct targets; do not treat one target's result as evidence for the other. This four-agent list is the user's custom selection.
- **D-07:** Research and document the actual supported installation/discovery path and invocation form for each target, then perform targeted installation/discovery and prerequisite checks for all four. Reuse the marketplace's native plugin and selective Skills CLI paths where supported. Do not assume the Skills CLI supports OMP or Pi merely because it advertises many agents; do not invent a blanket "40+ agents verified" claim. Actual namespaces, discovery locations, and process-supervision behavior must be established rather than guessed.

### Existing review authority and phase boundaries
- **D-08:** Preserve the existing skill's delegation contract. Native Git resolves requested identities; Cumpa remains responsible for grounding validation, diff generation, the browser workspace, persistence, Finish, and canonical output. Keep the supervised process alive through human review; readiness is not completion. Consume feedback only after successful exit and valid canonical JSON. Do not replace the review with the agent's own diff review, apply feedback, create review commits, mutate refs/index/worktrees, or synthesize patches to extend the protocol.
- **D-09:** Keep the skill outside the runtime-only npm artifact and preserve feature-neutral voluntary support. Do not rebuild or republish Cumpa, alter Supabase configuration, add a release framework, or expand this phase into new review behavior. Phase 7 owns the complete public browser-review/Finish/export acceptance flows.
- **D-10:** This discussion authorizes local planning records only. Implementation, marketplace publication, source pushes, and workflow actions require their later scoped execution/approval steps. Continue work on `main` without GSD branches/worktrees; preserve unrelated user work, authentication, historical release records and immutable candidate custody. Do not reuse any consumed Phase 5 authority.

### Implementation discretion

No additional product choices were delegated with a "you decide" answer. Research and planning should resolve ordinary implementation details using existing repository conventions: prerequisite-check mechanics, portable agent instructions, any required collection-version metadata update, and how the repository-owned source relates to the marketplace copy. Avoid unnecessary helpers, dependencies, duplicate application logic, or a synchronization framework. Report genuine unsupported-agent or publication prerequisites instead of silently dropping a selected target.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.** Paths below are repository-relative; external marketplace references identify their own repository explicitly. Refresh external observations before proposing a publication mutation.

### Scope and inherited decisions
- `.planning/ROADMAP.md` — Phase 6 success criteria and Phase 7 acceptance boundary.
- `.planning/REQUIREMENTS.md` — SKL-01, SKL-02, SKL-03; separate CLI lifecycle and unchanged-protocol exclusions; ACC-01 through ACC-04 remain Phase 7.
- `.planning/PROJECT.md` — product boundaries and existing agent handoff. Its dated progress statements are superseded by the Phase 5 records for current release availability.
- `.planning/phases/03-distribution-contract-legal-boundary/03-CONTEXT.md` — standard MIT, attribution, independent grants, and separate skill distribution.
- `.planning/phases/05-bootstrap-trusted-stable-publication/05-CONTEXT.md` — preserved release boundaries and consumed authority must not be broadened.
- `.planning/phases/05-bootstrap-trusted-stable-publication/05-VERIFICATION.md` — completed release prerequisite and explicit limits of the verified behavior.
- `.planning/phases/05-bootstrap-trusted-stable-publication/05-RELEASE-EVIDENCE.json` — actual published 1.5.0 identity and bounded public verification, not permission for further publication.

### Existing skill and application contracts
- `.kimi-code/skills/cumpa/SKILL.md` — repository-owned existing thin skill, ordered revision/exact-patch requests, supervision, Finish and feedback consumption.
- `LICENSE` — approved standard MIT text and copyright attribution to preserve in the skill's own license.
- `README.md` — exact public CLI installation command, Node/Git prerequisites, request examples and canonical handoff behavior.
- `docs/distribution-operations.md` — independent distribution boundaries and scoped publication/evidence policy.
- `.kimi-code/skills/spike-findings-cumpa/SKILL.md` and `.kimi-code/skills/spike-findings-cumpa/references/cli-source-discovery.md` — inherited native Git authority; do not recreate application discovery or mutate repositories for convenience.

### Existing public marketplace
- `Ship-With-AI/skills` repository, `README.md` — https://github.com/Ship-With-AI/skills/blob/main/README.md — existing native plugin and selective Skills CLI installation conventions.
- `Ship-With-AI/skills` repository, `.claude-plugin/marketplace.json` — https://github.com/Ship-With-AI/skills/blob/main/.claude-plugin/marketplace.json — catalog name `ship-with-ai-skills`, existing `ship-with-ai` entry and root source.
- `Ship-With-AI/skills` repository, `.claude-plugin/plugin.json` — https://github.com/Ship-With-AI/skills/blob/main/.claude-plugin/plugin.json — collection identity, declared MIT metadata and `./skills/` discovery root.

No separate Phase 6 SPEC.md was present. The roadmap/requirements and decisions above define the scope.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.kimi-code/skills/cumpa/SKILL.md` already implements a thin instruction-based delegate. Reuse it rather than invent another review client or protocol.
- The released CLI already exposes `cumpa --version`, strict stdin requests, stderr-only URL/diagnostics, and canonical stdout after Finish.
- Existing approved MIT text can accompany the separately distributed skill without changing the application license.

### Established Patterns
- The public marketplace currently has one collection plugin with `skills: "./skills/"`; its observed plugin version was `0.2.0`. This is a discovery snapshot, not a pinned publication target or a decision about the next version.
- Marketplace documentation already presents selective `npx skills add Ship-With-AI/skills --skill <name>` and native collection installation. Preserve these conventions rather than introducing another package/install manager.
- The existing Cumpa skill checks command availability but lacks the selected version gate and complete missing-CLI instructions. Those are the substantive instruction changes needed by this discussion.
- The marketplace manifest declares MIT, but the observed repository root contained only `.claude-plugin`, `README.md`, and `skills`, not a root LICENSE. Supply Cumpa's own license; do not assume metadata alone supplies the required text or expand into an audit of every other skill.

### Integration Points
- Add `skills/cumpa/` and its own license to the existing marketplace collection; update relevant public guidance and only the metadata required by the established release mechanism.
- Establish real invocation names/namespaces and supported supervised-process mechanisms for Claude Code, Codex, Pi and OMP. Do not copy harness-specific assumptions into unsupported environments.
- Preserve the CLI's existing stdin/stderr/stdout contract, exit handling, request limits and temporary-file cleanup. Installed copies must not require the Cumpa source checkout or an author's private paths.
</code_context>

<specifics>
## Specific Ideas

The intended selective installation command after publication is `npx skills add Ship-With-AI/skills --skill cumpa`. Native collection installation follows the existing marketplace registration and `ship-with-ai@ship-with-ai-skills` plugin identity. These are intended post-publication instructions, not a claim that Cumpa is already present in that marketplace.

The user selected **Existing collection**, **Stable 1.x from 1.5.0**, and then explicitly supplied **Claude Code, Codex, Pi, OMP**. They confirmed they were ready to record this context. No automatic installation, implementation, publication or new remote authority was approved.
</specifics>

<deferred>
## Deferred Ideas

No new capabilities were proposed. Preserve the existing Phase 7 boundary for full clean public-artifact browser review and canonical-result acceptance. Independently versioned update/uninstall guidance remains future DIST-02; do not turn this phase into a lifecycle-management system.
</deferred>

---

*Phase: 06-independent-mit-marketplace-skill*
*Context gathered: 2026-09-11*
