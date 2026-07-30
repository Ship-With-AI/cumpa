import { describe, expect, it } from 'vitest';

import { Separator } from '@inquirer/search';
import { confirmPinnedComparison } from '../../src/cli/confirm.js';
import {
  buildSourceSearchItems,
  escapeTerminalText,
  pickOrderedSources,
} from '../../src/cli/picker.js';
import type {
  SourceSearchPrompt,
  SourceSearchPromptConfig,
} from '../../src/cli/picker.js';
import { runCli, type RunCliDependencies } from '../../src/cli/run.js';
import type { PinnedComparison } from '../../src/contracts/comparison.js';
import type { SourceCandidate } from '../../src/domain/source.js';

const baseOid = '1'.repeat(40);
const headOid = '2'.repeat(40);
const mergeBaseOid = '3'.repeat(40);

const candidates = [
  {
    kind: 'branch',
    id: 'branch:refs/heads/main',
    label: 'main',
    refName: 'refs/heads/main',
    commitOid: baseOid,
    shortOid: '111111111111',
  },
  {
    kind: 'branch',
    id: 'branch:refs/heads/feature',
    label: 'feature',
    refName: 'refs/heads/feature',
    commitOid: headOid,
    shortOid: '222222222222',
  },
  {
    kind: 'worktree',
    id: 'worktree:/repo',
    label: 'feature',
    path: '/repo',
    branchRef: 'refs/heads/feature',
    detached: false,
    commitOid: headOid,
    shortOid: '222222222222',
    availability: 'dirty',
    isCurrentCheckout: true,
  },
  {
    kind: 'worktree',
    id: 'worktree:/repo/detached',
    label: 'Detached HEAD',
    path: '/repo/detached',
    detached: true,
    commitOid: headOid,
    shortOid: '222222222222',
    availability: 'clean',
    isCurrentCheckout: false,
  },
  {
    kind: 'worktree',
    id: 'worktree:/repo/gone',
    label: 'gone',
    path: '/repo/gone',
    branchRef: 'refs/heads/gone',
    detached: false,
    commitOid: baseOid,
    shortOid: '111111111111',
    availability: 'unavailable',
    unavailableReason:
      'Unavailable — this registered worktree cannot be resolved. Choose another entry or repair it with Git.',
    isCurrentCheckout: false,
  },
] as const;

const comparison: PinnedComparison = {
  repositoryRoot: '/repo',
  objectFormat: 'sha1',
  base: {
    label: 'main',
    oid: baseOid,
    source: {
      kind: 'branch',
      id: 'branch:refs/heads/main',
      refName: 'refs/heads/main',
    },
  },
  head: {
    label: 'feature',
    oid: headOid,
    source: {
      kind: 'worktree',
      id: 'worktree:/repo',
      path: '/repo',
      detached: false,
      dirty: true,
    },
  },
  mergeBaseOid,
  changedFiles: [],
  hasCommittedChanges: true,
};

