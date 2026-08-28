import { expect, test } from '@playwright/test';
import axe from 'axe-core';

async function seriousAccessibilityViolations(page: import('@playwright/test').Page) {
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () => {
    const axeApi = (window as typeof window & { axe: { run: () => Promise<{ violations: Array<{ impact: string | null; id: string }> }> } }).axe;
    return axeApi.run();
  });
  return results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
}

test('landing page is accessible and the preview responds', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/Tab Sunset List/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Every tab gets a horizon.' })).toBeVisible();
  await page.getByRole('button', { name: /Keep/ }).click();
  await expect(page.locator('#demo-status')).toContainText('Keep');
  expect(await seriousAccessibilityViolations(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('390px layout has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByRole('link', { name: /Download extension/ }).first()).toBeVisible();
  const undersizedTargets = await page.locator('a:visible, button:visible').evaluateAll((targets) => targets
    .map((target) => {
      const { width, height } = target.getBoundingClientRect();
      return { label: (target.textContent || '').trim(), width, height };
    })
    .filter(({ width, height }) => width < 44 || height < 44));
  expect(undersizedTargets).toEqual([]);
});

test('the release-versioned shell supports an offline reload without MIME errors', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  const cacheState = await page.evaluate(async () => {
    const names = await caches.keys();
    const requests = await Promise.all(names.map(async (name) => {
      const cache = await caches.open(name);
      return (await cache.keys()).map((request) => new URL(request.url).pathname);
    }));
    return { names, requests: requests.flat() };
  });
  expect(cacheState.names).toHaveLength(1);
  expect(cacheState.names[0]).toMatch(/^tab-sunset-list-[a-f0-9]{12}$/);
  expect(cacheState.requests.some((path) => /^\/assets\/.+\.js$/.test(path))).toBe(true);
  expect(cacheState.requests.some((path) => /^\/assets\/.+\.css$/.test(path))).toBe(true);

  await page.evaluate(async () => {
    const obsolete = await caches.open('tab-sunset-list-previous-release');
    await obsolete.put('/obsolete', new Response('obsolete'));
    await (await navigator.serviceWorker.getRegistration())?.unregister();
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  expect(await page.evaluate(() => caches.keys())).not.toContain('tab-sunset-list-previous-release');

  const session = await context.newCDPSession(page);
  await session.send('Network.clearBrowserCache');
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Tab Sunset List/);
  await expect(page.getByRole('heading', { name: 'Every tab gets a horizon.' })).toBeVisible();
  expect(errors.filter((error) => /MIME type|module script|stylesheet/i.test(error))).toEqual([]);
});

test('the deploy configuration gives immutable assets and hardened responses', async ({ page }) => {
  const response = await page.request.get('/staticwebapp.config.json');
  expect(response.ok()).toBe(true);
  const config = await response.json() as {
    globalHeaders: Record<string, string>;
    routes: Array<{ route: string; headers: Record<string, string> }>;
  };
  expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
  expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
  expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
  expect(config.globalHeaders['X-Content-Type-Options']).toBe('nosniff');
  expect(config.routes).toEqual(expect.arrayContaining([
    { route: '/assets/*', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    { route: '/downloads/*', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
  ]));
});

for (const path of ['/privacy/', '/terms/']) {
  test(`${path} has the required semantics`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    expect(await seriousAccessibilityViolations(page)).toEqual([]);
  });
}
