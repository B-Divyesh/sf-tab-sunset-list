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
