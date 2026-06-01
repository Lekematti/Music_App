const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-console": "off",
    }
  },
  {
    files: [
      "frontend/**/*.js", 
      "backend/tests/**/*.js", 
      "backend/tests/**/*.mjs", 
      "vite.config.js", 
      "vitest.config.js",
      "frontend/tests/**/*.js"
    ],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.jest,
        vi: "readonly"
      }
    }
  }
];