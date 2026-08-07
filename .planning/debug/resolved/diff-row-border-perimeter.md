---
status: resolved
trigger: "Consecutive Monaco added/deleted/modified diff rows read like GitHub: no border repeated on every row; visible boundary belongs only to the diff region perimeter."
created: 2026-07-31T12:48:30Z
updated: 2026-07-31T12:55:26Z
---

## Current Focus

reasoning_checkpoint:
  hypothesis: "Cumpa explicitly assigns diffEditor.insertedTextBorder and diffEditor.removedTextBorder, so Monaco emits a 1px border on every .line-insert/.char-insert and .line-delete/.char-delete node."
  confirming_evidence:
    - "Browser reproduction found three consecutive .line-insert and .line-delete nodes, each with computed 1px borders on all four sides."
    - "Monaco style.css applies border: 1px solid from exactly those optional theme variables to line and character diff nodes."
    - "Monaco registers both border colors as null for ordinary dark/light themes, making an unpainted border the native default."
  falsification_test: "The hypothesis would be false if the two theme keys were absent and a focused theme check still found them configured, or if Monaco sourced the row borders from another rule."
  fix_rationale: "Removing only the two optional border overrides restores Monaco's native unpainted dark-theme semantics while leaving line/text backgrounds, gutter rails, overview colors, and diffEditor.border untouched."
blind_spots: "None for reported behavior: focused theme test and browser computed-style checks cover the contract."
next_action: Resolved; browser checks at 1440×1000 and 375×812 found zero repeated horizontal borders across six changed rows, preserved backgrounds and divider color, and no page errors.

## Symptoms

expected: Consecutive changed rows keep their added/deleted/modified backgrounds while only the diff region perimeter and existing divider boundaries remain visible.
actual: Each Monaco changed line or text span receives a repeated 1px outline, creating horizontal borders on every consecutive diff row.
errors: No runtime error; visual styling regression in Monaco diff rows.
reproduction: Open a comparison containing consecutive added, deleted, or modified lines and inspect the rendered Monaco diff rows/text spans.
started: Existing behavior; exact introduction date not supplied.

## Ranked Hypotheses

1. **Confirmed — explicit Monaco diff text-border theme colors.** `theme.ts` assigns opaque green/red values; Monaco consumes them as four-sided 1px borders on every changed line and intraline span; browser computed styles reproduce this on consecutive nodes.
2. **Eliminated — Cumpa workspace CSS creates the repeated row outline.** `styles.css` defines the workspace perimeter/divider and selection/focus outlines, but no selector targeting `.line-insert`, `.line-delete`, `.char-insert`, or `.char-delete`.
3. **Eliminated — `diffEditor.border` creates each row outline.** Monaco documents and registers it as the border between the two editors; the per-node CSS instead references only `insertedTextBorder` and `removedTextBorder`.

## Eliminated

- hypothesis: Cumpa workspace CSS applies an outline to all changed rows.
  evidence: The only relevant app-level outlines target selected text, anchors, or focused panes; none target Monaco changed-line/text classes, while browser computed rules resolve to Monaco's diff CSS.
  timestamp: 2026-07-31T12:53:13Z
- hypothesis: diffEditor.border is reused as each changed row's border.
  evidence: Monaco's changed-node declarations reference insertedTextBorder/removedTextBorder directly; diffEditor.border is a separate editor-divider token.
  timestamp: 2026-07-31T12:53:13Z

## Evidence

- timestamp: 2026-07-31T12:53:13Z
  checked: src/web/monaco/theme.ts
  found: The Cumpa theme explicitly sets diffEditor.insertedTextBorder to #3FB950 and diffEditor.removedTextBorder to #F85149 alongside separate background, gutter, overview, and editor-divider colors.
  implication: Cumpa opts into borders that Monaco leaves unpainted by default.
- timestamp: 2026-07-31T12:53:13Z
  checked: Monaco diffEditor/style.css and editorColors.js
  found: Monaco applies each optional text-border variable as a four-sided 1px border to line and character insert/delete nodes; ordinary dark/light defaults are null, while high-contrast defaults remain colored.
  implication: Omitting the two Cumpa overrides is Monaco's native ordinary-theme behavior and preserves high-contrast semantics.
- timestamp: 2026-07-31T12:53:13Z
  checked: Browser reproduction supplied by parent agent
  found: Three consecutive .line-insert and .line-delete nodes each computed 1px borders on all four sides.
  implication: The source-to-DOM mechanism is directly reproduced, not inferred from token names alone.
- timestamp: 2026-07-31T12:53:13Z
  checked: src/web/styles.css
  found: App CSS owns the outer diff workspace border, header/help dividers, selected-text outline, focus ring, and anchor rail, but contains no changed-line/text selectors.
  implication: No brittle DOM grouping override is needed; existing perimeter/divider semantics can remain unchanged.
- timestamp: 2026-07-31T12:55:26Z
  checked: npx vitest run tests/unit/monaco-theme.test.ts
  found: One focused test file passed with both tests passing; the exhaustive theme-color mapping accepted the omitted border keys while retaining all other mapped theme colors.
  implication: The directly coupled contract now prevents the two row-border overrides from returning and confirms the remaining backgrounds, gutters, overview colors, and editor divider stay configured.

## Resolution

root_cause: Cumpa overrides Monaco's optional diffEditor.insertedTextBorder and diffEditor.removedTextBorder colors; Monaco renders those colors as a four-sided 1px border on every changed line and intraline span, whereas standard dark/light themes leave them null.
fix: Removed only diffEditor.insertedTextBorder and diffEditor.removedTextBorder from the Cumpa theme and their directly coupled root-token mappings.
verification: Focused check `npx vitest run tests/unit/monaco-theme.test.ts` passed (1 file, 2 tests); exhaustive theme-color key/value assertions confirm the two optional border overrides are absent and all retained theme semantics remain mapped.
files_changed: [src/web/monaco/theme.ts, tests/unit/monaco-theme.test.ts]
