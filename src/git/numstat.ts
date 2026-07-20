import { createExactPath } from '../domain/path-bytes.js';
import type { ExactPath } from '../domain/path-bytes.js';
import type { RawDiffRecord } from './raw-diff.js';

export interface NumstatRecord {
  readonly additions: number | null;
  readonly deletions: number | null;
  readonly paths: readonly [ExactPath] | readonly [ExactPath, ExactPath];
}

export interface JoinedDiffStat {
  readonly diff: RawDiffRecord;
  readonly stats: NumstatRecord;
}

interface NulField {
  readonly field: Buffer;
  readonly nextOffset: number;
}

function malformedNumstat(message: string): Error {
  return new Error(`Malformed numstat: ${message}`);
}

function readNulField(output: Buffer, offset: number): NulField {
  const end = output.indexOf(0, offset);
  if (end === -1) {
    throw malformedNumstat('record is not NUL terminated');
  }
  return {
    field: output.subarray(offset, end),
    nextOffset: end + 1,
  };
}

function parseCount(value: Buffer): number | null {
  if (value.length === 1 && value[0] === 0x2d) {
    return null;
  }
  const text = value.toString('ascii');
  if (!/^(?:0|[1-9][0-9]*)$/.test(text)) {
    throw malformedNumstat('count is neither a decimal integer nor -');
  }
  const count = Number.parseInt(text, 10);
  if (!Number.isSafeInteger(count)) {
    throw malformedNumstat('count exceeds the safe integer range');
  }
  return count;
}

function pathIdentity(
  paths: readonly [ExactPath] | readonly [ExactPath, ExactPath],
): string {
  return JSON.stringify(paths.map((path) => path.bytesBase64url));
}

export function parseNumstat(output: Buffer): readonly NumstatRecord[] {
  if (output.length === 0) {
    return Object.freeze([]);
  }
  if (output[output.length - 1] !== 0) {
    throw malformedNumstat('output is not NUL terminated');
  }

  const records: NumstatRecord[] = [];
  let offset = 0;
  while (offset < output.length) {
    const recordField = readNulField(output, offset);
    offset = recordField.nextOffset;
    const firstTab = recordField.field.indexOf(0x09);
    const secondTab =
      firstTab === -1 ? -1 : recordField.field.indexOf(0x09, firstTab + 1);
    if (firstTab <= 0 || secondTab <= firstTab + 1) {
      throw malformedNumstat('record is missing count separators');
    }

    const additions = parseCount(recordField.field.subarray(0, firstTab));
    const deletions = parseCount(
      recordField.field.subarray(firstTab + 1, secondTab),
    );
    if ((additions === null) !== (deletions === null)) {
      throw malformedNumstat('binary counts must both be -');
    }

    const pathBytes = recordField.field.subarray(secondTab + 1);
    let paths: readonly [ExactPath] | readonly [ExactPath, ExactPath];
    if (pathBytes.length > 0) {
      paths = Object.freeze([createExactPath(pathBytes)]) as readonly [ExactPath];
    } else {
      if (offset >= output.length) {
        throw malformedNumstat('rename/copy record is missing its source path');
      }
      const oldPathField = readNulField(output, offset);
      offset = oldPathField.nextOffset;
      if (offset >= output.length) {
        throw malformedNumstat('rename/copy record is missing its destination path');
      }
      const newPathField = readNulField(output, offset);
      offset = newPathField.nextOffset;
      if (oldPathField.field.length === 0 || newPathField.field.length === 0) {
        throw malformedNumstat('rename/copy path is empty');
      }
      paths = Object.freeze([
        createExactPath(oldPathField.field),
        createExactPath(newPathField.field),
      ]) as readonly [ExactPath, ExactPath];
    }

    records.push(Object.freeze({ additions, deletions, paths }));
  }
  return Object.freeze(records);
}

export function joinDiffStats(
  diffRecords: readonly RawDiffRecord[],
  statRecords: readonly NumstatRecord[],
): readonly JoinedDiffStat[] {
  const statByIdentity = new Map<string, NumstatRecord>();
  for (const stats of statRecords) {
    const identity = pathIdentity(stats.paths);
    if (statByIdentity.has(identity)) {
      throw new Error(`Duplicate numstat identity: ${identity}`);
    }
    statByIdentity.set(identity, stats);
  }

  const seenDiffIdentities = new Set<string>();
  const joined: JoinedDiffStat[] = [];
  for (const diff of diffRecords) {
    const identity = pathIdentity(diff.paths);
    if (seenDiffIdentities.has(identity)) {
      throw new Error(`Duplicate raw diff identity: ${identity}`);
    }
    seenDiffIdentities.add(identity);
    const stats = statByIdentity.get(identity);
    if (stats === undefined) {
      throw new Error(`Missing numstat record for raw diff identity: ${identity}`);
    }
    joined.push(Object.freeze({ diff, stats }));
  }

  for (const identity of statByIdentity.keys()) {
    if (!seenDiffIdentities.has(identity)) {
      throw new Error(`Numstat record has no raw diff match: ${identity}`);
    }
  }
  return Object.freeze(joined);
}
