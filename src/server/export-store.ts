import { randomUUID } from 'node:crypto';
import { lstat, mkdir, open, readdir, readFile, rename, rm } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

import { hashExportBytes, parseCanonicalReviewExport, type ExportHash } from '../export/review-export.js';
import { renderReviewMarkdown } from '../export/render-review-markdown.js';

export class ReExportUnsupported extends Error {
  constructor() {
    super('The current packaged target has no observed native directory exchange support.');
  }
}

export type ReExportCapability =
  | Readonly<{ readonly kind: 'reExportUnsupported' }>
  | Readonly<{
      readonly kind: 'observedNativeExchange';
      readonly exchangeDirectories: (root: string, stable: string, candidate: string) => Readonly<{ readonly kind: 'supported' | 'unsupported' | 'failed' }>;
    }>;

export type ExportReceipt = Readonly<{
  readonly files: readonly [
    Readonly<{ readonly path: string; readonly algorithm: ExportHash['algorithm']; readonly sha256: string; readonly bytes: number }>,
    Readonly<{ readonly path: string; readonly algorithm: ExportHash['algorithm']; readonly sha256: string; readonly bytes: number }>,
  ];
}>;

export type PublishReviewExportResult =
  | Readonly<{ readonly kind: 'exported'; readonly receipt: ExportReceipt }>
  | Readonly<{ readonly kind: 'reExportUnsupported' }>
  | Readonly<{ readonly kind: 'publicationFailed' }>;

export type PublishReviewExportInput = Readonly<{
  readonly revalidate?: () => Promise<boolean>;
  readonly repositoryRoot: string;
  readonly baseOid: string;
  readonly headOid: string;
  readonly json: Uint8Array;
  readonly markdown: Uint8Array;
  readonly reExportCapability: ReExportCapability;
}>;

type CompletePair = Readonly<{ readonly json: Buffer; readonly markdown: Buffer }>;

