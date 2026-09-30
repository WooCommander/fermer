import { reactive, computed } from 'vue'
import type { ReportFormSettings, ReportUIModel, ValidationIssue } from '@/shared/types'

interface ReportingState {
  reports: ReportUIModel[]
  formSettings: ReportFormSettings[]
  activeReport: ReportUIModel | null
  activeSectionIndex: number
  validationIssues: ValidationIssue[]
  isSaving: boolean
  isSubmitting: boolean
  saveNotice: string | null
}

const state = reactive<ReportingState>({
  reports: [],
  formSettings: [],
  activeReport: null,
  activeSectionIndex: 0,
  validationIssues: [],
  isSaving: false,
  isSubmitting: false,
  saveNotice: null,
})

export const useReportingState = () => ({
  state: computed(() => state),
  setReports(reports: ReportUIModel[]) {
    state.reports = reports
    if (!state.activeReport && reports.length > 0) {
      state.activeReport = reports[0]
      state.activeSectionIndex = 0
    }
  },
  addReport(report: ReportUIModel) {
    state.reports = [report, ...state.reports]
  },
  setFormSettings(settings: ReportFormSettings[]) {
    state.formSettings = settings
  },
  updateFormSettings(settings: ReportFormSettings) {
    const index = state.formSettings.findIndex((item) => item.formCode === settings.formCode)
    if (index !== -1) state.formSettings[index] = settings
  },
  setActiveReport(report: ReportUIModel | null) {
    state.activeReport = report
    state.activeSectionIndex = 0
    state.validationIssues = []
    state.saveNotice = null
  },
  setActiveSectionIndex(index: number) {
    state.activeSectionIndex = index
  },
  setRowValue(rowCode: string, value: number | null) {
    if (state.activeReport) {
      state.activeReport.values[rowCode] = value
    }
  },
  setAllValues(values: Record<string, number | null>) {
    if (state.activeReport) {
      state.activeReport.values = { ...values }
    }
  },
  setRowComment(rowCode: string, comment: string) {
    if (state.activeReport) {
      state.activeReport.rowComments[rowCode] = comment
    }
  },
  confirmWarning(ruleId: string, confirmed: boolean) {
    if (state.activeReport) {
      state.activeReport.confirmedWarnings[ruleId] = confirmed
    }
  },
  setValidationIssues(issues: ValidationIssue[]) {
    state.validationIssues = issues
  },
  setIsSaving(saving: boolean) {
    state.isSaving = saving
  },
  setIsSubmitting(submitting: boolean) {
    state.isSubmitting = submitting
  },
  setSaveNotice(msg: string | null) {
    state.saveNotice = msg
  },
})
