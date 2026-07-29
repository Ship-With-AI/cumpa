# Visual system

## Direction

A local Git workbench: dense, inspectable, and commit-specific. The interface borrows the material language of a dark code host—continuous code canvas, restrained borders, status ink, and monospace identifiers—without becoming a generic dashboard. The product anchor is the selected file flowing from the changed-files ledger into a paired Base/Head diff.

## Color

Source: the existing v1.1 semantic dark contract in `src/web/styles.css`, adapted from the familiar GitHub-dark code-review environment.

- Canvas/inset: `#0D1117` / `#010409`; primary text: `#E6EDF3`.
- Panel/raised: `#161B22` / `#21262D`; secondary and muted text: `#B1BAC4` / `#8B949E`.
- Interactive accent/focus: `#2F81F7` / `#58A6FF`.
- Interactive hover/emphasis and emphasized text: `#292E36`, `#1F6FEB`, and `#FFFFFF`.
- Borders: `#21262D`, `#30363D`, and `#484F58` by emphasis.
- Removed state: `#F85149`; added state: `#3FB950`. Literal minus/plus labels and dashed/solid rails carry the same meaning without color.
- Destructive emphasis: `#B62324`.
- Warning and resolved states use the existing amber `#D29922` and violet `#A371F7` roles only when those states exist.
- Syntax roles: keyword `#D2A8FF`, string `#A5D6FF`, number `#F2CC60`, type `#79C0FF`, and invalid `#FFA198`.

Components consume semantic variables; isolated component hex values are not introduced.

## Type

Source: existing platform-system and editor stacks; no webfont dependency.

- Transitional loading and unavailable states use the display token `clamp(2rem, 8vw, 3.5rem)` at 1.05 line height. This is the only display role; it gives launch failures and progress a clear state boundary without enlarging the working diff header.
- Page headings: 20/28, semibold. Section headings: 16/24, semibold.
- Interface body: 14/20. Metadata and compact labels: 12/16.
- Code, paths, object IDs, and line gutters use the system monospace stack.
- Long paths truncate only where the full accessible name remains available.

## Geometry

- The wide review shell is a continuous three-column workbench: 288px files, fluid diff, 360px review rail.
- Spacing follows the existing 4, 8, 12, 16, 24, and 32px scale.
- Borders, not floating cards or shadows, separate persistent work areas. Radius is reserved for controls, compact state badges, and overlays.
- Changed-file rows are at least 40px high, with fixed status/count columns and an ellipsized fluid path.
- Only the inner diff viewport may own horizontal overflow.

## Components

- The changed-files pane reads as a ledger: status → path → signed counts → exceptional availability.
- Reviewable text files do not repeat a visible `Text` badge; unsupported states remain visible and named.
- The diff names `BASE − REMOVED` and `HEAD + ADDED`; deletion uses a dashed rail and addition a solid rail.
- The review rail groups summary, open comments, resolved comments, and export using dividers and state badges rather than interchangeable feature cards.

## Composition

The selected comparison identity forms the top boundary. Below it, the changed-files ledger, paired diff, and review rail remain visually connected so file choice, code evidence, and feedback read as one workflow. The signature moment is selection continuity: choosing a compact file row immediately updates the named Base/Head canvas while signed counts and comment state stay in view.

## Motion

Motion is functional only: drawer transitions, focus movement, and pending-state feedback. Reduced motion preserves all content and removes nonessential transition duration.

## Responsive behavior

- At narrow laptop widths the review rail leaves the persistent grid before the diff becomes unusable.
- Below the established drawer breakpoint, files and review surfaces open as bounded overlays while the diff retains a 640px local canvas.
- At phone widths, the 288px files drawer remains inside the viewport, the page itself does not scroll horizontally, and display-state headings reduce to 2rem.
