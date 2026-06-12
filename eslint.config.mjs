import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      // TypeScript + Node handle scope checks; no-undef causes false positives
      // on CJS globals (module, require) and React 19 JSX transform.
      'no-undef': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: false,
      },
    },
    rules: {
      ...tsPlugin.configs['recommended'].rules,
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/out/**',
      '**/.wrangler/**',
      '**/.astro/**',
      '_bmad-output/**',
      '_bmad/**',
    ],
  },
]
