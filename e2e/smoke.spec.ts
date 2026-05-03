import { test, expect } from '@playwright/test'

/**
 * Build/runtime smoke test.
 *
 * Goal: catch the dumbest, biggest regressions — broken build, missing
 * env vars, dead landing page, crashing layout — without depending on
 * Supabase data or login state.
 *
 * Pre-seeding `pickly_username` in localStorage before every test so
 * the OnboardingScreen modal (which gates /create and /:type/:token
 * pages) doesn't show. Without this, every test would see the same
 * "Enter Pickly →" form instead of the actual page.
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pickly_username', 'playwright-smoke')
  })
})

test.describe('smoke', () => {
  test('home page loads and shows the listing nav links', async ({ page }) => {
    await page.goto('/')

    // Title is set, no Next.js error overlay
    await expect(page).toHaveTitle(/.+/)
    await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0)

    // The home page links into the four listing pages — that's our
    // sanity check for the hero rendering correctly.
    await expect(page.locator('a[href="/votes"]').first()).toBeVisible()
    await expect(page.locator('a[href="/ranking"]').first()).toBeVisible()
  })

  test('listing pages render without errors when empty', async ({ page }) => {
    for (const path of ['/votes', '/ranking', '/ratings', '/versus']) {
      await page.goto(path)
      await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0)
      // Just confirm the main region rendered (one strict locator)
      await expect(page.locator('main')).toBeVisible()
    }
  })

  test('create vote page renders the form', async ({ page }) => {
    await page.goto('/create?type=vote')
    await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0)

    // The OnboardingScreen modal should NOT be visible because we
    // pre-seeded the username — that's part of the assertion.
    await expect(page.locator('text=Enter Pickly')).toHaveCount(0)

    // The actual create form should be there. There may be multiple
    // submit buttons across the layout (e.g. nav forms), so we scope
    // to the main create form by its title input + a submit *inside*
    // the form element.
    await expect(page.locator('input').first()).toBeVisible()
    await expect(page.locator('form button[type="submit"]')).toHaveCount(1)
  })
})
