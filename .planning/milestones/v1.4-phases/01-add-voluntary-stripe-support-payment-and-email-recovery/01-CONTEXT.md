# Phase 01: Voluntary Stripe Support Payment and Email Recovery - Context

**Gathered:** 2026-08-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Add one optional USD $49.99 Stripe-hosted support payment, a dismissible launch-time support dialog, webhook-verified machine-wide supporter status, and privacy-safe email magic-link recovery on additional installations. Payment changes only automatic support-dialog visibility; all review features remain available without payment.

</domain>

<decisions>
## Implementation Decisions

### Prompt experience
- **D-01:** For unpaid users, open the support dialog after the review workspace has loaded rather than before workspace access or after a timer.
- **D-02:** Make “Support Cumpa — $49.99” the primary action. “Restore support” and “Not now” are secondary.
- **D-03:** “Not now” dismisses the dialog for the remainder of the running Cumpa session. It appears again on the next unpaid launch and never reopens automatically during the current session.
- **D-04:** Copy is compact and candid: Cumpa remains fully usable, the payment supports development, and paying once stops the launch prompt.

### Checkout handoff
- **D-05:** Open Stripe Checkout in a new browser tab, leaving the local Cumpa workspace and support dialog open.
- **D-06:** After Checkout opens, keep the dialog in a cancellable “Waiting for confirmation…” state. Do not require an “I’ve paid” action.
- **D-07:** Only verified fulfillment transitions the dialog to a brief thank-you state; close it automatically after roughly 1–2 seconds.
- **D-08:** Cancellation, an abandoned Checkout tab, or delayed webhook delivery must not be labeled as payment failure. The user can close the waiting dialog and keep working. Late verified fulfillment still persists and suppresses future prompts.

### Supporter identity
- **D-09:** Do not add a persistent supporter badge to the review workspace.
- **D-10:** Persist and expose supporter status only. Do not retain or display the payer email locally; recovery asks for the email again.
- **D-11:** Verified status is machine-wide across all repositories, not repository-local `.cumpa/` state.
- **D-12:** Provide a quiet “Support Cumpa” app-menu entry that opens on-demand status, payment, and recovery UI without occupying the review surface.

### Claude's Discretion
- Exact dialog dimensions, wording, illustration use, polling cadence, menu placement, and the precise thank-you duration, provided the locked hierarchy and behavior above remain intact.
- Recovery journey details not discussed here remain open to standard privacy-safe approaches constrained by REC-01 through REC-03.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and phase scope
- `.planning/REQUIREMENTS.md` — Locked payment, support-dialog, security, and email-recovery requirements PAY-01–04, SUP-01–05, and REC-01–03.
- `.planning/PROJECT.md` — Cumpa product boundary, local-first review value, runtime constraints, and established project decisions.
- `.planning/ROADMAP.md` — Current milestone and Phase 01 placement.

### Validated implementation findings
- `.kimi-code/skills/spike-findings-cumpa/SKILL.md` — Existing Cumpa implementation constraints and validated patterns; payment-specific behavior is not covered.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/web/components/IdentityPanel.vue` and its `App.vue` integration provide an existing accessible modal pattern with focus management and inert background behavior.
- `src/server/app.ts` already provides atomic local JSON persistence primitives used by draft storage.
- `src/contracts/api.ts` and `src/server/routes.ts` establish shared Zod contracts and strict Fastify route validation.
- `src/cli/run.ts` already owns local server startup, loopback binding, session-token creation, and browser opening.

### Established Patterns
- Browser-to-local-server requests use authenticated localhost APIs rather than browser-only authority.
- Persistent JSON writes use explicit validation and atomic replacement; corrupt or incompatible state fails explicitly.
- The review workspace keeps transient UI state in Vue while server capabilities remain authoritative for durable state.

### Integration Points
- Launch-time support status must enter the existing session app construction and `/api` capability boundary without weakening current loopback/session-token protections.
- The support dialog belongs at the root `src/web/App.vue` workspace layer, reusing established modal accessibility behavior.
- Machine-wide supporter status requires user-level storage separate from repository-local `.cumpa/` drafts.
- Stripe secrets, webhook verification, email delivery, and payment identity require a hosted service boundary; no secret may enter the published Cumpa package.

</code_context>

<specifics>
## Specific Ideas

- The support invitation should feel candid rather than gated: the ready review workspace remains visible behind it, dismissal is immediate, and functionality is never restricted.
- Successful payment feedback is a brief automatic thank-you, not a permanent badge or additional acknowledgement step.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-add-voluntary-stripe-support-payment-and-email-recovery*
*Context gathered: 2026-08-12*
