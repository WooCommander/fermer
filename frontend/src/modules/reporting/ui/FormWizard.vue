<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ReportUIModel, FormSchema, ValidationIssue } from '@/shared/types'
import { AppButton, AppProgressBar, AppBadge, AppAlert } from '@/shared/ui'
import FormSectionView from './FormSectionView.vue'
import ValidationSummary from './ValidationSummary.vue'
import ReportSubmitDialog from './ReportSubmitDialog.vue'

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
  <div class="form-wizard">
    <!-- Шапка отчета -->
    <div class="wizard-header">
      <div class="title-row">
        <div>
          <span class="form-tag">{{ props.schema.formCode }}</span>
          <h2 class="form-main-title">{{ props.schema.title }}</h2>
        </div>
        <AppBadge :status="props.report.status" />
      </div>

      <div class="meta-row">
        <span>📅 Период: <b>{{ props.report.period }}</b></span>
        <span>⏱ Срок: <b>{{ props.schema.frequency }}</b></span>
      </div>

      <!-- Причина возврата на уточнение (если есть) -->
      <AppAlert
        v-if="props.report.status === 'needs_revision' && props.report.revisionComment"
        variant="warning"
        title="Замечание инспектора статистики"
      >
        {{ props.report.revisionComment }}
      </AppAlert>

      <!-- Прогресс заполнения -->
      <div class="progress-box">
        <div class="progress-title">
          <span>Заполнение формы</span>
          <b>{{ props.completionPercent }}%</b>
        </div>
        <AppProgressBar :value="props.completionPercent" :show-label="false" />
      </div>
    </div>

    <!-- Вкладки разделов (Wizard Steps) -->
    <div class="section-tabs-wrapper">
      <div class="section-tabs">
        <button
          v-for="(sec, idx) in props.schema.sections"
          :key="sec.id"
          type="button"
          :class="['section-tab-btn', { active: idx === props.activeSectionIndex }]"
          @click="emit('updateSectionIndex', idx)"
        >
          <span class="tab-index">{{ sec.code }}</span>
          <span class="tab-title">{{ sec.title.replace(/^[0-9.]+\s*/, '') }}</span>
        </button>
      </div>
    </div>

    <!-- Список ошибок и предупреждений -->
    <ValidationSummary
      :issues="props.validationIssues"
      :confirmed-warnings="props.report.confirmedWarnings"
      :readonly="isReadonly"
      @confirm-warning="(ruleId, val) => emit('confirmWarning', ruleId, val)"
    />

    <!-- Активный раздел формы -->
    <div class="section-content-box">
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

    <!-- Всплывающее уведомление об автосохранении -->
    <div v-if="props.saveNotice" class="save-toast">
      <span>💾 {{ props.saveNotice }}</span>
    </div>

    <!-- Нижняя панель действий -->
    <div class="wizard-footer">
      <div class="footer-left">
        <AppButton
          v-if="props.activeSectionIndex > 0"
          variant="secondary"
          @click="prevSection"
        >
          ← Назад
        </AppButton>
        <AppButton
          v-if="!isReadonly"
          variant="ghost"
          :loading="props.isSaving"
          @click="emit('saveDraft')"
        >
          {{ props.isSaving ? 'Сохранение…' : 'Сохранить черновик' }}
        </AppButton>
      </div>

      <div class="footer-right">
        <AppButton
          v-if="props.activeSectionIndex < props.schema.sections.length - 1"
          variant="primary"
          @click="nextSection"
        >
          Далее →
        </AppButton>

        <AppButton
          v-else-if="!isReadonly"
          variant="success"
          :disabled="hasErrors"
          :loading="props.isSubmitting"
          @click="onSubmitClick"
        >
          Отправить отчет →
        </AppButton>
      </div>
    </div>

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
.form-wizard {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 760px;
  margin: 0 auto;
  padding-bottom: 5rem;
}

.wizard-header {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.form-tag {
  font-size: 0.75rem;
  font-weight: 700;
  color: #10b981;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-main-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0.2rem 0 0;
  line-height: 1.35;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.82rem;
  color: #64748b;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f1f5f9;

  b {
    color: #334155;
  }
}

.progress-box {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.progress-title {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: #475569;
}

.section-tabs-wrapper {
  overflow-x: auto;
  margin: -0.25rem 0;
  padding-bottom: 0.25rem;
}

.section-tabs {
  display: flex;
  gap: 0.5rem;
  min-width: max-content;
}

.section-tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.85rem;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;

  .tab-index {
    font-weight: 700;
    font-size: 0.82rem;
    color: #64748b;
    background: #f1f5f9;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
  }

  .tab-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #334155;
  }

  &:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
  }

  &.active {
    border-color: #10b981;
    background: #f0fdf4;

    .tab-index {
      background: #10b981;
      color: #ffffff;
    }

    .tab-title {
      color: #065f46;
    }
  }
}

.section-content-box {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.save-toast {
  position: fixed;
  bottom: 5.5rem;
  right: 1.5rem;
  background: #1e293b;
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 100;
  animation: fadeIn 0.3s ease;
}

.wizard-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  padding: 0.85rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
  z-index: 50;

  .footer-left,
  .footer-right {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
