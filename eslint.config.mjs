import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['__tests__/fixtures/**/*.json', 'dist/**', 'node_modules/**'],
}, {
  files: ['release.config.mjs'],
  rules: {
    'no-template-curly-in-string': 'off',
  },
}).overrideRules({
  'no-console': 'off',
  'node/prefer-global/process': 'off',
  'jsdoc/require-returns-description': 'off',
  'jsdoc/require-returns-check': 'off',
  'unused-imports/no-unused-vars': 'warn',
  'antfu/no-top-level-await': 'off',
  'unused-imports/no-unused-imports': 'off',
})
