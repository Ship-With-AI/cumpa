import { shallowRef, type ShallowRef } from 'vue';

import type { SelectorDriftResponse } from '../../contracts/api.js';

export const SELECTOR_DRIFT_POLL_INTERVAL_MS = 30_000;

export interface SelectorDriftClient {
  getSelectorDrift(): Promise<SelectorDriftResponse>;
}

export type SelectorDriftInterval = number;

export interface SelectorDriftDocument {
  readonly visibilityState: DocumentVisibilityState;
  addEventListener(type: 'visibilitychange', listener: EventListener): void;
  removeEventListener(type: 'visibilitychange', listener: EventListener): void;
}

export interface SelectorDriftStateOptions {
  readonly document?: SelectorDriftDocument;
  readonly setInterval?: (callback: () => void, delay: number) => SelectorDriftInterval;
  readonly clearInterval?: (interval: SelectorDriftInterval) => void;
  readonly status?: ShallowRef<SelectorDriftResponse | undefined>;
}

export interface SelectorDriftState {
  readonly status: ShallowRef<SelectorDriftResponse | undefined>;
  refresh(): Promise<void>;
  start(): void;
  stop(): void;
}

function transitionKey(drift: SelectorDriftResponse | undefined): string {
  if (drift === undefined) {
    return '';
  }
  return [drift.base, drift.head]
    .filter((status) => status.kind !== 'unchanged')
    .map((status) => status.kind === 'moved'
      ? `${status.role}:moved:${status.oldOid}:${status.newOid}`
      : `${status.role}:unavailable:${status.oldOid}:${status.reason}`)
    .join('|');
}

export function createSelectorDriftState(
  client: SelectorDriftClient,
  announce: (message: string) => void,
  options: SelectorDriftStateOptions = {},
): SelectorDriftState {
  const visibility = options.document ?? document;
  const schedule = options.setInterval ?? ((callback, delay) => window.setInterval(callback, delay));
  const cancel = options.clearInterval ?? ((interval) => window.clearInterval(interval));
  const status = options.status ?? shallowRef<SelectorDriftResponse>();
  let interval: SelectorDriftInterval | undefined;
  let activeRequest: Promise<void> | undefined;
  let queued = false;
  let started = false;

  const isVisible = () => visibility.visibilityState === 'visible';

  const refresh = (): Promise<void> => {
    if (!started || !isVisible()) {
      return Promise.resolve();
    }
    if (activeRequest !== undefined) {
      queued = true;
      return activeRequest;
    }

    activeRequest = client.getSelectorDrift()
      .then((next) => {
        const previousKey = transitionKey(status.value);
        const nextKey = transitionKey(next);
        status.value = next;
        if (nextKey !== '' && nextKey !== previousKey) {
          announce('Selected source changed. The open review remains pinned.');
        }
      })
      .catch(() => undefined)
      .finally(() => {
        activeRequest = undefined;
        if (queued && started && isVisible()) {
          queued = false;
          void refresh();
          return;
        }
        queued = false;
      });
    return activeRequest;
  };

  const refreshWhenVisible = () => {
    if (isVisible()) {
      void refresh();
    }
  };

  return Object.freeze({
    status,
    refresh,
    start() {
      if (started) {
        return;
      }
      started = true;
      visibility.addEventListener('visibilitychange', refreshWhenVisible);
      interval = schedule(refreshWhenVisible, SELECTOR_DRIFT_POLL_INTERVAL_MS);
      void refresh();
    },
    stop() {
      if (!started) {
        return;
      }
      started = false;
      queued = false;
      visibility.removeEventListener('visibilitychange', refreshWhenVisible);
      if (interval !== undefined) {
        cancel(interval);
        interval = undefined;
      }
    },
  });
}
