import { describe, expect, it, vi } from 'vitest';

import {
  AgentReviewRequestSchema,
  ExactPatchRequestSchema,
  MAX_AGENT_REQUEST_BYTES,
  MAX_GIT_ARGUMENT_BYTES,
  MAX_PATHSPEC_COUNT,
} from '../../src/contracts/request.js';
import {
  AgentRequestError,
  readAgentReviewRequest,
} from '../../src/cli/request.js';
import { runOrdinaryAction } from '../../src/cli/run.js';
import { AttachedCompletionCoordinator } from '../../src/server/attached-completion.js';
import type { SessionApp } from '../../src/server/app.js';
import type { PinnedComparison } from '../../src/contracts/comparison.js';
import { LaunchError } from '../../src/domain/errors.js';

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
    ['invalid-request', chunks(encoder.encode('null')), 'Request is invalid. Use kind "compare.review-request", schemaVersion 1, and one supported source mode.'],
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
        : 'Request is invalid. Use kind "compare.review-request", schemaVersion 1, and one supported source mode.',
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
      'Request is invalid. Use kind "compare.review-request", schemaVersion 1, and one supported source mode.',
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
      'Request is invalid. Use kind "compare.review-request", schemaVersion 1, and one supported source mode.',
    );
  });
});

describe('exact patch request protocol', () => {
  const patch = 'diff --git a/café.txt b/café.txt\r\nindex 1111111111111111111111111111111111111111..2222222222222222222222222222222222222222 100644\r\n';

  function patchRequest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      kind: 'compare.review-request',
      schemaVersion: 1,
      mode: 'patch',
      patch: { content: patch, target: { kind: 'repository' } },
      ...overrides,
    };
  }

  it('accepts one exclusive patch request and preserves exact Unicode and line-ending bytes', async () => {
    const parsed = await readAgentReviewRequest(chunks(bytes(patchRequest())));
    const direct = ExactPatchRequestSchema.parse(patchRequest({ patch: { content: patch, target: { kind: 'worktree' } } }));

    expect(parsed).toEqual(patchRequest());
    expect(Buffer.from(parsed.patch.content, 'utf8')).toEqual(Buffer.from(patch, 'utf8'));
    expect(direct.patch.target).toEqual({ kind: 'worktree' });
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.patch)).toBe(true);
  });

  it.each([
    ['empty content', patchRequest({ patch: { content: '', target: { kind: 'repository' } } })],
    ['NUL content', patchRequest({ patch: { content: 'diff\0 --git', target: { kind: 'repository' } } })],
    ['lone surrogate', patchRequest({ patch: { content: '\ud800', target: { kind: 'repository' } } })],
    ['unknown patch authority', patchRequest({ patch: { content: patch, target: { kind: 'repository' }, cwd: '/secret' } })],
    ['unknown target authority', patchRequest({ patch: { content: patch, target: { kind: 'repository', oid: 'a'.repeat(40) } } })],
    ['unsupported target', patchRequest({ patch: { content: patch, target: { kind: 'branch' } } })],
    ['mixed revisions and patch', patchRequest({ revisions: { base: 'main', head: 'feature' } })],
    ['patch fields on revisions request', request({ patch: { content: patch, target: { kind: 'repository' } } })],
  ])('rejects %s without echoing patch content', async (_name, value) => {
    await expectRequestError(
      chunks(bytes(value)),
      'invalid-request',
      'Request is invalid. Use kind "compare.review-request", schemaVersion 1, and one supported source mode.',
    );
  });
});

