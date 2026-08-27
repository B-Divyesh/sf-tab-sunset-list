import { DEFAULT_STATE, type StoreState } from './types';

const KEY = 'tabSunsetState';

export async function getState(): Promise<StoreState> {
  const result = await chrome.storage.local.get(KEY);
  const stored = result[KEY] as Partial<StoreState> | undefined;
  return {
    tracked: Array.isArray(stored?.tracked) ? stored.tracked : [],
    saved: Array.isArray(stored?.saved) ? stored.saved : [],
    undo: stored?.undo ?? null,
    dailyLimit: typeof stored?.dailyLimit === 'number' ? stored.dailyLimit : DEFAULT_STATE.dailyLimit,
  };
}

export async function setState(state: StoreState): Promise<void> {
  await chrome.storage.local.set({ [KEY]: state });
}

export async function updateState(update: (state: StoreState) => StoreState): Promise<StoreState> {
  const current = await getState();
  const next = update(current);
  await setState(next);
  return next;
}

export async function updateBadge(): Promise<void> {
  const { tracked } = await getState();
  const count = tracked.filter((item) => new Date(item.expiresAt).getTime() <= Date.now()).length;
  await chrome.action.setBadgeBackgroundColor({ color: '#C6402D' });
  await chrome.action.setBadgeText({ text: count ? String(Math.min(count, 99)) : '' });
}
