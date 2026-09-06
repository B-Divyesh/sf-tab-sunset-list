import { expect, test, chromium, type BrowserContext, type Page } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import axe from 'axe-core';

interface SeedItem {
  id: string;
  tabId?: number;
  windowId?: number;
  url: string;
  title: string;
  reason: string;
  decision: 'review' | 'read' | 'close';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

let context: BrowserContext;
let extensionId: string;
let userDataDir: string;

const savedExample = {
  id: 'saved-reference',
  url: 'https://saved.test/reference',
  title: 'Saved reference',
  reason: 'Use in the release checklist',
  outcome: 'kept',
  savedAt: '2026-09-06T09:00:00.000Z',
};

function dueItem(id: string, overrides: Partial<SeedItem> = {}): SeedItem {
  return {
    id,
    url: `https://sample.test/${id}`,
    title: `Sample tab ${id}`,
    reason: `Reason for ${id}`,
    decision: 'review',
    expiresAt: '2020-01-01T00:00:00.000Z',
    createdAt: `2020-01-01T00:00:0${id.length % 10}.000Z`,
    updatedAt: '2020-01-01T00:00:00.000Z',
    ...overrides,
  };
}

async function openReview() {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/review.html`);
  return page;
}

async function seed(page: Page, tracked: SeedItem[], saved: Array<typeof savedExample> = []) {
  await page.evaluate(async ({ trackedItems, savedItems }) => {
    await chrome.storage.local.set({
      tabSunsetState: { tracked: trackedItems, saved: savedItems, undo: null, dailyLimit: 7 },
    });
  }, { trackedItems: tracked, savedItems: saved });
  await page.reload();
}

async function openSampleTab(path: string, title: string) {
  const url = `https://sample.test/${path}?title=${encodeURIComponent(title)}`;
  const page = await context.newPage();
  await page.goto(url);
  const tab = await (await openReview()).evaluate(async (sampleUrl) => {
    const tabs = await chrome.tabs.query({ url: sampleUrl });
    return { id: tabs[0]?.id, windowId: tabs[0]?.windowId };
  }, url);
  await context.pages().at(-1)?.close();
  return { page, url, ...tab };
}

async function openPopupForActive(activePage: Page) {
  const popup = await context.newPage();
  await activePage.bringToFront();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  return popup;
}

async function seriousAccessibilityViolations(page: Page) {
  await page.evaluate(axe.source);
  const results = await page.evaluate(async () => {
    const axeApi = (window as typeof window & { axe: { run: () => Promise<{ violations: Array<{ impact: string | null; id: string }> }> } }).axe;
    return axeApi.run();
  });
  return results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
}

test.beforeAll(async () => {
  userDataDir = await mkdtemp(join(tmpdir(), 'tab-sunset-test-'));
  const extensionPath = resolve('.output/chrome-mv3');
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  await context.route('https://sample.test/**', async (route) => {
    const title = new URL(route.request().url()).searchParams.get('title') || 'Sample browser tab';
    await route.fulfill({ status: 200, contentType: 'text/html', body: `<!doctype html><html lang="en"><title>${title}</title><body><main><h1>${title}</h1></main></body></html>` });
  });
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent('serviceworker');
  extensionId = new URL(worker.url()).host;
});

test.beforeEach(async () => {
  await Promise.all(context.pages().map((page) => page.close()));
  const review = await openReview();
  await review.evaluate(async () => {
    await chrome.storage.local.clear();
    const folders = await chrome.bookmarks.search({ title: 'Tab Sunset List' });
    await Promise.all(folders.filter((node) => !node.url).map((node) => chrome.bookmarks.removeTree(node.id)));
  });
  await review.close();
});

test.afterAll(async () => {
  await context.close();
  await rm(userDataDir, { recursive: true, force: true });
});

test('@claim:chromium-load loads the packaged extension in a fresh Chromium profile', async () => {
  const review = await openReview();
  await expect(review).toHaveTitle('Today’s review — Tab Sunset List');
  await expect(review.getByRole('heading', { level: 1, name: 'Decide what to do with due tabs' })).toBeVisible();
  expect(await review.evaluate(() => chrome.runtime.getManifest().manifest_version)).toBe(3);
});

test('@claim:tag-tab saves a review date, intent, and note for the active tab', async () => {
  const sample = await openSampleTab('release-guide', 'Service worker lifecycle guide');
  const popup = await openPopupForActive(sample.page);
  await expect(popup.getByText('Service worker lifecycle guide')).toBeVisible();
  const date = new Date();
  date.setDate(date.getDate() + 3);
  const reviewDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  await popup.locator('#expiry').fill(reviewDate);
  await popup.getByLabel('Read').check();
  await popup.getByLabel(/Why keep it/).fill('Use this for Friday’s release');
  await popup.getByRole('button', { name: 'Save review date' }).click();
  await expect(popup.locator('#status')).toContainText('Review set');
  const stored = await popup.evaluate(async () => (await chrome.storage.local.get('tabSunsetState')).tabSunsetState);
  expect(stored.tracked).toHaveLength(1);
  expect(stored.tracked[0]).toMatchObject({ url: sample.url, title: 'Service worker lifecycle guide', decision: 'read', reason: 'Use this for Friday’s release' });
  expect(stored.tracked[0].expiresAt.slice(0, 10)).toBe(reviewDate);
});

test('@claim:due-badge shows the number of due tabs', async () => {
  const review = await openReview();
  await seed(review, [dueItem('one'), dueItem('two'), dueItem('future', { expiresAt: '2099-01-01T00:00:00.000Z' })]);
  await expect.poll(() => review.evaluate(() => chrome.action.getBadgeText({}))).toBe('2');
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(popup.locator('#due-count')).toHaveText('2');
});

test('@claim:seven-item-queue limits a daily review to seven due tabs', async () => {
  const review = await openReview();
  await seed(review, Array.from({ length: 8 }, (_, index) => dueItem(String(index + 1))));
  await expect(review.locator('#sun-count')).toHaveText('7');
  await expect(review.locator('#position')).toHaveText('1 of 7');
  await review.keyboard.press('End');
  for (let index = 0; index < 7; index += 1) await review.keyboard.press('ArrowRight');
  await expect(review.locator('#position')).toHaveText('7 of 7');
});

test('@claim:keyboard-review operates the queue and announces the replacement item', async () => {
  const review = await openReview();
  await seed(review, [dueItem('one'), dueItem('two')]);
  await expect(review.locator('#position')).toHaveText('1 of 2');
  await review.keyboard.press('ArrowRight');
  await expect(review.locator('#position')).toHaveText('2 of 2');
  await review.keyboard.press('k');
  await expect(review.locator('#queue-announcement')).toContainText('Kept Sample tab two open.');
  await expect(review.locator('#item-title')).toHaveText('Sample tab one');
  await expect(review.locator('#item-title')).toBeFocused();
});

test('@claim:keep-rationale keeps the tab open and saves its note', async () => {
  const sample = await openSampleTab('keep-me', 'Keep this reference');
  const review = await openReview();
  await seed(review, [dueItem('keep', { tabId: sample.id, windowId: sample.windowId, url: sample.url, title: 'Keep this reference', reason: 'Use in the launch notes' })]);
  await review.getByRole('button', { name: /Keep open/ }).click();
  expect(sample.page.isClosed()).toBe(false);
  const stored = await review.evaluate(async () => (await chrome.storage.local.get('tabSunsetState')).tabSunsetState);
  expect(stored.tracked).toHaveLength(0);
  expect(stored.saved[0]).toMatchObject({ title: 'Keep this reference', reason: 'Use in the launch notes', outcome: 'kept' });
});

test('@claim:reschedule-seven moves a due tab forward by seven days', async () => {
  const review = await openReview();
  await seed(review, [dueItem('schedule')]);
  const expected = new Date();
  expected.setDate(expected.getDate() + 7);
  const expectedDate = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, '0')}-${String(expected.getDate()).padStart(2, '0')}`;
  await review.getByRole('button', { name: /\+7 days/ }).click();
  const stored = await review.evaluate(async () => (await chrome.storage.local.get('tabSunsetState')).tabSunsetState);
  expect(stored.tracked).toHaveLength(1);
  expect(stored.tracked[0].expiresAt.slice(0, 10)).toBe(expectedDate);
});

test('@claim:bookmark-close creates a bookmark, closes the tab, and saves the outcome', async () => {
  const sample = await openSampleTab('bookmark-me', 'Bookmark this guide');
  const review = await openReview();
  await seed(review, [dueItem('bookmark', { tabId: sample.id, windowId: sample.windowId, url: sample.url, title: 'Bookmark this guide', reason: 'Keep for the next release' })]);
  const closed = sample.page.waitForEvent('close');
  await review.getByRole('button', { name: /Bookmark \+ close/ }).click();
  await closed;
  const result = await review.evaluate(async () => ({
    state: (await chrome.storage.local.get('tabSunsetState')).tabSunsetState,
    bookmarks: await chrome.bookmarks.search({ title: 'Bookmark this guide' }),
  }));
  expect(result.bookmarks.some((bookmark) => bookmark.url === sample.url)).toBe(true);
  expect(result.state.saved[0]).toMatchObject({ outcome: 'bookmarked', reason: 'Keep for the next release' });
});

test('@claim:close-undo closes a matching tab and reopens its URL into the queue', async () => {
  const sample = await openSampleTab('close-me', 'Close this comparison');
  const review = await openReview();
  await seed(review, [dueItem('close', { tabId: sample.id, windowId: sample.windowId, url: sample.url, title: 'Close this comparison' })]);
  const closed = sample.page.waitForEvent('close');
  await review.getByRole('button', { name: 'Close tab' }).click();
  await closed;
  await expect(review.getByRole('button', { name: 'Undo' })).toBeVisible();
  await review.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => review.evaluate(async (url) => (await chrome.tabs.query({ url })).length, sample.url)).toBe(1);
  const stored = await review.evaluate(async () => (await chrome.storage.local.get('tabSunsetState')).tabSunsetState);
  expect(stored.tracked.some((item: SeedItem) => item.url === sample.url)).toBe(true);
  expect(stored.undo).toBeNull();
});

test('@claim:saved-retrievable keeps decided items after the review page reloads', async () => {
  const review = await openReview();
  await seed(review, [dueItem('persist', { title: 'Persistent reference', reason: 'Use next month' })]);
  await review.getByRole('button', { name: /Keep open/ }).click();
  await review.reload();
  await expect(review.getByRole('link', { name: 'Persistent reference' })).toBeVisible();
  const stored = await review.evaluate(async () => (await chrome.storage.local.get('tabSunsetState')).tabSunsetState);
  expect(stored.saved[0].reason).toBe('Use next month');
});

test('@claim:markdown-export downloads every saved decision with its link, outcome, and note', async () => {
  const review = await openReview();
  await seed(review, [], [savedExample, { ...savedExample, id: 'saved-two', title: 'Second saved page', url: 'https://saved.test/two', outcome: 'bookmarked' }]);
  const downloadPromise = review.waitForEvent('download');
  await review.getByRole('button', { name: 'Export Markdown' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let markdown = '';
  for await (const chunk of stream) markdown += chunk.toString();
  expect(download.suggestedFilename()).toMatch(/^tab-sunset-list-\d{4}-\d{2}-\d{2}\.md$/);
  expect(markdown).toContain('[Saved reference](https://saved.test/reference) — kept');
  expect(markdown).toContain('Why: Use in the release checklist');
  expect(markdown).toContain('[Second saved page](https://saved.test/two) — bookmarked');
});

test('@claim:local-data-no-network completes a decision without sending a web request', async () => {
  const webRequests: string[] = [];
  context.on('request', (request) => {
    if (/^https?:/.test(request.url())) webRequests.push(request.url());
  });
  const review = await openReview();
  await seed(review, [dueItem('private', { reason: 'Private planning note' })]);
  await review.getByRole('button', { name: /Keep open/ }).click();
  await review.reload();
  const stored = await review.evaluate(async () => (await chrome.storage.local.get('tabSunsetState')).tabSunsetState);
  expect(stored.saved[0].reason).toBe('Private planning note');
  expect(webRequests).toEqual([]);
});

test('@claim:least-permissions requests only tabs, storage, bookmarks, and alarms with no site access', async () => {
  const review = await openReview();
  const manifest = await review.evaluate(() => chrome.runtime.getManifest());
  expect([...(manifest.permissions || [])].sort()).toEqual(['alarms', 'bookmarks', 'storage', 'tabs']);
  expect(manifest.host_permissions || []).toEqual([]);
  expect(manifest.content_scripts || []).toEqual([]);
});

test('@claim:delete-local-data clears extension records without deleting browser bookmarks', async () => {
  const review = await openReview();
  await seed(review, [dueItem('delete')], [savedExample]);
  const bookmarkId = await review.evaluate(async () => (await chrome.bookmarks.create({ title: 'Keep this browser bookmark', url: 'https://saved.test/keep' })).id);
  await review.getByRole('button', { name: 'Delete local data' }).click();
  await expect(review.getByRole('dialog')).toBeVisible();
  await expect(review.getByRole('button', { name: 'Keep my data' })).toBeFocused();
  await review.getByRole('button', { name: 'Delete local data', exact: true }).last().click();
  const result = await review.evaluate(async (id) => ({
    state: (await chrome.storage.local.get('tabSunsetState')).tabSunsetState,
    bookmark: await chrome.bookmarks.get(id),
  }), bookmarkId);
  expect(result.state).toEqual({ tracked: [], saved: [], undo: null, dailyLimit: 7 });
  expect(result.bookmark[0].url).toBe('https://saved.test/keep');
  await expect(review.locator('#queue-announcement')).toContainText('Deleted the local review queue');
});

test('popup and review meet touch-target, focus, dark-mode, reduced-motion, and Axe checks', async () => {
  const review = await openReview();
  await seed(review, [dueItem('a11y')], [savedExample]);
  await review.setViewportSize({ width: 390, height: 844 });
  expect(await seriousAccessibilityViolations(review)).toEqual([]);
  await review.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  expect(await seriousAccessibilityViolations(review)).toEqual([]);
  const reviewTargets = await review.locator('a:visible, button:visible').evaluateAll((targets) => targets
    .map((target) => ({ label: (target.textContent || '').trim(), height: target.getBoundingClientRect().height, width: target.getBoundingClientRect().width }))
    .filter(({ height, width }) => height < 44 || width < 44));
  expect(reviewTargets).toEqual([]);
  await review.keyboard.press('Tab');
  await expect(review.getByRole('link', { name: 'Skip to review' })).toBeFocused();

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  expect(await seriousAccessibilityViolations(popup)).toEqual([]);
  const popupTargets = await popup.locator('a:visible, button:visible').evaluateAll((targets) => targets
    .map((target) => ({ label: (target.textContent || '').trim(), height: target.getBoundingClientRect().height, width: target.getBoundingClientRect().width }))
    .filter(({ height, width }) => height < 44 || width < 44));
  expect(popupTargets).toEqual([]);
});

test('invalid and unavailable popup states explain what to do without changing data', async () => {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(popup.getByRole('heading', { name: 'This page cannot be tagged' })).toBeVisible();
  await expect(popup.getByText('Choose a regular web page.')).toBeVisible();
  const state = await popup.evaluate(async () => (await chrome.storage.local.get('tabSunsetState')).tabSunsetState);
  expect(state).toBeUndefined();

  const sample = await openSampleTab('invalid-date', 'Invalid date sample');
  const activePopup = await openPopupForActive(sample.page);
  await activePopup.locator('#expiry').fill('');
  await activePopup.getByRole('button', { name: 'Save review date' }).click();
  expect(await activePopup.locator('#expiry').evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(false);
  const unchanged = await activePopup.evaluate(async () => (await chrome.storage.local.get('tabSunsetState')).tabSunsetState);
  expect(unchanged).toBeUndefined();
});
