import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://interneto.github.io',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  vite: {
    optimizeDeps: {
      exclude: ['d3'],
    },
  },
  build: {
    format: 'directory',
  },
});
