module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/__tests__/mocks/styleMock.js',
  },
  testMatch: [
    '**/__tests__/unit/**/*.test.+(ts|tsx|js)',
    '**/__tests__/integration/**/*.test.+(ts|tsx|js)',
    '**/features/**/*.test.+(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    // Previously 'components/**' and 'hooks/**' — neither directory exists
    // at the repo root (components live under features/*/components and
    // shared/ui, hooks under features/*/hooks and shared/hooks), so those
    // two globs silently matched zero files. That left core/, app/,
    // domains/, platform/, and shared/ entirely outside the coverage gate
    // even though real tests exist for some of them
    // (__tests__/unit/core/telemetry/logger.test.ts,
    // __tests__/unit/platform/circuit-breaker.test.ts, etc.) — corrected to
    // the directories that actually exist.
    'features/**/*.{ts,tsx}',
    'core/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}',
    'domains/**/*.{ts,tsx}',
    'platform/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{ts,tsx}',
    '!**/node_modules/**',
  ],
  // The previous 70% figures were never actually enforced — collectCoverageFrom
  // above pointed at 'components/**' and 'hooks/**', neither of which exists at
  // the repo root, so the threshold was checked against ~0 real files and
  // trivially passed every time. With the globs corrected, real measured
  // coverage is ~65/55/66/52% (statements/branches/lines/functions) — these
  // thresholds are set just below that verified baseline so the gate is an
  // honest ratchet (a real regression now fails CI) rather than a number that
  // was never true. Raise these incrementally as coverage genuinely improves;
  // do not raise them back to a round number without re-measuring first.
  coverageThreshold: {
    global: {
      branches: 54,
      functions: 51,
      lines: 64,
      statements: 64,
    },
  },
};
