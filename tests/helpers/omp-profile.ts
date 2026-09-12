import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { buildIsolatedPath, isContainedPath } from './public-artifact-identity.js';
import { inheritedEnvironment, runRuntimeCommand } from './runtime-artifact.js';

type SharedSupportHome = Readonly<{
  readonly home: string;
  applyTo(env: NodeJS.ProcessEnv): void;
}>;

type ProfilePaths = Readonly<{
  readonly ompRoot: string;
  readonly home: string;
  readonly agentDir: string;
  readonly xdgConfigDir: string;
  readonly xdgDataDir: string;
  readonly xdgStateDir: string;
  readonly xdgCacheDir: string;
}>;
const projectRoot = resolve(import.meta.dirname, '../..');
const publishedSkillSha256 = '8974c947bceaf2921fdd74ea900c8af6a85c1c9f94428f66f53eea923d630220';
const credentialVariables = [
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_OAUTH_TOKEN',
  'CLAUDE_CODE_OAUTH_TOKEN',
  'OPENAI_API_KEY',
  'OPENAI_CODEX_OAUTH_TOKEN',
] as const;
const redirectedVariables = [
  'PI_CODING_AGENT_DIR',
  'XDG_CONFIG_HOME',
  'XDG_DATA_HOME',
  'XDG_STATE_HOME',
  'XDG_CACHE_HOME',
] as const;

type Digest = Readonly<{ readonly present: boolean; readonly sha256?: string }>;
type RealOmpProfileDigest = Readonly<Record<'marketplaces' | 'installedPlugins', Digest>>;

export interface IsolatedOmpProfile {
  readonly root: string;
  readonly home: string;
  readonly agentDir: string;
  readonly xdgConfigDir: string;
  readonly xdgDataDir: string;
  readonly xdgStateDir: string;
  readonly xdgCacheDir: string;
  readonly env: NodeJS.ProcessEnv;
  readonly pluginTreeRoot: string;
  cleanup(): void;
}

function fail(message: string): never {
  throw new Error(`[omp-profile] ${message}`);
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function digest(path: string): Digest {
  if (!existsSync(path)) return Object.freeze({ present: false });
  const entry = lstatSync(path);
  if (!entry.isFile() || entry.isSymbolicLink()) fail(`real OMP profile state is not a regular file: ${path}`);
  return Object.freeze({ present: true, sha256: sha256(path) });
}

function hasContents(path: string): boolean {
  return readdirSync(path, { recursive: true }).length > 0;
}
function ompExecutable(): string | undefined {
  const path = inheritedEnvironment(process.env).PATH;
  if (path === undefined) return undefined;
  for (const directory of path.split(delimiter)) {
    const candidate = join(directory, process.platform === 'win32' ? 'omp.cmd' : 'omp');
    if (existsSync(candidate) && lstatSync(candidate).isFile()) return realpathSync(candidate);
  }
  return undefined;
}

function requireOmp(): string {
  return ompExecutable() ?? fail('omp executable is unavailable');
}


function profilePaths(root: string): ProfilePaths {
  const ompRoot = join(root, 'omp');
  return Object.freeze({
    ompRoot,
    home: join(ompRoot, 'home'),
    agentDir: join(ompRoot, 'agent'),
    xdgConfigDir: join(ompRoot, 'xdg-config'),
    xdgDataDir: join(ompRoot, 'xdg-data'),
    xdgStateDir: join(ompRoot, 'xdg-state'),
    xdgCacheDir: join(ompRoot, 'xdg-cache'),
  });
}

function createDirectories(paths: ProfilePaths): void {
  for (const path of Object.values(paths)) mkdirSync(path, { recursive: true, mode: 0o700 });
}

function isolatedEnvironment(
  paths: ProfilePaths,
  cliPrefixBin?: string,
  extraPath: readonly string[] = [],
): NodeJS.ProcessEnv {
  const omp = requireOmp();
  const env = inheritedEnvironment(process.env);
  for (const variable of credentialVariables) delete env[variable];
  Object.assign(env, {
    HOME: paths.home,
    USERPROFILE: paths.home,
    PI_CODING_AGENT_DIR: paths.agentDir,
    XDG_CONFIG_HOME: paths.xdgConfigDir,
    XDG_DATA_HOME: paths.xdgDataDir,
    XDG_STATE_HOME: paths.xdgStateDir,
    XDG_CACHE_HOME: paths.xdgCacheDir,
  });
  const nodeBin = dirname(realpathSync(process.execPath));
  env.PATH = buildIsolatedPath([
    ...(cliPrefixBin === undefined ? [] : [cliPrefixBin]),
    nodeBin,
    dirname(omp),
    ...extraPath,
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
  ]);
  return env;
}

function locateInstalledSkill(profile: ProfilePaths): string {
  const candidates = [
    join(profile.xdgDataDir, 'omp', 'plugins', 'cache'),
    join(profile.ompRoot, '.omp', 'plugins', 'cache'),
  ];
  for (const root of candidates) {
    if (!existsSync(root)) continue;
    for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name !== 'cumpa') continue;
      const candidate = join(entry.parentPath, entry.name);
      if (existsSync(join(candidate, 'SKILL.md'))) return candidate;
    }
  }
  fail('installed marketplace tree does not contain skills/cumpa/SKILL.md');
}

