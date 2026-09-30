<script setup lang="ts">
import type { FarmProfile } from '@/shared/types'
import { formatActivityTypeName } from '@/shared/lib'

interface Props {
  farms: FarmProfile[]
  selectedFarmId?: string
}

const props = withDefaults(defineProps<Props>(), {
  farms: () => [],
  selectedFarmId: '',
})

const emit = defineEmits<{
  (e: 'select', farm: FarmProfile): void
}>()

function onSelect(e: Event): void {
  const id = (e.target as HTMLSelectElement).value
  const found = props.farms.find((f) => f.id === id)
  if (found) {
    emit('select', found)
  }
}
</script>

<template>
  <div class="farm-selector">
    <label class="selector-label">
      <span>Выбор хозяйства (респондента):</span>
      <select :value="props.selectedFarmId" class="selector-input" @change="onSelect">
        <option v-for="farm in props.farms" :key="farm.id" :value="farm.id">
          {{ farm.name }} ({{ farm.district }}, {{ formatActivityTypeName(farm.activityType) }})
        </option>
      </select>
    </label>
  </div>
</template>

<style scoped lang="scss">
.farm-selector {
  width: 100%;
}

.selector-label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.selector-input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  font-size: 0.9rem;
  font-family: inherit;
  color: #0f172a;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: #10b981;
    background-color: #ffffff;
  }
}
</style>
