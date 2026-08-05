import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { lstat, readFile, readlink } from 'node:fs/promises';

import { createExactPath, type ExactPath } from '../domain/path-bytes.js';
import type {
  Availability,
  ChangedFile,
  ChangedFileStatusKind,
  ExactPatchValidationTarget,
  GroundedExactPatch,
} from '../contracts/comparison.js';
import { MAX_INLINE_TEXT_BYTES } from './availability.js';
import { createObjectReader } from './objects.js';
import { discoverGitRepository } from './repository.js';
import { createGitRunner, type GitRunner } from './runner.js';

const zeroOid = (length: number) => '0'.repeat(length);
const modePattern = /^[0-7]{6}$/;
const oidPattern = /^[0-9a-f]+$/;

export class ExactPatchGroundingError extends Error {
  constructor(message = 'Invalid exact patch.') {
    super(message);
    this.name = 'ExactPatchGroundingError';
  }
}

export interface CreateGroundedExactPatchOptions {
  readonly cwd: string;
  readonly patchContent: string;
  readonly target: ExactPatchValidationTarget;
  readonly signal?: AbortSignal;
}

interface ParsedPath {
  readonly bytes: Buffer;
  readonly path: ExactPath;
}

interface ParsedPatch {
  oldPath: ParsedPath | undefined;
  newPath: ParsedPath | undefined;
  oldMode: string;
  newMode: string;
  oldOid: string;
  newOid: string;
  status: string;
  similarity: number | null;
  text: readonly string[] | undefined;
  binary: Readonly<{ readonly kind: 'literal' | 'delta'; readonly lines: readonly string[] }> | undefined;
}

interface TargetEntry {
  readonly mode: string;
  readonly type: string;
  readonly oid: string;
}

function fail(message?: string): never {
  throw new ExactPatchGroundingError(message);
}

function validUnicode(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next < 0xdc00 || next > 0xdfff) return false;
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return false;
    }
  }
  return true;
}

function decodeQuotedPath(value: string): Buffer {
  if (!value.startsWith('"') || !value.endsWith('"')) return Buffer.from(value, 'utf8');
  const bytes: number[] = [];
  for (let index = 1; index < value.length - 1; index += 1) {
    const character = value[index]!;
    if (character !== '\\') {
      bytes.push(...Buffer.from(character, 'utf8'));
      continue;
    }
    const escape = value[++index];
    if (escape === undefined) fail();
    if (/^[0-7]$/u.test(escape)) {
      const octal = `${escape}${value[++index] ?? ''}${value[++index] ?? ''}`;
      if (!/^[0-7]{3}$/u.test(octal)) fail();
      bytes.push(Number.parseInt(octal, 8));
      continue;
    }
    const escaped: Readonly<Record<string, number>> = { a: 7, b: 8, f: 12, n: 10, r: 13, t: 9, v: 11, '\\': 92, '"': 34 };
    if (escaped[escape] === undefined) fail();
    bytes.push(escaped[escape]!);
  }
  return Buffer.from(bytes);
}

function exactPath(value: string, prefix: 'a/' | 'b/' | undefined): ParsedPath | undefined {
  if (value === '/dev/null') return undefined;
  const bytes = decodeQuotedPath(value);
  const path = prefix !== undefined && bytes.subarray(0, 2).equals(Buffer.from(prefix, 'ascii')) ? bytes.subarray(2) : bytes;
  if (path.length === 0 || path[0] === 47 || path[0] === 92 || path.includes(0)) fail();
  for (const part of path.toString('latin1').split('/')) {
    if (part === '' || part === '.' || part === '..' || part === '.git' || part === '.compare') fail();
  }
  return Object.freeze({ bytes: Buffer.from(path), path: createExactPath(path) });
}

function splitGitTokens(value: string): readonly string[] {
  const result: string[] = [];
  let token = '';
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]!;
    if (character === '"') quoted = !quoted;
    if (character === ' ' && !quoted) {
      if (token.length > 0) result.push(token);
      token = '';
    } else {
      token += character;
    }
  }
  if (quoted || token.length === 0) fail();
  result.push(token);
  return result;
}

