import { randomBytes, randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, win32 } from 'node:path';
import { z } from 'zod';

export const SupportStateV1Schema = z
  .strictObject({
    version: z.literal(1),
    installationId: z.string().regex(/^[A-Za-z0-9_-]{43}$/u),
    status: z.enum(['unverified', 'verified']),
    verifiedAt: z.string().datetime().optional(),
  })
  .superRefine((state, context) => {
    if ((state.status === 'verified') !== (state.verifiedAt !== undefined)) {
      context.addIssue({ code: 'custom', message: 'verifiedAt must exist iff verified.' });
    }
  })
  .readonly();

export type SupportStateV1 = z.infer<typeof SupportStateV1Schema>;
export type SupportStore = Readonly<{
  canonicalPath: string;
  state(): Promise<SupportStateV1>;
  markVerified(verifiedAt: string): Promise<SupportStateV1>;
}>;

export type SupportFileHandle = Readonly<{ writeFile(bytes: Uint8Array): Promise<void>; sync(): Promise<void>; close(): Promise<void> }>;
export type SupportFileSystem = Readonly<{
  readFile(path: string): Promise<Buffer>;
  mkdir(path: string, mode: number): Promise<void>;
  lstat(path: string): Promise<{ isSymbolicLink(): boolean; isFile(): boolean }>;
  open(path: string, flags: number, mode: number): Promise<SupportFileHandle>;
  rename(from: string, to: string): Promise<void>;
  unlink(path: string): Promise<void>;
  syncDirectory(path: string): Promise<void>;
}>;

const nodeFileSystem: SupportFileSystem = {
  readFile: async (path) => await fs.readFile(path),
  mkdir: async (path, mode) => { await fs.mkdir(path, { recursive: true, mode }); },
  lstat: async (path) => await fs.lstat(path),
  open: async (path, flags, mode) => {
    const handle = await fs.open(path, flags, mode);
    return { writeFile: async (bytes) => await handle.writeFile(bytes), sync: async () => await handle.sync(), close: async () => await handle.close() };
  },
  rename: async (from, to) => await fs.rename(from, to),
  unlink: async (path) => await fs.unlink(path),
  syncDirectory: async (path) => {
    const handle = await fs.open(path, 'r');
    try { await handle.sync(); } finally { await handle.close(); }
  },
};


export function resolveSupportStatePath(options: Readonly<{ platform?: NodeJS.Platform; home?: string; env?: NodeJS.ProcessEnv }> = {}): string {
  const platform = options.platform ?? process.platform;
  const home = options.home ?? process.env.HOME ?? '';
  const env = options.env ?? process.env;
  if (platform === 'darwin') return join(home, 'Library', 'Application Support', 'Cumpa', 'support.json');
  if (platform === 'win32') return win32.join(env.LOCALAPPDATA ?? env.APPDATA ?? win32.join(home, 'AppData', 'Local'), 'Cumpa', 'support.json');
  return join(env.XDG_STATE_HOME ?? join(home, '.local', 'state'), 'cumpa', 'support.json');
}

export function createSupportStore(options: Readonly<{ path?: string; fileSystem?: SupportFileSystem; randomBytes?: (size: number) => Buffer }> = {}): SupportStore {
  const canonicalPath = options.path ?? resolveSupportStatePath();
  const fileSystem = options.fileSystem ?? nodeFileSystem;
  const random = options.randomBytes ?? randomBytes;
  const directory = dirname(canonicalPath);
  let state: SupportStateV1 | undefined;
  let pending = Promise.resolve();

  const load = async (): Promise<SupportStateV1 | undefined> => {
    try {
      const entry = await fileSystem.lstat(canonicalPath);
      if (entry.isSymbolicLink() || !entry.isFile()) return undefined;
      return SupportStateV1Schema.parse(JSON.parse((await fileSystem.readFile(canonicalPath)).toString('utf8')));
    } catch { return undefined; }
  };
  const exists = async (): Promise<boolean> => {
    try {
      await fileSystem.lstat(canonicalPath);
      return true;
    } catch (error) {
      return !(typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT');
    }
  };

  const persist = async (next: SupportStateV1): Promise<void> => {
    const bytes = Buffer.from(`${JSON.stringify(SupportStateV1Schema.parse(next))}\n`);
    const temporaryPath = join(directory, `.support.${randomUUID()}.tmp`);
    let handle: SupportFileHandle | undefined;
    let renamed = false;
    try {
      await fileSystem.mkdir(directory, 0o700);
      handle = await fileSystem.open(temporaryPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
      await handle.writeFile(bytes); await handle.sync(); await handle.close(); handle = undefined;
      await fileSystem.rename(temporaryPath, canonicalPath); renamed = true;
      await fileSystem.syncDirectory(directory).catch((error: unknown) => {
        if (!(typeof error === 'object' && error !== null && 'code' in error && (error.code === 'EINVAL' || error.code === 'ENOTSUP'))) throw error;
      });
    } finally {
      if (handle !== undefined) await handle.close().catch(() => undefined);
      if (!renamed) await fileSystem.unlink(temporaryPath).catch(() => undefined);
    }
  };
  const initial = (): SupportStateV1 => SupportStateV1Schema.parse({ version: 1, installationId: random(32).toString('base64url'), status: 'unverified' });
  const serialized = async <T>(operation: () => Promise<T>): Promise<T> => {
    const run = pending.catch(() => undefined).then(operation); pending = run.then(() => undefined, () => undefined); return await run;
  };
  return {
    canonicalPath,
    async state() {
      return await serialized(async () => {
        state ??= await load();
        if (state === undefined) {
          const created = initial();
          if (!(await exists())) {
            try {
              await persist(created);
            } catch {
              return created;
            }
          }
          state = created;
        }
        return state;
      });
    },
    async markVerified(verifiedAt) {
      return await serialized(async () => {
        state ??= await load();
        if (state === undefined) {
          state = initial();
          await persist(state);
        }
        if (state.status === 'verified') return state;
        const next = SupportStateV1Schema.parse({ ...state, status: 'verified', verifiedAt });
        await persist(next);
        state = next;
        return state;
      });
    },
  };
}
