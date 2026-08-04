import { describe, expect, it } from 'vitest';

import {
  AgentReviewRequestSchema,
  MAX_AGENT_REQUEST_BYTES,
  MAX_GIT_ARGUMENT_BYTES,
  MAX_PATHSPEC_COUNT,
} from '../../src/contracts/request.js';
import {
  AgentRequestError,
  readAgentReviewRequest,
} from '../../src/cli/request.js';

const encoder = new TextEncoder();

function request(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kind: 'compare.review-request',
    schemaVersion: 1,
    mode: 'revisions',
    revisions: { base: 'main', head: 'feature' },
    ...overrides,
  };
}

async function* chunks(...values: readonly Uint8Array[]): AsyncGenerator<Uint8Array> {
  yield* values;
}

function bytes(value: unknown): Uint8Array {
  return encoder.encode(JSON.stringify(value));
}

async function expectRequestError(
  input: AsyncIterable<Uint8Array>,
  kind: AgentRequestError['kind'],
  message: string,
): Promise<void> {
  await expect(readAgentReviewRequest(input)).rejects.toMatchObject({
    name: 'AgentRequestError',
    kind,
    message,
  });
}

describe('agent review request protocol', () => {
  it('accepts one request, preserves ordered pathspecs, and freezes the parsed value', async () => {
    const parsed = await readAgentReviewRequest(
      chunks(
        bytes(
          request({
            revisions: {
              base: 'refs/heads/main',
              head: 'feature',
              pathspecs: [':(icase)src', ':!generated', '--literal'],
            },
          }),
        ),
      ),
    );

    expect(parsed.revisions).toEqual({
      base: 'refs/heads/main',
      head: 'feature',
      pathspecs: [':(icase)src', ':!generated', '--literal'],
    });
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.revisions)).toBe(true);
    expect(Object.isFrozen(parsed.revisions.pathspecs)).toBe(true);
  });

  it('defaults omitted pathspecs to a frozen empty array', async () => {
    const parsed = await readAgentReviewRequest(chunks(bytes(request())));
    const schemaParsed = AgentReviewRequestSchema.parse(request());

    expect(parsed.revisions.pathspecs).toEqual([]);
    expect(Object.isFrozen(parsed.revisions.pathspecs)).toBe(true);
    expect(Object.isFrozen(schemaParsed.revisions.pathspecs)).toBe(true);
  });

  it('accepts exactly the raw byte ceiling before decoding', async () => {
    const document = JSON.stringify(request());
    const padding = ' '.repeat(MAX_AGENT_REQUEST_BYTES - encoder.encode(document).byteLength);

    await expect(
      readAgentReviewRequest(chunks(encoder.encode(`${document}${padding}`))),
    ).resolves.toMatchObject({ revisions: { base: 'main', head: 'feature' } });
  });

  it('rejects cap-plus-one input before reading a further chunk', async () => {
    const seen: number[] = [];
    const document = JSON.stringify(request());
    const padding = ' '.repeat(MAX_AGENT_REQUEST_BYTES - encoder.encode(document).byteLength);
    async function* oversized(): AsyncGenerator<Uint8Array> {
      seen.push(1);
      yield encoder.encode(`${document}${padding}`);
      seen.push(2);
      yield Uint8Array.of(0x20);
      seen.push(3);
      yield Uint8Array.of(0x20);
    }

    await expectRequestError(
      oversized(),
      'request-too-large',
      'Request input exceeds 1048576 bytes. Reduce the request and try again.',
    );
    expect(seen).toEqual([1, 2]);
  });

  it.each([
    ['empty-request', chunks(), 'Request input is empty. Pipe one compare.review-request JSON document.'],
    ['malformed-json', chunks(encoder.encode('{')), 'Request input must contain one JSON document.'],
    ['malformed-json', chunks(encoder.encode(`${JSON.stringify(request())}\n{} `)), 'Request input must contain one JSON document.'],
    ['invalid-utf8', chunks(Uint8Array.of(0xe2), Uint8Array.of(0x28, 0xa1)), 'Request input must be valid UTF-8 JSON.'],
    ['invalid-request', chunks(encoder.encode('null')), 'Request is invalid. Use kind "compare.review-request", schemaVersion 1, mode "revisions", and revisions only.'],
  ] as const)('reports safe %s failures without request data', async (kind, input, message) => {
    await expectRequestError(input, kind, message);
  });

  it.each([
    ['unknown root field', request({ cwd: '/secret' }), 'invalid-request'],
    ['unknown nested field', request({ revisions: { base: 'main', head: 'feature', host: '127.0.0.1' } }), 'invalid-request'],
    ['unsupported kind', request({ kind: 'compare.patch-request' }), 'invalid-request'],
    ['unsupported version', request({ schemaVersion: 2 }), 'unsupported-version'],
    ['unsupported mode', request({ mode: 'patch' }), 'invalid-request'],
    ['missing revisions', { kind: 'compare.review-request', schemaVersion: 1, mode: 'revisions' }, 'invalid-request'],
    ['second source mode', request({ patch: { content: 'diff --git' } }), 'invalid-request'],
  ] as const)('strictly rejects %s', async (_name, value, kind) => {
    await expectRequestError(
      chunks(bytes(value)),
      kind,
      kind === 'unsupported-version'
        ? 'Request schema version is unsupported. Use schemaVersion 1.'
        : 'Request is invalid. Use kind "compare.review-request", schemaVersion 1, mode "revisions", and revisions only.',
    );
  });

  it.each([
    ['empty', ''],
    ['NUL', 'main\0feature'],
    ['lone surrogate', '\ud800'],
    ['over 4 KiB', 'a'.repeat(MAX_GIT_ARGUMENT_BYTES + 1)],
  ])('rejects %s Git arguments without echoing them', async (_name, value) => {
    await expectRequestError(
      chunks(bytes(request({ revisions: { base: value, head: 'feature' } }))),
      'invalid-request',
      'Request is invalid. Use kind "compare.review-request", schemaVersion 1, mode "revisions", and revisions only.',
    );
  });

  it('rejects more than the maximum pathspec count', async () => {
    await expectRequestError(
      chunks(
        bytes(
          request({
            revisions: {
              base: 'main',
              head: 'feature',
              pathspecs: Array.from({ length: MAX_PATHSPEC_COUNT + 1 }, (_, index) => `src/${index}`),
            },
          }),
        ),
      ),
      'invalid-request',
      'Request is invalid. Use kind "compare.review-request", schemaVersion 1, mode "revisions", and revisions only.',
    );
  });
});
