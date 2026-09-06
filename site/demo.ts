import './styles.css';

type DemoOutcome = 'Kept open' | 'Bookmarked';

interface DemoTab {
  id: string;
  domain: string;
  title: string;
  reason: string;
  intent: string;
  due: string;
}

interface DemoSaved {
  id: string;
  title: string;
  domain: string;
  reason: string;
  outcome: DemoOutcome;
}

interface DemoState {
  queue: DemoTab[];
  saved: DemoSaved[];
  rescheduled: DemoTab[];
  lastClosed: DemoTab | null;
  index: number;
}

const STORAGE_KEY = 'demo:tab-sunset-list:v1';
const SAMPLE: DemoState = {
  queue: [
    { id: 'release-guide', domain: 'developer.chrome.com', title: 'Service worker lifecycle guide', reason: 'Check the update notes before Friday’s release.', intent: 'Decide whether this belongs in the team reference list.', due: 'Due today' },
    { id: 'train-options', domain: 'nationalrail.co.uk', title: 'Train options for the client workshop', reason: 'Book the flexible return after the agenda arrives.', intent: 'Move the date if the agenda is still missing.', due: 'Due today' },
    { id: 'css-anchor', domain: 'developer.mozilla.org', title: 'CSS anchor positioning guide', reason: 'Use this only if the settings panel still needs a callout.', intent: 'Keep the guide if it supports the current prototype.', due: 'Due yesterday' },
    { id: 'research-paper', domain: 'arxiv.org', title: 'Study on interruptions and task switching', reason: 'Pull one useful finding into the planning note.', intent: 'Bookmark the paper after extracting the useful point.', due: 'Due two days ago' },
    { id: 'monitor-arm', domain: 'ergonomics.example', title: 'Two monitor arms compared', reason: 'Decide before the equipment budget closes.', intent: 'Close this page after choosing a model.', due: 'Due three days ago' },
  ],
  saved: [
    { id: 'keyboard-reference', domain: 'support.google.com', title: 'Chrome keyboard shortcut reference', reason: 'Share the tab-search shortcut with the team.', outcome: 'Kept open' },
  ],
  rescheduled: [],
  lastClosed: null,
  index: 0,
};

const count = document.querySelector<HTMLElement>('#demo-count')!;
const item = document.querySelector<HTMLElement>('#sample-item')!;
const empty = document.querySelector<HTMLElement>('#sample-empty')!;
const title = document.querySelector<HTMLElement>('#sample-title')!;
const domain = document.querySelector<HTMLElement>('#sample-domain')!;
const date = document.querySelector<HTMLElement>('#sample-date')!;
const reason = document.querySelector<HTMLElement>('#sample-reason')!;
const intent = document.querySelector<HTMLElement>('#sample-intent')!;
const position = document.querySelector<HTMLElement>('#sample-position')!;
const previous = document.querySelector<HTMLButtonElement>('#sample-previous')!;
const next = document.querySelector<HTMLButtonElement>('#sample-next')!;
const savedList = document.querySelector<HTMLUListElement>('#sample-saved')!;
const summary = document.querySelector<HTMLElement>('#sample-summary')!;
const announcement = document.querySelector<HTMLElement>('#demo-announcement')!;
const undo = document.querySelector<HTMLElement>('#sample-undo')!;

function cloneSample(): DemoState {
  return JSON.parse(JSON.stringify(SAMPLE)) as DemoState;
}

function writeState(next: DemoState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function readState(): DemoState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as DemoState;
  } catch {
    announcement.textContent = 'The sample could not be read. Reset the demo to try again.';
  }
  const fresh = cloneSample();
  writeState(fresh);
  return fresh;
}

let state = readState();

function renderSaved() {
  savedList.replaceChildren();
  for (const saved of state.saved) {
    const row = document.createElement('li');
    const content = document.createElement('div');
    const name = document.createElement('strong');
    const note = document.createElement('span');
    const outcome = document.createElement('span');
    name.textContent = saved.title;
    note.textContent = `${saved.domain} · ${saved.reason}`;
    outcome.textContent = saved.outcome;
    content.append(name, note);
    row.append(content, outcome);
    savedList.append(row);
  }
  summary.textContent = `${state.saved.length} saved ${state.saved.length === 1 ? 'item' : 'items'}. ${state.rescheduled.length || 'No'} sample ${state.rescheduled.length === 1 ? 'tab' : 'tabs'} rescheduled.`;
}

