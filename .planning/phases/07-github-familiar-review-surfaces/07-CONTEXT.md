# Phase 07: GitHub-Familiar Review Surfaces - Context

**Gathered:** 2026-07-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Adapt the existing file header, toolbar, inline comment surfaces, notices, summary and export surfaces, and review rail to a close GitHub dark-diff treatment with clear hierarchy and complete interaction-state feedback. Preserve all existing review mechanics, events, ARIA relationships, focus targets, state transitions, persistence, information architecture, and Monaco geometry. Phase 08 owns final narrow-layout, 400% zoom, forced-colors, and end-to-end accessibility proof; Phase 07 must remain compatible with those acceptance boundaries.

</domain>

<decisions>
## Implementation Decisions

### File header and toolbar
- **D-01:** Present the active file identity and its controls as one grouped, bordered, two-row header. The first row owns file and comparison context; the second row retains every existing navigation, Review, and Keyboard help action.
- **D-02:** Show compact Base and Head endpoint blocks using the existing selector labels and short commit IDs. Their placement should reinforce the left/Base and right/Head relationship of the Monaco panes.
- **D-03:** Render paths with quieter directory segments and a stronger filename. Renamed files should expose the existing old-to-new path relationship rather than showing only an undifferentiated effective path.
- **D-04:** Use familiar local inline icons for previous/next file and previous/next change controls. Keep Review and Keyboard help visibly labeled. Preserve tooltips, accessible names, commands, and disabled-state semantics.

### Inline comment surfaces
- **D-05:** Render both the inline composer and saved inline comments as compact conversation cards with distinct metadata header, body, and action footer, connected to the source line through the existing anchor rail/cue.
- **D-06:** Lead comment headers with the filename and Base/Head line anchor. Keep directory path and fixed-anchor explanation available as quieter supporting metadata.
- **D-07:** Keep composer guidance and validation adjacent to the textarea. Validation and failures must be explicit at the field; pending state remains explicit in the primary action label and busy treatment.
- **D-08:** Use compact icon-plus-label lifecycle badges reinforced by structure. Open stays prominent, Resolved becomes quieter with an explicit check treatment, and stale or unavailable anchors use warning structure in addition to color. Lifecycle styling must not replace the separate source-line anchor cue.

### Review rail hierarchy
- **D-09:** Keep the existing rail order, but present Summary, comment sections, and Export as restrained stacked framed sections with clear headings and quiet, flat interiors.
- **D-10:** Show labeled Open and Resolved count badges in the rail heading. Existing Open and Resolved disclosures retain their section-specific counts.
- **D-11:** Present each file group as one shared bordered container with a compact path/count header and divider-separated comment rows. Use quieter directory text and stronger filenames; avoid nested card-within-card borders.
- **D-12:** Mark the comment selected from the diff with a persistent accent rail, a modest stronger surface, and heading emphasis. Keep this selection cue distinct from keyboard focus, lifecycle status, and destructive-action styling; retain all existing action labels.

### Controls and status feedback
- **D-13:** Use three stable action tiers: neutral outlined controls by default, a filled accent treatment only for the primary action, and destructive controls that remain outlined at rest and become emphatic on hover or press.
- **D-14:** Give interaction states separate visual channels: hover changes surface and border; pressed adds a deeper surface or inset cue; selected adds a persistent accent plus text or icon meaning; keyboard focus remains the existing unclipped two-pixel outer ring.
- **D-15:** Pair pending actions with a small local spinner and an explicit action-specific verb such as “Saving…” or “Resolving…”. Preserve current mutation and disable rules, keep control width stable where practical, and respect reduced-motion behavior.
- **D-16:** Use one status language at two scales. Notices use a tone icon, explicit heading/body, subtle background, and structural edge; compact Open, Resolved, Pending, and Disabled states use matching icon-label badges. Error, warning, informational, success, pending, disabled, open, and resolved meaning never depends on color alone.

### Claude's Discretion

Exact local SVG glyphs, icon stroke weights, short-ID length where existing conventions do not decide it, token assignments, spacing within the inherited 4-point scale, border weights, restrained surface values, spinner construction, and the exact status-icon mapping remain flexible. Research and planning should choose the smallest implementation that satisfies D-01 through D-16, reuses the existing semantic token vocabulary and component hooks, and does not take Phase 08's proof scope or introduce new mechanics.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase contract
- `.planning/ROADMAP.md` — Phase 07 goal, success criteria, planning boundary, dependency order, and explicit preservation of review mechanics and information architecture.
- `.planning/REQUIREMENTS.md` — VIS-04 and REVW-01 through REVW-04, plus milestone exclusions covering new review mechanics, Primer, light themes, remote assets, and information-architecture redesign.
- `.planning/PROJECT.md` — v1.1 product goal, preserved Diff Review identity, runtime constraints, existing workflow, and completed Phase 05/06 decisions.

