# Cumpa

## What This Is

Cumpa is a local-first code review application for developers who want a GitHub pull-request-style review experience without publishing branches or worktrees to a remote host. A CLI launched inside a Git repository opens a browser workspace where the developer selects two local branches or registered worktrees, reviews PR-style changes side by side, leaves line comments and an overall summary, and exports the result as Markdown plus canonical JSON that a coding agent can apply.

## Core Value

A developer can accurately review repository-grounded changes chosen by a developer or coding agent and return precise, drift-detectable feedback the agent can act on.

## Current State

**Shipped:** v1.4 Voluntary Support on 2026-09-04.

Cumpa now offers an optional one-time USD $49.99 support flow in configured release packages without gating review behavior. The local app hands Support or Restore actions to a canonical Supabase-hosted GitHub OAuth flow; only a signature-verified Stripe webhook can establish paid status. Verified status persists installation-wide and a paid GitHub account can restore suppression on unlimited installations. Ordinary unconfigured local builds contain no hosted capability, provider credential, or support route.

## Current Milestone: v1.5 MIT Distribution

**Goal:** Let users install and run MIT-licensed Cumpa from public npm and install its public ShipWithAI skill, with the existing Cumpa source repository and reviewed history publicly available under the same standard MIT license.

**Decision authority:** 2026-09-08 quick task `260908-d25` supersedes the 2026-09-07 proprietary source-available direction. The standard MIT license permits commercial use, modification, redistribution, sublicensing, and resale; third-party rights and notices remain unchanged. Repository and registry publication remain gated on rights/sensitive-history review and refreshed exact-text MIT assent from both licensors; this milestone definition does not change visibility.

**Target features:**
- Publish MIT-licensed `@shipwithai/cumpa@1.5.0` for global installation and exact-version `npx` execution.
- Package required compiled runtime and browser assets while excluding TypeScript source, source maps, tests, planning files, and Git history.
- Publish from the approved public repository through npm trusted publishing without a long-lived npm token; preserve eligible automatic provenance and make only verified release claims.
- Publish the existing thin Cumpa coding-agent skill publicly under the ShipWithAI marketplace with an independent MIT license.
- Declare the separately installed public CLI prerequisite and keep all review authority in the CLI.
- Verify clean global, npx, and marketplace-installed browser-review flows against released artifacts.
- Publish the existing `Ship-With-AI/cumpa` repository and reviewed history after the approval gates, and use its public Issues page without creating a separate homepage.


<details>
<summary>v1.4 Voluntary Support (shipped)</summary>

**Goal:** Add voluntary payment and privacy-safe recovery without changing access to any review feature.

**Delivered features:**
- Added one optional Stripe-hosted USD $49.99 support payment.
- Kept payment feature-neutral: dismissing or declining support leaves every review capability available.
- Used private Supabase tables and service-role RPCs behind GitHub OAuth and three Edge Functions.
- Made raw-body signature-verified Stripe webhook fulfillment the only paid-status authority.
- Persisted monotonic verified status locally and restored it to unlimited installations through one-use installation-bound OAuth intents.
- Shipped support only in the canonical configured release package; ordinary local builds remain support-free.

</details>
<details>
<summary>v1.3 Agent Review Handoff (shipped)</summary>

**Goal:** Let a coding agent submit an exact, repository-grounded review request, wait while the developer reviews it in Cumpa, and receive canonical JSON feedback on completion.

**Delivered features:**
- Accepted a versioned review request on CLI stdin without changing the existing interactive launch flow.
- Grounded contiguous Git ranges with native pathspec filters and exact already-applied patches against repository-backed bytes.
- Reused the normal browser review workspace for human review.
- Finished attached sessions explicitly and emitted one canonical JSON response to the waiting coding agent.

</details>

<details>
<summary>v1.2 milestone intent</summary>

**Goal:** Make the ordered source picker interactive quickly and keep branch search scalable in repositories with 10,000 local branches.

