import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import {
  PINNED_PUBLIC_ARTIFACT,
  assertPinnedInstalledResolution,
  buildIsolatedPath,
  isContainedPath,
} from './public-artifact-identity.js';
import { protectedEnvironment, runRuntimeCommand } from './runtime-artifact.js';

type InstallScripts = 'enabled' | 'disabled';
type Resolution = Readonly<{ version: string; resolved: string; integrity: string }>;
type RecordValue = Record<string, unknown>;

export interface InstalledPublicRuntime {
  readonly source: 'public-global' | 'public-npx';
  readonly root: string;
  readonly packageRoot?: string;
  readonly launch: Readonly<{ readonly command: string; readonly args: readonly string[] }>;
  readonly env: NodeJS.ProcessEnv;
  readonly proof: Readonly<{
    readonly packageLabel: typeof PINNED_PUBLIC_ARTIFACT.packageLabel;
    readonly resolvedTarball: string;
    readonly resolvedIntegrity: string;
    readonly resolvedVersion: string;
    readonly installScripts: InstallScripts;
    readonly binaryContainedInIsolatedPrefix: true;
    readonly manifestSha256?: string;
    readonly npmCacheEntryCountBefore?: number;
  }>;
  cleanup(): void;
}

type SharedSupportHome = Readonly<{
  readonly home: string;
  readonly owned: boolean;
  applyTo(env: NodeJS.ProcessEnv): void;
  cleanup(): void;
}>;

function fail(message: string): never {
  throw new Error(`[public-runtime] ${message}`);
}

function asRecord(value: unknown): RecordValue | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as RecordValue : undefined;
}

function npmCommand(): string {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function packageDirectory(prefix: string): string {
  return process.platform === 'win32' ? join(prefix, 'node_modules') : join(prefix, 'lib', 'node_modules');
}

function globalExecutable(prefix: string): string {
  return process.platform === 'win32' ? join(prefix, 'cumpa.cmd') : join(prefix, 'bin', 'cumpa');
}

function npmExecutable(): string {
  const candidate = join(dirname(realpathSync(process.execPath)), npmCommand());
  if (!existsSync(candidate)) fail('npm executable is not colocated with Node');
  return realpathSync(candidate);
}

function isolatedEnvironment(root: string, supportHome: SharedSupportHome): NodeJS.ProcessEnv {
  const env = protectedEnvironment(root, process.env);
  const prefix = env.npm_config_prefix;
  if (prefix === undefined) fail('isolated npm prefix is missing');
  env.PATH = buildIsolatedPath([
    join(prefix, 'bin'),
    dirname(realpathSync(process.execPath)),
    dirname(npmExecutable()),
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
  ]);
  supportHome.applyTo(env);
  return env;
}

function assertNoResolvableCumpa(root: string, env: NodeJS.ProcessEnv): void {
  const probe = spawnSync('cumpa', ['--version'], { cwd: root, env, shell: false, encoding: 'utf8' });
  if (probe.error?.code !== 'ENOENT') fail('PATH leakage resolved a pre-existing cumpa executable before install');
}

function resolutionFrom(value: unknown): Resolution | undefined {
  const record = asRecord(value);
  if (
    record === undefined || typeof record.version !== 'string'
    || typeof record.resolved !== 'string' || typeof record.integrity !== 'string'
  ) return undefined;
  return { version: record.version, resolved: record.resolved, integrity: record.integrity };
}

function resolutionFromLock(lockPath: string): Resolution | undefined {
  if (!existsSync(lockPath)) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(lockPath, 'utf8'));
  } catch {
    fail(`npm wrote malformed metadata at ${lockPath}`);
  }
  const packages = asRecord(asRecord(parsed)?.packages);
  return resolutionFrom(packages?.[`node_modules/${PINNED_PUBLIC_ARTIFACT.name}`]);
}

function assertRecordedResolution(tree: unknown, metadataPaths: readonly string[]): Resolution {
  const dependencies = asRecord(asRecord(tree)?.dependencies);
  const installed = dependencies?.[PINNED_PUBLIC_ARTIFACT.name];
  const resolution = resolutionFrom(installed) ?? metadataPaths
    .map(resolutionFromLock)
    .find((candidate): candidate is Resolution => candidate !== undefined);
  if (resolution === undefined) fail('npm did not record the installed package resolution');
  assertPinnedInstalledResolution(resolution);
  return resolution;
}

