<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';

import type {
  DraftLoadResponse,
  DraftRecoveryResult,
  DraftRevealResult,
  FileContentResponse,
  SessionFile,
  SessionResponse,
  SelectorDriftResponse,
} from '../contracts/api';
import {
  createSessionClient,
  DRAFT_UNAVAILABLE_MESSAGE,
  FILE_UNAVAILABLE_MESSAGE,
  SECURITY_FAILURE_MESSAGE,
  SessionClientError,
} from './api/client';
import type { DraftView, SessionClient } from './api/client';
import DiffWorkspace from './components/DiffWorkspace.vue';
import DraftRecovery from './components/DraftRecovery.vue';
import ReviewPanel from './components/ReviewPanel.vue';
import ErrorState from './components/ErrorState.vue';
import FileTree from './components/FileTree.vue';
import IdentityHeader from './components/IdentityHeader.vue';
import IdentityPanel from './components/IdentityPanel.vue';
import SelectorDriftNotice from './components/SelectorDriftNotice.vue';
import KeyboardHelp from './components/KeyboardHelp.vue';
import ReviewToolbar from './components/ReviewToolbar.vue';
import type { WorkspaceCommand, WorkspaceEvent } from './model/workspace-state.js';
import { createWorkspaceState, type WorkspaceController } from './model/workspace-state.js';
import { reconcileDraftComments } from './model/draft-reconciliation.js';
import type { WorkspaceComment, WorkspaceState } from './model/workspace-state.js';
import {
  createReviewDraftState,
  reviewPrimarySurface,
  type ReadOnlyDraftLoad,
  type ReviewDraftState,
  type ReviewDraftSnapshot,
  type ReviewPendingOperation,
} from './model/review-draft-state.js';
import {
  createSelectorDriftState,
  type SelectorDriftState,
} from './model/selector-drift-state.js';
import type { DraftMutationRequest } from '../contracts/api.js';

type CanonicalReviewDraft = Readonly<{
  revision: number;
  summary: string;
  comments: readonly Readonly<{
    id: string;
    state: WorkspaceComment['state'];
    body: string;
    anchor: WorkspaceComment['recordedAnchor'];
    createdAt: string;
  }>[];
}>;

type ReviewFailure = Readonly<{
  operation: ReviewPendingOperation;
  commentId?: string;
}>;

const session = shallowRef<SessionResponse>();
const errorMessage = ref('');
const selectedFile = shallowRef<SessionFile>();
const selectedContent = shallowRef<FileContentResponse>();
const diffLoading = ref(false);
const diffError = ref('');
const identityOpen = ref(false);
const isNarrow = ref(false);
const isFilesDrawer = ref(false);
const isCommentsDrawer = ref(false);
const filesOpen = ref(false);
const commentsOpen = ref(false);
const keyboardHelpOpen = ref(false);
const liveMessage = ref('');
const diffWorkspace = ref<InstanceType<typeof DiffWorkspace>>();
const identityHeader = ref<InstanceType<typeof IdentityHeader>>();
const identityPanel = ref<InstanceType<typeof IdentityPanel>>();
const filesDrawer = ref<HTMLElement>();
const commentsDrawer = ref<HTMLElement>();
const workspaceState = shallowRef<WorkspaceState>();
const draftRevision = ref(0);
const reviewDraft = shallowRef<ReviewDraftSnapshot>();
const reviewFailure = shallowRef<ReviewFailure | null>(null);
const draftLoad = shallowRef<DraftLoadResponse>();
const recoveredDraft = shallowRef<Extract<DraftRecoveryResult, { readonly kind: 'recovered' }>>();
const recoveredDraftOpen = ref(false);
const selectorDriftStatus = shallowRef<SelectorDriftResponse>();
const primarySurface = computed(() => recoveredDraftOpen.value
  ? 'workspace'
  : reviewPrimarySurface(draftLoad.value));
const recoveryLoad = computed<ReadOnlyDraftLoad | undefined>(() => {
  const load = draftLoad.value;
  return load?.kind === 'malformed' || load?.kind === 'schemaInvalid' || load?.kind === 'newerUnsupported'
    ? load
    : undefined;
});

let reviewState: ReviewDraftState | undefined;
let selectorDriftState: SelectorDriftState | undefined;

