import { defineConfig } from 'vite';
import { feed } from './vite-feed';

export default defineConfig({ plugins: [feed()] });
