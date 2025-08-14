import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      // Disable some strict rules for faster development
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off'
    }
  },
  {
    ignores: ['node_modules/', 'ios/', 'android/', 'build/', 'dist/']
  }
];