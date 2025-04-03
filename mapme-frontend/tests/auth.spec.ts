import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  const baseURL = 'http://localhost:3000'; // Adjust to match your dev URL
  const newEmail = `test${Date.now()}@example.com`;
  const testAccount = "test@example.com";
  const password = 'TestPassword123';
  const lastName = "Testarosa"
  const firstName = "Ted";

  test('signup and login flow', async ({ page }) => {
    // Visit signup page
    await page.goto(`${baseURL}/signup`);

    // Fill out form using placeholders
    await page.fill('input[placeholder="First Name"]', firstName);
    await page.fill('input[placeholder="Last Name"]', lastName);
    await page.fill('input[placeholder="Email"]', newEmail);
    await page.fill('input[placeholder="Password"]', password);

    await page.click('button:text("Sign Up")');

    // Expect redirect to /map
    await expect(page).toHaveURL(/\/map/);

    await page.click('button:text("Logout")');

    // Log in
    await page.goto(`${baseURL}/login`);
    await page.getByPlaceholder('Email').fill(newEmail);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByTestId('LoginButton').click();

    // Verify redirect again
    await expect(page).toHaveURL(/\/map/);
  });

  test('log in and install Canada Travel Advisory addon', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.getByPlaceholder('Email').fill(testAccount);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByTestId('LoginButton').click();
    await expect(page).toHaveURL(/\/map/);

    // Find the Canada Travel Advisory addon card and click "Add"
    const addonCard = page.getByRole('heading', { name: 'Canada Travel Advisory' }).locator('..').locator('..');
    await addonCard.getByRole('button', { name: 'Add' }).click();

    // Sleep for 1 second to allow the addon to be installed
    await page.waitForTimeout(1000);

    // Wait for InstalledAddon to appear with the same heading
    const installedAddonCard = page.getByRole('heading', { name: 'Canada Travel Advisory' }).locator('..').locator('..');

    // Wait until the Remove button appears (guarantees it's the new InstalledAddon)
    await expect(installedAddonCard.getByRole('button', { name: 'Remove' })).toBeVisible();

    await expect(installedAddonCard.getByText(/Status:/)).toHaveText(/Status:\s*running/i, {
      timeout: 5000,
    });

    await installedAddonCard.getByRole('button', { name: 'Remove' }).click();

    // Wait for the addon to be removed
    await page.waitForTimeout(1000);

    // Check that the addon is no longer in the Installed Addons list
    const removedAddonCard = page.getByRole('heading', { name: 'Canada Travel Advisory' }).locator('..').locator('..');
    await expect(removedAddonCard.getByRole('button', { name: 'Remove' })).not.toBeVisible();
    await expect(removedAddonCard.getByRole('button', { name: 'Add' })).toBeVisible();
  });

  test('addon persists after logout and login', async ({ page }) => {
    // Step 1: Log in
    await page.goto(`${baseURL}/login`);
    await page.getByPlaceholder('Email').fill(testAccount);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByTestId('LoginButton').click();
    await expect(page).toHaveURL(/\/map/);
  
    // Step 2: Install the addon
    const addonCard = page.getByRole('heading', { name: 'Canada Travel Advisory' }).locator('..').locator('..');
    await addonCard.getByRole('button', { name: 'Add' }).click();

    await page.waitForTimeout(1000);
  
    // Wait for InstalledAddon to mount
    const installedAddonCard = page.getByRole('heading', { name: 'Canada Travel Advisory' }).locator('..').locator('..');
    await expect(installedAddonCard.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(installedAddonCard.getByText(/Status:/)).toHaveText(/Status:\s*running/i, { timeout: 5000 });
  
    // Step 3: Log out
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForTimeout(1000); // Wait for logout to complete
    expect(new URL(page.url()).pathname).toBe('/');
  
    // Step 4: Log back in
    await page.goto(`${baseURL}/login`);
    await page.getByPlaceholder('Email').fill(testAccount);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByTestId('LoginButton').click();
    await expect(page).toHaveURL(/\/map/);
  
    // Step 5: Check that the InstalledAddon still exists
    await expect(page.getByRole('heading', { name: 'Canada Travel Advisory' })).toBeVisible();
    const persistentAddonCard = page.getByRole('heading', { name: 'Canada Travel Advisory' }).locator('..').locator('..');
    await expect(persistentAddonCard.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(persistentAddonCard.getByText(/Status:/)).toHaveText(/Status:\s*running/i, { timeout: 5000 });
  
    // Step 6: Cleanup — uninstall the addon
    await persistentAddonCard.getByRole('button', { name: 'Remove' }).click();
    await page.waitForTimeout(1000);
  
    const resetAddonCard = page.getByRole('heading', { name: 'Canada Travel Advisory' }).locator('..').locator('..');
    await expect(resetAddonCard.getByRole('button', { name: 'Add' })).toBeVisible();
  });
});