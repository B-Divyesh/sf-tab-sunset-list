import '../../src/styles/extension.css';
import { markdownForSaved, hostFromUrl } from '../../src/lib/domain';
import { resolveBookmark, resolveClose, resolveKeep, reschedule, undoClose } from '../../src/lib/actions';
import { dueTabs } from '../../src/lib/domain';
import { getState } from '../../src/lib/store';
import type { SavedItem, TrackedTab } from '../../src/lib/types';

const loading = document.querySelector<HTMLElement>('#loading')!;
const itemPanel = document.querySelector<HTMLElement>('#item')!;
const empty = document.querySelector<HTMLElement>('#empty')!;
const errorPanel = document.querySelector<HTMLElement>('#error')!;
const summary = document.querySelector<HTMLElement>('#queue-summary')!;
const sunCount = document.querySelector<HTMLElement>('#sun-count')!;
const title = document.querySelector<HTMLElement>('#item-title')!;
const domain = document.querySelector<HTMLElement>('#item-domain')!;
const date = document.querySelector<HTMLElement>('#item-date')!;
const reason = document.querySelector<HTMLElement>('#item-reason')!;
const position = document.querySelector<HTMLElement>('#position')!;
const previous = document.querySelector<HTMLButtonElement>('#previous')!;
const next = document.querySelector<HTMLButtonElement>('#next')!;
const undo = document.querySelector<HTMLElement>('#undo')!;
const savedList = document.querySelector<HTMLUListElement>('#saved-list')!;
const exportButton = document.querySelector<HTMLButtonElement>('#export')!;
const exportStatus = document.querySelector<HTMLElement>('#export-status')!;
let queue: TrackedTab[] = [];
let saved: SavedItem[] = [];
let index = 0;
let busy = false;

function setVisible(element: HTMLElement, visible: boolean) {
  element.hidden = !visible;
}

function renderSaved() {
  savedList.replaceChildren();
  exportButton.disabled = saved.length === 0;
  const visible = [...saved].sort((a, b) => b.savedAt.localeCompare(a.savedAt)).slice(0, 5);
  if (!visible.length) {
    const li = document.createElement('li');
    li.className = 'saved-empty';
    li.textContent = 'Your kept and bookmarked decisions will appear here.';
    savedList.append(li);
    return;
  }
  for (const savedItem of visible) {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = savedItem.url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = savedItem.title;
    const meta = document.createElement('span');
    meta.textContent = `${savedItem.outcome} · ${new Date(savedItem.savedAt).toLocaleDateString()}`;
    li.append(link, meta);
    savedList.append(li);
  }
}

function renderQueue() {
  setVisible(loading, false);
  setVisible(errorPanel, false);
  sunCount.textContent = String(queue.length);
  summary.textContent = queue.length
    ? `${queue.length} ${queue.length === 1 ? 'tab needs' : 'tabs need'} a decision in this small daily queue.`
    : 'Nothing due. Your future sunsets are still stored locally.';

  if (!queue.length) {
    setVisible(itemPanel, false);
    setVisible(empty, true);
    return;
  }
  setVisible(empty, false);
  setVisible(itemPanel, true);
  index = Math.max(0, Math.min(index, queue.length - 1));
  const current = queue[index];
  domain.textContent = hostFromUrl(current.url);
  date.textContent = `Due ${new Date(current.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  title.textContent = current.title;
  reason.textContent = current.reason || `You marked this tab to ${current.decision === 'close' ? 'close if unused' : current.decision}.`;
  position.textContent = `${index + 1} of ${queue.length}`;
  previous.disabled = index === 0;
  next.disabled = index === queue.length - 1;
  title.focus?.();
}

async function load() {
  setVisible(loading, true);
  setVisible(itemPanel, false);
  setVisible(empty, false);
  setVisible(errorPanel, false);
  try {
    const state = await getState();
    const allDue = dueTabs(state.tracked);
    queue = allDue.slice(0, state.dailyLimit);
    saved = state.saved;
    index = Math.min(index, Math.max(queue.length - 1, 0));
    renderQueue();
    renderSaved();
    if (state.undo && Date.now() - new Date(state.undo.closedAt).getTime() < 30_000) setVisible(undo, true);
  } catch {
    setVisible(loading, false);
    setVisible(errorPanel, true);
    summary.textContent = 'The local queue is temporarily unavailable.';
    sunCount.textContent = '!';
  }
}

async function act(action: string) {
  if (busy || !queue[index]) return;
  busy = true;
  const current = queue[index];
  document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => button.disabled = true);
  try {
    if (action === 'keep') await resolveKeep(current);
    if (action === 'schedule') await reschedule(current);
    if (action === 'bookmark') await resolveBookmark(current);
    if (action === 'close') await resolveClose(current);
    if (action === 'bookmark' || action === 'close') setVisible(undo, true);
    queue.splice(index, 1);
    index = Math.min(index, Math.max(queue.length - 1, 0));
    const state = await getState();
    saved = state.saved;
    renderQueue();
    renderSaved();
  } catch {
    summary.textContent = 'That decision was not completed. Your tab is still in the queue; try again.';
  } finally {
    busy = false;
    document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => button.disabled = false);
  }
}

document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
  button.addEventListener('click', () => void act(button.dataset.action ?? ''));
});
previous.addEventListener('click', () => { index -= 1; renderQueue(); });
next.addEventListener('click', () => { index += 1; renderQueue(); });
document.querySelector('#retry')?.addEventListener('click', () => void load());
document.querySelector('#undo-button')?.addEventListener('click', async () => {
  try {
    if (await undoClose()) {
      setVisible(undo, false);
      await load();
    }
  } catch {
    summary.textContent = 'The tab could not be reopened. Its URL remains in your browser history.';
  }
});

exportButton.addEventListener('click', () => {
  const markdown = markdownForSaved(saved);
  const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `tab-sunset-list-${new Date().toISOString().slice(0, 10)}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
  exportStatus.textContent = `Exported ${saved.length} saved ${saved.length === 1 ? 'item' : 'items'} as Markdown.`;
});

document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target instanceof HTMLInputElement) return;
  const key = event.key.toLowerCase();
  const action: Record<string, string> = { k: 'keep', s: 'schedule', b: 'bookmark', c: 'close' };
  if (action[key]) { event.preventDefault(); void act(action[key]); }
  if (event.key === 'ArrowLeft' && index > 0) { index -= 1; renderQueue(); }
  if (event.key === 'ArrowRight' && index < queue.length - 1) { index += 1; renderQueue(); }
});

void load();
