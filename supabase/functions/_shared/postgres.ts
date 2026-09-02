export function postgresBytea(bytes: Uint8Array): string {
  let value = "\\x";
  for (const byte of bytes) value += byte.toString(16).padStart(2, "0");
  return value;
}
