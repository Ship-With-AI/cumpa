# Rights Review Inventory

**Record kind:** `cumpa.rights-review`  
**Version:** 1  
**Status:** `blocked`  
**Purpose:** A public-safe factual inventory for maintainer or qualified-reviewer decisions. It is not a license grant, ownership determination, compatibility opinion, or publication approval.

## Review boundary

This record inventories the current application, package candidate, and known review candidates. Every authority, provenance, compatibility, notice-sufficiency, privacy, and holder/year judgment remains `blocked` until an attributable reviewer supplies an exact disposition and evidence reference. Git authorship, repository ownership, package metadata, and SPDX strings are inventory inputs only; none proves authority or compatibility.

No credential values, provider IDs, OAuth material, or raw protected values belong in this committed record. Exact sensitive evidence remains in the ignored publication-audit workspace.

## First-party authority

### Git identity inventory

| Identity role | Observed identity | Scope | Authority conclusion |
|---|---|---|---|
| Author and committer | Alessandro Magionami `<alessandro.magionami@gmail.com>` | All reachable commits observed by `git log --all --format='%aN <%aE>|%cN <%cE>' \| sort -u` | `blocked`: Git metadata is not ownership or licensing proof. |
| Tagger | None observed under `refs/tags` | Current local tag inventory | `blocked`: absence of tags does not settle non-Git contributions. |

The listed Gmail address will be exposed with the intended history unless a separately authorized history decision changes that fact. This is a review candidate, not consent or authorization.

### Required authority review

| Review subject | Inventory fact | Required reviewer evidence | Status |
|---|---|---|---|
| Employer, client, and school ownership or policy | Not determined from repository metadata. | Ownership/policy review for every contribution period and entity with a possible claim. | `blocked` |
| Assignments, permissions, and disclaimers | No authority document is inferred from Git history. | Exact non-secret reference to each assignment, permission, policy, or disclaimer. | `blocked` |
| Supplied, paired, and squashed contributions | Commit metadata alone cannot enumerate these contributions. | Contributor/material inventory and authority evidence for supplied patches, pair work, and squash-only work. | `blocked` |
| Copied or adapted material | No automated conclusion; candidates include snippets, templates, fixtures, schemas, assets, fonts, SQL, workflows, and documentation. | Origin, terms, retained notices, modification status, and compatibility decision per material. | `blocked` |
| Vendored or bundled material | Browser/package inventories show bundled output; source ownership is not inferred. | Per-material origin, notice, and compatibility disposition. | `blocked` |
| Generated output | `dist/` contains generated server, browser, and native outputs. | Generator/source provenance and authority to distribute generated results. | `blocked` |
| AI-assisted material | No tool or prompt provenance is inferred from authorship. | Tool/source provenance, reviewed material scope, and maintainer responsibility/authority statement. | `blocked` |

## Public-data review candidates

| Candidate | Factual source | Required exact-scope decision | Status |
|---|---|---|---|
| Absolute home paths | Historical planning material includes `/Users/alessandro/...` paths. | `accepted-public` only for each reviewed location, or approved remediation and rescan. | `blocked` |
| TrustLayer references and OIDs | Historical planning material contains TrustLayer repository/branch/OID references. | Exact reviewed locations and disclosure rationale, or approved remediation and rescan. | `blocked` |
| Canonical Supabase origin | Existing operations policy permits the complete canonical public origin while forbidding bare project refs and protected values. | Exact-scope `accepted-public` record referencing that policy; no global allowlist. | `blocked` |
| Production identifiers | Historic deployment evidence includes operational identifiers. | Per-item private-data classification and disposition. | `blocked` |

## Conveyed-material inventory

### Observed package and build forms

- `npm pack --dry-run --ignore-scripts --json` on `cumpa@0.0.0` reports 143 files. It includes `.kimi-code/skills/cumpa/SKILL.md`, the compiled `dist/` application, browser assets, Monaco workers, the `codicon` font, and `dist/native/directory_exchange.node`.
- `dist/` contains compiled CLI, Git, server, contract, domain, draft, and export JavaScript; browser assets and workers under `dist/web/assets/`; and a native `directory_exchange.node` artifact.
- The root manifest names runtime/server/browser candidates: `@fastify/static`, `@inquirer/search`, `commander`, `fastify`, `markdown-it`, `monaco-editor`, `open`, `vue`, and `zod`. Development-only lockfile entries are not treated as conveyed material merely because they appear in `package-lock.json`.
- `monaco-editor@0.55.1` identifies its canonical repository as `https://github.com/microsoft/monaco-editor`. Its package metadata says `MIT`; that metadata is a candidate only. Monaco browser output is concretely conveyed through workers and assets, including `codicon-ngg6Pgfi.ttf`.

