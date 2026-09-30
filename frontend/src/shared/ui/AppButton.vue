<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button',
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

function onClick(event: MouseEvent): void {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :class="['app-btn', `variant-${props.variant}`, `size-${props.size}`, { 'is-loading': props.loading }]"
    @click="onClick"
  >
    <span v-if="props.loading" class="spinner" />
    <slot />
  </button>
</template>

<style scoped lang="scss">
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: inherit;
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  white-space: nowrap;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none !important;
  }

  &:not(:disabled):active {
    transform: scale(0.98);
  }

  &.size-sm {
    padding: 0.35rem 0.75rem;
    font-size: 0.82rem;
  }

  &.size-md {
    padding: 0.65rem 1.2rem;
    font-size: 0.95rem;
  }

  &.size-lg {
    padding: 0.85rem 1.5rem;
    font-size: 1.05rem;
  }

  &.variant-primary {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
    }
  }

  &.variant-secondary {
    background: #f1f5f9;
    color: #334155;
    border-color: #cbd5e1;

    &:hover:not(:disabled) {
      background: #e2e8f0;
      color: #0f172a;
    }
  }

  &.variant-success {
    background: #10b981;
    color: #ffffff;

    &:hover:not(:disabled) {
      background: #059669;
    }
  }

  &.variant-danger {
    background: #ef4444;
    color: #ffffff;

    &:hover:not(:disabled) {
      background: #dc2626;
    }
  }

  &.variant-ghost {
    background: transparent;
    color: #64748b;

    &:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.05);
      color: #0f172a;
    }
  }
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
