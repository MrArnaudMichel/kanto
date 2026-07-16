import js from '@eslint/js';
import ts from 'typescript-eslint';
import lit from 'eslint-plugin-lit';
import wc from 'eslint-plugin-wc';
import prettier from 'eslint-config-prettier';

export default ts.config(
  { ignores: ['dist/**', 'dist-demo/**', 'coverage/**'] },
  js.configs.recommended,
  ...ts.configs.recommendedTypeChecked,
  lit.configs['flat/recommended'],
  wc.configs['flat/recommended'],
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // Custom elements legitimately reach into their own shadow root.
      'wc/no-self-class': 'off',
      // Lit invokes an event listener with the host element as `this`, so
      // passing a method straight to @click is correct here — the rule cannot
      // see that and flags every binding in the codebase.
      '@typescript-eslint/unbound-method': 'off',
      eqeqeq: ['error', 'smart'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    /* Tests are exempt from type-aware rules. Asserting on
       `listener.mock.calls[0][0].detail` means reaching into an `any`, and
       typing every spy to satisfy the linter buys nothing: the assertion is
       the point, and a wrong type fails the test. */
    files: ['**/*.test.ts'],
    ...ts.configs.disableTypeChecked,
  },
  {
    /* Node-side plumbing: build scripts reading untyped JSON, and this config
       itself. Type-aware rules here would only ask for casts around
       JSON.parse and around ESLint's own untyped presets, which prove
       nothing. */
    files: ['scripts/**', 'eslint.config.js'],
    ...ts.configs.disableTypeChecked,
    languageOptions: {
      // Spread first: disableTypeChecked works by unsetting parserOptions,
      // and replacing languageOptions outright would put them back.
      ...ts.configs.disableTypeChecked.languageOptions,
      globals: { console: 'readonly', process: 'readonly' },
    },
    rules: { ...ts.configs.disableTypeChecked.rules, 'no-console': 'off' },
  },
  prettier,
);
