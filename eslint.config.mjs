import eslintConfigNext from 'eslint-config-next'
import eslintConfigPrettier from 'eslint-config-prettier'

const config = [
  {
    ignores: [
      'coverage/**',
      'coverage-db/**',
      'playwright-report/**',
      'test-results/**',
      '.next/**',
      'node_modules/**',
    ],
  },
  ...eslintConfigNext,
  eslintConfigPrettier,
  {
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    files: [
      'src/**/*.test.{ts,tsx}',
      'src/tests/**/*.{ts,tsx}',
      'src/e2e/**/*.{ts,tsx}',
    ],
    rules: {
      '@next/next/no-img-element': 'off',
      'jsx-a11y/alt-text': 'off',
    },
  },
]

export default config
