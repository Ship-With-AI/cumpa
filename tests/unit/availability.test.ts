import { describe, expect, it } from 'vitest';

import { ChangedFileSchema } from '../../src/contracts/comparison.js';
import {
  classifyAvailability,
  MAX_INLINE_TEXT_BYTES,
  type AvailabilityInput,
} from '../../src/git/availability.js';
import type {
  ObjectContent,
  ObjectMetadata,
  ObjectReader,
} from '../../src/git/objects.js';

const absentOid = '0'.repeat(40);
const oldOid = '1'.repeat(40);
const newOid = '2'.repeat(40);

type StoredObject = {
  readonly bytes: Buffer;
  readonly objectType?: string;
  readonly reportedSize?: number;
};

interface RecordingReader {
  readonly calls: string[];
  readonly reader: ObjectReader;
}

function changedFile(
  overrides: Partial<AvailabilityInput> = {},
): AvailabilityInput {
  return {
    additions: 1,
    deletions: 1,
    newBlobOid: newOid,
    newMode: '100644',
    oldBlobOid: oldOid,
    oldMode: '100644',
    status: { code: 'M', kind: 'modified', similarity: null },
    ...overrides,
  };
}

function recordingReader(
  objects: Readonly<Record<string, StoredObject>>,
  disappearOnRead: ReadonlySet<string> = new Set(),
): RecordingReader {
  const calls: string[] = [];
  const reader: ObjectReader = {
    async inspect(oid): Promise<ObjectMetadata> {
      calls.push(`inspect:${oid}`);
      const object = objects[oid];
      return object === undefined
        ? Object.freeze({ kind: 'missing' })
        : Object.freeze({
            kind: 'available',
            objectType: object.objectType ?? 'blob',
            size: object.reportedSize ?? object.bytes.byteLength,
          });
    },
    async read(oid, options): Promise<ObjectContent> {
      calls.push(`read:${oid}:${options.maxBytes}`);
      const object = objects[oid];
      return object === undefined || disappearOnRead.has(oid)
        ? Object.freeze({ kind: 'missing' })
        : Object.freeze({ kind: 'available', bytes: object.bytes });
    },
  };
  return { calls, reader };
}

const ordinaryObjects = Object.freeze({
  [oldOid]: { bytes: Buffer.from('old\n') },
  [newOid]: { bytes: Buffer.from('new\n') },
});

