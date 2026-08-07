import { describe, expect, it } from 'vitest';

import {
  orderExactPaths,
  createExactPath,
} from '../../src/domain/path-bytes.js';
import {
  joinDiffStats,
  parseNumstat,
  type NumstatRecord,
} from '../../src/git/numstat.js';
import {
  parseRawDiff,
  type RawDiffRecord,
} from '../../src/git/raw-diff.js';

const nul = Buffer.from([0]);
const oldOid = '1'.repeat(40);
const newOid = '2'.repeat(40);

function nulFields(...fields: readonly Uint8Array[]): Buffer {
  return Buffer.concat(fields.flatMap((field) => [Buffer.from(field), nul]));
}

function rawHeader(
  status: string,
  oldMode = '100644',
  newMode = '100644',
): Buffer {
  return Buffer.from(
    `:${oldMode} ${newMode} ${oldOid} ${newOid} ${status}`,
    'ascii',
  );
}

function ordinaryRaw(path: Buffer): RawDiffRecord {
  return parseRawDiff(nulFields(rawHeader('M'), path))[0]!;
}

function ordinaryStat(path: Buffer): NumstatRecord {
  return parseNumstat(
    nulFields(Buffer.concat([Buffer.from('1\t2\t', 'ascii'), path])),
  )[0]!;
}

describe('lossless path byte boundary', () => {
  it('keeps encoded authority separate from strict UTF-8 and control-safe display', () => {
    const bytes = Buffer.from('slash\\tab\tline\n-leading', 'utf8');
    const path = createExactPath(bytes);

    expect(path).toEqual({
      bytesBase64url: bytes.toString('base64url'),
      display: 'slash\\\\tab\\tline\\n-leading',
      utf8: 'slash\\tab\tline\n-leading',
    });
    expect(Object.isFrozen(path)).toBe(true);
  });

  it('keeps invalid and visually colliding path bytes distinct without inventing UTF-8', () => {
    const first = createExactPath(Buffer.from([0x62, 0x61, 0x64, 0x2d, 0x80]));
    const second = createExactPath(Buffer.from([0x62, 0x61, 0x64, 0x2d, 0x81]));

    expect(first.utf8).toBeUndefined();
    expect(second.utf8).toBeUndefined();
    expect(first.display).toBe(second.display);
    expect(first.bytesBase64url).not.toBe(second.bytesBase64url);
    expect(orderExactPaths(first, second)).not.toBe(0);
    expect(orderExactPaths(first, createExactPath(Buffer.from([0x62, 0x61, 0x64, 0x2d, 0x80])))).toBe(0);
  });

  it('does not normalize composed and decomposed Unicode identities', () => {
    const composed = createExactPath(Buffer.from('caf\u00e9.txt'));
    const decomposed = createExactPath(Buffer.from('cafe\u0301.txt'));

    expect(composed.utf8).toBe('caf\u00e9.txt');
    expect(decomposed.utf8).toBe('cafe\u0301.txt');
    expect(composed.bytesBase64url).not.toBe(decomposed.bytesBase64url);
    expect(orderExactPaths(composed, decomposed)).not.toBe(0);
  });
});

describe('raw diff -z byte grammar', () => {
  it('parses ordinary, rename, and copy records without decoding path boundaries', () => {
    const ordinaryPath = Buffer.from('space name.txt');
    const renameOld = Buffer.from('old\tname.txt');
    const renameNew = Buffer.from('new\nname.txt');
    const copyOld = Buffer.from('-copy-source.txt');
    const copyNew = Buffer.from('copy target.txt');
    const output = nulFields(
      rawHeader('M'),
      ordinaryPath,
      rawHeader('R095'),
      renameOld,
      renameNew,
      rawHeader('C100'),
      copyOld,
      copyNew,
    );

    const records = parseRawDiff(output);

    expect(records).toHaveLength(3);
    expect(records[0]).toMatchObject({
      oldMode: '100644',
      newMode: '100644',
      oldBlobOid: oldOid,
      newBlobOid: newOid,
      status: 'M',
      similarity: null,
    });
    expect(records[0]!.paths.map((path) => path.bytesBase64url)).toEqual([
      ordinaryPath.toString('base64url'),
    ]);
    expect(records[1]).toMatchObject({ status: 'R', similarity: 95 });
    expect(records[1]!.paths.map((path) => path.bytesBase64url)).toEqual([
      renameOld.toString('base64url'),
      renameNew.toString('base64url'),
    ]);
    expect(records[1]!.paths.map((path) => path.display)).toEqual([
      'old\\tname.txt',
      'new\\nname.txt',
    ]);
    expect(records[2]).toMatchObject({ status: 'C', similarity: 100 });
    expect(records[2]!.paths.map((path) => path.bytesBase64url)).toEqual([
      copyOld.toString('base64url'),
      copyNew.toString('base64url'),
    ]);
  });

  it('retains syntactically valid unknown statuses and modes for unsupported classification', () => {
    const [record] = parseRawDiff(
      nulFields(rawHeader('X', '100600', '100700'), Buffer.from('mystery')),
    );

    expect(record).toMatchObject({
      status: 'X',
      oldMode: '100600',
      newMode: '100700',
      similarity: null,
    });
  });

  it.each([
    ['missing final NUL', Buffer.from(`${rawHeader('M').toString('ascii')}\0path`)],
    ['missing path', nulFields(rawHeader('M'))],
    ['truncated rename pair', nulFields(rawHeader('R100'), Buffer.from('old'))],
    ['invalid header', nulFields(Buffer.from(':bad header'), Buffer.from('path'))],
  ])('rejects malformed raw records specifically: %s', (_case, output) => {
    expect(() => parseRawDiff(output)).toThrow(/Malformed raw diff:/);
  });
});

