import { test, expect } from '@playwright/test'

test.describe('Authentication flow', () => {
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `e2e-${Date.now()}@test.com`,
    password: 'TestPass123!',
    teamName: 'E2E Team',
  }

  test('register a new user', async ({ page }) => {
    await page.goto('/register')

    await page.fill('input[placeholder="John"]', testUser.firstName)
    await page.fill('input[placeholder="Doe"]', testUser.lastName)
    await page.fill('input[placeholder="you@example.com"]', testUser.email)
    await page.fill('input[placeholder="My Team"]', testUser.teamName)
    await page.fill('input[placeholder="Min 8 characters"]', testUser.password)

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/', { timeout: 10000 })
  })

  test('login with registered user', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/', { timeout: 10000 })
  })

  test('show error on invalid login', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'nonexistent@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 5000 })
  })

  test('navigate to forgot password page', async ({ page }) => {
    await page.goto('/login')
    await page.click('text=Forgot password?')
    await expect(page).toHaveURL('/forgot-password')
    await expect(page.locator('text=Forgot password')).toBeVisible()
  })

  test('forgot password shows success', async ({ page }) => {
    await page.goto('/forgot-password')

    await page.fill('input[type="email"]', testUser.email)
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Check your email')).toBeVisible({ timeout: 5000 })
  })

  test('logout clears session', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.click('[data-testid="user-menu"]')
    await page.click('text=Sign out')

    await expect(page).toHaveURL('/login', { timeout: 5000 })
  })

  test('protected route redirects to login', async ({ page }) => {
    await page.goto('/identities')
    await expect(page).toHaveURL('/login', { timeout: 5000 })
  })
})
