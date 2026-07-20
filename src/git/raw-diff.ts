import { createExactPath } from '../domain/path-bytes.js';
import type { ExactPath } from '../domain/path-bytes.js';

export interface RawDiffRecord {
  readonly oldMode: string;
  readonly newMode: string;
  readonly oldBlobOid: string;
  readonly newBlobOid: string;
  readonly status: string;
  readonly similarity: number | null;
  readonly paths: readonly [ExactPath] | readonly [ExactPath, ExactPath];
}

interface NulField {
  readonly field: Buffer;
  readonly nextOffset: number;
}

function malformedRawDiff(message: string): Error {
  return new Error(`Malformed raw diff: ${message}`);
}

function readNulField(output: Buffer, offset: number): NulField {
  const end = output.indexOf(0, offset);
  if (end === -1) {
    throw malformedRawDiff('record is not NUL terminated');
  }
  return {
    field: output.subarray(offset, end),
    nextOffset: end + 1,
  };
}

export function parseRawDiff(output: Buffer): readonly RawDiffRecord[] {
  if (output.length === 0) {
    return Object.freeze([]);
  }
  if (output[output.length - 1] !== 0) {
    throw malformedRawDiff('output is not NUL terminated');
  }

  const records: RawDiffRecord[] = [];
  let offset = 0;
  while (offset < output.length) {
    const headerField = readNulField(output, offset);
    offset = headerField.nextOffset;
    const header = headerField.field.toString('ascii');
    const match =
      /^:([0-7]{6}) ([0-7]{6}) ((?:[0-9a-f]{40}|[0-9a-f]{64})) ((?:[0-9a-f]{40}|[0-9a-f]{64})) ([A-Z])([0-9]{1,3})?$/.exec(
        header,
      );
    if (match === null) {
      throw malformedRawDiff('invalid raw record header');
    }

    const [
      ,
      oldMode,
      newMode,
      oldBlobOid,
      newBlobOid,
      status,
      similarityText,
    ] = match;
    if (oldBlobOid!.length !== newBlobOid!.length) {
      throw malformedRawDiff('object IDs use different formats');
    }
    const hasPair = status === 'R' || status === 'C';
    if (hasPair !== (similarityText !== undefined)) {
      throw malformedRawDiff(
        hasPair
          ? 'rename/copy record is missing similarity'
          : 'non-rename/copy record includes similarity',
      );
    }
    const similarity =
      similarityText === undefined ? null : Number.parseInt(similarityText, 10);
    if (similarity !== null && similarity > 100) {
      throw malformedRawDiff('similarity is outside 0-100');
    }

    if (offset >= output.length) {
      throw malformedRawDiff('record is missing its path');
    }
    const firstPathField = readNulField(output, offset);
    offset = firstPathField.nextOffset;
    if (firstPathField.field.length === 0) {
      throw malformedRawDiff('path is empty');
    }
    const firstPath = createExactPath(firstPathField.field);

    let paths: readonly [ExactPath] | readonly [ExactPath, ExactPath];
    if (hasPair) {
      if (offset >= output.length) {
        throw malformedRawDiff('rename/copy record is missing its destination path');
      }
      const secondPathField = readNulField(output, offset);
      offset = secondPathField.nextOffset;
      if (secondPathField.field.length === 0) {
        throw malformedRawDiff('destination path is empty');
      }
      paths = Object.freeze([
        firstPath,
        createExactPath(secondPathField.field),
      ]) as readonly [ExactPath, ExactPath];
    } else {
      paths = Object.freeze([firstPath]) as readonly [ExactPath];
    }

    records.push(
      Object.freeze({
        oldMode: oldMode!,
        newMode: newMode!,
        oldBlobOid: oldBlobOid!,
        newBlobOid: newBlobOid!,
        status: status!,
        similarity,
        paths,
      }),
    );
  }
  return Object.freeze(records);
}
