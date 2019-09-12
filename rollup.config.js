import svelte from "rollup-plugin-svelte"
import resolve from "rollup-plugin-node-resolve"
import babel from "rollup-plugin-babel"
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
      file: "dist/iife/bn-notify.js"
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
      "sirv-cli",
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
