import { createHash, randomUUID } from 'node:crypto';
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  rename,
  rm,
  stat,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { ChangedFile, ExactPatchValidationTarget, GroundedExactPatch } from '../contracts/comparison.js';

const SNAPSHOT_VERSION = 1;
const MAX_SNAPSHOT_FILES = 10_000;
const MAX_SNAPSHOT_BYTES = 64 * 1024 * 1024;
const MAX_SIDE_BYTES = 1024 * 1024;
const PATCH_KEY_DOMAIN = Buffer.from('compare-exact-patch-review-key-v1', 'utf8');
const fileIdPattern = /^file_[A-Za-z0-9_-]{43}$/u;
const strictText = new TextDecoder('utf-8', { fatal: true });

type SnapshotSide = Readonly<{
  readonly exists: boolean;
  readonly path?: ChangedFile['oldPath'];
  readonly mode: string;
  readonly blobOid: string;
  readonly language?: string;
  readonly byteLength: number;
  readonly sha256?: string;
}>;

type SnapshotEntry = Readonly<{
  readonly file: ChangedFile;
  readonly preimage: SnapshotSide;
  readonly postimage: SnapshotSide;
}>;

type SnapshotManifest = Readonly<{
  readonly version: typeof SNAPSHOT_VERSION;
  readonly digest: string;
  readonly validationTarget: ExactPatchValidationTarget;
  readonly reviewKey: string;
  readonly submittedByteLength: number;
  readonly repositoryIdentity: string;
  readonly entries: readonly SnapshotEntry[];
  readonly provenanceDigest: string;
}>;

export class PatchSnapshotError extends Error {
  public constructor(
    readonly code: 'retryable-read' | 'snapshot-unavailable',
    readonly retryable: boolean,
  ) {
    super(code === 'retryable-read' ? 'Frozen patch file is temporarily unavailable.' : 'Frozen patch snapshot is unavailable.');
  }
}