let sessionClient: SessionClient | undefined;
let workspace: WorkspaceController | undefined;
let requestVersion = 0;
let filesDrawerMedia: MediaQueryList | undefined;
let commentsDrawerMedia: MediaQueryList | undefined;
let filesOpener: HTMLElement | undefined;
let commentsOpener: HTMLElement | undefined;
let latestConflictDraft: CanonicalReviewDraft | undefined;

const reviewableFiles = computed(() => session.value?.files.filter((file) => file.availability.kind === 'text') ?? []);
const selectedPath = computed(() => selectedFile.value?.newPath?.display ?? selectedFile.value?.oldPath?.display ?? 'Changed file');
const selectedIndex = computed(() => reviewableFiles.value.findIndex((file) => file.fileId === selectedFile.value?.fileId));
const atFirstFile = computed(() => selectedIndex.value <= 0);
const atLastFile = computed(() => selectedIndex.value === -1 || selectedIndex.value === reviewableFiles.value.length - 1);
const activeWorkspaceFile = computed(() => workspaceState.value?.files[workspaceState.value.activeFileId]);
const activeComposer = computed(() => activeWorkspaceFile.value?.composer);
const workspaceComments = computed(() => workspaceState.value?.comments ?? []);
const openCommentCount = computed(
  () => workspaceComments.value.filter((comment) => comment.state === 'open').length,
);
const resolvedCommentCount = computed(
  () => workspaceComments.value.filter((comment) => comment.state === 'resolved').length,
);

function announce(message: string): void {
  liveMessage.value = message;
}

function openFiles(): void {
  filesOpener = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  filesOpen.value = true;
  void nextTick(() => filesDrawer.value?.focus());
}

function closeFiles(): void {
  filesOpen.value = false;
  void nextTick(() => filesOpener?.focus());
}

function openComments(): void {
  commentsOpener = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  commentsOpen.value = true;
  void nextTick(() => commentsDrawer.value?.querySelector<HTMLElement>('#review-heading')?.focus());
}

function closeComments(): void {
  if (!commentsOpen.value) return;
  commentsOpen.value = false;
  void nextTick(() => commentsOpener?.focus());
}

function toggleComments(): void {
  commentsOpen.value ? closeComments() : openComments();
}

function inspectRecordedFile(commentId: string): void {
  const comment = workspaceState.value?.comments.find((candidate) => candidate.id === commentId);
  if (comment?.exactFile.kind === 'available') {
    selectFile(comment.exactFile.fileId);
  }
}

function copyRecordedAnchor(commentId: string): void {
  const comment = workspaceState.value?.comments.find((candidate) => candidate.id === commentId);
  if (comment === undefined) {
    return;
  }
  void navigator.clipboard.writeText(JSON.stringify(comment.recordedAnchor, null, 2))
    .then(() => announce('Recorded anchor details copied.'))
    .catch(() => announce('Couldn’t copy anchor details. The recorded comment remains selected.'));
}

function activeFile(fileId: string): SessionFile | undefined {
  return session.value?.files.find((file) => file.fileId === fileId);
}

async function loadFile(file: SessionFile): Promise<void> {
  selectedFile.value = file;
  diffError.value = '';
  selectedContent.value = undefined;
  if (file.availability.kind !== 'text') {
    diffLoading.value = false;
    return;
  }

  const version = ++requestVersion;
  diffLoading.value = true;
  try {
    const content = await sessionClient?.getFileContent(file.fileId);
    if (content === undefined || version !== requestVersion || content.fileId !== file.fileId) {
      return;
    }
    selectedContent.value = content;
  } catch (error) {
    if (version === requestVersion) {
      diffError.value = error instanceof SessionClientError ? error.message : FILE_UNAVAILABLE_MESSAGE;
    }
  } finally {
    if (version === requestVersion) {
      diffLoading.value = false;
    }
  }
}

function reviewCanonical(draft: CanonicalReviewDraft) {
  return {
    revision: draft.revision,
    summary: draft.summary,
    comments: draft.comments.map((comment) => ({
      id: comment.id,
      state: comment.state,
      body: comment.body,
      side: comment.anchor.side,
      line: comment.anchor.line,
      createdAt: comment.createdAt,
      path: comment.anchor.path,
    })),
  };
}

