import { defineConfig } from 'vitest/config';

// Unit tests only: no MongoDB, no setup file, so they run in about a second.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/unit/**/*.test.ts'],
    env: { JWT_SECRET: 'unit-test-secret-that-is-long-enough-for-hs256' },
  },
});
