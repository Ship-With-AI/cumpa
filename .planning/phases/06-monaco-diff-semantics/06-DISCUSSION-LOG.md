# Phase 06: Monaco Diff Semantics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-26
**Phase:** 06-Monaco Diff Semantics
**Areas discussed:** Diff layer language, Overlapping state precedence

---

## Diff layer language

### Whole-line and intraline emphasis

| Option | Description | Selected |
|--------|-------------|----------|
| Quiet lines, strong words | Restrained whole-line tints with stronger intraline blocks; preserves code readability and fits Phase 05’s quiet hierarchy. | ✓ |
| Strong line bands | Prominent entire-line bands with intraline changes one step stronger; faster scanning but denser overlaps. | |
| Mostly structural cues | Minimal backgrounds with gutter markers, borders, and intraline emphasis; lower color load but less GitHub-familiar. | |

**User's choice:** Quiet lines, strong words
**Notes:** No additional clarification.

### Non-color Base/Head meaning

| Option | Description | Selected |
|--------|-------------|----------|
| Signed gutter markers | Persistent `−` and `+` markers paired with BASE/HEAD labels and side position, using existing gutter space. | ✓ |
| Different edge treatments | Distinct solid/double or left/right border treatments plus BASE/HEAD labels. | |
| Labels and position only | BASE/HEAD headings and left/right placement as the only non-color cue. | |

**User's choice:** Signed gutter markers
**Notes:** No additional clarification.

### Hunk, unchanged, and empty regions

| Option | Description | Selected |
|--------|-------------|----------|
| Recessed neutral regions | Unchanged context near the canvas, empty regions one neutral step darker, hunk accent reserved for controls and separators. | ✓ |
| Uniform canvas with borders | Nearly one canvas color with borders and labels separating regions. | |
| Prominent region blocks | Visibly distinct fills for unchanged, empty, and hunk regions. | |

**User's choice:** Recessed neutral regions
**Notes:** No additional clarification.

### Signed-marker density

| Option | Description | Selected |
|--------|-------------|----------|
| Every changed line | Repeat `−` or `+` on each changed row. | |
| One per contiguous block | Sign only the first row and span the block with a continuous change bar. | |
| Continuous bar plus sparse signs | Use a bar on all changed rows and signs at the start and end of long blocks. | ✓ |

**User's choice:** Continuous bar plus sparse signs
**Notes:** No additional clarification.

---

## Overlapping state precedence

### Diff versus interaction state

| Option | Description | Selected |
|--------|-------------|----------|
| Diff base, interaction outline | Keep addition/deletion tint visible and express interactions mainly through borders, outlines, and edge cues. | ✓ |
| Interaction temporarily leads | Let selection, hover, or active-line fills replace the diff tint while active. | |
| Blended translucent fills | Composite every state as another translucent fill. | |

**User's choice:** Diff base, interaction outline
**Notes:** No additional clarification.

### Text selection over intraline changes

| Option | Description | Selected |
|--------|-------------|----------|
| Blue fill with crisp edge | Restrained blue selection fill plus visible edge; gutter marker and change bar retain diff meaning. | ✓ |
| Outline-only selection | Outline the selected range without another fill. | |
| High-contrast inversion | Strongly invert selected text and background. | |

**User's choice:** Blue fill with crisp edge
**Notes:** No additional clarification.

### Active-line and hover feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Active edge, hover affordance | Subtle active-line edge and stronger line number; hover emphasizes the comment target instead of adding a row fill. | ✓ |
| Active fill, hover edge | Tint the active row and outline the hovered row. | |
| Shared row highlight | Use one row treatment for both focus and hover. | |

**User's choice:** Active edge, hover affordance
**Notes:** No additional clarification.

### Comment anchor and keyboard focus

| Option | Description | Selected |
|--------|-------------|----------|
| Anchor rail, outer focus ring | Durable inset anchor rail with the existing two-pixel outer focus ring on the focused editor or control. | ✓ |
| Anchor fill, focus ring | Tint the entire anchored line and retain the outer focus ring. | |
| Focus temporarily replaces anchor | Hide the anchor while keyboard focus is present, then restore it. | |

**User's choice:** Anchor rail, outer focus ring
**Notes:** No additional clarification.

---

## Claude's Discretion

No answer explicitly delegated a selected question to Claude. Syntax/canvas balance and detailed gutter/widget treatment were not selected for discussion; CONTEXT.md constrains those decisions through the roadmap, Phase 05 contract, and the eight captured decisions.

## Deferred Ideas

None.
