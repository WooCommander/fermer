<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ReportUIModel, FormSchema } from '@/shared/types'
import { AppButton, AppBadge, AppAlert, AppConfirmDialog } from '@/shared/ui'
import { getFormSchemaByCode } from '@/modules/reporting/schemas'
import { validateFormValues } from '@/shared/lib'

interface Props {
  report: ReportUIModel
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'approve', reportId: string): void
  (e: 'returnRevision', reportId: string, comment: string): void
}>()

const schema = computed<FormSchema>(() => {
  return getFormSchemaByCode(props.report.formCode)
})

const issues = computed(() => {
  return validateFormValues(schema.value.validationRules, props.report.values, props.report.previousValues)
})

const showRevisionBox = ref(false)
const showApproveConfirm = ref(false)
const showRevisionConfirm = ref(false)
const revisionComment = ref(props.report.revisionComment || '')

function onApproveConfirm(): void {
  showApproveConfirm.value = false
  emit('approve', props.report.id)
}

function onSendRevisionConfirm(): void {
  showRevisionConfirm.value = false
  if (revisionComment.value.trim()) {
    emit('returnRevision', props.report.id, revisionComment.value)
    showRevisionBox.value = false
  }
}
</script>

<template>
  <div class="report-review-detail">
    <!-- Шапка инспектора -->
    <div class="detail-header">
      <AppButton size="sm" variant="secondary" @click="emit('back')">
        ← К списку отчетов
      </AppButton>

      <div class="header-main">
        <div>
          <h2>{{ props.report.farmName }}</h2>
          <p class="subtitle">{{ props.report.district }}, ФК: {{ props.report.fiscalCode }}</p>
        </div>
        <AppBadge :status="props.report.status" />
      </div>

      <div class="meta-pills">
        <span class="pill">Форма: <b>{{ props.report.formCode }}</b></span>
        <span class="pill">Период: <b>{{ props.report.period }}</b></span>
        <span v-if="props.report.submittedAt" class="pill">Сдан: <b>{{ new Date(props.report.submittedAt).toLocaleDateString() }}</b></span>
      </div>
    </div>

    <!-- Замечания и проблемы -->
    <div v-if="issues.length > 0" class="issues-container">
      <h3>Результаты автоматического контроля:</h3>
      <div v-for="issue in issues" :key="issue.ruleId">
        <AppAlert
          :variant="issue.severity === 'error' ? 'error' : 'warning'"
          :title="issue.severity === 'error' ? 'Нарушение контрольного соотношения' : 'Предупреждение / Аномалия'"
        >
          {{ issue.message }}
        </AppAlert>
      </div>
    </div>

    <!-- Таблица показателей формы -->
    <div class="form-sections-view">
      <div v-for="sec in schema.sections" :key="sec.id" class="review-section-card">
        <h4 class="section-heading">{{ sec.title }}</h4>
        <table class="review-rows-table">
          <thead>
            <tr>
              <th style="width: 70px;">Код</th>
              <th>Наименование показателя</th>
              <th style="width: 140px; text-align: right;">Значение</th>
              <th style="width: 80px;">Ед. изм.</th>
              <th style="width: 120px; text-align: right;">Прошлый год</th>
              <th>Комментарий фермера</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in sec.rows"
              :key="r.code"
              :class="{ 'is-calc': r.isCalculated, 'has-indent': (r.indent ?? 0) > 0 }"
            >
              <td class="code-col"><code>{{ r.code }}</code></td>
              <td>{{ r.title }}</td>
              <td class="val-col">
                <b>{{ props.report.values[r.code] !== null && props.report.values[r.code] !== undefined ? props.report.values[r.code] : '—' }}</b>
              </td>
              <td>{{ r.unit }}</td>
              <td class="prev-col">{{ props.report.previousValues[r.code] ?? '—' }}</td>
              <td class="comment-col">
                <span v-if="props.report.rowComments[r.code]" class="farmer-comment">
                  💬 {{ props.report.rowComments[r.code] }}
                </span>
                <span v-else class="no-comment">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Панель действий инспектора -->
    <div class="actions-footer">
      <div v-if="!showRevisionBox" class="footer-buttons">
        <AppButton
          v-if="props.report.status !== 'approved'"
          variant="danger"
          @click="showRevisionBox = true"
        >
          ⚠️ Вернуть на уточнение
        </AppButton>
        <AppButton
          v-if="props.report.status !== 'approved'"
          variant="success"
          @click="showApproveConfirm = true"
        >
          ✅ Принять отчет
        </AppButton>
        <div v-else class="approved-notice">
          <span>Отчет принят статистикой</span>
        </div>
      </div>

      <div v-else class="revision-form">
        <label>
          <b>Причина возврата отчета на уточнение:</b>
          <textarea
            v-model="revisionComment"
            rows="3"
            placeholder="Укажите конкретные строки или расхождения, требующие пояснения фермера..."
            class="revision-textarea"
          />
        </label>
        <div class="revision-actions">
          <AppButton variant="ghost" @click="showRevisionBox = false">Отмена</AppButton>
          <AppButton
            variant="danger"
            :disabled="!revisionComment.trim()"
            @click="showRevisionConfirm = true"
          >
            Отправить замечание фермеру
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Диалоги подтверждения для инспектора -->
    <AppConfirmDialog
      :open="showApproveConfirm"
      title="Утвердить статистический отчет?"
      :message="`Вы подтверждаете прием отчета «${props.report.formCode}» от хозяйства ${props.report.farmName} за период ${props.report.period}. Отчет будет официально зафиксирован в Государственной службе статистики и станет доступен респонденту в архиве.`"
      confirm-text="Да, утвердить отчет"
      cancel-text="Отмена"
      variant="success"
      @confirm="onApproveConfirm"
      @cancel="showApproveConfirm = false"
    />

    <AppConfirmDialog
      :open="showRevisionConfirm"
      title="Вернуть отчет на доработку?"
      :message="`Отчет «${props.report.formCode}» будет возвращен респонденту (${props.report.farmName}) со статусом «Требует исправления». Фермер получит указанное вами замечание и сможет внести правки.`"
      confirm-text="Да, вернуть респонденту"
      cancel-text="Отмена"
      variant="warning"
      @confirm="onSendRevisionConfirm"
      @cancel="showRevisionConfirm = false"
    />
  </div>
