import { z } from 'zod';

import {
  AddCommentRequestSchema,
  FileContentResponseSchema,
  FileMetadataResponseSchema,
  type AddCommentRequest,
  type FileContentResponse,
  type FileMetadataResponse,
  SessionResponseSchema,
  type SessionResponse,
} from '../../contracts/api.js';
import {
  AnchorVerificationSchema,
  DurableAnchorV1Schema,
  type ReviewDraftCommentV1,
} from '../../contracts/draft.js';

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
const AcceptedCommentSchema = z.strictObject({
  id: z.string().regex(/^comment_[0-9a-f-]{36}$/u),
  state: z.literal('open'),
  body: z.string().trim().min(1).max(100_000),
  anchor: DurableAnchorV1Schema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const DraftCommentResponseSchema = AcceptedCommentSchema.extend({
  verification: AnchorVerificationSchema,
}).readonly();

const DraftViewSchema = z.strictObject({
  schemaVersion: z.literal(1),
  comparison: z.strictObject({
    baseCommitOid: z.string().regex(/^[0-9a-f]{40,64}$/),
    headCommitOid: z.string().regex(/^[0-9a-f]{40,64}$/),
    mergeBaseOid: z.string().regex(/^[0-9a-f]{40,64}$/),
  }).readonly(),
  revision: z.number().int().nonnegative(),
  summary: z.literal(''),
  comments: z.array(DraftCommentResponseSchema).max(10_000).readonly(),
}).readonly();

export type DraftView = z.infer<typeof DraftViewSchema>;
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
  addComment(request: AddCommentRequest): Promise<ReviewDraftCommentV1>;
  getDraft(): Promise<DraftView>;
  getFileContent(fileId: string): Promise<FileContentResponse>;
  getFileMetadata(fileId: string): Promise<FileMetadataResponse>;
  getSession(): Promise<SessionResponse>;
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

    if (!response.ok) {
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
    async addComment(comment) {
      const payload = AddCommentRequestSchema.safeParse(comment);
      if (!payload.success) {
        throw new SessionClientError('draft', DRAFT_UNAVAILABLE_MESSAGE);
      }
      const result = AcceptedCommentSchema.safeParse(
        await requestJson('/api/draft/comments', 'POST', 'draft', payload.data),
      );
      if (!result.success) {
        throw new SessionClientError('draft', DRAFT_UNAVAILABLE_MESSAGE);
      }
      return result.data as ReviewDraftCommentV1;
    },
    async getDraft() {
      const result = DraftViewSchema.safeParse(await requestJson('/api/draft', 'GET', 'draft'));
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
    async getSession() {
      const result = SessionResponseSchema.safeParse(await requestJson('/api/session', 'GET', 'session'));
      if (!result.success) {
        throw new SessionClientError('session', SESSION_UNAVAILABLE_MESSAGE);
      }
      return result.data;
    },
  });
}