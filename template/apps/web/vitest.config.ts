import { defineConfig } from 'vitest/config'

// Unit tests run in Node without the TanStack Start plugin.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
