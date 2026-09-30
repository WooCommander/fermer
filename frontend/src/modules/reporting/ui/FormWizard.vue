<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ReportUIModel, FormSchema, ValidationIssue } from '@/shared/types'
import { AppButton, AppProgressBar, AppBadge, AppAlert } from '@/shared/ui'
import FormSectionView from './FormSectionView.vue'
import ValidationSummary from './ValidationSummary.vue'
import ReportSubmitDialog from './ReportSubmitDialog.vue'
import ReportHistoryTimeline from './ReportHistoryTimeline.vue'

interface Props {
  report: ReportUIModel
  schema: FormSchema
  activeSectionIndex: number
  validationIssues: ValidationIssue[]
  completionPercent: number
  isSaving?: boolean
  isSubmitting?: boolean
  saveNotice?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  activeSectionIndex: 0,
  validationIssues: () => [],
  completionPercent: 0,
  isSaving: false,
  isSubmitting: false,
  saveNotice: null,
})

const emit = defineEmits<{
  (e: 'updateSectionIndex', index: number): void
  (e: 'updateRowValue', rowCode: string, value: number | null): void
  (e: 'updateRowComment', rowCode: string, comment: string): void
  (e: 'confirmWarning', ruleId: string, value: boolean): void
  (e: 'fillZerosForSection', sectionId: string): void
  (e: 'copyPreviousForSection', sectionId: string): void
  (e: 'saveDraft'): void
  (e: 'submitReport'): void
}>()

const showSubmitDialog = ref(false)

const currentSection = computed(() => {
  return props.schema.sections[props.activeSectionIndex] || props.schema.sections[0]
})

const isReadonly = computed(() => {
  return props.report.status === 'submitted' || props.report.status === 'approved'
})

const hasErrors = computed(() => {
  return props.validationIssues.some((i) => i.severity === 'error')
})

const errorIssues = computed(() => props.validationIssues.filter((i) => i.severity === 'error'))
const warningIssues = computed(() => props.validationIssues.filter((i) => i.severity === 'warning'))

// Считаем только строки, которые вводит сам фермер: расчётные хранятся как 0 и без его участия.
// Явно введённый 0 — это заполненная строка.
const inputRowCodes = computed(() => new Set(
  props.schema.sections.flatMap((section) => section.rows
    .filter((row) => !row.isCalculated && !row.isHeader)
    .map((row) => row.code)),
))

function countFilledRows(values: Record<string, number | null | undefined>): number {
  return Object.entries(values)
    .filter(([code, value]) => inputRowCodes.value.has(code) && typeof value === 'number' && !isNaN(value))
    .length
}

const filledRowsCount = computed(() => countFilledRows(props.report.values))

const previousFilledRowsCount = computed(() => countFilledRows(props.report.previousValues))

