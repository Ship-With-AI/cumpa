import type { SessionFile } from '../contracts/api.js';
import type { ExactPath } from './path-bytes.js';

export interface FileTreeLeaf {
  readonly kind: 'file';
  readonly fileId: string;
  readonly file: SessionFile;
  readonly effectivePath: ExactPath;
}

export interface FileTreeDirectory {
  readonly kind: 'directory';
  readonly directoryId: string;
  readonly path: ExactPath;
  readonly segments: readonly ExactPath[];
  readonly children: readonly FileTreeNode[];
}

export type FileTreeNode = FileTreeDirectory | FileTreeLeaf;

export function buildFileTree(
  _files: readonly SessionFile[],
): readonly FileTreeNode[] {
  throw new Error('File-tree projection is not implemented');
}