function render(options: { focus?: boolean; message?: string } = {}) {
  state.index = Math.max(0, Math.min(state.index, Math.max(state.queue.length - 1, 0)));
  count.textContent = String(state.queue.length);
  undo.hidden = state.lastClosed === null;
  if (!state.queue.length) {
    item.hidden = true;
    empty.hidden = false;
    if (options.focus) empty.querySelector<HTMLElement>('h2')?.focus();
  } else {
    item.hidden = false;
    empty.hidden = true;
    const current = state.queue[state.index];
    domain.textContent = current.domain;
    date.textContent = current.due;
    title.textContent = current.title;
    reason.textContent = current.reason;
    intent.textContent = current.intent;
    position.textContent = `${state.index + 1} of ${state.queue.length}`;
    previous.disabled = state.index === 0;
    next.disabled = state.index === state.queue.length - 1;
    if (options.focus) title.focus();
  }
  renderSaved();
  writeState(state);
  if (options.message) announcement.textContent = options.message;
}

function decide(action: string) {
  const current = state.queue[state.index];
  if (!current) return;
  let result = '';
  if (action === 'keep') {
    state.saved.push({ ...current, outcome: 'Kept open' });
    result = `Kept ${current.title} open.`;
  }
  if (action === 'schedule') {
    state.rescheduled.push({ ...current, due: 'Due in seven days' });
    result = `Moved ${current.title} by seven days.`;
  }
  if (action === 'bookmark') {
    state.saved.push({ ...current, outcome: 'Bookmarked' });
    state.lastClosed = current;
    result = `Bookmarked and closed ${current.title} in the sample.`;
  }
  if (action === 'close') {
    state.lastClosed = current;
    result = `Closed ${current.title} in the sample.`;
  }
  state.queue.splice(state.index, 1);
  state.index = Math.min(state.index, Math.max(state.queue.length - 1, 0));
  render({ focus: true, message: `${result} ${state.queue.length} sample tabs remain.` });
}

document.querySelectorAll<HTMLButtonElement>('[data-sample-action]').forEach((button) => {
  button.addEventListener('click', () => decide(button.dataset.sampleAction ?? ''));
});

previous.addEventListener('click', () => {
  state.index -= 1;
  render({ message: `Showing sample tab ${state.index + 1} of ${state.queue.length}.` });
});

next.addEventListener('click', () => {
  state.index += 1;
  render({ message: `Showing sample tab ${state.index + 1} of ${state.queue.length}.` });
});

document.querySelector('#sample-undo-button')?.addEventListener('click', () => {
  if (!state.lastClosed) return;
  const restored = state.lastClosed;
  state.queue.splice(state.index, 0, restored);
  state.lastClosed = null;
  render({ focus: true, message: `Restored ${restored.title} to the sample queue.` });
});

document.querySelector('#reset-demo')?.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  state = cloneSample();
  render({ focus: true, message: 'Demo reset. Five sample tabs are ready.' });
});

document.querySelector('#start-real')?.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
});

document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const actions: Record<string, string> = { k: 'keep', s: 'schedule', b: 'bookmark', c: 'close' };
  const action = actions[event.key.toLowerCase()];
  if (action) {
    event.preventDefault();
    decide(action);
  }
  if (event.key === 'ArrowLeft' && state.index > 0) {
    event.preventDefault();
    state.index -= 1;
    render({ message: `Showing sample tab ${state.index + 1} of ${state.queue.length}.` });
  }
  if (event.key === 'ArrowRight' && state.index < state.queue.length - 1) {
    event.preventDefault();
    state.index += 1;
    render({ message: `Showing sample tab ${state.index + 1} of ${state.queue.length}.` });
  }
});

function updateConnectivity() {
  const connectivity = document.querySelector<HTMLElement>('#connectivity');
  if (connectivity) connectivity.textContent = navigator.onLine
    ? 'Site files are available offline after one visit.'
    : 'Offline. This page is still available.';
}

window.addEventListener('online', updateConnectivity);
window.addEventListener('offline', updateConnectivity);
updateConnectivity();
render();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
