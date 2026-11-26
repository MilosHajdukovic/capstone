import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'booknow-*/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Assertion helpers shared inside spec files count as assertions.
      'playwright/expect-expect': [
        'warn',
        { assertFunctionNames: ['expectLoginRejected', 'expectBookingRejected', 'expectAllRequiredErrors'] },
      ],
      // Fixtures requested only for their setup (e.g. `authenticatedPage: _`) are named with a leading _.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
