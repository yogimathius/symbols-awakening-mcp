/**
 * Vitest test setup - runs before each test suite
 */

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgres://test:test@localhost:5432/symbols_test";