function acceptedWorkspaceComments(
  draft: CanonicalReviewDraft,
  addedComment?: WorkspaceComment,
): readonly WorkspaceComment[] {
  const existing = new Map(workspace?.getState().comments.map((comment) => [comment.id, comment]));
  return draft.comments.flatMap((comment) => {
    const previous = existing.get(comment.id);
    if (previous !== undefined) {
      return [{ ...previous, state: comment.state, body: comment.body }];
    }
    return addedComment?.id === comment.id ? [addedComment] : [];
  });
}

function reconciledWorkspaceComments(draft: DraftView): readonly WorkspaceComment[] {
  const existing = new Map(workspace?.getState().comments.map((comment) => [comment.id, comment]));
  return reconcileDraftComments(draft.comments, session.value?.files ?? []).map((comment) => {
    const previous = existing.get(comment.id);
    return previous === undefined
      ? comment
      : { ...previous, state: comment.state, body: comment.body };
  });
}

function refreshReviewSnapshot(): void {
  if (reviewState !== undefined) reviewDraft.value = reviewState.snapshot();
}

function acceptReviewDraft(
  draft: CanonicalReviewDraft,
  successfulBuffer?: 'summary' | string,
  addedComment?: WorkspaceComment,
): void {
  reviewState?.accept(reviewCanonical(draft), successfulBuffer);
  refreshReviewSnapshot();
  draftRevision.value = draft.revision;
  if (workspace !== undefined) {
    const transition = workspace.replaceComments(acceptedWorkspaceComments(draft, addedComment));
    workspaceState.value = transition.state;
    runCommands(transition.commands);
  }
}

function initializeReviewDraft(
  draft: CanonicalReviewDraft,
  comments: readonly WorkspaceComment[],
): void {
  draftRevision.value = draft.revision;
  reviewState = createReviewDraftState(reviewCanonical(draft));
  refreshReviewSnapshot();
  const reviewable = session.value?.files.filter((file) => file.availability.kind === 'text') ?? [];
  if (reviewable.length > 0) {
    workspace = createWorkspaceState(reviewable.map((file) => file.fileId), comments);
    workspaceState.value = workspace.getState();
    void loadFile(reviewable[0]!);
  }
}

async function revealDraftFile(): Promise<DraftRevealResult> {
  if (sessionClient === undefined) {
    throw new SessionClientError('draft', DRAFT_UNAVAILABLE_MESSAGE);
  }
  return sessionClient.revealDraftFile();
}

async function recoverDraft(expectedFingerprint: string): Promise<DraftRecoveryResult> {
  if (sessionClient === undefined) {
    throw new SessionClientError('draft', DRAFT_UNAVAILABLE_MESSAGE);
  }
  return sessionClient.recoverDraft(expectedFingerprint);
}

function acceptRecoveredDraft(result: Extract<DraftRecoveryResult, { readonly kind: 'recovered' }>): void {
  recoveredDraft.value = result;
  initializeReviewDraft(result.draft, []);
}

function openRecoveredDraft(): void {
  if (recoveredDraft.value === undefined) {
    return;
  }
  recoveredDraftOpen.value = true;
  announce('New local draft for this pinned comparison.');
}

function mutationOperation(request: DraftMutationRequest): ReviewPendingOperation {
  switch (request.type) {
    case 'setSummary': return 'summary';
    case 'editComment': return 'comment';
    case 'deleteComment': return 'delete';
    case 'resolveComment': return 'resolve';
    case 'reopenComment': return 'reopen';
    case 'addComment': return 'add';
  }
}

function mutationFailure(request: DraftMutationRequest): ReviewFailure {
  return {
    operation: mutationOperation(request),
    ...('commentId' in request ? { commentId: request.commentId } : {}),
  };
}

