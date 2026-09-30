<script setup lang="ts">
import { computed } from 'vue'
import type { FormRowSchema } from '@/shared/types'

interface Props {
  row: FormRowSchema
  value: number | null
  previousValue?: number | null
  comment?: string
  hasError?: boolean
  hasWarning?: boolean
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  previousValue: null,
  comment: '',
  hasError: false,
  hasWarning: false,
  readonly: false,
})

const emit = defineEmits<{
  (e: 'update:value', value: number | null): void
  (e: 'update:comment', comment: string): void
}>()

const stringValue = computed(() => {
  return props.value !== null && props.value !== undefined ? props.value.toString() : ''
})

const deviation = computed(() => {
  if (typeof props.value !== 'number' || typeof props.previousValue !== 'number' || props.previousValue === 0) {
    return null
  }

  const percent = ((props.value - props.previousValue) / Math.abs(props.previousValue)) * 100
  if (Math.abs(percent) < 20) {
    return null
  }

  return {
    percent,
    direction: percent > 0 ? 'increase' : 'decrease',
  }
})

const deviationLabel = computed(() => {
  if (!deviation.value) {
    return ''
  }

  const sign = deviation.value.percent > 0 ? '+' : '−'
  return `${sign}${Math.abs(deviation.value.percent).toFixed(1)}% к прошлому периоду`
})

function onInputChange(e: Event): void {
  const val = (e.target as HTMLInputElement).value
  if (val.trim() === '') {
    emit('update:value', null)
  } else {
    const parsed = parseFloat(val.replace(',', '.'))
    emit('update:value', isNaN(parsed) ? null : parsed)
  }
}

function onCommentChange(e: Event): void {
  const val = (e.target as HTMLInputElement).value
  emit('update:comment', val)
}

function copyPreviousValue(): void {
  if (props.previousValue !== null && props.previousValue !== undefined) {
    emit('update:value', props.previousValue)
  }
}
</script>

<template>
  <tr
    :class="[
      'grid-row-item',
      {
        'is-calc': props.row.isCalculated,
        'has-error': props.hasError,
        'has-warning': props.hasWarning,
        'has-significant-deviation': deviation,
        'has-increase': deviation?.direction === 'increase',
        'has-decrease': deviation?.direction === 'decrease',
        'has-indent-1': props.row.indent === 1,
        'has-indent-2': props.row.indent === 2,
      },
    ]"
  >
    <!-- Код строки -->
    <td class="col-code">
      <span class="code-badge">{{ props.row.code }}</span>
    </td>

    <!-- Название показателя -->
    <td class="col-title">
      <div class="title-cell-content">
        <span class="row-name">{{ props.row.title }}</span>
        <span v-if="props.row.hint" class="row-hint-inline">{{ props.row.hint }}</span>
      </div>
    </td>

    <!-- Прошлый период (с возможностью вставить в 1 клик) -->
    <td class="col-prev">
      <div v-if="props.previousValue !== null && props.previousValue !== undefined" class="prev-wrapper">
        <span class="prev-val">{{ props.previousValue }}</span>
        <button
          v-if="!props.row.isCalculated && !props.readonly && props.value !== props.previousValue"
          type="button"
          class="insert-prev-btn"
          title="Подставить значение прошлого года"
          @click="copyPreviousValue"
        >
          Вставить
        </button>
      </div>
      <span v-else class="empty-dash">—</span>
    </td>

    <!-- Ввод значения / Авторасчет -->
    <td class="col-input">
      <div :class="['input-cell-box', { 'has-significant-deviation': deviation }]">
        <input
          :value="stringValue"
          :readonly="props.row.isCalculated || props.readonly"
          :disabled="props.readonly"
          :placeholder="props.row.isCalculated ? '0.0 (авто)' : '0.0'"
          type="number"
          step="any"
          inputmode="decimal"
          :class="['grid-number-input', { 'input-calc': props.row.isCalculated }]"
          @input="onInputChange"
        />
        <span class="unit-tag">{{ props.row.unit }}</span>
      </div>
      <span
        v-if="deviation"
        :class="['deviation-note', `is-${deviation.direction}`]"
        :title="`Текущее значение ${deviation.direction === 'increase' ? 'выше' : 'ниже'} прошлого на ${Math.abs(deviation.percent).toFixed(1)}%`"
      >
        {{ deviationLabel }}
      </span>
    </td>

    <!-- Комментарий фермера к строке -->
    <td class="col-comment">
      <input
        :value="props.comment"
        :disabled="props.readonly"
        type="text"
        placeholder="Пояснение..."
        class="grid-comment-input"
        @input="onCommentChange"
      />
    </td>
  </tr>
