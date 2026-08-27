import { addDaysInput, dateInputToIso } from './domain';
import { getState, setState, updateBadge } from './store';
import type { SavedItem, TrackedTab } from './types';

async function closeMatchingTab(item: TrackedTab): Promise<void> {
  let candidate: chrome.tabs.Tab | undefined;
  if (item.tabId) candidate = await chrome.tabs.get(item.tabId).catch(() => undefined);
  if (candidate?.url !== item.url) {
    candidate = (await chrome.tabs.query({})).find((tab) => tab.url === item.url);
  }
  if (candidate?.id) await chrome.tabs.remove(candidate.id);
}

export async function resolveKeep(item: TrackedTab): Promise<void> {
  const state = await getState();
  const saved: SavedItem = {
    id: item.id,
    url: item.url,
    title: item.title,
    reason: item.reason,
    outcome: 'kept',
    savedAt: new Date().toISOString(),
  };
  await setState({ ...state, tracked: state.tracked.filter(({ id }) => id !== item.id), saved: [...state.saved, saved] });
  await updateBadge();
}

export async function resolveBookmark(item: TrackedTab): Promise<void> {
  const state = await getState();
  let folder = (await chrome.bookmarks.search({ title: 'Tab Sunset List' })).find((node) => !node.url);
  if (!folder) folder = await chrome.bookmarks.create({ title: 'Tab Sunset List' });
  await chrome.bookmarks.create({ parentId: folder.id, title: item.title, url: item.url });
  const saved: SavedItem = { id: item.id, url: item.url, title: item.title, reason: item.reason, outcome: 'bookmarked', savedAt: new Date().toISOString() };
  await setState({
    ...state,
    tracked: state.tracked.filter(({ id }) => id !== item.id),
    saved: [...state.saved, saved],
    undo: { item, closedAt: new Date().toISOString(), restoreTracking: false },
  });
  await closeMatchingTab(item).catch(() => undefined);
  await updateBadge();
}

export async function resolveClose(item: TrackedTab): Promise<void> {
  const state = await getState();
  await setState({
    ...state,
    tracked: state.tracked.filter(({ id }) => id !== item.id),
    undo: { item, closedAt: new Date().toISOString(), restoreTracking: true },
  });
  await closeMatchingTab(item).catch(() => undefined);
  await updateBadge();
}

export async function reschedule(item: TrackedTab, days = 7): Promise<void> {
  const state = await getState();
  const expiresAt = dateInputToIso(addDaysInput(days));
  await setState({ ...state, tracked: state.tracked.map((tab) => tab.id === item.id ? { ...tab, expiresAt, updatedAt: new Date().toISOString() } : tab) });
  await updateBadge();
}

export async function undoClose(): Promise<boolean> {
  const state = await getState();
  if (!state.undo) return false;
  const reopened = await chrome.tabs.create({ url: state.undo.item.url, active: false });
  const restored = { ...state.undo.item, tabId: reopened.id, windowId: reopened.windowId, updatedAt: new Date().toISOString() };
  await setState({ ...state, tracked: state.undo.restoreTracking === false ? state.tracked : [...state.tracked, restored], undo: null });
  await updateBadge();
  return true;
}
