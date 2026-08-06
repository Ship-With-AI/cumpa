# Roadmap: Compare

## Overview

v1.3 adds one attached agent-to-human review handoff without creating a second review product: Compare accepts a strict stdin request, grounds either a pinned Git range or an exact already-applied patch, reuses the authenticated browser workspace, and returns one canonical review result after explicit completion. Work proceeds in the research-confirmed order so stream ownership and range scope are established before the focused patch-grounding validation, attached lifecycle, and adversarial integration gate.

## Milestones

- **[v1.0 MVP](./milestones/v1.0-ROADMAP.md)** — Phases 01–04.1, 40 plans, shipped 2026-07-24.
- **[v1.1 GitHub Dark Diff](./milestones/v1.1-ROADMAP.md)** — Phases 05–08, 16 plans, 18/18 requirements, shipped 2026-07-29.
- **[v1.2 Fast Source Discovery](./milestones/v1.2-ROADMAP.md)** — Phases 09–11, 4 plans, 5/5 requirements, shipped 2026-07-30.
- **v1.3 Agent Review Handoff** — Phases 12–15, 17/17 requirements mapped.

## Phases

- [x] **Phase 12: Request Protocol & Range Grounding** — Accept one strict stdin request while preserving interactive launch and pinning native-Git range scope. (completed 2026-08-04)
- [x] **Phase 13: Exact Patch Grounding** — Prove and deliver read-only review of an exact repository-grounded, already-applied patch. (4/4 plans complete; phase verification pending) (completed 2026-08-05)
- [x] **Phase 14: Attached Lifecycle & Canonical Completion** — Reuse the browser review flow and return one validated canonical result only after explicit Finish. (completed 2026-08-06)
- [x] **Phase 15: Adversarial Integration Gate** — Prove attached and interactive review scopes remain isolated through the complete production handoff. (completed 2026-08-06)

## Phase Details

### Phase 12: Request Protocol & Range Grounding

**Goal**: Coding agents can submit one safe, versioned range request whose exact Git scope is pinned, while developers retain the existing interactive launch flow.
**Depends on**: Phase 11
**Requirements**: AGENT-01, AGENT-02, AGENT-03, RANGE-01, RANGE-02, RANGE-03
**Success Criteria** (what must be TRUE):

1. A coding agent can pipe one supported, versioned range request into `compare` without encountering the interactive source prompt, while a TTY launch still follows the existing ordered source-selection flow.
2. Malformed, oversized, invalid UTF-8, unknown-field, unsupported-version, and ambiguous-mode requests fail actionably with a nonzero exit before any browser opens.
3. A range request resolves its explicit ancestor base and head revisions once to full commit IDs and rejects an invalid contiguous range.
4. Ordered include and exclude pathspecs retain native Git meaning, and the developer sees only the resulting scoped file inventory.
5. Ref movement after launch cannot change the pinned commits, pathspec scope, blobs, draft identity, or feedback provenance for the range review.

**Plans**: 6/6 plans executed

- [x] 12-04-PLAN.md — Bind range drafts to frozen ordered path scope while preserving pair-only interactive persistence.
- [x] 12-05-PLAN.md
- [x] 12-06-PLAN.md

**Wave 1**

- [x] 12-01-PLAN.md — Route TTY and bounded stdin ownership through a strict versioned request boundary.
- [x] 12-02-PLAN.md — Ground ancestor range revisions and ordered native pathspec scope to immutable Git identities.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 12-03-PLAN.md — Carry pinned range scope through comparison, draft, and result provenance without changing interactive launch.

### Phase 13: Exact Patch Grounding

**Goal**: Coding agents can submit an exact already-applied patch and developers review only immutable bytes proven against repository-backed content.
**Depends on**: Phase 12
**Requirements**: PATCH-01, PATCH-02, PATCH-03, PATCH-04, PATCH-05
**Success Criteria** (what must be TRUE):

1. A coding agent can submit an exact already-applied patch as the request's sole input, and the developer sees only that patch's change set.
2. Compare rejects a patch unless every preimage is repository-grounded and every postimage exactly matches the implemented repository or worktree content.
3. Patch reviews preserve Git-derived paths and truthful added, modified, deleted, renamed, copied, mode-only, symlink, binary, and unsupported-file states.
4. Patch validation and review leave the real worktree, index, refs, and object store unchanged.
5. Accepted patch content remains frozen and readable until completion; later repository drift produces an explicit failure rather than different reviewed bytes.

