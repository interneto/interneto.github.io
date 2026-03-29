import { fileURLToPath } from 'node:url'
import consola from 'consola'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import OptimizeExclude from 'vite-plugin-optimize-exclude'
import { VitePWA } from 'vite-plugin-pwa'
import Terminal from 'vite-plugin-terminal'
import { defineConfig } from 'vitepress'
import { meta, nav, search, sidebar } from './constants'
import { generateFeed, generateImages, generateMeta } from './hooks'
import { defs, emojiRender } from './markdown/emoji'
import { headersPlugin } from './markdown/headers'
import { toggleStarredPlugin } from './markdown/toggleStarred'
import { replaceNoteLink } from './utils/markdown'

// @unocss-include

// Base del sitio (correcto para https://interneto.github.io/)
const base = '/'

// Helper para evitar rutas absolutas rotas
const withBase = (p: string): string => `${base}${p.replace(/^\/+/, '')}`

export default defineConfig({
  title: 'Interneto Links',
  description: meta.description,
  titleTemplate: ':title • Pass from the Internet to the Innernet',
  lang: 'en-US',
  lastUpdated: false,
  cleanUrls: true,
  appearance: true,
  base,

  srcExclude: ['README.md', 'single-page', 'z/**', 'apps-import/**'],
  ignoreDeadLinks: true,

  sitemap: {
    hostname: meta.hostname
  },

  head: [
    ['meta', { name: 'theme-color', content: '#7bc5e4' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],

    ['link', { rel: 'icon', href: withBase('favicon.ico') }],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: withBase('favicon-32x32.png')
      }
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: withBase('favicon-16x16.png')
      }
    ],

    ['link', { rel: 'manifest', href: withBase('manifest.json') }],
    ['link', { rel: 'alternate icon', href: withBase('favicon.ico') }],
    [
      'link',
      { rel: 'mask-icon', href: withBase('note.svg'), color: '#000000ff' }
    ],
    [
      'link',
      {
        rel: 'apple-touch-icon',
        href: withBase('apple-touch-icon.png'),
        sizes: '180x180'
      }
    ],

    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    [
      'meta',
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
    ]
  ],

  transformHead: async (context) => generateMeta(context, meta.hostname),

  buildEnd: async (context) => {
    generateImages(context)
      .then(() => generateFeed(context))
      .finally(() => consola.success('Success!'))
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          charset: false
        }
      }
    },

    resolve: {
      alias: [
        {
          find: /^.*VPSwitchAppearance\.vue$/,
          replacement: fileURLToPath(
            new URL('./theme/components/ThemeDropdown.vue', import.meta.url)
          )
        },
        {
          find: /^.*VPLocalSearchBox\.vue$/,
          replacement: fileURLToPath(
            new URL('./theme/components/VPLocalSearchBox.vue', import.meta.url)
          )
        },
        {
          find: /^.*VPNav\.vue$/,
          replacement: fileURLToPath(
            new URL('./theme/components/VPNav.vue', import.meta.url)
          )
        }
      ]
    },

    optimizeDeps: { exclude: ['workbox-window'] },

    plugins: [
      OptimizeExclude(),

      Terminal({
        console: 'terminal',
        output: ['console', 'terminal']
      }),

      UnoCSS({
        configFile: fileURLToPath(
          new URL('../../unocss.config.ts', import.meta.url)
        )
      }),

      AutoImport({
        dts: '../.cache/imports.d.ts',
        imports: ['vue', 'vitepress'],
        vueTemplate: true,
        biomelintrc: {
          enabled: true,
          filepath: './.cache/imports.json'
        }
      }),

      VitePWA({
        registerType: 'autoUpdate',

        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
        },

        manifest: {
          name: 'Interneto Links',
          short_name: 'Interneto',
          description: 'The largest collection of free stuff on the internet!',
          theme_color: '#000000ff',
          background_color: '#000000ff',

          display: 'standalone',
          orientation: 'portrait',

          start_url: base,
          scope: base,

          icons: [
            {
              src: withBase('android-chrome-192x192.png'),
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: withBase('android-chrome-512x512.png'),
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],

    build: {
      chunkSizeWarningLimit: Number.POSITIVE_INFINITY
    }
  },

  markdown: {
    emoji: { defs },
    config(md) {
      md.use(emojiRender)
      md.use(toggleStarredPlugin)
      if (meta.build.api) md.use(headersPlugin)
      replaceNoteLink(md)
    }
  },

  themeConfig: {
    search,

    footer: {
      message:
        '<a href="https://github.com/interneto" target="_blank" rel="noopener noreferrer">GitHub</a> · <a href="https://interneto.raindrop.page/" target="_blank" rel="noopener noreferrer">raindrop.io</a> · <a href="https://twitter.com/internetoOK" target="_blank" rel="noopener noreferrer">X</a>',
      copyright: `© ${new Date().getFullYear()} Interneto. Curated link directory.`
    },

    outline: 'deep',

    logo: {
      src: withBase('icon.png'),
      alt: 'Interneto Logo'
    },

    nav,
    sidebar
  }
})
