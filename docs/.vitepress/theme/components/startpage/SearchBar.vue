<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import Clock from './Clock.vue'

export interface PlatformType {
  name: string
  key: string
  url: string
  icon?: string
  color?: string
}

const props = defineProps<{
  onFocusChange: (focused: boolean) => void
  initialQuery?: string
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const query = ref(props.initialQuery ?? '')
const isInputFocused = ref(false)
const showShortcuts = ref(false)

function handleInputFocus() {
  isInputFocused.value = true
  props.onFocusChange(true)
}

function handleInputBlur() {
  isInputFocused.value = false
  props.onFocusChange(false)
}

function handlePlatformClick(platform: PlatformType) {
  if (!query.value.trim()) return
  window.open(platform.url + encodeURIComponent(query.value.trim()), '_self')
}

function platformClass() {
  const base =
    'widget-card group relative widget-button rounded-md bg-bg-elv p-2 border transition-transform'
  const disabled = !query.value.trim()
  const highlight = showShortcuts.value && isInputFocused.value
  return [
    base,
    disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
    highlight ? 'border-2 border-primary scale-105' : 'border-div'
  ].join(' ')
}

onMounted(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const active = document.activeElement
    const isSearchFocused = inputRef.value === active

    if (e.key === '/' && !isSearchFocused) {
      const typingInInput =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          (active instanceof HTMLElement && active.isContentEditable))
      if (!typingInInput) {
        e.preventDefault()
        inputRef.value?.focus()
      }
      return
    }

    if (e.altKey) showShortcuts.value = true
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    if (!e.altKey) showShortcuts.value = false
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  })
})
</script>

<template>
  <div class="flex flex-col items-start w-full space-y-4 antialiased">
    <Clock />
  </div>
</template>
