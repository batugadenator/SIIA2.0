import { expect, test } from '@playwright/test';

const AUTH_ROUTES = [
  '/dashboard',
  '/dashboard/reabilita',
  '/dashboard/siagg',
  '/dashboard/cms',
  '/dashboard/legados',
] as const;

const ensureAuthToken = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('siia_token', 'smoke-token');
  });
};

async function assertShellVisibleOnRoutes(page: import('@playwright/test').Page) {
  for (const route of AUTH_ROUTES) {
    await page.goto(route);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.internal-app-shell')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.internal-app-sidebar')).toBeVisible();
    await expect(page.locator('.internal-app-content')).toBeVisible();
  }
}

test.describe('App shell por breakpoint', () => {
  test('desktop: sidebar fixa de 264px', async ({ page }) => {
    await ensureAuthToken(page);
    await page.setViewportSize({ width: 1366, height: 900 });

    await assertShellVisibleOnRoutes(page);

    const sidebarWidth = await page.locator('.internal-app-sidebar').evaluate((el) => Math.round(parseFloat(getComputedStyle(el).width)));
    expect(sidebarWidth).toBe(264);
  });

  test('tablet: sidebar fixa de 228px', async ({ page }) => {
    await ensureAuthToken(page);
    await page.setViewportSize({ width: 1024, height: 768 });

    await assertShellVisibleOnRoutes(page);

    const sidebarWidth = await page.locator('.internal-app-sidebar').evaluate((el) => Math.round(parseFloat(getComputedStyle(el).width)));
    expect(sidebarWidth).toBe(228);
  });

  test('mobile: sidebar vira bloco superior com largura total', async ({ page }) => {
    await ensureAuthToken(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await assertShellVisibleOnRoutes(page);

    const [sidebarWidth, viewportWidth, shellDirection] = await Promise.all([
      page.locator('.internal-app-sidebar').evaluate((el) => Math.round(parseFloat(getComputedStyle(el).width))),
      page.evaluate(() => window.innerWidth),
      page.locator('.internal-app-shell').evaluate((el) => getComputedStyle(el).flexDirection),
    ]);

    expect(shellDirection).toBe('column');
    expect(Math.abs(sidebarWidth - viewportWidth)).toBeLessThanOrEqual(2);
  });
});
