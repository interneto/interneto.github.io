<script setup lang="ts">
defineProps<{
  heading?: string
}>()
</script>

<template>
  <a
    class="feedback-link"
    href="/other/contributing"
    title="Suggest an improvement"
  >
    Suggest edit
  </a>
</template>

<style scoped>
.feedback-link {
  margin-right: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.feedback-link:hover {
  text-decoration: underline;
}
</style>
