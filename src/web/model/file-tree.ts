import type { SessionFile } from '../../contracts/api.js';
import type {
  FileTreeDirectory,
  FileTreeLeaf,
  FileTreeNode,
} from '../../domain/file-tree.js';

export type FileTreeNavigationKey =
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Home'
  | 'End'
  | 'Enter'
  | ' ';

export interface VisibleFileTreeDirectory extends FileTreeDirectory {
  readonly rowId: string;
  readonly depth: number;
}

export interface VisibleFileTreeLeaf extends FileTreeLeaf {
  readonly rowId: string;
  readonly depth: number;
}

export type VisibleFileTreeRow =
  | VisibleFileTreeDirectory
  | VisibleFileTreeLeaf;

export interface FileTreeModel {
  readonly tree: readonly FileTreeNode[];
  readonly visibleRows: readonly VisibleFileTreeRow[];
  readonly expandedDirectoryIds: readonly string[];
  readonly focusedRowId: string | null;
  readonly selectedFileId: string | null;
  readonly focusRow: (rowId: string) => FileTreeModel;
  readonly toggleDirectory: (directoryId: string) => FileTreeModel;
  readonly handleKey: (key: FileTreeNavigationKey) => FileTreeModel;
}

export function createFileTreeModel(
  _files: readonly SessionFile[],
): FileTreeModel {
  throw new Error('File-tree navigation is not implemented');
}
