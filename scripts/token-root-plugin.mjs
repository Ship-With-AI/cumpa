import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VIRTUAL_ID = 'virtual:cumpa-tokens';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
export const ROOT_DECLARATIONS = /:root\s*\{([\s\S]*?)\n\}/u;

export function tokenRootPlugin(repositoryRoot) {
  return {
    name: 'cumpa-token-root',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) {
        return undefined;
      }

      const sourcePath = resolve(repositoryRoot, 'src/web/styles.css');
      this.addWatchFile(sourcePath);
      const root = readFileSync(sourcePath, 'utf8').match(ROOT_DECLARATIONS)?.[1];
      if (root === undefined) {
        throw new Error('src/web/styles.css must declare the canonical :root token block');
      }

      return `export const TOKEN_ROOT_CSS = ${JSON.stringify(root)};\n`;
    },
  };
}
