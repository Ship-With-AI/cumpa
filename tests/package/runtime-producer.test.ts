import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { chmod, lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { afterEach, describe, expect, test } from 'vitest';

const execFileAsync = promisify(execFile);
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const producerSource = join(projectRoot, 'scripts', 'pack-runtime.mjs');
const roots: string[] = [];

const origin = `https://${'a'.repeat(20)}.supabase.co`;

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

type Fixture = Readonly<{
  root: string;
  pack: string;
  custody: string;
  evidence: string;
  calls: string;
  env: NodeJS.ProcessEnv;
}>;

async function createFixture(): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), 'cumpa-runtime-producer-'));
  roots.push(root);
  const scripts = join(root, 'scripts');
  const bin = join(root, 'bin');
  await Promise.all([
    mkdir(join(root, 'src', 'native'), { recursive: true }),
    mkdir(scripts, { recursive: true }),
    mkdir(bin, { recursive: true }),
  ]);
  await Promise.all([
    writeFile(join(root, 'package.json'), JSON.stringify({
      name: '@shipwithai/cumpa',
      version: '1.5.0',
      engines: { node: '>=24' },
      bin: { cumpa: 'dist/bin/cumpa.mjs' },
      files: ['dist/', 'README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md'],
      dependencies: { fastify: '5.10.0' },
    }), 'utf8'),
    writeFile(join(root, 'package-lock.json'), '{"lockfileVersion":3}\n', 'utf8'),
    writeFile(join(root, 'README.md'), 'runtime fixture\n', 'utf8'),
    writeFile(join(root, 'LICENSE'), 'MIT fixture\n', 'utf8'),
    writeFile(join(root, 'THIRD_PARTY_NOTICES.md'), 'notices fixture\n', 'utf8'),
    writeFile(join(root, 'src', 'native', 'directory-exchange.cc'), 'native fixture\n', 'utf8'),
    writeFile(join(scripts, 'pack-runtime.mjs'), await readFile(producerSource)),
  ]);

  const calls = join(root, 'calls.log');
  const npm = join(bin, 'npm');
  await writeFile(npm, `#!${process.execPath}
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
if (args[0] === '--version') { process.stdout.write('11.12.1\\n'); process.exit(0); }
appendFileSync(process.env.CUMPA_FAKE_NPM_CALLS, args.join(' ') + '\\n');
if (args[0] === 'run' && args[1] === 'build') {
  if (process.env.CUMPA_FAKE_BUILD_FAILURE) process.exit(7);
  const dist = join(process.cwd(), 'dist');
  mkdirSync(join(dist, 'bin'), { recursive: true });
  mkdirSync(join(dist, 'web'), { recursive: true });
  mkdirSync(join(dist, 'native'), { recursive: true });
  writeFileSync(join(dist, 'bin', 'cumpa.mjs'), process.env.CUMPA_FAKE_BUNDLE_CONTENT ?? 'bin\\n');
  writeFileSync(join(dist, 'web', 'index.html'), '<html></html>\\n');
  writeFileSync(join(dist, 'native', 'directory_exchange.node'), 'native\\n');
  if (process.env.CUMPA_FAKE_FORBIDDEN_CONTENT) writeFileSync(join(dist, 'web', 'app.js.map'), '{}\\n');
  if (process.env.CUMPA_FAKE_SOURCE_DRIFT) writeFileSync(join(process.cwd(), 'README.md'), 'drifted source\\n');
  process.exit(0);
}
if (args[0] !== 'pack') process.exit(8);
const custody = args[args.indexOf('--pack-destination') + 1];
const filename = 'cumpa-1.5.0.tgz';
const expected = Buffer.from('candidate archive');
const archive = process.env.CUMPA_FAKE_ARCHIVE_SUBSTITUTION ? Buffer.from('substituted archive') : expected;
writeFileSync(join(custody, filename), archive);
if (process.env.CUMPA_FAKE_PACK_FAILURE) process.exit(9);
const files = [
  { path: 'package.json', size: 1, mode: 420 },
  { path: 'README.md', size: 1, mode: 420 },
  { path: 'LICENSE', size: 1, mode: 420 },
  { path: 'THIRD_PARTY_NOTICES.md', size: 1, mode: 420 },
  { path: 'dist/bin/cumpa.mjs', size: 4, mode: 420 },
  { path: 'dist/web/index.html', size: 14, mode: 420 },
  { path: 'dist/native/directory_exchange.node', size: 7, mode: 420 },
];
for (const file of files) file.size = statSync(join(process.cwd(), file.path)).size;
if (process.env.CUMPA_FAKE_EXTRA_FILE) files.push({ path: 'unexpected.txt', size: 1, mode: 420 });
if (process.env.CUMPA_FAKE_INVENTORY_MISMATCH) files.pop();
const result = {
  filename,
  shasum: createHash('sha1').update(expected).digest('hex'),
  integrity: 'sha512-' + createHash('sha512').update(expected).digest('base64'),
  files,
};
process.stdout.write(JSON.stringify(process.env.CUMPA_FAKE_MULTIPLE_RESULTS ? [result, result] : [result]));
`, 'utf8');
  await chmod(npm, 0o755);

  await execFileAsync('git', ['init', '--quiet'], { cwd: root });
  await execFileAsync('git', ['config', 'user.email', 'fixture@example.invalid'], { cwd: root });
  await execFileAsync('git', ['config', 'user.name', 'Fixture'], { cwd: root });
  await execFileAsync('git', ['add', '.'], { cwd: root });
  await execFileAsync('git', ['commit', '--quiet', '-m', 'fixture'], { cwd: root });

  return {
    root,
    pack: join(scripts, 'pack-runtime.mjs'),
    custody: join(root, 'custody'),
    evidence: join(root, 'runtime-evidence.json'),
    calls,
    env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}`, CUMPA_FAKE_NPM_CALLS: calls },
  };
}

type Invocation = Readonly<{ stdout: string; stderr: string }> | (Error & Readonly<{ stdout?: string; stderr?: string }>);

async function invoke(fixture: Fixture, args: readonly string[], extra: NodeJS.ProcessEnv = {}): Promise<Invocation> {
  try {
    return await execFileAsync(process.execPath, [fixture.pack, ...args], {
      cwd: fixture.root,
      env: { ...fixture.env, ...extra },
    });
  } catch (error) {
    return error as Invocation;
  }
}

function producerArgs(fixture: Fixture, purpose = 'development-check'): string[] {
  return ['--purpose', purpose, '--custody-dir', fixture.custody, '--evidence', fixture.evidence];
}

async function npmCalls(fixture: Fixture): Promise<string[]> {
  try {
    return (await readFile(fixture.calls, 'utf8')).trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}


describe('runtime archive producer', () => {
  test('distinguishes compiler source-map strings from emitted source-map payloads', async () => {
    const compiler = await createFixture();
    await invoke(compiler, producerArgs(compiler), {
      CUMPA_FAKE_BUNDLE_CONTENT: 'writer.writeComment(`//# sourceMappingURL=${url}`);',
    });
    expect(JSON.parse(await readFile(compiler.evidence, 'utf8')).archive.sha256).toMatch(/^[a-f0-9]{64}$/u);
    const directive = await createFixture();
    await invoke(directive, producerArgs(directive), {
      CUMPA_FAKE_BUNDLE_CONTENT: 'console.log(1);\n//# sourceMappingURL=app.js.map',
    });
    await expect(lstat(directive.evidence)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('rejects staged changes cancelled by unstaged bytes and extra npm inventory members', async () => {
    const staged = await createFixture();
    const readme = join(staged.root, 'README.md');
    const original = await readFile(readme);
    await writeFile(readme, 'staged modification\n');
    await execFileAsync('git', ['add', 'README.md'], { cwd: staged.root });
    await writeFile(readme, original);
    await invoke(staged, producerArgs(staged, 'candidate'), { CUMPA_RELEASE_SUPPORT_SERVICE_URL: origin });
    expect(await npmCalls(staged)).toEqual([]);
    await expect(lstat(staged.evidence)).rejects.toMatchObject({ code: 'ENOENT' });
    const extra = await createFixture();
    await invoke(extra, producerArgs(extra), { CUMPA_FAKE_EXTRA_FILE: '1' });
    await expect(lstat(extra.evidence)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('rejects malformed options, origin-valued argv, reused custody, and invalid purpose/origin combinations before child work', async () => {
    const cases = [
      [] as string[],
      ['--purpose', 'development-check', '--purpose', 'development-check', '--custody-dir', '/tmp/c', '--evidence', '/tmp/e'],
      ['--purpose', 'development-check', '--custody-dir', 'relative', '--evidence', '/tmp/e'],
      ['--purpose', 'development-check', '--custody-dir', '/tmp/c', '--evidence', '/tmp/e', '--origin', origin],
      ['--purpose', 'not-a-purpose', '--custody-dir', '/tmp/c', '--evidence', '/tmp/e'],
    ];
    for (const args of cases) {
      const fixture = await createFixture();
      const result = await invoke(fixture, args);
      const output = `${result.stdout ?? ''}${result.stderr ?? ''}${result instanceof Error ? result.message : ''}`;
      expect(output).toContain('runtime producer failed');
      expect(await npmCalls(fixture)).toEqual([]);
    }

    const reused = await createFixture();
    await mkdir(reused.custody);
    await invoke(reused, producerArgs(reused));
    expect(await npmCalls(reused)).toEqual([]);

    const candidate = await createFixture();
    await invoke(candidate, producerArgs(candidate, 'candidate'));
    expect(await npmCalls(candidate)).toEqual([]);
  });

  test('records only configured state and fingerprint, never support-origin cleartext', async () => {
    const absent = await createFixture();
    await invoke(absent, producerArgs(absent));
    const absentEvidence = JSON.parse(await readFile(absent.evidence, 'utf8'));
    expect(absentEvidence.status).toBe('development-check');
    expect(absentEvidence.support).toEqual({ configured: false });

    const configured = await createFixture();
    const result = await invoke(configured, producerArgs(configured), { CUMPA_RELEASE_SUPPORT_SERVICE_URL: origin });
    const evidenceText = await readFile(configured.evidence, 'utf8');
    const evidence = JSON.parse(evidenceText);
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}${result instanceof Error ? result.message : ''}`;
    expect(output).not.toContain(origin);
    expect(evidenceText).not.toContain(origin);
    expect(evidence.support).toEqual({
      configured: true,
      originSha256: createHash('sha256').update(origin).digest('hex'),
    });

    const deployment = await createFixture();
    await invoke(deployment, producerArgs(deployment, 'deployment-check'), { CUMPA_RELEASE_SUPPORT_SERVICE_URL: origin });
    expect(JSON.parse(await readFile(deployment.evidence, 'utf8')).status).toBe('deployment-check');

    const candidate = await createFixture();
    await invoke(candidate, producerArgs(candidate, 'candidate'), { CUMPA_RELEASE_SUPPORT_SERVICE_URL: origin });
    expect(JSON.parse(await readFile(candidate.evidence, 'utf8')).status).toBe('candidate');
  });

  test('rejects unsafe source/package inputs and source drift while retaining only disposable dirty-development identity', async () => {

    const symlinked = await createFixture();
    await symlink(join(symlinked.root, 'README.md'), join(symlinked.root, 'src', 'linked-input'));
    await invoke(symlinked, producerArgs(symlinked));
    expect(await npmCalls(symlinked)).toEqual([]);

    if (process.platform !== 'win32') {
      const special = await createFixture();
      await execFileAsync('mkfifo', [join(special.root, 'src', 'special-input')]);
      await invoke(special, producerArgs(special));
      expect(await npmCalls(special)).toEqual([]);
    }

    const forbidden = await createFixture();
    await invoke(forbidden, producerArgs(forbidden), { CUMPA_FAKE_FORBIDDEN_CONTENT: '1' });
    expect(await npmCalls(forbidden)).toEqual(['run build']);
    await expect(lstat(forbidden.evidence)).rejects.toMatchObject({ code: 'ENOENT' });

    const candidate = await createFixture();
    await writeFile(join(candidate.root, 'README.md'), 'dirty source\n');
    await invoke(candidate, producerArgs(candidate, 'candidate'), { CUMPA_RELEASE_SUPPORT_SERVICE_URL: origin });
    expect(await npmCalls(candidate)).toEqual([]);

    const development = await createFixture();
    await writeFile(join(development.root, 'README.md'), 'dirty source\n');
    await invoke(development, producerArgs(development));
    const developmentEvidence = JSON.parse(await readFile(development.evidence, 'utf8'));
    expect(developmentEvidence.source.clean).toBe(false);
    expect(developmentEvidence.source.trackedDiffSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(developmentEvidence.native.source.path).toBe('src/native/directory-exchange.cc');
    expect(developmentEvidence.native.binary.path).toBe('dist/native/directory_exchange.node');

    const drifting = await createFixture();
    await invoke(drifting, producerArgs(drifting), { CUMPA_FAKE_SOURCE_DRIFT: '1' });
    expect(await npmCalls(drifting)).toEqual(['run build']);
    await expect(lstat(drifting.evidence)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('runs one build then one pack and atomically records complete archive and inventory identity', async () => {
    const fixture = await createFixture();
    await invoke(fixture, producerArgs(fixture));
    const evidenceText = await readFile(fixture.evidence, 'utf8');
    const evidence = JSON.parse(evidenceText);
    const archive = await readFile(join(fixture.custody, evidence.archive.basename));

    expect(await npmCalls(fixture)).toHaveLength(2);
    expect((await npmCalls(fixture))[0]).toBe('run build');
    expect((await npmCalls(fixture))[1]).toMatch(/^pack --json --ignore-scripts --pack-destination /u);
    expect(evidence.kind).toBe('cumpa.runtime-artifact-evidence/v1');
    expect(evidence.archive).toMatchObject({
      basename: 'cumpa-1.5.0.tgz',
      byteLength: archive.byteLength,
      sha256: createHash('sha256').update(archive).digest('hex'),
      npmShasumSha1: createHash('sha1').update(archive).digest('hex'),
      npmIntegritySha512: `sha512-${createHash('sha512').update(archive).digest('base64')}`,
    });
    expect(evidence.archive.files).toHaveLength(7);
    expect(evidence.archive).not.toHaveProperty('path');
    expect(evidenceText).not.toContain(fixture.root);
    expect(evidence.contents.dist.files).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'dist/bin/cumpa.mjs' }),
      expect.objectContaining({ path: 'dist/web/index.html' }),
    ]));
  });

  test('denies evidence after build/pack failures, ambiguous results, inventory mismatch, or archive substitution without deleting emitted archives', async () => {
    for (const failure of [
      'CUMPA_FAKE_BUILD_FAILURE',
      'CUMPA_FAKE_PACK_FAILURE',
      'CUMPA_FAKE_MULTIPLE_RESULTS',
      'CUMPA_FAKE_INVENTORY_MISMATCH',
      'CUMPA_FAKE_ARCHIVE_SUBSTITUTION',
    ]) {
      const fixture = await createFixture();
      await invoke(fixture, producerArgs(fixture), { [failure]: '1' });
      await expect(lstat(fixture.evidence)).rejects.toMatchObject({ code: 'ENOENT' });
      if (failure !== 'CUMPA_FAKE_BUILD_FAILURE') {
        await expect(lstat(join(fixture.custody, 'cumpa-1.5.0.tgz'))).resolves.toMatchObject({ isFile: expect.any(Function) });
      }
    }
  });
});
