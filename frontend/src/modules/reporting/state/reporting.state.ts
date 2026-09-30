import { reactive, computed } from 'vue'
import type { HelpContact, HelpSettings, ReportFormSettings, ReportUIModel, ValidationIssue } from '@/shared/types'

interface ReportingState {
  reports: ReportUIModel[]
  formSettings: ReportFormSettings[]
  helpSettings: HelpSettings
  helpContacts: HelpContact[]
  activeReport: ReportUIModel | null
  activeSectionIndex: number
  validationIssues: ValidationIssue[]
  isSaving: boolean
  isDirty: boolean
  lastSavedAt: string | null
  isSubmitting: boolean
  saveNotice: string | null
}

const state = reactive<ReportingState>({
  reports: [],
  formSettings: [],
  helpSettings: { message: '', fallbackPhone: '', fallbackEmail: '' },
  helpContacts: [],
  activeReport: null,
  activeSectionIndex: 0,
  validationIssues: [],
  isSaving: false,
  isDirty: false,
  lastSavedAt: null,
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
  setHelpSettings(settings: HelpSettings) {
    state.helpSettings = settings
  },
  setHelpContacts(contacts: HelpContact[]) {
    state.helpContacts = contacts
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
    state.isDirty = false
    state.lastSavedAt = null
  },
  // Обновляет только серверные поля сохранённого отчёта: введённое пользователем и позиция в форме не трогаются
  mergeSavedMeta(saved: ReportUIModel) {
    const targets = [state.activeReport, state.reports.find((r) => r.id === saved.id)]
    for (const target of targets) {
      if (target && target.id === saved.id) {
        target.status = saved.status
        target.updatedAt = saved.updatedAt
        target.history = saved.history
      }
    }
  },
  setDirty(dirty: boolean) {
    state.isDirty = dirty
  },
  setLastSavedAt(value: string | null) {
    state.lastSavedAt = value
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
