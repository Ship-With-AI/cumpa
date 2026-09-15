---
phase: 06
slug: monaco-diff-semantics
status: verified
threats_open: 0
asvs_level: 1
created: 2026-07-27
---

# Phase 06 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Canonical CSS root → typed Monaco theme | Semantic values must not drift or invert review meaning. | Local palette and token-role values |
| Local source → Vite-emitted CSS | Build transformation must preserve the exact semantic allowlist. | Authored and generated CSS |
| Dependency graph → browser bundle | Monaco and Playwright remain local, pinned dependencies. | Installed package code |
| Monaco `ILineChange` → decoration ranges | Public numeric ranges become bounded, side-correct visual cues. | Diff metadata and line numbers |
| Closed `DiffSide` → CSS classes | Only fixed Base/Head identities may enter selectors. | Closed enum values |
| Repository text → Monaco models | Untrusted repository bytes remain read-only text, never executable markup or selectors. | Repository-controlled file text |
| Monaco events → visual classes | Selection and diff events may update fixed decorations without growing listeners or models. | Numeric ranges and editor state |
| Pinned Monaco DOM → global CSS hooks | Version-specific hooks require browser guards when relied upon for meaning. | Monaco 0.55.1 DOM classes |
| Visual semantics → reviewer decision | Addition, deletion, anchor, and focus cues must not spoof review meaning. | Rendered review state |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-06-01 | Tampering | `theme.ts` semantic mapping | mitigate | Typed exact theme map; root-byte parity unit tests; source/generated semantic CSS audit passed. | closed |
| T-06-02 | Information Disclosure | Theme/font/icon sourcing | mitigate | Local literal theme data only; remote import/URL forms rejected by semantic CSS audit; no network or telemetry path found. | closed |
| T-06-03 | Spoofing | Theme identity/registration | mitigate | Stable `diff-review-dark`; unit test proves `defineTheme` precedes `setTheme` without generated IDs or fallback. | closed |
| T-06-04 | Tampering | Diff range normalization | mitigate | Empty ranges rejected, populated ranges clamped and deterministically coalesced; focused boundary tests passed. | closed |
| T-06-05 | Elevation of Privilege | Decoration content path | mitigate | Numeric ranges and fixed classes only; no HTML, dynamic selector, widget content, pointer handler, role, or tab stop path. | closed |
| T-06-06 | Denial of Service | Repeated/overlapping changes | mitigate | One sort/coalesce pass with bounded bar and endpoint sign output; sparse-marker tests passed. | closed |
| T-06-07 | Tampering | Repository text rendering | mitigate | Read-only immutable Monaco models; no mutation APIs; exact-text and rejected-edit Chromium assertions passed. | closed |
| T-06-08 | Spoofing | Addition/deletion/anchor/focus cues | accept | Representative signs, bars, labels, selection, focus, anchor, and no-reflow checks pass; full seven-state, grayscale, and source-over threshold loops remain unautomated. Risk accepted by user. | closed |
| T-06-09 | Denial of Service | Listener/decoration/model lifecycle | mitigate | Concern-owned collections replaced with `.set()` and cleared on disposal; 17-listener, two-model, zone, composer, and ten-recompute bounds passed. | closed |
| T-06-10 | Information Disclosure | Assets/theme/runtime | mitigate | No remote URL, network client, telemetry, or dynamic asset path in Phase 06 sources; local build and CSS audit passed. | closed |
| T-06-11 | Tampering | Pinned Monaco DOM hooks | accept | Monaco 0.55.1 pin confirmed; selected-text and diagonal-fill computed effects covered; hidden-region center/top/bottom computed-style guard remains unautomated. Risk accepted by user. | closed |
| T-06-SC | Tampering | npm supply chain | accept | No dependency range, install, upgrade, or lockfile graph change; Monaco remains pinned at 0.55.1. The added `typecheck:web` script is not a dependency-graph change. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-06-01 | T-06-08 | Existing focused Chromium coverage and manual UAT passed, but the complete seven-state, grayscale, and source-over contrast matrix is not automated. | User via `/gsd:verify-work 06` | 2026-07-27 |
| AR-06-02 | T-06-11 | Monaco is pinned and representative hooks are browser-guarded, but hidden-region center/top/bottom computed styles lack a focused assertion. | User via `/gsd:verify-work 06` | 2026-07-27 |
| AR-06-03 | T-06-SC | Phase 06 made no dependency or lockfile graph change; residual risk remains in the already-pinned local dependency set. | Phase 06 plan | 2026-07-27 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-27 | 12 | 12 | 0 | `gsd-security-auditor` plus user risk disposition |

Focused verification passed: 8 unit tests, the web build, semantic CSS source/generated audit, and 22 focused Chromium tests. `npm ls monaco-editor --depth=0` confirmed `monaco-editor@0.55.1`.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-27
