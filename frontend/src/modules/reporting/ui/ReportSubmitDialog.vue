<script setup lang="ts">
import type { ReportUIModel, FormSchema, ValidationIssue } from '@/shared/types'
import { AppButton, AppAlert } from '@/shared/ui'

interface Props {
  report: ReportUIModel
  schema: FormSchema
  issues: ValidationIssue[]
  isSubmitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSubmitting: false,
})

const emit = defineEmits<{
  (e: 'confirmSubmit'): void
  (e: 'cancel'): void
}>()

function hasBlockingErrors(): boolean {
  return props.issues.some((i) => i.severity === 'error')
}

function hasUnconfirmedWarnings(): boolean {
  return props.issues.some((i) => i.severity === 'warning' && !props.report.confirmedWarnings[i.ruleId])
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('cancel')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Подтверждение отправки отчета</h2>
        <button type="button" class="close-btn" @click="emit('cancel')">✕</button>
      </div>

      <div class="modal-body">
        <div class="summary-box">
          <div class="summary-item">
            <span class="label">Хозяйство:</span>
            <span class="value">{{ props.report.farmName }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Форма:</span>
            <span class="value">{{ props.report.formCode }} — {{ props.report.formTitle }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Период:</span>
            <span class="value">{{ props.report.period }}</span>
          </div>
        </div>

        <AppAlert
          v-if="hasBlockingErrors()"
          variant="error"
          title="Отправка заблокирована"
        >
          В отчете обнаружены критические ошибки контрольных соотношений. Исправьте их перед отправкой.
        </AppAlert>

        <AppAlert
          v-else-if="hasUnconfirmedWarnings()"
          variant="warning"
          title="Требуется подтверждение предупреждений"
        >
          В отчете есть предупреждения об отклонениях. Пожалуйста, подтвердите галочкой в форме, что данные верны.
        </AppAlert>

        <AppAlert
          v-else
          variant="success"
          title="Все проверки пройдены успешно"
        >
          Отчет готов к передаче в Государственную службу статистики. После отправки редактирование будет заблокировано.
        </AppAlert>
      </div>

      <div class="modal-footer">
        <AppButton variant="secondary" @click="emit('cancel')">
          Вернуться к редактированию
        </AppButton>
        <AppButton
          variant="primary"
          :disabled="hasBlockingErrors() || hasUnconfirmedWarnings()"
          :loading="props.isSubmitting"
          @click="emit('confirmSubmit')"
        >
          Подтвердить и отправить →
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1rem;
}

.modal-content {
  background: #ffffff;
  border-radius: 16px;
  max-width: 540px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;

  h2 {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0;
    color: #0f172a;
  }
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #64748b;
  padding: 0.25rem;

  &:hover {
    color: #0f172a;
  }
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.summary-box {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;

  .label {
    color: #64748b;
  }

  .value {
    font-weight: 600;
    color: #0f172a;
    text-align: right;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}
</style>
