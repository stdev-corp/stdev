import { FlatCompat } from '@eslint/eslintrc'
import eslintConfigPrettier from 'eslint-config-prettier'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  eslintConfigPrettier,
  {
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
]

export default config
