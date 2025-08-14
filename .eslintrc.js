module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', '@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
  },
  ignorePatterns: ['node_modules/', 'ios/', 'android/', '*.js'],
};