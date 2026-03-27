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
    name: 'freemediaheckyeah',
    description: 'The largest collection of free stuff on the internet!',
    hostname: 'https://fmhy.net',
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

const safeEnv = (key: string) => typeof process !== 'undefined' ? process.env?.[key] : undefined

if (safeEnv('FMHY_BUILD_NSFW') === 'false') {
    meta.build.nsfw = false
}
if (safeEnv('FMHY_BUILD_API') === 'false') {
    meta.build.api = false
}

const formatCommitRef = (commitRef: string) =>
    `<a href="https://github.com/fmhy/edit/commit/${commitRef}">${commitRef.slice(0, 8)}</a>`

const cfStart = safeEnv('CF_PAGES_COMMIT_SHA')
const commitStart = safeEnv('COMMIT_REF')

export const commitRef =
    safeEnv('CF_PAGES') && cfStart
        ? formatCommitRef(cfStart)
        : commitStart
            ? formatCommitRef(commitStart)
            : 'dev'

export const feedback = `<a href="/feedback" class="feedback-footer">Made with ❤</a>`

export const socialLinks: DefaultTheme.SocialLink[] = [
    { icon: 'github', link: 'https://github.com/interneto' }
]

export const nav: DefaultTheme.NavItem[] = [
    { text: '📑 Posts', link: '/posts/index' },
    
]

export const sidebar: DefaultTheme.Sidebar | DefaultTheme.NavItemWithLink[] = [
    {
        text: 'Categories',
        collapsed: false,
        items: [
            {
                text: '<span class="i-twemoji:toolbox"></span> AI Tools and Services',
                link: '/ai-tools-and-services'
            },
            {
                text: '<span class="i-twemoji:building"></span> By Company',
                link: '/by-company'
            },
            {
                text: '<span class="i-twemoji:keyboard"></span> Development',
                link: '/dev'
            },
            {
                text: '<span class="i-twemoji:graduation-cap"></span> Education',
                link: '/education'
            },
            {
                text: '<span class="i-twemoji:file-folder"></span> File Management',
                link: '/file-management'
            },
            {
                text: '<span class="i-twemoji:money-bag"></span> Financial Assets',
                link: '/financial-assets'
            },
            {
                text: '<span class="i-twemoji:video-game"></span> Gaming',
                link: '/gaming'
            },
            {
                text: '<span class="i-twemoji:heart"></span> Health and Fitness',
                link: '/health-and-fitness'
            },
            {
                text: '<span class="i-twemoji:house"></span> Home and Family',
                link: '/home-and-family'
            },
            {
                text: '<span class="i-twemoji:telephone-receiver"></span> Intercommunication',
                link: '/intercomm'
            },
            {
                text: '<span class="i-twemoji:television"></span> Multimedia',
                link: '/multimedia'
            },
            {
                text: '<span class="i-twemoji:newspaper"></span> News and Media',
                link: '/news-media'
            },
            {
                text: '<span class="i-twemoji:briefcase"></span> Office and Productivity',
                link: '/office-and-productivity'
            },
            {
                text: '<span class="i-twemoji:globe-with-meridians"></span> Online Services',
                link: '/online-services'
            },
            {
                text: '<span class="i-twemoji:penguin"></span> Operating System',
                link: '/os'
            },
            {
                text: '<span class="i-twemoji:shield"></span> Security and Privacy',
                link: '/security-and-privacy'
            },
            {
                text: '<span class="i-twemoji:computer"></span> System Administration',
                link: '/sys-admin'
            },
            {
                text: '<span class="i-twemoji:clock-face-one"></span> Time',
                link: '/time'
            },
            {
                text: '<span class="i-twemoji:globe-showing-americas"></span> Travel and Location',
                link: '/travel-and-location'
            },
            {
                text: '<span class="i-twemoji:hammer-and-wrench"></span> Utility',
                link: '/utility'
            }
        ]
    },
    {
        text: 'More',
        collapsed: true,
        items: [
            meta.build.nsfw
                ? {
                    text: '<span class="i-twemoji:no-one-under-eighteen"></span> NSFW',
                    link: 'https://rentry.org/NSFW-Checkpoint'
                }
                : {}
        ]
    }
]
