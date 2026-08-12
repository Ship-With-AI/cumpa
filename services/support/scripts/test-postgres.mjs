import { randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';

const name = `cumpa-support-test-${process.pid}-${randomUUID().slice(0, 8)}`;
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `${command} failed`);
  return result.stdout.trim();
};
const remove = () => spawnSync('docker', ['rm', '-f', name], { stdio: 'ignore' });
const stop = () => {
  remove();
  process.exit(1);
};

process.once('SIGINT', stop);
try {
  run('docker', ['run', '-d', '--name', name, '-e', 'POSTGRES_USER=cumpa', '-e', 'POSTGRES_PASSWORD=cumpa', '-e', 'POSTGRES_DB=cumpa_test', '-p', '127.0.0.1::5432', 'postgres:17.6-alpine']);
  const port = run('docker', ['port', name, '5432/tcp']).match(/:(\d+)$/)?.[1];
  if (!port) throw new Error('Docker did not publish PostgreSQL port');
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (spawnSync('docker', ['exec', name, 'pg_isready', '-U', 'cumpa', '-d', 'cumpa_test'], { stdio: 'ignore' }).status === 0) break;
    if (attempt === 29) throw new Error('PostgreSQL did not become ready');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const env = { ...process.env, TEST_DATABASE_URL: `postgresql://cumpa:cumpa@127.0.0.1:${port}/cumpa_test` };
  await new Promise((resolve) => setTimeout(resolve, 1000));
  run(process.execPath, ['scripts/migrate.mjs'], { env });
  const paths = process.argv.slice(2);
  const test = spawn(process.execPath, ['node_modules/vitest/vitest.mjs', '--run', ...(paths.length > 0 ? paths : ['tests/postgres-payment.integration.test.ts'])], { stdio: 'inherit', env });
  await new Promise((resolve, reject) => test.once('exit', (code) => code === 0 ? resolve() : reject(new Error('PostgreSQL integration tests failed'))));
} catch (error) {
  process.stderr.write(spawnSync('docker', ['logs', name], { encoding: 'utf8' }).stdout);
  throw error;
} finally {
  remove();
}
