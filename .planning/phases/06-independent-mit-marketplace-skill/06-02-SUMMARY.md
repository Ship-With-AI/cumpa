---
phase: 06-independent-mit-marketplace-skill
plan: "02"
subsystem: distribution
tags: [agent-skills, marketplace, mit, user-waiver]
requires:
  - phase: 06-independent-mit-marketplace-skill
    provides: Installed-Cumpa compatibility gate from 06-01
provides:
  - Self-contained thin four-agent skill with the exact MIT license
  - Exact unpublished existing-collection marketplace candidate
  - Explicit user waiver of the four-agent authentication and test exercise
affects: [06-03]
tech-stack:
  added: []
  patterns: [Direct byte-for-byte skill copy into the existing collection]
key-files:
  created:
    - .kimi-code/skills/cumpa/LICENSE
    - .planning/phases/06-independent-mit-marketplace-skill/06-MARKETPLACE-CANDIDATE.json
  modified:
    - .kimi-code/skills/cumpa/SKILL.md
key-decisions:
  - Preserve distinct Claude Code, Codex, Pi and OMP instructions and the CLI-owned review protocol.
  - Record user-waived target tests as not run, never as passing observations.
  - Keep exact marketplace publication approval separate from the test waiver.
requirements-completed: []
requirements-progress: [SKL-01, SKL-02, SKL-03]
duration: not separately timed
completed: 2026-09-11
status: complete
verification-status: partial-user-waived
---

# Phase 6 Plan 02: Thin Skill and Exact Marketplace Candidate

The source skill and local marketplace candidate are complete. The user waived the authentication/test checkpoint; marketplace publication remains unauthorized.

## Completed work

1. **Task 1 — `7cfa0c7c0367377932263e8bec7a1aa0b9485dc6`:** Wired the shared preflight into the skill, retained four distinct lifecycle branches and the existing revision/exact-patch/Finish/result contract, and added a byte-identical copy of the approved MIT license.
2. **Task 2 — `b2dd485a8ce85fd554a32d457a51e585f50d480a`:** Prepared the exact external candidate and canonical candidate record; corrected execution-discovered verifier defects without changing the prepared candidate. Private custody uses the existing owned operation journal and lock, not a new checkout.
3. **Task 3 — user-waived:** Direct current-chat instruction on 2026-09-11: **“ignore this test part”**, following the explanation of the four isolated agent sign-ins. This is a scope reduction, not authentication readiness, proof assent or publication authority. CONTEXT D-07/D-11 and the execution amendments in 06-02/06-03 are authoritative.

## Exact unpublished candidate

- Repository: `https://github.com/Ship-With-AI/skills.git` (ID `1178350399`).
- Baseline: `7be01dca277a53f4144620be6cc9657a9371571c`.
- Candidate: `984e28c5838176ec15d2af8b996d0307e45b28d5`.
- Collection: `ship-with-ai`, version `0.2.0` → `0.3.0`.
- Changed external paths: `.claude-plugin/plugin.json`, `README.md`, `skills/cumpa/LICENSE`, `skills/cumpa/SKILL.md`, `skills/cumpa/scripts/check-cumpa.mjs`.
- `.claude-plugin/marketplace.json` is unchanged; no standalone plugin or `entry.version` was introduced.
- The original candidate record and frozen command matrix remain historical preparation evidence. The waived installer/provider commands must not be executed.

## Previously observed verification

- Exact license comparison passed.
- All 24 focused preflight tests passed; skill-format validation passed.
- The full candidate acceptance command passed after the recorded verifier corrections.
- The synthetic V2 result fixture passed the compiled schema; it is not a real review result.
- Semantic JSON comparison, privacy-predicate and embedded-command syntax checks passed as recorded in the preparation evidence.
- A read-only anonymous remote check at waiver recording still found the prepared baseline on public `main`.

No tests were rerun to process the waiver. No installer, provider-backed target proof, real review or marketplace push was performed.

## Deviations and verification limits

The four-agent local/public installation, discovery, prerequisite and lifecycle test exercise, its fresh authentication prerequisite, and its associated released-CLI readiness/abort smoke are waived. Claude Code, Codex, Pi and OMP remain documented targets, but their runtime and fresh public installation behavior is **not exercised**. Existing source/preflight evidence does not establish those results. SKL-01/SKL-02/SKL-03 are not marked fully verified by this summary.

The implementation-discovered verifier corrections retain their original evidence and review provenance. Earlier planning-review verdicts do not imply review of later corrections or this user amendment.

## Next checkpoint

06-03 Task 2: preserve candidate custody, inspect current push effects/protections, and obtain separate exact marketplace-only publication assent. Retain a single authorized non-force exact-OID push or read-only reconciliation, followed by anonymous public-byte and approved-effect verification. The four-agent public installation stage is waived. Phase 7 browser/Finish/export acceptance and all Cumpa/npm/Supabase non-mutation boundaries remain unchanged.