**Delivered features:**
- Exposed the attached current branch and registered worktrees before complete local-branch enumeration.
- Added case-insensitive literal local-branch search on non-empty picker input.
- Batched branch metadata and abbreviation work through bounded native-Git protocols.
- Verified the compiled production path with exactly 10,000 packed local refs: readiness median 221.532417 ms and search median 38.266167 ms.
- Preserved correct identity, ordering, worktree state, cancellation, recovery, and failure behavior without mutating refs.

</details>
## Requirements

### Validated

- [x] User can launch the application from a Git repository through a CLI that opens a loopback-only browser session.
- [x] User can interactively select an ordered base and head from local branches and registered worktrees.
- [x] User can review merge-base-to-head changes in a GitHub-like side-by-side text diff with changed-file navigation and expandable context.
- [x] User can create, edit, delete, and resolve comments on any visible line on either side of a diff.
- [x] User can write an overall review summary while the review remains an editable repository-local draft.
- [x] User can export a completed review as readable Markdown and versioned JSON containing stable Git identities and context anchors for an applying agent.

Validated in Phase 01: Pinned Local Comparison.

Validated in Phase 02: Anchored Diff Review.

Validated in Phase 03: Complete Review Draft.

Validated in Phase 04: Agent-Ready Export.

Phase 04.1 closed the audited CMT-01 async cross-file settlement gap without changing the validated product scope.

Validated in Phase 05: Semantic Dark Foundation established the dark semantic palette, typography, interaction-state, surface, and responsive foundation; Monaco diff semantics and later review-surface adaptation remain active.
Validated in Phase 06: Monaco Diff Semantics coordinated editor, syntax, diff, gutter, selection, comment-anchor, and focus layers while preserving Monaco as diff authority.

Validated in Phase 07: GitHub-Familiar Review Surfaces adapted the file header, controls, inline conversations, review rail, recovery, notices, and export feedback without changing review mechanics.

Validated in Phase 08: Accessible Responsive Continuity completed the GitHub-dark workspace adaptation with composited WCAG contrast, durable focus and forced-color cues, localized side-by-side diff overflow, responsive reflow through true 400% zoom, and unchanged review/export behavior.

The final v1.1 clarity pass compacted the changed-files sidebar, made removed/added semantics explicit, strengthened diff fills, preserved Monaco positioning under the production CSP, and recorded the shipped product and visual contracts.

Validated in Phase 09: Immediate Source Picker exposed the attached current branch and truthful registered worktrees before complete local-branch enumeration.

Validated in Phase 10: On-Demand Branch Search added fresh case-insensitive literal local-head search through bounded native-Git protocols.

Validated in Phase 11: Production Performance Gate proved the compiled picker path within fixed readiness and search budgets against exactly 10,000 packed local refs.

Validated in Phase 12: Request Protocol & Range Grounding accepts one strict, bounded versioned stdin range request while preserving TTY launch; native Git pins range commits and ordered pathspec scope through the browser session, draft identity, and V2 export.

Validated in Phase 13: Exact Patch Grounding accepts a strict exact already-applied patch, proves repository-object preimages and target postimages, preserves a frozen snapshot with explicit drift, and emits canonical V3 patch export provenance without modifying Git state.

Validated in v1.4 Voluntary Support:

- [x] One optional one-time USD $49.99 Stripe-hosted support payment.
- [x] Payment changes no feature except support-dialog visibility.
- [x] Only signature-verified server webhook fulfillment proves payment.
- [x] The local app contains no Stripe or webhook secret and accepts only the configured canonical Supabase origin.
- [x] The configured production package shows the support dialog until verification.
- [x] The dialog describes optional support and links to fixed Stripe Checkout.
- [x] Unpaid users can dismiss the dialog and retain unrestricted application use.
- [x] Successful verification produces a thank-you state and automatic close.
- [x] Verified status suppresses future prompts installation-wide.
- [x] Additional installations restore paid status through GitHub OAuth.
- [x] Recovery uses a privacy-safe, one-use, installation-bound OAuth intent and returns no OAuth material locally.
- [x] One paid account can restore unlimited installations.

