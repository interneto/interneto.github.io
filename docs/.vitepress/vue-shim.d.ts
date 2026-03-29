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
/* eslint-disable ts/consistent-type-imports */
interface ImportMetaEnv {
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly hot?: import('vite').ViteHotContext
}

declare module '*.vue' {
  const component: import('vue').Component
  export default component
}

declare module 'vitepress/dist/client/theme-default/composables/nav' {
  export function useNav(): {
    isScreenOpen: import('vue').Ref<boolean>
    openScreen: () => void
    closeScreen: () => void
    toggleScreen: () => void
  }
}

declare module 'vitepress/dist/client/theme-default/components/VPNavBar.vue' {
  const component: import('vue').Component
  export default component
}

declare module 'vitepress/dist/client/theme-default/components/VPNavScreen.vue' {
  const component: import('vue').Component
  export default component
}

declare module '@localSearchIndex' {
  const index: Record<string, () => Promise<{ default: string }>>
  export default index
}

declare module 'mark.js/src/vanilla.js' {
  export default class Mark {
    constructor(ctx: Element | Element[])
    unmark(options?: { done?: () => void }): void
    markRegExp(re: RegExp, options?: { done?: () => void }): void
  }
}

declare module 'vitepress/types/local-search' {
  export interface ModalTranslations {
    displayDetails: string
    resetButtonTitle: string
    backButtonTitle: string
    noResultsText: string
    footer: {
      selectText: string
      selectKeyAriaLabel: string
      navigateText: string
      navigateUpKeyAriaLabel: string
      navigateDownKeyAriaLabel: string
      closeText: string
      closeKeyAriaLabel: string
    }
  }
}

declare module 'vitepress/dist/client/app/utils' {
  export function pathToFile(path: string): string | undefined
}

declare module 'vitepress/dist/client/shared' {
  export function escapeRegExp(str: string): string
}

declare module 'vitepress/dist/client/theme-default/composables/data' {
  export function useData(): any
}

declare module 'vitepress/dist/client/theme-default/support/lru' {
  export class LRUCache<K, V> {
    constructor(capacity: number)
    get(key: K): V | undefined
    set(key: K, value: V): void
    clear(): void
  }
}

declare module 'vitepress/dist/client/theme-default/support/translation' {
  export function createSearchTranslate(
    translations: any
  ): (key: string) => string
}
