# Phase 08: Accessible Responsive Continuity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-28
**Phase:** 08-Accessible Responsive Continuity
**Areas discussed:** Narrow header reflow

---

## Narrow header reflow

### Header order

| Option | Description | Selected |
|--------|-------------|----------|
| File, endpoints, toolbar | Lead with the active file, keep Base and Head paired left/right on a second row, then wrap the existing toolbar below. Preserves file orientation and pane relationship without page-wide overflow. | ✓ |
| Base, file, Head, toolbar | Stack every context block vertically in logical reading order. Most robust for very long labels, but taller and weakens the side-by-side Base/Head pairing. | |
| Keep three columns | Retain Base \| file \| Head and compress or truncate aggressively. Smallest header, but conflicts with 400% zoom and long local branch/worktree labels. | |

**User's choice:** File, endpoints, toolbar
**Notes:** The active file leads; comparison identities remain grouped below it; controls remain last.

### Endpoint fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Pair, then stack | Keep left/right pairing while usable; at the smallest effective width, stack Base above Head with explicit labels. Avoids truncating meaningful identities and still preserves order. | ✓ |
| Always keep paired | Keep two equal columns at every width and allow selector names to wrap inside each. Strongest pane association, but can create very tall, narrow words or cramped OIDs. | |
| Truncate paired labels | Keep the compact two-column row and ellipsize selector names/OIDs. Visually stable, but hides identity at precisely the zoom level where hover-only title text is hard to access. | |

**User's choice:** Pair, then stack
**Notes:** Preserve paired left/right identity until each endpoint becomes unusable, then retain explicit Base-before-Head order vertically.

### Toolbar reflow

| Option | Description | Selected |
|--------|-------------|----------|
| Wrap by semantic group | Keep each previous/next pair intact; place navigation groups first and the labeled Review/Keyboard Help group after them, moving whole groups to new rows as needed. Reuses the current DOM grouping and preserves scan order. | ✓ |
| Fixed two-row toolbar | Always put both navigation pairs on row one and both labeled actions on row two once narrow mode starts. Very predictable, but can waste space at intermediate widths. | |
| Natural control wrapping | Let all six controls wrap independently in source order. Minimal CSS, but previous/next pairs and action hierarchy can split unpredictably. | |

**User's choice:** Wrap by semantic group
**Notes:** Whole groups reflow; previous/next pairs and existing group order remain stable.

### File identity flow

| Option | Description | Selected |
|--------|-------------|----------|
| Wrap complete identity | Allow directory/filename text to wrap without hiding content; keep filename emphasis, and stack old → new paths at the smallest widths. Reuses PathText/PathDisplay semantics and remains usable without hover. | ✓ |
| Filename first, directory below | Recompose each path into a prominent filename line with muted directory metadata below. Highly scannable, but changes normal path reading order and makes renamed pairs taller. | |
| Keep one-line ellipsis | Preserve current compact one-line identity and expose the full path through title/accessibility text. Stable geometry, but pointer hover is not a reliable narrow/zoom disclosure. | |

**User's choice:** Wrap complete identity
**Notes:** Keep normal path order and filename emphasis; renamed/copied identities may stack without losing either path.

---

## Claude's Discretion

- Exact breakpoints, endpoint minimum widths, gaps, and stack geometry.
- Drawer sizing and presentation within the existing drawer behavior and focus-return contract.
- Non-header long-content wrapping within the no-page-horizontal-scroll boundary.
- Forced-color system-color mapping, composited-contrast adjustments, and validation details within the inherited non-color and focus contracts.

## Deferred Ideas

None.
