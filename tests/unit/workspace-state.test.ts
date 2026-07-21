import { describe, expect, it } from 'vitest';

import {
  createWorkspaceState,
  type WorkspaceComment,
} from '../../src/web/model/workspace-state.js';

const comments: readonly WorkspaceComment[] = [
  {
    id: 'comment-base-3',
    fileId: 'file-a',
    side: 'base',
    line: 3,
    body: 'Existing base comment',
    status: 'verified',
  },
  {
    id: 'comment-hidden',
    fileId: 'file-b',
    side: 'head',
    line: 8,
    body: 'Hidden comment',
    status: 'verified',
  },
  {
    id: 'comment-stale',
    fileId: 'file-b',
    side: 'base',
    line: 2,
    body: 'Stale comment',
    status: 'stale',
  },
];


describe('workspace session state', () => {
  it('restores an outgoing file only after immutable models report diff-ready and resizes in place', () => {
    const workspace = createWorkspaceState(['file-a', 'file-b']);

    workspace.dispatch({ type: 'diff-ready', fileId: 'file-a' });
    workspace.dispatch({ type: 'view-changed', scrollTop: 120, side: 'head', line: 7, context: 'all-revealed' });
    workspace.dispatch({ type: 'activate-line', side: 'head', line: 7 });
    workspace.dispatch({ type: 'composer-text-changed', text: 'Keep this draft' });

    const switching = workspace.dispatch({ type: 'switch-file', fileId: 'file-b' });
    expect(switching.state.activeFileId).toBe('file-b');
    expect(switching.state.readyFileId).toBeNull();
    expect(switching.commands).toEqual([{ type: 'load-file', fileId: 'file-b' }]);

    workspace.dispatch({ type: 'diff-ready', fileId: 'file-b' });
    const returning = workspace.dispatch({ type: 'switch-file', fileId: 'file-a' });
    const restored = workspace.dispatch({ type: 'diff-ready', fileId: 'file-a' });

    expect(returning.commands).toEqual([{ type: 'load-file', fileId: 'file-a' }]);
    expect(restored.state.files['file-a']).toMatchObject({
      scrollTop: 120,
      focused: { side: 'head', line: 7 },
      context: 'all-revealed',
      composer: { side: 'head', line: 7, text: 'Keep this draft', status: 'ready' },
    });
    expect(restored.commands).toEqual([
      { type: 'restore-view', fileId: 'file-a', scrollTop: 120, context: 'all-revealed' },
      { type: 'rebuild-annotations', fileId: 'file-a' },
      { type: 'reveal-line', fileId: 'file-a', side: 'head', line: 7, center: true },
      { type: 'focus-editor-line', fileId: 'file-a', side: 'head', line: 7 },
    ]);

    const resize = workspace.dispatch({ type: 'resize' });
    expect(resize.commands).toEqual([{ type: 'layout' }]);
    expect(resize.state).toEqual(restored.state);
  });

  it('uses an exact side-line key: pointer and keyboard activation share it and existing comments win', () => {
    const workspace = createWorkspaceState(['file-a'], comments);
    workspace.dispatch({ type: 'diff-ready', fileId: 'file-a' });

    const base = workspace.dispatch({ type: 'activate-line', side: 'base', line: 3 });
    const head = workspace.dispatch({ type: 'activate-line', side: 'head', line: 3 });

    expect(base.commands).toEqual([{ type: 'focus-comment', commentId: 'comment-base-3' }]);
    expect(head.state.files['file-a'].composer).toEqual({ side: 'head', line: 3, text: '', status: 'ready' });
    expect(head.commands).toEqual([{ type: 'rebuild-annotations', fileId: 'file-a' }]);

    const keyboard = workspace.dispatch({ type: 'activate-focused-line', side: 'head', line: 3 });
    expect(keyboard.state).toEqual(head.state);
    expect(keyboard.commands).toEqual([{ type: 'rebuild-annotations', fileId: 'file-a' }]);
  });

  it('keeps one per-file composer, asks before destructive movement, and preserves text on blur', () => {
    const workspace = createWorkspaceState(['file-a', 'file-b']);
    workspace.dispatch({ type: 'diff-ready', fileId: 'file-a' });
    workspace.dispatch({ type: 'activate-line', side: 'head', line: 4 });
    workspace.dispatch({ type: 'composer-text-changed', text: 'Unaccepted text' });

    const movement = workspace.dispatch({ type: 'activate-line', side: 'base', line: 4 });
    expect(movement.state.files['file-a'].composer).toMatchObject({ text: 'Unaccepted text', status: 'confirm-move' });
    expect(movement.commands).toEqual([{ type: 'rebuild-annotations', fileId: 'file-a' }]);

    const keepWriting = workspace.dispatch({ type: 'keep-writing' });
    expect(keepWriting.state.files['file-a'].composer).toMatchObject({ side: 'head', line: 4, text: 'Unaccepted text', status: 'ready' });

    const blur = workspace.dispatch({ type: 'blur' });
    expect(blur.state).toEqual(keepWriting.state);
    expect(blur.commands).toEqual([]);
  });

  it('only discards non-empty text after explicit confirmation and escapes confirmation into writing', () => {
    const workspace = createWorkspaceState(['file-a']);
    workspace.dispatch({ type: 'diff-ready', fileId: 'file-a' });
    workspace.dispatch({ type: 'activate-line', side: 'base', line: 5 });

    const emptyCancel = workspace.dispatch({ type: 'cancel-composer' });
    expect(emptyCancel.state.files['file-a'].composer).toBeUndefined();
    expect(emptyCancel.commands).toEqual([{ type: 'focus-gutter', fileId: 'file-a', side: 'base', line: 5 }]);

    workspace.dispatch({ type: 'activate-line', side: 'base', line: 5 });
    workspace.dispatch({ type: 'composer-text-changed', text: 'Do not discard yet' });
    const confirmation = workspace.dispatch({ type: 'cancel-composer' });
    expect(confirmation.state.files['file-a'].composer?.status).toBe('confirm-discard');

    const escaped = workspace.dispatch({ type: 'escape' });
    expect(escaped.state.files['file-a'].composer).toMatchObject({ text: 'Do not discard yet', status: 'ready' });
    const reopened = workspace.dispatch({ type: 'cancel-composer' });
    const discarded = workspace.dispatch({ type: 'confirm-discard' });
    expect(reopened.state.files['file-a'].composer?.status).toBe('confirm-discard');
    expect(discarded.state.files['file-a'].composer).toBeUndefined();
  });

  it('accepts only explicit non-whitespace add responses and keeps the exact anchor and text on recoverable outcomes', () => {
    const workspace = createWorkspaceState(['file-a']);
    workspace.dispatch({ type: 'diff-ready', fileId: 'file-a' });
    workspace.dispatch({ type: 'activate-line', side: 'head', line: 9 });

    const invalid = workspace.dispatch({ type: 'add-comment' });
    expect(invalid.state.files['file-a'].composer).toMatchObject({ status: 'ready', validation: 'Write a comment before adding it.' });

    workspace.dispatch({ type: 'composer-text-changed', text: 'Needs a guard' });
    const pending = workspace.dispatch({ type: 'add-comment' });
    expect(pending.state.files['file-a'].composer).toEqual({ side: 'head', line: 9, text: 'Needs a guard', status: 'pending' });
    expect(pending.commands).toEqual([{ type: 'persist-comment', fileId: 'file-a', side: 'head', line: 9, body: 'Needs a guard' }]);

    const failed = workspace.dispatch({ type: 'add-failed', message: 'Comment wasn’t added. Your text is still here.' });
    expect(failed.state.files['file-a'].composer).toMatchObject({ side: 'head', line: 9, text: 'Needs a guard', status: 'ready' });

    workspace.dispatch({ type: 'add-comment' });
    const duplicate = workspace.dispatch({ type: 'add-duplicate', comment: comments[0]! });
    expect(duplicate.state.files['file-a'].composer).toMatchObject({ side: 'head', line: 9, text: 'Needs a guard', status: 'ready' });
    expect(duplicate.commands).toEqual([{ type: 'focus-comment', commentId: 'comment-base-3' }]);

    workspace.dispatch({ type: 'add-comment' });
    const accepted = workspace.dispatch({
      type: 'add-succeeded',
      comment: { id: 'comment-head-9', fileId: 'file-a', side: 'head', line: 9, body: 'Needs a guard', status: 'verified' },
    });
    expect(accepted.state.files['file-a'].composer).toBeUndefined();
    expect(accepted.state.comments).toContainEqual(expect.objectContaining({ id: 'comment-head-9', side: 'head', line: 9 }));
    expect(accepted.commands).toEqual([{ type: 'focus-comment', commentId: 'comment-head-9' }]);
  });

  it('navigates deterministic file order and delegates change movement to the public adapter command', () => {
    const workspace = createWorkspaceState(['file-a', 'file-b']);
    workspace.dispatch({ type: 'diff-ready', fileId: 'file-a' });

    expect(workspace.dispatch({ type: 'previous-file' }).commands).toEqual([]);
    expect(workspace.dispatch({ type: 'next-change' }).commands).toEqual([{ type: 'go-to-change', direction: 'next' }]);
    expect(workspace.dispatch({ type: 'previous-change' }).commands).toEqual([{ type: 'go-to-change', direction: 'previous' }]);
    expect(workspace.dispatch({ type: 'next-file' }).commands).toEqual([{ type: 'load-file', fileId: 'file-b' }]);
    workspace.dispatch({ type: 'diff-ready', fileId: 'file-b' });
    expect(workspace.dispatch({ type: 'next-file' }).commands).toEqual([]);
    expect(workspace.dispatch({ type: 'previous-file' }).commands).toEqual([{ type: 'load-file', fileId: 'file-a' }]);
  });

  it('reveals verified hidden comments before centering, focusing, and announcing without relocating stale or orphaned records', () => {
    const workspace = createWorkspaceState(['file-a', 'file-b'], comments);
    workspace.dispatch({ type: 'diff-ready', fileId: 'file-a' });

    const switching = workspace.dispatch({ type: 'show-comment', commentId: 'comment-hidden' });
    expect(switching.commands).toEqual([{ type: 'load-file', fileId: 'file-b' }]);

    const revealed = workspace.dispatch({ type: 'diff-ready', fileId: 'file-b' });
    expect(revealed.commands).toEqual([
      { type: 'restore-view', fileId: 'file-b', scrollTop: 0, context: 'collapsed' },
      { type: 'reveal-comment-context', fileId: 'file-b', side: 'head', line: 8 },
      { type: 'rebuild-annotations', fileId: 'file-b' },
      { type: 'reveal-line', fileId: 'file-b', side: 'head', line: 8, center: true },
      { type: 'focus-comment', commentId: 'comment-hidden' },
      { type: 'announce', text: 'Showing comment on head line 8.' },
    ]);

    const stale = workspace.dispatch({ type: 'show-comment', commentId: 'comment-stale' });
    expect(stale.commands).toEqual([]);
    expect(stale.state.activeFileId).toBe('file-b');
  });

  it('never serializes browser-session view state into a repository draft payload', () => {
    const workspace = createWorkspaceState(['file-a']);
    workspace.dispatch({ type: 'diff-ready', fileId: 'file-a' });
    workspace.dispatch({ type: 'view-changed', scrollTop: 77, side: 'base', line: 2, context: 'all-revealed' });
    workspace.dispatch({ type: 'activate-line', side: 'base', line: 2 });
    workspace.dispatch({ type: 'composer-text-changed', text: 'Memory only' });

    expect(workspace.toRepositoryDraft()).toEqual({ comments: [] });
  });
});
