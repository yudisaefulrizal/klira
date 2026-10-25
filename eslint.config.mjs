import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', 'jest.config.js'] },
  ...tseslint.configs.recommended,
);
