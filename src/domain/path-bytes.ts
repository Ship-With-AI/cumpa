export interface ExactPath {
  readonly bytesBase64url: string;
  readonly display: string;
  readonly utf8?: string;
}

const strictUtf8Decoder = new TextDecoder('utf-8', { fatal: true });
const displayDecoder = new TextDecoder('utf-8');
const bytesByPath = new WeakMap<ExactPath, Uint8Array>();

export function encodeBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

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
  const ownedBytes = new Uint8Array(bytes);
  let utf8: string | undefined;
  try {
    utf8 = strictUtf8Decoder.decode(ownedBytes);
  } catch {
    utf8 = undefined;
  }

  const path = Object.freeze({
    bytesBase64url: encodeBase64url(ownedBytes),
    display: controlSafeDisplay(displayDecoder.decode(ownedBytes)),
    ...(utf8 === undefined ? {} : { utf8 }),
  });
  bytesByPath.set(path, ownedBytes);
  return path;
}

export function compareExactPaths(left: ExactPath, right: ExactPath): number {
  const leftBytes =
    bytesByPath.get(left) ?? decodeBase64url(left.bytesBase64url);
  const rightBytes =
    bytesByPath.get(right) ?? decodeBase64url(right.bytesBase64url);
  const sharedLength = Math.min(leftBytes.length, rightBytes.length);
  for (let index = 0; index < sharedLength; index += 1) {
    const difference = leftBytes[index]! - rightBytes[index]!;
    if (difference !== 0) {
      return difference;
    }
  }
  return leftBytes.length - rightBytes.length;
}

export function decodeBase64url(value: string): Uint8Array {
  const base64 = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
