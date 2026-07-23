import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

execFileSync(npm, ['run', 'build'], { cwd: root, stdio: 'inherit' });
execFileSync(npm, ['exec', 'vitest', 'run', 'tests/package/agent-ready-export-safety.test.ts'], {
  cwd: root,
  stdio: 'inherit',
});