function assertInstalledSkill(skillDirectory: string): void {
  const skillRealpath = realpathSync(skillDirectory);
  if (isContainedPath(skillRealpath, realpathSync(projectRoot))) fail('installed Cumpa skill resolves inside the Cumpa checkout');
  if (sha256(join(skillRealpath, 'SKILL.md')) !== publishedSkillSha256) fail('installed Cumpa SKILL.md digest does not match the published marketplace copy');
}

/** Runs only read-only OMP inspection inside a throwaway profile. */
export function discoverOmpIsolationCapability(): {
  readonly ompAvailable: boolean;
  readonly ompVersion?: string;
  readonly honoredVariables: readonly string[];
  readonly unhonoredVariables: readonly string[];
} {
  const omp = ompExecutable();
  if (omp === undefined) {
    return Object.freeze({ ompAvailable: false, honoredVariables: Object.freeze([]), unhonoredVariables: Object.freeze([...redirectedVariables]) });
  }
  const version = spawnSync(omp, ['--version'], { encoding: 'utf8', shell: false });
  if (version.error !== undefined || version.status !== 0) {
    return Object.freeze({ ompAvailable: false, honoredVariables: Object.freeze([]), unhonoredVariables: Object.freeze([...redirectedVariables]) });
  }
  const root = mkdtempSync(join(tmpdir(), 'cumpa-omp-probe-'));
  try {
    const paths = profilePaths(root);
    createDirectories(paths);
    const env = isolatedEnvironment(paths);
    const result = spawnSync(omp, ['plugin', 'list'], { cwd: root, env, encoding: 'utf8', shell: false });
    if (result.error !== undefined || result.status !== 0) fail(`OMP isolation probe failed: ${result.stderr}`);
    const observations: Readonly<Record<(typeof redirectedVariables)[number], boolean>> = Object.freeze({
      PI_CODING_AGENT_DIR: hasContents(paths.agentDir),
      XDG_CONFIG_HOME: hasContents(paths.xdgConfigDir),
      XDG_DATA_HOME: hasContents(paths.xdgDataDir),
      XDG_STATE_HOME: hasContents(paths.xdgStateDir),
      XDG_CACHE_HOME: hasContents(paths.xdgCacheDir),
    });
    return Object.freeze({
      ompAvailable: true,
      ompVersion: version.stdout.trim(),
      honoredVariables: Object.freeze(redirectedVariables.filter((variable) => observations[variable])),
      unhonoredVariables: Object.freeze(redirectedVariables.filter((variable) => !observations[variable])),
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

export function captureRealOmpProfileDigest(): RealOmpProfileDigest {
  const ompRoot = join(homedir(), '.omp');
  return Object.freeze({
    marketplaces: digest(join(ompRoot, 'marketplaces.json')),
    installedPlugins: digest(join(ompRoot, 'plugins', 'installed_plugins.json')),
  });
}

export function assertRealOmpProfileUnchanged(before: RealOmpProfileDigest): void {
  const after = captureRealOmpProfileDigest();
  if (JSON.stringify(before) !== JSON.stringify(after)) fail('operator real OMP marketplaces or installed plugins changed');
}

export function createIsolatedOmpProfile(options: Readonly<{
  readonly cliPrefixBin: string;
  readonly supportHome: SharedSupportHome;
  readonly extraPath?: readonly string[];
}>): IsolatedOmpProfile {
  const root = mkdtempSync(join(tmpdir(), 'cumpa-omp-profile-'));
  chmodRoot(root);
  const paths = profilePaths(root);
  let cleaned = false;
  try {
    createDirectories(paths);
    const env = isolatedEnvironment(paths, options.cliPrefixBin, options.extraPath);
    const omp = requireOmp();
    options.supportHome.applyTo(env);
    if (env.HOME !== options.supportHome.home) fail('shared support HOME was not applied last');
    runRuntimeCommand(omp, ['plugin', 'marketplace', 'add', 'Ship-With-AI/skills'], { cwd: root, env });
    runRuntimeCommand(omp, ['plugin', 'install', '--scope', 'project', 'ship-with-ai@ship-with-ai-skills'], { cwd: root, env });
    const skillDirectory = locateInstalledSkill(paths);
    assertInstalledSkill(skillDirectory);
    return Object.freeze({
      root,
      home: paths.home,
      agentDir: paths.agentDir,
      xdgConfigDir: paths.xdgConfigDir,
      xdgDataDir: paths.xdgDataDir,
      xdgStateDir: paths.xdgStateDir,
      xdgCacheDir: paths.xdgCacheDir,
      env: Object.freeze(env),
      pluginTreeRoot: skillDirectory,
      cleanup() {
        if (cleaned) return;
        rmSync(root, { recursive: true, force: true });
        if (existsSync(root)) fail('isolated OMP profile root was not removed');
        cleaned = true;
      },
    });
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}

function chmodRoot(path: string): void {
  // mkdtemp honors the process umask; the profile itself must remain private.
  writeFileSync(join(path, '.profile-isolation'), 'provider credentials are never inherited; any approved temporary credential copy is read-only and removed with this profile.\n', { mode: 0o600, flag: 'wx' });
}
