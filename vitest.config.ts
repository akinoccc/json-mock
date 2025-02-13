import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/**.test.ts'],
    environment: 'node',
    reporters: ['verbose'],
    silent: false,
    testTimeout: 10000,
  },
})
