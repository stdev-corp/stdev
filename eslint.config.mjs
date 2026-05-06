import eslintConfigNext from 'eslint-config-next'
import eslintConfigPrettier from 'eslint-config-prettier'

const config = [
  ...eslintConfigNext,
  eslintConfigPrettier,
  {
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
]

export default config
