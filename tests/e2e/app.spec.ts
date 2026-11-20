import { expect, test } from '@playwright/test';

test.describe('Aether UI smoke tests', () => {
  test('renders initial screen without runtime errors and captures screenshot', async ({
    page
  }, testInfo) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveTitle(/Aether/i);
    await expect(page.locator('#activeVibeTitle')).toBeVisible();
    await expect(page.locator('#btnPlayToggle')).toBeVisible();
    await expect(page.locator('#liveStatusText')).toHaveText('待機中');
    await expect(page.locator('#vibeGrid button')).toHaveCount(8);
    await expect(page.locator('#vibeGrid canvas.vibe-card-canvas')).toHaveCount(8);

    await page.screenshot({
      path: testInfo.outputPath('home-desktop.png'),
      fullPage: true
    });

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
    expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toEqual([]);
  });

  test('opens AI BYOK quick tab and help modal cleanly', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    const aiBtn = page.locator('#btnOpenAiTabQuick');
    await expect(aiBtn).toBeVisible();
    await aiBtn.click();
    await expect(page.locator('#panelAi')).toBeVisible();

    const helpBtn = page.locator('#btnQuickHelp');
    await expect(helpBtn).toBeVisible();
    await helpBtn.click();
    await expect(page.locator('#modalHelp')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
