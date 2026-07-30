# Spike Conventions

Patterns established across spike sessions. New spikes follow these unless the question requires otherwise.

## Stack

- Use Node.js 24 `.mjs` scripts and the installed Git CLI; add no spike-only dependencies.
- Benchmark the compiled production module graph after `npm run build:node` when startup cost is under investigation.

## Structure

- Build representative repositories under the operating-system temporary directory and delete them in `finally`.
- Use `git fast-import` to create large distinct object/ref sets without making fixture setup dominate the session.

## Patterns

- Keep fixture creation outside measured intervals.
- Measure process-start boundaries from a parent process; emit machine-readable JSON from the child probe.
- Report Git subprocess counts alongside elapsed time so constant-process and per-item designs remain distinguishable.

## Tools & Libraries

- Node.js standard library
- Installed Git CLI
