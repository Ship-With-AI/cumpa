import { createHash, randomBytes } from 'node:crypto';
import { lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import type { PinnedComparison, ChangedFile } from '../contracts/comparison.js';
import {
  ExportReviewResultSchema,
  AppendCompareIgnoreResultSchema,
  CompareIgnoreStatusSchema,
  FileContentResponseSchema,
  FileMetadataResponseSchema,
  SessionResponseSchema,
  type ExportReviewRequest,
  type ExportReviewResult,
  type FileContentResponse,
  type FileMetadataResponse,
  type SessionResponse,
  type AppendCompareIgnoreResult,
  type CompareIgnoreStatus,
  type SelectorDriftResponse,
} from '../contracts/api.js';
import {
  buildDurableAnchor,
  verifyDurableAnchor,
  type AnchorVerification,
  type DurableAnchorV1,
} from '../domain/anchor.js';
import { comparisonKey } from '../domain/comparison-key.js';
import { MAX_INLINE_TEXT_BYTES } from '../git/availability.js';
import { createObjectReader } from '../git/objects.js';
import type { ObjectReader } from '../git/objects.js';
import {
  createSelectorDriftObserver,
  type SelectorDriftObserver,
} from '../git/selector-drift.js';
import { createDraftStore, type DraftStore } from './draft-store.js';
import {
  buildReviewExportV1,
  buildReviewExportV2,
  canonicalizeReviewExport,
} from '../export/review-export.js';
import { renderReviewMarkdown } from '../export/render-review-markdown.js';
import { getObservedNativeExchangeCapability } from './native-exchange-capability.js';
import { assertManagedExportsRoot, ensureManagedExportsRoot, publishReviewExport } from './export-store.js';
import { inspectCompareIgnore } from '../git/ignore-status.js';
import { appendCompareIgnoreRule } from './gitignore-capability.js';

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
  readonly revealExportDirectory: () => Promise<void>;
  readonly exportReview: (input: ExportReviewRequest) => Promise<ExportReviewResult>;
  readonly inspectCompareIgnore: () => Promise<CompareIgnoreStatus>;
  readonly appendCompareIgnoreRule: () => Promise<AppendCompareIgnoreResult>;
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

function receiptComparisonEndpoint(endpoint: PinnedComparison['base']) {
  return {
    label: endpoint.label,
    oid: endpoint.oid,
    ...(endpoint.source === undefined ? {} : { selectorType: endpoint.source.kind }),
  };
}

type ReceiptDrift = Extract<ExportReviewResult, { readonly kind: 'exported' }>['drift'];
type AcknowledgedReceiptDrift = Extract<ReceiptDrift, { readonly kind: 'acknowledged' }>;
type ReceiptDriftIdentity = AcknowledgedReceiptDrift['identities'][number];

function receiptDriftIdentity(
  endpoint: PinnedComparison['base'],
  status: SelectorDriftResponse['base'],
): ReceiptDriftIdentity {
  const selectorType = endpoint.source?.kind ?? 'branch';
  const pinned = { label: endpoint.label, selectorType, oid: endpoint.oid };
  if (status.kind === 'unavailable') {
    return {
      role: status.role,
      pinned,
      current: {
        kind: 'unavailable',
        label: status.label,
        selectorType: status.selectorType,
        reason: status.reason,
      },
    };
  }
  return {
    role: status.role,
    pinned,
    current: {
      kind: 'available',
      label: status.kind === 'moved' ? status.label : endpoint.label,
      selectorType: status.kind === 'moved' ? status.selectorType : selectorType,
      oid: status.kind === 'moved' ? status.newOid : endpoint.oid,
    },
  };
}

function receiptDrift(
  comparison: PinnedComparison,
  observation: SelectorDriftResponse,
): ReceiptDrift {
  const drifted = observation.base.kind !== 'unchanged' || observation.head.kind !== 'unchanged';
  return drifted
    ? {
        kind: 'acknowledged',
        identities: [
          receiptDriftIdentity(comparison.base, observation.base),
          receiptDriftIdentity(comparison.head, observation.head),
        ],
      }
    : { kind: 'noneObserved' };
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

async function isCompleteExportDirectory(path: string): Promise<boolean> {
  try {
    const directory = await lstat(path);
    if (!directory.isDirectory() || directory.isSymbolicLink()) {
      return false;
    }
    const names = await readdir(path);
    if (names.length !== 2 || !names.includes('review.json') || !names.includes('review.md')) {
      return false;
    }
    const files = await Promise.all(names.map(async (name) => lstat(join(path, name))));
    return files.every((file) => file.isFile() && !file.isSymbolicLink());
  } catch {
    return false;
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
      comparison: comparison.range === undefined
        ? {
            baseCommitOid: comparison.base.oid,
            headCommitOid: comparison.head.oid,
            mergeBaseOid: comparison.mergeBaseOid,
          }
        : {
            baseCommitOid: comparison.base.oid,
            headCommitOid: comparison.head.oid,
            mergeBaseOid: comparison.mergeBaseOid,
            range: comparison.range,
          },
    });
  const selectorDriftObserver =
    options.selectorDriftObserver ?? createSelectorDriftObserver(comparison);
  const acknowledgements = new Map<string, string>();



  const session = SessionResponseSchema.parse({
    base: toSessionEndpoint(comparison.base),
    head: toSessionEndpoint(comparison.head),
    mergeBaseOid: comparison.mergeBaseOid,
    ...(comparison.range === undefined
      ? {}
      : {
          range: {
            kind: comparison.range.kind,
            baseOid: comparison.range.baseOid,
            headOid: comparison.range.headOid,
            pathspecs: comparison.range.pathspecs,
          },
        }),
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
    async revealExportDirectory() {
    const managedRoot = await ensureManagedExportsRoot(comparison.repositoryRoot, false);
    const exportName = comparison.range?.reviewKey ?? `${comparison.base.oid}..${comparison.head.oid}`;
    const exportDirectory = managedRoot === undefined
      ? undefined
      : join(managedRoot.exportsRoot, exportName);
      if (
        options.revealDraftFile === undefined
        || managedRoot === undefined
        || exportDirectory === undefined
      ) {
        throw new Error('Export reveal adapter is unavailable.');
      }
      await assertManagedExportsRoot(managedRoot);
      if (!(await isCompleteExportDirectory(exportDirectory))) {
        throw new Error('Export reveal adapter is unavailable.');
      }
      await assertManagedExportsRoot(managedRoot);
      await options.revealDraftFile(exportDirectory);
    },
    async inspectCompareIgnore() {
      const status = await inspectCompareIgnore({
        repositoryRoot: comparison.repositoryRoot,
      });
      return CompareIgnoreStatusSchema.parse({
        kind: status.kind === 'not-ignored' ? 'notIgnored' : status.kind,
      });
    },
    async appendCompareIgnoreRule() {
      return AppendCompareIgnoreResultSchema.parse(
        await appendCompareIgnoreRule({
          repositoryRoot: comparison.repositoryRoot,
        }),
      );
    },
    async exportReview(input: ExportReviewRequest): Promise<ExportReviewResult> {
      const initial = await draftStore.loadState();
      if (initial.kind !== 'current') {
        return ExportReviewResultSchema.parse({ kind: 'draftReadOnly' });
      }
      if (initial.draft.revision !== input.expectedRevision) {
        return ExportReviewResultSchema.parse({
          kind: 'revisionConflict',
          expectedRevision: input.expectedRevision,
          actualRevision: initial.draft.revision,
        });
      }

      const observation = await selectorDriftObserver.observe();
      const observationFingerprint = createHash('sha256').update(JSON.stringify(observation)).digest('base64url');
      const drifted = observation.base.kind !== 'unchanged' || observation.head.kind !== 'unchanged';
      if (drifted && acknowledgements.get(input.driftAcknowledgementToken ?? '') !== observationFingerprint) {
        const acknowledgementToken = randomBytes(32).toString('base64url');
        acknowledgements.set(acknowledgementToken, observationFingerprint);
        return ExportReviewResultSchema.parse({
          kind: input.driftAcknowledgementToken === undefined ? 'driftAcknowledgementRequired' : 'driftAcknowledgementStale',
          acknowledgementToken,
          observation,
        });
      }

      const acceptedDraft = structuredClone(initial.draft);
      const draftFingerprint = createHash('sha256').update(initial.raw).digest('hex');
      const exportedAt = new Date().toISOString();
      const commentVerification = Object.fromEntries(
        await Promise.all(
          acceptedDraft.comments.map(async (comment) => [comment.id, await this.verifyAnchor(comment.anchor)] as const),
        ),
      );
    const range = comparison.range;
    if (range !== undefined && (range.baseOid !== comparison.base.oid || range.headOid !== comparison.head.oid)) {
      throw new Error('Frozen comparison does not match its range provenance.');
    }
    const exportSnapshot = {
      acceptedDraft,
      commentVerification,
      comparison: range === undefined
        ? {
          selectedBase: { label: comparison.base.label, launchOid: comparison.base.oid },
          selectedHead: { label: comparison.head.label, launchOid: comparison.head.oid },
          mergeBaseOid: comparison.mergeBaseOid,
          comparisonKey: comparisonKey(comparison.base.oid, comparison.head.oid),
        }
        : {
          selectedBase: { label: range.requestedBase, launchOid: range.baseOid },
          selectedHead: { label: range.requestedHead, launchOid: range.headOid },
          mergeBaseOid: range.baseOid,
          comparisonKey: range.reviewKey,
        },
      drift: {
        observedAt: exportedAt,
        acknowledged: drifted,
        base: {
          launchOid: comparison.base.oid,
          currentOid: observation.base.kind === 'moved' ? observation.base.newOid : observation.base.kind === 'unchanged' ? comparison.base.oid : null,
          status: observation.base.kind,
        },
        head: {
          launchOid: comparison.head.oid,
          currentOid: observation.head.kind === 'moved' ? observation.head.newOid : observation.head.kind === 'unchanged' ? comparison.head.oid : null,
          status: observation.head.kind,
        },
      },
    };
    const document = range === undefined
      ? buildReviewExportV1(exportSnapshot, exportedAt)
      : buildReviewExportV2(exportSnapshot, range, exportedAt);
      const json = canonicalizeReviewExport(document);
      const markdown = Buffer.from(renderReviewMarkdown(json), 'utf8');
    const published = await publishReviewExport({
      repositoryRoot: comparison.repositoryRoot,
      identity: range === undefined
        ? { kind: 'interactive', baseOid: comparison.base.oid, headOid: comparison.head.oid }
        : { kind: 'range', reviewKey: range.reviewKey },
      json,
        markdown,
        reExportCapability: await getObservedNativeExchangeCapability(),
        revalidate: async () => {
          const current = await draftStore.loadState();
          if (
            current.kind !== 'current' ||
            current.draft.revision !== acceptedDraft.revision ||
            createHash('sha256').update(current.raw).digest('hex') !== draftFingerprint
          ) {
            return false;
          }
          return createHash('sha256').update(JSON.stringify(await selectorDriftObserver.observe())).digest('base64url') === observationFingerprint;
        },
      });
      if (published.kind !== 'exported') {
        return ExportReviewResultSchema.parse({ kind: published.kind });
      }
      return ExportReviewResultSchema.parse({
        kind: 'exported',
        draftRevision: acceptedDraft.revision,
        exportedAt,
        drift: receiptDrift(comparison, observation),
        comparison: {
          base: receiptComparisonEndpoint(comparison.base),
          head: receiptComparisonEndpoint(comparison.head),
        },
        files: published.receipt.files,
      });
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
