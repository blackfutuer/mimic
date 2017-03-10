import babel from 'rollup-plugin-babel'
import eslint from 'rollup-plugin-eslint'
import uglify from 'rollup-plugin-uglify'
import replace from 'rollup-plugin-replace'
import filesize from 'rollup-plugin-filesize'
import progress from 'rollup-plugin-progress'
// import visualizer from 'rollup-plugin-visualizer'
// import livereload from 'rollup-plugin-livereload'

export default {
  entry: 'src/main.js',
  dest: 'build/mimic.js',
  format: 'iife',
  sourceMap: true,
  plugins: [
    eslint({
      exclude: [
        'src/pollyfill/**'
      ]
    }),
    babel({
      exclude: 'node_modules/**'
    }),
    replace({
      ENV: JSON.stringify(process.env.NODE_ENV || 'development')
    }),
    // (process.env.NODE_ENV !== 'production' && livereload({
    //   watch: 'build'
    // })),
    (process.env.NODE_ENV === 'production' && uglify({
      mangleProperties: {
        regex: /^_/
      }
    })),
    filesize(),
    // visualizer({
    //   filename: 'build/visualizer.html'
    // }),
    progress({
      clearLine: false // default: true
    })
  ]
}