import type { ReportDto } from '@/api'
import type { ReportUIModel, ReportStatus } from '@/shared/types'

export function toReportUIModel(dto: ReportDto): ReportUIModel {
  return {
    id: dto.id,
    farmId: dto.farm_id,
    farmName: dto.farm_name,
    fiscalCode: dto.fiscal_code,
    district: dto.district,
    formCode: dto.form_code,
    formTitle: dto.form_title,
    period: dto.period,
    year: dto.year,
    status: (dto.status as ReportStatus) || 'draft',
    values: { ...dto.values },
    previousValues: { ...dto.previous_values },
    rowComments: { ...dto.row_comments },
    confirmedWarnings: { ...dto.confirmed_warnings },
    revisionComment: dto.revision_comment,
    updatedAt: dto.updated_at,
    submittedAt: dto.submitted_at,
    approvedAt: dto.approved_at,
  }
}
