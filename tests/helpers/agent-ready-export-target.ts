export function hasObservedNativeReExport(platform: string, arch: string): boolean {
  return platform === 'darwin' && arch === 'arm64';
}
