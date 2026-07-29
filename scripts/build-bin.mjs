import { chmod, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const outputRoot = resolve(import.meta.dirname, '../dist');
const binDirectory = resolve(outputRoot, 'bin');
const executablePath = resolve(binDirectory, 'compare.mjs');
const executable = `#!/usr/bin/env node
import { run } from '../cli/run.js';

await run();
`;

await rm(outputRoot, { force: true, recursive: true });
await mkdir(binDirectory, { recursive: true });
await writeFile(executablePath, executable, 'utf8');
await chmod(executablePath, 0o755);
