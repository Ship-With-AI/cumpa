export interface SourceSearchPromptConfig {
  readonly message: string;
  readonly default?: string;
  readonly backValue?: string;
}

export type SourceSearchPrompt = (
  config: SourceSearchPromptConfig,
) => Promise<string | undefined>;

export function buildSourceSearchItems(
  ..._arguments: readonly unknown[]
): never {
  throw new Error('Source candidate search is not implemented');
}

export async function pickOrderedSources(
  ..._arguments: readonly unknown[]
): Promise<never> {
  throw new Error('Ordered source selection is not implemented');
}
