# Phase 07: GitHub-Familiar Review Surfaces - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-27
**Phase:** 07-GitHub-Familiar Review Surfaces
**Areas discussed:** File header and toolbar, Inline comment surfaces, Review rail hierarchy, Controls and status feedback

---

## File header and toolbar

### Header composition

| Option | Description | Selected |
|--------|-------------|----------|
| One grouped two-row header | A single bordered header: path and Base/Head context on the first compact row, existing navigation/review controls on the second. Preserves scanability when controls are numerous. | ✓ |
| One dense row | Path, Base/Head context, and every existing control share one row. Closest to a compact hosted-diff header, but risks crowding long paths. | |
| Keep two separate bars | Enrich the existing path strip with Base/Head context while retaining a visually separate toolbar below. Lowest structural change, less unified. | |
| Let Claude decide | Choose the most GitHub-familiar composition that preserves long-path legibility and every existing control. | |

**User's choice:** One grouped two-row header
**Notes:** The first row owns identity/context; the second retains every existing action.

### Base/Head context

| Option | Description | Selected |
|--------|-------------|----------|
| Side-aligned endpoint blocks | Path leads the row; compact Base and Head blocks align conceptually with Monaco’s left/right panes and show selector label plus short commit ID. | ✓ |
| Inline comparison trail | Show “Base label · abc1234 → Head label · def5678” beside or beneath the path. Compact and explicit, but less tied to pane position. | |
| BASE and HEAD labels only | Keep endpoint names and commit IDs in the global identity header; the file header reinforces side meaning without repeating identities. | |
| Let Claude decide | Balance repetition, pane association, and long-path space using existing session identities. | |

**User's choice:** Side-aligned endpoint blocks
**Notes:** Endpoint context should reinforce the pane relationship.

### Path presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Muted directory, strong filename | Keep the full path in one line, visually de-emphasize directories, emphasize the filename, and show old → new paths for renames using existing metadata. | ✓ |
| Uniform full path | Render the current effective path as one monospace string with end ellipsis when space runs out; rename detail stays in the existing metadata drawer. | |
| Two-line rename only | Normal files use one full-path line; renamed files use compact old-path and new-path lines so the transition is explicit. | |
| Let Claude decide | Choose the clearest treatment for deep paths and renames without adding controls or changing metadata behavior. | |

**User's choice:** Muted directory, strong filename
**Notes:** Renames should expose the existing old-to-new path relationship.

### Toolbar control treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Icons for navigation, text for destinations | Use familiar local inline icons for previous/next file and change; keep Review and Keyboard help as labeled controls. Tooltips and accessible names remain explicit. | ✓ |
| Icon plus text throughout | Every action keeps a visible label and gains a small icon. Most explicit, but the toolbar remains wide. | |
| Text controls only | Retain existing labels and improve grouping, density, counts, and interaction states without introducing iconography. | |
| Let Claude decide | Use the smallest clear treatment that remains understandable without tooltips. | |

**User's choice:** Icons for navigation, text for destinations
**Notes:** Existing tooltips, accessible names, commands, and disabled behavior remain contracts.

---

## Inline comment surfaces

### Inline frame

| Option | Description | Selected |
|--------|-------------|----------|
| Compact conversation card | A bordered GitHub-like card with distinct metadata header, body, and action footer, connected to the line by the existing accent rail/anchor cue. | ✓ |
| Flat anchored panel | A quiet inset surface with one strong anchor rail and minimal internal borders. Keeps code dominant, but provides less card hierarchy. | |
| Minimal inline note | Mostly text and controls on the diff surface, using spacing and a small marker rather than a full container. | |
| Let Claude decide | Choose the clearest frame that fits Monaco view zones without competing with changed code. | |

**User's choice:** Compact conversation card
**Notes:** The card must remain connected to the existing source-line anchor cue.

### Comment metadata hierarchy

