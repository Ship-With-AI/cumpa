import { spawn } from 'node:child_process';

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_STDOUT_LIMIT = 1024 * 1024;
const DEFAULT_STDERR_LIMIT = 64 * 1024;

const safeGitArguments = [
  '--no-optional-locks',
  '-c',
  'core.hooksPath=',
  '-c',
  'core.fsmonitor=false',
  '-c',
  'diff.external=',
  '-c',
  'protocol.file.allow=never',
] as const;

export type GitRunnerErrorKind =
  | 'aborted'
  | 'exit'
  | 'spawn'
  | 'stderr-limit'
  | 'stdout-limit'
  | 'timeout';

export class GitRunnerError extends Error {
  readonly kind: GitRunnerErrorKind;
  readonly exitCode: number | null;
  readonly stderr: Buffer;

  constructor(
    kind: GitRunnerErrorKind,
    message: string,
    options: {
      readonly cause?: unknown;
      readonly exitCode?: number | null;
      readonly stderr?: Buffer;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'GitRunnerError';
    this.kind = kind;
    this.exitCode = options.exitCode ?? null;
    this.stderr = options.stderr ?? Buffer.alloc(0);
  }
}

export interface GitRunResult {
  readonly stdout: Buffer;
  readonly stderr: Buffer;
}

export interface GitRunOptions {
  readonly cwd: string;
  readonly input?: Uint8Array;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly maxStdoutBytes?: number;
  readonly maxStderrBytes?: number;
}

export interface GitRunnerOptions {
  readonly timeoutMs?: number;
  readonly maxStdoutBytes?: number;
  readonly maxStderrBytes?: number;
}

export interface GitRunner {
  run(
    arguments_: readonly string[],
    options: GitRunOptions,
  ): Promise<GitRunResult>;
}

function positiveLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError('Git runner byte limits and timeouts must be positive integers');
  }
  return value;
}

export function createGitRunner(defaults: GitRunnerOptions = {}): GitRunner {
  const defaultTimeoutMs = positiveLimit(defaults.timeoutMs, DEFAULT_TIMEOUT_MS);
  const defaultMaxStdoutBytes = positiveLimit(
    defaults.maxStdoutBytes,
    DEFAULT_STDOUT_LIMIT,
  );
  const defaultMaxStderrBytes = positiveLimit(
    defaults.maxStderrBytes,
    DEFAULT_STDERR_LIMIT,
  );

  return Object.freeze({
    async run(
      arguments_: readonly string[],
      options: GitRunOptions,
    ): Promise<GitRunResult> {
      const timeoutMs = positiveLimit(options.timeoutMs, defaultTimeoutMs);
      const maxStdoutBytes = positiveLimit(
        options.maxStdoutBytes,
        defaultMaxStdoutBytes,
      );
      const maxStderrBytes = positiveLimit(
        options.maxStderrBytes,
        defaultMaxStderrBytes,
      );

      if (options.signal?.aborted) {
        throw new GitRunnerError('aborted', 'Git command was cancelled', {
          cause: options.signal.reason,
        });
      }

      return await new Promise<GitRunResult>((resolve, reject) => {
        const controller = new AbortController();
        let abortKind: 'aborted' | 'timeout' | undefined;
        let terminalFailure: GitRunnerError | undefined;
        let spawnFailure: unknown;
        let stdoutBytes = 0;
        let stderrBytes = 0;
        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];

        const abortFromCaller = () => {
          abortKind = 'aborted';
          controller.abort(options.signal?.reason);
        };
        options.signal?.addEventListener('abort', abortFromCaller, {
          once: true,
        });

        const timeout = setTimeout(() => {
          abortKind = 'timeout';
          controller.abort(new Error(`Git command timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        timeout.unref();

        const child = spawn('git', [...safeGitArguments, ...arguments_], {
          cwd: options.cwd,
          env: {
            ...process.env,
            GIT_CONFIG_NOSYSTEM: '1',
            GIT_EXTERNAL_DIFF: '',
            GIT_OPTIONAL_LOCKS: '0',
            GIT_TERMINAL_PROMPT: '0',
          },
          shell: false,
          signal: controller.signal,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        child.stdin.end(options.input);

        child.stdout.on('data', (chunk: Buffer) => {
          stdoutBytes += chunk.length;
          if (stdoutBytes > maxStdoutBytes) {
            terminalFailure ??= new GitRunnerError(
              'stdout-limit',
              `Git stdout exceeded ${maxStdoutBytes} bytes`,
            );
            child.kill('SIGKILL');
            return;
          }
          stdoutChunks.push(chunk);
        });

        child.stderr.on('data', (chunk: Buffer) => {
          stderrBytes += chunk.length;
          if (stderrBytes > maxStderrBytes) {
            terminalFailure ??= new GitRunnerError(
              'stderr-limit',
              `Git stderr exceeded ${maxStderrBytes} bytes`,
            );
            child.kill('SIGKILL');
            return;
          }
          stderrChunks.push(chunk);
        });

        child.once('error', (error) => {
          spawnFailure = error;
        });

        child.once('close', (exitCode) => {
          clearTimeout(timeout);
          options.signal?.removeEventListener('abort', abortFromCaller);
          const stderr = Buffer.concat(stderrChunks);

          if (terminalFailure !== undefined) {
            reject(terminalFailure);
            return;
          }
          if (abortKind !== undefined) {
            reject(
              new GitRunnerError(
                abortKind,
                abortKind === 'timeout'
                  ? `Git command timed out after ${timeoutMs}ms`
                  : 'Git command was cancelled',
                { cause: controller.signal.reason, stderr },
              ),
            );
            return;
          }
          if (spawnFailure !== undefined) {
            reject(
              new GitRunnerError('spawn', 'Unable to start the Git executable', {
                cause: spawnFailure,
                stderr,
              }),
            );
            return;
          }
          if (exitCode !== 0) {
            reject(
              new GitRunnerError(
                'exit',
                `Git command exited with status ${exitCode ?? 'unknown'}`,
                { exitCode, stderr },
              ),
            );
            return;
          }

          resolve({
            stdout: Buffer.concat(stdoutChunks),
            stderr,
          });
        });
      });
    },
  });
}
