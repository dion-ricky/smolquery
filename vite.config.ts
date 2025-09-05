import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // @ts-ignore - vitest `test` option is not part of Vite's typed config in this environment
  test: {
    environment: 'jsdom',
    // Add server dependencies to be optimized in tests
    server: {
      deps: {
        // Handle monaco-editor in test environment
        inline: ['monaco-editor']
      }
    }
  }
});  // Removed 'as any'
