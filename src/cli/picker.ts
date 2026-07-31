import search, { Separator } from '@inquirer/search';

import {
  DIRTY_ROW_LABEL,
  PENDING_ROW_LABEL,
  UNAVAILABLE_WORKTREE_REASON,
  type BranchCandidate,
  type OrderedSources,
  type SourceCandidate,
  type WorktreeCandidate,
} from '../domain/source.js';
import type { SourceDiscovery } from '../git/candidates.js';

const BASE_PROMPT =
  'Choose base — changes will be compared from its merge base with head';
const HEAD_PROMPT =
  'Choose head — this committed state will be reviewed';
const BACK_TO_BASE = 'compare:back-to-base';

export interface SourceCandidateSearchItem {
  readonly kind: 'candidate';
  readonly value: string;
  readonly name: string;
  readonly disabled?: string;
}

export interface SourceSeparatorSearchItem {
  readonly kind: 'separator';
  readonly label: string;
}

export interface SourceActionSearchItem {
  readonly kind: 'action';
  readonly value: string;
  readonly name: string;
}

export type SourceSearchItem =
  | SourceActionSearchItem
  | SourceCandidateSearchItem
  | SourceSeparatorSearchItem;

export interface SourceSearchPromptConfig {
  readonly message: string;
  readonly default?: string;
  readonly backValue?: string;
  readonly source: (
    term: string | undefined,
    options: { readonly signal: AbortSignal },
  ) => Promise<
    readonly (
      | Separator
      | {
          readonly value: string;
          readonly name: string;
          readonly disabled?: string;
        }
    )[]
  >;
}

export type SourceSearchPrompt = (
  config: SourceSearchPromptConfig,
) => Promise<string | undefined>;

export interface BuildSourceSearchOptions {
  readonly role: 'base' | 'head';
  readonly suggestedHeadId?: string;
}

export interface PickerRecoveryOptions {
  readonly role: 'base' | 'head';
  readonly focusedCandidateId: string | undefined;
  readonly searchTerm: string;
}

export interface PickOrderedSourcesOptions {
  readonly candidates: readonly SourceCandidate[];
  readonly searchBranches: SourceDiscovery['searchBranches'];
  readonly candidateEnrichment?: SourceDiscovery['candidateEnrichment'];
  readonly startCandidateEnrichment?: SourceDiscovery['startCandidateEnrichment'];
  readonly suggestedHeadId?: string;
  readonly initialBase?: SourceCandidate;
  readonly initialHead?: SourceCandidate;
  readonly recovery?: PickerRecoveryOptions;
}

export interface PickOrderedSourcesDependencies {
  readonly prompt?: SourceSearchPrompt;
}

export function escapeTerminalText(value: string): string {
  let result = '';
  for (const character of value) {
    const codePoint = character.codePointAt(0)!;
    switch (codePoint) {
      case 0x09:
        result += '\\t';
        break;
      case 0x0a:
        result += '\\n';
        break;
      case 0x0d:
        result += '\\r';
        break;
      case 0x5c:
        result += '\\\\';
        break;
      default:
        result +=
          codePoint < 0x20 || (codePoint >= 0x7f && codePoint <= 0x9f)
            ? `\\x${codePoint.toString(16).toUpperCase().padStart(2, '0')}`
            : character;
    }
  }
  return result;
}

function worktreeState(candidate: WorktreeCandidate): string {
  if (candidate.availability === 'dirty') {
    return DIRTY_ROW_LABEL;
  }
  if (candidate.availability === 'pending') {
    return PENDING_ROW_LABEL;
  }
  if (candidate.availability === 'unavailable') {
    return 'Unavailable';
  }
  return 'Clean';
}

function candidateMatches(candidate: SourceCandidate, query: string): boolean {
  if (query.length === 0) {
    return true;
  }
  const identifyingText =
    candidate.kind === 'branch'
      ? [
          'branch',
          'local branch',
          candidate.label,
          candidate.refName,
          candidate.commitOid,
          candidate.shortOid,
        ].join(' ')
      : [
          'worktree',
          candidate.label,
          candidate.path,
          candidate.commitOid ?? '',
          candidate.shortOid ?? '',
          candidate.detached ? 'detached' : 'attached',
          worktreeState(candidate),
          candidate.unavailableReason ?? '',
        ].join(' ');
  return identifyingText.toLowerCase().includes(query);
}

