import { expect, test } from '@playwright/test'
import { createUser, grantSuperadminForE2E, loginThroughUi, registerThroughUi, signOutThroughUi } from './helpers/auth'

test.describe('Superadmin platform controls', () => {
  test('blocks a standard account from platform route and API', async ({ page }, testInfo) => {
    await registerThroughUi(page, createUser(testInfo))
    await page.goto('/superadmin')
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    const status = await page.evaluate(async () => {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/platform/overview', { headers: { Authorization: `Bearer ${token}` } })
      return response.status
    })
    expect(status).toBe(403)
  })

  test('lets a provisioned superadmin suspend and reactivate a team', async ({ page }, testInfo) => {
    const user = createUser(testInfo)
    await registerThroughUi(page, user)
    await grantSuperadminForE2E(user)
    await signOutThroughUi(page)
    await loginThroughUi(page, user)

    await page.getByRole('link', { name: 'Platform' }).click()
    await expect(page).toHaveURL('/superadmin')
    await expect(page.getByRole('heading', { name: 'Superadmin' })).toBeVisible()

    const teamRow = page.locator('tbody tr').filter({ hasText: user.teamName }).first()
    await expect(teamRow).toBeVisible()
    await teamRow.getByRole('button', { name: `Suspend ${user.teamName}` }).click()
    await expect(teamRow.getByText('suspended', { exact: true })).toBeVisible()

    await teamRow.getByRole('button', { name: `Activate ${user.teamName}` }).click()
    await expect(teamRow.getByText('active', { exact: true })).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    const navigation = page.locator('aside')
    await expect(navigation).toHaveAttribute('data-mobile-open', 'false')
    await expect.poll(() => navigation.evaluate((element) => getComputedStyle(element).transform)).toMatch(/^matrix\(1, 0, 0, 1, -\d+(?:\.\d+)?, 0\)$/)
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await expect(navigation).toHaveAttribute('data-mobile-open', 'true')
    await expect(navigation).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 5000 })
  })
})
