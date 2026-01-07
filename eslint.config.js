// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("@angular-eslint/eslint-plugin");
const angularTemplate = require("@angular-eslint/eslint-plugin-template");
const angularTemplateParser = require("@angular-eslint/template-parser");
const prettierPlugin = require("eslint-plugin-prettier");
const prettierConfig = require("eslint-config-prettier");

module.exports = tseslint.config(
  {
    // Global ignores
    ignores: ["dist/**", ".angular/**", "coverage/**", ".yarn/**", "node_modules/**"],
  },

  // Base ESLint recommended
  eslint.configs.recommended,

  // TypeScript recommended & stylistic
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,

  // Configuration for TypeScript files
  {
    files: ["**/*.ts"],
    plugins: {
      "@angular-eslint": angular,
      prettier: prettierPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
    },
    rules: {
      "prettier/prettier": "error",
      "@angular-eslint/directive-selector": [
        "error",
        { type: "attribute", prefix: "app", style: "camelCase" },
      ],
      "@angular-eslint/component-selector": [
        "error",
        { type: "element", prefix: "app", style: "kebab-case" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // Custom MPI Rule Placeholder: 
      // You can add rules here to enforce use of execute_merge_query_with_context
    },
  },

  // HTML template files
  {
    files: ["**/*.html"],
    languageOptions: {
      parser: angularTemplateParser,
    },
    plugins: {
      "@angular-eslint/template": angularTemplate,
      prettier: prettierPlugin,
    },
    rules: {
      ...angularTemplate.configs.recommended.rules,
      "prettier/prettier": ["error", { parser: "angular" }],
    },
  },

  // Disable rules that conflict with Prettier (must be last)
  prettierConfig
);
