import ParserTypeScript from '@typescript-eslint/parser';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
  plugins: {
    'typescript-eslint': ParserTypeScript,
    prettier: prettierPlugin
  },
  ignores: ['build', 'node_modules', 'coverage', 'eslint.config.js'],
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.es2022
    },
    parserOptions: {
      ecmaVersion: 'latest'
    }
  },
  rules: {
    ...prettierPlugin.configs.recommended.rules,
    ...eslintConfigPrettier.rules,
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/no-explicit-any': 'warn',
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
    'no-constant-binary-expression': 'off'
  }
});
