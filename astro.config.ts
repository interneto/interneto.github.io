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
    // Compatibility tables merged into their installer page as a view toggle.
    '/toolbox/desktop-os-compatibility': '/toolbox/desktop/#compat',
    '/toolbox-installer/desktop-os-compatibility': '/toolbox/desktop/#compat',
    '/toolbox/mobile-os-compatibility': '/toolbox/mobile/#compat',
    '/toolbox-installer/mobile-os-compatibility': '/toolbox/mobile/#compat',
    '/toolbox/browser-extensions-compatibility': '/toolbox/browser/#compat',
    '/toolbox-installer/browser-extensions-compatibility': '/toolbox/browser/#compat',
    '/toolbox/vscode-extensions-compatibility': '/toolbox/vscode/#compat',
    '/toolbox-installer/vscode-extensions-compatibility': '/toolbox/vscode/#compat',
    '/toolbox/lib-compatibility': '/toolbox/lib/#compat',
    '/toolbox-installer/lib-compatibility': '/toolbox/lib/#compat',
    '/toolbox/agents-compatibility': '/toolbox/agents/#compat',
    '/toolbox-installer/agents-compatibility': '/toolbox/agents/#compat',
    '/toolbox/os-compatibility': '/toolbox/os/#compat',
    '/toolbox-installer/os-compatibility': '/toolbox/os/#compat',
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
