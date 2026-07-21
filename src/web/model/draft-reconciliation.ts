import type { SessionFile } from '../../contracts/api.js';
import type { DraftView } from '../api/client.js';
import type { ExactFileCapability, WorkspaceComment } from './workspace-state.js';

type DraftComment = DraftView['comments'][number];
type AnchorSide = DraftComment['anchor']['side'];
type ExactPath = NonNullable<SessionFile['oldPath']>;
type ExactFileIndex = Readonly<Record<AnchorSide, ReadonlyMap<string, ExactFileCapability>>>;

const UNAVAILABLE_FILE: ExactFileCapability = Object.freeze({ kind: 'unavailable' });

function selectedPath(file: SessionFile, side: AnchorSide): ExactPath | undefined {
  return side === 'base' ? file.oldPath : file.newPath;
}

function addFile(index: Map<string, ExactFileCapability>, path: ExactPath | undefined, fileId: string): void {
  if (path === undefined) {
    return;
  }

  const existing = index.get(path.bytesBase64url);
  index.set(path.bytesBase64url, existing === undefined ? { kind: 'available', fileId } : UNAVAILABLE_FILE);
}

function exactFileIndex(files: readonly SessionFile[]): ExactFileIndex {
  const base = new Map<string, ExactFileCapability>();
  const head = new Map<string, ExactFileCapability>();

  for (const file of files) {
    addFile(base, selectedPath(file, 'base'), file.fileId);
    addFile(head, selectedPath(file, 'head'), file.fileId);
  }

  return { base, head };
}

function reconcile(comment: DraftComment, index: ExactFileIndex): WorkspaceComment {
  const exactFile = index[comment.anchor.side].get(comment.anchor.path.bytesBase64url) ?? UNAVAILABLE_FILE;
  const fileId = exactFile.kind === 'available' ? exactFile.fileId : null;

  return {
    id: comment.id,
    fileId,
    exactFile,
    side: comment.anchor.side,
    line: comment.anchor.line,
    body: comment.body,
    status: comment.verification.state,
    recordedAnchor: comment.anchor,
  };
}

export function reconcileDraftComment(comment: DraftComment, files: readonly SessionFile[]): WorkspaceComment {
  return reconcile(comment, exactFileIndex(files));
}

export function reconcileDraftComments(comments: readonly DraftComment[], files: readonly SessionFile[]): readonly WorkspaceComment[] {
  const index = exactFileIndex(files);
  return comments.map((comment) => reconcile(comment, index));
}
