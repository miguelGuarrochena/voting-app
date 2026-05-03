import { test, expect } from '@playwright/test'

/**
 * Happy-path E2E (TODO: enable after data-testids are wired into forms).
 *
 * Why this is skipped today:
 *   1. The CreatePollForm uses translated text and CSS-only buttons —
 *      no stable selectors. We should add `data-testid="poll-title"`,
 *      `data-testid="poll-option-0"`, `data-testid="submit-poll"`, and
 *      a similar small set on the voting page.
 *   2. We need a Supabase test project (separate from prod) so this
 *      doesn't pollute real data. Add SUPABASE_TEST_URL / KEY to the
 *      CI secrets and use them via NEXT_PUBLIC_SUPABASE_URL/KEY when
 *      running this spec.
 *   3. Add a teardown step that calls delete_poll_rpc on the created
 *      token to keep the test DB clean.
 *
 * Once those are in place, change `test.skip` to `test`, swap the
 * placeholder selectors below, and you're done.
 */

test.describe('happy path: create vote → vote → see results', () => {
  test.skip('placeholder — enable after data-testids exist', async ({ page }) => {
    // 1. Create a vote
    await page.goto('/create?type=vote')
    await page.getByTestId('poll-title').fill('Pizza Friday?')
    await page.getByTestId('poll-option-0').fill('Sí')
    await page.getByTestId('poll-option-1').fill('No')
    await page.getByTestId('submit-poll').click()

    // 2. Capture the share link / token (creator is auto-redirected to /votes/:token)
    await expect(page).toHaveURL(/\/votes\/[A-Za-z0-9]{6,8}$/)
    const url = page.url()
    const token = url.split('/').pop()!
    expect(token).toMatch(/^[A-Za-z0-9]{6,8}$/)

    // 3. Open as anonymous voter (use a fresh browser context to drop session)
    const ctx = await page.context().browser()!.newContext()
    const voterPage = await ctx.newPage()
    await voterPage.goto(`/votes/${token}`)
    await voterPage.getByTestId('vote-option-Sí').click()
    await voterPage.getByTestId('submit-vote').click()

    // 4. See results
    await expect(voterPage.getByTestId('results-bar-Sí')).toBeVisible()

    // 5. Cleanup (TODO: call delete_poll_rpc via admin client)
    await ctx.close()
  })
})
