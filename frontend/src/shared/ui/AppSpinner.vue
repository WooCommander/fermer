<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  // Накрывает родительский блок (у него должен быть position: relative) и блокирует клики под собой
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  label: '',
  overlay: false,
})
</script>

<template>
  <div :class="['app-spinner', `size-${props.size}`, { 'is-overlay': props.overlay }]" role="status" aria-live="polite">
    <span class="spinner-ring" aria-hidden="true" />
    <span v-if="props.label" class="spinner-label">{{ props.label }}</span>
    <span v-else class="sr-only">Загрузка…</span>
  </div>
</template>

<style scoped lang="scss">
.app-spinner {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  color: #10b981;

  &.is-overlay {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    background: rgba(255, 255, 255, 0.7);
    border-radius: inherit;
    backdrop-filter: blur(1px);
  }
}

.spinner-ring {
  display: block;
  border: 3px solid rgba(16, 185, 129, 0.2);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: app-spinner-rotate 0.75s linear infinite;

  .size-sm & { width: 18px; height: 18px; border-width: 2px; }
  .size-md & { width: 32px; height: 32px; }
  .size-lg & { width: 52px; height: 52px; border-width: 4px; }
}

.spinner-label {
  color: #475569;
  font-size: 0.85rem;
  font-weight: 600;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

@keyframes app-spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner-ring {
    animation-duration: 2s;
  }
}
</style>
