export interface ExactPath {
  readonly bytesBase64url: string;
  readonly display: string;
  readonly utf8?: string;
}

const strictUtf8Decoder = new TextDecoder('utf-8', { fatal: true });
const displayDecoder = new TextDecoder('utf-8');
const bytesByPath = new WeakMap<ExactPath, Buffer>();

function controlSafeDisplay(value: string): string {
  let display = '';
  for (const character of value) {
    const codePoint = character.codePointAt(0)!;
    if (character === '\\') {
      display += '\\\\';
    } else if (character === '\t') {
      display += '\\t';
    } else if (character === '\n') {
      display += '\\n';
    } else if (character === '\r') {
      display += '\\r';
    } else if (
      codePoint < 0x20 ||
      (codePoint >= 0x7f && codePoint <= 0x9f)
    ) {
      display += `\\u{${codePoint.toString(16).padStart(2, '0')}}`;
    } else {
      display += character;
    }
  }
  return display;
}

export function createExactPath(bytes: Uint8Array): ExactPath {
  const ownedBytes = Buffer.from(bytes);
  let utf8: string | undefined;
  try {
    utf8 = strictUtf8Decoder.decode(ownedBytes);
  } catch {
    utf8 = undefined;
  }

  const path = Object.freeze({
    bytesBase64url: ownedBytes.toString('base64url'),
    display: controlSafeDisplay(displayDecoder.decode(ownedBytes)),
    ...(utf8 === undefined ? {} : { utf8 }),
  });
  bytesByPath.set(path, ownedBytes);
  return path;
}

export function compareExactPaths(left: ExactPath, right: ExactPath): number {
  const leftBytes =
    bytesByPath.get(left) ?? Buffer.from(left.bytesBase64url, 'base64url');
  const rightBytes =
    bytesByPath.get(right) ?? Buffer.from(right.bytesBase64url, 'base64url');
  return Buffer.compare(leftBytes, rightBytes);
}