function validateManifest(packageRoot: string): Readonly<{ readonly sha256: string }> {
  const manifestPath = join(packageRoot, 'package.json');
  let parsed: unknown;
  const bytes = readFileSync(manifestPath);
  try {
    parsed = JSON.parse(bytes.toString('utf8'));
  } catch {
    fail('installed package manifest is malformed');
  }
  const manifest = asRecord(parsed);
  const bin = asRecord(manifest?.bin);
  const engines = asRecord(manifest?.engines);
  if (
    manifest?.name !== PINNED_PUBLIC_ARTIFACT.name
    || manifest.version !== PINNED_PUBLIC_ARTIFACT.version
    || bin?.cumpa !== 'dist/bin/cumpa.mjs'
    || engines?.node !== '>=24'
  ) fail('installed package manifest does not match the pinned runtime contract');
  return Object.freeze({
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
}

function assertContainedPackage(packageRoot: string, executablePath: string, isolatedRoot: string): void {
  if (!existsSync(packageRoot) || !existsSync(executablePath)) fail('npm did not create the package and generated executable');
  if (lstatSync(packageRoot).isSymbolicLink()) fail('installed package root is a symbolic link');
  const realRoot = realpathSync(isolatedRoot);
  if (
    !isContainedPath(realpathSync(packageRoot), realRoot)
    || !isContainedPath(realpathSync(executablePath), realRoot)
  ) fail('installed package or executable escaped its isolated prefix');
}

function ownedRoot(prefix: string): Readonly<{ readonly root: string; cleanup(): void }> {
  const root = mkdtempSync(join(tmpdir(), prefix));
  let cleaned = false;
  return Object.freeze({
    root,
    cleanup() {
      if (cleaned) return;
      rmSync(root, { recursive: true, force: true });
      if (existsSync(root)) fail('adapter temporary root was not removed');
      cleaned = true;
    },
  });
}

export function createSharedSupportHome(existingHome?: string): SharedSupportHome {
  const owned = existingHome === undefined;
  const home = existingHome ?? mkdtempSync(join(tmpdir(), 'cumpa-public-support-'));
  if (owned) chmodSync(home, 0o700);
  const stat = lstatSync(home);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail('shared support HOME must be a real directory');
  let cleaned = false;
  return Object.freeze({
    home,
    owned,
    applyTo(env) {
      env.HOME = home;
      env.USERPROFILE = home;
      if (process.platform === 'linux') env.XDG_STATE_HOME = join(home, 'state');
    },
    cleanup() {
      if (!owned || cleaned) return;
      rmSync(home, { recursive: true, force: true });
      if (existsSync(home)) fail('shared support HOME was not removed');
      cleaned = true;
    },
  });
}

export function installPublicGlobalRuntime(options: Readonly<{
  readonly supportHome: SharedSupportHome;
  readonly installScripts: InstallScripts;
}>): InstalledPublicRuntime {
  const temporary = ownedRoot('cumpa-public-global-');
  try {
    const env = isolatedEnvironment(temporary.root, options.supportHome);
    const prefix = env.npm_config_prefix;
    if (prefix === undefined) fail('isolated npm prefix is missing');
    assertNoResolvableCumpa(temporary.root, env);
    const installArgs = [
      'install', '--global', '--prefix', prefix, '--no-audit', '--no-fund', '--registry', 'https://registry.npmjs.org/',
      PINNED_PUBLIC_ARTIFACT.packageLabel,
    ];
    if (options.installScripts === 'disabled') installArgs.splice(4, 0, '--ignore-scripts');
    runRuntimeCommand(npmCommand(), installArgs, { cwd: temporary.root, env });
    let tree: unknown;
    try {
      tree = JSON.parse(runRuntimeCommand(npmCommand(), [
        'ls', '--global', '--prefix', prefix, '--omit=dev', '--json', '--all', '--long',
      ], { cwd: temporary.root, env }));
    } catch (error) {
      fail(`npm ls rejected the isolated public runtime tree: ${error instanceof Error ? error.message : String(error)}`);
    }
    const problems = asRecord(tree)?.problems;
    if (Array.isArray(problems) && problems.length > 0) fail('npm ls reported dependency problems');
    const packageRoot = join(packageDirectory(prefix), '@shipwithai', 'cumpa');
    const executablePath = globalExecutable(prefix);
    const resolution = assertRecordedResolution(tree, [join(packageDirectory(prefix), '.package-lock.json')]);
    assertContainedPackage(packageRoot, executablePath, prefix);
    const manifest = validateManifest(packageRoot);
    if (runRuntimeCommand(executablePath, ['--version'], { cwd: temporary.root, env }) !== `${PINNED_PUBLIC_ARTIFACT.version}\n`) {
      fail('npm-generated executable does not report the pinned version');
    }
    return Object.freeze({
      source: 'public-global',
      root: temporary.root,
      packageRoot,
      launch: Object.freeze({ command: executablePath, args: Object.freeze([]) }),
      env: Object.freeze(env),
      proof: Object.freeze({
        packageLabel: PINNED_PUBLIC_ARTIFACT.packageLabel,
        resolvedTarball: resolution.resolved,
        resolvedIntegrity: resolution.integrity,
        resolvedVersion: resolution.version,
        installScripts: options.installScripts,
        binaryContainedInIsolatedPrefix: true,
        manifestSha256: manifest.sha256,
      }),
      cleanup: temporary.cleanup,
    });
  } catch (error) {
    temporary.cleanup();
    throw error;
  }
}
