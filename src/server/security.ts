import { randomBytes, timingSafeEqual } from 'node:crypto';

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { ApiErrorSchema, type ApiError } from '../contracts/api.js';

export const REQUEST_UNAVAILABLE_MESSAGE =
  'This request is not available in the current session. Relaunch Diff Review from the terminal.';

export const REQUEST_UNAVAILABLE_ERROR: ApiError = ApiErrorSchema.parse({
  code: 'request-unavailable',
  message: REQUEST_UNAVAILABLE_MESSAGE,
});

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "style-src-elem 'self' 'unsafe-inline'",
  "style-src-attr 'unsafe-inline'",
  "connect-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

export type SecurityDiagnostic = Readonly<{
  correlationId: string;
  reason: string;
}>;

export type SessionSecurityTarget = Readonly<{
  expectedHost: string;
  expectedOrigin: string;
}>;

export type SessionSecurityBinding = Readonly<{
  bind: (target: SessionSecurityTarget) => void;
}>;

export type SessionSecurityOptions = Readonly<{
  sessionToken: string;
  diagnostics?: (diagnostic: SecurityDiagnostic) => void;
}>;

function applySecurityHeaders(reply: FastifyReply): void {
  void reply
    .header('cache-control', 'no-store')
    .header('referrer-policy', 'no-referrer')
    .header('x-content-type-options', 'nosniff')
    .header('x-frame-options', 'DENY')
    .header('content-security-policy', CONTENT_SECURITY_POLICY);
}

function isApiRequest(request: FastifyRequest): boolean {
  return request.url === '/api' || request.url.startsWith('/api/') || request.url.startsWith('/api?');
}

function hasBearerToken(request: FastifyRequest, expectedToken: Buffer): boolean {
  const authorization = request.headers.authorization;
  if (authorization === undefined || !authorization.startsWith('Bearer ')) {
    return false;
  }

  const candidate = Buffer.from(authorization.slice('Bearer '.length), 'utf8');
  return candidate.length === expectedToken.length && timingSafeEqual(candidate, expectedToken);
}

export function registerSessionSecurity(
  app: FastifyInstance,
  options: SessionSecurityOptions,
): SessionSecurityBinding {
  const expectedToken = Buffer.from(options.sessionToken, 'utf8');
  let target: SessionSecurityTarget | undefined;

  function diagnose(reason: string): void {
    options.diagnostics?.({
      correlationId: randomBytes(12).toString('base64url'),
      reason,
    });
  }

  function deny(reply: FastifyReply, statusCode: number, reason: string): void {
    diagnose(reason);
    void reply.code(statusCode).send(REQUEST_UNAVAILABLE_ERROR);
  }

  app.addHook('onRequest', (request, reply, done) => {
    applySecurityHeaders(reply);

    if (target === undefined) {
      deny(reply, 403, 'security-not-bound');
      return;
    }

    if (request.headers.host !== target.expectedHost) {
      deny(reply, 403, 'host-mismatch');
      return;
    }

    const origin = request.headers.origin;
    if (origin !== undefined && origin !== target.expectedOrigin) {
      deny(reply, 403, 'origin-mismatch');
      return;
    }

    if (isApiRequest(request) && !hasBearerToken(request, expectedToken)) {
      deny(reply, 401, 'token-mismatch');
      return;
    }

    done();
  });

  app.addHook('onSend', (_request, reply, payload, done) => {
    applySecurityHeaders(reply);
    done(null, payload);
  });

  app.setNotFoundHandler((_request, reply) => {
    void reply.code(404).send(REQUEST_UNAVAILABLE_ERROR);
  });

  app.setErrorHandler((error, _request, reply) => {
    const fastifyError = error as { statusCode?: number; validation?: unknown };
    diagnose(fastifyError.validation === undefined ? 'request-failed' : 'invalid-request');
    const statusCode =
      fastifyError.validation === undefined && fastifyError.statusCode === undefined ? 500 : 400;
    void reply.code(statusCode).send(REQUEST_UNAVAILABLE_ERROR);
  });

  return Object.freeze({
    bind(nextTarget: SessionSecurityTarget) {
      if (target !== undefined) {
        throw new Error('Session security is already bound.');
      }
      if (!/^127\.0\.0\.1:\d+$/.test(nextTarget.expectedHost)) {
        throw new Error('Session security must bind to a loopback authority.');
      }
      if (nextTarget.expectedOrigin !== `http://${nextTarget.expectedHost}`) {
        throw new Error('Session security origin must match its loopback authority.');
      }

      target = Object.freeze({ ...nextTarget });
    },
  });
}
