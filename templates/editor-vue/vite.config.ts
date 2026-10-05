import vue from '@vitejs/plugin-vue';
import { isKantoElement } from 'kanto-ds/vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue({ template: { compilerOptions: { isCustomElement: isKantoElement } } })],
});
