<script setup lang="ts">
import type { ValidationIssue } from '@/shared/types'
import { AppAlert } from '@/shared/ui'

interface Props {
  issues: ValidationIssue[]
  confirmedWarnings?: Record<string, boolean>
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  issues: () => [],
  confirmedWarnings: () => ({}),
  readonly: false,
})

const emit = defineEmits<{
  (e: 'confirmWarning', ruleId: string, value: boolean): void
  (e: 'focusRow', rowCode: string): void
}>()
</script>

<template>
  <div v-if="props.issues.length > 0" class="validation-summary">
    <div
      v-for="issue in props.issues"
      :key="issue.ruleId"
      class="issue-card"
    >
      <AppAlert
        :variant="issue.severity === 'error' ? 'error' : 'warning'"
        :title="issue.severity === 'error' ? 'Ошибка в отчете' : 'Предупреждение / Аномалия'"
      >
        <p class="issue-text">{{ issue.message }}</p>

        <button v-if="issue.rowCode" type="button" class="goto-row-btn" @click="emit('focusRow', issue.rowCode)">
          Перейти к строке {{ issue.rowCode }} →
        </button>

        <div v-if="issue.severity === 'warning' && !props.readonly" class="warning-confirm-box">
          <label class="confirm-checkbox">
            <input
              type="checkbox"
              :checked="!!props.confirmedWarnings[issue.ruleId]"
              @change="emit('confirmWarning', issue.ruleId, ($event.target as HTMLInputElement).checked)"
            />
            <span>Данные верны (подтверждаю необычное значение)</span>
          </label>
        </div>
      </AppAlert>
    </div>
  </div>
</template>

<style scoped lang="scss">
.validation-summary {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.issue-card {
  width: 100%;
}

.issue-text {
  margin: 0.25rem 0 0.5rem;
  font-size: 0.88rem;
}

.goto-row-btn {
  margin: 0 0 0.25rem;
  padding: 0;
  background: none;
  border: none;
  color: #2563eb;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.warning-confirm-box {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed rgba(146, 64, 14, 0.3);
}

.confirm-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  user-select: none;

  input {
    width: 16px;
    height: 16px;
    accent-color: #d97706;
  }
}
</style>
