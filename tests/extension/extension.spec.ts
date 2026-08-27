import { expect, test, chromium } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import axe from 'axe-core';

async function seriousAccessibilityViolations(page: import('@playwright/test').Page) {
  await page.evaluate(axe.source);
  const results = await page.evaluate(async () => {
    const axeApi = (window as typeof window & { axe: { run: () => Promise<{ violations: Array<{ impact: string | null; id: string }> }> } }).axe;
    return axeApi.run();
  });
  return results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
}

test('the built extension completes a due-tab decision', async () => {
  const userDataDir = await mkdtemp(join(tmpdir(), 'tab-sunset-test-'));
  const extensionPath = resolve('.output/chrome-mv3');
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  try {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const extensionId = new URL(worker.url()).host;
    const review = await context.newPage();
    const errors: string[] = [];
    review.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await review.goto(`chrome-extension://${extensionId}/review.html`);
    await review.evaluate(async () => {
      const now = new Date().toISOString();
      await chrome.storage.local.set({
        tabSunsetState: {
          tracked: [{ id: 'test-tab', url: 'https://example.com/reference', title: 'Test reference', reason: 'Verify the full review path', decision: 'review', expiresAt: '2020-01-01T23:59:59.999Z', createdAt: now, updatedAt: now }],
          saved: [], undo: null, dailyLimit: 7,
        },
      });
    });
    await review.reload();
    await expect(review.locator('h1')).toHaveCount(1);
    await expect(review.getByRole('heading', { name: 'Test reference' })).toBeVisible();
    expect(await seriousAccessibilityViolations(review)).toEqual([]);
    await review.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    expect(await seriousAccessibilityViolations(review)).toEqual([]);
    await review.getByRole('button', { name: /Keep open/ }).click();
    await expect(review.getByRole('heading', { name: 'The horizon is clear.' })).toBeVisible();
    await expect(review.getByRole('link', { name: 'Test reference' })).toBeVisible();

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(popup.locator('h1')).toHaveCount(1);
    await expect(popup.locator('main')).toHaveCount(1);
    expect(await seriousAccessibilityViolations(popup)).toEqual([]);
    await popup.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    expect(await seriousAccessibilityViolations(popup)).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await rm(userDataDir, { recursive: true, force: true });
  }
});