</template>

<style scoped lang="scss">
.report-review-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 5rem;
}

.detail-header {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  h2 {
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0;
    color: #0f172a;
  }

  .subtitle {
    font-size: 0.85rem;
    color: #64748b;
    margin: 0.2rem 0 0;
  }
}

.meta-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.pill {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  font-size: 0.82rem;
  color: #475569;
}

.issues-container {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;

  h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: #b45309;
    margin: 0;
  }
}

.form-sections-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.review-section-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);

  .section-heading {
    padding: 0.85rem 1rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    font-size: 0.95rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }
}

.review-rows-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;

  th {
    padding: 0.6rem 0.85rem;
    background: #ffffff;
    font-weight: 600;
    color: #64748b;
    border-bottom: 1px solid #f1f5f9;
  }

  td {
    padding: 0.6rem 0.85rem;
    border-bottom: 1px solid #f8fafc;
    vertical-align: middle;
  }

  tr.is-calc td {
    background: #f0fdf4;
    font-weight: 600;
  }

  tr.has-indent td:nth-child(2) {
    padding-left: 1.75rem;
  }
}

.code-col code {
  background: #f1f5f9;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 700;
}

.val-col {
  text-align: right;
  font-size: 0.92rem;
}

.prev-col {
  text-align: right;
  color: #64748b;
}

.farmer-comment {
  color: #3b82f6;
  font-weight: 500;
}

.no-comment {
  color: #cbd5e1;
}

.actions-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  padding: 1rem 1.5rem;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.06);
  z-index: 50;
}

.footer-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.approved-notice {
  font-weight: 700;
  color: #059669;
  padding: 0.5rem 1rem;
  background: #d1fae5;
  border-radius: 8px;
}

.revision-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 700px;
  margin: 0 auto;

  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.88rem;
    color: #0f172a;
  }
}

.revision-textarea {
  width: 100%;
  padding: 0.65rem;
  font-family: inherit;
  font-size: 0.9rem;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  outline: none;
  background: #fff5f5;

  &:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
  }
}

.revision-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
