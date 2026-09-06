import { expect, test, type Page } from '@playwright/test';
import axe from 'axe-core';

async function seriousAccessibilityViolations(page: Page) {
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () => {
    const axeApi = (window as typeof window & { axe: { run: () => Promise<{ violations: Array<{ impact: string | null; id: string }> }> } }).axe;
    return axeApi.run();
  });
  return results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
}

test('the first screen states the job, audience, action, and three facts', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page).toHaveTitle('Tab Sunset List — decide what to do with stale tabs');
  await expect(page.getByRole('heading', { level: 1, name: 'Decide what to do with stale tabs' })).toBeVisible();
  await expect(page.getByText('For knowledge workers whose useful browser tabs become an unreviewed pile.')).toBeVisible();
  const action = page.getByRole('link', { name: 'Try it with sample data' });
  await expect(action).toBeVisible();
  await expect(page.getByText('Review five sample tabs. The demo cannot change your extension data.')).toBeVisible();
  await expect(page.locator('.hero-facts li')).toHaveCount(3);
  const box = await action.boundingBox();
  expect(box && box.y + box.height).toBeLessThanOrEqual(844);
});

test('@claim:one-click-demo opens a populated working sample in one action', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo\/$/);
  await expect(page.getByLabel('Demo mode')).toContainText('Demo — sample data, nothing is saved');
  await expect(page.getByRole('heading', { level: 2, name: 'Service worker lifecycle guide' })).toBeVisible();
  await expect(page.locator('#sample-position')).toHaveText('1 of 5');
  await expect(page.locator('#sample-saved li')).toHaveCount(1);
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => page.getByLabel('Demo mode').evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBe(0);
});

test('@claim:demo-isolation-reset keeps real data unchanged and clears the sample on exit', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('tab-sunset-list:real', JSON.stringify({ protected: 'unchanged' })));
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.getByRole('button', { name: 'Close tab' }).click();
  await expect(page.locator('#sample-position')).toHaveText('1 of 4');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('tab-sunset-list:real') || '{}'))).toEqual({ protected: 'unchanged' });
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(expect.arrayContaining(['demo:tab-sunset-list:v1', 'tab-sunset-list:real']));

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#sample-position')).toHaveText('1 of 5');
  await expect(page.locator('#sample-saved li')).toHaveCount(1);

  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/#install$/);
  expect(await page.evaluate(() => localStorage.getItem('demo:tab-sunset-list:v1'))).toBeNull();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('tab-sunset-list:real') || '{}'))).toEqual({ protected: 'unchanged' });
});

test('@claim:free-no-account provides the sample and extension without sign-in or checkout', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.locator('input[type="email"], input[type="password"], [data-checkout]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Keep open' }).click();
  await expect(page.locator('#sample-saved li')).toHaveCount(2);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('tab-sunset-list-chrome.zip');
  expect(await download.failure()).toBeNull();
});

test('@claim:site-private completes the sample with only same-origin requests and no cookies', async ({ page, context, baseURL }) => {
  const requestOrigins = new Set<string>();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'http:' || url.protocol === 'https:') requestOrigins.add(url.origin);
  });
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Keep open' }).click();
  await page.getByRole('button', { name: 'Move seven days' }).click();
  await page.getByRole('button', { name: 'Bookmark and close' }).click();
  await page.getByRole('button', { name: 'Close tab' }).click();
  expect([...requestOrigins]).toEqual([new URL(baseURL!).origin]);
  expect(await context.cookies()).toEqual([]);
});

test('@claim:offline-site reloads the home, demo, privacy, and terms pages offline', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    const session = await context.newCDPSession(page);
    await session.send('Network.clearBrowserCache');
    await context.setOffline(true);
    for (const route of ['/', '/demo/', '/privacy/', '/terms/']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
    }
    expect(errors.filter((error) => /MIME type|module script|stylesheet/i.test(error))).toEqual([]);
  } finally {
    await context.close();
  }
});

