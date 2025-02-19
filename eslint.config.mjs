import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['test/fixtures/**/*.json'],
}, {
  files: ['src/**/*.ts'],
  rules: {},
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
})
