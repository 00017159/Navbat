import { test, expect } from '@playwright/test';

test('Admin can switch to Doctors Login mode', async ({ page }) => {
  await page.goto('/');

  // Verify initial Admin Login view
  await expect(page.getByRole('heading', { name: 'ClinicUz Portal' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send Verification Code' })).toBeVisible();

  // Click on Doctors Login
  await page.getByRole('button', { name: 'Doctors Login' }).click();

  // Screen should shift to password mode
  await expect(page.getByPlaceholder('doctor@clinic.uz')).toBeVisible();
  await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
});