### Active

- [ ] Users can install MIT-licensed `@shipwithai/cumpa@1.5.0` globally to obtain the `cumpa` command or run it through `npx @shipwithai/cumpa@1.5.0`.
- [ ] Maintainers can publish approved releases from the public repository through npm trusted publishing without a long-lived token, retaining eligible automatic provenance and verifying any attestation claims.
- [ ] Public npm packages contain only required compiled runtime and browser assets plus accurate MIT license and package metadata.
- [ ] Cumpa's existing repository, source, and reviewed history become public under standard MIT only after refreshed exact-text MIT assent from both licensors and rights and sensitive-material review; npm artifacts still exclude source, source maps, tests, planning files, and Git data.
- [ ] Coding-agent users can install the existing public MIT-licensed Cumpa skill through ShipWithAI and follow its declared CLI prerequisite.
- [ ] Clean global, npx, and marketplace installation paths complete the existing browser-review workflow against released artifacts.

### Out of Scope

- Automatic review of staged, unstaged, or untracked worktree state — v1.3 accepts only an exact agent-supplied patch proven against repository/worktree content; Cumpa does not discover or synthesize a working-tree diff.
- Hosting reviews remotely or supporting multiple simultaneous reviewers — the product is a single-developer local tool.
- Posting reviews to GitHub, GitLab, or another forge — export files are the integration boundary for v1.
- Applying requested changes from inside the application — a separate coding agent consumes the export.
- Image, notebook, document, or binary diff rendering — v1 reviews text; unsupported files are identified but not rendered inline.
- Full GitHub review mechanics such as replies, suggestion patches, approvals, and pending-review submission — v1 provides line comments, resolution, and an overall summary.
- Publishing credentials, confidential operational material, or content without publication rights — public-source release requires review of tracked content and history; destructive remediation needs separate approval.
- Shipping TypeScript source, source maps, tests, planning files, or repository history in npm artifacts — consumers receive the compiled runtime-only distribution.

## Context

Cumpa has shipped five milestones: the complete local browser-review-to-agent loop, a GitHub-dark accessible review workspace, scalable local source discovery, strict agent review handoff, and optional voluntary support.

Each comparison remains ordered and frozen to full commit IDs. The displayed change is the merge base of those commits compared with the selected head; selected worktrees resolve to committed `HEAD` values and dirty bytes never enter the review.

The browser workspace provides an exact changed-file tree, Monaco side-by-side text diffs, expandable context, keyboard navigation, durable line comments, review summary and comment lifecycle, conflict recovery, selector-drift reporting, and explicit unsupported, stale, and orphaned states.

Exports are versioned and machine-validated. Canonical JSON owns comparison identities, accepted summary and comments, timestamps, blob identities, and context anchors; Markdown is derived from that validated model. Publication is an atomic pair beneath `.cumpa/exports/`, with hashes and a bounded receipt.

Coding agents can submit strict range or exact-patch review requests and receive one validated canonical result after the developer finishes the normal browser review. Interactive TTY review remains unchanged.

v1.4 shipped 12/12 requirements across two phases, 22 plans, and 30 tasks. Its audit verified 8/8 cross-phase connections and 8/8 end-to-end flows. The active hosted implementation is a Supabase private schema plus three Edge Functions; GitHub OAuth binds support or restoration intent, while signature-verified Stripe webhook fulfillment alone establishes paid status.

Accepted v1.4 debt is bounded to a stale deleted-suite filename in the deployment verifier contract and one unused local support-status endpoint/client wrapper. Neither affects the verified release flow.
## Constraints

