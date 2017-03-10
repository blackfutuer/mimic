/* global __dirname */

var path = require('path');

var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var dir_src = path.resolve(__dirname, 'src');
var dir_html = path.resolve(__dirname, 'html');
var dir_build = path.resolve(__dirname, 'build');

module.exports = {
  entry: path.resolve(dir_src, 'main.js'),
  output: {
    path: dir_build,
    filename: 'mimic.js'
  },
  devServer: {
    contentBase: dir_build,
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        enforce: "pre",
        loader: 'eslint-loader',
        options: {
          formatter: require('eslint-friendly-formatter')
        },
        include: [
          dir_src
        ],
        exclude: /node_modules/
      },
      {
        loader: 'babel-loader',
        test: dir_src,
        query: {
          //presets: ['es2015'],

          // All of the plugins of babel-preset-es2015,
          // minus babel-plugin-transform-es2015-modules-commonjs
          plugins: [
            'transform-es2015-template-literals',
            'transform-es2015-literals',
            'transform-es2015-function-name',
            'transform-es2015-arrow-functions',
            'transform-es2015-block-scoped-functions',
            'transform-es2015-classes',
            'transform-es2015-object-super',
            'transform-es2015-shorthand-properties',
            'transform-es2015-computed-properties',
            'transform-es2015-for-of',
            'transform-es2015-sticky-regex',
            'transform-es2015-unicode-regex',
            'check-es2015-constants',
            'transform-es2015-spread',
            'transform-es2015-parameters',
            'transform-es2015-destructuring',
            'transform-es2015-block-scoping',
            'transform-es2015-typeof-symbol',
            ['transform-regenerator', { async: false, asyncGenerators: false }]
          ]
        }
      }
    ]
  },
  plugins: [
    // Simply copies the files over
    new CopyWebpackPlugin([
      { from: dir_html }, // to: output.path,
      { from: path.resolve(__dirname, 'src/pollyfill'), to: 'pollyfill'}
    ]),
    // Avoid publishing files when compilation fails
    new webpack.NoEmitOnErrorsPlugin(),
    // 配置一些全局的pollyfill
    // new webpack.ProvidePlugin({
    //     Promise: 'es6-promise'
    // })
  ],
  stats: {
    // Nice colored output
    colors: true
  },
  // Create source maps for the bundle
  devtool: 'source-map'
};
