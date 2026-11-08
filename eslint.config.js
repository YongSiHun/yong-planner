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
      'project/cognitive-complexity': ['error', 4],
      'project/boolean-condition': 'error',
      'project/no-nested-loops': 'error',
      'project/no-nested-if': 'error',
      'project/no-inline-styles': 'error',
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
  {
    files: [
      'src/app/**/*.tsx',
      'src/features/**/components/**/*.tsx',
      'src/features/**/screens/**/*.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/database/**', '**/controllers/**'],
              message: 'UI 명령은 액션 훅을 통해 실행하세요.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/stores/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['**/database/**', '**/controllers/**', '**/services/**', '**/hooks/**'] },
      ],
    },
  },
  {
    files: ['src/features/**/hooks/*Actions.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['useState', 'useEffect', 'useLayoutEffect'],
              message: '액션 훅은 상태와 생명주기를 소유하지 않습니다.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name=/^(usePlanner|useNoteSelectionStore|ui)$/]',
          message: '액션 훅에서는 구독 대신 getState()로 최신 상태를 읽으세요.',
        },
      ],
    },
  },
]);