function prevSection(): void {
  if (props.activeSectionIndex > 0) {
    emit('updateSectionIndex', props.activeSectionIndex - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function nextSection(): void {
  if (props.activeSectionIndex < props.schema.sections.length - 1) {
    emit('updateSectionIndex', props.activeSectionIndex + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function onSubmitClick(): void {
  showSubmitDialog.value = true
}

function onConfirmSubmit(): void {
  showSubmitDialog.value = false
  emit('submitReport')
}
</script>

<template>
  <div class="form-wizard-layout">
    <!-- ЛЕВАЯ КОЛОНКА: Навигация по разделам, Прогресс и Действия -->
    <aside class="wizard-sidebar">
      <div class="sidebar-sticky-box">
        <div class="form-meta-card">
          <div class="meta-top">
            <span class="form-badge">{{ props.schema.formCode }}</span>
            <AppBadge :status="props.report.status" />
          </div>
          <h2 class="form-title">{{ props.schema.title }}</h2>
          <div class="period-line">Период: <b>{{ props.report.period }}</b></div>
        </div>

        <!-- Карточка контроля данных и готовности отчета -->
        <div class="sidebar-status-card">
          <div class="status-header">
            <span class="status-title">Контроль данных:</span>
            <span v-if="props.report.status === 'approved'" class="status-tag status-approved">Принят</span>
            <span v-else-if="props.report.status === 'submitted'" class="status-tag status-submitted">Сдан в Госстат</span>
            <span v-else-if="errorIssues.length > 0" class="status-tag status-error">Ошибки ({{ errorIssues.length }})</span>
            <span v-else-if="warningIssues.length > 0" class="status-tag status-warning">Предупреждения ({{ warningIssues.length }})</span>
            <span v-else-if="filledRowsCount > 0" class="status-tag status-ready">Готов к отправке</span>
            <span v-else class="status-tag status-empty">Не заполнен</span>
          </div>

          <div class="metrics-summary">
            <div class="metric-line">
              <span>Заполнено строк:</span>
              <b>{{ filledRowsCount }}</b>
            </div>
            <div v-if="previousFilledRowsCount > 0" class="metric-line sub-line">
              <span>В прошлом периоде:</span>
              <span>{{ previousFilledRowsCount }} строк</span>
            </div>
          </div>

          <div v-if="errorIssues.length === 0 && filledRowsCount > 0" class="ready-hint-box">
            <span>✅ Контрольные формулы и балансы соблюдены</span>
          </div>
          <div v-else-if="errorIssues.length > 0" class="error-hint-box">
            <span>❌ Не сходятся контрольные суммы</span>
          </div>
        </div>

        <!-- Меню разделов (Sticky Table of Contents) -->
        <nav class="sections-nav">
          <div class="nav-title">Разделы формы:</div>
          <button
            v-for="(sec, idx) in props.schema.sections"
            :key="sec.id"
            type="button"
            :class="['section-nav-item', { active: idx === props.activeSectionIndex }]"
            @click="emit('updateSectionIndex', idx)"
          >
            <span class="sec-code">{{ sec.code }}</span>
            <span class="sec-name">{{ sec.title.replace(/^[0-9.]+\s*/, '') }}</span>
          </button>
        </nav>

        <!-- Кнопки управления в сайдбаре -->
        <div v-if="!isReadonly" class="sidebar-actions">
          <AppButton
            variant="primary"
            :disabled="hasErrors"
            :loading="props.isSubmitting"
            class="submit-action-btn"
            @click="onSubmitClick"
          >
            📤 Отправить отчет в статистику
          </AppButton>
          <AppButton
            variant="secondary"
            :loading="props.isSaving"
            class="save-action-btn"
            @click="emit('saveDraft')"
          >
            💾 {{ props.isSaving ? 'Сохранение…' : 'Сохранить черновик' }}
          </AppButton>
        </div>

        <div v-if="props.saveNotice" class="save-toast-inline">
          <span>✅ {{ props.saveNotice }}</span>
        </div>
      </div>
    </aside>

    <!-- ПРАВАЯ ОСНОВНАЯ КОЛОНКА: Таблица показателей и валидации -->
    <section class="wizard-main-content">
      <!-- Баннер утвержденного отчета (если из архива) -->
      <AppAlert
        v-if="props.report.status === 'approved'"
        variant="success"
        title="Официально принятый отчет (Архив)"
      >
        Данный отчет утвержден Государственной службой статистики{{ props.report.approvedAt ? ' ' + new Date(props.report.approvedAt).toLocaleDateString('ru-RU') : '' }}. Режим просмотра.
      </AppAlert>

      <!-- Баннер замечаний инспектора -->
      <AppAlert
        v-if="props.report.status === 'needs_revision' && props.report.revisionComment"
        variant="warning"
        title="Замечание инспектора статистики (требуется исправление)"
      >
        {{ props.report.revisionComment }}
      </AppAlert>

      <!-- Блок сводки ошибок и контрольных соотношений -->
      <ValidationSummary
        :issues="props.validationIssues"
        :confirmed-warnings="props.report.confirmedWarnings"
        :readonly="isReadonly"
        @confirm-warning="(ruleId, val) => emit('confirmWarning', ruleId, val)"
      />

      <!-- Табличный блок активного раздела -->
      <ReportHistoryTimeline :history="props.report.history" />

      <div class="data-grid-container">
        <FormSectionView
          :section="currentSection"
          :values="props.report.values"
          :previous-values="props.report.previousValues"
          :row-comments="props.report.rowComments"
          :issues="props.validationIssues"
          :readonly="isReadonly"
          @update-row-value="(rowCode, val) => emit('updateRowValue', rowCode, val)"
          @update-row-comment="(rowCode, comment) => emit('updateRowComment', rowCode, comment)"
          @fill-zeros="emit('fillZerosForSection', currentSection.id)"
          @copy-all-previous="emit('copyPreviousForSection', currentSection.id)"
        />
      </div>

      <!-- Навигационный бар перехода между разделами -->
      <div class="section-footer-nav">
        <AppButton
          v-if="props.activeSectionIndex > 0"
          variant="secondary"
          @click="prevSection"
        >
          ← Назад: {{ props.schema.sections[props.activeSectionIndex - 1].code }}
        </AppButton>
        <span v-else />

        <AppButton
          v-if="props.activeSectionIndex < props.schema.sections.length - 1"
          variant="primary"
          @click="nextSection"
        >
          Следующий раздел: {{ props.schema.sections[props.activeSectionIndex + 1].code }} →
        </AppButton>
        <AppButton
          v-else-if="!isReadonly"
          variant="success"
          :disabled="hasErrors"
          :loading="props.isSubmitting"
          @click="onSubmitClick"
        >
          Проверить и отправить отчет →
        </AppButton>
      </div>
    </section>

    <!-- Модальное окно подтверждения отправки -->
    <ReportSubmitDialog
      v-if="showSubmitDialog"
      :report="props.report"
      :schema="props.schema"
      :issues="props.validationIssues"
      :is-submitting="props.isSubmitting"
      @confirm-submit="onConfirmSubmit"
      @cancel="showSubmitDialog = false"
    />
  </div>
</template>

<style scoped lang="scss">
.form-wizard-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  align-items: start;
  width: 100%;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
}

.wizard-sidebar {
  display: flex;
  flex-direction: column;
}

.sidebar-sticky-box {
  position: sticky;
  top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-meta-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.meta-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-badge {
  font-family: monospace;
  font-weight: 800;
  color: #10b981;
  background: #f0fdf4;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.82rem;
}

.form-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.35;
}

.period-line {
  font-size: 0.82rem;
  color: #64748b;
  b { color: #1e293b; }
}

.sidebar-status-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.status-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-tag {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;

  &.status-ready {
    background: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }
  &.status-submitted {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }
  &.status-approved {
    background: #f0fdf4;
    color: #047857;
    border: 1px solid #a7f3d0;
  }
  &.status-error {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }
  &.status-warning {
    background: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
  }
  &.status-empty {
    background: #f1f5f9;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }
}

.metrics-summary {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0.65rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}

.metric-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: #334155;

  b {
    color: #0f172a;
    font-weight: 700;
  }

  &.sub-line {
    font-size: 0.75rem;
    color: #64748b;
  }
}

.ready-hint-box {
  font-size: 0.75rem;
  font-weight: 600;
  color: #15803d;
  background: #f0fdf4;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  line-height: 1.3;
}

.error-hint-box {
  font-size: 0.75rem;
  font-weight: 600;
  color: #b91c1c;
  background: #fef2f2;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  line-height: 1.3;
}

.sections-nav {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.nav-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  padding: 0.25rem 0.5rem;
  letter-spacing: 0.5px;
}

.section-nav-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.75rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  font-family: inherit;

  .sec-code {
    font-size: 0.78rem;
    font-weight: 800;
    color: #64748b;
    background: #f1f5f9;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    min-width: 24px;
    text-align: center;
  }

  .sec-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: #334155;
    line-height: 1.3;
  }

  &:hover {
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  &.active {
    background: #f0fdf4;
    border-color: #10b981;

    .sec-code {
      background: #10b981;
      color: #ffffff;
    }

    .sec-name {
      color: #065f46;
      font-weight: 700;
    }
  }
}

.sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .submit-action-btn,
  .save-action-btn {
    width: 100%;
    justify-content: center;
  }
}

.save-toast-inline {
  background: #1e293b;
  color: #ffffff;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.82rem;
  text-align: center;
  animation: fadeIn 0.2s ease;
}

.wizard-main-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}

.data-grid-container {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.section-footer-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.5rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
