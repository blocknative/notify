import svelte from 'rollup-plugin-svelte'
import resolve from 'rollup-plugin-node-resolve'
import json from '@rollup/plugin-json'
import commonjs from 'rollup-plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'

import {
  preprocess,
  createEnv,
  readConfigFile,
} from '@pyoner/svelte-ts-preprocess'

const env = createEnv()
const compilerOptions = readConfigFile(env)
const opts = {
  env,
  compilerOptions: {
    ...compilerOptions,
    allowNonTsExtensions: true,
  },
}

export default [
  {
    input: 'src/notify.ts',
    output: {
      format: 'umd',
      name: 'notify',
      file: 'dist/notify.umd.js',
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
        preprocess: preprocess(opts),
      }),
      resolve({
        browser: true,
        dedupe: (importee) =>
          importee === 'svelte' || importee.startsWith('svelte/'),
      }),
      commonjs(),
      typescript(),
    ],
  },
  {
    input: 'src/notify.ts',
    output: {
      sourcemap: true,
      format: 'es',
      file: 'dist/notify.esm.js',
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
        preprocess: preprocess(opts),
      }),
      resolve({
        browser: true,
        dedupe: (importee) =>
          importee === 'svelte' || importee.startsWith('svelte/'),
      }),
      commonjs(),
      typescript(),
    ],
    external: [
      'bignumber.js',
      'bnc-sdk',
      'lodash.debounce',
      'uuid/v4',
      'regenerator-runtime/runtime',
    ],
  },
]
