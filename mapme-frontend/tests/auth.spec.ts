import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  const baseURL = 'http://localhost:3000'; // Adjust to match your dev URL

  test('signup and login flow', async ({ page }) => {
    const email = `test${Date.now()}@example.com`;
    const password = 'TestPassword123';
    const lastName = "Testarosa"
    const firstName = "Ted";

    // Visit signup page
    await page.goto(`${baseURL}/signup`);

    // Fill out form using placeholders
    await page.fill('input[placeholder="First Name"]', firstName);
    await page.fill('input[placeholder="Last Name"]', lastName);
    await page.fill('input[placeholder="Email"]', email);
    await page.fill('input[placeholder="Password"]', password);

    await page.click('button:text("Sign Up")');

    // Expect redirect to /map
    await expect(page).toHaveURL(/\/map/);

    await page.click('button:text("Logout")');

    // Log in
    await page.goto(`${baseURL}/login`);
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill(password);
    // await page.getByText('Login').click();
    await page.getByTestId('LoginButton').click();

    // Verify redirect again
    await expect(page).toHaveURL(/\/map/);
  });
});