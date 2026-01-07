/** @type {import("prettier").Config} */
const config = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  bracketSpacing: true,
  bracketSameLine: true,
  arrowParens: 'avoid',

  // Plugins are essential for Angular 21/Yarn 3 setups
  plugins: [
    'prettier-plugin-organize-imports', // Auto-sorts your imports
  ],

  overrides: [
    {
      files: ['*.html'],
      options: {
        parser: 'angular',
      },
    },
    {
      files: ['*.component.html'],
      options: {
        parser: 'angular',
      },
    },
    {
      files: ['*.scss'],
      options: {
        parser: 'scss',
      },
    },
  ],
};

module.exports = config;
