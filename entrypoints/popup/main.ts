import '../../src/styles/extension.css';
import { addDaysInput, dateInputToIso, hostFromUrl, isTrackableUrl, localDateInput } from '../../src/lib/domain';
import { getState, setState, updateBadge } from '../../src/lib/store';
import type { DecisionType, TrackedTab } from '../../src/lib/types';

const form = document.querySelector<HTMLFormElement>('#sunset-form')!;
const preview = document.querySelector<HTMLElement>('#tab-preview')!;
const status = document.querySelector<HTMLElement>('#status')!;
const expiry = document.querySelector<HTMLInputElement>('#expiry')!;
const reason = document.querySelector<HTMLInputElement>('#reason')!;
const save = document.querySelector<HTMLButtonElement>('#save')!;
const unavailable = document.querySelector<HTMLElement>('#unavailable')!;
const dueCount = document.querySelector<HTMLElement>('#due-count')!;
let activeTab: chrome.tabs.Tab | undefined;

function showStatus(message: string, kind: 'success' | 'error' = 'success') {
  status.textContent = message;
  status.dataset.kind = kind;
}

function renderPreview(tab: chrome.tabs.Tab) {
  preview.replaceChildren();
  const domain = document.createElement('span');
  domain.className = 'tab-domain';
  domain.textContent = hostFromUrl(tab.url ?? '');
  const title = document.createElement('strong');
  title.textContent = tab.title || 'Untitled tab';
  preview.append(domain, title);
}

async function initialise() {
  try {
    [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const state = await getState();
    dueCount.textContent = String(state.tracked.filter((item) => new Date(item.expiresAt).getTime() <= Date.now()).length);
    expiry.min = addDaysInput(0);
    expiry.value = addDaysInput(3);

    if (!activeTab || !isTrackableUrl(activeTab.url)) {
      preview.hidden = true;
      form.hidden = true;
      unavailable.hidden = false;
      return;
    }

    renderPreview(activeTab);
    const existing = state.tracked.find((item) => item.tabId === activeTab!.id || item.url === activeTab!.url);
    if (existing) {
      expiry.value = localDateInput(new Date(existing.expiresAt));
      reason.value = existing.reason;
      const radio = form.elements.namedItem('decision') as RadioNodeList;
      radio.value = existing.decision;
      save.textContent = 'Update sunset';
      showStatus('This tab already has a sunset.');
    }
  } catch {
    preview.textContent = 'The active tab could not be read.';
    form.hidden = true;
    showStatus('Reload the extension and try again.', 'error');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!activeTab?.url || !form.reportValidity()) return;
  save.disabled = true;
  save.textContent = 'Setting…';
  try {
    const state = await getState();
    const existing = state.tracked.find((item) => item.tabId === activeTab!.id || item.url === activeTab!.url);
    const now = new Date().toISOString();
    const tracked: TrackedTab = {
      id: existing?.id ?? crypto.randomUUID(),
      tabId: activeTab.id,
      windowId: activeTab.windowId,
      url: activeTab.url,
      title: activeTab.title || activeTab.url,
      favicon: activeTab.favIconUrl,
      reason: reason.value.trim(),
      decision: (new FormData(form).get('decision') ?? 'review') as DecisionType,
      expiresAt: dateInputToIso(expiry.value),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await setState({ ...state, tracked: [...state.tracked.filter((item) => item.id !== tracked.id), tracked] });
    await updateBadge();
    showStatus(`Sunset set for ${new Date(tracked.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.`);
    save.textContent = 'Sunset set';
  } catch {
    showStatus('The sunset was not saved. Try again.', 'error');
    save.textContent = 'Set sunset';
  } finally {
    save.disabled = false;
  }
});

document.querySelector('#open-review')?.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('/review.html') });
});

void initialise();
