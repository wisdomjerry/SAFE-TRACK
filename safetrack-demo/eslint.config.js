import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import tailwindcss from 'eslint-plugin-tailwindcss' // ✅ add this
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      'plugin:tailwindcss/recommended', // ✅ add this
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Disable the misleading linear suggestion
      'tailwindcss/classnames-order': 'off',
      'tailwindcss/enforces-shorthand': 'off',
    },
    build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true, // This helps Recharts resolve its internal dependencies
    },
  },
  },
])