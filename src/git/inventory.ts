import type { ExactPath } from '../domain/path-bytes.js';
import type { GitRunner } from './runner.js';

export type ChangedFileStatusKind =
  | 'added'
  | 'copied'
  | 'deleted'
  | 'modified'
  | 'renamed'
  | 'type-changed'
  | 'unsupported';

export interface ChangedFileStatus {
  readonly code: string;
  readonly kind: ChangedFileStatusKind;
  readonly similarity: number | null;
}

export interface ChangedFile {
  readonly id: string;
  readonly status: ChangedFileStatus;
  readonly oldMode: string;
  readonly newMode: string;
  readonly oldBlobOid: string;
  readonly newBlobOid: string;
  readonly oldPath?: ExactPath;
  readonly newPath?: ExactPath;
  readonly additions: number | null;
  readonly deletions: number | null;
  readonly unsupportedReason?: string;
}

export interface CreateChangedFileInventoryOptions {
  readonly repositoryRoot: string;
  readonly mergeBaseOid: string;
  readonly headOid: string;
  readonly objectFormat: 'sha1' | 'sha256';
  readonly signal?: AbortSignal;
  readonly fileIdNamespace?: Uint8Array;
}

export interface ChangedFileInventoryDependencies {
  readonly runner?: GitRunner;
}

export function createChangedFileInventory(
  _options: CreateChangedFileInventoryOptions,
  _dependencies: ChangedFileInventoryDependencies = {},
): Promise<readonly ChangedFile[]> {
  throw new Error('Changed-file inventory is not implemented');
}
