# Roadmap: Cumpa

## Milestones

- **[v1.0 MVP](./milestones/v1.0-ROADMAP.md)** — Phases 01–04.1, 40 plans, shipped 2026-07-24.
- **[v1.1 GitHub Dark Diff](./milestones/v1.1-ROADMAP.md)** — Phases 05–08, 16 plans, 18/18 requirements, shipped 2026-07-29.
- **[v1.2 Fast Source Discovery](./milestones/v1.2-ROADMAP.md)** — Phases 09–11, 4 plans, 5/5 requirements, shipped 2026-07-30.
- **[v1.3 Agent Review Handoff](./milestones/v1.3-ROADMAP.md)** — Phases 12–15, 14 plans, 42 tasks, 17/17 requirements, shipped 2026-08-06.
- **[v1.4 Voluntary Support](./milestones/v1.4-ROADMAP.md)** — Phases 01–02, 22 plans, 30 tasks, 12/12 requirements, shipped 2026-09-04.
- **[v1.5 MIT Distribution](./milestones/v1.5-ROADMAP.md)** — Phases 03–07, 23 plans, 69 tasks, 18/19 requirements (ACC-04 blocked), shipped 2026-09-15.

## Overview

No active milestone. Cumpa is published on npm as `@shipwithai/cumpa` under standard MIT
terms, installable globally, through `npx`, or via the public marketplace skill, with SLSA
provenance on every release.

Start the next milestone with `/gsd:new-milestone`, which defines fresh requirements and a
new roadmap.

## Carried Forward

The one blocked requirement and the retained debt from v1.5 are recorded in
`./milestones/v1.5-ROADMAP.md` and `./milestones/v1.5-REQUIREMENTS.md`. The next milestone
should decide explicitly whether to adopt them:

- **ACC-04** — verified-support acceptance is unreachable until Restore stops completing on
  a false RPC result (`supabase/functions/support-flow/index.ts`) and a permitted genuine
  live entitlement exists. Fix the defect first, then rerun only the verified-state portions
  for the global, npx, and marketplace paths.
- `SKILL.md` still installs `@1.5.0` and claims only 1.5.0 has independent release
  verification; correcting it needs a separate marketplace publication.
- `.vue` files remain outside `tsc`; `vue-tsc` would close the gap.
