# Testing

Two layers:

1. **Unit / integration tests** — Vitest + jsdom + Testing Library. Fast,
   no network, no browser. Run on every save.
2. **End-to-end tests** — Playwright driving a real Chromium against
   `npm run dev`. Slower, catches build/runtime regressions.

## Setup (one time)

```bash
npm install
npx playwright install chromium   # downloads the browser binary
```

If you see a leftover `node_modules/.postcss-XXXXXX` or `ENOTEMPTY`
errors:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Running

```bash
npm test                # unit/integration, one-shot
npm run test:watch      # unit/integration, watch mode
npm run test:coverage   # unit/integration with coverage report

npm run test:e2e        # E2E (auto-starts dev server)
npm run test:e2e:ui     # E2E in Playwright's interactive UI
```

## Coverage today

### Unit tests (Vitest)

- `src/lib/mypolls.test.ts` — localStorage tracker (12 tests)
- `src/lib/db.test.ts` — `deletePoll` / `deleteTournament` branches (9 tests)
- `src/lib/token.test.ts` — token / time / storage helpers (22 tests)
- `src/lib/listingDelete.test.ts` — **regression test for task #13.**
  Covers the trash-button fix: creator entries hit the server, server
  failure aborts cleanly, participants stay local-only, fallback to
  localStorage when in-memory state is empty (5 tests)

### E2E (Playwright)

- `e2e/smoke.spec.ts` — boot smoke. Asserts the home page, all four
  listing pages, and `/create?type=vote` render without a Next.js
  error overlay. Catches broken builds, missing env vars, dead routes.
- `e2e/happy-path.spec.ts` — **TODO, currently `test.skip`.** The full
  create → vote → results flow. To enable:
  1. Add `data-testid` attributes to the create form (title input,
     option inputs, submit) and to the voting page (option buttons,
     submit, results bars).
  2. Spin up a Supabase test project and point CI at it via
     `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_KEY`.
  3. Add a teardown step to `delete_poll_rpc` the created token so the
     test DB stays clean.
  4. Change `test.skip` to `test`.

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and every PR.
Two parallel jobs:

1. **`static-and-unit`** — `npm ci`, lint, typecheck, `npm test`. ~1 min.
2. **`e2e`** — installs Playwright (browser cached between runs),
   boots the dev server, runs `npm run test:e2e`. ~3 min.

If E2E fails, the Playwright HTML report is uploaded as a workflow
artifact — download it from the run summary to see screenshots and
traces.

### GitHub secrets (optional today, required later)

The CI workflow falls back to dummy Supabase values when these aren't
set, so smoke tests pass out of the box. The happy-path E2E spec will
require real values once enabled.

Set under **Settings → Secrets and variables → Actions**:

- `NEXT_PUBLIC_SUPABASE_URL` — point at a Supabase test project
- `NEXT_PUBLIC_SUPABASE_KEY` — its anon key

Recommendation: use a separate Supabase project for CI (not prod) so
test data doesn't pollute real polls.

## Adding a new test

Tests live next to the source file as `*.test.ts` (or `*.test.tsx`).
Vitest auto-discovers them via `vitest.config.ts`.

For component tests, use `@testing-library/react` (already installed):

```ts
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
```

For E2E specs, add a `*.spec.ts` to `e2e/`. Playwright auto-discovers
them via `playwright.config.ts`.