function mutateReview(request: DraftMutationRequest, successfulBuffer?: 'summary' | string): void {
  if (reviewState === undefined || sessionClient === undefined || !reviewState.start(mutationOperation(request))) return;
  reviewFailure.value = null;
  refreshReviewSnapshot();
  void sessionClient.mutate(request).then((result) => {
    if (result.kind === 'accepted') {
      reviewFailure.value = null;
      acceptReviewDraft(result.draft, successfulBuffer);
      const open = result.draft.comments.filter((comment) => comment.state === 'open').length;
      const resolved = result.draft.comments.length - open;
      announce(
        request.type === 'setSummary'
          ? 'Summary saved locally.'
          : request.type === 'resolveComment'
            ? `Comment resolved. ${open} open, ${resolved} resolved.`
            : request.type === 'reopenComment'
              ? `Comment reopened. ${open} open, ${resolved} resolved.`
              : request.type === 'deleteComment'
                ? `Comment deleted. ${open} open, ${resolved} resolved.`
                : 'Comment saved locally.',
      );
      return;
    }
    if (result.kind === 'revisionConflict') {
      reviewFailure.value = null;
      latestConflictDraft = result.latest;
      reviewState?.conflict(reviewCanonical(result.latest), request.expectedRevision);
      refreshReviewSnapshot();
      return;
    }
    reviewFailure.value = mutationFailure(request);
    reviewState?.fail();
    refreshReviewSnapshot();
  }).catch(() => {
    reviewFailure.value = mutationFailure(request);
    reviewState?.fail();
    refreshReviewSnapshot();
  });
}

function saveSummary(): void {
  const current = reviewDraft.value;
  if (current === undefined || current.summaryBuffer === current.canonical.summary) return;
  mutateReview({ type: 'setSummary', expectedRevision: current.canonical.revision, markdown: current.summaryBuffer }, 'summary');
}

function saveComment(commentId: string): void {
  const current = reviewDraft.value;
  const body = current?.commentBuffers.get(commentId);
  if (current === undefined || body === undefined || body.trim() === '') return;
  mutateReview({ type: 'editComment', expectedRevision: current.canonical.revision, commentId, body }, commentId);
}

function mutateComment(commentId: string, type: 'deleteComment' | 'resolveComment' | 'reopenComment'): void {
  const current = reviewDraft.value;
  if (current === undefined) return;
  mutateReview({ type, expectedRevision: current.canonical.revision, commentId });
}

function exportReview(): void {
  const current = reviewDraft.value;
  if (current === undefined || reviewState === undefined || sessionClient === undefined) return;
  const token = current.export.phase === 'drift' ? current.export.driftAcknowledgementToken ?? undefined : undefined;
  if (!reviewState.startExport(token)) return;
  refreshReviewSnapshot();
  announce('Checking accepted revision for export.');
  void sessionClient.exportReview({
    expectedRevision: current.canonical.revision,
    ...(token === undefined ? {} : { driftAcknowledgementToken: token }),
  }).then((result) => {
    reviewState?.completeExport(result);
    refreshReviewSnapshot();
    if (result.kind === 'driftAcknowledgementRequired') {
      announce('Selected sources changed. Confirm export of the pinned review.');
    } else if (result.kind === 'driftAcknowledgementStale') {
      announce('Selected sources changed again. Review the latest identities.');
    } else if (result.kind === 'exported') {
      announce('Review export complete. Both files were published together.');
    } else if (result.kind === 'publicationFailed' || result.kind === 'reExportUnsupported') {
      announce('Export was not published. No new export pair is available.');
    }
  }).catch(() => {
    reviewState?.completeExport({ kind: 'publicationFailed' });
    refreshReviewSnapshot();
    announce('Export was not published. No new export pair is available.');
  });
}

function cancelExport(): void {
  reviewState?.cancelExport();
  refreshReviewSnapshot();
}

async function refreshIgnoreStatus(): Promise<void> {
  if (sessionClient === undefined) return;
  const status = await sessionClient.getDiffReviewIgnoreStatus();
  reviewState?.setIgnoreStatus(status);
  refreshReviewSnapshot();
}

async function appendDiffReviewIgnoreRule() {
  if (sessionClient === undefined) {
    throw new SessionClientError('draft', DRAFT_UNAVAILABLE_MESSAGE);
  }
  return sessionClient.appendDiffReviewIgnoreRule();
}

async function revealExportDirectory() {
  if (sessionClient === undefined) {
    throw new SessionClientError('draft', DRAFT_UNAVAILABLE_MESSAGE);
  }
  return sessionClient.revealExportDirectory();
}

