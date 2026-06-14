import { test, expect } from '@playwright/test'

test.describe('Upload flow', () => {
  const testUser = {
    firstName: 'Upload',
    lastName: 'Tester',
    email: `upload-e2e-${Date.now()}@test.com`,
    password: 'TestPass123!',
    teamName: 'Upload E2E',
  }

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('/register')

    await page.fill('input[placeholder="John"]', testUser.firstName)
    await page.fill('input[placeholder="Doe"]', testUser.lastName)
    await page.fill('input[placeholder="you@example.com"]', testUser.email)
    await page.fill('input[placeholder="My Team"]', testUser.teamName)
    await page.fill('input[placeholder="Min 8 characters"]', testUser.password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/', { timeout: 10000 })
    await page.close()
  })

  test('navigate to upload page', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.goto('/upload')
    await expect(page.locator('text=Upload images')).toBeVisible({ timeout: 5000 })
  })

  test('upload page shows drag-and-drop zone', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.goto('/upload')

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.click('text=Click to browse')
    const fileChooser = await fileChooserPromise
    expect(fileChooser.isMultiple()).toBe(true)
  })

  test('navigate to identities page', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.goto('/identities')
    await expect(page.locator('text=Identities')).toBeVisible({ timeout: 5000 })
  })

  test('navigate to match page', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.goto('/match')
    await expect(page.locator('text=Face Match')).toBeVisible({ timeout: 5000 })
  })
})
