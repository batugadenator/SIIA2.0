import { expect, test } from '@playwright/test';

const ensureAuthToken = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('siia_token', 'smoke-token');
  });
};

const APP_HOME_ROUTES = [
  '/dashboard/reabilita',
  '/dashboard/siagg',
  '/dashboard/cms',
  '/dashboard/legados',
] as const;

test.describe('App shell com menu contextual por modulo', () => {
  test('Reabilita deve exibir menu funcional do modulo', async ({ page }) => {
    await ensureAuthToken(page);
    await page.goto('/dashboard/reabilita');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.internal-app-shell')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.internal-nav-link', { hasText: 'Cadetes / Alunos' })).toBeVisible();
    await expect(page.locator('.internal-nav-link', { hasText: 'Médico' })).toBeVisible();
    await expect(page.locator('.internal-nav-link', { hasText: 'Fisioterapia' })).toBeVisible();
    await expect(page.locator('.internal-nav-link', { hasText: 'Relatórios S-RED' })).toBeVisible();

    await page.locator('.internal-nav-link', { hasText: 'Médico' }).click();
    await expect(page).toHaveURL(/\/dashboard\/reabilita\/medico$/);
  });

  test('CMS deve exibir menu funcional do modulo', async ({ page }) => {
    await ensureAuthToken(page);
    await page.goto('/dashboard/cms');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.internal-app-shell')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.internal-nav-link', { hasText: 'Notícias' })).toBeVisible();
    await expect(page.locator('.internal-nav-link', { hasText: 'Homologação' })).toBeVisible();
    await expect(page.locator('.internal-nav-link', { hasText: 'Configuração Visual' })).toBeVisible();

    await page.locator('.internal-nav-link', { hasText: 'Homologação' }).click();
    await expect(page).toHaveURL(/\/dashboard\/cms\/homologacao$/);
  });

  test('deve exibir botão Voltar nas páginas iniciais dos apps', async ({ page }) => {
    await ensureAuthToken(page);

    for (const route of APP_HOME_ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      const voltarLink = page.getByRole('link', { name: 'Voltar' });
      await expect(voltarLink).toBeVisible();
      await expect(voltarLink).toHaveAttribute('href', '/dashboard');
    }
  });
});