function parsePatch(content: string, oidLength: number): readonly ParsedPatch[] {
  const lines = content.split('\n').map((line) => line.endsWith('\r') ? line.slice(0, -1) : line);
  const records: ParsedPatch[] = [];
  let current: Omit<ParsedPatch, 'oldOid' | 'newOid' | 'text' | 'binary'> & { oldOid?: string; newOid?: string; text?: string[]; binary?: { kind: 'literal' | 'delta'; lines: string[] } } | undefined;
  let body: 'text' | 'binary' | undefined;

  const finish = () => {
    if (current === undefined || current.oldOid === undefined || current.newOid === undefined) fail();
    records.push(Object.freeze({ ...current, text: current.text === undefined ? undefined : Object.freeze([...current.text]), binary: current.binary === undefined ? undefined : Object.freeze({ kind: current.binary.kind, lines: Object.freeze([...current.binary.lines]) }) }));
    current = undefined;
    body = undefined;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (line.startsWith('diff --combined ') || line.startsWith('diff --cc ')) fail();
    if (line.startsWith('diff --git ')) {
      if (current !== undefined) finish();
      const tokens = splitGitTokens(line.slice('diff --git '.length));
      if (tokens.length !== 2) fail();
      current = { oldPath: exactPath(tokens[0]!, 'a/'), newPath: exactPath(tokens[1]!, 'b/'), oldMode: '100644', newMode: '100644', status: 'M', similarity: null };
      continue;
    }
    if (current === undefined) {
      if (line.length !== 0) fail();
      continue;
    }
    if (line.startsWith('index ')) {
      const match = /^index ([0-9a-f]+)\.\.([0-9a-f]+)(?: ([0-7]{6}))?$/u.exec(line);
      if (match === null || match[1]!.length !== oidLength || match[2]!.length !== oidLength || !oidPattern.test(match[1]!) || !oidPattern.test(match[2]!)) fail();
      current.oldOid = match[1]!;
      current.newOid = match[2]!;
      if (match[3] !== undefined) current.oldMode = current.newMode = match[3];
      continue;
    }
    if (line.startsWith('new file mode ')) {
      current.oldMode = '000000'; current.newMode = line.slice(14); current.status = 'A'; continue;
    }
    if (line.startsWith('deleted file mode ')) {
      current.oldMode = line.slice(18); current.newMode = '000000'; current.status = 'D'; continue;
    }
    if (line.startsWith('old mode ')) { current.oldMode = line.slice(9); continue; }
    if (line.startsWith('new mode ')) { current.newMode = line.slice(9); continue; }
    if (line.startsWith('similarity index ')) {
      const number = Number.parseInt(line.slice(17, -1), 10);
      if (!/^[0-9]{1,3}%$/u.test(line.slice(17)) || number > 100) fail();
      current.similarity = number; continue;
    }
    if (line.startsWith('rename from ')) { current.oldPath = exactPath(line.slice(12), undefined); current.status = 'R'; continue; }
    if (line.startsWith('rename to ')) { current.newPath = exactPath(line.slice(10), undefined); current.status = 'R'; continue; }
    if (line.startsWith('copy from ')) { current.oldPath = exactPath(line.slice(10), undefined); current.status = 'C'; continue; }
    if (line.startsWith('copy to ')) { current.newPath = exactPath(line.slice(8), undefined); current.status = 'C'; continue; }
    if (line.startsWith('--- ')) {
      current.oldPath = exactPath(line.slice(4), 'a/');
      const next = lines[++index];
      if (next === undefined || !next.startsWith('+++ ')) fail();
      current.newPath = exactPath(next.slice(4), 'b/');
      current.text = [];
      body = 'text';
      continue;
    }
    if (line === 'GIT binary patch') { current.binary = { kind: 'literal', lines: [] }; body = 'binary'; continue; }
    if (body === 'text') current.text!.push(line);
    else if (body === 'binary') {
      const kind = /^(literal|delta) [0-9]+$/u.exec(line);
      if (kind !== null) {
        if (current.binary!.lines.length > 0) break;
        current.binary!.kind = kind[1]! as 'literal' | 'delta';
      } else if (line.length > 0) current.binary!.lines.push(line);
    } else if (line.length !== 0) fail();
  }
  if (current !== undefined) finish();
  if (records.length === 0) fail();
  return Object.freeze(records);
}

