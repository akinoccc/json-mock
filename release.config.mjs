/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: [
    'main',
    {
      name: 'rc',
      prerelease: 'rc',
      channel: 'rc',
    },
    {
      name: 'beta',
      prerelease: 'beta',
      channel: 'beta',
    },
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/git',
    [
      '@semantic-release/github',
      {
        addReleases: 'top',
        successCommentCondition: '<% return branch.name === "main" && !issue.pull_request; %>',
        failComment: ':x: Release failed\n\nPlease check the CI details for more information.',
        failCommentCondition: '<% return branch.name === "main" && issue.pull_request; %>',
        labels: false,
        issues: true,
        pullRequests: true,

      },
    ],
  ],
  preset: 'angular',
}
