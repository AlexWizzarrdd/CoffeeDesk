import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import mobx from 'eslint-plugin-mobx'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: {
      "mobx": mobx
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'mobx/exhaustive-make-observable': 'warn',
      'mobx/unconditional-make-observable': 'error',
      'mobx/missing-make-observable': 'error',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'no-param-reassign': ['error', { 
        props: true, 
        ignorePropertyModificationsFor: ['store', 'state', 'self', 'target'] 
      }],
    }
  },
])
