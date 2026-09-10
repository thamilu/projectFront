# End-to-End Tests

This directory contains E2E tests using Playwright (`playwright.config.ts`'s
`testDir`). It sits alongside `__tests__/unit/` and `__tests__/integration/`
so all test types share one root, matching this project's Jest conventions.

## Structure

```
__tests__/e2e/
├── auth.spec.ts               # Login, invalid credentials, product search
├── profile-update.spec.ts     # Login and save profile
├── seller-onboarding.spec.ts  # Seller registration flow (requires Keycloak creds)
├── smoke/smoke.spec.ts        # Homepage/stores page load checks
└── visual/homepage.spec.ts    # Light/dark mode visual snapshots
```

## Running Tests

```bash
npm run test:e2e
npm run test:e2e:ui
```

## Setup

1. Install Playwright: `npm install -D @playwright/test`
2. Install browsers: `npx playwright install`
3. Configure in `playwright.config.ts`

## Best Practices

1. Test critical user journeys
2. Use page object model pattern
3. Test on multiple browsers
4. Handle flaky tests properly
5. Use realistic test data
