import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import axe from 'axe-core';

const baseURL = process.argv[2] || 'https://tab-sunset-list.sociobot.in';
const evidenceDir = process.argv[3] || '/work/.evidence';
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chromium', headless: true });
const report = { baseURL, checkedAt: new Date().toISOString(), viewports: {}, missingRoute: {}, offline: {}, reducedMotion: {}, errors: [] };

for (const [name, viewport] of Object.entries({ desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } })) {
  const context = await browser.newContext({ viewport, bypassCSP: true });
  const page = await context.newPage();
  const errors = [];
  const requestOrigins = new Set();
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('request', (request) => {
    if (/^https?:/.test(request.url())) requestOrigins.add(new URL(request.url()).origin);
  });

  await page.goto(baseURL, { waitUntil: 'networkidle' });
  const firstScreen = await page.evaluate(() => {
    const action = [...document.querySelectorAll('a')].find((link) => link.textContent?.trim() === 'Try it with sample data');
    const rect = action?.getBoundingClientRect();
    return {
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim(),
      audience: document.querySelector('.hero-lede')?.textContent?.trim(),
      action: action?.textContent?.trim(),
      facts: [...document.querySelectorAll('.hero-facts li')].map((item) => item.textContent?.trim()),
      actionBeforeScroll: Boolean(rect && rect.top >= 0 && rect.bottom <= innerHeight),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  await page.screenshot({ path: `${evidenceDir}/live-home-${name}.png`, fullPage: false });
  await page.evaluate(() => localStorage.setItem('tab-sunset-list:real', JSON.stringify({ protected: 'unchanged' })));
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.getByRole('button', { name: 'Keep open' }).click();
  const populated = await page.evaluate(() => ({
    banner: document.querySelector('.sandbox-banner strong')?.textContent?.trim(),
    position: document.querySelector('#sample-position')?.textContent?.trim(),
    savedItems: document.querySelectorAll('#sample-saved li').length,
  }));
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForFunction(() => scrollY > 100);
  const bannerTopAfterScroll = await page.getByLabel('Demo mode').evaluate((element) => Math.round(element.getBoundingClientRect().top));
  await page.getByRole('button', { name: 'Reset demo' }).click();
  const reset = await page.evaluate(() => ({
    position: document.querySelector('#sample-position')?.textContent?.trim(),
    savedItems: document.querySelectorAll('#sample-saved li').length,
    realData: localStorage.getItem('tab-sunset-list:real'),
  }));
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const textZoomOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.addScriptTag({ content: axe.source });
  const axeResults = await page.evaluate(async () => window.axe.run());
  await page.screenshot({ path: `${evidenceDir}/live-demo-${name}.png`, fullPage: false });
  report.viewports[name] = {
    firstScreen,
    populated,
    bannerTopAfterScroll,
    reset,
    textZoomOverflow,
    cookies: await context.cookies(),
    requestOrigins: [...requestOrigins],
    seriousAxeViolations: axeResults.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical').map((item) => item.id),
    errors,
  };
  report.errors.push(...errors.map((error) => `${name}: ${error}`));
  await context.close();
}

const missingContext = await browser.newContext();
const missingPage = await missingContext.newPage();
const missingResponse = await missingPage.goto(`${baseURL}/definitely-missing-repair-2`, { waitUntil: 'domcontentloaded' });
report.missingRoute = {
  status: missingResponse?.status(),
  title: await missingPage.title(),
  h1: await missingPage.locator('h1').textContent(),
  returnLink: await missingPage.getByRole('link', { name: 'Return to the home page' }).getAttribute('href'),
};
await missingContext.close();

const offlineContext = await browser.newContext({ baseURL });
const offlinePage = await offlineContext.newPage();
const offlineErrors = [];
offlinePage.on('console', (message) => { if (message.type() === 'error') offlineErrors.push(message.text()); });
await offlinePage.goto('/', { waitUntil: 'networkidle' });
await offlinePage.waitForFunction(() => navigator.serviceWorker.controller !== null);
const cacheBefore = await offlinePage.evaluate(() => caches.keys());
await offlinePage.evaluate(async () => {
  const old = await caches.open('tab-sunset-list-live-old-release');
  await old.put('/obsolete', new Response('obsolete'));
  await (await navigator.serviceWorker.getRegistration())?.unregister();
});
await offlinePage.reload({ waitUntil: 'networkidle' });
await offlinePage.waitForFunction(() => navigator.serviceWorker.controller !== null);
const cacheAfter = await offlinePage.evaluate(() => caches.keys());
const session = await offlineContext.newCDPSession(offlinePage);
await session.send('Network.clearBrowserCache');
await offlineContext.setOffline(true);
const offlineRoutes = {};
for (const route of ['/', '/demo/', '/privacy/', '/terms/']) {
  await offlinePage.goto(route, { waitUntil: 'domcontentloaded' });
  offlineRoutes[route] = {
    title: await offlinePage.title(),
    h1: await offlinePage.locator('h1').textContent(),
  };
}
report.offline = { cacheBefore, cacheAfter, routes: offlineRoutes, errors: offlineErrors };
report.errors.push(...offlineErrors.map((error) => `offline: ${error}`));
await offlineContext.close();

const motionContext = await browser.newContext({ reducedMotion: 'reduce' });
const motionPage = await motionContext.newPage();
await motionPage.goto(baseURL);
report.reducedMotion = await motionPage.locator('.button').first().evaluate((element) => ({
  transitionDuration: getComputedStyle(element).transitionDuration,
  scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
}));
await motionContext.close();
await browser.close();

await writeFile(`${evidenceDir}/live-browser-check.json`, `${JSON.stringify(report, null, 2)}\n`);

const expectedOrigin = new URL(baseURL).origin;
const valid = Object.values(report.viewports).every((result) => (
  result.firstScreen.h1 === 'Decide what to do with stale tabs'
  && result.firstScreen.actionBeforeScroll
  && result.firstScreen.facts.length === 3
  && result.firstScreen.overflow === 0
  && result.populated.banner === 'Demo — sample data, nothing is saved'
  && result.populated.position === '1 of 4'
  && result.populated.savedItems === 2
  && result.bannerTopAfterScroll === 0
  && result.reset.position === '1 of 5'
  && result.reset.savedItems === 1
  && result.reset.realData === '{"protected":"unchanged"}'
  && result.textZoomOverflow === 0
  && result.cookies.length === 0
  && result.requestOrigins.every((origin) => origin === expectedOrigin)
  && result.seriousAxeViolations.length === 0
  && result.errors.length === 0
))
  && report.missingRoute.status === 404
  && report.offline.cacheBefore.length === 1
  && !report.offline.cacheAfter.includes('tab-sunset-list-live-old-release')
  && Object.keys(report.offline.routes).length === 4
  && report.offline.errors.length === 0
  && report.reducedMotion.transitionDuration === '1e-05s'
  && report.reducedMotion.scrollBehavior === 'auto';

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exit(valid ? 0 : 1);
