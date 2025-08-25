/**
 * Test setup and configuration
 */

// eslint-disable-next-line no-undef
process.env.NODE_ENV = "test";
// eslint-disable-next-line no-undef
process.env.DATABASE_URL =
  // eslint-disable-next-line no-undef
  process.env.TEST_DATABASE_URL ??
  "postgres://test:test@localhost:5432/symbols_test";
// eslint-disable-next-line no-undef
if (process.env.CI) {
  // In CI environments, we might want to configure specific test settings
}
