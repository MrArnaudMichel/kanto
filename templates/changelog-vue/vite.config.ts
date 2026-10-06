import vue from '@vitejs/plugin-vue';
import { isKantoElement } from 'kanto-ds/vue';
import { defineConfig } from 'vite';
import { feed } from './vite-feed';

export default defineConfig({
  plugins: [vue({ template: { compilerOptions: { isCustomElement: isKantoElement } } }), feed()],
});
