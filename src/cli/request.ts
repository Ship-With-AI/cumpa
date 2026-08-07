import { Buffer } from 'node:buffer';

import {
  AgentReviewRequestSchema,
  MAX_AGENT_REQUEST_BYTES,
  type AgentReviewRequest,
} from '../contracts/request.js';

const strictUtf8 = new TextDecoder('utf-8', { fatal: true });

export type AgentRequestErrorKind =
  | 'empty-request'
  | 'request-too-large'
  | 'invalid-utf8'
  | 'malformed-json'
  | 'unsupported-version'
  | 'invalid-request';

const requestErrorMessages = {
  'empty-request': 'Request input is empty. Pipe one cumpa.review-request JSON document.',
  'request-too-large': 'Request input exceeds 1048576 bytes. Reduce the request and try again.',
  'invalid-utf8': 'Request input must be valid UTF-8 JSON.',
  'malformed-json': 'Request input must contain one JSON document.',
  'unsupported-version': 'Request schema version is unsupported. Use schemaVersion 1.',
  'invalid-request': 'Request is invalid. Use kind "cumpa.review-request", schemaVersion 1, and one supported source mode.',
} as const satisfies Record<AgentRequestErrorKind, string>;

export class AgentRequestError extends Error {
  readonly kind: AgentRequestErrorKind;

  constructor(kind: AgentRequestErrorKind) {
    super(requestErrorMessages[kind]);
    this.name = 'AgentRequestError';
    this.kind = kind;
  }
}

function isUnsupportedVersion(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'schemaVersion' in value &&
    value.schemaVersion !== 1
  );
}

function freezeRequest(request: AgentReviewRequest): AgentReviewRequest {
  if (request.mode === 'revisions') {
    Object.freeze(request.revisions.pathspecs);
    Object.freeze(request.revisions);
  } else {
    Object.freeze(request.patch.target);
    Object.freeze(request.patch);
  }
  return Object.freeze(request);
}

export async function readAgentReviewRequest(
  input: AsyncIterable<Uint8Array>,
): Promise<AgentReviewRequest> {
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  for await (const chunk of input) {
    byteLength += chunk.byteLength;
    if (byteLength > MAX_AGENT_REQUEST_BYTES) {
      throw new AgentRequestError('request-too-large');
    }
    chunks.push(chunk);
  }

  if (byteLength === 0) {
    throw new AgentRequestError('empty-request');
  }

  let value: unknown;
  try {
    value = JSON.parse(strictUtf8.decode(Buffer.concat(chunks, byteLength)));
  } catch (error) {
    if (error instanceof TypeError) {
      throw new AgentRequestError('invalid-utf8');
    }
    throw new AgentRequestError('malformed-json');
  }

  const parsed = AgentReviewRequestSchema.safeParse(value);
  if (!parsed.success) {
    throw new AgentRequestError(
      isUnsupportedVersion(value) ? 'unsupported-version' : 'invalid-request',
    );
  }

  return freezeRequest(parsed.data);
}
