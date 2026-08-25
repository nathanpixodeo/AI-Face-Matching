import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { expect, type Page, type TestInfo } from '@playwright/test'

export interface E2EUser {
  firstName: string
  lastName: string
  email: string
  password: string
  teamName: string
}

const execFileAsync = promisify(execFile)

export function createUser(testInfo: TestInfo): E2EUser {
  const suffix = `${testInfo.parallelIndex}-${randomUUID().slice(0, 8)}`

  return {
    firstName: 'E2E',
    lastName: 'User',
    email: `e2e-${suffix}@example.test`,
    password: 'TestPass123!',
    teamName: `E2E Team ${suffix}`,
  }
}

export async function registerThroughUi(page: Page, user: E2EUser) {
  await page.goto('/register')
  await page.locator('input[placeholder="John"]').fill(user.firstName)
  await page.locator('input[placeholder="Doe"]').fill(user.lastName)
  await page.locator('input[placeholder="you@example.com"]').fill(user.email)
  await page.locator('input[placeholder="My Team"]').fill(user.teamName)
  await page.locator('input[placeholder="Min 8 characters"]').fill(user.password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL('/', { timeout: 10000 })
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Plan usage' })).toBeVisible()
}

export async function signOutThroughUi(page: Page) {
  await page.getByTestId('user-menu').click()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL('/login', { timeout: 5000 })
}

export async function loginThroughUi(page: Page, user: E2EUser) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(user.email)
  await page.locator('input[type="password"]').fill(user.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/', { timeout: 10000 })
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Plan usage' })).toBeVisible()
}

export async function grantSuperadminForE2E(user: E2EUser) {
  const mongoUri = process.env.E2E_MONGO_URI
  if (!mongoUri) throw new Error('E2E_MONGO_URI is required to provision a disposable E2E superadmin')

  const repositoryRoot = resolve(process.cwd(), '..')
  const tsxCli = resolve(repositoryRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs')

  await execFileAsync(process.execPath, [tsxCli, 'src/scripts/grant-superadmin.ts', user.email], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      MONGO_URI: mongoUri,
      JWT_SECRET: process.env.E2E_JWT_SECRET ?? 'e2e-test-secret-minimum-16-chars',
    },
  })
}
