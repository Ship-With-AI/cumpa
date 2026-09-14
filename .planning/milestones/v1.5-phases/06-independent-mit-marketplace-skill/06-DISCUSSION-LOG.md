# Phase 6: Independent MIT Marketplace Skill - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-11
**Phase:** 06-independent-mit-marketplace-skill
**Areas discussed:** Marketplace packaging, CLI version policy, Supported agent paths

## Entry and inherited constraints

After Phase 5 completed, the user selected **Discuss Phase 6**, rather than leaving it unstarted. The user selected all three offered discussion areas.

Independent MIT licensing, a separately installed CLI, no automatic installation, unchanged review/Finish behavior, and the Phase 7 full-browser boundary were carried forward from existing decisions rather than re-asked. Discussion was explicitly distinguished from implementation and publication authority.

## Marketplace packaging

**Question:** How should Claude Code users install Cumpa from the existing marketplace?

| Option | Description | Selected |
|--------|-------------|----------|
| Existing collection | Add `skills/cumpa` to `ship-with-ai`. Native plugin users receive the collection; Skills CLI users can install only Cumpa. Reuses the existing layout. | Yes |
| Standalone Cumpa plugin | Add a dedicated Cumpa entry to the same marketplace so native users can install it without the other skills. Requires separate plugin metadata. | No |

**User's choice:** `Existing collection`

**Follow-up:** The assistant restated the collection/selective-install distinction and that Cumpa would carry its own MIT license without changing other skills' licensing. Asked whether to continue packaging discussion or move to CLI policy, the user selected **Next area**.

## CLI version policy

**Question:** Which installed Cumpa versions should this skill accept? Versions outside the policy would stop with the exact installation command, never auto-upgrade.

| Option | Description | Selected |
|--------|-------------|----------|
| Exactly 1.5.0 | Accept only the independently verified release; the skill must change to accept another version. | No |
| Stable 1.5.x | Accept stable patch releases in the 1.5 line, rejecting prereleases and other minor versions. Future compatibility is policy, not already-tested proof. | No |
| Stable 1.x from 1.5.0 | Accept later stable 1.x releases with a broader forward-compatibility policy than the verified release. | Yes |

**User's choice:** `Stable 1.x from 1.5.0`

**Follow-up:** The assistant restated stable `>=1.5.0 <2.0.0`, excluding prereleases. Missing, incompatible or unparseable versions stop with `npm install --global @shipwithai/cumpa@1.5.0`; no automatic install or upgrade. Only 1.5.0 is currently verified. Asked whether to continue CLI discussion or move to agent paths, the user selected **Next area**.

## Supported agent paths

**Question:** Which agent environments should receive explicit support guidance and targeted installation/prerequisite checks? Full public browser-flow acceptance remains Phase 7.

| Option | Description | Selected |
|--------|-------------|----------|
| Claude Code only | Verify the existing native marketplace path without claiming other runtime support. | No |
| Claude Code and Codex | Cover the native plugin and a cross-agent Skills CLI installation, checking both runtimes. | No |
| Claude Code, Codex, OMP | Also cover the current OMP harness, establishing its supported installation route rather than assuming Skills CLI support. | No — expanded by custom answer |
| Custom answer | `Claude Code, Codex, Pi, OMP` | Yes |

**User's choice, verbatim:** `Claude Code, Codex, Pi, OMP`

**Follow-up:** The assistant confirmed all four, with Pi and OMP treated as separate runtimes. Installation/discovery and prerequisite handling would be verified for each, without expanding Phase 6 into the Phase 7 full browser flow.

## Final confirmation

The assistant summarized the existing collection, stable `>=1.5.0 <2.0.0` compatibility policy, no automatic installation/upgrades, and four selected agent targets. Asked whether to write Phase 6 context or discuss another decision, the user replied **`ready`**.

This confirms the discussion record. It does not authorize implementation, marketplace publication, application source pushes, workflow actions, or reuse of consumed Phase 5 publication authority.

## Claude's Discretion

The user did not select a separate "you decide" option. Ordinary implementation details remain for research/planning under existing repository conventions. Already-locked requirements were not turned into artificial additional questions.

## Deferred Ideas

No new capabilities were proposed. Full clean public-artifact browser acceptance remains Phase 7; independently versioned update/uninstall guidance remains future DIST-02.