function isMissing(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

async function syncDirectory(path: string): Promise<void> {
  try {
    const handle = await open(path, 'r');
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  } catch (error) {
    if (!(typeof error === 'object' && error !== null && 'code' in error && ['EINVAL', 'ENOTSUP', 'EISDIR'].includes(String(error.code)))) {
      throw error;
    }
  }
}

async function writeFileExactly(path: string, bytes: Uint8Array): Promise<void> {
  const handle = await open(path, 'wx', 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function completePair(path: string): Promise<CompletePair> {
  const directory = await lstat(path);
  if (!directory.isDirectory() || directory.isSymbolicLink()) {
    throw new Error('Managed export directory is not a real directory.');
  }
  const names = await readdir(path);
  if (names.length !== 2 || !names.includes('review.json') || !names.includes('review.md')) {
    throw new Error('Managed export directory does not contain exactly the review pair.');
  }
  const [jsonInfo, markdownInfo, json, markdown] = await Promise.all([
    lstat(join(path, 'review.json')),
    lstat(join(path, 'review.md')),
    readFile(join(path, 'review.json')),
    readFile(join(path, 'review.md')),
  ]);
  if (!jsonInfo.isFile() || jsonInfo.isSymbolicLink() || !markdownInfo.isFile() || markdownInfo.isSymbolicLink()) {
    throw new Error('Managed export pair contains an unsupported file type.');
  }
  return Object.freeze({ json, markdown });
}

async function stableExists(path: string): Promise<boolean> {
  try {
    await completePair(path);
    return true;
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }
}

function receipt(exportsRoot: string, stable: string, pair: CompletePair): ExportReceipt {
  const stableRelative = relative(exportsRoot, stable).split('\\').join('/');
  const json = hashExportBytes(pair.json);
  const markdown = hashExportBytes(pair.markdown);
  const files: ExportReceipt['files'] = [
    Object.freeze({ path: `.diff-review/exports/${stableRelative}/review.json`, ...json }),
    Object.freeze({ path: `.diff-review/exports/${stableRelative}/review.md`, ...markdown }),
  ];
  return Object.freeze({ files: Object.freeze(files) as ExportReceipt['files'] });
}

export async function publishReviewExport(input: PublishReviewExportInput): Promise<PublishReviewExportResult> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const exportsRoot = resolve(repositoryRoot, '.diff-review', 'exports');
  const stableName = `${input.baseOid}..${input.headOid}`;
  const stable = resolve(exportsRoot, stableName);
  if (dirname(stable) !== exportsRoot) {
    return Object.freeze({ kind: 'publicationFailed' });
  }

  let stablePresent: boolean;
  try {
    stablePresent = await stableExists(stable);
  } catch {
    return Object.freeze({ kind: 'publicationFailed' });
  }
  if (stablePresent && input.reExportCapability.kind === 'reExportUnsupported') {
    return Object.freeze({ kind: 'reExportUnsupported' });
  }

  const candidate = resolve(exportsRoot, `.${stableName}.candidate-${randomUUID()}`);
  if (dirname(candidate) !== exportsRoot) {
    return Object.freeze({ kind: 'publicationFailed' });
  }

  try {
    await mkdir(exportsRoot, { recursive: true, mode: 0o700 });
    await mkdir(candidate, { mode: 0o700 });
    await writeFileExactly(join(candidate, 'review.json'), input.json);
    await writeFileExactly(join(candidate, 'review.md'), input.markdown);
    const validatedCandidate = await completePair(candidate);
    if (!validatedCandidate.json.equals(input.json) || !validatedCandidate.markdown.equals(input.markdown)) {
      throw new Error('Candidate reread differs from validated export bytes.');
    }
    parseCanonicalReviewExport(validatedCandidate.json);
    if (!Buffer.from(renderReviewMarkdown(validatedCandidate.json), 'utf8').equals(validatedCandidate.markdown)) {
      throw new Error('Candidate Markdown is not the exact rendering of canonical export JSON.');
    }
    await syncDirectory(candidate);
    if (input.revalidate !== undefined && !(await input.revalidate())) {
      return Object.freeze({ kind: 'publicationFailed' });
    }

    if (!stablePresent) {
      if (await stableExists(stable)) {
        return Object.freeze({ kind: 'publicationFailed' });
      }
      await rename(candidate, stable);
    } else {
      if (input.reExportCapability.kind !== 'observedNativeExchange') {
        throw new ReExportUnsupported();
      }
      const exchanged = input.reExportCapability.exchangeDirectories(exportsRoot, stableName, candidate.slice(exportsRoot.length + 1));
      if (exchanged.kind === 'unsupported') {
        throw new ReExportUnsupported();
      }
      if (exchanged.kind !== 'supported') {
        return Object.freeze({ kind: 'publicationFailed' });
      }
    }

    await syncDirectory(exportsRoot);
    const finalPair = await completePair(stable);
    if (!finalPair.json.equals(input.json) || !finalPair.markdown.equals(input.markdown)) {
      return Object.freeze({ kind: 'publicationFailed' });
    }
    const finalReceipt = receipt(exportsRoot, stable, finalPair);
    if (stablePresent) {
      await rm(candidate, { force: true, recursive: true });
    }
    return Object.freeze({ kind: 'exported', receipt: finalReceipt });
  } catch (error) {
    if (error instanceof ReExportUnsupported) {
      return Object.freeze({ kind: 'reExportUnsupported' });
    }
    return Object.freeze({ kind: 'publicationFailed' });
  } finally {
    try {
      await rm(candidate, { force: true, recursive: true });
    } catch {
      // A failed cleanup never changes the complete stable generation.
    }
  }
}

export async function recoverReviewExport(repositoryRoot: string, baseOid: string, headOid: string): Promise<CompletePair | undefined> {
  const stable = join(resolve(repositoryRoot), '.diff-review', 'exports', `${baseOid}..${headOid}`);
  try {
    return await completePair(stable);
  } catch (error) {
    if (isMissing(error)) return undefined;
    throw error;
  }
}
