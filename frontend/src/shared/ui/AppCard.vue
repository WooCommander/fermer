<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  clickable: false,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
  <div :class="['app-card', { 'is-clickable': props.clickable }]" @click="emit('click', $event)">
    <div v-if="props.title || $slots.header" class="card-header">
      <div>
        <h3 v-if="props.title" class="card-title">{{ props.title }}</h3>
        <p v-if="props.subtitle" class="card-subtitle">{{ props.subtitle }}</p>
      </div>
      <div v-if="$slots.headerExtra" class="card-header-extra">
        <slot name="headerExtra" />
      </div>
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 1.25rem;
  transition: all 0.2s ease;

  &.is-clickable {
    cursor: pointer;
    &:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.card-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.2rem 0 0;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-footer {
  margin-top: 1.25rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
