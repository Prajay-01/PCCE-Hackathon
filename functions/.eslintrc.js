module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2020,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["off", "double", {"allowTemplateLiterals": true}],
    "require-jsdoc": "off",
    "valid-jsdoc": "off",
    "max-len": "off",
    "linebreak-style": "off",
    "no-trailing-spaces": "off",
    "comma-dangle": "off",
    "indent": "off",
    "arrow-parens": "off",
    "object-curly-spacing": "off",
    "padded-blocks": "off",
  },
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
