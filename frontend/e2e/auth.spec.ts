import { test, expect } from '@playwright/test'
import { createUser, loginThroughUi, registerThroughUi, signOutThroughUi } from './helpers/auth'

test.describe('Authentication flow', () => {
  test('registers a new user', async ({ page }, testInfo) => {
    await registerThroughUi(page, createUser(testInfo))
  })

  test('logs in with a registered user', async ({ page }, testInfo) => {
    const user = createUser(testInfo)
    await registerThroughUi(page, user)
    await signOutThroughUi(page)
    await loginThroughUi(page, user)
  })

  test('shows an error on invalid login', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('nonexistent@example.test')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 5000 })
  })

  test('navigates to the forgot-password page', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Forgot password?' }).click()
    await expect(page).toHaveURL('/forgot-password')
    await expect(page.getByRole('heading', { name: 'Forgot password' })).toBeVisible()
  })

  test('forgot password shows a generic success state', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.locator('input[type="email"]').fill('nonexistent@example.test')
    await page.getByRole('button', { name: 'Send reset link' }).click()

    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible({ timeout: 5000 })
  })

  test('logout clears session', async ({ page }, testInfo) => {
    await registerThroughUi(page, createUser(testInfo))
    await signOutThroughUi(page)
  })

  test('protected route redirects to login', async ({ page }) => {
    await page.goto('/identities')
    await expect(page).toHaveURL('/login', { timeout: 5000 })
  })
})
