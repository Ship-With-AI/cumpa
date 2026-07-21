import type { DiffSide } from '../monaco/line-mapping.js';
import type { DurableAnchorV1Dto } from '../../contracts/draft.js';


export type WorkspaceCommentStatus = 'verified' | 'stale' | 'orphaned';
export type ComposerStatus = 'ready' | 'pending' | 'confirm-discard' | 'confirm-move';

export type RecordedAnchorDetails = DurableAnchorV1Dto;

export type ExactFileCapability =
  | Readonly<{ kind: 'available'; fileId: string }>
  | Readonly<{ kind: 'unavailable' }>;

export type WorkspaceComment = Readonly<{
  id: string;
  fileId: string | null;
  exactFile: ExactFileCapability;
  side: DiffSide;
  line: number;
  body: string;
  status: WorkspaceCommentStatus;
  recordedAnchor: RecordedAnchorDetails;
}>;

export type WorkspaceComposer = Readonly<{
  side: DiffSide;
  line: number;
  text: string;
  status: ComposerStatus;
  validation?: string;
  error?: string;
}>;

export type WorkspaceFileState = Readonly<{
  scrollTop: number;
  focused?: Readonly<{ side: DiffSide; line: number }>;
  context: 'collapsed' | 'all-revealed';
  composer?: WorkspaceComposer;
}>;

export type WorkspaceState = Readonly<{
  activeFileId: string;
  readyFileId: string | null;
  files: Readonly<Record<string, WorkspaceFileState>>;
  comments: readonly WorkspaceComment[];
  pendingCommentId: string | null;
}>;

export type WorkspaceCommand =
  | Readonly<{ type: 'announce'; text: string }>
  | Readonly<{ type: 'focus-comment'; commentId: string }>
  | Readonly<{ type: 'focus-editor-line'; fileId: string; side: DiffSide; line: number }>
  | Readonly<{ type: 'focus-gutter'; fileId: string; side: DiffSide; line: number }>
  | Readonly<{ type: 'go-to-change'; direction: 'next' | 'previous' }>
  | Readonly<{ type: 'layout' }>
  | Readonly<{ type: 'load-file'; fileId: string }>
  | Readonly<{ type: 'persist-comment'; fileId: string; side: DiffSide; line: number; body: string }>
  | Readonly<{ type: 'rebuild-annotations'; fileId: string }>
  | Readonly<{ type: 'restore-view'; fileId: string; scrollTop: number; context: 'collapsed' | 'all-revealed' }>
  | Readonly<{ type: 'reveal-comment-context'; fileId: string; side: DiffSide; line: number }>
  | Readonly<{ type: 'reveal-line'; fileId: string; side: DiffSide; line: number; center: boolean }>;

export type WorkspaceTransition = Readonly<{
  state: WorkspaceState;
  commands: readonly WorkspaceCommand[];
}>;

export type WorkspaceEvent =
  | Readonly<{ type: 'activate-focused-line'; side: DiffSide; line: number }>
  | Readonly<{ type: 'activate-line'; side: DiffSide; line: number }>
  | Readonly<{ type: 'add-comment' }>
  | Readonly<{ type: 'add-duplicate'; comment: WorkspaceComment }>
  | Readonly<{ type: 'add-failed'; message: string }>
  | Readonly<{ type: 'add-succeeded'; comment: WorkspaceComment }>
  | Readonly<{ type: 'blur' }>
  | Readonly<{ type: 'cancel-composer' }>
  | Readonly<{ type: 'composer-text-changed'; text: string }>
  | Readonly<{ type: 'confirm-discard' }>
  | Readonly<{ type: 'diff-ready'; fileId: string }>
  | Readonly<{ type: 'escape' }>
  | Readonly<{ type: 'keep-writing' }>
  | Readonly<{ type: 'next-change' }>
  | Readonly<{ type: 'next-file' }>
  | Readonly<{ type: 'previous-change' }>
  | Readonly<{ type: 'previous-file' }>
  | Readonly<{ type: 'resize' }>
  | Readonly<{ type: 'show-comment'; commentId: string }>
  | Readonly<{ type: 'switch-file'; fileId: string }>
  | Readonly<{ type: 'view-changed'; scrollTop: number; side: DiffSide; line: number; context: 'collapsed' | 'all-revealed' }>;

