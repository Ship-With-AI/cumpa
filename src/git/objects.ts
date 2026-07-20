import { createGitRunner } from './runner.js';
import type { GitRunner } from './runner.js';

const BATCH_HEADER_LIMIT = 256;
const objectIdPattern = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;

export type ObjectMetadata =
  | {
      readonly kind: 'available';
      readonly objectType: string;
      readonly size: number;
    }
  | { readonly kind: 'missing' };

export type ObjectContent =
  | { readonly kind: 'available'; readonly bytes: Buffer }
  | { readonly kind: 'missing' };

export interface ObjectReadOptions {
  readonly maxBytes: number;
  readonly signal?: AbortSignal;
}

export interface ObjectReader {
  inspect(oid: string, signal?: AbortSignal): Promise<ObjectMetadata>;
  read(oid: string, options: ObjectReadOptions): Promise<ObjectContent>;
}

export interface CreateObjectReaderDependencies {
  readonly runner?: GitRunner;
}

type ParsedBatchHeader =
  | { readonly kind: 'missing'; readonly contentOffset: number }
  | {
      readonly kind: 'available';
      readonly contentOffset: number;
      readonly objectType: string;
      readonly size: number;
    };

function validateObjectId(oid: string): void {
  if (!objectIdPattern.test(oid)) {
    throw new TypeError('Git object reads require one full lowercase hexadecimal object ID');
  }
}

function parseBatchHeader(stdout: Buffer, requestedOid: string): ParsedBatchHeader {
  const terminator = stdout.indexOf(0);
  if (terminator < 0 || terminator >= BATCH_HEADER_LIMIT) {
    throw new Error('Git cat-file returned an invalid or oversized batch header');
  }

  const header = stdout.toString('ascii', 0, terminator);
  if (header === `${requestedOid} missing`) {
    return Object.freeze({ kind: 'missing', contentOffset: terminator + 1 });
  }

  const fields = header.split(' ');
  if (
    fields.length !== 3 ||
    fields[0] !== requestedOid ||
    fields[1] === undefined ||
    fields[1].length === 0 ||
    fields[2] === undefined ||
    !/^(?:0|[1-9][0-9]*)$/.test(fields[2])
  ) {
    throw new Error('Git cat-file returned malformed object metadata');
  }

  const size = Number(fields[2]);
  if (!Number.isSafeInteger(size)) {
    throw new Error('Git cat-file reported an unsafe object size');
  }
  return Object.freeze({
    kind: 'available',
    contentOffset: terminator + 1,
    objectType: fields[1],
    size,
  });
}

export function createObjectReader(
  repositoryRoot: string,
  dependencies: CreateObjectReaderDependencies = {},
): ObjectReader {
  const runner = dependencies.runner ?? createGitRunner();

  return Object.freeze({
    async inspect(
      oid: string,
      signal?: AbortSignal,
    ): Promise<ObjectMetadata> {
      validateObjectId(oid);
      const result = await runner.run(['cat-file', '--batch-command', '-Z'], {
        cwd: repositoryRoot,
        input: Buffer.from(`info ${oid}\0`, 'ascii'),
        maxStdoutBytes: BATCH_HEADER_LIMIT,
        signal,
      });
      const header = parseBatchHeader(result.stdout, oid);
      if (header.contentOffset !== result.stdout.byteLength) {
        throw new Error('Git cat-file returned trailing bytes for object metadata');
      }
      return header.kind === 'missing'
        ? Object.freeze({ kind: 'missing' })
        : Object.freeze({
            kind: 'available',
            objectType: header.objectType,
            size: header.size,
          });
    },

    async read(
      oid: string,
      options: ObjectReadOptions,
    ): Promise<ObjectContent> {
      validateObjectId(oid);
      if (
        !Number.isSafeInteger(options.maxBytes) ||
        options.maxBytes < 0 ||
        options.maxBytes > Number.MAX_SAFE_INTEGER - BATCH_HEADER_LIMIT
      ) {
        throw new RangeError('Object read limit must be a non-negative safe integer');
      }

      const result = await runner.run(['cat-file', '--batch-command', '-Z'], {
        cwd: repositoryRoot,
        input: Buffer.from(`contents ${oid}\0`, 'ascii'),
        maxStdoutBytes: options.maxBytes + BATCH_HEADER_LIMIT,
        signal: options.signal,
      });
      const header = parseBatchHeader(result.stdout, oid);
      if (header.kind === 'missing') {
        if (header.contentOffset !== result.stdout.byteLength) {
          throw new Error('Git cat-file returned trailing bytes for a missing object');
        }
        return Object.freeze({ kind: 'missing' });
      }
      if (header.size > options.maxBytes) {
        throw new Error('Git cat-file object exceeds the bounded read limit');
      }

      const contentEnd = header.contentOffset + header.size;
      if (
        result.stdout.byteLength !== contentEnd + 1 ||
        result.stdout[contentEnd] !== 0
      ) {
        throw new Error('Git cat-file returned malformed object content framing');
      }
      return Object.freeze({
        kind: 'available',
        bytes: result.stdout.subarray(header.contentOffset, contentEnd),
      });
    },
  });
}
