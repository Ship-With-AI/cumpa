import {
  DraftLoadResponseSchema,
  DraftMutationResultSchema,
  DraftMutationRequestSchema,
  DraftRecoveryRequestSchema,
  DiffReviewIgnoreStatusSchema,
  DraftRecoveryResultSchema,
  DraftRevealResultSchema,
  ExportReviewRequestSchema,
  ExportReviewResultSchema,
  FileContentResponseSchema,
  FileMetadataResponseSchema,
  type DraftLoadResponse,
  type DraftMutationRequest,
  type DraftMutationResult,
  type DraftRecoveryResult,
  type DraftRevealResult,
  type DiffReviewIgnoreStatus,
  type ExportReviewRequest,
  type ExportReviewResult,
  type FileContentResponse,
  type FileMetadataResponse,
  SelectorDriftResponseSchema,
  type SelectorDriftResponse,
  SessionResponseSchema,
  type SessionResponse,
} from '../../contracts/api.js';

export const SECURITY_FAILURE_MESSAGE =
  'This request is not available in the current session. Relaunch Diff Review from the terminal.';
export const SESSION_UNAVAILABLE_MESSAGE =
  'This pinned session is unavailable. Return to the terminal and launch Diff Review again. Diagnostic details are shown in the terminal.';
export const SESSION_STOPPED_MESSAGE =
  'This pinned session has stopped. Relaunch Diff Review from the terminal to continue.';
export const FILE_UNAVAILABLE_MESSAGE =
  'File details could not be loaded. Retry this file. If the problem continues, check the terminal diagnostic.';
export const DRAFT_UNAVAILABLE_MESSAGE =
  'Local draft couldn’t be opened. Existing review data was left unchanged. Relaunch Diff Review or check the terminal for details.';
export type DraftView = Extract<DraftLoadResponse, { readonly kind: 'current' }>['draft'];
export type SessionClientErrorKind = 'security' | 'session' | 'stopped' | 'file' | 'draft';

export class SessionClientError extends Error {
  readonly kind: SessionClientErrorKind;

  constructor(kind: SessionClientErrorKind, message: string) {
    super(message);
    this.name = 'SessionClientError';
    this.kind = kind;
  }
}

export interface SessionClient {
  mutate(request: DraftMutationRequest): Promise<DraftMutationResult>;
  exportReview(request: ExportReviewRequest): Promise<ExportReviewResult>;
  getDraft(): Promise<DraftLoadResponse>;
  getDiffReviewIgnoreStatus(): Promise<DiffReviewIgnoreStatus>;
  recoverDraft(expectedFingerprint: string): Promise<DraftRecoveryResult>;
  revealDraftFile(): Promise<DraftRevealResult>;
  getFileContent(fileId: string): Promise<FileContentResponse>;
  getFileMetadata(fileId: string): Promise<FileMetadataResponse>;
  getSession(): Promise<SessionResponse>;
  getSelectorDrift(): Promise<SelectorDriftResponse>;
}

export interface SessionClientEnvironment {
  readonly location?: Pick<Location, 'hash' | 'pathname' | 'search'>;
  readonly history?: Pick<History, 'state' | 'replaceState'>;
  readonly fetch?: typeof fetch;
}

