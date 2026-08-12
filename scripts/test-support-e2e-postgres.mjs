import { spawn } from 'node:child_process';

import { withTestPostgres } from '../services/support/scripts/test-postgres.mjs';

await withTestPostgres(async ({ env }) => {
  const args = process.argv.slice(2);
  const child = spawn('npx', ['playwright', 'test', ...args], {
    env,
    stdio: 'inherit',
  });
  await new Promise((resolve, reject) => child.once('exit', (code) => code === 0 ? resolve() : reject(new Error('Support E2E failed'))));
});