function candidateItem(
  candidate: SourceCandidate,
  options: BuildSourceSearchOptions,
): SourceCandidateSearchItem {
  const suggested =
    options.role === 'head' && candidate.id === options.suggestedHeadId
      ? ' · Suggested: current checkout'
      : '';
  if (candidate.kind === 'branch') {
    return {
      kind: 'candidate',
      value: candidate.id,
      name: `[Branch] ${escapeTerminalText(candidate.label)} · ${candidate.shortOid}${suggested}`,
    };
  }

  const detached = candidate.detached ? ' · Detached' : '';
  const shortOid = candidate.shortOid ?? 'no committed HEAD';
  return {
    kind: 'candidate',
    value: candidate.id,
    name:
      `[Worktree] ${escapeTerminalText(candidate.label)} · ${shortOid}` +
      `${detached} · ${worktreeState(candidate)}${suggested}\n` +
      `    ${escapeTerminalText(candidate.path)}`,
    disabled:
      candidate.availability === 'unavailable'
        ? candidate.unavailableReason ?? UNAVAILABLE_WORKTREE_REASON
        : undefined,
  };
}

export function buildSourceSearchItems(
  candidates: readonly SourceCandidate[],
  term: string | undefined,
  options: BuildSourceSearchOptions,
): readonly SourceSearchItem[] {
  const query = (term ?? '').toLowerCase();
  const branchItems = candidates
    .filter(
      (candidate) =>
        candidate.kind === 'branch' && candidateMatches(candidate, query),
    )
    .map((candidate) => candidateItem(candidate, options));
  const worktreeItems = candidates
    .filter(
      (candidate) =>
        candidate.kind === 'worktree' && candidateMatches(candidate, query),
    )
    .map((candidate) => candidateItem(candidate, options));
  const items: SourceSearchItem[] = [
    { kind: 'separator', label: 'Local branches' },
    ...branchItems,
    { kind: 'separator', label: 'Worktrees' },
    ...worktreeItems,
  ];

  if (branchItems.length === 0 && worktreeItems.length === 0) {
    items.push({
      kind: 'separator',
      label: 'No branches or worktrees match this search.',
    });
  }
  if (options.role === 'head') {
    items.push({ kind: 'action', value: BACK_TO_BASE, name: 'Back' });
  }
  return items;
}

function promptItems(
  items: readonly SourceSearchItem[],
): readonly (
  | Separator
  | {
      readonly value: string;
      readonly name: string;
      readonly disabled?: string;
    }
)[] {
  return items.map((item) =>
    item.kind === 'separator'
      ? new Separator(item.label)
      : {
          value: item.value,
          name: item.name,
          ...(item.kind === 'candidate' && item.disabled !== undefined
            ? { disabled: item.disabled }
            : {}),
        },
  );
}

function mergedCandidates(
  candidates: readonly SourceCandidate[],
  branches: readonly BranchCandidate[],
): readonly SourceCandidate[] {
  const branchIds = new Set<string>();
  const mergedBranches = branches.filter((candidate) => {
    if (branchIds.has(candidate.id)) {
      return false;
    }
    branchIds.add(candidate.id);
    return true;
  });
  return [
    ...mergedBranches,
    ...candidates.filter((candidate) => candidate.kind === 'worktree'),
  ];
}

function sourceForPrompt(
  candidates: () => readonly SourceCandidate[],
  searchBranches: SourceDiscovery['searchBranches'],
  candidateById: Map<string, SourceCandidate>,
  startCandidateEnrichment: (() => void) | undefined,
  options: BuildSourceSearchOptions,
  initialSearchTerm = '',
): SourceSearchPromptConfig['source'] {
  let firstRequest = true;
  return async (term, { signal }) => {
    signal.throwIfAborted();
    const startEnrichment = firstRequest;
    const effectiveTerm =
      firstRequest && term === undefined ? initialSearchTerm : term;
    firstRequest = false;
    if ((effectiveTerm ?? '').length === 0) {
      const items = promptItems(
        buildSourceSearchItems(candidates(), effectiveTerm, options),
      );
      if (startEnrichment) {
        startCandidateEnrichment?.();
      }
      return items;
    }

    const branches = await searchBranches(effectiveTerm!, signal);
    signal.throwIfAborted();
    for (const candidate of branches) {
      candidateById.set(candidate.id, candidate);
    }
    const items = promptItems(
      buildSourceSearchItems(
        mergedCandidates(candidates(), branches),
        undefined,
        options,
      ),
    );
    if (startEnrichment) {
      startCandidateEnrichment?.();
    }
    return items;
  };
}

