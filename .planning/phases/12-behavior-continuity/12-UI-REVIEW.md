---
phase: 12
status: passed-with-findings
audit: ui-six-pillars
score: 23/24
reviewed: 2026-09-14
---

# Phase 12 UI Review

## Verdict

**PASS with one inherited owning-phase finding — 23/24.** The retained evidence is a real packaged `@shipwithai/cumpa@1.5.0` attached review: an ephemeral loopback Fastify workspace, never Vite and never a fixed development port. The complete reviewer journey was exercised through accepted comment, resolution, summary, paired export, and attached Finish. The documented external browser prerequisites remain the only suite gates; no production source changed in this plan.

## Live evidence

Captures are retained and ignored by `.planning/ui-reviews/.gitignore` in `.planning/ui-reviews/12-live-20260914/`. The fixture is recorded as `<temporary packaged-fixture repository>`; it pinned Base `e79662ed784a4136a55a892746469b76e8f3e052` and Head `28c66776eede1ceac4fbd02bfe4f7da2a4f3c63a`. Capture time: `2026-09-14T06:12:31.891Z`. Artifact custody: `@shipwithai/cumpa@1.5.0`, SHA-256 `b070f4562c62c66e985416280974897690a177c5fa79b0e61bdb3867a890d35d`, producer source `d9607dd1788695d25074f251422e139cf4ce4e28`.

The package was freshly built before the session, then its packaged CLI served Fastify at an ephemeral `127.0.0.1` port. It was not launched from Vite, a component harness, a static mockup, a fixed port, or a local `dist` entrypoint.

| Capture | Viewport | State |
|---|---:|---|
| `desktop.png` | 1440×1000 | Persistent tree; selected `alpha.ts`; Base/Head labels; Monaco; saved Head-side comment; truthful footer. |
| `full-desktop.png` | 1650×900 | The same selected live fixture state at the Phase 11 wide treatment. |
| `mobile.png` | 420×900 | Narrow shell, Files entry, Base before Head, local horizontal-scroll cue, footer. |
| `mobile-files.png` | 420×900 | Changed files dialog; `Filter files` is focused; tree retains the same selection. |
| `details.png` | 1440×900 | Real Details dialog over the live comparison. |
| `review-notes.png` | 1440×900 | Accepted summary, resolved count, paired current export receipt, and attached Finish region. |
| `warning-stack.png` | 1440×900 | Live closed-dialog workspace with verified resolved-history record retained. Selector-drift and stale/orphan warning paths are separately covered by `complete-review-draft.spec.ts:856` and `anchored-review.spec.ts:317`; this attached package did not surface those notices before Finish. |

| Viewport | `clientWidth` | `scrollWidth` | Result |
|---|---:|---:|---|
| 1440×1000 | 1440 | 1440 | PASS — no document overflow. |
| 1650×900 | 1650 | 1650 | PASS — no document overflow (retained raster inspection). |
| 420×900 | 420 | 420 | PASS — no document overflow (retained raster inspection); the inherited local side-by-side canvas is the only horizontal scroll owner, `.diff-workspace__viewport`. |

Live computed styles: footer `padding: 9px 18px`, `12px/18px`; toolbar/control `14px` type; dialog boundary foreground `rgb(230, 237, 243)` on `rgb(33, 38, 45)`; selected tree row `padding: 5px 10px 5px 24px`, `14px/21px`, `rgb(26, 43, 67)` background and `rgb(52, 84, 119)` boundary; Monaco `14px` consumer. These are the measured packaged-page values, not mockup CSS assumptions.

## Eight behavioural checks

