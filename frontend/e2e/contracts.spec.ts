import { test, expect } from '@playwright/test'
import { createUser, registerThroughUi } from './helpers/auth'

test.describe('Contract-backed workflows', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await registerThroughUi(page, createUser(testInfo))
  })

  test('creates and opens an identity through the real API', async ({ page }, testInfo) => {
    const identityName = `Identity ${testInfo.parallelIndex}-${Date.now()}`

    await page.getByRole('link', { name: 'Identities' }).click()
    await page.getByRole('button', { name: 'Create Identity' }).first().click()
    await page.locator('input[placeholder="Person\'s name"]').fill(identityName)
    await page.getByRole('button', { name: 'Create', exact: true }).click()

    const identityLink = page.locator('a[href^="/identities/"]').filter({ hasText: identityName })
    await expect(identityLink).toBeVisible()
    await identityLink.click()
    await expect(page.getByRole('heading', { name: identityName })).toBeVisible()
  })

  test('creates and lists a workspace through the real API', async ({ page }, testInfo) => {
    const workspaceName = `Workspace ${testInfo.parallelIndex}-${Date.now()}`

    await page.getByRole('link', { name: 'Workspaces' }).click()
    await page.getByRole('button', { name: 'Create Workspace' }).click()
    await page.locator('input[placeholder="Workspace name"]').fill(workspaceName)
    await page.getByRole('button', { name: 'Create', exact: true }).click()

    await expect(page.getByText(workspaceName, { exact: true })).toBeVisible()
    await expect(page.getByText('active', { exact: true })).toBeVisible()
  })
})
