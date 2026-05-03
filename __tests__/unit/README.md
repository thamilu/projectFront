# Unit Tests

This directory contains unit tests for individual components, hooks, and utilities.

## Structure

```
unit/
├── components/       # Component tests
├── hooks/           # Hook tests
├── lib/             # Utility tests
└── features/        # Feature-specific tests
```

## Running Tests

```bash
npm run test
npm run test:watch
npm run test:coverage
```

## Best Practices

1. Test user interactions, not implementation details
2. Use data-testid for selecting elements
3. Mock external dependencies
4. Keep tests isolated and independent
5. Follow AAA pattern: Arrange, Act, Assert
