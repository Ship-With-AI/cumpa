---
status: testing
phase: 03-distribution-contract-legal-boundary
source: [03-VERIFICATION.md, 03-03-SUMMARY.md]
started: 2026-09-08T13:34:02Z
updated: 2026-09-08T13:34:02Z
---

## Current Test

number: 1
name: Confirm temporary GitHub token revocation
expected: |
  The two temporary fine-grained GitHub tokens created for this publication
  session are revoked server-side in GitHub. They were used for private
  preparation and the visibility-only conversion. If the suggested names were
  retained, they are Cumpa private preparation and Cumpa visibility.
  Do not revoke the normal gh login or unrelated credentials.
  Removing local Keychain entries alone is not server-side revocation.
awaiting: user response

## Tests

### 1. Confirm temporary GitHub token revocation
expected: Both temporary preparation/visibility authorizations are revoked in GitHub, and the operator reports that outcome without sharing token material.
result: pending

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps

None in the implemented/publication behavior. Phase goal verification scored 10/10; code review is clean and the authored security threat register is closed 23/23. The only remaining human item is the administrative revocation confirmation above.

## Verified Scope and Limits

- Ship-With-AI/cumpa is public at ff72519969da8d2c0761c9533ccb27b809cd17bb.
- Anonymous repository/ref/LICENSE/Issues APIs and source/Issues HTML passed.
- Actual post-public protections matched the exact authorized disposition.
- Browser rendering was unavailable; no graphical verification is claimed.
- No npm release, extra source push, artifact deletion or unrelated setting change was authorized or performed.
- Existing owner-accepted legacy-artifact notice risk remains limited to artifacts 9907668126 and 9928300866.
