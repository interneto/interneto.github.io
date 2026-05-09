import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://interneto.github.io',
  base: '/',
  output: 'static',
  build: {
    format: 'file',
  },
});
