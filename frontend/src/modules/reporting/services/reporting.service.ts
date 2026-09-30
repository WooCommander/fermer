import { httpClient } from '@/api'
import type { ReportUIModel, ValidationIssue } from '@/shared/types'
import { toReportUIModel } from '../adapters/report.adapter'
import { getFormSchemaByCode } from '../schemas'
import { validateFormValues, evaluateFormulaExpression } from '@/shared/lib'

export class ReportingService {
  async fetchReportsByFarm(farmId: string): Promise<ReportUIModel[]> {
    const dtos = await httpClient.getReportsByFarm(farmId)
    return dtos.map(toReportUIModel)
  }

  async fetchReportById(reportId: string): Promise<ReportUIModel | null> {
    const dto = await httpClient.getReportById(reportId)
    return dto ? toReportUIModel(dto) : null
  }

  async saveDraft(report: ReportUIModel): Promise<ReportUIModel> {
    const dto = await httpClient.saveDraft({
      report_id: report.id,
      values: report.values,
      row_comments: report.rowComments,
      confirmed_warnings: report.confirmedWarnings,
    })
    return toReportUIModel(dto)
  }

  async submitReport(reportId: string): Promise<ReportUIModel> {
    const dto = await httpClient.submitReport({ report_id: reportId })
    return toReportUIModel(dto)
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

  calculateCompletionPercent(report: ReportUIModel): number {
    const schema = getFormSchemaByCode(report.formCode)
    const allInputRows = schema.sections
      .flatMap((s) => s.rows)
      .filter((r) => !r.isCalculated)

    if (allInputRows.length === 0) return 100

    const filledCount = allInputRows.filter((r) => {
      const val = report.values[r.code]
      return val !== null && val !== undefined && !isNaN(val)
    }).length

    return Math.round((filledCount / allInputRows.length) * 100)
  }
}

export const reportingService = new ReportingService()
