import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/**.test.ts', 'src/**/**.test.ts'],
    environment: 'node',
    reporters: ['verbose'],
    silent: false,
    testTimeout: 10000,
    setupFiles: ['./test/setup.ts'],
  },
})
