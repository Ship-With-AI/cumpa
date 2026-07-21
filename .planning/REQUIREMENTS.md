# Requirements: Diff Review

**Defined:** 2026-07-11  
**Core Value:** A developer can accurately review committed changes between any two local branch or worktree heads and export precise, drift-detectable feedback an agent can act on.

## User Stories

- As a developer, I can select any ordered pair of local branches or registered worktrees so I can review committed changes before publishing them remotely.
- As a reviewer, I can inspect PR-style changes in a familiar side-by-side browser workspace so I can understand the change efficiently.
- As a reviewer, I can attach durable feedback to exact lines on either side and write an overall summary so requested work retains its code context.
- As a developer, I can close and resume a comparison-specific draft without losing accepted feedback.
- As an agent operator, I can export schema-valid JSON plus readable Markdown so an applying agent can locate requests safely and detect drift.

## v1 Requirements

### Launch and Selection

- [x] **SEL-01**: User can run the CLI from any directory inside a non-bare Git worktree and have the repository root resolved automatically.
- [x] **SEL-02**: User receives a clear actionable error when Git is unavailable, the directory is not a reviewable repository, or the repository has no resolvable commit.
- [x] **SEL-03**: User can search one picker containing local branches and every registered worktree, including detached worktrees.
- [x] **SEL-04**: User can distinguish each picker entry by type, label, worktree path when applicable, short commit ID, and dirty-state indicator.
- [x] **SEL-05**: User explicitly selects an ordered base followed by an ordered head.
- [x] **SEL-06**: User is prevented from starting a review when both selections resolve to the same commit.
- [x] **SEL-07**: User sees that dirty worktree state is ignored and that the worktree's committed `HEAD` will be reviewed.
- [x] **SEL-08**: User's default browser opens automatically after the server binds, while the terminal prints the URL and shutdown instructions.

### Comparison

- [x] **CMP-01**: User reviews the selected head against the merge base of the selected base and head.
- [x] **CMP-02**: User sees selected labels plus full base, head, and merge-base commit identities.
- [x] **CMP-03**: User receives a clear error for unrelated histories, multiple merge bases, or unavailable required Git objects.
- [x] **CMP-04**: User sees added, modified, deleted, renamed, copied, mode-only, binary, and unsupported changed-file statuses without path corruption.
- [x] **CMP-05**: User sees Git-derived addition/deletion counts when textual line counts are available.
- [x] **CMP-06**: User reviews immutable blob contents from the pinned commits rather than staged, unstaged, or untracked filesystem content.
- [x] **CMP-07**: User can review repositories containing spaces, Unicode, tabs, newlines, or leading dashes in valid paths without selecting or displaying the wrong file.
- [x] **CMP-08**: User sees an explanatory empty state when the pinned comparison contains no PR-style changes.
- [x] **CMP-09**: User sees why a binary, non-UTF-8, oversized, submodule, or otherwise unsupported file cannot be rendered inline.

### Diff Workspace

- [x] **DIFF-01**: User can navigate a changed-file tree showing path, status, and available line counts.
- [x] **DIFF-02**: User can open a supported text file as a read-only side-by-side base/head diff.
- [x] **DIFF-03**: User sees syntax highlighting selected from the file path while preserving exact blob text.
- [x] **DIFF-04**: User can expand hidden unchanged regions and review any revealed context line.
- [x] **DIFF-05**: User can move to the previous or next file and previous or next change using documented keyboard controls.
- [x] **DIFF-06**: User sees an explicit placeholder rather than a broken editor for unsupported files.
- [x] **DIFF-07**: User can switch files, resize the workspace, and expand context without inline comments moving to the wrong line or breaking side alignment.

### Comments and Summary

- [x] **CMT-01**: User can add one comment to any visible line on either the base or head side, including unchanged context.
- [x] **CMT-02**: Each accepted comment records the side-specific path, side, line, blob identity, exact selected text, nearby context, and context hash.
- [ ] **CMT-03**: User can edit an existing comment.
- [ ] **CMT-04**: User can delete an existing comment.
- [ ] **CMT-05**: User can resolve and reopen an existing comment.
- [ ] **CMT-06**: User can see open and resolved comment counts and jump from a comment list to its anchored line.
- [ ] **CMT-07**: User can write and edit one overall review summary.
- [x] **CMT-08**: User sees a clear stale or orphaned state instead of a silently relocated comment when its recorded anchor cannot be verified.

