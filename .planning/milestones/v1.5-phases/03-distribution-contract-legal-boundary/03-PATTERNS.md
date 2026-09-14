# Phase 3: Distribution Contract & Legal Boundary — Pattern Map

**Mapped:** 2026-09-07  
**Files analyzed:** 11 proposed/current surfaces  
**Analogs found:** 10 / 11 (the application license has no local legal-text analog)

This phase changes distribution terms, disclosures, metadata, and publication gates only. It must not add a second runtime, support authority, release framework, or review protocol.

## File Classification

| Proposed artifact | Role | Data flow | Closest current analog | Match quality |
|---|---|---|---|---|
| `package.json` | package metadata/config | request-response (npm metadata → install/CLI) | `package.json` current manifest | exact |
| `package-lock.json` | package metadata/lock | dependency graph / transform | root lockfile package entry | exact |
| `README.md` (packaged/public guide) | documentation | request-response (user follows commands) | current root `README.md` | exact |
| `LICENSE` (new application terms) | legal notice | static disclosure | none; `THIRD_PARTY_NOTICES.md` is an attribution-notice analog only | no legal analog |
| `THIRD_PARTY_NOTICES.md` | legal notice/inventory | static disclosure (dependency/source notices) | existing notices file | exact document role |
| `docs/support-service-operations.md` | operational boundary documentation | event/release evidence flow | current support operations guide | exact |
| `scripts/verify-production-artifacts.mjs` (small policy extension, if required) | verification utility | batch transform: npm inventory/archive → pass/fail | existing scanner | exact |
| `scripts/verify-supabase-support.mjs` (reuse only; avoid hosted assumptions) | verification utility | batch/evidence flow | existing bounded verifier | role-match; hosted-specific |
| Phase 3 approval/publication evidence (new markdown/record) | review evidence | approval + immutable digest lineage | archived v1.4 `02-15`/`02-16`/`02-17` records | exact evidence pattern |
| existing metadata/package fixtures (`tests/e2e/package-assets.spec.ts`) | acceptance fixture | npm pack → inventory/extracted archive assertions | current package acceptance fixture | exact |

## Pattern Assignments

### `package.json` and `package-lock.json` — package identity and contract

**Analogs:** `package.json` lines 1–1 (compact JSON manifest), `package-lock.json` lines 1–22 (root package mirror).

Current manifest is deliberately small and already supplies the important runtime boundary:

```json
{
  "name": "cumpa",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24" },
  "bin": { "cumpa": "dist/bin/cumpa.mjs" },
  "files": ["dist/", ".kimi-code/skills/cumpa/"]
}
```

The package root in the lockfile repeats `name`, `version`, `bin`, dependencies/devDependencies, and `engines.node >=24`; an identity/version transition must keep those root entries coherent. The intended Phase 3 metadata is `@shipwithai/cumpa`, `1.5.0`, a proprietary license-file declaration, repository `https://github.com/Ship-With-AI/cumpa`, no separate `homepage`, and the existing `cumpa` executable. Keep the existing exact dependency pins and package allowlist boundary; Phase 4 owns the runtime-only tarball decision.

**Smallest sufficient implementation:** update manifest identity, version, license metadata/file pointer, repository/issue metadata, and lockfile root identity. Do not add a metadata abstraction or release config. Do not infer ownership from the package scope: D-08 requires the license itself to name Alessandro Magionami and Manuel Salvatore Martone, subject to rights verification.

**Contract impacts:** package consumers and npm metadata will observe the new scope/version/license/repository. Existing package acceptance currently assumes only `dist/...` and bundled skill paths plus runtime assets; it does not pin the private name or `0.0.0`. Keep `engines`, `bin`, and compiled asset paths unchanged. The lockfile's many transitive `license` fields are dependency facts, not permission to change them to the application license.

### `README.md` — self-contained public/npm guide

**Analog:** `README.md` lines 1–30 (product description, prerequisites, source-checkout build), lines 32–63 (launch/review), and later agent request sections.

Reuse the accurate behavioral text: Node.js 24+, npm, Git prerequisite; `cumpa` launch; loopback URL; pinned base/head; review and export behavior; strict agent-request examples. Replace the private-checkout framing and future-publishing language with a self-contained npm guide covering exact global and `npx --yes @shipwithai/cumpa@1.5.0` installation, ordinary review, agent handoff, proprietary source-available terms, and voluntary support. Link problem reports only to `https://github.com/Ship-With-AI/cumpa/issues` once public and verified. Omit `homepage`, a made-up email/SLA/site, private Supabase/deployment instructions, and marketplace installation instructions that belong to the independent skill.

**Smallest sufficient implementation:** edit existing sections; do not create a second user guide. Treat README public links as a manual/public-visibility checkpoint, not proof while the repository is private.

### `LICENSE` — proprietary application terms

**Analog:** none. `THIRD_PARTY_NOTICES.md` is not a license for Cumpa and must not be copied as one.

