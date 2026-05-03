# Integration Tests

This directory contains integration tests that test multiple components/modules working together.

## Structure

```
integration/
├── api/             # API integration tests
├── features/        # Feature integration tests
└── flows/           # User flow tests
```

## Running Tests

```bash
npm run test:integration
```

## Best Practices

1. Test realistic user scenarios
2. Use real API calls or comprehensive mocks
3. Test error handling and edge cases
4. Verify data flow between components
5. Test state management integration
