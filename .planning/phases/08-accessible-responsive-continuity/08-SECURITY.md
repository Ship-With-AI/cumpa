---
phase: 08
slug: accessible-responsive-continuity
status: verified
threats_open: 0
asvs_level: 1
created: 2026-07-29
---

# Phase 08 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Repository/session text → Vue DOM | Untrusted paths and selector labels must remain text-interpolated while becoming wrappable. | Repository paths, selectors, and labels |
| Responsive DOM → existing mutation handlers | Reflow must not duplicate a control/component or create a second API/state path. | User actions and review mutations |
| Fluid page → localized diff viewport | Overflow ownership must not hide destructive actions, focus, or pinned Base/Head meaning. | Review controls and diff content |
| Canvas → Monaco adapter | Presentation wrappers must not alter immutable models, line mapping, commands, anchors, or pane geometry. | Pinned blob text and line anchors |
| Repository/draft text → visual accessibility layer | Wrapping and contrast changes must preserve safe Vue text rendering and exact content authority. | Repository and draft text |
| Browser/OS color override → app-owned semantic markers | Author CSS must retain structure while honoring user system colors. | Accessibility preferences and state cues |
| Keyboard focus → clipping/scroll ancestors | Focus must remain visible without creating new destinations or mutation paths. | Keyboard navigation state |
| Browser test harness → production behavior | Evidence must drive real controls without production hooks or synthetic state ownership. | Test actions and rendered evidence |
| Keyboard/browser context → existing UI capabilities | Responsive/media modes must not expose duplicate, hidden, or reordered capability paths. | Keyboard commands and browser layout state |
| Existing UI controls → loopback API/draft/export | Presentation must preserve requests, revisions, consent, persistence, and publication authority. | Review mutations, drafts, and exports |
| Browser evidence → acceptance decision | Synthetic states, screenshots, or a 320px viewport alone must not impersonate true zoom or workflow proof. | Verification evidence |
| Receipt/recovery text → browser display | Relative safe values and authoritative copy must remain visible without leaking absolute paths or guessing anchors. | Export and recovery metadata |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-08-01 | Tampering / Elevation of Privilege | Path and selector rendering | accept | Planned Vue interpolation and safe text rendering control accepted without a separate security audit. | closed |
| T-08-02 | Tampering | Responsive control tree | accept | Planned single-DOM-path and unchanged-handler control accepted without a separate security audit. | closed |
| T-08-03 | Spoofing / Repudiation | Clipped actions and Base/Head provenance | accept | Planned document-fit, provenance, drawer, and local-scroll controls accepted without a separate security audit. | closed |
| T-08-04 | Denial of Service | Diff viewport and Monaco layout | accept | Planned bounded-canvas and geometry controls accepted without a separate security audit. | closed |
| T-08-05 | Spoofing | Low-contrast or color-only state | accept | Planned rendered-contrast and non-color state controls accepted without a separate security audit. | closed |
| T-08-06 | Denial of Service / Repudiation | Keyboard focus and destructive confirmations | accept | Planned focus-perimeter, action-visibility, and focus-return controls accepted without a separate security audit. | closed |
| T-08-07 | Tampering | Forced-color author override | accept | Planned system-color, non-color provenance, and no-opt-out controls accepted without a separate security audit. | closed |
| T-08-08 | Tampering / Elevation of Privilege | Untrusted text rendering | accept | Planned Vue interpolation and no-test-hook controls accepted without a separate security audit. | closed |
| T-08-09 | Information Disclosure | Responsive test fixtures | accept | Planned repository-relative display and unchanged loopback-response controls accepted without a separate security audit. | closed |
| T-08-10 | Spoofing / Repudiation | Incomplete accessibility evidence | accept | Planned width, zoom, grayscale, forced-color, focus, and contrast evidence controls accepted through completed UAT without a separate security audit. | closed |
| T-08-11 | Tampering | Duplicate responsive mutation/export path | accept | Planned single-tree, intentional-publication, and unchanged contract controls accepted without a separate security audit. | closed |
| T-08-12 | Denial of Service | Hidden destructive or recovery controls | accept | Planned focus-inventory, geometry, drawer, confirmation, Escape, and focus-return controls accepted through completed UAT without a separate security audit. | closed |
| T-08-13 | Information Disclosure / Elevation of Privilege | Recovery/export values and browser authority | accept | Planned relative display, safe clipboard/reveal, read-only, and consent controls accepted without a separate security audit. | closed |
| T-08-14 | Tampering | Weakened regression assertions | accept | Planned unchanged behavioral authority suites accepted without a separate security audit. | closed |
| T-08-SC | Tampering / Information Disclosure | Package and asset supply chain | accept | No package, lockfile, registry, font, icon, remote asset, or external service contribution occurred. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-08-01 | T-08-01 | User chose to accept all unaudited Phase 08 threats rather than run the security auditor. | User via security gate | 2026-07-29 |
| AR-08-02 | T-08-02 | User chose to accept all unaudited Phase 08 threats rather than run the security auditor. | User via security gate | 2026-07-29 |
| AR-08-03 | T-08-03 | User chose to accept all unaudited Phase 08 threats rather than run the security auditor. | User via security gate | 2026-07-29 |
| AR-08-04 | T-08-04 | User chose to accept all unaudited Phase 08 threats rather than run the security auditor. | User via security gate | 2026-07-29 |
| AR-08-05 | T-08-05 | User chose to accept all unaudited Phase 08 threats rather than run the security auditor. | User via security gate | 2026-07-29 |
| AR-08-06 | T-08-06 | User chose to accept all unaudited Phase 08 threats rather than run the security auditor. | User via security gate | 2026-07-29 |
| AR-08-07 | T-08-07 | User chose to accept all unaudited Phase 08 threats rather than run the security auditor. | User via security gate | 2026-07-29 |
| AR-08-08 | T-08-08 | User chose to accept all unaudited Phase 08 threats rather than run the security auditor. | User via security gate | 2026-07-29 |
| AR-08-09 | T-08-09 | User chose to accept all unaudited Phase 08 threats rather than run the security auditor. | User via security gate | 2026-07-29 |
| AR-08-10 | T-08-10 | User chose to accept all unaudited Phase 08 threats; completed UAT records the associated accessibility evidence gate as passed. | User via security gate | 2026-07-29 |
| AR-08-11 | T-08-11 | User chose to accept all unaudited Phase 08 threats rather than run the security auditor. | User via security gate | 2026-07-29 |
| AR-08-12 | T-08-12 | User chose to accept all unaudited Phase 08 threats; completed UAT records the associated focus and zoom gates as passed. | User via security gate | 2026-07-29 |
| AR-08-13 | T-08-13 | User chose to accept all unaudited Phase 08 threats rather than run the security auditor. | User via security gate | 2026-07-29 |
| AR-08-14 | T-08-14 | User chose to accept all unaudited Phase 08 threats rather than run the security auditor. | User via security gate | 2026-07-29 |
| AR-08-SC | T-08-SC | Phase 08 introduced no package, lockfile, registry, remote asset, or external-service change. | Phase 08 plan | 2026-07-29 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-29 | 15 | 15 | 0 | GSD secure-phase; risks accepted by user |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-29
