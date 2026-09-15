# Phase 6: Independent MIT Marketplace Skill — Pattern Map

**Mapped:** 2026-09-11  
**Files analyzed:** 10 anticipated artifacts/locations (including conditional metadata and verification)  
**Analogs found:** 9 role or contract matches / 10; no exact installed-CLI compatibility helper exists

## Scope and interpretation

The approved context authorizes an existing-collection addition, not a new plugin or application feature. The repository-owned `.kimi-code/skills/cumpa/SKILL.md` is the source behavior contract. The marketplace copy must remain a thin, portable instruction delegate to an independently installed `cumpa` executable. The stale `.planning/intel/API-SURFACE.md` reports zero symbols; that is an incomplete hint, not evidence that an implementation or helper is absent.

Phase 5 bytes and publication records are immutable inputs. Do not edit, regenerate, republish, or use them as a shortcut for Phase 6 planning.

## File Classification

| Anticipated file/location | Role | Data flow | Closest analog | Match quality |
|---|---|---|---|---|
| `Ship-With-AI/skills/skills/cumpa/SKILL.md` | marketplace skill/instruction delegate | request-response plus supervised streaming process | `.kimi-code/skills/cumpa/SKILL.md` | exact behavioral source; portability deviation |
| `Ship-With-AI/skills/skills/cumpa/LICENSE` | license/legal resource | static file I/O/distribution | repository `LICENSE` | exact text/attribution |
| `Ship-With-AI/skills/README.md` (installation guidance) | installation documentation | request-response instructions | marketplace README Path A/Path B | exact layout/install convention; Cumpa-specific prerequisite deviation |
| `Ship-With-AI/skills/.claude-plugin/plugin.json` | collection metadata/config | static catalog discovery | current plugin manifest | role-match; edit only if catalog requires it |
| `Ship-With-AI/skills/.claude-plugin/marketplace.json` | marketplace catalog metadata | static catalog discovery | current marketplace manifest | role-match; likely no new plugin entry under D-01 |
| installed-CLI prerequisite/version check (location TBD) | deterministic prerequisite helper or inline skill procedure | request-response/process invocation | `scripts/verify-prerequisites.mjs` | partial; no existing installed-Cumpa version gate |
| targeted isolated compatibility/discovery check | verification/test | process I/O and observable discovery | `tests/cli/help.test.ts`, `tests/cli/request.test.ts`, `tests/package/*` | role-match; target must be isolated from full browser acceptance |
| selected-agent discovery/invocation notes (inside skill/docs, not a new framework) | portability documentation | supervised streaming process | existing skill workflow and marketplace README | partial; Pi and OMP have no repository analog |
| source-to-marketplace synchronization/metadata framework | — | — | none | **not warranted**; do not create |

## Pattern Assignments

### `skills/cumpa/SKILL.md` (marketplace skill, request-response + supervised process)

**Analog:** `.kimi-code/skills/cumpa/SKILL.md` (repository source of truth).

Copy the thin-delegate shape and preserve these concrete invariants:

**Identity and boundary** (source lines 1–8):

```markdown
---
name: cumpa
description: "Launches Cumpa’s native coding-agent review flow and consumes its canonical review result..."
---

# Cumpa

Use Cumpa as the review UI and protocol authority. This skill is only a gate to the installed CLI: do not recreate its review logic, make review commits, mutate refs/index/worktrees, or review the diff yourself.
```

**Pinned revision request** (source lines 10–25): resolve ordered base/head identities, use full OIDs and `git merge-base`, then send only the strict request object:

```json
{"kind":"cumpa.review-request","schemaVersion":1,"mode":"revisions","revisions":{"base":"<full-merge-base-oid>","head":"<full-head-oid>"}}
```

The marketplace copy must not replace these instructions with a second diff implementation, Git library, source checkout, or agent-specific review logic.

**Supervised process and completion** (source lines 27–44): retain the `env -u CMUX_WORKSPACE_ID cumpa < "$CUMPA_REQUEST" > "$CUMPA_RESULT"` shape, process supervision, stderr URL observation, and waiting through human **Finish**. Readiness is not completion. Accept only exit `0` plus one non-empty parseable JSON object with `kind: "cumpa/export"`; report exit `1`, `130`, empty/invalid output without inventing feedback.

**Exact-patch boundary** (source lines 46–53): keep exact-patch mode only when explicitly requested; never synthesize a patch or temporary commit. Preserve the 1 MiB/NUL-free request constraints as documented in the source contract.

