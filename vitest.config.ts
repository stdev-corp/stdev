import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'node:path'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'src/tests/**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      '.next/**',
      'src/e2e/**',
      'src/tests/db/**',
      'src/tests/e2e/**',
    ],
    css: {
      include: [/.+/],
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
    clearMocks: true,
    restoreMocks: true,
    mockReset: false,
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: {
      junit: './test-results/junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary', 'json'],
      reportsDirectory: './coverage',
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/tests/**',
        'src/e2e/**',
        'src/scripts/**',
        'src/generated/**',
        'src/utils/cms-types.ts',
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/not-found.tsx',
        'src/app/**/forbidden.tsx',
        'src/app/**/unauthorized.tsx',
        'src/app/**/providers.tsx',
        'src/app/api/auth/**',
        'src/app/(stdev)/sitemap.ts',
      ],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
    server: {
      deps: {
        inline: [/@chakra-ui/, /@emotion/, /next/],
      },
    },
  },
})