## Material and dependency ledger

Each row records inventory facts only. Terminal dispositions may be only `resolved` or exact-scope `accepted-public`; no row has reached a terminal disposition.

| Identity | Canonical origin | Shipped form | SPDX/upstream license and notice digest | Obligations to review | GPL disposition | Resolution evidence | Status |
|---|---|---|---|---|---|---|---|
| First-party Cumpa source | This repository; exact contribution authority unverified | Source, compiled CLI/server/contracts, documentation, browser build | Intended root expression is `GPL-3.0-or-later`; root canonical text is not yet installed | Confirm every contributor/owner can grant the application license and retain required notices | Qualified-reviewer decision required | Named reviewer, UTC time, row rationale, non-secret authority references | `blocked` |
| Cumpa native exchange artifact | First-party build source and native build toolchain; provenance not yet attested | `dist/native/directory_exchange.node` in dry-run package | License/origin evidence requires source/build review | Source availability, generated-output provenance, and notice obligations | Qualified-reviewer decision required | Generator/source/material record and reviewer approval | `blocked` |
| Cumpa browser bundle and generated workers | First-party Vite output plus incorporated dependencies | `dist/web/assets/`, including workers and codicon font | Bundled-byte provenance requires reviewed source and notices | Retain applicable third-party notices and identify generated/source relationships | Qualified-reviewer decision required | Bundle inventory, notices, and reviewer disposition | `blocked` |
| Monaco Editor 0.55.1 and incorporated third-party material | `https://github.com/microsoft/monaco-editor`, `node_modules/monaco-editor/ThirdPartyNotices.txt` | Browser editor assets, Monaco workers, codicon font | Package metadata: `MIT`; upstream notice file SHA-256 `790537262fc78a764e121e6b92b959bcd3f5c310b47d9d9b9e92e17fe0af5336` | Preserve incorporated notices and evaluate every included upstream term against conveyed bytes | Qualified-reviewer decision required | `THIRD_PARTY_NOTICES.md` retains the exact upstream notice bytes; reviewer must bind its digest and disposition | `blocked` |
| Server/runtime npm dependencies | Root `package.json` direct dependencies; exact installed source and runtime use require review | Installed runtime dependencies used by the CLI/server and package consumers | Lockfile license strings are candidates only; no blanket package-family conclusion | Identify actual runtime inclusion, source/license text, notices, and compatibility | Qualified-reviewer decision required | Per-dependency conveyed-form inventory and reviewer disposition | `blocked` |
| Skill delegation artifact | `.kimi-code/skills/cumpa/SKILL.md` | Included in the current dry-run package; independently distributed in a later phase | Intended scoped MIT license lacks approved holder/year | Confirm thin scope, independent distribution boundary, holder/year, and authority | Qualified-reviewer decision required | Named reviewer, holder/year, scoped-license text, and package-boundary decision | `blocked` |
| Copied/adapted snippets, templates, fixtures, schemas, assets, fonts, SQL, workflows, and documentation | Origins not established by this inventory | Source, generated output, documentation, or package input as applicable | Origin/license/notice evidence not yet supplied | Identify every adapted item and preserve terms/notices | Qualified-reviewer decision required | Per-item origin, terms, modification, and reviewer evidence | `blocked` |
| Supplied, paired, squashed, generated, and AI-assisted material | May be absent from Git authorship | Any source, generated, documentation, or package form | Provenance and license/authority evidence not yet supplied | Establish contributor/tool/source authority and any required notices | Qualified-reviewer decision required | Per-material provenance and reviewer evidence | `blocked` |

## Notice-source binding

`THIRD_PARTY_NOTICES.md` retains `node_modules/monaco-editor/ThirdPartyNotices.txt` verbatim before its separated review-provenance block. The upstream notice source has SHA-256 `790537262fc78a764e121e6b92b959bcd3f5c310b47d9d9b9e92e17fe0af5336`; Task 2 must confirm the final committed notice-file digest and all retained-notice obligations before any license artifact is added.

## Decision record required for Task 2

An `approve-exact-record` decision must name the reviewer, UTC time, exact application holder/year, exact scoped-skill holder/year, and evidence-backed rationale/disposition for every row above. It must also bind the final notice digest and state whether each public-data candidate is `resolved` or exact-scope `accepted-public`. Silence, a blanket approval, Git authorship, repository ownership, lockfile metadata, or an SPDX string is insufficient.

Until such a record exists, this inventory remains `blocked` and no GPL or MIT license text, package license metadata, or completed rights disposition may be produced from it.
