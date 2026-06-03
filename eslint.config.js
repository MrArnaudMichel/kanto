import js from '@eslint/js';
import ts from 'typescript-eslint';
import lit from 'eslint-plugin-lit';
import wc from 'eslint-plugin-wc';
import prettier from 'eslint-config-prettier';

export default ts.config(
  { ignores: ['dist/**', 'coverage/**', 'docs/dist/**'] },
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
      eqeqeq: ['error', 'smart'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.test.ts', 'scripts/**', 'docs/**'],
    ...ts.configs.disableTypeChecked,
  },
  prettier,
);