describe('ordered searchable source picker', () => {
  it('escapes C1 terminal controls', () => {
    expect(escapeTerminalText('\u009B')).toBe('\\x9B');
  });

  it('groups branch and worktree rows while searching every identifying field', () => {
    const unfiltered = buildSourceSearchItems(candidates, '', {
      role: 'head',
      suggestedHeadId: 'worktree:/repo',
    });

    expect(unfiltered[0]).toMatchObject({
      kind: 'separator',
      label: 'Local branches',
    });
    expect(unfiltered.findIndex((item) =>
      item.kind === 'separator' && item.label === 'Worktrees',
    )).toBeGreaterThan(0);
    expect(unfiltered.filter((item) => item.kind === 'candidate')).toHaveLength(
      candidates.length,
    );
    expect(unfiltered.find((item) =>
      item.kind === 'candidate' && item.value === 'worktree:/repo',
    )).toMatchObject({
      disabled: undefined,
      name: expect.stringContaining('Dirty — committed HEAD only'),
    });
    expect(unfiltered.find((item) =>
      item.kind === 'candidate' && item.value === 'worktree:/repo',
    )).toMatchObject({
      name: expect.stringContaining('Suggested: current checkout'),
    });
    expect(unfiltered.find((item) =>
      item.kind === 'candidate' && item.value === 'worktree:/repo/gone',
    )).toMatchObject({
      disabled:
        'Unavailable — this registered worktree cannot be resolved. Choose another entry or repair it with Git.',
    });

    const queries = [
      ['branch', 'branch:refs/heads/main'],
      ['feature', 'branch:refs/heads/feature'],
      ['222222222222', 'worktree:/repo'],
      ['/repo/detached', 'worktree:/repo/detached'],
      ['detached', 'worktree:/repo/detached'],
      ['dirty', 'worktree:/repo'],
      ['clean', 'worktree:/repo/detached'],
      ['unavailable', 'worktree:/repo/gone'],
    ] as const;

    for (const [query, expectedId] of queries) {
      expect(
        buildSourceSearchItems(candidates, query, { role: 'head' }).some(
          (item) => item.kind === 'candidate' && item.value === expectedId,
        ),
      ).toBe(true);
    }
  });

  it('keeps both group separators, focused query recovery copy, and no selectable placeholder when nothing matches', () => {
    const noMatches = buildSourceSearchItems(candidates, 'does-not-exist', {
      role: 'base',
    });

    expect(noMatches).toEqual([
      { kind: 'separator', label: 'Local branches' },
      { kind: 'separator', label: 'Worktrees' },
      {
        kind: 'separator',
        label: 'No branches or worktrees match this search.',
      },
    ]);
    expect(noMatches.some((item) => item.kind === 'candidate')).toBe(false);

    const afterEscape = buildSourceSearchItems(candidates, '', { role: 'base' });
    expect(afterEscape.filter((item) => item.kind === 'candidate')).toHaveLength(
      candidates.length,
    );
    expect(afterEscape.some((item) =>
      item.kind === 'candidate' && item.name.includes('Suggested:'),
    )).toBe(false);
  });

  it('requires base first, suggests only the current checkout for head, and supports returning from head to base', async () => {
    const seen: SourceSearchPromptConfig[] = [];
    const answers = [
      'branch:refs/heads/main',
      'back',
      'branch:refs/heads/feature',
      'worktree:/repo',
    ];
    const prompt: SourceSearchPrompt = async (config) => {
      seen.push(config);
      const answer = answers.shift();
      if (answer === 'back') {
        return config.backValue;
      }
      if (answer === undefined) {
        throw new Error('Test prompt exhausted its answers');
      }
      return answer;
    };

    const selected = await pickOrderedSources(
      {
        candidates,
        searchBranches: async () => [],
        suggestedHeadId: 'worktree:/repo',
      },
      { prompt },
    );

    expect(seen.map((config) => config.message)).toEqual([
      'Choose base — changes will be compared from its merge base with head',
      'Choose head — this committed state will be reviewed',
      'Choose base — changes will be compared from its merge base with head',
      'Choose head — this committed state will be reviewed',
    ]);
    expect(seen[0]?.default).toBeUndefined();
    expect(seen[1]?.default).toBe('worktree:/repo');
    expect(seen[2]?.default).toBeUndefined();
    expect(seen[3]?.default).toBe('worktree:/repo');
    expect(selected.base.id).toBe('branch:refs/heads/feature');
    expect(selected.head.id).toBe('worktree:/repo');
  });
});

