import { delimiter, isAbsolute, relative, sep } from 'node:path';

import { z } from 'zod';

export const PINNED_PUBLIC_ARTIFACT = Object.freeze({
  packageLabel: '@shipwithai/cumpa@1.5.0',
  name: '@shipwithai/cumpa',
  version: '1.5.0',
  tarballUrl: 'https://registry.npmjs.org/@shipwithai/cumpa/-/cumpa-1.5.0.tgz',
  byteLength: 3514800,
  sha256: 'dc8f792920833415d309015d5f4c31501016e9a4a6cc945bb69dde2453137141',
  npmShasumSha1: '2d58866c862283f2c41b3f4f7d51282b2ca96472',
  npmIntegritySha512: 'sha512-gUBrMYwL8u75k1JX1OxO2dwfUsjQGHAqPUjh8e5Ep6gVs52wwEZFwkl49fBU2eggU9S7J1r27SCa8W1X/iHn5g==',
} as const);

const RegistryDistSchema = z.object({
  tarball: z.string(),
  shasum: z.string(),
  integrity: z.string(),
}).strict();

const InstalledResolutionSchema = z.object({
  version: z.string(),
  resolved: z.string(),
  integrity: z.string(),
}).strict();

function fail(message: string): never {
  throw new Error(`[public-artifact] ${message}`);
}

export function assertPinnedRegistryDist(dist: unknown): z.infer<typeof RegistryDistSchema> {
  const parsed = RegistryDistSchema.safeParse(dist);
  if (!parsed.success) fail('registry distribution metadata is malformed');
  if (
    parsed.data.tarball !== PINNED_PUBLIC_ARTIFACT.tarballUrl
    || parsed.data.shasum !== PINNED_PUBLIC_ARTIFACT.npmShasumSha1
    || parsed.data.integrity !== PINNED_PUBLIC_ARTIFACT.npmIntegritySha512
  ) fail('registry distribution metadata does not match the pinned artifact');
  return parsed.data;
}

export function assertPinnedInstalledResolution(entry: unknown): z.infer<typeof InstalledResolutionSchema> {
  const parsed = InstalledResolutionSchema.safeParse(entry);
  if (!parsed.success) fail('installed resolution metadata is malformed');
  if (
    parsed.data.version !== PINNED_PUBLIC_ARTIFACT.version
    || parsed.data.resolved !== PINNED_PUBLIC_ARTIFACT.tarballUrl
    || parsed.data.integrity !== PINNED_PUBLIC_ARTIFACT.npmIntegritySha512
  ) fail('installed resolution does not match the pinned artifact');
  return parsed.data;
}

export function isContainedPath(candidateRealpath: string, rootRealpath: string): boolean {
  if (candidateRealpath === rootRealpath) return true;
  const relation = relative(rootRealpath, candidateRealpath);
  return relation.length > 0
    && !relation.startsWith('..')
    && !isAbsolute(relation)
    && candidateRealpath.startsWith(`${rootRealpath}${sep}`);
}

export function buildIsolatedPath(directories: readonly string[]): string {
  if (directories.length === 0 || directories.some((directory) => directory.length === 0 || !isAbsolute(directory))) {
    fail('isolated PATH requires one or more absolute directories');
  }
  return directories.join(delimiter);
}
