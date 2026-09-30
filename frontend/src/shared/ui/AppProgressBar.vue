<script setup lang="ts">
interface Props {
  value: number
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  showLabel: true,
})
</script>

<template>
  <div class="progress-container">
    <div class="progress-bar-bg">
      <div
        class="progress-bar-fill"
        :style="{ width: `${Math.min(100, Math.max(0, props.value))}%` }"
      />
    </div>
    <span v-if="props.showLabel" class="progress-text">{{ Math.round(props.value) }}%</span>
  </div>
</template>

<style scoped lang="scss">
.progress-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.progress-bar-bg {
  flex: 1;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  min-width: 38px;
  text-align: right;
}
</style>