describe('staged source discovery', () => {
  const eagerCandidates = [candidates[1], candidates[2], candidates[3]] as const;
  const alphaCandidate = {
    kind: 'branch',
    id: 'branch:refs/heads/alpha',
    label: 'alpha',
    refName: 'refs/heads/alpha',
    commitOid: baseOid,
    shortOid: '111111111111',
  } as const satisfies SourceCandidate;
  const zuluCandidate = {
    kind: 'branch',
    id: 'branch:refs/heads/zulu',
    label: 'zulu',
    refName: 'refs/heads/zulu',
    commitOid: headOid,
    shortOid: '222222222222',
  } as const satisfies SourceCandidate;

  it('installs Base and Head from eager rows before deferred branch discovery starts', async () => {
    let searchStarted = false;
    const sourceCalls: SourceSearchPromptConfig[] = [];
    const answers = ['branch:refs/heads/feature', 'worktree:/repo'];

    const selected = await pickOrderedSources(
      {
        candidates: eagerCandidates,
        searchBranches: async () => {
          searchStarted = true;
          return [alphaCandidate];
        },
      } as never,
      {
        prompt: async (config) => {
          sourceCalls.push(config);
          const items = await config.source(undefined, {
            signal: new AbortController().signal,
          });
          expect(
            items
              .filter(
                (item) =>
                  !(item instanceof Separator) &&
                  (item.value.startsWith('branch:') ||
                    item.value.startsWith('worktree:')),
              )
              .map((item) => item.value),
          ).toEqual([
            'branch:refs/heads/feature',
            'worktree:/repo',
            'worktree:/repo/detached',
          ]);
          expect(searchStarted).toBe(false);
          return answers.shift();
        },
      },
    );

    expect(selected).toEqual({
      base: candidates[1],
      head: candidates[2],
    });
    expect(sourceCalls).toHaveLength(2);
    expect(searchStarted).toBe(false);
  });

  it('installs completed lazy branches by exact ID for either ordered role', async () => {
    const answers = ['branch:refs/heads/alpha', 'branch:refs/heads/zulu'];
    const receivedSignals: AbortSignal[] = [];

    const selected = await pickOrderedSources(
      {
        candidates: eagerCandidates,
        searchBranches: async (_term, signal) => {
          receivedSignals.push(signal!);
          return [alphaCandidate, zuluCandidate];
        },
      } as never,
      {
        prompt: async (config) => {
          const controller = new AbortController();
          const items = await config.source('a branch', {
            signal: controller.signal,
          });
          expect(items.some((item) => !(item instanceof Separator) && item.value === alphaCandidate.id)).toBe(true);
          expect(items.some((item) => !(item instanceof Separator) && item.value === zuluCandidate.id)).toBe(true);
          expect(receivedSignals).toContain(controller.signal);
          return answers.shift();
        },
      },
    );

    expect(selected).toEqual({ base: alphaCandidate, head: zuluCandidate });
  });

  it('merges lazy branches in search order with eager duplicates in place before porcelain worktrees', async () => {
    let source: SourceSearchPromptConfig['source'] | undefined;
    let promptCalls = 0;
    await expect(
      pickOrderedSources(
        {
          candidates: eagerCandidates,
          searchBranches: async () => [alphaCandidate, candidates[1], zuluCandidate],
        } as never,
        {
          prompt: async (config) => {
            source = config.source;
            await config.source('branch', {
              signal: new AbortController().signal,
            });
            promptCalls += 1;
            return promptCalls === 1 ? alphaCandidate.id : 'missing';
          },
        },
      ),
    ).rejects.toThrow('Head selection did not identify an available source');

    const items = await source?.('branch', {
      signal: new AbortController().signal,
    });
    expect(
      items
        ?.filter(
          (item) =>
            !(item instanceof Separator) &&
            (item.value.startsWith('branch:') ||
              item.value.startsWith('worktree:')),
        )
        .map((item) => item.value),
    ).toEqual([
      alphaCandidate.id,
      candidates[1].id,
      zuluCandidate.id,
      candidates[2].id,
      candidates[3].id,
    ]);
  });

  it('rejects aborted lookup results before they can install stale exact IDs', async () => {
    const oldLookup = Promise.withResolvers<readonly SourceCandidate[]>();
    const newLookup = Promise.withResolvers<readonly SourceCandidate[]>();
    let calls = 0;
    const answers = [zuluCandidate.id, alphaCandidate.id];

    await expect(
      pickOrderedSources(
        {
          candidates: eagerCandidates,
          searchBranches: async () => {
            calls += 1;
            return calls === 1 ? oldLookup.promise : newLookup.promise;
          },
        } as never,
        {
          prompt: async (config) => {
            if (calls === 0) {
              const obsolete = new AbortController();
              const current = new AbortController();
              const stale = config.source('old', { signal: obsolete.signal });
              obsolete.abort();
              const fresh = config.source('new', { signal: current.signal });
              newLookup.resolve([zuluCandidate]);
              expect(await fresh).toEqual(expect.any(Array));
              oldLookup.resolve([alphaCandidate]);
              await expect(stale).rejects.toThrow();
            }
            return answers.shift();
          },
        },
      ),
    ).rejects.toThrow('Head selection did not identify an available source');
  });

  it('passes only eager candidates into runCli before deferred discovery starts', async () => {
    const events: string[] = [];
    await runCli(
      { cwd: '/repo' },
      {
        discoverCandidates: (async () => ({
          initialCandidates: eagerCandidates,
          searchBranches: async () => {
            events.push('search');
            return [alphaCandidate];
          },
        })) as never,
        pickSources: async (options) => {
          events.push('pick');
          expect(options.candidates).toEqual(eagerCandidates);
          return { base: eagerCandidates[0], head: eagerCandidates[1] };
        },
        createDescriptor: async () => comparison,
        confirmComparison: async () => 'launch',
        launchComparison: async () => {
          events.push('launch');
        },
      } as RunCliDependencies,
    );

    expect(events).toEqual(['pick', 'launch']);
  });
});

