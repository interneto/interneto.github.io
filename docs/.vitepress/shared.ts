/**
 *  Copyright (c) 2025 taskylizard. Apache License 2.0.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import type { DefaultTheme } from 'vitepress'

// @unocss-include

export const meta = {
  name: 'Interneto Links',
  description: 'Pass from the Internet to the Innernet!',
  hostname: 'https://interneto.github.io',
  keywords: ['stream', 'movies', 'gaming', 'reading', 'anime'],
  build: {
    api: false,
    nsfw: true
  }
}

export const excluded = [
  'readme.md',
  'single-page',
  'feedback.md',
  'index.md',
  'sandbox.md',
  'startpage.md'
]

export const nav: DefaultTheme.NavItem[] = [
  { text: '📑 Posts', link: '/posts/index' },
  { text: 'ℹ️ About', link: '/about' },
  { text: '🐙 GitHub', link: 'https://github.com/interneto/interneto.github.io' }
]

export const postsSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Posts',
    collapsed: false,
    items: [
      { text: 'Comparing AI Coding Tools', link: '/posts/ai-coding-tools' },
      { text: 'Comparing Bookmark Managers', link: '/posts/bookmark-managers' },
      { text: 'Cybersecurity Vulnerabilities', link: '/posts/cybersecurity-vulnerabilities' },
      { text: 'How Files Are Transferred and Synced Between Devices', link: '/posts/file-sync' },
      { text: 'How To Categorize Links', link: '/posts/how-to-categorize-links' },
      { text: 'What Is Information?', link: '/posts/what-is-info' }
    ]
  }
]

export const sidebar: DefaultTheme.Sidebar = {
  '/posts/': postsSidebar,
  '/': [
    {
      text: 'Categories',
      collapsed: false,
      items: [
      {
        text: '🏢 by_Company',
        link: '/by-company'
      },
      {
        text: '🐧 Operating System',
        link: '/os'
      },
      {
        text: '🧰 AI Tools and Services',
        link: '/ai-tools-and-services'
      },

      {
        text: '⌨️ Development',
        link: '/dev'
      },
      {
        text: '🎓 Education',
        link: '/education'
      },
      {
        text: '📁 File Management',
        link: '/file-management'
      },
      {
        text: '💰 Financial Assets',
        link: '/financial-assets'
      },
      {
        text: '🎮 Gaming',
        link: '/gaming'
      },
      {
        text: '❤️ Health and Fitness',
        link: '/health-and-fitness'
      },
      {
        text: '🏠 Home and Family',
        link: '/home-and-family'
      },
      {
        text: '☎️ Intercommunication',
        link: '/intercomm'
      },
      {
        text: '📺 Multimedia',
        link: '/multimedia'
      },
      {
        text: '📰 News and Media',
        link: '/news-media'
      },
      {
        text: '💼 Office and Productivity',
        link: '/office-and-productivity'
      },
      {
        text: '🌐 Online Services',
        link: '/online-services'
      },
      {
        text: '🛡️ Security and Privacy',
        link: '/security-and-privacy'
      },
      {
        text: '💻 System Administration',
        link: '/sys-admin'
      },
      {
        text: '🕐 Time',
        link: '/time'
      },
      {
        text: '🌎 Travel and Location',
        link: '/travel-and-location'
      },
      {
        text: '🛠️ Utility',
        link: '/utility'
      }
    ]
  }
]
}