function decodeBase85(lines: readonly string[]): Buffer {
  const output: number[] = [];
  for (const line of lines) {
    const lengthCode = line.charCodeAt(0);
    const length = lengthCode >= 65 && lengthCode <= 90 ? lengthCode - 64 : lengthCode >= 97 && lengthCode <= 122 ? lengthCode - 70 : -1;
    if (length < 1 || length > 52 || (line.length - 1) % 5 !== 0) fail();
    const block: number[] = [];
    for (let index = 1; index < line.length; index += 5) {
      let value = 0;
      for (const character of line.slice(index, index + 5)) {
        const digit = character.charCodeAt(0) - 33;
        if (digit < 0 || digit >= 85) fail();
        value = value * 85 + digit;
      }
      block.push((value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255);
    }
    if (length > block.length) fail();
    output.push(...block.slice(0, length));
  }
  try { return inflateSync(Buffer.from(output)); } catch { return fail(); }
}

function readVarint(bytes: Buffer, offset: { value: number }): number {
  let value = 0; let shift = 0;
  while (true) {
    const byte = bytes[offset.value++];
    if (byte === undefined || shift > 28) fail();
    value |= (byte & 127) << shift;
    if ((byte & 128) === 0) return value;
    shift += 7;
  }
}

function applyDelta(base: Buffer, delta: Buffer): Buffer {
  const offset = { value: 0 };
  if (readVarint(delta, offset) !== base.length) fail();
  const resultSize = readVarint(delta, offset);
  if (resultSize > MAX_INLINE_TEXT_BYTES) fail();
  const result: Buffer[] = [];
  let length = 0;
  while (offset.value < delta.length) {
    const instruction = delta[offset.value++]!;
    if ((instruction & 128) === 0) {
      if (instruction === 0 || offset.value + instruction > delta.length) fail();
      result.push(delta.subarray(offset.value, offset.value + instruction)); offset.value += instruction; length += instruction;
      continue;
    }
    let source = 0; let count = 0;
    for (let bit = 0; bit < 4; bit += 1) if ((instruction & (1 << bit)) !== 0) source |= (delta[offset.value++] ?? fail()) << (bit * 8);
    for (let bit = 0; bit < 3; bit += 1) if ((instruction & (1 << (bit + 4))) !== 0) count |= (delta[offset.value++] ?? fail()) << (bit * 8);
    if (count === 0) count = 0x10000;
    if (source + count > base.length) fail();
    result.push(base.subarray(source, source + count)); length += count;
  }
  if (length !== resultSize) fail();
  return Buffer.concat(result, resultSize);
}

function applyText(preimage: Buffer, lines: readonly string[]): Buffer {
  let source: string;
  try { source = new TextDecoder('utf-8', { fatal: true }).decode(preimage); } catch { return fail(); }
  const original = source.match(/.*(?:\n|$)/gu)?.filter((line) => line.length > 0) ?? [];
  const output: string[] = [];
  let cursor = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/u.exec(line);
    if (hunk !== null) {
      const start = Number.parseInt(hunk[1]!, 10) - 1;
      if (start < cursor || start > original.length) fail();
      output.push(...original.slice(cursor, start)); cursor = start; continue;
    }
    if (line === '\\ No newline at end of file') continue;
    if (line.length === 0) continue;
    const prefix = line[0];
    if (prefix !== ' ' && prefix !== '+' && prefix !== '-') fail();
    const value = `${line.slice(1)}${lines[index + 1] === '\\ No newline at end of file' ? '' : '\n'}`;
    if (prefix === ' ' || prefix === '-') {
      if (original[cursor] !== value) fail();
      cursor += 1;
    }
    if (prefix === ' ' || prefix === '+') output.push(value);
  }
  output.push(...original.slice(cursor));
  return Buffer.from(output.join(''), 'utf8');
}

function blobOid(bytes: Buffer, format: 'sha1' | 'sha256'): string {
  return createHash(format).update(`blob ${bytes.length}\0`, 'ascii').update(bytes).digest('hex');
}

