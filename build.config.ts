import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig([{
  entries: ['./src/index.ts'],
  declaration: true,
  rollup: {
    inlineDependencies: false,
    emitCJS: true,
    esbuild: {
      minify: false,
    },
  },
  failOnWarn: false,
}, {
  entries: ['./src/bin/cli.ts'],
  declaration: false,
  rollup: {
    inlineDependencies: true,
    emitCJS: false,
    esbuild: {
      minify: false,
    },
  },
  failOnWarn: false,
}])