**Required deviation:** add the approved compatibility gate before launching. Accept only stable versions `>=1.5.0 <2.0.0`; reject prerelease, older, 2.x+, and unparseable output. For missing/incompatible/unparseable `cumpa`, stop with exactly `npm install --global @shipwithai/cumpa@1.5.0` and the Node.js 24+ / Git 2.43.0+ prerequisites. Never auto-install, upgrade, use `npx`, or use a checkout/tarball fallback. Keep 1.5.0 as verified proof, not proof of future 1.x releases.

**Agent portability deviation:** explicitly document Claude Code, Codex, Pi, and OMP as four distinct supported targets only after their real discovery/invocation paths are established. Do not copy Claude/OMP process-supervision assumptions into Pi or Codex; do not silently collapse Pi and OMP. The skill should describe the same Cumpa protocol, not create four protocol variants.

### `skills/cumpa/LICENSE` (static license resource)

**Analog:** repository `LICENSE` (all lines).

Copy the approved standard MIT text byte-for-byte, including:

```text
MIT License

Copyright (c) 2026 Alessandro Magionami & Manuel Salvatore Martone
```

Retain the permission, notice-retention, warranty disclaimer, and liability clauses. This is a separate skill grant. It does not relicense the other marketplace skills, merge application/skill installation lifecycles, or imply marketplace metadata alone supplies a license file. The public marketplace root currently returned HTTP 404 for `LICENSE`, so the Cumpa skill must carry its own file; do not “fix” the entire collection’s licensing in this phase.

### Marketplace installation documentation (marketplace README and any Cumpa-specific section)

**Analog:** `https://raw.githubusercontent.com/Ship-With-AI/skills/main/README.md`, “Install” Path A and Path B plus “Structure”. The established concrete commands are:

```bash
npx skills add Ship-With-AI/skills --skill <name>
claude plugin marketplace add Ship-With-AI/skills
/plugin install ship-with-ai@ship-with-ai-skills
```

Reuse the existing collection identity and selective Skills CLI convention. Add Cumpa to the available-skills listing only where required by the collection’s current documentation pattern. Cumpa-specific guidance must state that the marketplace skill is independent and requires a separately installed CLI, then provide the exact global install command and prerequisites from `README.md`/D-04. Do not claim the marketplace already contains Cumpa before publication.

Do not copy the README’s broad “40+ agents” claim as evidence for this phase. D-06 names exactly Claude Code, Codex, Pi, and OMP; D-07 requires actual paths and targeted checks for each, with unsupported paths reported honestly.

### `.claude-plugin/plugin.json` and `marketplace.json` (conditional metadata)

**Analogs:** current public manifests:

- `plugin.json`: `name: "ship-with-ai"`, `version: "0.2.0"`, `license: "MIT"`, and `skills: "./skills/"`.
- `marketplace.json`: catalog `name: "ship-with-ai-skills"` and one plugin entry `{ "name": "ship-with-ai", "source": "./" }`.

The marketplace README explicitly says adding a skill is a new `skills/<name>/SKILL.md` directory and “no additional metadata edits needed.” Prefer that established no-metadata-change path. Update plugin/catalog metadata only if the actual collection release mechanism requires a description/version/listing change; do not add a standalone Cumpa plugin entry (D-01), invent a marketplace, or change collection identity. A metadata declaration is not proof that the skill bytes, license, install, or runtime prerequisite behavior work.

### Deterministic prerequisite/version check (conditional helper or inline procedure)

**Closest analog:** `scripts/verify-prerequisites.mjs`, especially:

```js
export function assertSupportedNodeVersion(nodeVersion = process.versions.node) {
  const nodeMajor = Number.parseInt(nodeVersion.split('.')[0] ?? '', 10);
  if (nodeMajor < 24) {
    throw new Error(`Node.js 24 or newer is required; found v${nodeVersion}`);
  }
}
```

and its explicit executable probe:

```js
executeFile('git', ['--version'], { stdio: 'pipe' });
```

Reuse the principle of dependency-injected command execution and explicit errors if a genuinely necessary deterministic check must be added. **No existing symbol performs the required installed-Cumpa semver gate.** Do not claim `verify-prerequisites.mjs` is reusable as-is: it verifies this repository’s Node/dependency tree and `git`, while Phase 6 needs `cumpa --version`, stable semver parsing, Git 2.43.0+, and the exact recovery command. Prefer the smallest inline instruction/check that the selected agent paths can actually execute; create a helper only if a real target cannot express the check without duplication. Do not add a framework, package, synchronization tool, or speculative helper name to planning.

### Targeted isolated verification

**Analogs:**

