<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const STORAGE_KEY = 'vitepress-brand-color'
const palette = ['#38bdf8', '#22c55e', '#f97316', '#ef4444', '#a855f7']

const active = ref(palette[0])

const ensureStyleTag = () => {
  let style = document.getElementById('brand-color') as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = 'brand-color'
    document.head.appendChild(style)
  }
  return style
}

const makeSoft = (hex: string) => {
  const h = hex.replace('#', '')
  const r = Number.parseInt(h.slice(0, 2), 16)
  const g = Number.parseInt(h.slice(2, 4), 16)
  const b = Number.parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, 0.16)`
}

const applyColor = (hex: string) => {
  active.value = hex
  localStorage.setItem(STORAGE_KEY, hex)
  const style = ensureStyleTag()
  style.textContent = `:root{--vp-c-brand-1:${hex};--vp-c-brand-2:${hex};--vp-c-brand-3:${hex};--vp-c-brand-soft:${makeSoft(hex)}}`
}

const reapplyFromStorage = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && palette.includes(saved)) {
    applyColor(saved)
    return
  }
  applyColor(active.value)
}

const onThemeChanged = () => reapplyFromStorage()

onMounted(() => {
  reapplyFromStorage()
  window.addEventListener('theme-changed-apply-colors', onThemeChanged)
})

onBeforeUnmount(() => {
  window.removeEventListener('theme-changed-apply-colors', onThemeChanged)
})
</script>

<template>
  <div>
    <div class="mb-2 text-sm text-$vp-c-text-2">Brand color</div>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="color in palette"
        :key="color"
        :aria-label="`Set brand color ${color}`"
        class="h-6 w-6 cursor-pointer rounded-full border border-$vp-c-divider"
        :class="
          active === color
            ? 'ring-2 ring-$vp-c-brand-1 ring-offset-2 ring-offset-$vp-c-bg'
            : ''
        "
        :style="{ backgroundColor: color }"
        type="button"
        @click="applyColor(color)"
      />
    </div>
  </div>
</template>
