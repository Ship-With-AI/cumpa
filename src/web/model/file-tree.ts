import type { SessionFile } from '../../contracts/api.js';
import {
  buildFileTree,
  type FileTreeDirectory,
  type FileTreeLeaf,
  type FileTreeNode,
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

function directoryRowId(directoryId: string): string {
  return `directory:${directoryId}`;
}

function fileRowId(fileId: string): string {
  return `file:${fileId}`;
}

function collectDirectoryIds(
  nodes: readonly FileTreeNode[],
  output: string[],
): void {
  for (const node of nodes) {
    if (node.kind === 'directory') {
      output.push(node.directoryId);
      collectDirectoryIds(node.children, output);
    }
  }
}

function flattenVisibleRows(
  nodes: readonly FileTreeNode[],
  expanded: ReadonlySet<string>,
  depth: number,
  output: VisibleFileTreeRow[],
): void {
  for (const node of nodes) {
    if (node.kind === 'directory') {
      output.push(
        Object.freeze({
          ...node,
          rowId: directoryRowId(node.directoryId),
          depth,
        }),
      );
      if (expanded.has(node.directoryId)) {
        flattenVisibleRows(node.children, expanded, depth + 1, output);
      }
    } else {
      output.push(
        Object.freeze({
          ...node,
          rowId: fileRowId(node.fileId),
          depth,
        }),
      );
    }
  }
}

function findParentDirectoryRowId(
  nodes: readonly FileTreeNode[],
  targetRowId: string,
  parentRowId: string | null = null,
): string | null | undefined {
  for (const node of nodes) {
    if (node.kind === 'file') {
      if (fileRowId(node.fileId) === targetRowId) {
        return parentRowId;
      }
      continue;
    }

    const rowId = directoryRowId(node.directoryId);
    if (rowId === targetRowId) {
      return parentRowId;
    }
    const nested = findParentDirectoryRowId(node.children, targetRowId, rowId);
    if (nested !== undefined) {
      return nested;
    }
  }
  return undefined;
}

function createModel(
  tree: readonly FileTreeNode[],
  allDirectoryIds: readonly string[],
  expandedDirectoryIds: readonly string[],
  focusedRowId: string | null,
  selectedFileId: string | null,
): FileTreeModel {
  const expanded = new Set(expandedDirectoryIds);
  const visibleRows: VisibleFileTreeRow[] = [];
  flattenVisibleRows(tree, expanded, 0, visibleRows);
  const frozenVisibleRows = Object.freeze(visibleRows);

  let model: FileTreeModel;

  const focusRow = (rowId: string): FileTreeModel => {
    const target = frozenVisibleRows.find((candidate) => candidate.rowId === rowId);
    if (target === undefined) {
      return model;
    }
    const nextSelection =
      target.kind === 'file' ? target.fileId : selectedFileId;
    if (focusedRowId === rowId && selectedFileId === nextSelection) {
      return model;
    }
    return createModel(
      tree,
      allDirectoryIds,
      expandedDirectoryIds,
      rowId,
      nextSelection,
    );
  };

  const toggleDirectory = (directoryId: string): FileTreeModel => {
    if (!allDirectoryIds.includes(directoryId)) {
      return model;
    }
    const nextExpanded = new Set(expandedDirectoryIds);
    if (nextExpanded.has(directoryId)) {
      nextExpanded.delete(directoryId);
    } else {
      nextExpanded.add(directoryId);
    }
    return createModel(
      tree,
      allDirectoryIds,
      Object.freeze(
        allDirectoryIds.filter((candidate) => nextExpanded.has(candidate)),
      ),
      directoryRowId(directoryId),
      selectedFileId,
    );
  };

  const handleKey = (key: FileTreeNavigationKey): FileTreeModel => {
    if (focusedRowId === null || frozenVisibleRows.length === 0) {
      return model;
    }
    const focusedIndex = frozenVisibleRows.findIndex(
      (candidate) => candidate.rowId === focusedRowId,
    );
    if (focusedIndex < 0) {
      return model;
    }
    const focused = frozenVisibleRows[focusedIndex]!;

    if (key === 'ArrowUp') {
      return focusedIndex === 0
        ? model
        : focusRow(frozenVisibleRows[focusedIndex - 1]!.rowId);
    }
    if (key === 'ArrowDown') {
      return focusedIndex === frozenVisibleRows.length - 1
        ? model
        : focusRow(frozenVisibleRows[focusedIndex + 1]!.rowId);
    }
    if (key === 'Home') {
      return focusRow(frozenVisibleRows[0]!.rowId);
    }
    if (key === 'End') {
      return focusRow(frozenVisibleRows[frozenVisibleRows.length - 1]!.rowId);
    }
    if (key === 'ArrowRight') {
      if (focused.kind === 'file') {
        return model;
      }
      if (!expanded.has(focused.directoryId)) {
        return toggleDirectory(focused.directoryId);
      }
      const firstChild = frozenVisibleRows[focusedIndex + 1];
      return firstChild !== undefined && firstChild.depth > focused.depth
        ? focusRow(firstChild.rowId)
        : model;
    }
    if (key === 'ArrowLeft') {
      if (
        focused.kind === 'directory' &&
        expanded.has(focused.directoryId)
      ) {
        return toggleDirectory(focused.directoryId);
      }
      const parent = findParentDirectoryRowId(tree, focused.rowId);
      return parent === undefined || parent === null ? model : focusRow(parent);
    }
    if (key === 'Enter' || key === ' ') {
      return focused.kind === 'directory'
        ? toggleDirectory(focused.directoryId)
        : focusRow(focused.rowId);
    }
    return model;
  };

  model = Object.freeze({
    tree,
    visibleRows: frozenVisibleRows,
    expandedDirectoryIds,
    focusedRowId,
    selectedFileId,
    focusRow,
    toggleDirectory,
    handleKey,
  });
  return model;
}

export function createFileTreeModel(
  files: readonly SessionFile[],
): FileTreeModel {
  const tree = buildFileTree(files);
  const directoryIds: string[] = [];
  collectDirectoryIds(tree, directoryIds);
  const expandedDirectoryIds = Object.freeze(directoryIds);
  const initialRows: VisibleFileTreeRow[] = [];
  flattenVisibleRows(tree, new Set(directoryIds), 0, initialRows);
  const initialLeaf = initialRows.find((row) => row.kind === 'file');

  return createModel(
    tree,
    expandedDirectoryIds,
    expandedDirectoryIds,
    initialLeaf?.rowId ?? null,
    initialLeaf?.kind === 'file' ? initialLeaf.fileId : null,
  );
}
