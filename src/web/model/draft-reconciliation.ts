import type { SessionFile } from '../../contracts/api.js';
import type { DraftView } from '../api/client.js';
import type { WorkspaceComment } from './workspace-state.js';

type DraftComment = DraftView['comments'][number];
type AnchorSide = DraftComment['anchor']['side'];
type ExactPath = NonNullable<SessionFile['oldPath']>;
type ExactFileIndex = Readonly<Record<AnchorSide, ReadonlyMap<string, string | null>>>;

function selectedPath(file: SessionFile, side: AnchorSide): ExactPath | undefined {
  return side === 'base' ? file.oldPath : file.newPath;
}

function addFile(index: Map<string, string | null>, path: ExactPath | undefined, fileId: string): void {
  if (path === undefined) {
    return;
  }

  const existing = index.get(path.bytesBase64url);
  index.set(path.bytesBase64url, existing === undefined ? fileId : null);
}

function exactFileIndex(files: readonly SessionFile[]): ExactFileIndex {
  const base = new Map<string, string | null>();
  const head = new Map<string, string | null>();

  for (const file of files) {
    addFile(base, selectedPath(file, 'base'), file.fileId);
    addFile(head, selectedPath(file, 'head'), file.fileId);
  }

  return { base, head };
}

function reconcile(comment: DraftComment, index: ExactFileIndex): WorkspaceComment {
  const fileId = index[comment.anchor.side].get(comment.anchor.path.bytesBase64url) ?? null;

  return {
    id: comment.id,
    fileId,
    exactFile: fileId === null ? { kind: 'unavailable' } : { kind: 'available', fileId },
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
