import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://interneto.github.io',
  base: '/',
  output: 'static',
  vite: {
    optimizeDeps: {
      exclude: ['d3'],
    },
  },
  build: {
    format: 'file',
  },
});