function reviewUnsavedText(): void {
  document.querySelector<HTMLButtonElement>('.review-summary button')?.focus();
}

async function reloadLatestReview(): Promise<void> {
  if (sessionClient === undefined) {
    return;
  }
  const exportConflict = reviewDraft.value?.export.conflict;
  if (latestConflictDraft === undefined && exportConflict === null) {
    return;
  }

  try {
    const loaded = await sessionClient.getDraft();
    if (loaded.kind !== 'current') {
      return;
    }

    reviewState?.conflict(
      reviewCanonical(loaded.draft),
      reviewDraft.value?.conflict?.expectedRevision ?? exportConflict?.expectedRevision ?? loaded.draft.revision,
    );
    reviewState?.reloadLatest();
    draftRevision.value = loaded.draft.revision;
    if (workspace !== undefined) {
      const transition = workspace.replaceComments(reconciledWorkspaceComments(loaded.draft));
      workspaceState.value = transition.state;
      runCommands(transition.commands);
    }
    latestConflictDraft = undefined;
  } catch {
    announce('Latest draft couldn’t be reloaded. Your unsaved text is still here.');
  } finally {
    refreshReviewSnapshot();
  }
}

function filePath(fileId: string): string {
  const file = session.value?.files.find((candidate) => candidate.fileId === fileId);
  return file?.newPath?.display ?? file?.oldPath?.display ?? 'Recorded file unavailable';
}


function runCommands(commands: readonly WorkspaceCommand[]): void {
  for (const command of commands) {
    switch (command.type) {
      case 'announce':
        announce(command.text);
        break;
      case 'focus-comment':
        void nextTick(() => diffWorkspace.value?.focusComment(command.commentId));
        break;
      case 'go-to-change':
        command.direction === 'next' ? diffWorkspace.value?.nextChange() : diffWorkspace.value?.previousChange();
        break;
      case 'layout':
        diffWorkspace.value?.layout();
        break;
      case 'persist-comment':
        void sessionClient?.mutate({
          type: 'addComment',
          expectedRevision: draftRevision.value,
          fileId: command.fileId,
          side: command.side,
          line: command.line,
          body: command.body,
        }).then((result) => {
          if (result.kind === 'revisionConflict') {
            latestConflictDraft = result.latest;
            reviewState?.conflict(reviewCanonical(result.latest), draftRevision.value);
            refreshReviewSnapshot();
            dispatchWorkspace({
              type: 'add-failed',
              message: 'Comment wasn’t added. Your text is still here. Reload the latest draft before trying again.',
            });
            return;
          }
          if (result.kind !== 'accepted') {
            throw new SessionClientError('draft', 'Comment wasn’t added. Your text is still here. Reload the latest draft before trying again.');
          }
          const comment = result.draft.comments.at(-1);
          if (comment === undefined) {
            throw new SessionClientError('draft', 'Comment wasn’t added. Your text is still here. Check that Diff Review is running, then try again.');
          }
          const workspaceComment: WorkspaceComment = {
            id: comment.id,
            fileId: command.fileId,
            exactFile: { kind: 'available', fileId: command.fileId },
            side: comment.anchor.side,
            line: comment.anchor.line,
            body: comment.body,
            state: comment.state,
            createdAt: comment.createdAt,
            status: 'verified',
            recordedAnchor: comment.anchor,
          };
          acceptReviewDraft(result.draft, undefined, workspaceComment);
          dispatchWorkspace({ type: 'add-succeeded', comment: workspaceComment });
          announce(`Comment added and saved locally on ${command.side} line ${command.line}.`);
        }).catch(() => {
          dispatchWorkspace({
            type: 'add-failed',
            message: 'Comment wasn’t added. Your text is still here. Check that Diff Review is running, then try again.',
          });
        });
        break;
      case 'reveal-comment-context':
      case 'reveal-line':
        diffWorkspace.value?.revealComment(command.side, command.line);
        break;
      case 'load-file': {
        const file = activeFile(command.fileId);
        if (file !== undefined) void loadFile(file);
        break;
      }
      default:
        break;
    }
  }
}

function dispatchWorkspace(event: WorkspaceEvent): void {
  if (workspace === undefined) return;
  const transition = workspace.dispatch(event);
  workspaceState.value = transition.state;
  runCommands(transition.commands);
}