export function createSessionClient(environment: SessionClientEnvironment = {}): SessionClient {
  const location = environment.location ?? window.location;
  const history = environment.history ?? window.history;
  const request = environment.fetch ?? window.fetch.bind(window);
  const fragment = new URLSearchParams(location.hash.startsWith('#') ? location.hash.slice(1) : '');
  const token = fragment.get('token');

  history.replaceState(history.state, '', `${location.pathname}${location.search}`);

  if (token === null || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new SessionClientError('security', SECURITY_FAILURE_MESSAGE);
  }

  const requestJson = async (
    path: string,
    method: 'GET' | 'POST',
    failureKind: 'session' | 'file' | 'draft',
    body?: unknown,
    allowedFailureStatuses: readonly number[] = [],
  ): Promise<unknown> => {
    let response: Response;
    try {
      response = await request(path, {
        method,
        headers: {
          authorization: `Bearer ${token}`,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        credentials: 'same-origin',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new SessionClientError(
        failureKind === 'session' ? 'stopped' : failureKind,
        failureKind === 'session'
          ? SESSION_STOPPED_MESSAGE
          : failureKind === 'draft' ? DRAFT_UNAVAILABLE_MESSAGE : FILE_UNAVAILABLE_MESSAGE,
      );
    }

    if (!response.ok && !allowedFailureStatuses.includes(response.status)) {
      throw new SessionClientError(
        response.status === 401 || response.status === 403 ? 'security' : failureKind,
        response.status === 401 || response.status === 403
          ? SECURITY_FAILURE_MESSAGE
          : failureKind === 'session'
            ? SESSION_UNAVAILABLE_MESSAGE
            : failureKind === 'draft' ? DRAFT_UNAVAILABLE_MESSAGE : FILE_UNAVAILABLE_MESSAGE,
      );
    }

    try {
      return await response.json();
    } catch {
      throw new SessionClientError(
        failureKind,
        failureKind === 'session'
          ? SESSION_UNAVAILABLE_MESSAGE
          : failureKind === 'draft' ? DRAFT_UNAVAILABLE_MESSAGE : FILE_UNAVAILABLE_MESSAGE,
      );
    }
  };

  return Object.freeze({
    async mutate(input) {
      const payload = DraftMutationRequestSchema.safeParse(input);
      if (!payload.success) {
        throw new SessionClientError('draft', DRAFT_UNAVAILABLE_MESSAGE);
      }
      const result = DraftMutationResultSchema.safeParse(
        await requestJson('/api/draft/mutations', 'POST', 'draft', payload.data, [404, 409, 500]),
      );
      if (!result.success) {
        throw new SessionClientError('draft', DRAFT_UNAVAILABLE_MESSAGE);
      }
      return result.data;
    },
    async exportReview(input) {
      const payload = ExportReviewRequestSchema.safeParse(input);
      if (!payload.success) {
        throw new SessionClientError('draft', DRAFT_UNAVAILABLE_MESSAGE);
      }
      const result = ExportReviewResultSchema.safeParse(
        await requestJson('/api/export', 'POST', 'draft', payload.data, [409, 500]),
      );
      if (!result.success) {
        throw new SessionClientError('draft', DRAFT_UNAVAILABLE_MESSAGE);
      }
      return result.data;
    },
    async getDiffReviewIgnoreStatus() {
      const result = DiffReviewIgnoreStatusSchema.safeParse(
        await requestJson('/api/export/gitignore', 'GET', 'draft'),
      );
      if (!result.success) {
        throw new SessionClientError('draft', DRAFT_UNAVAILABLE_MESSAGE);
      }
      return result.data;
    },
    async getDraft() {
      const result = DraftLoadResponseSchema.safeParse(await requestJson('/api/draft', 'GET', 'draft'));
      if (!result.success) {
        throw new SessionClientError('draft', DRAFT_UNAVAILABLE_MESSAGE);
      }
      return result.data;
    },
    async recoverDraft(expectedFingerprint) {
      const payload = DraftRecoveryRequestSchema.safeParse({ expectedFingerprint });
      if (!payload.success) {
        throw new SessionClientError('draft', DRAFT_UNAVAILABLE_MESSAGE);
      }
      const result = DraftRecoveryResultSchema.safeParse(
        await requestJson('/api/draft/recovery', 'POST', 'draft', payload.data, [409, 500]),
      );
      if (!result.success) {
        throw new SessionClientError('draft', DRAFT_UNAVAILABLE_MESSAGE);
      }
      return result.data;
    },
    async revealDraftFile() {
      const result = DraftRevealResultSchema.safeParse(
        await requestJson('/api/draft/reveal', 'POST', 'draft', undefined, [500]),
      );
      if (!result.success) {
        throw new SessionClientError('draft', DRAFT_UNAVAILABLE_MESSAGE);
      }
      return result.data;
    },
    async getFileContent(fileId) {
      const result = FileContentResponseSchema.safeParse(
        await requestJson(`/api/files/${encodeURIComponent(fileId)}/content`, 'GET', 'file'),
      );
      if (!result.success) {
        throw new SessionClientError('file', FILE_UNAVAILABLE_MESSAGE);
      }
      return result.data;
    },
    async getFileMetadata(fileId) {
      const result = FileMetadataResponseSchema.safeParse(
        await requestJson(`/api/files/${encodeURIComponent(fileId)}`, 'GET', 'file'),
      );
      if (!result.success) {
        throw new SessionClientError('file', FILE_UNAVAILABLE_MESSAGE);
      }
      return result.data;
    },
    async getSelectorDrift() {
      const result = SelectorDriftResponseSchema.safeParse(
        await requestJson('/api/selector-drift', 'GET', 'session'),
      );
      if (!result.success) {
        throw new SessionClientError('session', SESSION_UNAVAILABLE_MESSAGE);
      }
      return result.data;
    },
    async getSession() {
      const result = SessionResponseSchema.safeParse(await requestJson('/api/session', 'GET', 'session'));
      if (!result.success) {
        throw new SessionClientError('session', SESSION_UNAVAILABLE_MESSAGE);
      }
      return result.data;
    },
  });
}