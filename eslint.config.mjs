// Aturan inti ESLint (tanpa paket tambahan): menangkap variabel/impor tak terpakai dan kesalahan logika umum.
// `no-undef` belum aktif karena membutuhkan paket `globals` untuk daftar global browser/Node/Jest.
const aturanInti = {
  'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true }],
  'no-unreachable': 'error', 'no-dupe-keys': 'error', 'no-dupe-args': 'error', 'no-dupe-else-if': 'error', 'no-duplicate-case': 'error',
  'no-const-assign': 'error', 'no-self-assign': 'error', 'no-self-compare': 'error', 'no-unsafe-finally': 'error', 'no-unsafe-negation': 'error',
  'no-func-assign': 'error', 'no-import-assign': 'error', 'no-class-assign': 'error', 'no-compare-neg-zero': 'error', 'no-cond-assign': 'error',
  'no-constant-binary-expression': 'error', 'no-empty-pattern': 'error', 'no-invalid-regexp': 'error', 'no-loss-of-precision': 'error',
  'no-sparse-arrays': 'error', 'no-unsafe-optional-chaining': 'error', 'use-isnan': 'error', 'valid-typeof': 'error', 'no-useless-catch': 'error',
  'no-unused-labels': 'error', 'getter-return': 'error', 'no-setter-return': 'error', 'for-direction': 'error', 'no-async-promise-executor': 'error',
};

export default [
  // lz-string.js adalah salinan pustaka pihak ketiga: tidak diubah, tidak di-lint.
  { ignores: ['**/dist/**', '**/node_modules/**', 'backup/**', '**/lz-string.js'] },
  { files: ['**/*.js', '**/*.mjs'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module' }, rules: aturanInti },
  { files: ['jest.config.js'], languageOptions: { sourceType: 'commonjs' } },
];