describe('numstat -z byte grammar and exact join', () => {
  it('parses ordinary and rename/copy path forms as an independent NUL grammar', () => {
    const ordinaryPath = Buffer.from('tab\tinside.txt');
    const pairOld = Buffer.from('old\nname.txt');
    const pairNew = Buffer.from('-new name.txt');
    const output = nulFields(
      Buffer.concat([Buffer.from('12\t3\t', 'ascii'), ordinaryPath]),
      Buffer.from('-\t-\t', 'ascii'),
      pairOld,
      pairNew,
    );

    const records = parseNumstat(output);

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ additions: 12, deletions: 3 });
    expect(records[0]!.paths[0]!.bytesBase64url).toBe(
      ordinaryPath.toString('base64url'),
    );
    expect(records[1]).toMatchObject({ additions: null, deletions: null });
    expect(records[1]!.paths.map((path) => path.bytesBase64url)).toEqual([
      pairOld.toString('base64url'),
      pairNew.toString('base64url'),
    ]);
  });

  it('joins one-to-one by exact one-path or old/new byte identity rather than display or position', () => {
    const firstPath = Buffer.from([0x62, 0x61, 0x64, 0x2d, 0x80]);
    const secondPath = Buffer.from([0x62, 0x61, 0x64, 0x2d, 0x81]);
    const firstDiff = ordinaryRaw(firstPath);
    const secondDiff = ordinaryRaw(secondPath);
    const firstStats = ordinaryStat(firstPath);
    const secondStats = ordinaryStat(secondPath);

    expect(firstDiff.paths[0].display).toBe(secondDiff.paths[0].display);
    const joined = joinDiffStats(
      [firstDiff, secondDiff],
      [secondStats, firstStats],
    );

    expect(joined.map((entry) => entry.stats.paths[0].bytesBase64url)).toEqual([
      firstPath.toString('base64url'),
      secondPath.toString('base64url'),
    ]);
  });

  it('rejects malformed, duplicate, missing, and extra numstat identities explicitly', () => {
    expect(() => parseNumstat(Buffer.from('1\t2\tpath'))).toThrow(
      /Malformed numstat:/,
    );
    expect(() => parseNumstat(nulFields(Buffer.from('1\t-\tpath')))).toThrow(
      /Malformed numstat:/,
    );
    expect(() => parseNumstat(nulFields(Buffer.from('1\t2\t'), Buffer.from('old')))).toThrow(
      /Malformed numstat:/,
    );

    const path = Buffer.from('same.txt');
    const other = Buffer.from('other.txt');
    const diff = ordinaryRaw(path);
    const stats = ordinaryStat(path);

    expect(() => joinDiffStats([diff, diff], [stats])).toThrow(
      /Duplicate raw diff identity:/,
    );
    expect(() => joinDiffStats([diff], [stats, stats])).toThrow(
      /Duplicate numstat identity:/,
    );
    expect(() => joinDiffStats([diff], [ordinaryStat(other)])).toThrow(
      /Missing numstat record for raw diff identity:/,
    );
    expect(() => joinDiffStats([], [stats])).toThrow(
      /Numstat record has no raw diff match:/,
    );
  });
});