function availability(mode: string, bytes: Buffer | undefined): Availability {
  if (mode === '160000') return Object.freeze({ kind: 'unsupported', reason: 'submodule' });
  if (mode === '120000') return Object.freeze({ kind: 'unsupported', reason: 'symlink' });
  if (bytes === undefined || !/^100[67]44$|^100755$/u.test(mode)) return Object.freeze({ kind: 'unsupported', reason: 'mode-or-type' });
  if (bytes.length > MAX_INLINE_TEXT_BYTES) return Object.freeze({ kind: 'unsupported', reason: 'oversized' });
  if (bytes.includes(0)) return Object.freeze({ kind: 'unsupported', reason: 'binary' });
  try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { return Object.freeze({ kind: 'unsupported', reason: 'non-utf8' }); }
  return Object.freeze({ kind: 'text' });
}

async function repositoryTree(root: string, runner: GitRunner, signal?: AbortSignal): Promise<ReadonlyMap<string, TargetEntry>> {
  const result = await runner.run(['ls-tree', '-r', '-z', '--full-tree', 'HEAD'], { cwd: root, maxStdoutBytes: MAX_INLINE_TEXT_BYTES, signal });
  const tree = new Map<string, TargetEntry>();
  for (const record of result.stdout.toString('latin1').split('\0').filter(Boolean)) {
    const tab = record.indexOf('\t'); const header = record.slice(0, tab); const path = Buffer.from(record.slice(tab + 1), 'latin1');
    const fields = header.split(' ');
    if (tab < 0 || fields.length !== 3 || !modePattern.test(fields[0]!) || !oidPattern.test(fields[2]!)) fail();
    tree.set(path.toString('base64url'), Object.freeze({ mode: fields[0]!, type: fields[1]!, oid: fields[2]! }));
  }
  return tree;
}

async function worktreeEntry(root: string, path: ParsedPath): Promise<{ readonly mode: string; readonly bytes: Buffer } | undefined> {
  let current = Buffer.from(root, 'utf8');
  const parts = path.bytes.toString('latin1').split('/');
  for (const [index, part] of parts.entries()) {
    current = Buffer.concat([current, Buffer.from('/', 'ascii'), Buffer.from(part, 'latin1')]);
    const entry = await lstat(current);
    if (index < parts.length - 1 && entry.isSymbolicLink()) fail();
    if (index === parts.length - 1) {
      if (entry.isSymbolicLink()) return Object.freeze({ mode: '120000', bytes: await readlink(current, { encoding: 'buffer' }) });
      if (!entry.isFile()) fail();
      return Object.freeze({ mode: (entry.mode & 0o111) === 0 ? '100644' : '100755', bytes: await readFile(current) });
    }
  }
  return undefined;
}

