# Roadmap: Compare

## Overview

v1.2 makes the ordered source picker useful before Compare scans a large local branch namespace, adds literal on-demand branch search through bounded native Git work, and closes only after the production picker path meets its packed-ref latency budgets.

## Milestones

- ✅ **[v1.0 MVP](./milestones/v1.0-ROADMAP.md)** — Phases 01–04.1, 40 plans, shipped 2026-07-24.
- ✅ **[v1.1 GitHub Dark Diff](./milestones/v1.1-ROADMAP.md)** — Phases 05–08, 16 plans, 18/18 requirements, shipped 2026-07-29.
- 🚧 **v1.2 Fast Source Discovery** — Phases 09–11, 5/5 requirements mapped.

## Phases

- [ ] **Phase 09: Immediate Source Picker** — Make current branch and registered worktrees usable before remaining local branches are enumerated.
- [ ] **Phase 10: On-Demand Branch Search** — Discover literal local-branch matches only after the user starts searching.
- [ ] **Phase 11: Production Performance Gate** — Accept the milestone only when the production picker path meets both packed-ref latency budgets.

## Milestone Constraints

Existing picker identity, ordering, worktree truthfulness, selection, recovery, and failure behavior remain non-regression acceptance boundaries. They are preserved but are not additional v1.2 requirements. Git remains the source of truth: the milestone adds no repository mutation, persistent branch index, background full enumeration, remote-ref discovery, fuzzy ranking, or speculative debounce.

## Phase Details

### Phase 09: Immediate Source Picker

**Goal**: Users can begin ordered source selection from the attached current branch and registered worktrees without waiting for remaining local branches to be enumerated.
**Depends on**: Phase 08 (shipped v1.1)
**Requirements**: PICK-01, PICK-02
**Success Criteria** (what must be TRUE):

  1. User can interact with the ordered source picker before Compare enumerates the remaining local branches.
  2. User initially sees the attached current branch and every registered worktree as source choices.
  3. User can choose an eager source for either ordered Base or Head selection without waiting for the remaining branch namespace.

**Plans**: 1/2 plans executed
Plans:
**Wave 1**

- [x] 09-01-PLAN.md — Stage native-Git discovery into eager current-branch/worktree candidates plus deferred branch lookup.

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 09-02-PLAN.md — Make the ordered picker interactive from eager candidates with exact-ID lazy selection and recovery.

### Phase 10: On-Demand Branch Search

**Goal**: Users can discover and choose matching local branches on demand without restoring eager full-branch enumeration.
**Depends on**: Phase 09
**Requirements**: SRCH-01
**Success Criteria** (what must be TRUE):

  1. User can enter a non-empty search term and receive matching local branch names on demand.
  2. Matching is case-insensitive and treats characters with Git pattern meaning as literal search text.
  3. When the user changes the term, the picker shows results for the current term, and a returned branch can be selected for the ordered comparison.

**Plans**: TBD

### Phase 11: Production Performance Gate

**Goal**: Users receive fast picker readiness and branch-search results through the same production path they run in a packed 10,000-branch repository.
**Depends on**: Phase 10
**Requirements**: PERF-01, PERF-02
**Success Criteria** (what must be TRUE):

  1. Launching Compare through the production command path against 10,000 packed local branch refs makes the ordered source picker usable within 400 ms of process start.
  2. Entering a term through that production picker returns matching local branch results within 500 ms in the 10,000-packed-ref benchmark.

**Plans**: TBD
**Acceptance gate**: Both budgets must be measured through the production picker path; spike-only measurements cannot complete this phase or the milestone.

## Coverage

| Requirement | Phase |
|-------------|-------|
| PICK-01 | Phase 09 |
| PICK-02 | Phase 09 |
| SRCH-01 | Phase 10 |
| PERF-01 | Phase 11 |
| PERF-02 | Phase 11 |

**Coverage:** 5/5 v1.2 requirements mapped exactly once; 0 unmapped; 0 duplicated across phases.

## Progress

**Execution Order:** Phase 09 → Phase 10 → Phase 11

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 09. Immediate Source Picker | v1.2 | 1/2 | In Progress|  |
| 10. On-Demand Branch Search | v1.2 | 0/TBD | Not started | - |
| 11. Production Performance Gate | v1.2 | 0/TBD | Not started | - |