**Plans**: 4/4 plans complete; phase verification pending

- [x] 13-01-PLAN.md — Validate strict exact-patch input, repository-object preimages, byte-exact implemented postimages, truthful metadata, and read-only grounding.
- [x] 13-02-PLAN.md — Materialize one private PatchSnapshot with exact draft identity, authenticated capabilities, and a dedicated patch-status endpoint.
- [x] 13-03-PLAN.md — Dispatch GroundedExactPatch through createExactPatchSessionApp and preserve frozen provenance in ordinary JSON/Markdown exports.
- [x] 13-04-PLAN.md — Wire the dedicated patch status into the approved exact-patch workspace, persistent readable drift, same-snapshot retry, and blocking snapshot loss.

### Phase 14: Attached Lifecycle & Canonical Completion

**Goal**: Developers can complete either agent-submitted review in the existing browser workspace and the waiting agent receives one exact, validated result.
**Depends on**: Phase 13
**Requirements**: HAND-01, HAND-02, HAND-03, HAND-04, HAND-05
**Success Criteria** (what must be TRUE):

1. Range and patch requests open the existing authenticated browser workspace with file navigation, Monaco diffs, comments, summary, persistence, and ordinary export behavior intact.
2. Only an explicit Finish review action reports successful completion; browser close, reload, disconnect, and ordinary export leave the attached review unfinished.
3. The invoking CLI remains attached until completion and emits exactly one canonical JSON success document on stdout while URLs, progress, and diagnostics remain on stderr.
4. Returned JSON binds the accepted summary, comments, and drift-detectable anchors to the exact submitted range/pathspec or patch identity.
5. Finish settles pending draft mutations and validates current anchors and scope before returning; stale feedback fails explicitly instead of becoming a successful result.

**Plans**: 3/3 plans executed; phase verification pending
**Wave 1**

- [x] 14-01-PLAN.md — Attach the authenticated browser session to an explicit, one-shot Finish lifecycle.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 14-02-PLAN.md — Render and enforce the attached lifecycle in the existing browser workspace.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 14-03-PLAN.md — Deliver exact canonical bytes over stdout with deterministic response, shutdown, and failure ordering.

**UI hint**: yes

### Phase 15: Adversarial Integration Gate

**Goal**: Agent-submitted and interactive review scopes remain isolated across the complete production handoff, including repeated equivalent submissions and failure paths.
**Depends on**: Phase 14
**Requirements**: HAND-06
**Success Criteria** (what must be TRUE):

1. Separate agent submissions over identical Git inputs retain independent request identities, drafts, exports, and returned feedback.
2. An agent-submitted review cannot resume, overwrite, or publish through an existing interactive review identity for the same revisions.
3. Completing or failing one attached review leaves every other attached or interactive review scope unchanged and cannot emit a duplicate or partial success result.

**Plans**: 1 plan placeholder

- [x] 15-01-PLAN.md — Exercise request, range, patch, browser completion, drift, stream, shutdown, and scope-collision scenarios through the production path.

## Coverage

| Requirement | Phase |
|-------------|-------|
| AGENT-01 | Phase 12 |
| AGENT-02 | Phase 12 |
| AGENT-03 | Phase 12 |
| RANGE-01 | Phase 12 |
| RANGE-02 | Phase 12 |
| RANGE-03 | Phase 12 |
| PATCH-01 | Phase 13 |
| PATCH-02 | Phase 13 |
| PATCH-03 | Phase 13 |
| PATCH-04 | Phase 13 |
| PATCH-05 | Phase 13 |
| HAND-01 | Phase 14 |
| HAND-02 | Phase 14 |
| HAND-03 | Phase 14 |
| HAND-04 | Phase 14 |
| HAND-05 | Phase 14 |
| HAND-06 | Phase 15 |

**Coverage:** 17/17 v1.3 requirements mapped exactly once. No future or out-of-scope requirement is included.

## Progress

**Execution Order:** Phase 12 → Phase 13 → Phase 14 → Phase 15

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 12. Request Protocol & Range Grounding | v1.3 | 6/6 | Complete    | 2026-08-04 |
| 13. Exact Patch Grounding | v1.3 | 4/4 | Complete    | 2026-08-05 |
| 14. Attached Lifecycle & Canonical Completion | v1.3 | 3/3 | Complete    | 2026-08-06 |
| 15. Adversarial Integration Gate | v1.3 | 1/1 | Complete    | 2026-08-06 |
