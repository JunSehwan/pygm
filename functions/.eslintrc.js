module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2018,
    "sourceType": "module",
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "object-curly-spacing": ["error", "always"],
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",

    "valid-jsdoc": 0,
    "quotes": ["error", "double", {
      "allowTemplateLiterals": true,
    }],
    "indent": "off",
    "semi": "off",
    "max-len": "off",
  },
  // 'require-jsdoc': [
  //   'error',
  //   {
  //     "require": {
  //       FunctionDeclaration: false,
  //       MethodDefinition: false,
  //       ClassDeclaration: false,
  //       ArrowFunctionExpression: false,
  //       FunctionExpression: false,
  //     },
  //   },
  // ],
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