</template>

<style scoped lang="scss">
.grid-row-item {
  border-bottom: 1px solid #edf2f7;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: #f8fafc;
  }

  &.is-calc {
    background-color: #f0fdf4;
    font-weight: 600;

    .code-badge {
      background-color: #10b981;
      color: #ffffff;
    }

    .row-name {
      color: #065f46;
      font-weight: 700;
    }
  }

  &.has-indent-1 .col-title {
    padding-left: 1.5rem;
  }

  &.has-indent-2 .col-title {
    padding-left: 2.75rem;
  }

  &.has-error {
    background-color: #fef2f2 !important;
    .code-badge { background-color: #ef4444; color: #fff; }
  }

  &.has-warning {
    background-color: #fffbeb !important;
  }

  &.has-significant-deviation:not(.has-error):not(.has-warning) {
    &.has-increase {
      background-color: #eff6ff;
    }

    &.has-decrease {
      background-color: #fff7ed;
    }
  }
}

td {
  padding: 0.45rem 0.65rem;
  vertical-align: middle;
  font-size: 0.88rem;
}

.col-code {
  width: 55px;
  text-align: center;
}

.code-badge {
  font-family: monospace;
  font-size: 0.78rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #334155;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  display: inline-block;
}

.col-title {
  min-width: 280px;
}

.title-cell-content {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.row-name {
  color: #1e293b;
  line-height: 1.35;
}

.row-hint-inline {
  font-size: 0.75rem;
  color: #64748b;
  font-style: italic;
}

.col-prev {
  width: 130px;
  text-align: right;
}

.prev-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
}

.prev-val {
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 600;
}

.insert-prev-btn {
  background: #e2e8f0;
  border: none;
  font-size: 0.7rem;
  font-weight: 700;
  color: #0f172a;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #cbd5e1;
    color: #047857;
  }
}

.empty-dash {
  color: #cbd5e1;
  font-size: 0.82rem;
}

.col-input {
  width: 145px;
}

.input-cell-box {
  display: flex;
  align-items: center;
  position: relative;

  &.has-significant-deviation .grid-number-input {
    border-width: 2px;
  }
}

.grid-number-input {
  width: 100%;
  padding: 0.4rem 2.2rem 0.4rem 0.55rem;
  font-size: 0.92rem;
  font-weight: 600;
  text-align: right;
  font-family: inherit;
  color: #0f172a;
  background-color: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  transition: all 0.15s ease;

  &:focus:not(:read-only) {
    border-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  }

  &.input-calc {
    background-color: #dcfce7;
    border-color: #86efac;
    color: #065f46;
    cursor: default;
    font-weight: 800;
  }
}

.unit-tag {
  position: absolute;
  right: 0.45rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  pointer-events: none;
}

.deviation-note {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-align: right;

  &.is-increase {
    color: #2563eb;
  }

  &.is-decrease {
    color: #c2410c;
  }
}

.col-comment {
  width: 180px;
}

.grid-comment-input {
  width: 100%;
  padding: 0.35rem 0.5rem;
  font-size: 0.78rem;
  font-family: inherit;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  background-color: #fafafa;
  outline: none;

  &:focus {
    border-color: #10b981;
    background-color: #ffffff;
    border-style: solid;
  }
}
</style>
