import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Run from the repo root (npm run lint does this), since product pages live in
// products/<name>/web outside this folder. Patterns are relative to the repo root.

export default [
  { ignores: ['frontend/build/**', '**/node_modules/**', 'frontend/public/**'] },
  { files: ['frontend/src/**/*.{js,jsx}', 'products/*/web/**/*.{js,jsx}', 'products/shared/**/*.js'], ...js.configs.recommended },
  {
    files: ['frontend/src/**/*.{js,jsx}', 'products/*/web/**/*.{js,jsx}', 'products/shared/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
    },
  },
  {
    files: ['**/*.test.{js,jsx}', 'frontend/src/setupTests.js'],
    languageOptions: { globals: { ...globals.node, ...globals.vitest } },
  },
];