export type RepositoryDraftPayload = Readonly<{
  comments: readonly WorkspaceComment[];
}>;

export interface WorkspaceController {
  dispatch(event: WorkspaceEvent): WorkspaceTransition;
  getState(): WorkspaceState;
  toRepositoryDraft(): RepositoryDraftPayload;
}

const EMPTY_FILE_STATE: WorkspaceFileState = Object.freeze({
  scrollTop: 0,
  context: 'collapsed',
});

function fileState(state: WorkspaceState, fileId = state.activeFileId): WorkspaceFileState {
  return state.files[fileId] ?? EMPTY_FILE_STATE;
}

function replaceFileState(state: WorkspaceState, fileId: string, replacement: WorkspaceFileState): WorkspaceState {
  return {
    ...state,
    files: {
      ...state.files,
      [fileId]: replacement,
    },
  };
}

function transition(state: WorkspaceState, commands: readonly WorkspaceCommand[] = []): WorkspaceTransition {
  return { state, commands };
}

function canonicalComment(
  comments: readonly WorkspaceComment[],
  fileId: string,
  side: DiffSide,
  line: number,
): WorkspaceComment | undefined {
  return comments.find((comment) => comment.fileId === fileId
    && comment.side === side
    && comment.line === line
    && comment.status === 'verified');
}

function restoreCommands(fileId: string, state: WorkspaceFileState): WorkspaceCommand[] {
  const commands: WorkspaceCommand[] = [{
    type: 'restore-view',
    fileId,
    scrollTop: state.scrollTop,
    context: state.context,
  }];
  commands.push({ type: 'rebuild-annotations', fileId });
  if (state.focused !== undefined) {
    commands.push({ type: 'reveal-line', fileId, ...state.focused, center: true });
    commands.push({ type: 'focus-editor-line', fileId, ...state.focused });
  }
  return commands;
}

function switchFile(state: WorkspaceState, fileId: string): WorkspaceTransition {
  if (!(fileId in state.files) || fileId === state.activeFileId) {
    return transition(state);
  }
  return transition({ ...state, activeFileId: fileId, readyFileId: null }, [{ type: 'load-file', fileId }]);
}

function activateLine(state: WorkspaceState, side: DiffSide, line: number): WorkspaceTransition {
  const existing = canonicalComment(state.comments, state.activeFileId, side, line);
  if (existing !== undefined) {
    return transition(state, [{ type: 'focus-comment', commentId: existing.id }]);
  }

  const current = fileState(state);
  const composer = current.composer;
  if (composer !== undefined && (composer.side !== side || composer.line !== line) && composer.text.trim().length > 0) {
    const next = replaceFileState(state, state.activeFileId, {
      ...current,
      composer: { ...composer, status: 'confirm-move' },
    });
    return transition(next, [{ type: 'rebuild-annotations', fileId: state.activeFileId }]);
  }

  const next = replaceFileState(state, state.activeFileId, {
    ...current,
    focused: { side, line },
    composer: {
      side,
      line,
      text: composer?.side === side && composer.line === line ? composer.text : '',
      status: 'ready',
    },
  });
  return transition(next, [{ type: 'rebuild-annotations', fileId: state.activeFileId }]);
}

function cancelComposer(state: WorkspaceState): WorkspaceTransition {
  const current = fileState(state);
  const composer = current.composer;
  if (composer === undefined) {
    return transition(state);
  }
  if (composer.text.trim().length > 0) {
    return transition(replaceFileState(state, state.activeFileId, {
      ...current,
      composer: { ...composer, status: 'confirm-discard' },
    }));
  }
  return transition(replaceFileState(state, state.activeFileId, { ...current, composer: undefined }), [{
    type: 'focus-gutter',
    fileId: state.activeFileId,
    side: composer.side,
    line: composer.line,
  }]);
}

