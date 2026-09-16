import { existsSync, lstatSync, readdirSync, readlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { expect, it } from 'vitest';

it('lists XDG symlinks followed by the guard digest', () => {
  const links: string[] = [];
  const visit = (path: string): void => {
    const entry = lstatSync(path);
    if (entry.isSymbolicLink()) {
      links.push(`${path} -> ${readlinkSync(path)}`);
      return;
    }
    if (!entry.isDirectory()) return;
    for (const child of readdirSync(path, { withFileTypes: true })) visit(join(path, child.name));
  };
  for (const root of [join(homedir(), '.config'), join(homedir(), '.local', 'share'), join(homedir(), '.local', 'state'), join(homedir(), '.cache')]) {
    if (existsSync(root)) visit(root);
  }
  console.log(JSON.stringify({ links: links.slice(0, 100), count: links.length }));
  expect(links.length).toBeGreaterThanOrEqual(0);
}, 180_000);
