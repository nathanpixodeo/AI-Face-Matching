import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true, allowExportNames: ['useAdminAuth', 'useI18n'] }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['src/i18n.tsx'],
    rules: {
      // This module deliberately exports the locale contract consumed by its
      // provider and UI controls; it is not a refresh-only component module.
      'react-refresh/only-export-components': 'off',
    },
  },
])