describe('pinned comparison confirmation and CLI integration', () => {
  it('renders ordered full identities, selected worktree paths, dirty warning, pin statement, and launch/back labels', async () => {
    const output: string[] = [];
    let promptConfig:
      | {
          readonly message: string;
          readonly choices: readonly {
            readonly name: string;
            readonly value: 'back' | 'launch';
          }[];
        }
      | undefined;

    const result = await confirmPinnedComparison(comparison, {
      output: (message) => output.push(message),
      prompt: async (config) => {
        promptConfig = config;
        return 'back';
      },
    });

    expect(output).toEqual([
      'Confirm pinned comparison',
      `Base: main\n${baseOid}`,
      `Head: feature\n${headOid}`,
      `Merge base:\n${mergeBaseOid}`,
      'Head worktree: /repo',
      "Dirty — committed HEAD only\nThe worktree's committed HEAD will be reviewed. Staged, unstaged, and untracked bytes are ignored.",
      'This session is pinned to the commits shown below and does not follow moving refs.',
    ]);
    expect(promptConfig).toEqual({
      message: 'Launch this pinned comparison?',
      choices: [
        { name: 'Launch pinned comparison', value: 'launch' },
        { name: 'Back', value: 'back' },
      ],
    });
    expect(result).toBe('back');
  });

  it('feeds ordered candidate authority into frozen comparison creation and launches only after confirmation', async () => {
    const events: string[] = [];
    let selectionOptions:
      | {
          readonly base: { readonly label: string; readonly revision: string };
          readonly head: { readonly label: string; readonly revision: string };
        }
      | undefined;

    await runCli(
      { cwd: '/repo' },
      {
        discoverCandidates: async () => {
          events.push('discover');
          return {
            initialCandidates: [...candidates],
            searchBranches: async () => [],
          };
        },
        pickSources: async () => {
          events.push('pick-base-head');
          return { base: candidates[0], head: candidates[2] };
        },
        createDescriptor: async (options) => {
          events.push('pin-comparison');
          selectionOptions = options;
          return comparison;
        },
        confirmComparison: async () => {
          events.push('confirm');
          return 'launch';
        },
        launchComparison: async (pinned) => {
          expect(pinned).toBe(comparison);
          events.push('launch');
        },
      },
    );

    expect(events).toEqual([
      'discover',
      'pick-base-head',
      'pin-comparison',
      'confirm',
      'launch',
    ]);
    expect(selectionOptions).toMatchObject({
      base: {
        label: 'main',
        revision: 'refs/heads/main',
      },
      head: {
        label: 'feature',
        revision: headOid,
      },
    });
  });
});
