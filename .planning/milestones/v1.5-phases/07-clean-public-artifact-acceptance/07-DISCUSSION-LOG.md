# Phase 7: Clean Public-Artifact Acceptance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-11
**Phase:** 07-clean-public-artifact-acceptance
**Areas discussed:** Clean-environment coverage, Marketplace agent proof, Verified-support proof, Review walkthrough

---

## Area selection

**Question:** Which areas should we discuss for Phase 7: Clean Public-Artifact Acceptance?

| Option | Description | Selected |
|--------|-------------|----------|
| Clean-environment coverage | Isolated local environments or a fresh machine/VM; environment boundary and platform evidence. | Yes |
| Marketplace agent proof | Clean agent profile demonstrating installation, invocation, Finish, and canonical result; Phase 6 waiver preserved. | Yes |
| Verified-support proof | Genuine verified support without silently charging money or changing production data; existing artifact checks prove unavailable/dismissed support only. | Yes |
| Review walkthrough | Automated browser walkthrough, hands-on review, or both; reuse comments, resume, exports, and range/patch Finish scenarios. | Yes |

**User's choice:** All four areas.

## Clean-environment coverage

**Question:** What should count as the clean environment for Phase 7 acceptance?

| Option | Description | Selected |
|--------|-------------|----------|
| Isolated local environments | Fresh HOME/cache/prefix/browser state per installation path outside the Cumpa checkout; explicitly local-machine evidence. | Yes |
| Fresh machine or VM | Newly provisioned system with declared prerequisites; stronger separation and additional setup/authentication. | No |
| Both | Isolated local runs plus a fresh-system end-to-end confirmation. | No |

**User's initial response:** "explain what is this about"

**Clarification:** Explained this as the final new-user check of public installs, browser review, export, agent handoff, and feature-neutral support. Existing development tools, cached packages, skills, and saved settings could conceal installation defects. Temporary isolated state preserves the current setup without provisioning another machine; it does not prove every operating system.

**User's choice:** "go for isolated local env"

## Marketplace agent proof

**Question:** Which agent should perform the clean-profile marketplace install → review → Finish → canonical-result check?

| Option | Description | Selected |
|--------|-------------|----------|
| OMP | Documented native marketplace installation and supervised-process flow in an isolated profile. | Yes |
| Claude Code | Native ship-with-ai collection and /ship-with-ai:cumpa invocation in an isolated profile. | No |
| Codex | Documented selective installation and $cumpa invocation in an isolated profile. | No |
| Pi | Project-local discovery and documented foreground review flow in an isolated profile. | No |

**User's choice:** OMP.

**Notes:** This is the separate Phase 7 end-to-end proof, not a restart of the waived four-agent Phase 6 exercise. Other documented targets gain no new runtime-verification claims.

## Verified-support proof

**Question:** How should the plan obtain a real verified-support state for the clean installations?

| Option | Description | Selected |
|--------|-------------|----------|
| Restore existing support | Real Restore with an already-paid GitHub account; user handles protected sign-in; unavailable restoration remains blocked. | Yes |
| New support purchase | A real $49.99 purchase subject to separate execution-time payment approval; discussion itself authorizes no charge. | No |
| Leave this check blocked | Run reachable unpaid/dismissed checks but keep verified-state acceptance and ACC-04 incomplete until a real paid account is available. | No |

**User's choice:** Restore existing support.

**Notes:** No new purchase or fabricated paid state. Selecting this proof path does not establish account availability or successful restoration. Ordinary real Restore effects are distinct from manually seeding payment state or changing production configuration.

## Review walkthrough

**Question:** How should browser-review acceptance be performed? Every option must exercise the real public installs, comments, persistence, exports, and attached Finish, not mocks.

| Option | Description | Selected |
|--------|-------------|----------|
| Automated walkthrough | Agent drives the actual browser and validates results; human handles protected steps such as Restore sign-in. | Yes |
| Hands-on walkthrough | User performs review actions through a guided checklist; agent records evidence and validates exports. | No |
| Automation plus hands-on | Full automation followed by one final user-completed OMP-launched review. | No |

**User's choice:** Automated walkthrough.

## Completion gate

**Question:** We have covered all four selected areas. Ready to record Phase 7 context, or is something still unclear?

| Option | Description | Selected |
|--------|-------------|----------|
| Ready to record context | Write decisions and references for research/planning; no installation, authentication, payment, or acceptance execution starts. | Yes |
| Explore more gray areas | Continue discussing unresolved choices before writing final context. | No |

**User's choice:** Ready to record context.

## Claude's Discretion

No explicit "you decide" answers. Ordinary implementation mechanics remain researcher/planner discretion under existing repository patterns. No new product behavior, framework, deployment, publication, or widened test matrix was requested.

## Deferred Ideas

None. Preserve the Phase 6 four-agent waiver and the exact Phase 7 requirements. Unselected options are not future-work commitments.