describe('ordinary action request ownership', () => {
  const comparison = {
    repositoryRoot: '/repo',
    objectFormat: 'sha1',
    base: { label: 'main', oid: '1'.repeat(40) },
    head: { label: 'feature', oid: '2'.repeat(40) },
    mergeBaseOid: '1'.repeat(40),
    changedFiles: [],
    hasCommittedChanges: false,
    range: {
      kind: 'revisions',
      requestedBase: 'main',
      requestedHead: 'feature',
      baseOid: '1'.repeat(40),
      headOid: '2'.repeat(40),
      pathspecs: ['src', ':!generated'],
      reviewKey: 'f'.repeat(64),
    },
  } satisfies PinnedComparison;

  it('keeps TTY launch with the injected interactive owner', async () => {
    const runInteractive = vi.fn(async () => {});
    const readRequest = vi.fn();

    await runOrdinaryAction(
      { cwd: '/repo' },
      { isTTY: true, runCli: runInteractive, readRequest },
    );

    expect(runInteractive).toHaveBeenCalledExactlyOnceWith({ cwd: '/repo' });
    expect(readRequest).not.toHaveBeenCalled();
  });

  it('grounds one non-TTY request and launches its frozen range once', async () => {
    const events: string[] = [];
    const launch = vi.fn(async () => {
      events.push('launch');
    });
    const stdout: string[] = [];
    const stderr: string[] = [];
    const setExitStatus = vi.fn();

    await runOrdinaryAction(
      { cwd: '/repo' },
      {
        isTTY: false,
        input: chunks(),
        readRequest: async () => {
          events.push('read');
          return AgentReviewRequestSchema.parse(request());
        },
        createRangeComparison: async (options) => {
          events.push('range');
          expect(options).toEqual({
            cwd: '/repo',
            baseRevision: 'main',
            headRevision: 'feature',
            pathspecs: [],
          });
          return comparison;
        },
        launchComparison: launch,
        output: (message) => stderr.push(message),
        stdout: (message) => stdout.push(message),
        setExitStatus,
      },
    );

    expect(events).toEqual(['read', 'range', 'launch']);
    expect(launch).toHaveBeenCalledExactlyOnceWith(comparison);
    expect(stderr).toEqual([]);
    expect(stdout).toEqual([]);

    expect(setExitStatus).not.toHaveBeenCalled();
  });
  it('keeps a non-TTY range attached until Finish writes canonical bytes and its response settles', async () => {
    const events: string[] = [];
    const stdout: Uint8Array[] = [];
    const coordinator = new AttachedCompletionCoordinator();
    let attached: { coordinator: AttachedCompletionCoordinator; deliver: (bytes: Uint8Array) => Promise<void> } | undefined;
    const app = {
      listen: vi.fn(async () => {}),
      server: { address: () => ({ address: '127.0.0.1', port: 43123 }) },
      bindSessionSecurity: vi.fn(),
      close: vi.fn(async () => {
        events.push('shutdown');
      }),
    } as unknown as SessionApp;

    const running = runOrdinaryAction(
      { cwd: '/repo' },
      {
        isTTY: false,
        input: chunks(),
        readRequest: async () => AgentReviewRequestSchema.parse(request()),
        createRangeComparison: async () => comparison,
        createSessionApp: (_comparison, options) => {
          attached = options.attachedCompletion;
          return app;
        },
        launchComparison: vi.fn(async () => {
          throw new Error('non-TTY review must use the attached launcher');
        }),
        openBrowser: async () => {
          events.push('open');
        },
        output: (message) => {
          events.push(`stderr:${message}`);
        },
        stdout: async (bytes) => {
          events.push('stdout');
          stdout.push(bytes);
        },
        setExitStatus: (status) => {
          events.push(`exit:${status}`);
        },
      },
    );
    void running.catch(() => {});

    await Promise.resolve();
    expect(attached).toBeDefined();
    expect(stdout).toEqual([]);
    expect(events).toContain('open');

    const canonical = new TextEncoder().encode('{"schemaVersion":2}');
    await attached!.coordinator.finish(0, async () => {
      await attached!.deliver(canonical);
      return { kind: 'completed', revision: 0 };
    });
    attached!.coordinator.markResponseSettled();
    await running;

    expect(stdout).toEqual([canonical]);
    expect(events).toEqual(['stderr:http://127.0.0.1:43123/#token=expect.any(String)']);
  });

  it.each([
    ['request', new AgentRequestError('invalid-request')],
    [
      'revision',
      new LaunchError('endpoint-unavailable', 'Requested revision is unavailable.', {
        recovery: { kind: 'exit' },
      }),
    ],
    [
      'ancestry',
      new LaunchError(
        'non-ancestor-range',
        'The requested base is not an ancestor of the requested head. Choose a contiguous range and try again.',
        { recovery: { kind: 'exit' } },
      ),
    ],
    [
      'invalid native pathspec',
      new LaunchError(
        'invalid-pathspec',
        'Git rejected the requested pathspec scope. Check native Git pathspec syntax and try again.',
        { recovery: { kind: 'exit' } },
      ),
    ],
  ])(
    'reports bounded %s failures before listener or browser launch',
    async (_name, error) => {
      const stderr: string[] = [];
      const stdout: string[] = [];
      const launch = vi.fn();
      const setExitStatus = vi.fn();
      const rawGitStderr = 'fatal: invalid pathspec magic';
      const submittedPathspec = ':(invalid)secret';

      await runOrdinaryAction(
        { cwd: '/repo' },
        {
          isTTY: false,
          input: chunks(),
          readRequest: async () => {
            if (error instanceof AgentRequestError) {
              throw error;
            }
            return AgentReviewRequestSchema.parse(request());
          },
          createRangeComparison: async () => {
            throw error;
          },
          launchComparison: launch,
          output: (message) => stderr.push(message),
          stdout: (message) => stdout.push(message),
          setExitStatus,
        },
      );

      expect(stderr).toHaveLength(1);
      expect(stderr[0]).toBeDefined();
      expect(stderr[0]!.length).toBeLessThan(256);
      expect(stderr[0]).not.toContain(rawGitStderr);
      expect(stderr[0]).not.toContain(submittedPathspec);
      expect(stdout).toEqual([]);
      expect(setExitStatus).toHaveBeenCalledExactlyOnceWith(1);
      expect(launch).not.toHaveBeenCalled();
    },
  );
});
