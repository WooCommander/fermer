<script setup lang="ts">
import type { FormSectionSchema, ValidationIssue } from '@/shared/types'
import FormRowItem from './FormRowItem.vue'

interface Props {
  section: FormSectionSchema
  values: Record<string, number | null>
  previousValues: Record<string, number | null>
  rowComments: Record<string, string>
  issues: ValidationIssue[]
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  values: () => ({}),
  previousValues: () => ({}),
  rowComments: () => ({}),
  issues: () => [],
  readonly: false,
})

const emit = defineEmits<{
  (e: 'updateRowValue', rowCode: string, value: number | null): void
  (e: 'updateRowComment', rowCode: string, comment: string): void
  (e: 'fillZeros'): void
  (e: 'copyAllPrevious'): void
}>()

function hasRowError(rowCode: string): boolean {
  return props.issues.some((i) => i.rowCode === rowCode && i.severity === 'error')
}

function hasRowWarning(rowCode: string): boolean {
  return props.issues.some((i) => i.rowCode === rowCode && i.severity === 'warning')
}
</script>

<template>
  <div class="form-section-view">
    <div class="section-meta">
      <h3 class="section-title">{{ props.section.title }}</h3>
      <p v-if="props.section.description" class="section-desc">{{ props.section.description }}</p>
    </div>

    <div v-if="!props.readonly" class="section-quick-actions">
      <button type="button" class="quick-btn" @click="emit('copyAllPrevious')">
        📋 Скопировать раздел из прошлого периода
      </button>
      <button type="button" class="quick-btn" @click="emit('fillZeros')">
        0️⃣ Заполнить нулями пустые поля
      </button>
    </div>

    <div class="rows-list">
      <FormRowItem
        v-for="row in props.section.rows"
        :key="row.code"
        :row="row"
        :value="props.values[row.code] ?? null"
        :previous-value="props.previousValues[row.code] ?? null"
        :comment="props.rowComments[row.code] ?? ''"
        :has-error="hasRowError(row.code)"
        :has-warning="hasRowWarning(row.code)"
        :readonly="props.readonly"
        @update:value="emit('updateRowValue', row.code, $event)"
        @update:comment="emit('updateRowComment', row.code, $event)"
        @copy-previous="emit('updateRowValue', row.code, props.previousValues[row.code] ?? null)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-section-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.section-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.section-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
}

.quick-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.35rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }
}

.rows-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
</style>
