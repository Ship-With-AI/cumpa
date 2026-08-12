# Phase 01: Voluntary Stripe Support Payment and Email Recovery - Discussion Log

> **Audit trail only.** Do not use as input for planning, research, or execution agents.
> Decisions are captured in `01-CONTEXT.md`.

**Discussed:** 2026-08-12

## Prompt experience

| Question | Options presented | Selection |
|---|---|---|
| When during an unpaid launch should the support dialog appear? | After workspace loads; After a short delay; Before workspace access | After workspace loads |
| What should be the dialog’s primary action hierarchy? | Support primary; Support and restore equal; Neutral choices | Support primary |
| After “Not now,” should the dialog stay gone for the rest of that running Cumpa session? | Yes, session-only; Reopen from UI only; Reopen later automatically | Yes, session-only |
| How much explanation should the dialog contain? | Compact and candid; Personal appeal; Minimal | Compact and candid |

## Checkout handoff

| Question | Options presented | Selection |
|---|---|---|
| How should Stripe Checkout open from the support dialog? | New browser tab; Same tab; External default browser | New browser tab |
| What should remain visible in Cumpa while Checkout is open? | Dialog waiting state; Close dialog; Manual confirmation action | Dialog waiting state |
| After verified payment, how should Cumpa acknowledge success before closing the dialog? | Brief thank-you; Close immediately; Require Done | Brief thank-you |
| If Checkout is canceled, left open, or confirmation is delayed, how should the waiting state behave? | Stay usable and cancellable; Time out as failure; Poll only while open | Stay usable and cancellable |

## Supporter identity

| Question | Options presented | Selection |
|---|---|---|
| After payment, should the workspace visibly show supporter status? | No persistent badge; Subtle supporter badge; Thank-you entry only | No persistent badge |
| What supporter information should a verified installation retain and expose locally? | Status only; Masked email; Full email | Status only |
| Should one verified payment suppress prompts only in the current repository, or across all Cumpa repositories on this machine? | Machine-wide; Repository-local; Machine-wide with repo fallback | Machine-wide |
| Without a persistent badge, where should users inspect support status or start recovery later? | Support item in app menu; Dialog only; CLI command | Support item in app menu |

## Areas Not Selected

- Recovery journey — left to standard privacy-safe implementation within REC-01 through REC-03.

## Deferred Ideas

None.

## Claude's Discretion

- Exact dialog presentation, copy, polling cadence, menu placement, and thank-you duration.
- Recovery journey implementation details consistent with the locked requirements.
