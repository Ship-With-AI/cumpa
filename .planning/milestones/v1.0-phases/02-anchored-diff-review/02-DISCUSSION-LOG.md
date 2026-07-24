# Phase 2: Anchored Diff Review - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-11
**Phase:** 2-Anchored Diff Review
**Areas discussed:** Comment creation interaction, Diff workspace and navigation

---

## Comment creation interaction

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Start comment | Gutter affordance + keyboard; select line text first; global toolbar button | Gutter affordance + keyboard |
| Composer placement | Inline below anchored line; persistent right panel; floating popover | Inline below anchored line |
| Existing comment | One per side-specific line; multiple independent comments; merge text automatically | One per side-specific line |
| Accept/cancel | Explicit Add + shortcuts; autosave while typing; blur to accept | Explicit Add + shortcuts |

**User's choice:** Selected the recommended option for all four decisions.
**Notes:** The inline composer repeats path, side, and line. Re-activating an occupied line focuses the existing comment. Ctrl/Cmd+Enter accepts only after atomic persistence; blur never submits; non-empty cancellation asks for confirmation.

---

## Diff workspace and navigation

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Layout | One active file; stack all files; user-toggleable modes | One active file |
| Initial context choice | Progressive expansion; always show full files; temporary expansion | Always show full files (superseded) |
| Requirement reconciliation | Full by default, collapsible; collapsed by default, expandable | Collapsed by default, expandable |
| Navigation | Buttons + documented shortcuts; keyboard-first command palette; tree/scrollbar only | Buttons + documented shortcuts |
| View restoration | Restore per-file review position; reset to first change; restore scroll only | Restore per-file review position |

**User's choice:** Selected one active file, visible controls plus shortcuts, and complete per-file restoration. After learning that `DIFF-04` requires hidden unchanged regions to be expandable, replaced the initial full-file default with collapsed-by-default expandable context.
**Notes:** Comment navigation auto-reveals the anchor. View restoration includes scroll, focused side/line, expansion, and active composer. Durable anchors never depend on rendered row or viewport position.

---

## Claude's Discretion

The user did not select the Anchor/orphan handling or Autosave/resume feedback gray areas. Exact presentation and algorithms remain delegated to planning within the explicit requirements and safety constraints recorded in CONTEXT.md.

## Deferred Ideas

- Stacked-file and user-toggleable diff layouts.
- Multiple comments or threads on one side-specific line.
