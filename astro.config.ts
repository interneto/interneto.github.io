import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://interneto.github.io',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  redirects: {
    '/toolbox-installer': '/toolbox/',
    // Routes renamed: posts/post -> blog (listing + articles).
    '/posts': '/blog/',
    '/post/[...slug]': '/blog/[...slug]',
  },
  vite: {
    optimizeDeps: {
      exclude: ['d3'],
    },
  },
  build: {
    format: 'directory',
  },
});