function completePendingComment(state: WorkspaceState, comment: WorkspaceComment): WorkspaceTransition {
  const current = fileState(state);
  const composer = current.composer;
  if (composer === undefined || composer.status !== 'pending'
    || comment.fileId !== state.activeFileId
    || comment.side !== composer.side
    || comment.line !== composer.line) {
    return transition(state);
  }
  const next = replaceFileState({
    ...state,
    comments: [...state.comments, comment],
  }, state.activeFileId, { ...current, composer: undefined });
  return transition(next, [{ type: 'focus-comment', commentId: comment.id }]);
}

function showComment(state: WorkspaceState, commentId: string): WorkspaceTransition {
  const comment = state.comments.find((candidate) => candidate.id === commentId);
  if (comment === undefined || comment.status !== 'verified' || comment.fileId === null || comment.exactFile?.kind === 'unavailable') {
    return transition(state);
  }
  const fileId = comment.exactFile?.kind === 'available' ? comment.exactFile.fileId : comment.fileId;
  if (fileId !== state.activeFileId) {
    const switching = switchFile({ ...state, pendingCommentId: comment.id }, fileId);
    return switching;
  }
  const commands: WorkspaceCommand[] = [
    { type: 'reveal-comment-context', fileId, side: comment.side, line: comment.line },
    { type: 'rebuild-annotations', fileId },
    { type: 'reveal-line', fileId, side: comment.side, line: comment.line, center: true },
    { type: 'focus-comment', commentId: comment.id },
    { type: 'announce', text: `Showing comment on ${comment.side} line ${comment.line}.` },
  ];
  return transition(state, commands);
}

