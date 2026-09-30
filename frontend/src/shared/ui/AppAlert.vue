<script setup lang="ts">
interface Props {
  variant?: 'info' | 'warning' | 'error' | 'success'
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  title: '',
})
</script>

<template>
  <div :class="['app-alert', `variant-${props.variant}`]">
    <div class="alert-icon">
      <span v-if="props.variant === 'warning'">⚠️</span>
      <span v-else-if="props.variant === 'error'">⛔</span>
      <span v-else-if="props.variant === 'success'">✅</span>
      <span v-else>ℹ️</span>
    </div>
    <div class="alert-content">
      <strong v-if="props.title" class="alert-title">{{ props.title }}</strong>
      <div class="alert-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 0.88rem;
  line-height: 1.45;

  &.variant-warning {
    background-color: #fffbeb;
    border-color: #fde68a;
    color: #92400e;
  }

  &.variant-error {
    background-color: #fef2f2;
    border-color: #fecaca;
    color: #991b1b;
  }

  &.variant-success {
    background-color: #f0fdf4;
    border-color: #bbf7d0;
    color: #166534;
  }

  &.variant-info {
    background-color: #eff6ff;
    border-color: #bfdbfe;
    color: #1e40af;
  }
}

.alert-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  line-height: 1;
}

.alert-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.alert-title {
  font-weight: 700;
}

.alert-body {
  font-size: 0.85rem;
}
</style>
