import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { feed } from './vite-feed';

export default defineConfig({ plugins: [react(), feed()] });
