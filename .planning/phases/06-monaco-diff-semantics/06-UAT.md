---
status: testing
phase: 06-monaco-diff-semantics
source: [06-VERIFICATION.md]
started: 2026-07-27T09:52:38Z
updated: 2026-07-27T09:52:38Z
---

## Current Test

number: 1
name: Full token, diff, and selection contrast matrix
expected: |
  All specified text composites meet 4.5:1 and meaningful cue boundaries meet 3:1.
awaiting: user response

## Tests

### 1. Full token, diff, and selection contrast matrix
expected: All specified text composites meet 4.5:1 and meaningful cue boundaries meet 3:1.
result: [pending]

### 2. All named Monaco surfaces
expected: Hidden hunk controls, separator, widget, hover widget, and scrollbars use the approved dark semantic roles, with purple restricted to hunk/context cues.
result: [pending]

### 3. Seven overlap states and grayscale interpretation
expected: At 1280×760, each independent cue remains visible, no state erases diff meaning, and Base/Head remain identifiable without red/green.
result: [pending]

### 4. Active cursor and comment action across required widths
expected: At 1440, 1280, 1100, 768, and 640px, active-line edge and number remain legible while the native 32px comment action and all measured geometry remain unchanged.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