### Drafts

- [x] **DRFT-01**: User's accepted comment and summary mutations are persisted atomically before the UI confirms success.
- [x] **DRFT-02**: User can relaunch the same pinned comparison and resume its repository-local draft.
- [x] **DRFT-03**: User gets a separate draft when either pinned comparison commit differs.
- [ ] **DRFT-04**: User cannot unknowingly overwrite newer review state from another browser tab.
- [ ] **DRFT-05**: User receives a recoverable error when a draft is corrupt or uses an unsupported schema; the existing file is preserved.
- [ ] **DRFT-06**: User's open review remains pinned if a selected branch or worktree advances and visibly reports that selector drift.

### Export

- [ ] **EXP-01**: User can explicitly export the current review to `review.json` and `review.md` under a repository-local export directory.
- [ ] **EXP-02**: User receives a versioned, schema-valid canonical JSON document containing comparison identities, summary, all comments, states, timestamps, and stable anchors.
- [ ] **EXP-03**: User receives Markdown derived from the canonical document, grouping open actionable comments by file and excluding resolved comments from requested work.
- [ ] **EXP-04**: An applying agent is instructed to verify commit, blob, and context identity and report ambiguous anchors rather than editing by line number alone.
- [ ] **EXP-05**: User sees repository-relative output paths and content hashes after export.
- [ ] **EXP-06**: User never receives one new export format without the other when an export write fails.
- [ ] **EXP-07**: Re-exporting unchanged review state produces deterministic content apart from the explicit export timestamp.
- [ ] **EXP-08**: Export never applies, stages, commits, or pushes repository changes.

### Local Safety

- [x] **SAFE-01**: User's server listens only on `127.0.0.1` using an operating-system-assigned port.
- [x] **SAFE-02**: API requests without the per-process session token or with an unexpected origin cannot read repository blobs or mutate review state.
- [x] **SAFE-03**: Browser requests cannot select arbitrary repositories, refs, Git objects, filesystem paths, or export paths after launch.
- [ ] **SAFE-04**: `.diff-review/` is excluded from the reviewed change set and can be added to `.gitignore` without overwriting existing rules.
- [x] **SAFE-05**: User can stop the server with terminal interrupt without leaving an incomplete accepted draft or export.

## Acceptance Criteria

1. In real Git fixtures, branch-to-branch, branch-to-worktree, worktree-to-branch, and worktree-to-worktree selections all resolve committed objects and display the merge-base-to-head change set.
2. A dirty selected worktree produces a visible warning while staged, unstaged, and untracked bytes remain absent from the rendered comparison.
3. A reviewer can open the packaged browser app, reveal an unchanged context line, add comments on both sides, edit and resolve comments, write a summary, close the browser, relaunch the same comparison, and recover the accepted state.
4. Export produces schema-valid JSON and derived Markdown whose open requests retain commit, blob, path, side, line, selected text, context, and hash anchors; resolved comments do not appear as requested work in Markdown.
5. Moving a selected branch after launch does not alter displayed blobs or anchors and produces an explicit drift warning before export.
6. Unrelated histories, multiple merge bases, equal commits, corrupt drafts, binary/non-UTF-8/oversized files, and unusual valid paths produce the documented state without crashes, silent substitution, or data loss.
7. Unauthenticated, cross-origin, and arbitrary-path API attempts cannot read blob contents, mutate drafts, or write exports.
8. Focused unit, Git-fixture, API, and packaged Playwright tests pass on the supported Node.js 24 environment.

## v2 Requirements

### Additional Inputs

- **INP-01**: User can select commits and tags in addition to local branches and registered worktrees.
- **INP-02**: User can choose direct tree-to-tree comparison instead of PR-style comparison.
- **INP-03**: User can review staged, unstaged, and untracked working-tree state.

### Expanded Review

- **RV2-01**: User can attach one comment to a contiguous line range.
- **RV2-02**: User can comment on a whole file.
- **RV2-03**: User can include an explicit replacement suggestion.
- **RV2-04**: User can reply within a comment thread.
- **RV2-05**: User can mark files viewed and see review progress.
- **RV2-06**: User can search and filter files by path, generated status, and comment state.
- **RV2-07**: User can switch between side-by-side and unified layouts and choose a theme.
- **RV2-08**: User can refresh an advanced comparison and reattach unambiguous anchors across revisions.

