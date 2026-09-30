<script setup lang="ts">
import { ref } from 'vue'
import type { FormSectionSchema, ValidationIssue } from '@/shared/types'
import { AppConfirmDialog } from '@/shared/ui'
import FormRowItem from './FormRowItem.vue'

interface Props {
  section: FormSectionSchema
  values: Record<string, number | null>
  previousValues: Record<string, number | null>
  rowComments: Record<string, string>
  issues: ValidationIssue[]
  readonly?: boolean
  revisionNotes?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  values: () => ({}),
  previousValues: () => ({}),
  rowComments: () => ({}),
  issues: () => [],
  readonly: false,
  revisionNotes: () => ({}),
})

const emit = defineEmits<{
  (e: 'updateRowValue', rowCode: string, value: number | null): void
  (e: 'updateRowComment', rowCode: string, comment: string): void
  (e: 'fillZeros'): void
  (e: 'copyAllPrevious'): void
}>()

const showZerosConfirm = ref(false)
const showCopyConfirm = ref(false)

function onConfirmZeros(): void {
  showZerosConfirm.value = false
  emit('fillZeros')
}

function onConfirmCopy(): void {
  showCopyConfirm.value = false
  emit('copyAllPrevious')
}

function hasRowError(rowCode: string): boolean {
  return props.issues.some((i) => i.rowCode === rowCode && i.severity === 'error')
}

function hasRowWarning(rowCode: string): boolean {
  return props.issues.some((i) => i.rowCode === rowCode && i.severity === 'warning')
}
</script>

<template>
  <div class="form-section-view">
    <!-- Шапка раздела и быстрые действия -->
    <div class="section-top-bar">
      <div class="section-meta">
        <h3 class="section-title">{{ props.section.title }}</h3>
        <p v-if="props.section.description" class="section-desc">{{ props.section.description }}</p>
      </div>

      <div v-if="!props.readonly" class="section-quick-actions">
        <button
          type="button"
          class="quick-btn"
          title="Подставить значения прошлого года для всех строк раздела"
          @click="showCopyConfirm = true"
        >
          📋 Копировать прошлый год
        </button>
        <button
          type="button"
          class="quick-btn"
          title="Заполнить пустые поля раздела нулями"
          @click="showZerosConfirm = true"
        >
          0️⃣ Заполнить нулями
        </button>
      </div>
    </div>

    <!-- Плотная профессиональная таблица показателей -->
    <div class="table-responsive-wrapper">
      <table class="form-grid-table">
        <thead>
          <tr>
            <th style="width: 55px; text-align: center;">Стр.</th>
            <th>Наименование показателя</th>
            <th style="width: 130px; text-align: right;">Прошлый год</th>
            <th style="width: 145px; text-align: right;">Текущее значение</th>
            <th style="width: 180px;">Примечание</th>
          </tr>
        </thead>
        <tbody>
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
            :revision-note="props.revisionNotes[row.code] ?? null"
            @update:value="emit('updateRowValue', row.code, $event)"
            @update:comment="emit('updateRowComment', row.code, $event)"
          />
        </tbody>
      </table>
    </div>

    <!-- Модальные окна подтверждения необратимых действий -->
    <AppConfirmDialog
      :open="showZerosConfirm"
      title="Заполнить пустые поля нулями?"
      message="Все незаполненные поля ввода в текущем разделе будут установлены в значение 0. Ранее введённые данные не будут стёрты."
      confirm-text="Да, заполнить нулями"
      cancel-text="Отмена"
      variant="primary"
      @confirm="onConfirmZeros"
      @cancel="showZerosConfirm = false"
    />

    <AppConfirmDialog
      :open="showCopyConfirm"
      title="Скопировать данные за прошлый год?"
      message="Значения всех строк текущего раздела будут заменены на соответствующие показатели прошлого отчётного периода. Текущие введённые значения раздела будут перезаписаны."
      confirm-text="Да, скопировать"
      cancel-text="Отмена"
      variant="warning"
      @confirm="onConfirmCopy"
      @cancel="showCopyConfirm = false"
    />
  </div>
</template>

<style scoped lang="scss">
.form-section-view {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.section-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.section-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.section-desc {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
  line-height: 1.35;
}

.section-quick-actions {
  display: flex;
  gap: 0.5rem;
}

.quick-btn {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.35rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    background: #e2e8f0;
    border-color: #94a3b8;
    color: #0f172a;
  }
}

.table-responsive-wrapper {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
}

.form-grid-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;

  thead th {
    background: #f8fafc;
    padding: 0.6rem 0.75rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: #475569;
    border-bottom: 1.5px solid #cbd5e1;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
}

@media (max-width: 700px) {
  .form-grid-table,
  .form-grid-table tbody {
    display: block;
  }

  .form-grid-table thead {
    display: none;
  }
}
</style>
