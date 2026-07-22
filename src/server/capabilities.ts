import type { PinnedComparison, ChangedFile } from '../contracts/comparison.js';
import {
  FileContentResponseSchema,
  FileMetadataResponseSchema,
  SessionResponseSchema,
  type FileContentResponse,
  type FileMetadataResponse,
  type SessionResponse,
} from '../contracts/api.js';
import {
  buildDurableAnchor,
  verifyDurableAnchor,
  type AnchorVerification,
  type DurableAnchorV1,
} from '../domain/anchor.js';
import { MAX_INLINE_TEXT_BYTES } from '../git/availability.js';
import { createObjectReader } from '../git/objects.js';
import type { ObjectReader } from '../git/objects.js';
import {
  createSelectorDriftObserver,
  type SelectorDriftObserver,
} from '../git/selector-drift.js';
import { createDraftStore, type DraftStore } from './draft-store.js';

export type AnchorAddPort = (
  input: Readonly<{ readonly body: string; readonly anchor: DurableAnchorV1 }>,
) => Promise<unknown>;

const LANGUAGE_BY_EXTENSION: Readonly<Record<string, string>> = {
  c: 'c',
  css: 'css',
  go: 'go',
  h: 'cpp',
  htm: 'html',
  html: 'html',
  java: 'java',
  js: 'javascript',
  json: 'json',
  jsx: 'javascript',
  md: 'markdown',
  mjs: 'javascript',
  mts: 'typescript',
  py: 'python',
  rs: 'rust',
  sh: 'shell',
  sql: 'sql',
  ts: 'typescript',
  tsx: 'typescript',
  vue: 'html',
  xml: 'xml',
  yml: 'yaml',
  yaml: 'yaml',
};
const LANGUAGE_BY_BASENAME: Readonly<Record<string, string>> = {
  dockerfile: 'dockerfile',
  makefile: 'makefile',
};
const strictTextDecoder = new TextDecoder('utf-8', { fatal: true });

export type DraftRevealPort = (canonicalPath: string) => Promise<void>;

export type CapabilityRegistryOptions = Readonly<{
  readonly onCapabilityLookup?: (fileId: string) => void;
  readonly objectReader?: ObjectReader;
  readonly onAnchorAdd?: AnchorAddPort;
  readonly draftStore?: DraftStore;
  readonly revealDraftFile?: DraftRevealPort;
  readonly selectorDriftObserver?: SelectorDriftObserver;
}>;

export type CapabilityRegistry = Readonly<{
  readonly session: SessionResponse;
  readonly onAnchorAdd?: AnchorAddPort;
  readonly draftStore: DraftStore;
  readonly selectorDriftObserver: SelectorDriftObserver;
  readonly lookup: (fileId: string) => FileMetadataResponse | undefined;
  readonly readContent: (fileId: string) => Promise<FileContentResponse | undefined>;
  readonly verifyAnchor: (anchor: DurableAnchorV1) => Promise<AnchorVerification>;
  readonly revealDraftFile: () => Promise<void>;
}>;

function toSessionEndpoint(endpoint: PinnedComparison['base']) {
  return {
    label: endpoint.label,
    oid: endpoint.oid,
    ...(endpoint.source?.kind === 'worktree'
      ? {
          worktree: {
            path: endpoint.source.path,
            dirty: endpoint.source.dirty,
          },
        }
      : {}),
  };
}

function languageForPath(path: string | undefined): string {
  const filename = path?.split(/[\\/]/u).at(-1)?.toLowerCase() ?? '';
  if (filename.length === 0) {
    return 'plaintext';
  }
  const namedLanguage = LANGUAGE_BY_BASENAME[filename];
  if (namedLanguage !== undefined) {
    return namedLanguage;
  }
  const extension = filename.split('.').at(-1);
  return extension === undefined ? 'plaintext' : LANGUAGE_BY_EXTENSION[extension] ?? 'plaintext';
}

async function readSide(
  reader: ObjectReader,
  path: ChangedFile['oldPath'],
  blobOid: string,
  mode: string,
): Promise<FileContentResponse['base'] | undefined> {
  if (mode === '000000' || path === undefined) {
    return { exists: false };
  }
  const content = await reader.read(blobOid, { maxBytes: MAX_INLINE_TEXT_BYTES });
  if (content.kind === 'missing') {
    return undefined;
  }
  try {
    return {
      exists: true,
      path,
      language: languageForPath(path.utf8),
      blobOid,
      text: strictTextDecoder.decode(content.bytes),
    };
  } catch {
    return undefined;
  }
}

