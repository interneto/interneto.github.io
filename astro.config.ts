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
    // Routes renamed: categories -> directory, posts/post -> blog (listing + articles).
    '/categories': '/directory/',
    '/categories/[...slug]': '/directory/[...slug]',
    '/posts': '/blog/',
    '/post/[...slug]': '/blog/[...slug]',
    // Category renames (old → new taxonomy, June 2026)
    '/directory/os/': '/directory/os-and-utilities/',
    '/directory/dev/': '/directory/development/',
    '/directory/education/': '/directory/education-and-reference/',
    '/directory/financial-assets/': '/directory/money-and-finance/',
    '/directory/intercomm/': '/directory/social-and-communications/',
    '/directory/news-media/': '/directory/news-and-books/',
    '/directory/sys-admin/': '/directory/system-administration/',
    '/directory/network-and-admin/': '/directory/system-administration/',
    '/directory/time/': '/directory/office-and-productivity/',
    '/directory/utility/': '/directory/os-and-utilities/',
    // Multimedia split pages → unified Multimedia
    '/directory/audio-and-music/': '/directory/multimedia/',
    '/directory/photos-and-graphics/': '/directory/multimedia/',
    '/directory/video-and-movies/': '/directory/multimedia/',
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
