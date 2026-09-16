# Phase 06: Monaco Diff Semantics - Context

**Gathered:** 2026-07-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Theme the existing side-by-side Monaco diff editor so its canvas, syntax, diff layers, gutters, widgets, selections, focus, comment anchors, and surrounding workspace read as one coordinated dark interface. Preserve the current Monaco adapter, immutable models, line mapping, paired view zones, hidden-region behavior, side-by-side geometry, accessibility labels, keyboard commands, persistence, and review mechanics. Detailed review-surface adaptation belongs to Phase 07; milestone-wide responsive and accessibility proof belongs to Phase 08.

</domain>

<decisions>
## Implementation Decisions

### Diff layer language
- **D-01:** Whole-line addition and deletion treatments stay restrained; intraline changed spans carry stronger emphasis so exact changes lead without reducing code readability.
- **D-02:** Base/deletion and Head/addition must remain distinguishable without red-versus-green recognition through persistent signed gutter cues: `−` for deletion and `+` for addition, reinforced by the existing BASE/HEAD labels and side-by-side position.
- **D-03:** Multi-line changes use a continuous gutter change bar with sparse signed markers at the start and end of long contiguous blocks rather than repeating a sign on every row.
- **D-04:** Unchanged context stays close to the normal canvas, empty counterpart regions use a slightly more recessed neutral, and the hunk accent is reserved for reveal controls and separators. Avoid decorative textures or prominent blocks that compete with changed code.

### Overlapping state precedence
- **D-05:** Diff meaning is the persistent base layer. Interaction states should use distinct geometry—edges, outlines, rails, or affordance emphasis—rather than replacing addition or deletion meaning with another opaque row fill.
- **D-06:** Text selection uses a restrained blue fill plus a crisp visible edge. Signed gutter markers and the continuous change bar keep diff meaning identifiable beneath or beside the selection.
- **D-07:** The active line uses a subtle full-width edge plus stronger line-number emphasis. Hover should emphasize or reveal the existing comment affordance instead of applying another row background.
- **D-08:** A persistent comment anchor uses an inset rail or marker. Keyboard focus remains the existing two-pixel outer focus ring on the focused editor or control, so anchor location and focus location remain simultaneously legible.

### Claude's Discretion

Exact Monaco theme identifiers, syntax-token colors, opacity values, gutter/widget colors, border weights, and the implementation of sparse start/end signs remain flexible. Research and planning should choose the smallest documented Monaco surface that satisfies D-01 through D-08, the Phase 05 semantic contract, and composited contrast requirements without changing editor geometry or behavior. Syntax/canvas balance and detailed widget treatment were not selected for discussion and remain at Claude's discretion within the roadmap contract.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase contract
- `.planning/ROADMAP.md` — Phase 06 goal, DIFF-01 through DIFF-05 success criteria, dependency order, and the locked requirement to register an idempotent typed Monaco theme before editor construction while preserving adapter behavior.
- `.planning/REQUIREMENTS.md` — Diff semantics requirements and milestone-wide exclusions: no Monaco replacement, new review mechanics, light theme, Primer runtime, remote assets, or information-architecture redesign.
- `.planning/PROJECT.md` — v1.1 product goal, preserved Diff Review identity and workflow, runtime constraints, and the shipped Monaco-based review capability.

### Inherited visual contract
- `.planning/phases/05-semantic-dark-foundation/05-CONTEXT.md` — GitHub dark-default semantic reference, direct role-based token system, typography and density choices, quiet hierarchy, and the handoff of Monaco internals to Phase 06.

No external design specification or ADR is currently canonical for this phase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/web/styles.css`: the root semantic contract already defines selection, focus, addition, deletion, intraline, hunk, empty, unchanged, and diff-border roles. Phase 06 should refine and map these roles into Monaco rather than introducing a parallel palette.
- `src/web/monaco/diff-adapter.ts`: `PublicMonacoDiffAdapter` is the single editor-construction boundary. It creates the side-by-side editor with `glyphMargin`, hidden unchanged regions, public original/modified editor access, decorations, and paired view zones.
- `src/web/components/DiffWorkspace.vue`: preserves explicit BASE/HEAD labels, the absolutely positioned line-comment affordance, the Monaco host, and unchanged-region help text.
- `tests/integration/monaco-anchor.spec.ts`: existing real-browser Monaco coverage protects immutable text, paired-zone alignment, hidden-anchor reveal, file-state restoration, resource bounds, and keyboard/pointer convergence.

### Established Patterns
- Global BEM-like styling remains centralized in `src/web/styles.css`; Vue templates expose stable class hooks and should not gain a second styling system.
- Monaco behavior is isolated behind the public adapter. Models, line mapping, focus state, anchor decoration, and view-zone lifecycle are already stable and must remain behaviorally unchanged.
- Phase 05 established one direct semantic-token root and deliberately left Monaco internals untouched. Phase 06 consumes that contract rather than adding aliases or a component-specific token root.

### Integration Points
- Register and select the typed, idempotent Monaco theme before `monaco.editor.createDiffEditor(...)` in `src/web/monaco/diff-adapter.ts`.
- Map semantic roles into Monaco canvas, token, diff, gutter, widget, selection, active-line, hidden-region, and focus colors while retaining existing editor options and side-by-side geometry.
- Use existing glyph-margin and decoration surfaces for continuous change bars, sparse signed markers, and anchor rails without moving code or causing gutter reflow.
- Keep `.diff-workspace`, side labels, gutter action, composer zones, and surrounding surfaces coordinated through `src/web/styles.css`.

</code_context>

<specifics>
## Specific Ideas

- The intended hierarchy is “quiet changed lines, strong changed words.”
- Non-color meaning should remain explicit even when the user focuses inside one pane: continuous structural change bars plus sparse `−`/`+` signs, not color and left/right position alone.
- Overlap states should compose through separate visual channels: diff fill, selection fill and edge, active-line edge, anchor rail, hover affordance, and outer focus ring.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-Monaco Diff Semantics*
*Context gathered: 2026-07-26*