export async function createGroundedExactPatch(options: CreateGroundedExactPatchOptions): Promise<GroundedExactPatch> {
  try {
    if (options.patchContent.length === 0 || options.patchContent.includes('\0') || !validUnicode(options.patchContent) || Buffer.byteLength(options.patchContent, 'utf8') > MAX_INLINE_TEXT_BYTES) fail();
    const runner = createGitRunner();
    const repository = await discoverGitRepository(options.cwd, runner, options.signal);
    const formatResult = await runner.run(['rev-parse', '--show-object-format'], { cwd: repository.root, maxStdoutBytes: 16, signal: options.signal });
    const objectFormat = formatResult.stdout.toString('ascii').trim();
    if (objectFormat !== 'sha1' && objectFormat !== 'sha256') fail();
    const oidLength = objectFormat === 'sha1' ? 40 : 64;
    const records = parsePatch(options.patchContent, oidLength);
    const objectReader = createObjectReader(repository.root, { runner });
    const tree = options.target.kind === 'repository' ? await repositoryTree(repository.root, runner, options.signal) : undefined;
    const seen = new Set<string>();
    const files: ChangedFile[] = [];
    const contents = new Map<string, Readonly<{ readonly preimage: Buffer | undefined; readonly postimage: Buffer | undefined }>>();

    for (const [index, record] of records.entries()) {
      if (!modePattern.test(record.oldMode) || !modePattern.test(record.newMode)) fail();
      const oldAbsent = record.oldOid === zeroOid(oidLength);
      const newAbsent = record.newOid === zeroOid(oidLength);
      if (oldAbsent !== (record.oldMode === '000000') || newAbsent !== (record.newMode === '000000') || (oldAbsent && newAbsent)) fail();
      const identity = `${record.oldPath?.path.bytesBase64url ?? ''}\0${record.newPath?.path.bytesBase64url ?? ''}`;
      if (seen.has(identity)) fail(); seen.add(identity);
      let oldBytes: Buffer | undefined;
      if (!oldAbsent) {
        const preimage = await objectReader.read(record.oldOid, { maxBytes: MAX_INLINE_TEXT_BYTES, signal: options.signal });
        const metadata = await objectReader.inspect(record.oldOid, options.signal);
        if (preimage.kind !== 'available' || metadata.kind !== 'available' || metadata.objectType !== 'blob') fail();
        oldBytes = Buffer.from(preimage.bytes);
      }
      let postBytes: Buffer | undefined;
      if (newAbsent) postBytes = undefined;
      else if (record.text !== undefined) postBytes = applyText(oldBytes ?? Buffer.alloc(0), record.text);
      else if (record.binary !== undefined) {
        const decoded = decodeBase85(record.binary.lines);
        postBytes = record.binary.kind === 'delta' ? applyDelta(oldBytes ?? fail(), decoded) : decoded;
      } else postBytes = Buffer.from(oldBytes ?? Buffer.alloc(0));
      if (!newAbsent && (postBytes === undefined || blobOid(postBytes, objectFormat) !== record.newOid)) fail();
      const targetPath = record.newPath;
      let actual: Readonly<{ mode: string; bytes: Buffer }> | undefined;
      if (!newAbsent && targetPath === undefined) fail();
      if (targetPath !== undefined) {
        if (tree !== undefined) {
          const entry = tree.get(targetPath.bytes.toString('base64url'));
          if (entry !== undefined) {
            if (entry.type !== 'blob') fail();
            const object = await objectReader.read(entry.oid, { maxBytes: MAX_INLINE_TEXT_BYTES, signal: options.signal });
            if (object.kind !== 'available') fail();
            actual = Object.freeze({ mode: entry.mode, bytes: Buffer.from(object.bytes) });
          }
        } else actual = await worktreeEntry(repository.root, targetPath);
      }
      if (newAbsent ? actual !== undefined : actual === undefined || actual.mode !== record.newMode || !actual.bytes.equals(postBytes!)) fail('Patch does not match the selected target.');
      const statusCode = record.status === 'R' ? 'R' : record.status === 'C' ? 'C' : oldAbsent ? 'A' : newAbsent ? 'D' : record.oldMode !== record.newMode ? 'T' : 'M';
      const kind: ChangedFileStatusKind = statusCode === 'A' ? 'added' : statusCode === 'D' ? 'deleted' : statusCode === 'R' ? 'renamed' : statusCode === 'C' ? 'copied' : statusCode === 'T' ? 'type-changed' : 'modified';
      const id = `file_${createHash('sha256').update(`${index}\0${identity}`, 'utf8').digest('base64url')}`;
      const additions = record.text?.filter((line) => line.startsWith('+')).length ?? 0;
      const deletions = record.text?.filter((line) => line.startsWith('-')).length ?? 0;
      files.push(Object.freeze({ id, status: Object.freeze({ code: statusCode, kind, similarity: record.similarity }), oldMode: record.oldMode, newMode: record.newMode, oldBlobOid: record.oldOid, newBlobOid: record.newOid, oldPath: record.oldPath?.path, newPath: record.newPath?.path, additions, deletions, availability: availability(record.newMode, postBytes) }));
      contents.set(id, Object.freeze({ preimage: oldBytes === undefined ? undefined : Buffer.from(oldBytes), postimage: postBytes === undefined ? undefined : Buffer.from(postBytes) }));
    }
    const scope = Object.freeze({ kind: 'exact-patch' as const, digest: createHash('sha256').update(Buffer.from(options.patchContent, 'utf8')).digest('hex'), validationTarget: Object.freeze({ ...options.target }), submittedByteLength: Buffer.byteLength(options.patchContent, 'utf8') });
    return Object.freeze({ repositoryRoot: repository.root, objectFormat, scope, changedFiles: Object.freeze(files), contents: new Map(contents) });
  } catch (error) {
    if (error instanceof ExactPatchGroundingError) throw error;
    throw new ExactPatchGroundingError();
  }
}
