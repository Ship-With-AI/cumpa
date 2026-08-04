# Requirements: Compare v1.3 Agent Review Handoff

**Defined:** 2026-08-04
**Core Value:** A developer can accurately review repository-grounded changes chosen by a developer or coding agent and return precise, drift-detectable feedback the agent can act on.

## v1.3 Requirements

### Request Protocol

- [x] **AGENT-01**: A coding agent can pipe one versioned JSON review request to `compare` and is never shown an interactive prompt.
- [x] **AGENT-02**: A coding agent receives an actionable nonzero failure before browser launch when stdin is malformed, oversized, invalid UTF-8, has unknown fields, uses an unsupported version, or does not select exactly one input mode.
- [x] **AGENT-03**: A developer launching `compare` from a TTY retains the existing interactive source-selection and browser-review flow.

### Git Range

- [x] **RANGE-01**: A coding agent can request a contiguous comparison using explicit ancestor base and head revisions that Compare resolves once to full commit IDs.
- [x] **RANGE-02**: A coding agent can restrict a range review with ordered native Git include/exclude pathspecs whose semantics are not reinterpreted by Compare.
- [x] **RANGE-03**: A range review's inventory, blobs, draft identity, and returned feedback remain bound to its pinned commits and exact pathspec scope.

### Exact Patch

- [ ] **PATCH-01**: A coding agent can submit an exact already-applied patch as the request's exclusive input and the developer reviews only that patch.
- [ ] **PATCH-02**: Compare accepts a patch only when every preimage is grounded in repository objects and every postimage exactly matches the implemented repository/worktree content.
- [ ] **PATCH-03**: A patch review preserves Git-derived paths and added, modified, deleted, renamed, copied, mode-only, symlink, binary, and unsupported-file visibility without path corruption.
- [ ] **PATCH-04**: Validating and reviewing a patch does not mutate the repository's worktree, index, refs, or object store.
- [ ] **PATCH-05**: A patch review remains frozen and readable through review completion; drift produces an explicit failure rather than different content.

### Attached Handoff

- [ ] **HAND-01**: Either input mode opens the existing authenticated human browser workspace with file navigation, Monaco diffs, comments, summary, persistence, and export behavior.
- [ ] **HAND-02**: The developer can explicitly Finish review; browser close, reload, ordinary export, and disconnect do not report successful completion.
- [ ] **HAND-03**: The invoking CLI remains attached until completion and writes exactly one canonical JSON success document to stdout while URLs, progress, and diagnostics stay on stderr.
- [ ] **HAND-04**: Returned JSON binds comments, summary, and drift-detectable anchors to the exact submitted range/pathspec or patch identity.
- [ ] **HAND-05**: Finish validates pending draft state and anchors before returning feedback; stale feedback fails explicitly instead of being emitted as successful.
- [ ] **HAND-06**: Agent-submitted scopes cannot collide with each other or with existing interactive draft/export identities.

## Future Requirements

### Request Protocol

- **AGENT-04**: A coding agent can submit multiple review requests through one Compare process.
- **AGENT-05**: A coding agent can add optional display titles or review instructions to a request.

### Git and Patch Sources

- **RANGE-04**: A coding agent can compose an arbitrary non-contiguous subset of commits into one review.
- **PATCH-06**: A coding agent can submit a detached or prospective patch whose postimage is not the current repository/worktree content.

### Handoff Modes

- **HAND-07**: A coding agent can create or consume a review without opening the browser UI.
- **HAND-08**: A coding agent can control a review through a local HTTP API.
- **HAND-09**: Multiple or remote reviewers can participate in one review session.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multiple requests per process | One request and one result keep stdin/stdout framing and lifecycle deterministic until usage proves multiplexing is needed. |
| Arbitrary non-contiguous commit composition | A contiguous base/head range preserves native Git semantics; agents needing an exact subset can submit the resulting grounded patch. |
| Detached or prospective patches | v1.3 must prove reviewed bytes match repository-backed implemented changes so anchors and feedback remain drift-detectable. |
| Headless review | The milestone is an agent-to-human handoff and reuses Compare's browser review workspace. |
| Agent-controlled HTTP API | Attached stdin/stdout provides the required machine contract without exposing a second control surface. |
| Remote or multi-reviewer sessions | Compare remains loopback-only and single-developer. |
| Optional request titles or instructions | Exact review scope and feedback return are sufficient for v1.3; add metadata only after real agent usage demonstrates a need. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AGENT-01 | Phase 12 | Complete |
| AGENT-02 | Phase 12 | Complete |
| AGENT-03 | Phase 12 | Complete |
| RANGE-01 | Phase 12 | Complete |
| RANGE-02 | Phase 12 | Complete |
| RANGE-03 | Phase 12 | Complete |
| PATCH-01 | Phase 13 | Pending |
| PATCH-02 | Phase 13 | Pending |
| PATCH-03 | Phase 13 | Pending |
| PATCH-04 | Phase 13 | Pending |
| PATCH-05 | Phase 13 | Pending |
| HAND-01 | Phase 14 | Pending |
| HAND-02 | Phase 14 | Pending |
| HAND-03 | Phase 14 | Pending |
| HAND-04 | Phase 14 | Pending |
| HAND-05 | Phase 14 | Pending |
| HAND-06 | Phase 15 | Pending |

**Coverage:**

- v1.3 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-08-04*
*Last updated: 2026-08-04 after roadmap creation*
