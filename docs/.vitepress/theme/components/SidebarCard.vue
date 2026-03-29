<script setup lang="ts">
import ColorPicker from './ColorPicker.vue'
import InputField from './InputField.vue'
import ThemeSelector from './ThemeSelector.vue'
import ToggleStarred from './ToggleStarred.vue'
</script>

<template>
  <div
    class="bg-$vp-c-bg hover:bg-$vp-c-bg/40 border-$vp-c-default-soft hover:border-primary transition-border relative z-0 rounded-lg border-2 border-solid p-5 duration-500"
  >
    <InputField id="toggle-starred" label="⭐ Favorite Links">
      <template #display>
        <ToggleStarred />
      </template>
    </InputField>

    <div class="mt-4">
      <ColorPicker />
    </div>

    <div class="mt-6 pt-6 border-t border-$vp-c-divider">
      <ThemeSelector />
    </div>
  </div>
</template>