function selectFile(fileId: string): void {
  const file = activeFile(fileId);
  if (file === undefined) {
    return;
  }
  filesOpen.value = false;
  if (file.availability.kind !== 'text') {
    selectedFile.value = file;
    selectedContent.value = undefined;
    diffError.value = '';
    return;
  }
  if (workspace?.getState().activeFileId === file.fileId) {
    void loadFile(file);
    return;
  }
  dispatchWorkspace({ type: 'switch-file', fileId: file.fileId });
}

function previousFile(): void {
  dispatchWorkspace({ type: 'previous-file' });
}

function nextFile(): void {
  dispatchWorkspace({ type: 'next-file' });
}

function previousChange(): void {
  dispatchWorkspace({ type: 'previous-change' });
}

function nextChange(): void {
  dispatchWorkspace({ type: 'next-change' });
}

function handleDiffReady(fileId: string): void {
  dispatchWorkspace({ type: 'diff-ready', fileId });
  announce(`Loaded ${selectedPath.value}.`);
}

function retryDiff(): void {
  if (selectedFile.value !== undefined) {
    void loadFile(selectedFile.value);
  }
}

function toggleIdentity(): void {
  if (identityOpen.value) {
    closeIdentity();
    return;
  }

  identityOpen.value = true;
  if (isNarrow.value) {
    void nextTick(() => identityPanel.value?.focusClose());
  }
}

function closeIdentity(): void {
  identityOpen.value = false;
  void nextTick(() => identityHeader.value?.focusDisclosure());
}

function handleKeydown(event: KeyboardEvent): void {
  const target = event.target;
  if (target instanceof HTMLTextAreaElement && target.closest('.inline-comment-composer') !== null) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      dispatchWorkspace({ type: 'add-comment' });
    } else if (event.key === 'Escape') {
      event.preventDefault();
      dispatchWorkspace({ type: 'escape' });
    }
    return;
  }
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
  if (event.key === 'Escape') {
    if (keyboardHelpOpen.value) {
      keyboardHelpOpen.value = false;
    } else if (commentsOpen.value) {
      closeComments();
    } else if (filesOpen.value) {
      closeFiles();
    } else if (identityOpen.value) {
      closeIdentity();
    }
    return;
  }
  if (event.key === '?' && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    keyboardHelpOpen.value = true;
  } else if (event.altKey && event.shiftKey && event.key === '[') {
    event.preventDefault();
    previousFile();
  } else if (event.altKey && event.shiftKey && event.key === ']') {
    event.preventDefault();
    nextFile();
  } else if (event.key === 'F7') {
    event.preventDefault();
    event.shiftKey ? previousChange() : nextChange();
  }
}

function handleViewportChange(): void {
  isFilesDrawer.value = filesDrawerMedia?.matches ?? false;
  isCommentsDrawer.value = commentsDrawerMedia?.matches ?? false;
  isNarrow.value = isFilesDrawer.value;
  if (!isFilesDrawer.value) {
    filesOpen.value = false;
  }
  dispatchWorkspace({ type: 'resize' });
  diffWorkspace.value?.layout();
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown);
  filesDrawerMedia = window.matchMedia('(max-width: 1099px)');
  commentsDrawerMedia = window.matchMedia('(max-width: 1439px)');
  commentsOpen.value = !commentsDrawerMedia.matches;
  handleViewportChange();
  filesDrawerMedia.addEventListener('change', handleViewportChange);
  commentsDrawerMedia.addEventListener('change', handleViewportChange);
  try {
    sessionClient = createSessionClient();
    const loaded = await sessionClient.getSession();
    session.value = loaded;
    selectorDriftState = createSelectorDriftState(sessionClient, announce, { status: selectorDriftStatus });
    selectorDriftState.start();
    const loadedDraft = await sessionClient.getDraft();
    draftLoad.value = loadedDraft;
    if (loadedDraft.kind === 'current' || loadedDraft.kind === 'missing') {
      const draft = loadedDraft.kind === 'current'
        ? loadedDraft.draft
        : { revision: 0, summary: '', comments: [] as const };
      initializeReviewDraft(
        draft,
        loadedDraft.kind === 'current' ? reconcileDraftComments(draft.comments, loaded.files) : [],
      );
    void refreshIgnoreStatus().catch(() => undefined);
      announce(draft.comments.length > 0
        ? 'Local draft resumed. Accepted comments for this pinned comparison are ready.'
        : 'New local draft for this pinned comparison.');
    }
  } catch (error) {
    errorMessage.value = error instanceof SessionClientError ? error.message : SECURITY_FAILURE_MESSAGE;
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
  filesDrawerMedia?.removeEventListener('change', handleViewportChange);
  commentsDrawerMedia?.removeEventListener('change', handleViewportChange);
  selectorDriftState?.stop();
});
</script>

