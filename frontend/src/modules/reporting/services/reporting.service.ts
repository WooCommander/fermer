import { httpClient } from '@/api'
import type { HelpContact, HelpSettings, ReportFormSettings, ReportUIModel, ValidationIssue } from '@/shared/types'
import { toReportUIModel } from '../adapters/report.adapter'
import { getFormSchemaByCode } from '../schemas'
import { validateFormValues, evaluateFormulaExpression } from '@/shared/lib'

export class ReportingService {
  async fetchFormSettings(): Promise<ReportFormSettings[]> {
    const settings = await httpClient.getReportFormSettings()
    return settings.map((item) => ({
      formCode: item.form_code,
      title: item.title,
      isActive: item.is_active,
      submissionStartMonth: item.submission_start_month,
      submissionStartDay: item.submission_start_day,
      submissionDeadlineMonth: item.submission_deadline_month,
      submissionDeadlineDay: item.submission_deadline_day,
      deadlineYearOffset: item.deadline_year_offset,
    }))
  }

  async updateFormSettings(settings: ReportFormSettings): Promise<ReportFormSettings> {
    const updated = await httpClient.updateReportFormSettings(settings.formCode, {
      is_active: settings.isActive,
      submission_start_month: settings.submissionStartMonth,
      submission_start_day: settings.submissionStartDay,
      submission_deadline_month: settings.submissionDeadlineMonth,
      submission_deadline_day: settings.submissionDeadlineDay,
      deadline_year_offset: settings.deadlineYearOffset,
    })
    return {
      formCode: updated.form_code,
      title: updated.title,
      isActive: updated.is_active,
      submissionStartMonth: updated.submission_start_month,
      submissionStartDay: updated.submission_start_day,
      submissionDeadlineMonth: updated.submission_deadline_month,
      submissionDeadlineDay: updated.submission_deadline_day,
      deadlineYearOffset: updated.deadline_year_offset,
    }
  }

  async fetchHelpSettings(): Promise<HelpSettings> {
    const dto = await httpClient.getHelpSettings()
    return { message: dto.message, fallbackPhone: dto.fallback_phone, fallbackEmail: dto.fallback_email ?? '' }
  }

  async updateHelpSettings(settings: HelpSettings): Promise<HelpSettings> {
    const dto = await httpClient.updateHelpSettings({
      message: settings.message,
      fallback_phone: settings.fallbackPhone,
      fallback_email: settings.fallbackEmail,
    })
    return { message: dto.message, fallbackPhone: dto.fallback_phone, fallbackEmail: dto.fallback_email ?? '' }
  }

  async fetchHelpContacts(district: string): Promise<HelpContact[]> {
    return httpClient.getHelpContacts(district)
  }

  async fetchReportsByFarm(farmId: string): Promise<ReportUIModel[]> {
    const dtos = await httpClient.getReportsByFarm(farmId)
    return dtos.map(toReportUIModel)
  }

  async fetchReportById(reportId: string): Promise<ReportUIModel | null> {
    const dto = await httpClient.getReportById(reportId)
    return dto ? toReportUIModel(dto) : null
  }

  async saveDraft(report: ReportUIModel, autosave = false): Promise<ReportUIModel> {
    const dto = await httpClient.saveDraft({
      report_id: report.id,
      values: report.values,
      row_comments: report.rowComments,
      confirmed_warnings: report.confirmedWarnings,
      autosave,
    })
    return toReportUIModel(dto)
  }

  async submitReport(reportId: string): Promise<ReportUIModel> {
    const dto = await httpClient.submitReport({ report_id: reportId })
    return toReportUIModel(dto)
  }

  async createReport(farmId: string, formCode: string, year: number): Promise<ReportUIModel> {
    const dto = await httpClient.createReport({
      farm_id: farmId,
      form_code: formCode,
      year,
    })
    const report = toReportUIModel(dto)
    const schema = getFormSchemaByCode(formCode)
    report.formTitle = schema.title
    return report
  }

  recalculateFormValues(formCode: string, values: Record<string, number | null>): Record<string, number | null> {
    const schema = getFormSchemaByCode(formCode)
    const nextValues = { ...values }

    // Выполняем 4 прохода для полного каскадного разрешения зависимостей
    // (например 066 -> 062 -> 114 -> 150 -> 161 -> 160)
    for (let pass = 0; pass < 4; pass++) {
      for (const section of schema.sections) {
        for (const row of section.rows) {
          if (row.isCalculated && row.calculationFormula) {
            const calculated = evaluateFormulaExpression(row.calculationFormula, nextValues)
            nextValues[row.code] = calculated
          }
        }
      }
    }

    return nextValues
  }

  validateReport(report: ReportUIModel): ValidationIssue[] {
    const schema = getFormSchemaByCode(report.formCode)
    return validateFormValues(schema.validationRules, report.values, report.previousValues)
  }

  getReportStats(report: ReportUIModel) {
    const schema = getFormSchemaByCode(report.formCode)
    const allInputRows = schema.sections
      .flatMap((s) => s.rows)
      .filter((r) => !r.isCalculated)

    const filledCount = allInputRows.filter((r) => {
      const val = report.values[r.code]
      return val !== null && val !== undefined && !isNaN(val)
    }).length

    const previousFilledCount = allInputRows.filter((r) => {
      const prev = report.previousValues[r.code]
      return prev !== null && prev !== undefined && !isNaN(prev) && prev > 0
    }).length

    const issues = this.validateReport(report)
    const errorCount = issues.filter((i) => i.severity === 'error').length
    const warningCount = issues.filter((i) => i.severity === 'warning').length

    let statusType: 'ready' | 'has_errors' | 'has_warnings' | 'empty' | 'submitted' | 'approved' = 'ready'
    let statusLabel = 'Готов к отправке'

    if (report.status === 'approved') {
      statusType = 'approved'
      statusLabel = 'Принят статистикой'
    } else if (report.status === 'submitted') {
      statusType = 'submitted'
      statusLabel = 'Сдан на проверку'
    } else if (errorCount > 0) {
      statusType = 'has_errors'
      statusLabel = `Ошибки в контроле (${errorCount})`
    } else if (warningCount > 0) {
      statusType = 'has_warnings'
      statusLabel = `Предупреждений: ${warningCount}`
    } else if (filledCount === 0) {
      statusType = 'empty'
      statusLabel = 'Не заполнен'
    }

    return {
      filledCount,
      totalInputs: allInputRows.length,
      previousFilledCount,
      errorCount,
      warningCount,
      statusType,
      statusLabel,
    }
  }

  // Доля заполненных строк ввода (расчётные не считаются); введённый 0 — заполненная строка
  getFillProgress(report: ReportUIModel): { filled: number; total: number; percent: number } {
    const inputRows = getFormSchemaByCode(report.formCode).sections
      .flatMap((section) => section.rows)
      .filter((row) => !row.isCalculated && !row.isHeader)
    const filled = inputRows.filter((row) => {
      const value = report.values[row.code]
      return typeof value === 'number' && !isNaN(value)
    }).length
    return { filled, total: inputRows.length, percent: inputRows.length ? Math.round((filled / inputRows.length) * 100) : 0 }
  }

  calculateCompletionPercent(report: ReportUIModel): number {
    const stats = this.getReportStats(report)
    if (stats.errorCount > 0) return 30
    if (stats.filledCount === 0) return 0
    if (stats.statusType === 'submitted' || stats.statusType === 'approved') return 100
    if (stats.warningCount > 0) return 85
    return 100
  }
}

export const reportingService = new ReportingService()
