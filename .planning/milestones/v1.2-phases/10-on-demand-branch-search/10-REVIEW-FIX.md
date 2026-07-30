# Phase 10 Review Fixes

## CR-01 — complete NUL protocol termination

- Test: `a5753ad` — `test(10): reject unterminated branch protocols`
- Fix: `0111d7e` — `fix(10): require complete NUL protocols`
- Evidence: controlled branch and abbreviation outputs with only the final NUL removed reject before candidates are returned.

## CR-02 — byte-exact UTF-8 branch identity validation

- Test: `8cef175` — `test(10): reject invalid UTF-8 branch bytes`
- Fix: `73e2fbb` — `fix(10): validate branch identity UTF-8`
- Evidence: invalid ref-suffix and label bytes are validated with `node:buffer` `isUtf8` before decoding; lookup rejects and does not start abbreviation batching.

## WR-01 — exact AbortSignal propagation and cancellation

- Test: `fd8000b` — `test(10): prove branch search cancellation`
- Evidence: recording and controlled runners assert the caller's exact signal reaches both `branch` and `log`; aborting in branch listing blocks `log`, while aborting abbreviation batching rejects before candidate publication.

## Verification

`npm exec -- vitest run tests/git/candidates.test.ts` passed: 1 file, 7 tests.

## CR-02 iteration 2 — current-worktree branch identity

- Test and fix: `201fc57` — `fix(10): validate worktree branch UTF-8`
- Evidence: controlled `worktree list --porcelain -z` output with `refs/heads/\x80` rejects discovery with `Git worktree output contained invalid UTF-8 branch identity` before any post-listing Git stage or `initialCandidates` publication. `npm exec -- vitest run tests/git/candidates.test.ts` passed: 1 file, 8 tests.

## CR-01 iteration 3 — byte-preserving OID decoding

- Test and fix: `9a2f2d9` — `fix(10): preserve OID protocol bytes`
- Evidence: branch full OID and abbreviation full/short OID fields decode with `latin1`, preserving high-bit bytes for the existing validators. Controlled runners replace otherwise-valid `a` bytes with `0xe1` in each field; each whole branch lookup rejects before candidates are constructed or published. `npm exec -- vitest run tests/git/candidates.test.ts` passed: 1 file, 8 tests.

## CR-01 iteration 4 — current-worktree OID protocol

- Test and fix: `72214a3` — `fix(10): validate current worktree OIDs`
- Evidence: current-worktree `rev-parse --verify HEAD^{commit}` and `--short=12` outputs remove only the terminal LF and decode with `latin1`; the full OID passes `GitObjectIdSchema`, and the short OID must be lowercase hexadecimal, 12..full-OID-length, and its prefix. Controlled runners supplying high-bit full/short bytes, a non-prefix short OID, or an 11-character short OID each reject discovery before `initialCandidates` publication. `npm exec -- vitest run tests/git/candidates.test.ts` passed: 1 file, 9 tests.

## Holistic review CR-01 — deferred exact framing

- Test: `60b7714` — `test(10): harden candidate protocol boundaries`
- Fix: `d6eb355` — `fix(10): reject malformed candidate protocols`
- Evidence: non-empty `git branch` and `git log` buffers now require the exact final `NUL + LF`; controlled otherwise-valid buffers with only the final LF removed reject, while empty no-match output remains a frozen valid result.

## Holistic review CR-02 — complete worktree porcelain

- Test: `60b7714` — `test(10): harden candidate protocol boundaries`
- Fix: `d6eb355` — `fix(10): reject malformed candidate protocols`
- Evidence: controlled EOF-open, missing-value, duplicate, empty-path, invalid-UTF-8-path, malformed-HEAD, empty-branch, and remote-branch records all reject before any later Git stage or initial-candidate publication. Complete separator-terminated records validate present `HEAD` OIDs and retain the no-`HEAD` unborn-worktree form.

## Holistic review CR-03 — eager local branch identity

- Test: `60b7714` — `test(10): harden candidate protocol boundaries`
- Fix: `d6eb355` — `fix(10): reject malformed candidate protocols`
- Evidence: eager `branch` fields now reuse the deferred UTF-8, non-empty `refs/heads/<suffix>` invariant; empty and `refs/remotes/origin/topic` controlled records reject discovery.

## Holistic review WR-01 — eager cancellation publication gates

- Test: `60b7714` — `test(10): harden candidate protocol boundaries`
- Fix: `d6eb355` — `fix(10): reject malformed candidate protocols`
- Evidence: discovery checks the caller signal after repository discovery, worktree listing, every eager `rev-parse`, every status call, and immediately before freezing the initial snapshot. A controlled runner aborting after a valid eager abbreviation result makes `discoverSourceCandidates()` reject rather than publish.

## Holistic verification

`npm exec -- vitest run tests/git/candidates.test.ts` passed: 1 file, 12 tests.

## Final review fixes — locked worktrees and candidate-record invariants

- Fix: `22666ef` — `fix(10): harden candidate discovery records`
- Evidence: controlled complete porcelain records with `locked` and `locked maintenance` each remain discoverable; a duplicate `locked` field still rejects.
- Evidence: duplicate deferred `refs/heads/target` records with identical and conflicting OIDs reject before `git log` (`logCalls === 0`).
- Evidence: porcelain with `HEAD` before `worktree`, or a relative `worktree` path, rejects before any post-listing `rev-parse` or `status` worktree call.

## Final review verification

`npm exec -- vitest run tests/git/candidates.test.ts` passed: 1 file, 14 tests.

## Exhaustive review fixes — worktree identity, state, and immutability

- Fix: `6702373` — `fix(10): validate worktree record identity`
- Evidence: completed absolute worktree paths are unique before inspection; controlled duplicate paths with differing attached/detached metadata reject before post-listing Git commands.
- Evidence: valued `bare`/`detached`, attached-detached, and bare-plus-HEAD/branch/detached forms reject; valid `bare`, `locked`/`prunable` labels with or without reasons, detached, and unborn forms remain accepted.
- Evidence: tests assert every eager branch/worktree candidate and every non-empty deferred branch candidate is frozen, retaining frozen empty-result checks.
- Verification: `npm exec -- vitest run tests/git/candidates.test.ts` passed: 1 file, 15 tests.

## Final malformed-output closure

- Fix: `4fa62c9` — `fix: reject malformed candidate output`
- WR-01: empty `git worktree list --porcelain -z` output now rejects before discovery can publish `initialCandidates`; a separator-terminated unborn worktree record remains accepted.
- WR-02: only an originally empty deferred branch buffer is a no-match; newline-only output rejects before abbreviation lookup.
- WR-03: porcelain field-name bytes must be ASCII before tag decoding, preventing high-bit aliases of `worktree` and `HEAD`.
- Verification: `npm exec -- vitest run tests/git/candidates.test.ts` passed: 1 file, 16 tests.
