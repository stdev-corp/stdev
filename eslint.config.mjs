import eslintConfigNext from 'eslint-config-next'
import eslintConfigPrettier from 'eslint-config-prettier'

const config = [
  {
    ignores: ['coverage/**', 'playwright-report/**', 'test-results/**'],
  },
  ...eslintConfigNext,
  eslintConfigPrettier,
  {
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
]

export default config