function applyEvent(state: WorkspaceState, fileIds: readonly string[], event: WorkspaceEvent): WorkspaceTransition {
  switch (event.type) {
    case 'activate-focused-line':
    case 'activate-line':
      return activateLine(state, event.side, event.line);
    case 'add-comment': {
      const current = fileState(state);
      const composer = current.composer;
      if (composer === undefined || composer.status !== 'ready') {
        return transition(state);
      }
      if (composer.text.trim().length === 0) {
        return transition(replaceFileState(state, state.activeFileId, {
          ...current,
          composer: { ...composer, validation: 'Write a comment before adding it.' },
        }));
      }
      const pending = { ...composer, status: 'pending' as const };
      return transition(replaceFileState(state, state.activeFileId, { ...current, composer: pending }), [{
        type: 'persist-comment',
        fileId: state.activeFileId,
        side: composer.side,
        line: composer.line,
        body: composer.text,
      }]);
    }
    case 'add-duplicate': {
      const current = fileState(state);
      const composer = current.composer;
      if (composer === undefined) {
        return transition(state);
      }
      return transition(replaceFileState(state, state.activeFileId, {
        ...current,
        composer: { ...composer, status: 'ready' },
      }), [{ type: 'focus-comment', commentId: event.comment.id }]);
    }
    case 'add-failed': {
      const current = fileState(state);
      const composer = current.composer;
      return composer === undefined ? transition(state) : transition(replaceFileState(state, state.activeFileId, {
        ...current,
        composer: { ...composer, status: 'ready', error: event.message },
      }));
    }
    case 'add-succeeded':
      return completePendingComment(state, event.comment);
    case 'blur':
      return transition(state);
    case 'cancel-composer':
      return cancelComposer(state);
    case 'composer-text-changed': {
      const current = fileState(state);
      const composer = current.composer;
      return composer === undefined ? transition(state) : transition(replaceFileState(state, state.activeFileId, {
        ...current,
        composer: { ...composer, text: event.text, status: 'ready', validation: undefined, error: undefined },
      }));
    }
    case 'confirm-discard': {
      const current = fileState(state);
      return current.composer?.status !== 'confirm-discard'
        ? transition(state)
        : transition(replaceFileState(state, state.activeFileId, { ...current, composer: undefined }));
    }
    case 'diff-ready': {
      if (event.fileId !== state.activeFileId) {
        return transition(state);
      }
      const ready = { ...state, readyFileId: event.fileId };
      const pendingComment = ready.pendingCommentId === null
        ? undefined
        : ready.comments.find((comment) => comment.id === ready.pendingCommentId);
      if (pendingComment === undefined) {
        return transition(ready, restoreCommands(event.fileId, fileState(ready)));
      }
      return transition({ ...ready, pendingCommentId: null }, [
        { type: 'restore-view', fileId: event.fileId, scrollTop: fileState(ready).scrollTop, context: fileState(ready).context },
        { type: 'reveal-comment-context', fileId: event.fileId, side: pendingComment.side, line: pendingComment.line },
        { type: 'rebuild-annotations', fileId: event.fileId },
        { type: 'reveal-line', fileId: event.fileId, side: pendingComment.side, line: pendingComment.line, center: true },
        { type: 'focus-comment', commentId: pendingComment.id },
        { type: 'announce', text: `Showing comment on ${pendingComment.side} line ${pendingComment.line}.` },
      ]);
    }
    case 'escape': {
      const current = fileState(state);
      if (current.composer?.status === 'confirm-discard' || current.composer?.status === 'confirm-move') {
        return transition(replaceFileState(state, state.activeFileId, {
          ...current,
          composer: { ...current.composer, status: 'ready' },
        }));
      }
      return cancelComposer(state);
    }
    case 'keep-writing': {
      const current = fileState(state);
      return current.composer === undefined ? transition(state) : transition(replaceFileState(state, state.activeFileId, {
        ...current,
        composer: { ...current.composer, status: 'ready' },
      }));
    }
    case 'next-change':
      return transition(state, [{ type: 'go-to-change', direction: 'next' }]);
    case 'previous-change':
      return transition(state, [{ type: 'go-to-change', direction: 'previous' }]);
    case 'next-file': {
      const currentIndex = fileIds.indexOf(state.activeFileId);
      return currentIndex < 0 || currentIndex === fileIds.length - 1
        ? transition(state)
        : switchFile(state, fileIds[currentIndex + 1]!);
    }
    case 'previous-file': {
      const currentIndex = fileIds.indexOf(state.activeFileId);
      return currentIndex <= 0 ? transition(state) : switchFile(state, fileIds[currentIndex - 1]!);
    }
    case 'resize':
      return transition(state, [{ type: 'layout' }]);
    case 'show-comment':
      return showComment(state, event.commentId);
    case 'switch-file':
      return switchFile(state, event.fileId);
    case 'view-changed':
      return transition(replaceFileState(state, state.activeFileId, {
        ...fileState(state),
        scrollTop: event.scrollTop,
        focused: { side: event.side, line: event.line },
        context: event.context,
      }));
  }
}

export function createWorkspaceState(
  fileIds: readonly string[],
  comments: readonly WorkspaceComment[] = [],
): WorkspaceController {
  if (fileIds.length === 0) {
    throw new Error('Workspace state requires at least one opaque file ID.');
  }
  const initialFiles = Object.fromEntries(fileIds.map((fileId) => [fileId, EMPTY_FILE_STATE]));
  let state: WorkspaceState = {
    activeFileId: fileIds[0]!,
    readyFileId: null,
    files: initialFiles,
    comments: [...comments],
    pendingCommentId: null,
  };

  return {
    dispatch(event) {
      const next = applyEvent(state, fileIds, event);
      state = next.state;
      return next;
    },
    getState() {
      return state;
    },
    toRepositoryDraft() {
      return { comments: state.comments };
    },
  };
}
