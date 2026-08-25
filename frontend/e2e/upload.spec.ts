import { test, expect } from '@playwright/test'
import { createUser, registerThroughUi } from './helpers/auth'

test.describe('Upload flow', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await registerThroughUi(page, createUser(testInfo))
  })

  test('navigates to the upload page', async ({ page }) => {
    await page.getByRole('link', { name: 'Upload' }).click()
    await expect(page.getByRole('heading', { name: 'Upload images' })).toBeVisible({ timeout: 5000 })
  })

  test('opens a multiple-file chooser from the drop zone', async ({ page }) => {
    await page.getByRole('link', { name: 'Upload' }).click()

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByText('Browse files').click()
    const fileChooser = await fileChooserPromise
    expect(fileChooser.isMultiple()).toBe(true)
  })

  test('navigates to identities from the application navigation', async ({ page }) => {
    await page.getByRole('link', { name: 'Identities' }).click()
    await expect(page.getByRole('heading', { name: 'Identities', exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('navigates to face match from the application navigation', async ({ page }) => {
    await page.getByRole('link', { name: 'Face Match' }).click()
    await expect(page.getByRole('heading', { name: 'Face Match' })).toBeVisible({ timeout: 5000 })
  })
})