export function createCapabilityRegistry(
  comparison: PinnedComparison,
  options: CapabilityRegistryOptions = {},
): CapabilityRegistry {
  const filesByCapability = new Map<string, FileMetadataResponse>();
  const frozenFilesByCapability = new Map<string, ChangedFile>();
  const reader = options.objectReader ?? createObjectReader(comparison.repositoryRoot);
  const draftStore =
    options.draftStore ??
    createDraftStore({
      repositoryRoot: comparison.repositoryRoot,
      comparison: {
        baseCommitOid: comparison.base.oid,
        headCommitOid: comparison.head.oid,
        mergeBaseOid: comparison.mergeBaseOid,
      },
    });
  const selectorDriftObserver =
    options.selectorDriftObserver ?? createSelectorDriftObserver(comparison);


  const session = SessionResponseSchema.parse({
    base: toSessionEndpoint(comparison.base),
    head: toSessionEndpoint(comparison.head),
    mergeBaseOid: comparison.mergeBaseOid,
    files: comparison.changedFiles.map((file) => {
      const status =
        file.status.similarity === null
          ? { kind: file.status.kind }
          : { kind: file.status.kind, similarity: file.status.similarity };
      const sessionFile = {
        fileId: file.id,
        status,
        ...(file.oldPath === undefined ? {} : { oldPath: file.oldPath }),
        ...(file.newPath === undefined ? {} : { newPath: file.newPath }),
        additions: file.additions,
        deletions: file.deletions,
        availability: file.availability,
      };
      const metadata = FileMetadataResponseSchema.parse({
        ...sessionFile,
        oldMode: file.oldMode,
        newMode: file.newMode,
      });

      filesByCapability.set(file.id, metadata);
      frozenFilesByCapability.set(file.id, file);
      return sessionFile;
    }),
  });

  return Object.freeze({
    session,
    onAnchorAdd: options.onAnchorAdd,
    draftStore,
    selectorDriftObserver,
    async revealDraftFile() {
      if (options.revealDraftFile === undefined) {
        throw new Error('Draft reveal adapter is unavailable.');
      }
      await options.revealDraftFile(draftStore.canonicalPath);
    },
    lookup(fileId: string) {
      options.onCapabilityLookup?.(fileId);
      return filesByCapability.get(fileId);
    },
    async readContent(fileId: string) {
      const file = frozenFilesByCapability.get(fileId);
      if (file === undefined || file.availability.kind !== 'text') {
        return undefined;
      }
      const [base, head] = await Promise.all([
        readSide(reader, file.oldPath, file.oldBlobOid, file.oldMode),
        readSide(reader, file.newPath, file.newBlobOid, file.newMode),
      ]);
      if (base === undefined || head === undefined) {
        return undefined;
      }
      return FileContentResponseSchema.parse({ fileId, base, head });
    },
    async verifyAnchor(anchor) {
      for (const file of frozenFilesByCapability.values()) {
        const path = anchor.side === 'base' ? file.oldPath : file.newPath;
        const blobOid = anchor.side === 'base' ? file.oldBlobOid : file.newBlobOid;
        const mode = anchor.side === 'base' ? file.oldMode : file.newMode;
        if (
          file.availability.kind !== 'text' ||
          path === undefined ||
          path.bytesBase64url !== anchor.path.bytesBase64url ||
          blobOid !== anchor.blobOid
        ) {
          continue;
        }
        const side = await readSide(reader, path, blobOid, mode);
        if (side === undefined || !side.exists) {
          return { state: 'orphaned', reason: 'anchor-unavailable' };
        }
        try {
          return verifyDurableAnchor(
            anchor,
            buildDurableAnchor({
              path: side.path,
              safeDisplayPath: side.path.display,
              side: anchor.side,
              blobOid: side.blobOid,
              line: anchor.line,
              text: side.text,
            }),
          );
        } catch {
          return { state: 'orphaned', reason: 'anchor-unavailable' };
        }
      }
      return { state: 'orphaned', reason: 'anchor-unavailable' };
    },
  });
}
