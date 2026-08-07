---
phase: 260729-pkw-create-help-command
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/cli/run.ts
  - tests/cli/help.test.ts
autonomous: true
requirements:
  - QUICK-260729-PKW
must_haves:
  truths:
    - "Running `cumpa --help` prints Commander help and exits successfully without starting repository discovery or the interactive picker."
    - "Running `cumpa` with no arguments retains the current interactive comparison flow."
    - "Programmatic `run(options)` calls and `CUMPA_LAUNCH_OPTIONS` packaged-session launches retain their current behavior."
  artifacts:
    - path: "src/cli/run.ts"
      provides: "Commander-owned CLI argument parsing and native help output"
    - path: "tests/cli/help.test.ts"
      provides: "Executable packaged-CLI regression coverage for help semantics"
  key_links:
    - from: "dist/bin/cumpa.mjs"
      to: "src/cli/run.ts"
      via: "the generated executable continues to import and await `run()`, which now parses CLI arguments with Commander"
      pattern: "await run\\(\\)"
---

<objective>
Expose the existing `cumpa` executable's help through Commander's native `--help`/`-h` handling while preserving every existing launch path.

Purpose: The installed Commander dependency already owns conventional CLI help; routing the executable through it is the smallest change and avoids a custom flag parser or separate help command.
Output: One Commander integration in `src/cli/run.ts` and one focused executable-boundary regression test.
</objective>

<execution_context>
@/Users/alessandro/.agents/gsd-core/workflows/execute-plan.md
@/Users/alessandro/.agents/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@package.json
@scripts/build-bin.mjs
@scripts/run-focused-vitest.mjs
@src/cli/run.ts
@tests/cli/selection.test.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Route the packaged CLI through native Commander help</name>
  <files>src/cli/run.ts, tests/cli/help.test.ts</files>
  <behavior>
    - `cumpa --help` exits with status 0, writes Commander's usage, package description, and `-h, --help` option to stdout, and writes no launch failure to stderr.
    - Help succeeds from a non-repository working directory, proving repository discovery and the interactive picker never start.
    - The generated `cumpa` entrypoint still reaches the existing interactive flow with no arguments; `run(options)` still creates a pinned comparison directly; `CUMPA_LAUNCH_OPTIONS` still launches the packaged session path.
  </behavior>
  <action>Add a focused `tests/cli/help.test.ts` executable-boundary test using `node:child_process.spawnSync` against `dist/bin/cumpa.mjs`. Run it from a non-repository temporary directory with a finite timeout and assert exit status 0, empty stderr, and stdout containing `Usage: cumpa [options]`, the existing package description `Local-first review of pinned Git comparisons`, and Commander's native `-h, --help` entry. Then import `Command` from the already-installed `commander` dependency in `src/cli/run.ts`. In only the zero-argument `run()` path, configure one command named `cumpa` with that existing package description and an async default action containing the current `CUMPA_LAUNCH_OPTIONS` dispatch: absent means `runCli({ cwd: process.cwd() })`; present means parse the payload and call `launchPinnedSession`. Await `parseAsync(process.argv)` so Commander handles `--help` and `-h` before the action. Preserve the `run(options)` overload and `runCli` unchanged. Do not edit `package.json` or `scripts/build-bin.mjs`, add a custom help option/parser/subcommand, duplicate help text, or add a dependency: Commander 15 and the generated entrypoint already exist.</action>
  <verify>
    <automated>npm run build:runtime &amp;&amp; node scripts/run-focused-vitest.mjs tests/cli/help.test.ts</automated>
  </verify>
  <done>The focused test passes against the generated executable; `cumpa --help` returns native Commander help without entering Git/picker startup; the existing no-argument, packaged-session, and programmatic branches remain structurally intact.</done>
</task>

</tasks>

<verification>
1. Build the runtime so `dist/bin/cumpa.mjs` exercises the same `run()` entrypoint shipped by the package.
2. Run only `tests/cli/help.test.ts`; it must prove successful help output from outside a Git repository and no stderr launch failure.
3. Inspect the change scope: only `src/cli/run.ts` and `tests/cli/help.test.ts` may be application/test modifications, with no package, generated-entrypoint, or unrelated planning changes.
</verification>

<success_criteria>
- `cumpa --help` and Commander's native `-h` alias are available through the shipped executable.
- Help is emitted before any repository-dependent or interactive work.
- Existing launch behavior is preserved behind the command's default action.
- The implementation reuses installed Commander and changes no package metadata or generated-bin template.
</success_criteria>

<output>
Create `.planning/quick/260729-pkw-create-help-command/260729-pkw-SUMMARY.md` when execution is complete.
</output>
