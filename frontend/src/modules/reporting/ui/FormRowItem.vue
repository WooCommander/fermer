<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FormRowSchema } from '@/shared/types'
import { AppInput } from '@/shared/ui'

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
  (e: 'copyPrevious'): void
}>()

const showCommentField = ref(!!props.comment)

const stringValue = computed(() => {
  return props.value !== null && props.value !== undefined ? props.value.toString() : ''
})

function onInputChange(val: string): void {
  if (val.trim() === '') {
    emit('update:value', null)
  } else {
    const parsed = parseFloat(val.replace(',', '.'))
    emit('update:value', isNaN(parsed) ? null : parsed)
  }
}

function onCommentInput(e: Event): void {
  const target = e.target as HTMLInputElement
  emit('update:comment', target.value)
}

function copyPreviousValue(): void {
  if (props.previousValue !== null && props.previousValue !== undefined) {
    emit('update:value', props.previousValue)
  }
}
</script>

<template>
  <div
    :class="[
      'form-row-item',
      {
        'is-calculated': props.row.isCalculated,
        'has-error': props.hasError,
        'has-warning': props.hasWarning,
        'has-indent': (props.row.indent ?? 0) > 0,
      },
    ]"
  >
    <div class="row-header">
      <div class="row-code-badge">{{ props.row.code }}</div>
      <div class="row-title-container">
        <span class="row-title">{{ props.row.title }}</span>
        <span v-if="props.row.hint" class="row-hint">{{ props.row.hint }}</span>
      </div>
      <div v-if="props.previousValue !== null && props.previousValue !== undefined" class="prev-badge" title="Значение за прошлый период">
        <span>Прошлый: <b>{{ props.previousValue }}</b></span>
        <button
          v-if="!props.row.isCalculated && !props.readonly && props.value !== props.previousValue"
          type="button"
          class="copy-prev-btn"
          @click="copyPreviousValue"
        >
          Вставить
        </button>
      </div>
    </div>

    <div class="row-input-group">
      <AppInput
        :model-value="stringValue"
        :unit="props.row.unit"
        :readonly="props.row.isCalculated || props.readonly"
        :placeholder="props.row.isCalculated ? 'Авторасчет' : '0.0'"
        type="number"
        @update:model-value="onInputChange"
      />

      <button
        v-if="!props.readonly"
        type="button"
        :class="['comment-toggle-btn', { active: showCommentField || !!props.comment }]"
        title="Добавить комментарий к строке"
        @click="showCommentField = !showCommentField"
      >
        💬
      </button>
    </div>

    <div v-if="showCommentField || !!props.comment" class="comment-box">
      <input
        :value="props.comment"
        :disabled="props.readonly"
        type="text"
        placeholder="Пояснение к значению (для инспектора статистики)..."
        class="comment-input"
        @input="onCommentInput"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-row-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.85rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #cbd5e1;
  }

  &.has-indent {
    margin-left: 1.25rem;
    border-left: 3px solid #94a3b8;
    background: #fafafa;
  }

  &.is-calculated {
    background: #f8fafc;
    border-left: 3px solid #10b981;
  }

  &.has-error {
    border-color: #fca5a5;
    background-color: #fff5f5;
  }

  &.has-warning {
    border-color: #fcd34d;
    background-color: #fffdf5;
  }
}

.row-header {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}

.row-code-badge {
  font-family: monospace;
  font-size: 0.82rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #334155;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  flex-shrink: 0;
}

.row-title-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.row-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.35;
}

.row-hint {
  font-size: 0.78rem;
  color: #64748b;
  font-style: italic;
}

.prev-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  background: #f1f5f9;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  color: #475569;
}

.copy-prev-btn {
  background: #e2e8f0;
  border: none;
  font-size: 0.72rem;
  font-weight: 600;
  color: #0f172a;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #cbd5e1;
  }
}

.row-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comment-toggle-btn {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;

  &.active {
    background: #e0e7ff;
    border-color: #c7d2fe;
  }
}

.comment-box {
  margin-top: 0.2rem;
}

.comment-input {
  width: 100%;
  padding: 0.45rem 0.65rem;
  font-size: 0.82rem;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  background: #f8fafc;
  outline: none;

  &:focus {
    border-color: #10b981;
    background: #ffffff;
  }
}
</style>
