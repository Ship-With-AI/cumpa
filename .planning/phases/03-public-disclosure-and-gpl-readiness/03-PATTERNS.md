# Phase 3: Public Disclosure and GPL Readiness — Pattern Map

**Mapped:** 2026-09-05  
**Files analyzed:** 9 implementation/input artifacts plus generated evidence and tests  
**Analogs found:** 7 / 9 (two legal/disclosure documents have no direct implementation analog)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/verify-public-disclosure.mjs` | verifier / CLI utility | transform + batch file I/O + request-response | `scripts/verify-supabase-support.mjs`, `scripts/verify-production-artifacts.mjs` | exact structural role |
| `package.json` | package metadata/config | transform (pack inventory) | existing root `package.json`; `tests/e2e/package-assets.spec.ts` | exact |
| `package-lock.json` | lock metadata | transform | root lockfile metadata conventions | role-match |
| `.github/workflows/*` (if a publication gate workflow is added) | CI workflow | batch/request-response | `.github/workflows/deploy-supabase-production.yml` | exact |
| `LICENSE` | legal license input | file I/O | none | no analog |
| `.kimi-code/skills/cumpa/LICENSE` | scoped legal license input | file I/O | `.kimi-code/skills/cumpa/SKILL.md` boundary | partial |
| `README.md` | documentation / license boundary | request-response (user-facing instructions) | current `README.md` install/prerequisite sections | role-match |
| `THIRD_PARTY_NOTICES.md` | legal/provenance inventory | transform + file I/O | `node_modules/monaco-editor/ThirdPartyNotices.txt` (upstream source) | partial |
| `.planning/phases/03-public-disclosure-and-gpl-readiness/03-RIGHTS-REVIEW.md` | maintainer disposition ledger | transform (human-authored evidence) | prior phase evidence/attestation artifacts | partial |
| `.cumpa/publication/{toolchain-provenance,disclosure-evidence,consequential-action-authorization,consequential-action-ledger,pre-push-authorization,maintainer-attestation,publication-gate}.json` | generated provenance/evidence/authority/lineage | batch/file I/O + strict digest validation | `02-17-FINAL-EVIDENCE.md`, verifier final records | role-match |
| `tests/e2e/package-assets.spec.ts` (modified) | test | package I/O + request-response | itself; `tests/api/export-publication.test.ts` for digest/state assertions | exact |
| new verifier contract test (likely `tests/e2e/*` or `tests/api/*`) | test | request-response + temp file I/O | `tests/e2e/package-assets.spec.ts`, `tests/api/export-publication.test.ts` | role-match |

## Pattern Assignments

### `scripts/verify-public-disclosure.mjs` (verifier, batch/file I/O)

**Analogs:** `scripts/verify-supabase-support.mjs`; `scripts/verify-production-artifacts.mjs`.

**Imports and process boundary** (`verify-supabase-support.mjs:2-6`): use Node ESM built-ins (`node:crypto`, `node:fs`, `node:fs/promises`, `node:path`, `node:child_process`) and `execFileSync`/`spawn` with argument arrays. Do not shell-interpolate Git/GitHub commands. The research's `spawn('git', ['for-each-ref', ...])` example is the right streaming shape.

**Digest and strict records** (`verify-supabase-support.mjs` helpers `sha256`, `isHash`, `finalDigest`, `assertImmutableFinalRecord`; final record around lines 315-341 and 381-407):

```js
function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}
function finalDigest(record) {
  return sha256(JSON.stringify({ ...record, artifacts: { ...record.artifacts, evidence_sha256: '' } }));
}
```

Write versioned JSON, use exact `kind`/`status` values, blank the self-digest field before hashing, then write the digest back. Reject missing/unknown fields and stale digests instead of trusting an editable approval boolean. The existing verifier's `assertExactKeys`, `assertImmutableFinalRecord`, `readFinalInput`, `writeEvidence`, and `evidenceDigest` are reusable structural patterns.

**Protected-value and failure handling** (`verify-production-artifacts.mjs` top-level patterns and `scanText`): compile narrow project policy plus scanner results, fail with a path-specific message, and never print matched bytes. `verify-supabase-support.mjs` uses `fail(message)` and distinguishes invalid records from operational failures. For Phase 3, preserve Gitleaks exit 1 as a completed blocked scan; other nonzero exits, unavailable GitHub pages/downloads, skipped files, missing LFS, or permission gaps are incomplete/blocked—not pass.

**Temporary package/archive handling** (`verify-production-artifacts.mjs` main body):

```js
const directory = mkdtempSync(join(tmpdir(), 'cumpa-artifact-'));
try {
  const [dryRun] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' }));
  // inspect, extract, scan
} finally {
  rmSync(directory, { recursive: true, force: true });
}
```

Use bounded temporary storage, cleanup in `finally`, `execFileSync` argument arrays, and stream/hash large output. Collector remains read-only: no revoke, deletion, rewrite, force-push, release, or visibility mutation.

**Command inventory to reuse:** research-prescribed `git for-each-ref --sort=refname`, `git ls-remote --heads --tags origin`, `git ls-remote origin 'refs/pull/*'`, `git rev-list --all --count`, `git rev-list --objects --all`; `git lfs ls-files --all --json`, `git lfs fetch --all origin`, `git lfs fsck --dry-run --objects --pointers`; paginated `gh api --paginate` runs/artifacts/releases. Preserve command IDs, arguments, exit classification, item counts, sorted IDs, and SHA-256 digests in evidence.

### `package.json` and `package-lock.json` (metadata, transform)

**Analog:** root `package.json`; package oracle `tests/e2e/package-assets.spec.ts:14-19,30-59`.

Set only the exact application metadata required here: `package.json.license` must be `GPL-3.0-or-later`; do not change package identity/version (Phase 4 owns namespace/version). Run the normal npm lockfile synchronization so the root lock metadata agrees. Existing package uses ESM, Node `>=24`, npm scripts, and `files: ["dist/", ".kimi-code/skills/cumpa/"]`; the mixed-scope skill inclusion is an explicit rights-review concern, not proof that root GPL covers it.

The package test resolves repository paths with `fileURLToPath(new URL(...))`, uses platform-aware npm (`npm.cmd` on Windows), and runs commands through `runPrerequisite(command, args, cwd, env)` with `execFileSync`, captured stdio, and contextual errors. Reuse this rather than shell strings.

### `LICENSE` (complete GPLv3 text) — no direct analog

No repository license file exists. Copy the verbatim canonical GNU/SPDX GPLv3 text, including Sections 0–17 and the “How to Apply These Terms to Your New Programs” material. Do not summarize, generate, or adapt it. Planner should treat exact bytes and completeness as an input assertion, not a custom license parser.

### `.kimi-code/skills/cumpa/LICENSE` and `README.md` (scoped boundary)

**Analog:** `.kimi-code/skills/cumpa/SKILL.md` (currently the sole scoped skill file) and current `README.md:1-42` install/prerequisite structure. Add a complete MIT text scoped to the skill directory and a concise README statement that application source is GPL while the independently distributed marketplace skill is MIT. Avoid implying npm automatically registers the skill; current README explicitly instructs copying `SKILL.md`.

No existing scoped-license file or license-boundary prose exists, so exact copyright holder/year and final wording are research/legal-review inputs, not inferable code conventions.

### `THIRD_PARTY_NOTICES.md` (provenance inventory)

**Closest analog:** `node_modules/monaco-editor/ThirdPartyNotices.txt` (upstream notice source), plus package/archive inspection in `tests/e2e/package-assets.spec.ts`.

Record actual conveyed material, not merely lockfile license fields: Monaco workers/assets/codicon font and every bundled/generated/installed runtime material requiring attribution, with source URL/version/digest and retained notice text or location. Keep this committed and public-safe; generated private evidence belongs under ignored `.cumpa/publication/`.

### `03-RIGHTS-REVIEW.md` (maintainer ledger)

**Analog:** prior phase evidence records `.planning/milestones/v1.4-phases/02-move-the-implementation-to-supabase/02-17-FINAL-EVIDENCE.md` and `02-17-LOCAL-PACKAGE-SECURITY-EVIDENCE.md`.

Use explicit version/kind/status, reviewer/time, exact evidence digest, finding IDs, authority/privacy/compatibility disposition, credential remediation references, and resolution evidence. Human authority decisions must remain separate from automated inventory. Unknown authority, private-data scope, incompatible license, or missing notice disposition stays blocked; automation must not assert sole copyright ownership.

### `.cumpa/publication/*.json` (generated evidence, ignored)

**Analogs:** `scripts/verify-supabase-support.mjs` final evidence helpers and `02-17-FINAL-EVIDENCE.md` (shape below).

```json
{
  "version": 1,
  "kind": "final-review",
  "status": "passed",
  "inputs": [{"name":"...","path":"...","kind":"...","version":1,"sha256":"<64 hex>"}],
  "conclusions": {"immutable_six_input_lineage": true},
  "artifacts": {"evidence_sha256":"<self digest>"}
}
```

For Phase 3, define strict kinds for toolchain provenance, disclosure evidence, one-action non-ref authorization, append-only consequential-action ledger, every-push authorization, post-push attestation, and final gate. `.gitignore` already ignores `.cumpa/`; do not commit reports. Evidence is redacted and binds frozen refs/GitHub IDs/raw archive/scan digests. Before fixed authorization reuse, validate strict temporary result input against authorization and current following evidence, append its non-secret result plus embedded authorization/previous digest, then delete input. Pre-push authorization binds the transition-time ledger; attestation/gate bind that digest and the exact final ledger, allowing only a validated append-only suffix. Gate derives status from private visibility, matching canonical local/remote main, complete surfaces/LFS bytes, resolved findings, credential ordering, rights/license/notices, settled deployment consequences, and zero violations.

### CI/release workflow (if added)

**Analog:** `.github/workflows/deploy-supabase-production.yml` (current workflow is one-line serialized YAML; salient conventions are `push: branches: [main]`, `permissions: contents: read`, Node 24 setup, `npm ci`, and repository gates before protected deployment job). A disclosure verifier workflow must remain read-only and must not hide external consequential actions. If it runs on `main`, do not commit final `.cumpa/publication` output: every push creates new workflow activity and would stale the scan.

### Tests

**Primary analog:** `tests/e2e/package-assets.spec.ts:30-59` `runPrerequisite` and package extraction tests. It builds, invokes npm pack with `--ignore-scripts`, inspects exact inventory, and asserts forbidden content. Extend it for GPL metadata, license files, scoped MIT boundary, notices, and package shape only if the test is part of the planned contract.

**Digest/state analog:** `tests/api/export-publication.test.ts` uses Vitest, temporary roots (`mkdtemp`), cleanup in `afterEach`, canonical JSON generation, and state-machine assertions. Use this style for synthetic evidence records, stale digest, missing surface, unknown status, changed snapshot, raw-secret, and credential-order rejection cases. Tests should invoke the public verifier CLI or exported contract, not duplicate implementation internals.

## Shared Patterns

### Fail closed and redact
**Sources:** `scripts/verify-production-artifacts.mjs`; `scripts/verify-supabase-support.mjs`; `tests/e2e/package-assets.spec.ts`.

- Use strict schema/enum/hash validation and explicit `fail()` errors.
- Treat missing tools, inaccessible/expired/403/404 surfaces, scanner errors, skipped binary/oversized content, and count mismatches as blocked/incomplete.
- Never echo raw downloaded logs, archives, credential matches, command values, or secret hashes.
- Keep collection and verifier validation modes read-only. Provider/hosted/support actions require a canonical blocking decision plus exact checked one-action authorization and ledgered result; every push requires fresh exact pre-push authorization, with force-with-lease limited to authorized rewritten-main cleanup.

### Evidence lineage
**Sources:** `verify-supabase-support.mjs` `finalDigest`, `assertImmutableFinalRecord`, `readFinalInput`; `02-17-FINAL-EVIDENCE.md`.

Every record is versioned, strict-keyed, and self-digested. Cross-file inputs carry exact SHA-256 digests; frozen before/after manifests and immutable IDs make stale evidence detectable. The consequential-action ledger is append-only and hash-chained so reusing one fixed authorization path cannot erase prior authority or outcomes. Keep absolute local paths and hosted identifiers out of public-safe committed evidence unless explicitly classified/accepted.

### CI/package commands

Reuse existing command-array conventions: `npm ci`, `npm run build`, `npm pack --dry-run --json --ignore-scripts`, `npm pack --json --ignore-scripts --pack-destination <temp>`, `tar -xzf <archive>`, and `node scripts/<verifier>.mjs <mode> ...`. Use `npm`/`node` directly through `execFileSync`, never interpolated shell commands.

## No Analog Found

| Artifact | Why no close pattern | Planner guidance |
|---|---|---|
| `LICENSE` | No root license or canonical legal-text file exists | Use verbatim GPLv3 source; exact byte/completeness assertion. |
| `03-RIGHTS-REVIEW.md` | No rights/authority/third-party ledger exists | Define explicit human fields from research; do not invent automated legal decisions. |
| `.kimi-code/skills/cumpa/LICENSE` | No scoped license file exists | Use complete MIT text and explicit scope boundary. |
| `THIRD_PARTY_NOTICES.md` | No committed notice inventory exists | Build from actual shipped bytes/upstream notices; lockfile metadata is insufficient. |
| Public disclosure GitHub-surface collector | Existing verifiers cover hosted support/package security, not paginated Actions/logs/artifacts/releases/attachments/LFS | Adapt existing digest/temp/error patterns; use Git/GitHub CLI authorities from research. |

## Metadata

**Analog search scope:** `scripts/verify-production-artifacts.mjs`, `scripts/verify-supabase-support.mjs`, `tests/e2e/package-assets.spec.ts`, `tests/api/export-publication.test.ts`, `.github/workflows/deploy-supabase-production.yml`, `.kimi-code/skills/cumpa/SKILL.md`, `README.md`, `.gitignore`, `node_modules/monaco-editor/ThirdPartyNotices.txt`, prior Phase 2 final evidence artifacts, and research-named planning files.  
**Important:** Research names `tests/e2e/support-recovery.spec.ts`, but it is absent from the current tree (also recorded as deferred cleanup in state); do not assign it as a current analog.  
**Source edits:** none; this file is the sole artifact created.
