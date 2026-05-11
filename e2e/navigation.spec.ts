import { test, expect } from '@playwright/test'

// These tests require a seeded test DB or mock. They validate navigation
// and UI structure without relying on real auth.
test.describe('Dashboard navigation (unauthenticated redirects to login)', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Enter your PIN')).toBeVisible()
  })

  test('shows Nova Care branding', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1', { hasText: 'Nova Care' })).toBeVisible()
  })

  test('PIN pad has correct number layout', async ({ page }) => {
    await page.goto('/')
    for (const digit of ['1','2','3','4','5','6','7','8','9','0']) {
      await expect(page.getByRole('button', { name: digit })).toBeVisible()
    }
  })
})
