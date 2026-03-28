/// <reference types="vite/client" />

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
  export function createSearchTranslate(translations: any): (key: string) => string
}
