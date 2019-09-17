import svelte from "rollup-plugin-svelte"
import resolve from "rollup-plugin-node-resolve"
import babel from "rollup-plugin-babel"
import globals from "rollup-plugin-node-globals"
import commonjs from "rollup-plugin-commonjs"
import builtins from "rollup-plugin-node-builtins"
import json from "rollup-plugin-json"
import { terser } from "rollup-plugin-terser"

export default [
  {
    input: "src/index.js",
    output: {
      format: "iife",
      name: "notify",
      file: "dist/iife/notify.js",
      esModule: false
    },
    plugins: [
      svelte(),
      json(),
      resolve({
        preferBuiltins: true,
        browser: true,
        dedupe: importee =>
          importee === "svelte" || importee.startsWith("svelte/")
      }),
      commonjs(),
      babel({ exclude: "node_modules/**" }),
      builtins(),
      globals(),
      terser()
    ]
  },
  {
    input: "src/index.js",
    external: [
      "big-integer",
      "bn-sdk",
      "lodash.debounce",
      "ow",
      "svelte-i18n",
      "uuid/v4",
      "svelte",
      "svelte/store",
      "svelte/internal",
      "svelte/transition",
      "svelte/easing",
      "svelte/animate"
    ],
    plugins: [
      svelte(),
      json(),
      commonjs(),
      babel({ exclude: "node_modules/**" })
    ],
    output: [
      {
        dir: "dist/esm",
        format: "esm"
      },
      {
        dir: "dist/cjs",
        format: "cjs"
      }
    ]
  }
]