| Option | Description | Selected |
|--------|-------------|----------|
| Filename and anchor first | Emphasize filename plus Base/Head line; show the directory path and fixed-anchor explanation as quieter supporting metadata. | ✓ |
| Full path and anchor equally | Keep the complete path, side, and line in one prominent heading as today; strongest precision, denser presentation. | |
| Lifecycle status first | Lead with Draft/Open/Resolved/Saved state, then place file and line metadata beneath it. | |
| Let Claude decide | Prioritize the information needed to understand where the comment belongs without hiding precise path context. | |

**User's choice:** Filename and anchor first
**Notes:** Precise directory and fixed-anchor context remain available but visually secondary.

### Composer feedback placement

| Option | Description | Selected |
|--------|-------------|----------|
| Field-adjacent feedback | Muted helper text stays below the textarea; validation/error replaces or follows it at the field; pending state stays explicit in the primary action label. | ✓ |
| Card-level notice | Validation and failures appear as a full-width notice directly under the card header; helper text remains near the field. | |
| Footer status row | Keep the body quiet and place guidance, validation, and pending feedback beside the card actions. | |
| Let Claude decide | Choose a stable layout that avoids content jumps while keeping errors close to the textarea. | |

**User's choice:** Field-adjacent feedback
**Notes:** Pending remains action-specific; validation remains close to the input.

### Inline lifecycle cues

| Option | Description | Selected |
|--------|-------------|----------|
| Icon-label badge plus structure | Use compact text+icon status badges; keep Open clear, make Resolved quieter with a check treatment, and pair stale/unavailable states with warning structure rather than color alone. | ✓ |
| Plain status line | Use explicit text such as “Open · Verified” below the heading with no badge styling. Calm, but slower to scan. | |
| State-colored card edge | Use the card’s leading border as the main lifecycle cue with text in the header. Visually strong, but may compete with the line-anchor rail. | |
| Let Claude decide | Keep lifecycle and anchor meaning distinct while meeting the text/icon/non-color requirement. | |

**User's choice:** Icon-label badge plus structure
**Notes:** Lifecycle styling must remain separate from the source-line anchor rail.

---

## Review rail hierarchy

### Rail section framing

| Option | Description | Selected |
|--------|-------------|----------|
| Stacked framed sections | Summary, comment groups, and export each get a restrained bordered section with a clear heading; interiors stay flat and compact. | ✓ |
| Continuous pane with dividers | Use one flat scrolling surface, relying on heading scale, spacing, and horizontal separators instead of section containers. | |
| Raised cards throughout | Treat each major section as a distinct raised card. Strong separation, but conflicts with the established quiet, border-led hierarchy. | |
| Let Claude decide | Choose the clearest hierarchy that keeps comments visually primary and avoids excessive nesting. | |

**User's choice:** Stacked framed sections
**Notes:** Existing section order and information architecture stay fixed.

### Rail counts

| Option | Description | Selected |
|--------|-------------|----------|
| Labeled count badges | Show compact “Open 3” and “Resolved 2” text badges in the rail header, with section disclosure labels retaining their own counts. | ✓ |
| Header summary line | Keep the current plain “Open 3 · Resolved 2” line and rely on disclosure headings for stronger section counts. | |
| Section counts only | Remove visual emphasis from the top summary and show counts only on Open and Resolved disclosures. | |
| Let Claude decide | Avoid redundant visual noise while keeping status totals immediately scannable. | |

**User's choice:** Labeled count badges
**Notes:** Disclosure headings continue to expose their section-specific counts.

### File groups and cards

| Option | Description | Selected |
|--------|-------------|----------|
| File header plus card stack | A compact file header with count introduces a tight stack of individual bordered comment cards; directory text is quieter and filenames stay strong. | |
| Shared grouped container | Each file gets one bordered container; comments become divider-separated rows inside it. Denser and avoids nested card borders. | ✓ |
| Independent cards | File headings remain plain labels and each comment stands alone with generous spacing. Clear per item, but the rail becomes longer. | |
| Let Claude decide | Choose a compact hierarchy that keeps file grouping obvious without card-within-card clutter. | |

**User's choice:** Shared grouped container
**Notes:** File headers retain path/count hierarchy; comment rows share the group boundary.

### Selected comment cue

