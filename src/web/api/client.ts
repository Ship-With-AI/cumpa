import {
  FileMetadataResponseSchema,
  SessionResponseSchema,
  type FileMetadataResponse,
  type SessionResponse,
} from '../../contracts/api.js';

export const SECURITY_FAILURE_MESSAGE =
  'This request is not available in the current session. Relaunch Diff Review from the terminal.';
export const SESSION_UNAVAILABLE_MESSAGE =
  'This pinned session is unavailable. Return to the terminal and launch Diff Review again. Diagnostic details are shown in the terminal.';
export const FILE_UNAVAILABLE_MESSAGE =
  'File details could not be loaded. Retry this file. If the problem continues, check the terminal diagnostic.';

export type SessionClientErrorKind = 'security' | 'session' | 'file';

export class SessionClientError extends Error {
  readonly kind: SessionClientErrorKind;

  constructor(kind: SessionClientErrorKind, message: string) {
    super(message);
    this.name = 'SessionClientError';
    this.kind = kind;
  }
}

export interface SessionClient {
  getSession(): Promise<SessionResponse>;
  getFileMetadata(fileId: string): Promise<FileMetadataResponse>;
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

  const get = async (path: string, failureKind: 'session' | 'file'): Promise<unknown> => {
    let response: Response;
    try {
      response = await request(path, {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
        credentials: 'same-origin',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
      });
    } catch {
      throw new SessionClientError(
        failureKind,
        failureKind === 'session' ? SESSION_UNAVAILABLE_MESSAGE : FILE_UNAVAILABLE_MESSAGE,
      );
    }

    if (!response.ok) {
      throw new SessionClientError(
        response.status === 401 || response.status === 403 ? 'security' : failureKind,
        response.status === 401 || response.status === 403
          ? SECURITY_FAILURE_MESSAGE
          : failureKind === 'session'
            ? SESSION_UNAVAILABLE_MESSAGE
            : FILE_UNAVAILABLE_MESSAGE,
      );
    }

    try {
      return await response.json();
    } catch {
      throw new SessionClientError(
        failureKind,
        failureKind === 'session' ? SESSION_UNAVAILABLE_MESSAGE : FILE_UNAVAILABLE_MESSAGE,
      );
    }
  };

  return Object.freeze({
    async getSession() {
      const result = SessionResponseSchema.safeParse(await get('/api/session', 'session'));
      if (!result.success) {
        throw new SessionClientError('session', SESSION_UNAVAILABLE_MESSAGE);
      }
      return result.data;
    },
    async getFileMetadata(fileId: string) {
      const result = FileMetadataResponseSchema.safeParse(
        await get(`/api/files/${encodeURIComponent(fileId)}`, 'file'),
      );
      if (!result.success) {
        throw new SessionClientError('file', FILE_UNAVAILABLE_MESSAGE);
      }
      return result.data;
    },
  });
}
