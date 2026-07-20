import search from '@inquirer/search';
import type { PinnedComparison } from '../contracts/comparison.js';

import {
  DIRTY_EXPLANATION,
  DIRTY_ROW_LABEL,
} from '../domain/source.js';
import { escapeTerminalText } from './picker.js';

export type ConfirmationChoice = 'back' | 'launch';

export interface ConfirmationPromptConfig {
  readonly message: string;
  readonly choices: readonly {
    readonly name: string;
    readonly value: ConfirmationChoice;
  }[];
}

export type ConfirmationPrompt = (
  config: ConfirmationPromptConfig,
) => Promise<ConfirmationChoice>;

export interface ConfirmPinnedComparisonDependencies {
  readonly output?: (message: string) => void;
  readonly prompt?: ConfirmationPrompt;
}

const confirmationChoices = [
  { name: 'Launch pinned comparison', value: 'launch' },
  { name: 'Back', value: 'back' },
] as const;

async function defaultPrompt(
  config: ConfirmationPromptConfig,
): Promise<ConfirmationChoice> {
  return await search({
    message: config.message,
    source: async () => [...config.choices],
  });
}

export async function confirmPinnedComparison(
  comparison: PinnedComparison,
  dependencies: ConfirmPinnedComparisonDependencies = {},
): Promise<ConfirmationChoice> {
  const output = dependencies.output ?? console.log;
  const prompt = dependencies.prompt ?? defaultPrompt;

  output('Confirm pinned comparison');
  output(
    `Base: ${escapeTerminalText(comparison.base.label)}\n${comparison.base.oid}`,
  );
  output(
    `Head: ${escapeTerminalText(comparison.head.label)}\n${comparison.head.oid}`,
  );
  output(`Merge base:\n${comparison.mergeBaseOid}`);

  if (comparison.base.source?.kind === 'worktree') {
    output(`Base worktree: ${escapeTerminalText(comparison.base.source.path)}`);
  }
  if (comparison.head.source?.kind === 'worktree') {
    output(`Head worktree: ${escapeTerminalText(comparison.head.source.path)}`);
  }
  if (
    (comparison.base.source?.kind === 'worktree' &&
      comparison.base.source.dirty) ||
    (comparison.head.source?.kind === 'worktree' &&
      comparison.head.source.dirty)
  ) {
    output(`${DIRTY_ROW_LABEL}\n${DIRTY_EXPLANATION}`);
  }

  output(
    'This session is pinned to the commits shown below and does not follow moving refs.',
  );

  return await prompt({
    message: 'Launch this pinned comparison?',
    choices: confirmationChoices,
  });
}
