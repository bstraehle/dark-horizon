// @ts-check
import globals from "globals";
import js from "@eslint/js";
import eslintPluginJSDoc from "eslint-plugin-jsdoc";

/**
 * Flat ESLint config for a browser JS project with JSDoc.
 */
export default [
  // Always ignore build artifacts and deps
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  // Base recommended rules
  js.configs.recommended,
  // Project rules
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      jsdoc: eslintPluginJSDoc,
    },
    rules: {
      "no-console": "off",
  "eqeqeq": ["error", "always"],
  "consistent-return": "error",
  "no-loop-func": "error",
  "no-implicit-globals": "error",
      "no-param-reassign": "off",
      "no-plusplus": "off",
      "no-bitwise": "off",
      "no-undef": "error",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "jsdoc/check-alignment": "warn",
      "jsdoc/check-param-names": "warn",
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
    },
    settings: {
      jsdoc: {
        mode: "typescript",
      },
    },
  },
];
