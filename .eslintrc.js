module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  extends: 'standard',
  // add your custom rules here
  'rules': {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    'no-eval': 0,
    'no-new': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'no-control-regex': 0
  },
  globals: {
    SinaAD: false,
    fetch: false,
    Headers: false,
    Response: false,
    Request: false,
    FormData: false,
    Promise: false,
    IntersectionObserver: false,
    alert: false,
    Image: false
  }
}