- `tests/cli/help.test.ts`: launches the built CLI with `spawnSync`, uses a temporary cwd, asserts exit status/stdout/stderr, and cleans the temporary directory.
- `tests/cli/request.test.ts`: tests the observable request schema and error ownership around strict stdin requests; it is the closest contract-level model for malformed/unparseable input behavior.
- `tests/package/runtime-artifact-verifier.test.ts` and `tests/package/runtime-package-contract.test.ts`: package-boundary checks that inspect distributable behavior/contents rather than source-only assertions.

Phase 6 targeted checks should follow these boundaries: fresh temporary installation/discovery locations, observable installed skill presence and metadata, command/version/prerequisite behavior, and isolated checks for each selected agent path. They must not be source-text assertions standing in for runtime verification, and they must not become Phase 7’s full clean browser review/Finish/export acceptance. Do not run or add validation during this mapping task.

## Shared Patterns and Integration Invariants

### Delegation authority

Cumpa owns native Git grounding, merge-base/ref semantics, diff generation, browser workspace, persistence, Finish, and canonical export. The skill only resolves requested identities and supervises/consumes the installed process. Never duplicate protocol/review logic or let the agent review the diff itself.

### CLI lifecycle and recovery

The CLI is separately installed and must not require the source checkout. Missing, incompatible, or unparseable executable output is a terminal prerequisite failure with the exact 1.5.0 global-install command and Node/Git prerequisites. No automatic install/upgrade, npx fallback, source checkout, local tarball, or silent version substitution.

### Completion and output

Keep URL/diagnostics on stderr and canonical output on stdout. Keep the supervised process alive through human Finish. A ready browser/URL is not completion; only successful exit and valid `cumpa/export` JSON is accepted. Temporary request/result files are outside the reviewed repository and removed only after consumption.

### Distribution and licensing

The marketplace copy is independently MIT licensed with the existing two-name attribution. It is excluded from the runtime-only npm artifact and does not alter application license, package bytes, Supabase configuration, release framework, or historical custody records.

### Agent distinction

Claude Code, Codex, Pi, and OMP are separate targets. Their namespaces, discovery locations, installation commands, and supervision capabilities must be documented from actual observations. “Skills CLI supports many agents” is not evidence for Pi or OMP; an observation for Pi is not evidence for OMP.

## Unsuitable Patterns / Explicit No-Analog Cases

- **Duplicate review implementation:** do not add Git diff/parsing/review/export logic to the skill.
- **Immutable-byte mutation:** do not modify Phase 5 published/runtime bytes, historical release evidence, or consumed publication authority.
- **Source assertions as runtime proof:** a copied `SKILL.md`, manifest, or string check cannot replace installed discovery/prerequisite checks.
- **Helper/framework proliferation:** no synchronization framework, new plugin architecture, package manager abstraction, or agent adapter layer without a demonstrated necessary target.
- **Pi/OMP conflation:** do not treat one as the other or silently drop either.
- **No existing helper for semver gate:** `API-SURFACE.md`’s zero symbols is not evidence of absence; repository search found no already-named installed-Cumpa compatibility helper, so planner should derive the smallest implementation from actual selected-agent needs rather than inventing a symbol here.
- **No standalone metadata/plugin:** collection layout already discovers `skills/cumpa/SKILL.md`; a standalone Cumpa plugin would violate D-01.

## No Analog Found

| Artifact | Why no analog | Planning consequence |
|---|---|---|
| Installed Cumpa stable-1.x compatibility gate | Existing prerequisite script checks project dependencies, not an installed external CLI’s semver and prerelease policy | Derive a minimal check from D-03/D-04; do not reuse or rename the existing script without matching behavior |
| Pi-specific and OMP-specific discovery/supervision paths | Current repository skill targets a generic supervised process and the public collection documents Claude Code/Skills CLI; no local implementation establishes Pi or OMP namespaces | Researcher must establish actual paths; planner must document honest unsupported results rather than fabricate adapters |
| Marketplace Cumpa resource layout | Cumpa is not yet present in the observed public tree; existing skills vary between one `SKILL.md` and resource-heavy `assets/`/`scripts/` layouts | Start with only `SKILL.md` + `LICENSE`; add resources only if a concrete prerequisite/discovery need is proven |

## Metadata

**Analog search scope:** `.kimi-code/skills/`, `README.md`, `LICENSE`, `docs/distribution-operations.md`, `scripts/verify-prerequisites.mjs`, `tests/cli/`, `tests/package/`, and the public `Ship-With-AI/skills` README/manifests plus `evaluate-side-project`, `context-tax`, and `factory` skill files.  
**Files scanned:** 16 local files/paths plus 7 public raw/API sources.  
**Pattern extraction date:** 2026-09-11
