# Roadmap: Diff Review

## Overview

Build Diff Review as four vertical MVP phases. First establish an accurate, secure committed-comparison session visible in the browser. Then prove the riskiest side-by-side comment anchor and resume loop. Complete the review lifecycle and drift handling before finishing the canonical agent export and packaged end-to-end release.

## Phases

| Phase | Name | Goal | Requirements | Plans |
|-------|------|------|--------------|-------|
| 1 | Pinned Local Comparison | 13/13 | Complete    | 2026-07-20 |
| 2 | Anchored Diff Review | 10/10 | Complete | 2026-07-21 |
| 3 | Complete Review Draft | 7/7 | Complete    | 2026-07-23 |
| 4 | Agent-Ready Export | 5/8 | In Progress|  |

**Total:** 4 phases, 51 v1 requirements, 35 planned implementation units.

## Phase Details

### Phase 1: Pinned Local Comparison

**Goal:** A developer can launch from a repository, select any ordered pair of local branches or registered worktrees, and inspect the correct pinned merge-base-to-head changed-file set in a secure local browser session.
**Mode:** mvp
**UI hint**: yes
**Requirements:** SEL-01–SEL-08, CMP-01–CMP-09, DIFF-01, DIFF-06, SAFE-01–SAFE-03, SAFE-05
**Dependencies:** None
**Planned implementation units:** 13

**Success Criteria**:

1. From any directory in a real Git worktree, the CLI offers searchable local branch and registered-worktree entries, makes base/head order explicit, warns that dirty bytes are ignored, resolves committed identities, binds an ephemeral loopback server, and opens the browser.
2. Diverged branch/branch, branch/worktree, worktree/branch, and worktree/worktree fixtures all show the merge-base-to-head file set while the session remains pinned to displayed full commit IDs.
3. The browser file tree accurately represents additions, modifications, deletions, renames, copies, mode-only changes, available line counts, unsupported content, and unusual valid paths without reading dirty worktree bytes.
4. Equal commits, missing Git, invalid or empty repositories, unrelated histories, multiple merge bases, missing objects, no changes, and unsupported files produce specific actionable states rather than crashes or substituted comparisons.
5. Blob/file APIs reject missing tokens, unexpected origins, and arbitrary repository/path/object inputs; terminal interrupt closes the server cleanly.

### Phase 2: Anchored Diff Review

**Goal:** A developer can inspect immutable text changes in a stable Monaco side-by-side workspace, attach a precise durable comment to either side, and recover it after relaunching the same comparison.
**Mode:** mvp
**UI hint**: yes
**Requirements:** DIFF-02–DIFF-05, DIFF-07, CMT-01, CMT-02, CMT-08, DRFT-01–DRFT-03
**Dependencies:** Phase 1
**Planned implementation units:** 7

**Success Criteria**:

1. Selecting a supported text file loads exact base/head blobs into a read-only, syntax-highlighted side-by-side diff with expandable unchanged context and documented file/change navigation.
2. A reviewer can add a comment to any visible base or head line, including revealed context, and the accepted comment records side-specific path, side, line, blob ID, selected text, surrounding context, and hash.
3. Comment rendering remains attached and side alignment remains intact across context expansion, resizing, file switching, and Monaco diff recomputation; failures are detected by the prototype before the workspace is extended.
4. Accepted comments are atomically persisted, the same pinned comparison resumes them after browser closure, and a different commit pair opens a separate draft.
5. A comment whose anchor cannot be verified is shown as stale or orphaned and is never silently moved to another line.

### Phase 3: Complete Review Draft

**Goal:** A developer can finish and safely maintain a complete local review draft as comments and selected refs evolve.
**Mode:** mvp
**UI hint**: yes
**Requirements:** CMT-03–CMT-07, DRFT-04–DRFT-06
**Dependencies:** Phase 2
**Planned implementation units:** 7

**Success Criteria**:

1. A reviewer can edit, delete, resolve, and reopen comments; open/resolved counts update and each listed comment can navigate back to its anchored line.
2. A reviewer can write and edit one overall summary that persists with the comparison draft.
3. Concurrent browser tabs cannot silently overwrite newer accepted state; stale revisions receive an explicit conflict and can reload the canonical draft.
4. Corrupt or unsupported draft schemas are preserved and reported with recovery guidance rather than replaced with an empty review.
5. If a selected branch or worktree advances, the open review remains pinned to its original blobs and visibly reports selector drift.

### Phase 4: Agent-Ready Export

**Goal:** A developer can explicitly produce a complete, stable, machine-actionable review artifact that an agent can consume safely without Diff Review modifying source control.
**Mode:** mvp
**UI hint**: yes
**Requirements:** EXP-01–EXP-08, SAFE-04
**Dependencies:** Phase 3
**Planned implementation units:** 8

**Success Criteria**:

1. Export writes versioned, schema-valid `review.json` and derived `review.md` together beneath `.diff-review/exports/`, then shows repository-relative paths and content hashes.
2. JSON retains comparison identities, summary, every comment state and timestamp, and blob/context anchors; Markdown groups only open actionable comments by file and includes identity/ambiguity instructions for the applying agent.
3. Re-exporting unchanged review state is deterministic apart from the explicit export timestamp, and a write failure never exposes only one newly updated format.
4. `.diff-review/` is excluded from the reviewed change set and can be added to `.gitignore` without overwriting existing rules.
5. Packaged end-to-end verification proves export never edits, stages, commits, or pushes source while covering branch/worktree combinations, resume, drift, unsupported content, and API access controls.

## Requirement Coverage

Every v1 requirement maps to exactly one phase:

- Phase 1: 23 requirements
- Phase 2: 11 requirements
- Phase 3: 8 requirements
- Phase 4: 9 requirements
- Total mapped: 51 of 51
- Unmapped: 0
- Duplicated: 0

## Progress

| Phase | Status | Plans Complete | Requirements Complete |
|-------|--------|----------------|-----------------------|
| 1. Pinned Local Comparison | In progress | 12/13 | 23/23 |
| 2. Anchored Diff Review | Complete | 10/10 | 11/11 |
| 3. Complete Review Draft | In Progress| 4/7 | 7/8 |
| 4. Agent-Ready Export | In Progress | 5/8 | 4/9 |

---
*Roadmap created: 2026-07-11*
