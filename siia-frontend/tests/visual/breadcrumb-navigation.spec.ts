import { expect, test } from '@playwright/test';

test.describe('Breadcrumb Navigation', () => {
  test('deve exibir breadcrumb vazio na home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Aguardar que o template base esteja renderizado
    await expect(page.locator('.template-base')).toBeVisible({ timeout: 15000 });
    
    // Verificar que breadcrumb existe
    const breadcrumb = page.locator('.br-breadcrumb');
    await expect(breadcrumb).toBeVisible();
    
    // Na home, deve ter apenas o ícone de casa
    const crumbItems = breadcrumb.locator('.crumb');
    await expect(crumbItems).toHaveCount(1); // Apenas o home icon
  });

  test('deve exibir breadcrumb "Notícias" ao navegar para /noticias', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.template-base')).toBeVisible({ timeout: 15000 });
    
    // Navegar para noticias
    await page.goto('/noticias');
    await page.waitForLoadState('domcontentloaded');
    
    // Verificar que breadcrumb contém "Notícias"
    const breadcrumb = page.locator('.br-breadcrumb');
    await expect(breadcrumb).toBeVisible();
    
    const noticiasLink = breadcrumb.locator('text=Notícias');
    await expect(noticiasLink).toBeVisible();
    
    // Capturar screenshot para regressão visual após navegação
    await expect(breadcrumb).toHaveScreenshot('breadcrumb-noticias.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });

  test('deve exibir breadcrumb "Entrar" ao navegar para /login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.template-base')).toBeVisible({ timeout: 15000 });
    
    // Navegar para login
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Verificar que breadcrumb contém "Entrar" (pode estar hidden em mobile)
    const breadcrumb = page.locator('.br-breadcrumb');
    await expect(breadcrumb).toBeVisible();
    
    const loginLink = breadcrumb.locator('text=Entrar');
    // Apenas verificar que o elemento existe no DOM (não necessariamente visível em mobile)
    await expect(loginLink).toHaveCount(1);
  });

  test('breadcrumb deve ser clicável e navegar de volta', async ({ page }) => {
    await page.goto('/noticias');
    await page.waitForLoadState('domcontentloaded');
    
    const breadcrumb = page.locator('.br-breadcrumb');
    await expect(breadcrumb).toBeVisible();
    
    // Clicar no ícone de home no breadcrumb
    const homeLink = breadcrumb.locator('a[aria-label="Página inicial"]');
    await homeLink.click();
    
    // Aguardar navegação
    await page.waitForURL('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Verificar que voltou para home (breadcrumb com apenas home icon)
    const crumbItems = breadcrumb.locator('.crumb');
    await expect(crumbItems).toHaveCount(1);
  });
});
