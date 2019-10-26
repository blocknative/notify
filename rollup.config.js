import svelte from "rollup-plugin-svelte"
import resolve from "rollup-plugin-node-resolve"
import babel from "rollup-plugin-babel"
import globals from "rollup-plugin-node-globals"
import commonjs from "rollup-plugin-commonjs"
import builtins from "@joseph184/rollup-plugin-node-builtins"
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
    moduleContext: id => {
      const thisAsWindowForModules = [
        "node_modules/intl-messageformat/lib/core.js",
        "node_modules/intl-messageformat/lib/compiler.js"
      ]

      if (thisAsWindowForModules.some(id_ => id.trimRight().endsWith(id_))) {
        return "window"
      }
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
      "bignumber.js",
      "bnc-sdk",
      "lodash.debounce",
      "uuid/v4",
      "regenerator-runtime/runtime"
    ],
    plugins: [
      svelte(),
      json(),
      resolve(),
      commonjs(),
      babel({ exclude: "node_modules/**" })
    ],
    moduleContext: id => {
      const thisAsWindowForModules = [
        "node_modules/intl-messageformat/lib/core.js",
        "node_modules/intl-messageformat/lib/compiler.js"
      ]

      if (thisAsWindowForModules.some(id_ => id.trimRight().endsWith(id_))) {
        return "window"
      }
    },
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
