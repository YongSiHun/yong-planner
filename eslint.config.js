const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
const projectRules = require('./eslint-rules.cjs');

module.exports = defineConfig([
  expo,
  { ignores: ['dist/**', '.expo/**', '.cache/**'] },
  {
    files: ['src/**/*.{ts,tsx}', 'app.config.js', 'eslint-rules.cjs'],
    plugins: { project: projectRules },
    rules: {
      'project/cognitive-complexity': ['error', 5],
      'project/boolean-condition': 'error',
      'no-nested-ternary': 'error',
      'no-else-return': ['error', { allowElseIf: false }],
      curly: ['error', 'all'],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let'] },
        { blankLine: 'always', prev: '*', next: 'function' },
      ],
    },
  },
]);