export async function pickOrderedSources(
  options: PickOrderedSourcesOptions,
  dependencies: PickOrderedSourcesDependencies = {},
): Promise<OrderedSources> {
  let currentCandidates = options.candidates;
  const candidateById = new Map(
    currentCandidates.map((candidate) => [candidate.id, candidate] as const),
  );
  const candidateEnrichment = options.candidateEnrichment?.then(
    (enrichedCandidates) => {
      currentCandidates = enrichedCandidates;
      for (const candidate of enrichedCandidates) {
        candidateById.set(candidate.id, candidate);
      }
      return enrichedCandidates;
    },
  );
  void candidateEnrichment?.catch(() => undefined);
  const prompt: SourceSearchPrompt =
    dependencies.prompt ??
    (async (config) =>
      await search({
        message: config.message,
        source: config.source,
        ...(config.default === undefined ? {} : { default: config.default }),
      }));
  let base = options.initialBase;
  let head = options.initialHead;

  while (true) {
    if (base === undefined) {
      const selectedBaseId = await prompt({
        message:
          head === undefined
            ? BASE_PROMPT
            : `${BASE_PROMPT}\nHead retained: ${escapeTerminalText(head.label)} · ${head.shortOid ?? 'unavailable'}`,
        source: sourceForPrompt(
          () => currentCandidates,
          options.searchBranches,
          candidateById,
          options.startCandidateEnrichment,
          { role: 'base' },
          options.recovery?.role === 'base'
            ? options.recovery.searchTerm
            : '',
        ),
        ...(options.recovery?.role === 'base' &&
        options.recovery.focusedCandidateId !== undefined
          ? { default: options.recovery.focusedCandidateId }
          : {}),
      });
      base =
        selectedBaseId === undefined
          ? undefined
          : candidateById.get(selectedBaseId);
      if (base === undefined) {
        throw new Error('Base selection did not identify an available source');
      }
    }

    if (head === undefined) {
      const selectedHeadId = await prompt({
        message:
          options.recovery?.role === 'head'
            ? `${HEAD_PROMPT}\nBase retained: ${escapeTerminalText(base.label)} · ${base.shortOid ?? 'unavailable'}`
            : HEAD_PROMPT,
        source: sourceForPrompt(
          () => currentCandidates,
          options.searchBranches,
          candidateById,
          options.startCandidateEnrichment,
          {
            role: 'head',
            suggestedHeadId: options.suggestedHeadId,
          },
          options.recovery?.role === 'head' ? options.recovery.searchTerm : '',
        ),
        default:
          options.recovery?.role === 'head'
            ? options.recovery.focusedCandidateId
            : options.suggestedHeadId,
        backValue: BACK_TO_BASE,
      });
      if (selectedHeadId === BACK_TO_BASE) {
        base = undefined;
        continue;
      }
      head =
        selectedHeadId === undefined
          ? undefined
          : candidateById.get(selectedHeadId);
      if (head === undefined) {
        throw new Error('Head selection did not identify an available source');
      }
    }

    if (
      candidateEnrichment !== undefined &&
      (base.kind === 'worktree' || head.kind === 'worktree')
    ) {
      options.startCandidateEnrichment?.();
      await candidateEnrichment;
      base = candidateById.get(base.id);
      head = candidateById.get(head.id);
      if (base === undefined) {
        throw new Error('Base selection did not identify an available source');
      }
      if (head === undefined) {
        throw new Error('Head selection did not identify an available source');
      }
    }
    if (base.kind === 'worktree' && base.availability === 'unavailable') {
      base = undefined;
      continue;
    }
    if (head.kind === 'worktree' && head.availability === 'unavailable') {
      head = undefined;
      continue;
    }
    return Object.freeze({ base, head });
  }
}