test('the demo supports keyboard decisions, announces changes, and moves focus', async ({ page }) => {
  await page.goto('/demo/');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#sample-position')).toHaveText('2 of 5');
  await page.keyboard.press('k');
  await expect(page.locator('#demo-announcement')).toContainText('Kept Train options for the client workshop open.');
  await expect(page.locator('#sample-title')).toBeFocused();
  await expect(page.locator('#sample-saved li')).toHaveCount(2);
});

test('all routes have complete metadata, shared structure, and no serious accessibility issues', async ({ page }) => {
  for (const route of ['/', '/demo/', '/privacy/', '/terms/']) {
    const errors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.getByRole('link', { name: /Tab Sunset List home/ })).toBeVisible();
    await expect(page.getByText(/Built by Param Factory/)).toBeVisible();
    expect(await seriousAccessibilityViolations(page)).toEqual([]);
    expect(errors).toEqual([]);
  }
});

test('phone layout and 200 percent text reflow without clipping or small targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/demo/']) {
    await page.goto(route);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const undersizedTargets = await page.locator('a:visible, button:visible').evaluateAll((targets) => targets
      .map((target) => {
        const { width, height } = target.getBoundingClientRect();
        return { label: (target.textContent || '').trim(), width, height };
      })
      .filter(({ width, height }) => width < 44 || height < 44));
    expect(undersizedTargets).toEqual([]);
  }
});

test('reduced motion removes smooth scrolling and movement transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const styles = await page.locator('.button').first().evaluate((element) => {
    const computed = getComputedStyle(element);
    return { transitionDuration: computed.transitionDuration, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior };
  });
  expect(styles.transitionDuration).toBe('1e-05s');
  expect(styles.scrollBehavior).toBe('auto');
});

test('missing addresses return the designed 404 response', async ({ page }) => {
  const response = await page.goto('/definitely-missing-repair-2');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found — Tab Sunset List');
  await expect(page.getByRole('heading', { level: 1, name: 'This page does not exist' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to the home page' })).toBeVisible();
  expect(await seriousAccessibilityViolations(page)).toEqual([]);
});

test('the release-versioned cache contains every offline route and removes old caches', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const state = await page.evaluate(async () => {
    const names = await caches.keys();
    const requests = await Promise.all(names.map(async (name) => {
      const cache = await caches.open(name);
      return (await cache.keys()).map((request) => new URL(request.url).pathname);
    }));
    return { names, requests: requests.flat() };
  });
  expect(state.names).toHaveLength(1);
  expect(state.names[0]).toMatch(/^tab-sunset-list-[a-f0-9]{12}$/);
  expect(state.requests).toEqual(expect.arrayContaining(['/', '/demo/', '/privacy/', '/terms/', '/404.html']));
  expect(state.requests.some((path) => /^\/assets\/.+\.js$/.test(path))).toBe(true);
  expect(state.requests.some((path) => /^\/assets\/.+\.css$/.test(path))).toBe(true);

  await page.evaluate(async () => {
    const old = await caches.open('tab-sunset-list-previous-release');
    await old.put('/obsolete', new Response('obsolete'));
    await (await navigator.serviceWorker.getRegistration())?.unregister();
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  expect(await page.evaluate(() => caches.keys())).not.toContain('tab-sunset-list-previous-release');
});

test('response configuration protects content and maps missing pages to the 404 design', async ({ request }) => {
  const response = await request.get('/staticwebapp.config.json');
  expect(response.ok()).toBe(true);
  const config = await response.json() as {
    globalHeaders: Record<string, string>;
    routes: Array<{ route: string; headers: Record<string, string> }>;
    responseOverrides: Record<string, { rewrite: string }>;
  };
  expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
  expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
  expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
  expect(config.globalHeaders['X-Content-Type-Options']).toBe('nosniff');
  expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html' });
  expect(config.routes).toEqual(expect.arrayContaining([
    { route: '/assets/*', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    { route: '/downloads/*', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
  ]));
});