- **Runtime**: Node.js 24 LTS with TypeScript end to end — one language across CLI, server, shared contracts, and UI, using the current supported LTS baseline.
- **Git semantics**: Invoke the installed Git CLI as the source of truth — merge bases, refs, worktrees, renames, diff metadata, and blobs must match Git behavior.
- **CLI**: Commander with an Inquirer-based searchable selector — launch is interactive and ordered base/head selection is explicit.
- **Server**: Fastify bound only to `127.0.0.1` on an ephemeral port — the default browser opens automatically and no LAN service is exposed.
- **UI**: Vue 3 with Vite and Monaco Diff Editor — side-by-side diff rendering, line mapping, syntax highlighting, and inline review controls run in the browser.
- **Contracts**: Zod schemas shared by API, draft persistence, and export generation — incompatible or corrupt data fails explicitly.
- **Persistence**: Versioned JSON files in a gitignored repository-local `.cumpa/` directory — no database or browser-only source of truth.
- **Content**: Text files only in v1 — binary, generated, oversized, or unsupported files remain visible as non-reviewable entries.
- **Testing**: Vitest for Git, diff, persistence, and export contracts; Playwright for the browser review flow.
- **Support**: Voluntary support never gates review features; hosted payment authority is optional, credential-free from the local app, and enabled only in the canonical configured release package.
- **Distribution**: Publish the existing `Ship-With-AI/cumpa` repository and reviewed history only after approval gates; ship MIT-licensed `@shipwithai/cumpa@1.5.0` as a compiled-runtime-only npm package exposing `cumpa`. Trusted publishing uses GitHub OIDC without a long-lived token and preserves eligible automatic provenance.
- **Licensing**: Cumpa source and compiled releases use the standard MIT license with copyright retained by Alessandro Magionami & Manuel Salvatore Martone. MIT permits commercial use, modification, redistribution, sublicensing, and resale without bespoke permission conditions; third-party rights and notices remain in force. Both licensors must give refreshed assent to the exact MIT text before publication. Voluntary support remains feature-neutral.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use PR-style merge-base-to-head comparison | Match the mental model and visible change set of hosted pull-request reviews | Good — native-Git fixtures verify frozen merge-base-to-head semantics across branch/worktree orderings |
| Resolve branches and worktrees to committed Git objects | Produce stable, reproducible comparisons and exclude ambiguous dirty state | Good — sessions, drafts, anchors, and exports remain pinned while selectors drift |
| Use the installed Git CLI rather than a Git library | Preserve native Git behavior for merge bases, worktrees, renames, blobs, and diff metadata | Good — byte-safe native protocols cover discovery, inventory, availability, and object reads |
| Use TypeScript, Node.js, Fastify, Vue 3, Vite, and Monaco | Keep shared contracts in one language while supporting a capable browser diff workspace | Good — one packaged runtime serves strict shared contracts and the real browser workspace |
| Store drafts as repository-local versioned JSON | Keep reviews resumable, portable within the local repository, and independent of browser storage | Good — comparison-keyed atomic drafts survive relaunch and fail explicitly on corruption or newer schemas |
| Export canonical JSON plus generated Markdown | Give agents a strict contract and humans a readable review artifact | Good — canonical bytes and reparse-derived Markdown publish together with hashes and receipts |
| Keep v1 local and single-user | Focus effort on accurate comparison, commenting, persistence, and export rather than hosting or collaboration | Good — the loopback-only capability model delivered the full v1 workflow without remote infrastructure |
| Use opaque file IDs and fixed capability routes | Prevent browser paths, refs, and object IDs from becoming repository authority | Good — all API operations are authenticated and path-safe; one unused metadata operation remains cleanup debt |
| Accept only server-returned canonical draft state | Prevent client-synthesized persistence and silent concurrent overwrite | Good — atomic CAS, typed conflicts, and accepted-result ordering cover every review mutation |
| Keep durable anchors immutable and classify mismatch instead of relocating | Preserve drift-detectable feedback for applying agents | Good — stale and orphaned records retain exact recorded evidence and never move silently |
| Verify release behavior at the generated-package boundary | Test the same CLI, server, browser assets, Git objects, and export bytes users receive | Good — final configured Playwright suite passes 56/56 |
| Correlate asynchronous comment settlement to controller, file, request, and originating revision | Prevent late results from mutating the active or replacement composer | Good — Phase 04.1 closed the audit gap across success, failure, conflict, replacement, and repeated announcements |
| Use one stable typed Monaco theme mapped byte-for-byte to the canonical semantic CSS root | Prevent editor colors from drifting from the surrounding dark workspace or changing across applications | Good — focused parity, build, semantic CSS, and first-frame browser checks pass |
| Derive Base/Head cues only from public `ILineChange` ranges and fixed side classes | Preserve Monaco as diff authority while preventing repository text, phantom empty-side signs, or unbounded decorations from entering presentation | Good — bounded pure-transform tests and real Chromium signs/bars pass |
| Keep diff, selection, anchor, and focus semantics in independent replacement collections | Ensure overlapping review cues coexist without model mutation, listener growth, or composer interference | Good — lifecycle, restoration, overlap, and production geometry checks pass |
| Keep Phase 07 presentation derived from existing session, review, export, recovery, and selector state | Prevent a visual adaptation from creating a second behavior, persistence, or filesystem authority | Good — all five roadmap criteria and 42/42 plan must-haves passed goal verification |
| Resize accepted and composing inline cards through one post-render paired-zone helper | Keep Base/Head Monaco zones equal while long accepted content remains contained without changing adapter or anchor authority | Good — production Chromium proves long-card containment and following-code separation |
| Give each dynamic recovery and selector-copy outcome one authoritative live-region owner | Prevent duplicate assistive announcements while retaining visible feedback, actions, and focus behavior | Good — focused browser checks count exactly one owner after each real state transition |
| Keep responsive visual placement separate from semantic source order | Preserve file → Base → Head reading order while matching the desktop composition and narrow reflow | Good — exact-width and keyboard browser evidence passed without duplicate controls or state paths |
| Keep the 640px side-by-side comparison floor inside one localized viewport | Prevent page-wide overflow without reflowing Monaco or changing Base/Head geometry | Good — 320px and true 400% zoom evidence retained a 640px locally scrollable canvas with document fit |
| Measure composited rendered contrast and focus geometry against actual browser states | Token-only checks cannot prove translucent diff, selection, status, or clipping behavior | Good — completed UAT accepted the full contrast, focus-inventory, and true-zoom gates |
| Keep the review sidebar at 288px and compact rows within it | Preserve diff space while keeping status, path, counts, and exceptional availability readable | Good — wide and narrow browser evidence shows contained rows without page overflow |
| Pair Base/Head identity with explicit removed/added text, signed gutters, and structural bars | Make diff meaning clear without relying on red and green | Good — stronger line/intraline fills and CSP-safe Monaco positioning passed focused browser and theme checks |
| Record shipped product facts and visual rules in root contracts | Prevent future copy and styling work from inventing a second product or design language | Good — final designer checks report no contract, display-scale, numeric-claim, or contact-detail blockers |