The new file must be the exact approved legal text, not an agent-certified legal conclusion. It must cover source and compiled/object releases; free personal and commercial use; installation, backup, internal organizational copying, and personal/internal modifications; perpetual use of an acquired version while compliant; no service/update/maintenance promise; as-is and liability language only as permitted by law; restriction on general public redistribution; GitHub-required viewing/in-platform forking rights; statutory and third-party rights; and no special governing-law/venue clause. Name both licensors exactly. Keep application terms clearly distinct from the independently MIT-licensed marketplace skill.

**Gate:** exact final text requires explicit approval by both Alessandro Magionami and Manuel Salvatore Martone. Discussion/context is not approval. Unresolved contributor ownership, historical licenses, bundled material, or notice obligations block publication; neither metadata nor this file relicenses third-party code.

### `THIRD_PARTY_NOTICES.md` — notice inventory and obligations

**Analog:** existing `THIRD_PARTY_NOTICES.md` (document body). It currently contains notices for Node path, marked, TypeScript/DefinitelyTyped, Unicode, DOM/W3C, WebGL and others, including license-specific retention/attribution conditions. Preserve required original notices verbatim where obligations require it; reconcile against the complete dependency graph and bundled/generated browser assets before claiming completeness.

**Smallest sufficient implementation:** update the existing notice document in place and include it in the public source and, if required by the final package contract, package inventory. Do not replace it with a generic “all dependencies are MIT” statement. `package-lock.json` is the starting dependency inventory, but source/history review must also account for vendored/generated material and the separate skill.

### `docs/support-service-operations.md` — hosted boundary, not public support channel

**Analog:** current guide, especially “Production boundary,” “Default project origin,” and “Retirement and release scanning.” It establishes that ordinary local development has no hosted dependency/credentials, protected `main` deployment is the sole hosted path, canonical origins are derived and validated, and evidence is redacted.

Retain these protections when source becomes public. Clarify that the Issues URL is the public product contact channel after visibility approval, while support-service operational details remain maintainer/deployment guidance and are not the npm README. Do not expose credentials, provider IDs/secrets, PII, raw project refs, or confidential operational inputs. Do not turn the hosted support assumptions into license or access enforcement.

### `scripts/verify-production-artifacts.mjs` — reuse inventory and redaction scan

**Analog:** existing scanner functions and CLI. It runs `npm pack --dry-run --json --ignore-scripts`, then `npm pack --json --ignore-scripts --pack-destination <temp>`, extracts with `tar -xzf`, scans text extensions, rejects protected values and retired runtime terms, and validates the configured launcher/canonical-origin assignment when capability mode is supplied. It emits `Production artifact scan passed.` on success.

Relevant existing patterns:

```js
const [dryRun] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], ...));
const [pack] = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', directory], ...));
execFileSync('tar', ['-xzf', join(directory, pack.filename), '-C', directory]);
```

```js
function scanText(path, content, policy) {
  if (legacyRuntime.test(path) || legacyRuntime.test(content)) fail(...);
  if (protectedValue.test(content)) fail(...);
  // configured-absent rejects raw refs; configured mode removes only exact allowed routes
}
```

For Phase 3, reuse this as package-boundary evidence only: inventory and extracted archive scans can prove what npm would ship, and protected-value/redaction policy can keep secrets out of evidence. If a small extension is needed, add only explicit checks for required license/notice/readme metadata. Do not make it a Git-history scanner or legal approval engine.

### `scripts/verify-supabase-support.mjs` — bounded evidence patterns, not a public-source policy

**Analog:** existing `writeEvidence`, `readEvidence`, `sha256`, `redactedHostedError`, and final-evidence binding logic (bounded source ranges around lines 82–100, 297–342, 381–422, 465–545, 625–650, 938–958).

Reusable patterns:
- SHA-256 of canonical serialized records, with the digest field blanked while computing its own binding.
- Evidence readers reject protected/raw values before consuming records.
- Distinct named inputs are collected with raw-file SHA-256 bindings.
- Approval is separate from evidence and binds exact release-record bytes, run ID, and package digest (`cumpa.release-approval`).
- Redaction replaces protected values, normalizes control characters, and bounds error detail to 512 characters.

Do **not** reuse hosted-specific assumptions as Phase 3 publication proof: Supabase origin allowlists, provider authority manifests, deployment mutation guards, and configured support-launcher assignment describe the v1.4 hosted boundary, not public repository rights or npm provenance. A Phase 3 record should instead bind reviewed commit/history scope, notice/license inventory, exact metadata, approval identities/claims, and manual publication checkpoints. Keep the evidence mechanism minimal; no bespoke audit engine.

### Archived approval/review evidence — v1.4 Phase 2 summaries

**Analogs:** `.planning/milestones/v1.4-phases/02-move-the-implementation-to-supabase/02-15-SUMMARY.md`, `02-16-SUMMARY.md`, and `02-17-SUMMARY.md` (summaries only; no archived plans).

Reusable evidence shape:
- `02-15` established deterministic scans over tracked sources, rebuilt `dist`, npm inventory, and extracted package; zero violations precede emitted retirement evidence. It also established six distinct immutable inputs and a separate release approval.
- `02-16` records an immutable configured-package release, package digest, GitHub run ID, and an independent `02-16-RELEASE-APPROVAL.md` exact approval checkpoint.
- `02-17` preserves six-input final lineage and reports each path/kind/version/SHA-256 binding; its pattern is `digest-bound-evidence`, `configured-absent-collector`, `separate-human-approval`.