### Additional Delivery

- **DLV-01**: User can export a selected subset of open comments.
- **DLV-02**: User can copy generated agent instructions to the clipboard.
- **DLV-03**: User can deliver feedback directly to a configured running agent.
- **DLV-04**: User can review supported images or notebooks.
- **DLV-05**: User can use the review workspace through an editor extension or native shell.
- **DLV-06**: User can import from or publish to a remote forge.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Accounts and remote hosting | v1 is a single-developer local tool. |
| Multi-user collaboration, notifications, and permissions | Requires a hosted identity and synchronization model outside the core value. |
| Approve/request-changes enforcement | Export completion is sufficient for a local applying-agent workflow. |
| Applying, staging, committing, or pushing code | A separate coding agent consumes the export; the review tool remains read-only toward source. |
| Executing repository code | Reviewing must not execute untrusted project content. |
| Binary and rich-document rendering | v1 identifies unsupported changes but focuses on text review. |
| Background multi-repository daemon | One CLI process owns one repository and one pinned comparison. |
| General-purpose Git API | The server exposes only the fixed comparison selected before launch. |

## Traceability

Each v1 requirement maps to exactly one roadmap phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEL-01 | Phase 1 | Complete |
| SEL-02 | Phase 1 | Complete |
| SEL-03 | Phase 1 | Complete |
| SEL-04 | Phase 1 | Complete |
| SEL-05 | Phase 1 | Complete |
| SEL-06 | Phase 1 | Complete |
| SEL-07 | Phase 1 | Complete |
| SEL-08 | Phase 1 | Complete |
| CMP-01 | Phase 1 | Complete |
| CMP-02 | Phase 1 | Complete |
| CMP-03 | Phase 1 | Complete |
| CMP-04 | Phase 1 | Complete |
| CMP-05 | Phase 1 | Complete |
| CMP-06 | Phase 1 | Complete |
| CMP-07 | Phase 1 | Complete |
| CMP-08 | Phase 1 | Complete |
| CMP-09 | Phase 1 | Complete |
| DIFF-01 | Phase 1 | Complete |
| DIFF-06 | Phase 1 | Complete |
| SAFE-01 | Phase 1 | Complete |
| SAFE-02 | Phase 1 | Complete |
| SAFE-03 | Phase 1 | Complete |
| SAFE-05 | Phase 1 | Complete |
| DIFF-02 | Phase 2 | Complete |
| DIFF-03 | Phase 2 | Complete |
| DIFF-04 | Phase 2 | Complete |
| DIFF-05 | Phase 2 | Complete |
| DIFF-07 | Phase 2 | Complete |
| CMT-01 | Phase 2 | Complete |
| CMT-02 | Phase 2 | Complete |
| CMT-08 | Phase 2 | Complete |
| DRFT-01 | Phase 2 | Complete |
| DRFT-02 | Phase 2 | Complete |
| DRFT-03 | Phase 2 | Complete |
| CMT-03 | Phase 3 | Pending |
| CMT-04 | Phase 3 | Pending |
| CMT-05 | Phase 3 | Pending |
| CMT-06 | Phase 3 | Pending |
| CMT-07 | Phase 3 | Pending |
| DRFT-04 | Phase 3 | Pending |
| DRFT-05 | Phase 3 | Pending |
| DRFT-06 | Phase 3 | Pending |
| EXP-01 | Phase 4 | Pending |
| EXP-02 | Phase 4 | Pending |
| EXP-03 | Phase 4 | Pending |
| EXP-04 | Phase 4 | Pending |
| EXP-05 | Phase 4 | Pending |
| EXP-06 | Phase 4 | Pending |
| EXP-07 | Phase 4 | Pending |
| EXP-08 | Phase 4 | Pending |
| SAFE-04 | Phase 4 | Pending |

**Coverage:**

- v1 requirements: 51 total
- Mapped to phases: 51
- Unmapped: 0

---
*Requirements defined: 2026-07-11*
*Last updated: 2026-07-11 after roadmap creation*
