export default [
  { ignores: ['**/dist/**', '**/node_modules/**'] },
  { files: ['**/*.js', '**/*.mjs'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
  { files: ['jest.config.js'], languageOptions: { sourceType: 'commonjs' } },
];