| Step | Reviewer action | Observable live result | Automated evidence |
|---|---|---|---|
| Launch | Open the attached packaged request. | Pinned Base/Head identities, changed-file tree, Monaco comparison, and empty pre-Finish stdout appeared at ephemeral loopback. | `pinned-session.spec.ts:395`; `agent-ready-export.spec.ts:581` |
| Select file | Select `src/alpha.ts` from the tree. | Active-file toolbar and Monaco changed to `alpha.ts`; selection survived subsequent actions. | `file-tree.spec.ts:363` |
| Line comment | Use real modified Monaco line 3 action and save text. | `Live packaged Head-side comment.` appeared as a saved Head comment. | `anchored-review.spec.ts:216`; `agent-ready-export.spec.ts:258` |
| Resolve | Resolve it in Review and expose resolved history. | Open count fell; the read-only resolved record retained its verified anchor. | `complete-review-draft.spec.ts:314` |
| Summary | Write and save Markdown in Review notes. | Accepted summary was visibly saved and included in `review-notes.png`. | `complete-review-draft.spec.ts:390`; `agent-ready-export.spec.ts:281` |
| Export | Export from Review notes. | `Review export complete` showed the current paired receipt. `review.json` was 2,423 bytes, SHA-256 `e3829d8dfbc885066aceccae8ccf7d1eb198f6933daaeedd670234eeeaad870c`; `review.md` was 1,973 bytes, SHA-256 `9b9aabf8788aed8e4b4314ce4b0e8976a2e63efda7efe9bbac22fe958b72e2d9`; both disk files matched the receipt. | `agent-ready-export.spec.ts:425` |
| Recover | Preserve accepted work before Finish; exercise corrupt-draft recovery contract. | The live mutation sequence retained selection, accepted comment/resolution, summary, and receipt; browser recovery separately proves reload-before-Finish restoration plus corrupt-draft backup and clean replacement. | `complete-review-draft.spec.ts:670-703` |
| Finish attached | Choose Finish review after the accepted draft is saved. | Focus moved to `Review finished`; pre-Finish stdout was empty, then exactly one canonical JSON document (2,423 bytes) emitted and CLI exited 0. | `agent-ready-export.spec.ts:594-623` |

## CON-03 structural evidence

The six ROADMAP-named specs carry 290 `getByRole` assertions and 37 `toBeFocused` assertions: `file-tree.spec.ts`, `pinned-session.spec.ts`, `anchored-review.spec.ts`, `complete-review-draft.spec.ts`, `responsive-session.spec.ts`, and `agent-ready-export.spec.ts`. They cover `aria-level`, `aria-selected`, `aria-expanded`, roving `tabindex`, navigation/tree/treeitem semantics, `aria-modal`, `aria-haspopup`, named dialogs and controls. Plan 12-02 added the missing desktop toolbar Tab-order traversal coverage. `DEFER-04` is not claimed: no new composited-contrast, forced-colors, 320px, or true 400% zoom recertification is asserted here.

## Visual equivalence and classified differences

`desktop.png` was compared at its true 1440×1000 raster size with `mockups/01b-desktop.png`; `mobile.png` was compared at true 420×900 with `mockups/01b-mobile.png`. `full-desktop.png` at 1650×900 is assessed only against the Phase 11 wide contract and retained Phase 11 evidence; no reference raster was rescaled or relabeled.

| Bucket | Classified visible difference |
|---|---|
| Authorized production-data difference | Real ref labels/OIDs, fixture paths, Monaco content, saved comment, accepted summary, receipt metadata, and warning/history data replace illustrative mockup data. |
| Authorized inherited departure | Mobile retains its 640px side-by-side local Monaco canvas; Review is a production overlay; footer truthfully says local/pinned/export-explicit; prototypes' viewed tracking, All files/Unviewed, hunk jump, wrap-lines, and unified-diff controls are absent. |
| Owning-phase finding | The inherited bare layout containers in `ReviewToolbar.vue:25`, `ReviewToolbar.vue:26`, `ReviewToolbar.vue:51`, and `ReviewToolbar.vue:76` remain unroled. Plan 12-02 records `git log --oneline f810081..HEAD -- src/web/components/ReviewToolbar.vue` as empty, so this is Phase 11 ownership, not a Phase 12 change. |

No observed visible difference is left unclassified.

## Pillar scores

| Pillar | Score | Finding |
|---|---:|---|
| Copywriting | 4/4 | Pinned/local/export language remains factual in live package. |
| Visuals | 4/4 | Desktop, wide, narrow, dialogs and footer preserve the approved hierarchy. |
| Interaction | 4/4 | File selection, Monaco comment, resolve, summary, export and Finish all completed live. |
| Accessibility | 3/4 | Semantic controls are covered; the inherited `ReviewToolbar.vue` bare-container finding remains. |
| Responsiveness | 4/4 | All contractual viewport rasters retain document-width containment. |
| Fidelity | 4/4 | Exact-size comparison has only classified differences. |

## Top priority fixes

Address the Phase 11-owned `ReviewToolbar.vue:25`, `:26`, `:51`, and `:76` semantics in its owning phase. No Phase 12 production change is proposed.

## Mockup comparison conclusion

- **1440×1000:** equivalent quiet-workspace hierarchy, selected-file toolbar, Base/Head comparison, review controls, and truthful footer.
- **1650×900:** equivalent Phase 11 wide composition without changed semantic hierarchy.
- **420×900:** equivalent narrow shell with Files entry and ordered Base/Head presentation; inherited local side-by-side overflow is scoped to the diff viewport and accompanied by the scroll cue.
