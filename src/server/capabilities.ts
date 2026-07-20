import type { PinnedComparison } from '../contracts/comparison.js';
import {
  FileMetadataResponseSchema,
  SessionResponseSchema,
  type FileMetadataResponse,
  type SessionResponse,
} from '../contracts/api.js';

export type CapabilityRegistryOptions = Readonly<{
  onCapabilityLookup?: (fileId: string) => void;
}>;

export type CapabilityRegistry = Readonly<{
  session: SessionResponse;
  lookup: (fileId: string) => FileMetadataResponse | undefined;
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

export function createCapabilityRegistry(
  comparison: PinnedComparison,
  options: CapabilityRegistryOptions = {},
): CapabilityRegistry {
  const filesByCapability = new Map<string, FileMetadataResponse>();

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
      return sessionFile;
    }),
  });

  return Object.freeze({
    session,
    lookup(fileId: string) {
      options.onCapabilityLookup?.(fileId);
      return filesByCapability.get(fileId);
    },
  });
}
