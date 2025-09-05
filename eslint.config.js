import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import eslintPluginVue from 'eslint-plugin-vue';
import * as vueParser from 'vue-eslint-parser';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{vue,ts}'],
    plugins: {
      '@typescript-eslint': tseslint,
      'vue': eslintPluginVue,
    },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: {
          ts: tsparser,
          js: 'espree',
          '<template>': 'espree'
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    }
  }
];
