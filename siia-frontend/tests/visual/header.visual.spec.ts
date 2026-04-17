import { expect, test } from '@playwright/test';

test.describe('Header publico', () => {
  test('deve manter regressao visual do cabecalho na home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.template-base')).toBeVisible({ timeout: 15000 });

    const header = page.locator('.header-publico-full').first();
    await expect(header).toBeVisible();
    await expect(header).toHaveScreenshot('header-home.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });
});
