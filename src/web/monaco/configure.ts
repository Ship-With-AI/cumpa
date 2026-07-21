import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import typescriptWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

const LANGUAGE_BY_EXTENSION: Readonly<Record<string, string>> = {
  c: 'c',
  css: 'css',
  go: 'go',
  h: 'cpp',
  htm: 'html',
  html: 'html',
  java: 'java',
  js: 'javascript',
  json: 'json',
  jsx: 'javascript',
  md: 'markdown',
  mjs: 'javascript',
  mts: 'typescript',
  py: 'python',
  rs: 'rust',
  sh: 'shell',
  sql: 'sql',
  ts: 'typescript',
  tsx: 'typescript',
  vue: 'html',
  xml: 'xml',
  yml: 'yaml',
  yaml: 'yaml',
};

const LANGUAGE_BY_BASENAME: Readonly<Record<string, string>> = {
  dockerfile: 'dockerfile',
  makefile: 'makefile',
};

function workerForLabel(label: string): Worker {
  switch (label) {
    case 'json':
      return new jsonWorker();
    case 'css':
    case 'scss':
    case 'less':
      return new cssWorker();
    case 'html':
    case 'handlebars':
    case 'razor':
      return new htmlWorker();
    case 'typescript':
    case 'javascript':
      return new typescriptWorker();
    default:
      return new editorWorker();
  }
}

/** Configures Monaco's documented Vite ESM worker route exactly once per page. */
export function configureMonacoWorkers(): void {
  if (self.MonacoEnvironment?.getWorker !== undefined) {
    return;
  }

  self.MonacoEnvironment = {
    getWorker(_workerId: string, label: string): Worker {
      return workerForLabel(label);
    },
  };
}

/** Returns presentation-only language metadata; immutable model text is unchanged. */
export function languageForPath(path: string): string {
  const filename = path.split(/[\\/]/).at(-1)?.toLowerCase() ?? '';
  if (filename === '') {
    return 'plaintext';
  }

  const namedLanguage = LANGUAGE_BY_BASENAME[filename];
  if (namedLanguage !== undefined) {
    return namedLanguage;
  }

  const extension = filename.split('.').at(-1);
  return extension === undefined ? 'plaintext' : LANGUAGE_BY_EXTENSION[extension] ?? 'plaintext';
}