| Option | Description | Selected |
|--------|-------------|----------|
| Accent rail plus stronger surface | Use a persistent accent edge, modest surface step, and focused heading; keep all existing action labels visible and unchanged. | ✓ |
| Strong outline only | Use a two-pixel outline around the selected row with no fill change. Very explicit, but visually close to keyboard focus. | |
| Tinted row fill | Use a restrained blue fill across the selected comment row plus a text label. Strong association, but adds another overlapping color layer. | |
| Let Claude decide | Keep selection distinct from keyboard focus, open/resolved status, and destructive action styling. | |

**User's choice:** Accent rail plus stronger surface
**Notes:** Selection must not be confused with focus, lifecycle, or destructive intent.

---

## Controls and status feedback

### Button hierarchy

| Option | Description | Selected |
|--------|-------------|----------|
| Neutral, primary, destructive | Neutral outlined controls by default; filled accent only for the primary action; destructive stays outlined at rest and becomes emphatic on hover/pressed. Selected controls use a separate accent treatment. | ✓ |
| Tonal buttons | Neutral, primary, and destructive actions all use tinted fills at rest. Faster state recognition, but creates more color blocks around the diff. | |
| Mostly text controls | Use borderless text/icon actions except for primary and destructive confirmations. Very light, but weakens control boundaries. | |
| Let Claude decide | Choose the quietest hierarchy that keeps primary and destructive actions unmistakable. | |

**User's choice:** Neutral, primary, destructive
**Notes:** Action tiers differ semantically, not structurally.

### Interaction-state cues

| Option | Description | Selected |
|--------|-------------|----------|
| Separate visual channels | Hover changes surface/border; pressed adds a deeper surface or inset cue; selected adds persistent accent plus label/icon; focus remains the existing unclipped two-pixel outer ring. | ✓ |
| Surface intensity ladder | Use progressively stronger fills for hover, pressed, and selected; focus adds the outer ring. Simple, but selected can resemble a held press. | |
| Border-led states | Keep fills nearly static and vary border strength, outline, and icon treatment across states. Quiet, but subtle at a glance. | |
| Let Claude decide | Ensure no interaction state depends on color alone or conflicts with diff selection cues. | |

**User's choice:** Separate visual channels
**Notes:** Focus stays independent from persistent selected state.

### Busy feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Spinner plus explicit verb | Show a small local spinner beside “Saving…”, “Resolving…”, or the existing action-specific verb; preserve button width where practical and retain current disable rules. | ✓ |
| Text change only | Keep the existing action-specific “…ing” labels without spinners. Clear and low motion, but slower to spot. | |
| Section-level progress | Leave button labels stable and show one status row at the section level. Reduces button movement, but weakens action-to-feedback association. | |
| Let Claude decide | Use reduced-motion-safe feedback that stays tied to the action and does not alter mutation behavior. | |

**User's choice:** Spinner plus explicit verb
**Notes:** Existing mutation and disable semantics remain unchanged.

### Notice and status vocabulary

| Option | Description | Selected |
|--------|-------------|----------|
| Notices plus status badges | Notices use tone icon, heading/body, subtle background, and structural edge; compact Open/Resolved/Pending/Disabled states use matching icon-label badges. Color reinforces but never carries meaning alone. | ✓ |
| Unified labeled banners | Render every state, including compact lifecycle states, as a labeled notice row. Extremely explicit, but too bulky in cards and controls. | |
| Text and border only | Use explicit labels and border patterns without state icons. Quiet and accessible, but less GitHub-familiar and slower to scan. | |
| Let Claude decide | Choose consistent mappings for error, warning, info, success, pending, disabled, open, and resolved. | |

**User's choice:** Notices plus status badges
**Notes:** The same semantic meanings appear at notice and badge scales.

---

## Claude's Discretion

No discussion area was delegated wholesale. Exact icon glyphs, spacing within the inherited scale, token assignments, border weights, restrained surface values, spinner construction, and precise status-symbol mapping remain implementation discretion within the locked decisions in `07-CONTEXT.md`.

## Deferred Ideas

None — discussion stayed within Phase 07 scope.
