// http://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      "jsx": true
    }
  },
  env: {
    browser: true,
  },
  // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  extends: [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  // required to lint *.vue files
  plugins: [
    'html',
    'react'
  ],
  // add your custom rules here
  rules: {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    "promise/catch-or-return": 1,
    "promise/no-unknown-property": 1,
    "semi": 0,
    "comma-dangle": 0,
    "react/jsx-uses-react": 1,
    "react/react-in-jsx-scope": 1,
    "react/jsx-uses-vars": 1,
    "react/prop-types": 1,
    "react/no-unknown-property": 1,
    "react/no-find-dom-node": 1,
    "no-undef": 1,
    "no-unused-vars": 1,
    "space-before-function-paren": 1,
    "eol-last": 1
  },
  globals: {
    ENV: true,
    "jest": true,
    "expect": true,
    "mockFn": true,
    "config": true,
    "afterEach": true,
    "beforeEach": true,
    "describe": true,
    "it": true,
    "runs": true,
    "waitsFor": true,
    "pit": true,
    "require": true,
    "xdescribe": true,
    "xit": true,
    "module": false,
  }
}