---
phase: 01-pinned-local-comparison
plan: 08
subsystem: loopback-session-security
status: complete
tags: [fastify, security, bearer, capabilities, csp, playwright]
requires:
  - phase: 01-pinned-local-comparison
    plan: 07
    provides: Frozen opaque inventory IDs and immutable availability metadata
provides:
  - Per-process 256-bit fragment bearer removed from browser history and retained only in client closure memory
  - Fail-closed Fastify onRequest boundary over exact post-bind Host, optional exact Origin, and API bearer
  - Strict metadata-only session and file capability GET routes with generic non-leaking failures
  - Security headers and no-store policy across static, successful API, and rejected responses
affects:
  - 01-09
  - 01-10
  - 01-12
  - Phase 2 immutable blob content
tech-stack:
  added: []
  patterns:
    - Bind session authority only after Fastify exposes the actual 127.0.0.1 ephemeral port
    - Keep static navigation bearer-free because URL fragments never cross HTTP; require bearer on every API request
    - Resolve browser-visible files only through frozen opaque capability IDs
key-files:
  created:
    - src/contracts/api.ts
    - src/server/capabilities.ts
    - src/server/routes.ts
    - src/server/security.ts
    - src/web/api/client.ts
    - tests/api/security.test.ts
    - tests/api/session.test.ts
  modified:
    - src/cli/run.ts
    - src/git/comparison.ts
    - src/server/app.ts
    - src/web/App.vue
    - tests/e2e/pinned-session.spec.ts
key-decisions:
  - Static assets require exact Host and optional exact Origin but not the fragment bearer; only API requests require Authorization.
  - Session responses expose pinned labels, commit IDs, merge base, opaque file IDs, display metadata, and availability while repository roots and blob IDs stay server-side.
  - All denied, malformed, unknown, and unsupported requests return fixed generic JSON while terminal diagnostics contain only a correlation ID and safe reason code.
patterns-established:
  - SessionSecurity: global onRequest guard runs before routing, validation, capability lookup, static serving, or Git work.
  - SessionClient: immediately erases the token fragment, then offers only fixed typed GET methods carrying the closure-held bearer.
requirements-completed: [SAFE-02, SAFE-03]
duration: 26min
completed: 2026-07-20
---

# Phase 01 Plan 08: Closed Loopback Capability Boundary Summary

**The loopback server now fails closed around the actual ephemeral authority, a per-process fragment bearer, strict metadata-only capability routes, and non-leaking browser and terminal failures.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-07-20T13:57:18Z
- **Completed:** 2026-07-20T14:23:19Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Added a random 32-byte base64url bearer generated before app construction, embedded only in the initial URL fragment, erased synchronously with `history.replaceState`, and retained only inside the typed browser client closure.
- Added an early global Fastify request boundary that denies until post-listen binding, then enforces the exact `127.0.0.1:<ephemeral-port>` Host, absent-or-exact Origin, and API bearer before route validation, capability lookup, static handling, or Git work.
- Replaced the raw comparison endpoint with strict `GET /api/session` and `GET /api/files/:fileId` metadata contracts backed exclusively by an in-memory frozen opaque capability registry.
- Applied `no-store`, `no-referrer`, `nosniff`, `DENY`, and same-origin CSP headers to static pages, API successes, and denials without enabling CORS.
- Proved packaged Chromium launch removes the fragment, sends the bearer automatically, rejects direct unauthenticated loopback API requests, and preserves authenticated browser operation.

## Task Commits

The plan followed the required RED then GREEN sequence:

1. **Task 1 — RED: specify closed loopback and capability contracts** — `4d7e780` (`test(01-08): specify closed loopback capability boundary`)
2. **Task 2 — GREEN: enforce the boundary end to end** — `fdd9c87` (`feat(01-08): enforce loopback capability boundary`)

No separate refactor commit was needed; the GREEN implementation keeps security policy, route grammar, capability mapping, and browser token handling in their owning modules.

## TDD Evidence

### RED

- `npm run test:api -- tests/api/security.test.ts tests/api/session.test.ts`
  - Exited 1.
  - Both files loaded and all 31 named behavioral tests reached assertions.
  - Failures demonstrated the previous route returned 200 without bearer, accepted wrong Host and Origin, exposed raw comparison authority and blob metadata, lacked file capabilities and security headers, and emitted non-generic framework errors.
- RED committed before production implementation as `4d7e780`.

### GREEN

- `npm run test:api -- tests/api/security.test.ts tests/api/session.test.ts`
  - Exited 0.
  - 2 files and 31 tests passed.
- `npm run test:package -- tests/e2e/pinned-session.spec.ts --grep "fragment token protects loopback API"`
  - Exited 0.
  - 1 packaged Chromium test passed, including its runtime and web build prerequisite.

## Authorization Matrix

| Request | Host | Origin | Bearer | Result | Work allowed |
|---|---|---|---|---|---|
| Any request before post-bind security binding | any | any | any | `403` generic denial | none |
| Static navigation | exact | absent or exact | absent | allowed | static asset only |
| Static navigation | wrong | any | any | `403` generic denial | none |
| Static navigation | exact | foreign | any | `403` generic denial | none |
| `/api/*` | exact | absent or exact | exact | route validation and capability dispatch | frozen metadata only |
| `/api/*` | exact | absent or exact | absent or wrong | `401` generic denial | none |
| Known route with extra query authority | exact | absent or exact | exact | `400` generic denial | no capability lookup |
| Unknown method, route, traversal-like ID, or capability | exact | absent or exact | exact | generic `400`/`404` denial | no Git or filesystem work |