function digest(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function frame(value: string): Buffer {
  const bytes = Buffer.from(value, 'utf8');
  const length = Buffer.allocUnsafe(8);
  length.writeBigUInt64BE(BigInt(bytes.byteLength));
  return Buffer.concat([length, bytes]);
}

function reviewKey(grounded: GroundedExactPatch): string {
  const hash = createHash('sha256');
  hash.update(PATCH_KEY_DOMAIN);
  hash.update(frame(grounded.scope.digest));
  hash.update(frame(grounded.scope.validationTarget.kind));
  hash.update(frame(grounded.repositoryRoot));
  return hash.digest('hex');
}

function languageForPath(path: ChangedFile['oldPath']): string {
  const extension = path?.utf8?.split('.').at(-1);
  return extension === undefined ? 'plaintext' : extension === 'ts' ? 'typescript' : extension === 'js' ? 'javascript' : extension === 'json' ? 'json' : extension === 'md' ? 'markdown' : 'plaintext';
}

function side(
  bytes: Buffer | undefined,
  path: ChangedFile['oldPath'],
  mode: string,
  blobOid: string,
): SnapshotSide {
  if (bytes === undefined) {
    return Object.freeze({ exists: false, mode, blobOid, byteLength: 0 });
  }
  return Object.freeze({
    exists: true,
    path,
    mode,
    blobOid,
    language: languageForPath(path),
    byteLength: bytes.byteLength,
    sha256: digest(bytes),
  });
}

function manifestDigest(manifest: Omit<SnapshotManifest, 'provenanceDigest'>): string {
  return digest(Buffer.from(JSON.stringify(manifest), 'utf8'));
}

function contentName(fileId: string, sideName: 'preimage' | 'postimage'): string {
  return `${fileId}.${sideName}`;
}

async function syncDirectory(path: string): Promise<void> {
  const handle = await open(path, 'r');
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function writeOwned(path: string, bytes: Uint8Array): Promise<void> {
  const handle = await open(path, 'wx', 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(path, 0o400);
}

function targetLabel(target: ExactPatchValidationTarget): string {
  return target.kind === 'repository' ? 'Repository content' : 'Worktree';
}

export interface MaterializePatchSnapshotOptions {
  readonly parent?: string;
  readonly observeTarget?: () => Promise<boolean>;
}

export class PatchSnapshot {
  readonly digest: string;
  readonly validationTarget: ExactPatchValidationTarget;
  readonly reviewKey: string;
  readonly root: string;
  readonly validationTargetLabel: string;

  private unavailable = false;
  private drifted = false;
  private disposed = false;

  constructor(
    private readonly manifest: SnapshotManifest,
    root: string,
    private readonly observeTarget?: () => Promise<boolean>,
  ) {
    this.digest = manifest.digest;
    this.validationTarget = manifest.validationTarget;
    this.reviewKey = manifest.reviewKey;
    this.root = root;
    this.validationTargetLabel = targetLabel(manifest.validationTarget);
  }

  private fail(): never {
    this.unavailable = true;
    throw new PatchSnapshotError('snapshot-unavailable', false);
  }

  private async verifyRoot(): Promise<void> {
    try {
      const info = await stat(this.root);
      if (!info.isDirectory() || info.isSymbolicLink() || this.disposed || (typeof process.getuid === 'function' && info.uid !== process.getuid()) || (info.mode & 0o022) !== 0) {
        this.fail();
      }
    } catch {
      this.fail();
    }
  }

  private async verifiedManifest(): Promise<SnapshotManifest> {
    await this.verifyRoot();
    let parsed: unknown;
    try {
      const manifestPath = join(this.root, 'manifest.json');
      const info = await lstat(manifestPath);
      if (!info.isFile() || info.isSymbolicLink() || (info.mode & 0o022) !== 0) {
        this.fail();
      }
      parsed = JSON.parse(strictText.decode(await readFile(manifestPath)));
    } catch (error) {
      if (error instanceof PatchSnapshotError) throw error;
      this.fail();
    }
    if (typeof parsed !== 'object' || parsed === null) this.fail();
    const candidate = parsed as SnapshotManifest;
    const { provenanceDigest, ...withoutDigest } = candidate;
    if (
      candidate.version !== SNAPSHOT_VERSION ||
      candidate.digest !== this.manifest.digest ||
      candidate.reviewKey !== this.manifest.reviewKey ||
      !Array.isArray(candidate.entries) ||
      typeof provenanceDigest !== 'string' ||
      provenanceDigest !== manifestDigest(withoutDigest)
    ) {
      this.fail();
    }
    return candidate;
  }

  private entry(fileId: string, manifest: SnapshotManifest): SnapshotEntry | undefined {
    if (!fileIdPattern.test(fileId)) return undefined;
    return manifest.entries.find((entry) => entry.file.id === fileId);
  }

  private async readSide(fileId: string, sideName: 'preimage' | 'postimage', side: SnapshotSide): Promise<Buffer | undefined> {
    if (!side.exists) return undefined;
    if (side.sha256 === undefined || side.byteLength > MAX_SIDE_BYTES || side.path === undefined) this.fail();
    try {
      const contentPath = join(this.root, contentName(fileId, sideName));
      const info = await lstat(contentPath);
      if (!info.isFile() || info.isSymbolicLink() || (info.mode & 0o022) !== 0) this.fail();
      const bytes = await readFile(contentPath);
      if (bytes.byteLength !== side.byteLength || digest(bytes) !== side.sha256) this.fail();
      return Buffer.from(bytes);
    } catch (error) {
      if (error instanceof PatchSnapshotError) throw error;
      if (typeof error === 'object' && error !== null && 'code' in error && (error.code === 'ENOENT' || error.code === 'EACCES')) this.fail();
      throw new PatchSnapshotError('retryable-read', true);
    }
  }

  async session(): Promise<Readonly<{ readonly patch: Readonly<{ readonly kind: 'exact-patch'; readonly digest: string; readonly reviewKey: string; readonly validationTarget: ExactPatchValidationTarget; readonly changedFileCount: number }>; readonly files: readonly unknown[] }>> {
    await this.verifiedManifest();
    return this.sessionDto();
  }

  sessionDto(): Readonly<{ readonly patch: Readonly<{ readonly kind: 'exact-patch'; readonly digest: string; readonly reviewKey: string; readonly validationTarget: ExactPatchValidationTarget; readonly changedFileCount: number }>; readonly files: readonly unknown[] }> {
    return Object.freeze({
      patch: Object.freeze({
        kind: 'exact-patch' as const,
        digest: this.manifest.digest,
        reviewKey: this.manifest.reviewKey,
        validationTarget: this.manifest.validationTarget,
        changedFileCount: this.manifest.entries.length,
      }),
      files: Object.freeze(this.manifest.entries.map(({ file }) => ({
        fileId: file.id,
        status: file.status.similarity === null ? { kind: file.status.kind } : { kind: file.status.kind, similarity: file.status.similarity },
        ...(file.oldPath === undefined ? {} : { oldPath: file.oldPath }),
        ...(file.newPath === undefined ? {} : { newPath: file.newPath }),
        additions: file.additions,
        deletions: file.deletions,
        availability: file.availability,
      }))),
    });
  }

  async lookup(fileId: string): Promise<ChangedFile | undefined> {
    return this.entry(fileId, await this.verifiedManifest())?.file;
  }

  file(fileId: string): ChangedFile | undefined {
    if (!fileIdPattern.test(fileId)) return undefined;
    return this.manifest.entries.find((entry) => entry.file.id === fileId)?.file;
  }

  async readContent(fileId: string): Promise<Readonly<{ readonly file: ChangedFile; readonly preimage: Buffer | undefined; readonly postimage: Buffer | undefined }> | undefined> {
    if (this.unavailable) this.fail();
    const entry = this.entry(fileId, await this.verifiedManifest());
    if (entry === undefined || entry.file.availability.kind !== 'text') return undefined;
    return Object.freeze({
      file: entry.file,
      preimage: await this.readSide(fileId, 'preimage', entry.preimage),
      postimage: await this.readSide(fileId, 'postimage', entry.postimage),
    });
  }

  files(): readonly ChangedFile[] {
    return this.manifest.entries.map((entry) => entry.file);
  }

  async observe(): Promise<'unchanged' | 'drifted' | 'snapshotUnavailable'> {
    if (this.unavailable) return 'snapshotUnavailable';
    try {
      await this.verifiedManifest();
      if (!this.drifted && this.observeTarget !== undefined && await this.observeTarget()) this.drifted = true;
      return this.drifted ? 'drifted' : 'unchanged';
    } catch {
      this.unavailable = true;
      return 'snapshotUnavailable';
    }
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    await rm(this.root, { recursive: true, force: true });
  }
}

export async function materializePatchSnapshot(
  grounded: GroundedExactPatch,
  options: MaterializePatchSnapshotOptions = {},
): Promise<PatchSnapshot> {
  if (grounded.changedFiles.length > MAX_SNAPSHOT_FILES) {
    throw new PatchSnapshotError('snapshot-unavailable', false);
  }
  const parent = options.parent ?? tmpdir();
  const staging = await mkdir(parent, { recursive: true, mode: 0o700 }).then(() => join(parent, `.compare-patch-stage-${randomUUID()}`));
  const accepted = join(parent, `compare-patch-${randomUUID()}`);
  let total = 0;
  try {
    await mkdir(staging, { mode: 0o700 });
    const entries: SnapshotEntry[] = [];
    for (const file of grounded.changedFiles) {
      if (!fileIdPattern.test(file.id)) throw new PatchSnapshotError('snapshot-unavailable', false);
      const content = grounded.contents.get(file.id);
      if (content === undefined) throw new PatchSnapshotError('snapshot-unavailable', false);
      const preimage = Buffer.from(content.preimage ?? []);
      const postimage = Buffer.from(content.postimage ?? []);
      total += preimage.byteLength + postimage.byteLength;
      if (preimage.byteLength > MAX_SIDE_BYTES || postimage.byteLength > MAX_SIDE_BYTES || total > MAX_SNAPSHOT_BYTES) throw new PatchSnapshotError('snapshot-unavailable', false);
      const frozenFile = structuredClone(file);
      const entry = Object.freeze({
        file: Object.freeze(frozenFile),
        preimage: side(content.preimage, frozenFile.oldPath, frozenFile.oldMode, frozenFile.oldBlobOid),
        postimage: side(content.postimage, frozenFile.newPath, frozenFile.newMode, frozenFile.newBlobOid),
      });
      entries.push(entry);
      if (content.preimage !== undefined) await writeOwned(join(staging, contentName(file.id, 'preimage')), preimage);
      if (content.postimage !== undefined) await writeOwned(join(staging, contentName(file.id, 'postimage')), postimage);
    }
    const base = {
      version: SNAPSHOT_VERSION,
      digest: grounded.scope.digest,
      validationTarget: Object.freeze({ ...grounded.scope.validationTarget }),
      reviewKey: reviewKey(grounded),
      submittedByteLength: grounded.scope.submittedByteLength,
      repositoryIdentity: grounded.repositoryRoot,
      entries: Object.freeze(entries),
    } as const;
    const manifest: SnapshotManifest = Object.freeze({ ...base, provenanceDigest: manifestDigest(base) });
    await writeOwned(join(staging, 'manifest.json'), Buffer.from(JSON.stringify(manifest), 'utf8'));
    await syncDirectory(staging);
    await rename(staging, accepted);
    await chmod(accepted, 0o700);
    await syncDirectory(parent);
    return new PatchSnapshot(manifest, accepted, options.observeTarget);
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    await rm(accepted, { recursive: true, force: true });
    if (error instanceof PatchSnapshotError) throw error;
    throw new PatchSnapshotError('snapshot-unavailable', false);
  }
}
