import type { SessionFile } from '../contracts/api.js';
import {
  compareExactPaths,
  createExactPath,
  decodeBase64url,
  encodeBase64url,
  type ExactPath,
} from './path-bytes.js';

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

interface ProjectedFile {
  readonly file: SessionFile;
  readonly effectivePath: ExactPath;
}

interface ProjectedNode {
  readonly node: FileTreeNode;
  readonly firstFile: ProjectedFile;
}

interface MutableDirectory {
  readonly segment: ExactPath;
  readonly path: ExactPath;
  readonly directories: Map<string, MutableDirectory>;
  readonly files: ProjectedFile[];
}

interface MutableRoot {
  readonly directories: Map<string, MutableDirectory>;
  readonly files: ProjectedFile[];
}

function effectivePath(file: SessionFile): ExactPath {
  if (file.status.kind === 'deleted') {
    if (file.oldPath === undefined) {
      throw new Error(`Deleted file ${file.fileId} has no old path`);
    }
    return file.oldPath;
  }

  if (
    file.status.kind === 'added' ||
    file.status.kind === 'renamed' ||
    file.status.kind === 'copied'
  ) {
    if (file.newPath === undefined) {
      throw new Error(`${file.status.kind} file ${file.fileId} has no new path`);
    }
    return file.newPath;
  }

  const path = file.newPath ?? file.oldPath;
  if (path === undefined) {
    throw new Error(`File ${file.fileId} has no effective path`);
  }
  return path;
}

function compareOptionalPaths(
  left: ExactPath | undefined,
  right: ExactPath | undefined,
): number {
  if (left === undefined) {
    return right === undefined ? 0 : -1;
  }
  if (right === undefined) {
    return 1;
  }
  return compareExactPaths(left, right);
}

function compareProjectedFiles(
  left: ProjectedFile,
  right: ProjectedFile,
): number {
  const fileIdOrder =
    left.file.fileId < right.file.fileId
      ? -1
      : left.file.fileId > right.file.fileId
        ? 1
        : 0;
  return (
    compareExactPaths(left.effectivePath, right.effectivePath) ||
    compareOptionalPaths(left.file.oldPath, right.file.oldPath) ||
    fileIdOrder
  );
}

function createMutableDirectory(
  segmentBytes: Uint8Array,
  pathBytes: Uint8Array,
): MutableDirectory {
  return {
    segment: createExactPath(segmentBytes),
    path: createExactPath(pathBytes),
    directories: new Map(),
    files: [],
  };
}

function insertProjectedFile(root: MutableRoot, projected: ProjectedFile): void {
  const pathBytes = decodeBase64url(
    projected.effectivePath.bytesBase64url,
  );
  let parent = root;
  let segmentStart = 0;

  for (let index = 0; index < pathBytes.length; index += 1) {
    if (pathBytes[index] !== 0x2f) {
      continue;
    }

    const segmentBytes = pathBytes.subarray(segmentStart, index);
    const pathPrefix = pathBytes.subarray(0, index);
    const segmentKey = encodeBase64url(segmentBytes);
    let child = parent.directories.get(segmentKey);
    if (child === undefined) {
      child = createMutableDirectory(segmentBytes, pathPrefix);
      parent.directories.set(segmentKey, child);
    }
    parent = child;
    segmentStart = index + 1;
  }

  parent.files.push(projected);
}


function projectDirectory(directory: MutableDirectory): ProjectedNode {
  const segments: ExactPath[] = [directory.segment];
  let compacted = directory;

  while (
    compacted.files.length === 0 &&
    compacted.directories.size === 1
  ) {
    const child = compacted.directories.values().next()
      .value as MutableDirectory;
    segments.push(child.segment);
    compacted = child;
  }

  const children = projectChildren(compacted);
  return {
    node: Object.freeze({
      kind: 'directory',
      directoryId: `directory_${compacted.path.bytesBase64url}`,
      path: compacted.path,
      segments: Object.freeze(segments),
      children: children.nodes,
    }),
    firstFile: children.firstFile!,
  };
}

function projectChildren(
  parent: Pick<MutableRoot, 'directories' | 'files'>,
): {
  readonly nodes: readonly FileTreeNode[];
  readonly firstFile: ProjectedFile | undefined;
} {
  const projectedNodes: ProjectedNode[] = [];
  for (const directory of parent.directories.values()) {
    projectedNodes.push(projectDirectory(directory));
  }
  for (const projected of parent.files) {
    projectedNodes.push({
      node: Object.freeze({
        kind: 'file',
        fileId: projected.file.fileId,
        file: projected.file,
        effectivePath: projected.effectivePath,
      }),
      firstFile: projected,
    });
  }
  projectedNodes.sort((left, right) =>
    compareProjectedFiles(left.firstFile, right.firstFile),
  );
  return {
    nodes: Object.freeze(projectedNodes.map((projected) => projected.node)),
    firstFile: projectedNodes[0]?.firstFile,
  };
}

export function buildFileTree(
  files: readonly SessionFile[],
): readonly FileTreeNode[] {
  const projectedFiles = files
    .map((file) => ({ file, effectivePath: effectivePath(file) }))
    .sort(compareProjectedFiles);
  const root: MutableRoot = { directories: new Map(), files: [] };

  for (const projected of projectedFiles) {
    insertProjectedFile(root, projected);
  }

  return projectChildren(root).nodes;
}