| Freeze eager source discovery before deferred branch search | Make the picker usable without enumerating every local branch while retaining a stable initial authority | Good — the attached branch and registered worktrees render immediately; fresh branch results arrive only for non-empty input |
| Share one prompt-lifetime exact-ID registry across Base and Head selection | Keep eager, lazy, and recovered candidates unambiguous across ordered selection | Good — abort-safe lazy results and descriptor recovery preserve exact source identity |
| Use bounded native-Git protocols for literal local-head search and metadata | Avoid a persistent index and one subprocess per branch while retaining Git semantics | Good — strict protocol validation and batched abbreviation pass real-Git coverage |
| Gate discovery performance through the compiled production binary | Prevent injected seams or spike-only measurements from claiming release budgets | Good — the packed-10,000-ref gate passes fixed 400 ms readiness and 500 ms search medians |
| Accept only one bounded strict V1 stdin range request | Keep agent launch deterministic while preserving the established interactive CLI path | Good — malformed, oversized, ambiguous, or unsupported requests fail before browser launch; TTY remains interactive |
| Pin range revisions and native pathspecs once | Prevent selector drift or browser-authored scope from changing agent review provenance | Good — session, draft identity, and V2 exports use the same immutable Git-authoritative scope |
| Ground exact patches from repository preimages and target bytes | Ensure an agent-submitted patch describes implemented repository content without invoking a mutating Git apply path | Good — immutable snapshot sessions preserve exact bytes and expose source drift explicitly |
| Keep exact-patch snapshots private and server-owned | Prevent live-source fallback or shared mutable state from changing reviewed content | Good — frozen V3 provenance, readable drift handling, and snapshot-loss failure stay explicit |
| Make attached Finish server-authoritative and one-shot | Only an accepted revision may trigger canonical delivery; browser lifecycle events must not imply success | Good — authenticated Finish validates scope and anchors before exactly one stdout result |
| Give every attached launch an isolated mutable storage scope | Equivalent agent requests must not share drafts or export receipts | Good — deterministic provenance remains shared only where intended while drafts, queues, and exports cannot collide |
| Keep voluntary support feature-neutral | Payment must never become a license or access gate | Good — dismissing the prompt preserves unrestricted review and only verified status changes prompt visibility |
| Use Supabase private schema, service-role RPCs, and Edge Functions for hosted support | Replace the blocked standalone Render/PostgreSQL/Resend service with one managed authority boundary | Good — the standalone runtime and email recovery path were removed after live promotion |
| Let only a signature-verified Stripe webhook establish payment | Browser redirects and OAuth completion cannot prove settlement | Good — exact product, amount, currency, mode, and replay invariants precede idempotent fulfillment |
| Restore support through one-use installation-bound GitHub OAuth intents | Avoid retaining or returning email, OAuth tokens, or profile material in the local app | Good — paid accounts restore unlimited installations while unpaid restoration remains non-enumerating |
| Embed one canonical Supabase origin only in configured release packages | Keep ordinary local builds free of hosted capability and prevent arbitrary support origins | Good — package scans and immutable release evidence bind the approved origin and package digest |
| Publish the existing repository and reviewed history under standard MIT | Make source and compiled releases available for commercial reuse, modification, redistribution, sublicensing, and resale while retaining third-party rights and notices | Pending — 2026-09-08 quick task `260908-d25` supersedes the 2026-09-07 proprietary direction; refreshed exact-text MIT assent from both licensors and rights/sensitive-history review must precede visibility change |
| Keep marketplace skill public under MIT | Preserve ShipWithAI's thin permissive installation and delegation layer while the separately installed Cumpa CLI remains the review authority | Pending — marketplace skill delegates all review authority to a compatible released CLI |
| Require both Alessandro Magionami and Manuel Salvatore Martone to approve the exact MIT text before publication | Keep publication of the mutually licensed work under both named licensors' authority without conditioning downstream MIT grants | Pending — proprietary approvals are historical and do not approve MIT bytes |
| Preserve eligible automatic npm provenance from the public repository | Replace the superseded private-source prohibition with truthful, evidence-backed release claims | Pending — public visibility and actual publication/attestation evidence must be verified |
## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? Move them to Out of Scope with a reason.
2. Requirements validated? Move them to Validated with a phase reference.
3. New requirements emerged? Add them to Active.
4. Decisions to log? Add them to Key Decisions.
5. Is “What This Is” still accurate? Update it if reality drifted.

**After each milestone:**
1. Review every section.
2. Confirm Core Value is still the right priority.
3. Audit Out of Scope and its reasons.
4. Update Context with the current product state and feedback.

---
*Last updated: 2026-09-08 after quick task 260908-d25 superseded the 2026-09-07 proprietary source-available distribution direction with MIT Distribution*
