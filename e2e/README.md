# End-to-End Tests

This directory contains E2E tests using Playwright or Cypress.

## Structure

```
e2e/
├── auth/            # Authentication flows
├── checkout/        # Checkout process
├── products/        # Product browsing and search
└── admin/           # Admin panel tests
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
