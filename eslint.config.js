// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("@angular-eslint/eslint-plugin");
const angularTemplate = require("@angular-eslint/eslint-plugin-template");
const angularTemplateParser = require("@angular-eslint/template-parser");
const prettierPlugin = require("eslint-plugin-prettier");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  {
    // Global ignores
    ignores: ["dist/**", ".angular/**", "coverage/**", ".yarn/**", "node_modules/**"],
  },
  
  // Base ESLint recommended for TypeScript files only
  {
    files: ["**/*.ts"],
    ...eslint.configs.recommended,
  },
  
  // TypeScript configs - only for .ts files
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ["**/*.ts"],
  })),
  ...tseslint.configs.stylistic.map(config => ({
    ...config,
    files: ["**/*.ts"],
  })),
  
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
      "@angular-eslint/template/prefer-control-flow": "off",
    },
  },
  
  // Disable rules that conflict with Prettier (must be last)
  prettierConfig,
];