<template>
  <main v-if="primarySurface === 'loading' && errorMessage === ''" class="loading-shell">
    <section class="state-card" aria-labelledby="loading-heading">
      <h1 id="loading-heading">Diff Review: loading pinned comparison</h1>
      <p role="status">Opening local draft…</p>
    </section>
  </main>

  <main v-else-if="errorMessage !== ''" class="unavailable-shell">
    <h1>Review unavailable</h1>
    <ErrorState :message="errorMessage" />
  </main>

  <div v-else class="session-shell">
    <a class="skip-link" href="#changed-files-heading">Skip to changed files</a>
    <a class="skip-link" href="#diff-review-heading">Skip to diff</a>
    <a class="skip-link" href="#review-heading">Skip review</a>
    <IdentityHeader ref="identityHeader" :session="session" :expanded="identityOpen" @toggle="toggleIdentity" />
    <SelectorDriftNotice :drift="selectorDriftStatus" />
    <IdentityPanel ref="identityPanel" v-if="identityOpen" :session="session" :modal="isNarrow" @close="closeIdentity" />

    <DraftRecovery
      v-if="recoveryLoad !== undefined && primarySurface !== 'workspace'"
      :load="recoveryLoad"
      :reveal-draft-file="revealDraftFile"
      :recover-draft="recoverDraft"
      @recovered="acceptRecoveredDraft"
      @open-new-draft="openRecoveredDraft"
    />
    <div v-else class="review-shell" :inert="identityOpen && isNarrow">
      <nav
        ref="filesDrawer"
        class="review-files"
        :class="{ 'review-files--open': filesOpen }"
        :inert="isFilesDrawer && !filesOpen"
        :aria-hidden="isFilesDrawer && !filesOpen ? 'true' : undefined"
        aria-label="Changed files"
        tabindex="-1"
      >
        <button v-if="isFilesDrawer" type="button" class="drawer-close ui-button" @click="closeFiles">Close files</button>
        <FileTree v-if="session.files.length > 0" :files="session.files" :initial-selected-file-id="selectedFile?.fileId" @select="selectFile" @activate="selectFile" />
        <section v-else class="empty-state">
          <h2 id="changed-files-heading">Changed files</h2>
          <p>0 changed files</p>
        </section>
      </nav>

      <main class="review-main" aria-labelledby="diff-review-heading">
        <div class="active-file-strip">
          <div>
            <p class="active-file-strip__eyebrow">Diff review</p>
            <h1 id="diff-review-heading">{{ selectedPath }}</h1>
          </div>
          <button v-if="isFilesDrawer" type="button" class="ui-button" @click="openFiles">Files</button>
        </div>
        <ReviewToolbar
          :at-first-file="atFirstFile"
          :at-last-file="atLastFile"
          :has-active-file="selectedFile?.availability.kind === 'text'"
          :open-comment-count="openCommentCount"
          :resolved-comment-count="resolvedCommentCount"
          :review-expanded="commentsOpen"
          @previous-file="previousFile"
          @next-file="nextFile"
          @previous-change="previousChange"
          @next-change="nextChange"
          @comments="toggleComments"
          @keyboard-help="keyboardHelpOpen = true"
        />
        <KeyboardHelp :open="keyboardHelpOpen" @close="keyboardHelpOpen = false" />

        <section v-if="session.files.length === 0" class="empty-state">
          <h2>No PR-style changes in this pinned comparison</h2>
          <p>The selected head has no changes from the displayed merge base.</p>
        </section>
        <section v-else-if="selectedFile?.availability.kind !== 'text'" class="empty-state">
          <h2>Diff unavailable for this file</h2>
          <p>{{ selectedFile?.availability.kind === 'unsupported' ? `unsupported: ${selectedFile.availability.reason}` : 'unavailable: missing-object' }}. Select another changed file to continue reviewing.</p>
        </section>
        <section v-else-if="diffLoading" class="diff-state" aria-live="polite">Loading diff…</section>
        <section v-else-if="diffError !== ''" class="empty-state">
          <h2>Diff couldn’t be loaded</h2>
          <p>The pinned file content is unavailable. Try again, or relaunch Diff Review if the session ended.</p>
          <button type="button" class="ui-button" @click="retryDiff">Try loading diff again</button>
        </section>
        <DiffWorkspace
          v-else-if="selectedContent !== undefined"
          ref="diffWorkspace"
          :comments="workspaceComments"
          :composer="activeComposer"
          :content="selectedContent"
          :path="selectedPath"
          @activate="(side, line) => dispatchWorkspace({ type: 'activate-line', side, line })"
          @add="dispatchWorkspace({ type: 'add-comment' })"
          @cancel="dispatchWorkspace({ type: 'cancel-composer' })"
          @confirm-discard="dispatchWorkspace({ type: 'confirm-discard' })"
          @confirm-move="dispatchWorkspace({ type: 'confirm-move' })"
          @keep-writing="dispatchWorkspace({ type: 'keep-writing' })"
          @ready="handleDiffReady"
          @update-text="(text) => dispatchWorkspace({ type: 'composer-text-changed', text })"
        />

      </main>
      <aside
        v-show="commentsOpen"
        id="review-panel"
        ref="commentsDrawer"
        class="comments-rail"
        :class="{ 'comments-rail--open': commentsOpen }"
        :inert="!commentsOpen"
        :aria-hidden="commentsOpen ? undefined : 'true'"
        aria-labelledby="review-heading"
      >
        <ReviewPanel
          v-if="reviewDraft !== undefined && session !== undefined"
          :comments="workspaceComments"
          :inventory="reviewableFiles.map((file) => ({ identity: file.newPath?.bytesBase64url ?? file.oldPath?.bytesBase64url ?? file.fileId, display: file.newPath?.display ?? file.oldPath?.display ?? 'Changed file' }))"
          :summary="reviewDraft.canonical.summary"
          :summary-buffer="reviewDraft.summaryBuffer"
          :revision="reviewDraft.canonical.revision"
          :pinned-base="session.base"
          :pinned-head="session.head"
          :comment-buffers="reviewDraft.commentBuffers"
          :pending="reviewDraft.pending"
          :conflict="reviewDraft.conflict === null ? null : { expectedRevision: reviewDraft.conflict.expectedRevision, actualRevision: reviewDraft.conflict.latest.revision }"
          :failure="reviewFailure"
          :retained-summary="reviewDraft.retained.summary"
          @cancel-summary="reviewState?.setSummaryBuffer(reviewDraft?.canonical.summary ?? ''); refreshReviewSnapshot()"
          @close="closeComments"
          @copy-recorded-anchor="copyRecordedAnchor"
          :export-state="reviewDraft.export"
          :append-ignore-rule="appendDiffReviewIgnoreRule"
          :refresh-ignore-status="refreshIgnoreStatus"
          :reveal-export-directory="revealExportDirectory"
          @resolve="mutateComment($event, 'resolveComment')"
          @inspect-recorded-file="inspectRecordedFile"
          @reload-latest="reloadLatestReview"
          @save-comment="saveComment"
          @save-summary="saveSummary"
          @show="(commentId) => dispatchWorkspace({ type: 'show-comment', commentId })"
          @update:comment-buffer="(commentId, value) => { reviewState?.setCommentBuffer(commentId, value); refreshReviewSnapshot(); }"
          @update:summary-buffer="(value) => { reviewState?.setSummaryBuffer(value); refreshReviewSnapshot(); }"
          @cancel-export="cancelExport"
          @export="exportReview"
          @review-unsaved-text="reviewUnsavedText"
        />
      </aside>
    </div>
    <p class="sr-only" aria-live="polite">{{ liveMessage }}</p>
  </div>
</template>

<style src="./styles.css"></style>