## Zero-Work and Capability Proof

- The security guard is registered before API routes and `@fastify/static`, so unbound, Host, Origin, and bearer denials terminate in `onRequest`.
- Strict query schemas disable Fastify's additional-property removal and reject repository, ref, commit, object, blob, path, Git option, export path, and mutation authority before the file handler runs.
- Malformed opaque IDs return the same generic `404` as unknown capabilities without invoking the registry lookup seam.
- Valid capability lookups access only a process-local `Map` populated from the already-frozen comparison. The route layer performs no Git subprocess, object read, ref resolution, path lookup, or filesystem access.
- Session and file DTOs omit `repositoryRoot`, `objectFormat`, `hasCommittedChanges`, `oldBlobOid`, and `newBlobOid`; strict Zod schemas reject accidental additions.

## Token and Non-Leak Guarantees

- The CLI creates exactly 32 random bytes per launch and passes the base64url token into server construction before listening.
- The expected Host and Origin remain unset until the actual loopback socket reports its ephemeral port; requests fail closed until the binding is frozen.
- The initial browser URL carries `#token=...`, which HTTP never transmits. The browser client parses it and calls `history.replaceState` before any asynchronous request.
- The client exposes only `getSession` and `getFileMetadata`; callers cannot submit arbitrary routes, refs, objects, paths, Git flags, export destinations, or mutation bodies.
- API denials and browser messages use locked generic copy. Terminal diagnostics expose only a random correlation ID and safe reason code, never token candidates, capability IDs, paths, object IDs, request bodies, URLs, or Git stderr.
- Fastify logging remains disabled, and no CORS headers are emitted.

## Security Headers

Every response path is finalized with:

- `Cache-Control: no-store`
- `Referrer-Policy: no-referrer`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- CSP restricted to same-origin scripts, styles, connections, images, and fonts, with `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'none'`, and `form-action 'none'`

## Decisions Made

- API bearer verification uses equal-length buffers and `timingSafeEqual`; missing or differently sized candidates fail without comparison.
- Origin is optional for non-browser clients but, when present, must equal the post-bind origin exactly. Host is always mandatory and exact.
- Unknown and traversal-like file identifiers intentionally share the same generic response, preventing capability enumeration through error detail.
- API response types are separate strict contracts instead of reusing `PinnedComparison`, making authority omission structural rather than handler convention.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected RED fixtures to satisfy the existing changed-file contract**

- **Found during:** Task 2 registry construction
- **Issue:** New test fixtures omitted the already-required one-letter status code and nullable similarity fields, so they would fail shared comparison parsing before exercising security behavior.
- **Fix:** Added exact `M`, `R`, and `D` status codes and explicit null similarity where appropriate; browser/API expected DTOs remain deliberately metadata-minimal.
- **Files modified:** `tests/api/security.test.ts`, `tests/api/session.test.ts`
- **Verification:** Focused API command passed all 31 behavioral tests.
- **Committed in:** `fdd9c87`

**2. [Rule 3 - Blocking] Stabilized Node Buffer generic inference exposed by the required package build**

- **Found during:** Packaged Chromium verification prerequisite
- **Issue:** TypeScript inferred `Buffer<ArrayBuffer>` for an empty merge-base initializer but the Git runner returns `Buffer<ArrayBufferLike>`, blocking the required build before Playwright could run.
- **Fix:** Annotated the existing merge-base accumulator as `Buffer<ArrayBufferLike>` without changing runtime behavior or Git authority.
- **Files modified:** `src/git/comparison.ts`
- **Verification:** The package command completed its build prerequisite and passed the named Chromium test.
- **Committed in:** `fdd9c87`

---

**Total deviations:** 2 auto-fixed (1 fixture correctness, 1 blocking type inference)
**Impact on plan:** Both fixes were required to exercise the locked contracts; neither adds product scope or runtime authority.

## Known Stubs

None. Stub scan across every touched production file found no TODO, FIXME, placeholder, coming-soon, stub, or not-implemented path.

## Threat Model Verification

- **SAFE-02:** Initial fragment secret is 256-bit process-local entropy, removed from history synchronously, required on all API routes, absent from API bodies, browser copy, diagnostics, logs, persistence, and referrers.
- **SAFE-03:** Exact post-bind Host, absent-or-exact Origin, API bearer, no CORS, strict route grammar, opaque capabilities, metadata-only responses, and generic denials prevent browser-origin, DNS-rebinding-style, and confused-deputy authority expansion.
- Rejected requests perform no route capability lookup, Git subprocess, filesystem traversal, object access, ref resolution, export, or mutation.
- No unplanned remote network, write, database, plugin, dependency, or authentication surface was introduced.

## User Setup Required

None.

## Next Phase Readiness

- Plan 01-09 can consume the strict typed session file list without receiving repository or blob authority.
- Plans 01-10 and 01-12 can fetch individual file metadata only through opaque session capabilities and the closure-authenticated client.
- Phase 2 can add immutable blob content behind the same early boundary without broadening browser request grammar.
- No blockers remain.

## Self-Check: PASSED

- Summary exists at `.planning/phases/01-pinned-local-comparison/01-08-SUMMARY.md`.
- RED commit `4d7e780` and GREEN commit `fdd9c87` are present in required order.
- Seven created artifacts and five modified artifacts exist; focused API and packaged browser verification passed.
- Unrelated `.planning/config.json` and `.planning/forensics/` changes remain untouched.

---
*Phase: 01-pinned-local-comparison*
*Completed: 2026-07-20*