describe('immutable availability precedence', () => {
  it('classifies gitlinks before object access', async () => {
    const { calls, reader } = recordingReader({});

    await expect(
      classifyAvailability(
        changedFile({ newMode: '160000', newBlobOid: '3'.repeat(40) }),
        reader,
      ),
    ).resolves.toEqual({ kind: 'unsupported', reason: 'submodule' });
    expect(calls).toEqual([]);
  });

  it.each([
    ['symlink', '120000', 'symlink'],
    ['unknown mode', '100664', 'mode-or-type'],
  ] as const)('classifies %s without reading or following it', async (_, mode, reason) => {
    const { calls, reader } = recordingReader(ordinaryObjects);

    await expect(
      classifyAvailability(changedFile({ newMode: mode }), reader),
    ).resolves.toEqual({ kind: 'unsupported', reason });
    expect(calls).toEqual([]);
  });

  it('classifies an unknown diff status as mode-or-type', async () => {
    const { calls, reader } = recordingReader(ordinaryObjects);

    await expect(
      classifyAvailability(
        changedFile({
          status: { code: 'X', kind: 'unsupported', similarity: null },
        }),
        reader,
      ),
    ).resolves.toEqual({ kind: 'unsupported', reason: 'mode-or-type' });
    expect(calls).toEqual([]);
  });

  it('treats missing and wrong-type pinned objects as unavailable before size or content classification', async () => {
    const missing = recordingReader({
      [oldOid]: {
        bytes: Buffer.alloc(0),
        reportedSize: MAX_INLINE_TEXT_BYTES + 1,
      },
    });
    await expect(
      classifyAvailability(changedFile(), missing.reader),
    ).resolves.toEqual({ kind: 'unavailable', reason: 'missing-object' });
    expect(missing.calls).toEqual([
      `inspect:${oldOid}`,
      `inspect:${newOid}`,
    ]);

    const wrongType = recordingReader({
      [oldOid]: ordinaryObjects[oldOid],
      [newOid]: { bytes: Buffer.alloc(0), objectType: 'commit' },
    });
    await expect(
      classifyAvailability(changedFile(), wrongType.reader),
    ).resolves.toEqual({ kind: 'unavailable', reason: 'missing-object' });
    expect(wrongType.calls).toEqual([
      `inspect:${oldOid}`,
      `inspect:${newOid}`,
    ]);
  });

  it('checks every object type and size before reading either side', async () => {
    const { calls, reader } = recordingReader(ordinaryObjects);

    await expect(classifyAvailability(changedFile(), reader)).resolves.toEqual({
      kind: 'text',
    });
    expect(calls).toEqual([
      `inspect:${oldOid}`,
      `inspect:${newOid}`,
      `read:${oldOid}:${MAX_INLINE_TEXT_BYTES}`,
      `read:${newOid}:${MAX_INLINE_TEXT_BYTES}`,
    ]);
  });

  it('classifies limit plus one as oversized without allocating content', async () => {
    const { calls, reader } = recordingReader({
      [oldOid]: ordinaryObjects[oldOid],
      [newOid]: {
        bytes: Buffer.alloc(0),
        reportedSize: MAX_INLINE_TEXT_BYTES + 1,
      },
    });

    await expect(classifyAvailability(changedFile(), reader)).resolves.toEqual({
      kind: 'unsupported',
      reason: 'oversized',
    });
    expect(calls).toEqual([
      `inspect:${oldOid}`,
      `inspect:${newOid}`,
    ]);
  });

  it('keeps exactly one MiB per side text-eligible', async () => {
    const exactLimit = Buffer.alloc(MAX_INLINE_TEXT_BYTES, 0x61);
    const { calls, reader } = recordingReader({
      [oldOid]: { bytes: exactLimit },
      [newOid]: { bytes: exactLimit },
    });

    await expect(classifyAvailability(changedFile(), reader)).resolves.toEqual({
      kind: 'text',
    });
    expect(calls).toEqual([
      `inspect:${oldOid}`,
      `inspect:${newOid}`,
      `read:${oldOid}:${MAX_INLINE_TEXT_BYTES}`,
      `read:${newOid}:${MAX_INLINE_TEXT_BYTES}`,
    ]);
  });

  it('applies the Git binary marker after the oversized check and before content reads', async () => {
    const small = recordingReader(ordinaryObjects);
    await expect(
      classifyAvailability(
        changedFile({ additions: null, deletions: null }),
        small.reader,
      ),
    ).resolves.toEqual({ kind: 'unsupported', reason: 'binary' });
    expect(small.calls).toEqual([
      `inspect:${oldOid}`,
      `inspect:${newOid}`,
    ]);

    const oversized = recordingReader({
      [oldOid]: ordinaryObjects[oldOid],
      [newOid]: {
        bytes: Buffer.alloc(0),
        reportedSize: MAX_INLINE_TEXT_BYTES + 1,
      },
    });
    await expect(
      classifyAvailability(
        changedFile({ additions: null, deletions: null }),
        oversized.reader,
      ),
    ).resolves.toEqual({ kind: 'unsupported', reason: 'oversized' });
  });

  it('classifies a NUL byte as binary and invalid UTF-8 as non-utf8', async () => {
    const binary = recordingReader({
      [oldOid]: ordinaryObjects[oldOid],
      [newOid]: { bytes: Buffer.from([0x61, 0x00, 0x62]) },
    });
    await expect(
      classifyAvailability(changedFile(), binary.reader),
    ).resolves.toEqual({ kind: 'unsupported', reason: 'binary' });

    const nonUtf8 = recordingReader({
      [oldOid]: ordinaryObjects[oldOid],
      [newOid]: { bytes: Buffer.from([0xc3, 0x28]) },
    });
    await expect(
      classifyAvailability(changedFile(), nonUtf8.reader),
    ).resolves.toEqual({ kind: 'unsupported', reason: 'non-utf8' });
  });

  it('reports disappearance between metadata and content reads without fallback', async () => {
    const { calls, reader } = recordingReader(ordinaryObjects, new Set([newOid]));

    await expect(classifyAvailability(changedFile(), reader)).resolves.toEqual({
      kind: 'unavailable',
      reason: 'missing-object',
    });
    expect(calls).toEqual([
      `inspect:${oldOid}`,
      `inspect:${newOid}`,
      `read:${oldOid}:${MAX_INLINE_TEXT_BYTES}`,
      `read:${newOid}:${MAX_INLINE_TEXT_BYTES}`,
    ]);
  });

  it('ignores absent sides for additions and deletions', async () => {
    const added = recordingReader({ [newOid]: ordinaryObjects[newOid] });
    await expect(
      classifyAvailability(
        changedFile({ oldMode: '000000', oldBlobOid: absentOid }),
        added.reader,
      ),
    ).resolves.toEqual({ kind: 'text' });
    expect(added.calls).toEqual([
      `inspect:${newOid}`,
      `read:${newOid}:${MAX_INLINE_TEXT_BYTES}`,
    ]);

    const deleted = recordingReader({ [oldOid]: ordinaryObjects[oldOid] });
    await expect(
      classifyAvailability(
        changedFile({ newMode: '000000', newBlobOid: absentOid }),
        deleted.reader,
      ),
    ).resolves.toEqual({ kind: 'text' });
    expect(deleted.calls).toEqual([
      `inspect:${oldOid}`,
      `read:${oldOid}:${MAX_INLINE_TEXT_BYTES}`,
    ]);
  });
});

describe('availability wire contract', () => {
  it('accepts only the exact frozen text, unsupported, and unavailable vocabulary', () => {
    const baseFile = {
      id: `file_${'a'.repeat(43)}`,
      status: { code: 'M', kind: 'modified', similarity: null },
      oldMode: '100644',
      newMode: '100644',
      oldBlobOid: oldOid,
      newBlobOid: newOid,
      additions: 1,
      deletions: 1,
    };
    const validAvailability = [
      { kind: 'text' },
      { kind: 'unsupported', reason: 'binary' },
      { kind: 'unsupported', reason: 'non-utf8' },
      { kind: 'unsupported', reason: 'oversized' },
      { kind: 'unsupported', reason: 'submodule' },
      { kind: 'unsupported', reason: 'symlink' },
      { kind: 'unsupported', reason: 'mode-or-type' },
      { kind: 'unavailable', reason: 'missing-object' },
    ] as const;

    for (const availability of validAvailability) {
      const parsed = ChangedFileSchema.parse({ ...baseFile, availability });
      expect(parsed).toMatchObject({ availability });
      expect(Object.isFrozen(parsed.availability)).toBe(true);
    }

    expect(() =>
      ChangedFileSchema.parse({
        ...baseFile,
        availability: { kind: 'unsupported', reason: 'missing-object' },
      }),
    ).toThrow();
    expect(() =>
      ChangedFileSchema.parse({
        ...baseFile,
        availability: { kind: 'text', reason: 'binary' },
      }),
    ).toThrow();
  });
});
