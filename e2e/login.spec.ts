import { test, expect } from '@playwright/test'

test.describe('Login screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows PIN pad on load', async ({ page }) => {
    await expect(page.getByText('Nova Care')).toBeVisible()
    await expect(page.getByText('Enter your PIN')).toBeVisible()
    // All 10 digit buttons should be visible
    for (const digit of ['1','2','3','4','5','6','7','8','9','0']) {
      await expect(page.getByRole('button', { name: digit, exact: true })).toBeVisible()
    }
  })

  test('PIN dots fill as digits are entered', async ({ page }) => {
    await page.getByRole('button', { name: '1' }).click()
    await page.getByRole('button', { name: '2' }).click()
    // After 2 digits, 2 dots should be filled
    const dots = page.locator('.rounded-full.bg-nova-500')
    await expect(dots).toHaveCount(2)
  })

  test('backspace removes last digit', async ({ page }) => {
    await page.getByRole('button', { name: '1' }).click()
    await page.getByRole('button', { name: '2' }).click()
    // Click backspace (Delete icon button)
    await page.locator('button').last().click()
    const dots = page.locator('.rounded-full.bg-nova-500')
    await expect(dots).toHaveCount(1)
  })

  test('wrong PIN shows error toast', async ({ page }) => {
    // Enter a clearly wrong PIN
    for (const digit of ['9', '9', '9', '9']) {
      await page.getByRole('button', { name: digit }).click()
    }
    await expect(page.getByText(/incorrect pin|not found|failed/i)).toBeVisible({ timeout: 8000 })
  })
})