### Inherited visual and diff contracts
- `.planning/phases/05-semantic-dark-foundation/05-CONTEXT.md` — locked dark-default adaptation, semantic-token, typography, density, shape, elevation, control, and status decisions that Phase 07 must consume directly.
- `.planning/phases/05-semantic-dark-foundation/05-UI-SPEC.md` — exact semantic roles, state matrix, control geometry, icon accessibility, status treatment, and no-shadow/no-extra-palette constraints handed to detailed review surfaces.
- `.planning/phases/06-monaco-diff-semantics/06-CONTEXT.md` — locked diff, selection, active-line, comment-anchor, and focus layering that Phase 07 comment surfaces must coexist with.
- `.planning/phases/06-monaco-diff-semantics/06-UI-SPEC.md` — Monaco geometry, typed-theme, view-zone, anchor-rail, and decoration invariants; detailed composer styling may change, but editor behavior and paired-zone geometry may not.

No external design specification or ADR is currently canonical for this phase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/web/App.vue`: owns the active-file strip, the `ReviewToolbar` placement, selected file metadata, session Base/Head identities, and existing drawer/review integration. It is the composition point for the grouped two-row header.
- `src/web/components/ReviewToolbar.vue`: already exposes all six actions, tooltip wording, keyboard shortcuts, ARIA relationships, comment counts, and disabled conditions. Phase 07 should adapt presentation without replacing this behavior.
- `src/web/components/DiffWorkspace.vue` and `src/web/components/CommentComposer.vue`: own Monaco view-zone rendering, the line-anchor relationship, fixed path/side/line metadata, accepted inline comments, composer validation, and current action lifecycle.
- `src/web/components/ReviewPanel.vue` and `src/web/components/CommentsRail.vue`: already implement the fixed Summary → Open → Resolved → Export order, file grouping, disclosures, selected-comment navigation, editing, lifecycle actions, conflicts, failures, and ARIA relationships.
- `src/web/components/InlineNotice.vue`, `src/web/components/SummarySection.vue`, and `src/web/components/ExportSection.vue`: provide existing semantic hooks for notices, forms, pending work, confirmations, readiness, and receipts.
- `src/web/styles.css`: remains the single global semantic stylesheet, with the inherited tokens and BEM-like hooks for `.active-file-strip`, `.review-toolbar`, `.ui-button`, `.inline-comment-composer`, `.inline-accepted-comment`, `.review-panel`, `.inline-notice`, summary, and export surfaces.

### Established Patterns
- Styling is centralized in `src/web/styles.css`; Vue templates expose stable semantic classes instead of introducing scoped or component-specific token systems.
- Shared `.ui-button` and `InlineNotice` primitives already cover the product's state vocabulary. Phase 07 should deepen those shared patterns rather than append one-off variants for each surface.
- Existing labels, events, keyboard commands, ARIA attributes, focus destinations, mutation states, and drawer behavior are product contracts. Visual adaptation must reuse them.
- Monaco models, line mapping, decoration collections, view-zone pairing, and editor geometry remain authoritative. Comment cards can be restyled only within those existing boundaries.

### Integration Points
- Group the current active-file strip and `ReviewToolbar` in `src/web/App.vue`, sourcing Base/Head labels and short OIDs from the existing session and old/new path metadata from the selected file.
- Apply the conversation-card hierarchy through existing `CommentComposer.vue` and accepted-comment hooks in `DiffWorkspace.vue`; retain the current anchor rail and view-zone lifecycle.
- Apply rail section, grouped-row, count-badge, and selected-comment treatments through existing `ReviewPanel.vue` structure rather than reorganizing content or actions.
- Extend the shared control and notice state treatments in `src/web/styles.css` and existing semantic components so all current diff-workspace surfaces consume the same mappings.

</code_context>

<specifics>
## Specific Ideas

- The file header should read as one component with two compact rows, not two unrelated bars.
- Base and Head context should visually associate with the Monaco panes, while directories recede and filenames lead.
- Inline comments should resemble compact GitHub conversation cards without becoming decorative raised cards or obscuring diff meaning.
- The review rail should use framed major sections but shared, divider-based containers within each file group to avoid nested-card clutter.
- Selection, focus, lifecycle status, line anchoring, and destructive intent each need their own visual channel.
- Busy feedback should combine motion and explicit words; status feedback should combine icons, labels, and structure.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-GitHub-Familiar Review Surfaces*
*Context gathered: 2026-07-27*
