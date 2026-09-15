# Phase 05: Semantic Dark Foundation - Context

**Gathered:** 2026-07-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish one coherent, dark-only semantic visual language across the existing Diff Review workspace. This phase defines and applies the shared foundation for surfaces, text, borders, typography, spacing, shape, elevation, controls, status, focus, selection, and future diff roles. It preserves the current Vue structure, DOM semantics, copy, dependencies, information architecture, and review mechanics. Monaco-specific diff treatment belongs to Phase 06; detailed review-surface adaptation belongs to Phase 07; accessibility and responsive proof belongs to Phase 08.

</domain>

<decisions>
## Implementation Decisions

### Palette fidelity and identity
- **D-01:** Closely track GitHub dark-default's neutral blue-gray surface, text, border, and blue-accent character. This is a semantic adaptation, not a pixel-perfect clone and not GitHub branding.
- **D-02:** Diff Review's identity remains in its existing product name, local-first copy, information architecture, and workflow rather than a competing decorative palette or novel brand treatment.
- **D-03:** Dark presentation begins at the document root and covers page, panels, drawers, controls, loading, empty, and error surfaces. Browser-default or light fallback flashes are not acceptable.

### Surface hierarchy
- **D-04:** Use a restrained hierarchy of canvas, inset, panel, raised, and interactive roles. Adjacent static regions should rely primarily on subtle surface steps and one-pixel borders, not strong contrast blocks.
- **D-05:** Semantic tokens are named by visual role rather than by component. The foundation must include surface, text, border, interactive, status, focus, selection, and diff-facing roles so later phases extend one vocabulary instead of adding parallel palettes.
- **D-06:** Replace the two competing root token systems in `src/web/styles.css` with one clean semantic contract. Compatibility aliases, stacked overrides, and a second theme layer are not desired.

### Typography and density
- **D-07:** Use the local system UI stack for interface text and retain the existing monospace stack for code, object IDs, paths, and line-oriented metadata. No remote fonts or new font dependency.
- **D-08:** Target GitHub-familiar compactness: 14px as the normal interface baseline, 12px for supporting metadata, restrained heading steps, and compact line heights that remain legible.
- **D-09:** Keep the existing 4/8-based spacing rhythm and favor 4px or 8px internal gaps with 16px section spacing. Do not use the visual-foundation work to redesign layout or compress controls below comfortable use.

### Shape and elevation
- **D-10:** Use modest, GitHub-familiar radii: approximately 6px for controls and contained cards, smaller radii where density benefits, and pill shapes only for badges or statuses. Structural workspace panes remain comparatively square.
- **D-11:** Static surfaces use borders and surface steps rather than shadows. Shadows are reserved for true overlays such as drawers, dialogs, tooltips, or floating layers.
- **D-12:** Avoid gradients, glow, glass effects, decorative textures, and large soft cards. Code and review content remain the visual focus.

### Claude's Discretion
The user delegated all presented gray areas to Claude. Exact token names, final color values, minor type-scale adjustments, and precise radius/shadow values remain flexible when research or composited-contrast validation shows a better value, provided D-01 through D-12 and the phase boundary remain intact.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope and phase contract
- `.planning/ROADMAP.md` — Phase 05 goal, success criteria, planning boundary, dependency order, and later-phase ownership.
- `.planning/REQUIREMENTS.md` — VIS-01, VIS-02, and VIS-03 plus milestone-wide exclusions such as light themes, Primer, remote assets, and new review mechanics.
- `.planning/PROJECT.md` — v1.1 product goal, active requirements, preserved product identity, architecture constraints, and shipped-workflow decisions.

No external design specification or ADR is currently canonical for this phase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/web/styles.css`: the single global stylesheet already contains workspace selectors, spacing tokens, shared control classes, status treatments, breakpoints, and reduced-motion handling. It is the primary migration surface.
- `src/web/App.vue`: owns the loading, unavailable, recovery, and three-column review shells and imports `styles.css` once, making it the integration boundary for first-paint and full-workspace coverage.
- `src/web/components/ui/UiPrimitives.vue`: preserves the existing tooltip behavior while the global semantic contract restyles its visual surface.
- `src/web/components/DiffWorkspace.vue`: preserves the editor host, Base/Head labels, gutter action, and context help. Phase 05 should provide shared roles for it without changing Monaco behavior reserved for Phase 06.

### Established Patterns
- Visual styling is centralized in global BEM-like classes in `src/web/styles.css`; Vue components largely expose stable semantic class hooks rather than scoped component styles.
- The stylesheet currently has an early GitHub-like dark `--color-*` root followed by a Phase 2 light `--canvas` / `--panel` / `--surface` root that remaps the earlier names. Phase 05 should consolidate these rather than append another override block.
- Shared `.ui-button`, notice, state-card, pane, drawer, and responsive selectors already cover the real workspace states. Reusing those hooks preserves behavior and DOM semantics.
- Existing 767px, 1099px, 1279px, and 1439px layout boundaries and reduced-motion handling are established constraints; responsive redesign is deferred to Phase 08.

### Integration Points
- Replace the root visual vocabulary and migrate every consumer in `src/web/styles.css`, including loading and error states above the later workbench override.
- Keep `src/web/App.vue` and component templates structurally unchanged except where an existing semantic hook is demonstrably insufficient.
- Expose stable semantic roles that Phase 06 can map into Monaco and Phase 07 can apply to detailed controls, comments, notices, and the review rail.

</code_context>

<specifics>
## Specific Ideas

- GitHub dark-default is the close visual reference; Diff Review should feel familiar without impersonating GitHub.
- The current initial dark palette is directionally closer to the target than the later light workbench palette, but the result should be one deliberate semantic system rather than restoring old colors wholesale.
- Borders and restrained surface steps should carry hierarchy; overlay-only shadow keeps the code review surface visually quiet.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-Semantic Dark Foundation*
*Context gathered: 2026-07-24*