Apply this to Phase 3 only for review evidence: record scope and findings, redact sensitive values, hash exact artifacts, and require separate exact-text approvals. Do not claim a package digest, public repository, npm attestation, or GitHub visibility change until later execution actually produces it. Phase 5 owns actual publication and attestation results.

### Existing package fixtures — metadata changes and contract impact

**Analog:** `tests/e2e/package-assets.spec.ts` lines 1–133. It builds (when the fixture is run), executes `npm pack --json --ignore-scripts`, inspects `packResult.files`, extracts with `tar`, and asserts `dist/bin/cumpa.mjs`, `dist/cli/run.js`, `dist/web/index.html`, browser assets, and absence of `src/`, `.ts/.vue`, retired support paths, and secret-shaped names/values. It invokes `scripts/verify-production-artifacts.mjs` in configured-absent mode and exercises a clean install in later sections.

A name/version/license/repository metadata change can affect npm pack output and clean-install assertions, but no current fixture should require source-text-pinning of README or license wording. Keep the executable, `engines`, runtime/browser assets, and archive exclusions stable. If metadata acceptance is needed, assert the consumer-visible npm manifest fields at the package boundary rather than pinning implementation text. The user explicitly asked for no source-text-pinning tests.

## Shared Patterns

### Separate legal rights from package mechanics

- `LICENSE` expresses the application grant only after both licensors approve exact text.
- `THIRD_PARTY_NOTICES.md` preserves dependency/source obligations independently.
- `package.json` points at the license and repository but cannot establish ownership or relicense dependencies.
- The marketplace skill remains separately MIT-licensed and must not be folded into the application grant.

### Evidence is immutable and redacted

Use the v1.4 pattern: exact scope, named records, SHA-256 bindings, separate approval, no secrets/PII/raw credentials, bounded diagnostics. Manual checkpoints are sufficient for legal approval, contributor-rights resolution, sensitive-history review, repository visibility, and public Issues accessibility; code should not pretend to prove these human facts.

### Public source and npm package are distinct boundaries

The package scanner examines only current package inventory and extracted archive. It does not inspect all Git refs/objects or historical blobs, GitHub Actions/workflow files outside the package, issue/discussion content, commit messages, deleted files, or repository settings. A clean `npm pack` scan therefore cannot prove that making `Ship-With-AI/cumpa` (including reviewed history) public exposes no credentials, confidential operations, or material lacking publication rights. Phase 3 needs a separately documented tracked-content and history review, with destructive history rewriting stopped for explicit approval.

### Hosted/payment assumptions remain narrow

The support guide and Supabase verifier protect an optional hosted service. Public source does not authorize publishing provider credentials, confidential operational material, or payment authority internals. Keep support feature-neutral and preserve protected deployment workflow. Do not use the support endpoint or its operational URL as the product homepage/contact channel.

## Integration Points and Smallest Sufficient Recommendation

1. Update `package.json` and lockfile root metadata; preserve `bin`, Node `>=24`, exact dependencies, and existing files boundary.
2. Add the approved proprietary `LICENSE`; retain and reconcile `THIRD_PARTY_NOTICES.md`.
3. Rewrite the existing README into the self-contained exact-version npm guide; omit homepage and private operational instructions.
4. Document a Phase 3 publication-review record using redacted, digest-bound evidence and separate approvals. Require both named licensors' exact-text approval and a resolved rights/sensitive-history review before any visibility mutation.
5. Reuse `verify-production-artifacts.mjs` for package inventory/protected-value checks only. Do not extend it into history scanning or a general legal auditor.
6. Keep Phase 4 responsible for runtime tarball production and Phase 5 responsible for bootstrap/stable publication and actual OIDC/provenance/attestation results. Phase 3 supplies policy and gates, not those later artifacts.

## No Analog Found

| Artifact | Gap | Planner consequence |
|---|---|---|
| `LICENSE` | No existing application license or exact legal draft; notices are third-party obligations, not a Cumpa grant. | Plan a human approval checkpoint for exact text; do not fabricate approval or use SPDX/open-source shorthand for the application. |
| Full repository/history publication review | Package scanners cover current npm archive only. | Plan a bounded manual/command review of tracked content and reviewed Git history; separately verify GitHub visibility/Issues after approval. |
| npm provenance/attestation result | v1.4 evidence concerns hosted deployment/package security, not npm attestation. | Phase 3 documents eligible-claim policy; Phase 5 verifies emitted attestation and records actual evidence. |

## Metadata

**Analog search scope:** root package/docs/notices, `scripts/verify-production-artifacts.mjs`, bounded `scripts/verify-supabase-support.mjs`, package acceptance fixtures, and archived v1.4 Phase 2 summaries `02-15`–`02-17`. Archived PLAN bodies and unrelated historical artifacts were not read.  
**Key requirements covered:** PKG-06, PKG-07, REL-04, REL-05.  
**Pattern extraction date:** 2026-09-07
