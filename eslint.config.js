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
    ignores: ["dist/**", ".angular/**", "coverage/**", ".yarn/**"],
  },
  
  // Apply base configs only to TypeScript files
  {
    files: ["**/*.ts"],
    ...eslint.configs.recommended,
  },
  
  // Apply TypeScript configs only to .ts files
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ["**/*.ts"],
  })),
  ...tseslint.configs.stylistic.map(config => ({
    ...config,
    files: ["**/*.ts"],
  })),
  
  // Angular and Prettier rules for TypeScript
  {
    files: ["**/*.ts"],
    plugins: {
      "@angular-eslint": angular,
      prettier: prettierPlugin,
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
      "prettier/prettier": ["error", { parser: "angular" }],
    },
  },
  
  // Prettier config last
  prettierConfig,
];
