import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import sveltePreprocess from 'svelte-preprocess'
import typescript from '@wessberg/rollup-plugin-ts'
import json from '@rollup/plugin-json'

export default [
  {
    input: 'src/notify.ts',
    output: {
      format: 'umd',
      name: 'notify',
      file: 'dist/notify.umd.js',
      sourcemap: 'inline'
    },
    onwarn: (warning, warn) => {
      if (warning.code === 'THIS_IS_UNDEFINED') {
        return
      }

      warn(warning)
    },
    plugins: [
      json(),
      svelte({
        preprocess: sveltePreprocess()
      }),
      resolve({
        browser: true,
        dedupe: ['svelte']
      }),
      commonjs(),
      typescript({
        tsconfig: resolvedConfig => ({ ...resolvedConfig, declaration: false })
      })
    ]
  },
  {
    input: 'src/notify.ts',
    output: {
      format: 'es',
      file: 'dist/notify.js',
      sourcemap: 'inline'
    },
    onwarn: (warning, warn) => {
      if (warning.code === 'THIS_IS_UNDEFINED') {
        return
      }

      warn(warning)
    },
    plugins: [
      json(),
      svelte({
        preprocess: sveltePreprocess()
      }),
      resolve({
        browser: true,
        dedupe: ['svelte']
      }),
      commonjs(),
      typescript()
    ],
    external: [
      'bignumber.js',
      'bnc-sdk',
      'lodash.debounce',
      'uuid/v4',
      'regenerator-runtime/runtime'
    ]
  }
]
