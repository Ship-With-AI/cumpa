# Stack Research

**Project:** Diff Review  
**Researched:** 2026-07-11

## Recommendation

Use a single TypeScript package with four internal boundaries: CLI, Fastify server, shared contracts, and Vue browser UI. Invoke the installed Git executable as the comparison engine and load immutable commit blobs into Monaco Diff Editor.

| Area | Choice | Why |
|------|--------|-----|
| Runtime | Node.js 24 LTS, ESM, TypeScript | Node 24 is the current LTS as of 2026-07-11. It supports the CLI, local HTTP server, filesystem, child processes, and cross-platform browser launch without a second runtime. |
| Package manager | npm | Native `bin` packaging and the least surprising global or `npx` installation path for a single-package CLI. |
| CLI | Commander + `@inquirer/search` | Commander provides conventional command/help behavior; Inquirer provides an ordered, searchable base/head picker. |
| Git integration | `node:child_process.spawn` with argument arrays | Native Git remains the authority for refs, worktrees, merge bases, rename detection, attributes, and object reads. Avoid shell interpolation and a second Git semantics implementation. |
| Local API | Fastify 5 + `@fastify/static` | Small plugin-oriented server, schema hooks, `inject()` testing, static asset serving, explicit `127.0.0.1` binding, and ephemeral-port support. |
| Web UI | Vue 3 + Vite + TypeScript | User-selected UI stack; Vue Composition API fits review state and Vite builds the browser bundle shipped with the CLI. |
| Diff UI | Monaco Editor `createDiffEditor` | Provides side-by-side rendering, syntax highlighting, line changes, original/modified editor access, accessibility labels, hidden unchanged regions, view zones, decorations, and keyboard commands. |
| Validation | Zod | One runtime schema for HTTP payloads, repository-local drafts, and canonical review JSON. Derive TypeScript types from schemas rather than maintaining parallel interfaces. |
| Persistence | Versioned JSON with atomic replace | Repository-local drafts do not need a database. Write a temporary sibling file, fsync as appropriate, then rename to avoid partial drafts. |
| Tests | Vitest + Fastify `inject()` + Playwright | Vitest covers Git fixtures and deterministic serializers; Fastify injects API requests without ports; Playwright covers the actual picker-to-comment-to-export browser contract. |
| Build | `tsc` for Node/shared code + Vite for UI | Boring, transparent builds. Publish the server output and Vite assets in one npm package with a `bin` entry. |

## Git Boundary

Use a narrow `GitClient` adapter around `spawn('git', args, { cwd, shell: false })`. Every method returns domain values rather than raw command output:

- repository discovery and common directory
- local branch enumeration
- `git worktree list --porcelain -z` parsing
- ref/worktree `HEAD` resolution to full commit IDs
- dirty-state detection for worktree labels and warnings
- merge-base resolution
- changed-file metadata with NUL-delimited output and rename/copy status
- blob metadata and bytes by object ID

The adapter is the only module allowed to launch Git. It makes error mapping, hostile ref/path handling, fixture testing, and future Git changes local.

## Monaco Integration

Monaco's current published types expose:

- `IStandaloneDiffEditor.getOriginalEditor()` and `.getModifiedEditor()`
- `IDiffEditor.onDidUpdateDiff`
- `IDiffEditor.getLineChanges()`
- `ICodeEditor.changeViewZones()` and content-widget APIs
- `renderSideBySide`, `diffAlgorithm`, `maxFileSize`, and `hideUnchangedRegions`

Load full immutable blob contents as original and modified models. Let Monaco hide unchanged regions while retaining the ability to expand context and comment on any revealed line. Submitted comments should use view zones in the selected pane with a compensating zone on the opposite pane so diff alignment remains stable. Prototype this before committing the entire review UI to the technique.

## Version Guidance

- Require Node.js `>=24` for the first release rather than the earlier provisional `>=22` baseline; Node 24 is current LTS.
- Pin dependency ranges through the lockfile and publish tested minimums in `engines`.
- Do not add a Git JavaScript library unless the native adapter proves insufficient. Existing local-review tools using `simple-git` still ultimately depend on Git and add an abstraction that does not remove subprocess or semantic risk.

## Alternatives Considered

### `@pierre/diffs`

Strong commodity diff renderer with Shiki highlighting and virtualization; the small `diffmux` project demonstrates a compact local review flow with it. Its annotation lifecycle has caused practical integration friction in that project, and the agreed stack already uses Monaco. Keep it as a fallback if the Monaco view-zone prototype cannot preserve line alignment and comment placement.

### `react-diff-view`

Used by PRless, a close existing product. It is React-specific and conflicts with the user's explicit Vue decision.

### Rust CLI/server

Would produce an attractive standalone binary, but the UI still needs a JavaScript bundle and shared schemas would span languages. Native Git is already required for exact local repository behavior, so Rust adds build and packaging cost without improving the core invariant.

### SQLite

Unnecessary for one local reviewer and one draft writer. Versioned JSON is inspectable, export-adjacent, and easy to recover.

## Sources

- [Node.js releases](https://nodejs.org/en/about/previous-releases) — Node 24 is current LTS on the research date.
- [Fastify server reference](https://fastify.dev/docs/latest/Reference/Server/) — `listen()` supports explicit hosts and port `0`; the chosen port is available from the server address.
- [Monaco published type definitions](https://unpkg.com/monaco-editor@latest/monaco.d.ts) — current diff editor, line-change, hidden-region, decoration, and view-zone APIs.
- [Monaco Editor repository](https://github.com/microsoft/monaco-editor) — canonical implementation and examples.
- [diffmux](https://github.com/Nicomalacho/diffmux) — local agent-review precedent using `@pierre/diffs`, including documented annotation tradeoffs.
- [PRless](https://github.com/muhammadZihad/prless) — close TypeScript/Fastify/browser precedent and useful scope comparison.
