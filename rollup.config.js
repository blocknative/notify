import svelte from "rollup-plugin-svelte"
import resolve from "rollup-plugin-node-resolve"
import commonjs from "rollup-plugin-commonjs"
import livereload from "rollup-plugin-livereload"
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
  plugins: [
    svelte({
      // enable run-time checks when not in production
      dev: !production
      // we'll extract any component CSS out into
      // a separate file — better for performance
      // css: css => {
      //   css.write('public/bundle.css')
      // }
    }),

    json(),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration —
    // consult the documentation for details:
    // https://github.com/rollup/rollup-plugin-commonjs
    resolve({ browser: true }),
    commonjs(),

    // string({
    //   include: 'public/*.css'
    // }),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload("public"),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser()
  ],
  watch: {
    clearScreen: false
  }
}
