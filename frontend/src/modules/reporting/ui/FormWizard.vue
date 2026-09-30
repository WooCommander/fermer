<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
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
  isDirty?: boolean
  lastSavedAt?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  activeSectionIndex: 0,
  validationIssues: () => [],
  completionPercent: 0,
  isSaving: false,
  isSubmitting: false,
  saveNotice: null,
  isDirty: false,
  lastSavedAt: null,
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

// Строки, которые специалист вернул на уточнение (только пока отчёт ждёт исправлений)
const revisionNotes = computed<Record<string, string>>(() => {
  if (props.report.status !== 'needs_revision') return {}
  return Object.fromEntries((props.report.revisionRows ?? []).map((row) => [row.rowCode, row.comment ?? '']))
})

const revisionItems = computed(() => {
  const titles = new Map(props.schema.sections.flatMap((section) => section.rows.map((row) => [row.code, row.title] as const)))
  return Object.entries(revisionNotes.value).map(([code, comment]) => ({ code, comment, title: titles.get(code) ?? '' }))
})

const lastSavedTime = computed(() => props.lastSavedAt
  ? new Date(props.lastSavedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  : '')

// Сводка по каждому разделу для индикаторов в меню: ошибки, предупреждения, заполненность
const sectionStats = computed(() => props.schema.sections.map((section) => {
  const rowCodes = new Set(section.rows.map((row) => row.code))
  const inputCodes = section.rows.filter((row) => !row.isCalculated && !row.isHeader).map((row) => row.code)
  const inSection = (issue: ValidationIssue) => rowCodes.has(issue.rowCode)
  return {
    errors: props.validationIssues.filter((issue) => issue.severity === 'error' && inSection(issue)).length,
    warnings: props.validationIssues.filter((issue) => issue.severity === 'warning' && inSection(issue)).length,
    revisions: section.rows.filter((row) => row.code in revisionNotes.value).length,
    filled: inputCodes.filter((code) => typeof props.report.values[code] === 'number' && !isNaN(props.report.values[code] as number)).length,
    total: inputCodes.length,
  }
}))

// Переходит в раздел со строкой, прокручивает к ней и ставит курсор в поле ввода
async function focusRow(rowCode: string): Promise<void> {
  const sectionIndex = props.schema.sections.findIndex((section) => section.rows.some((row) => row.code === rowCode))
  if (sectionIndex === -1) return
  if (sectionIndex !== props.activeSectionIndex) emit('updateSectionIndex', sectionIndex)
  await nextTick()
  const rowElement = document.getElementById(`form-row-${rowCode}`)
  if (!rowElement) return
  rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  rowElement.querySelector<HTMLInputElement>('input:not([readonly]):not([disabled])')?.focus({ preventScroll: true })
}

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
            <span v-if="sectionStats[idx].errors > 0" class="sec-badge is-error" :title="`Ошибок: ${sectionStats[idx].errors}`">{{ sectionStats[idx].errors }}</span>
            <span v-else-if="sectionStats[idx].revisions > 0" class="sec-badge is-revision" :title="`Строк к уточнению: ${sectionStats[idx].revisions}`">↩{{ sectionStats[idx].revisions }}</span>
            <span v-else-if="sectionStats[idx].warnings > 0" class="sec-badge is-warning" :title="`Предупреждений: ${sectionStats[idx].warnings}`">!</span>
            <span v-else-if="sectionStats[idx].total > 0 && sectionStats[idx].filled === sectionStats[idx].total" class="sec-badge is-done" title="Раздел заполнен">✓</span>
            <span v-else-if="sectionStats[idx].total > 0" class="sec-badge is-progress" title="Заполнено строк">{{ sectionStats[idx].filled }}/{{ sectionStats[idx].total }}</span>
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
          <div v-if="hasErrors" class="submit-blocked-hint">
            Отправка недоступна: есть ошибки ({{ errorIssues.length }}).
            <button type="button" class="link-btn" @click="focusRow(errorIssues[0].rowCode)">Перейти к первой ошибке</button>
          </div>
          <AppButton
            variant="secondary"
            :loading="props.isSaving"
            class="save-action-btn"
            @click="emit('saveDraft')"
          >
            💾 {{ props.isSaving ? 'Сохранение…' : 'Сохранить черновик' }}
          </AppButton>
        </div>

        <div v-if="!isReadonly && (props.isDirty || lastSavedTime)" class="save-status">
          <span v-if="props.isDirty">● Есть несохранённые изменения, автосохранение…</span>
          <span v-else>✓ Сохранено в {{ lastSavedTime }}</span>
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
        <ul v-if="revisionItems.length > 0" class="revision-list">
          <li v-for="item in revisionItems" :key="item.code">
            <button type="button" class="link-btn inline" @click="focusRow(item.code)">Строка {{ item.code }} →</button>
            <span class="revision-row-title">{{ item.title }}</span>
            <span v-if="item.comment" class="revision-row-comment">{{ item.comment }}</span>
          </li>
        </ul>
      </AppAlert>

      <!-- Блок сводки ошибок и контрольных соотношений -->
      <ValidationSummary
        :issues="props.validationIssues"
        :confirmed-warnings="props.report.confirmedWarnings"
        :readonly="isReadonly"
        @confirm-warning="(ruleId, val) => emit('confirmWarning', ruleId, val)"
        @focus-row="focusRow"
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
          :revision-notes="revisionNotes"
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

.submit-blocked-hint {
  font-size: 0.8rem;
  line-height: 1.4;
  color: #b91c1c;
}

.link-btn {
  display: block;
  margin-top: 0.15rem;
  padding: 0;
  background: none;
  border: none;
  color: #2563eb;
  font: inherit;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.revision-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0.6rem 0 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.15rem 0.6rem;
  }
}

.link-btn.inline {
  display: inline;
  margin: 0;
  white-space: nowrap;
}

.revision-row-title {
  color: #475569;
}

.revision-row-comment {
  font-weight: 700;
  color: #b45309;
}

.save-status {
  font-size: 0.78rem;
  color: #64748b;
}

.sec-badge {
  flex-shrink: 0;
  min-width: 1.5rem;
  margin-left: auto;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  text-align: center;

  &.is-error { background: #fee2e2; color: #b91c1c; }
  &.is-warning { background: #fef3c7; color: #b45309; }
  &.is-revision { background: #ffedd5; color: #c2410c; }
  &.is-done { background: #dcfce7; color: #15803d; }
  &.is-progress { background: #f1f5f9; color: #64748b; }
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
