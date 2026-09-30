import type { ReportDto } from '@/api'
import type { ReportHistoryAction, ReportStatus, ReportUIModel } from '@/shared/types'

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
    history: (dto.history ?? []).map((event) => ({
      id: event.id,
      action: event.action as ReportHistoryAction,
      actor: event.actor,
      createdAt: event.created_at,
      fromStatus: event.from_status as ReportStatus | undefined,
      toStatus: event.to_status as ReportStatus,
      comment: event.comment,
    })),
    revisionComment: dto.revision_comment,
    updatedAt: dto.updated_at,
    submittedAt: dto.submitted_at,
    approvedAt: dto.approved_at,
    deletedAt: dto.deleted_at ?? null,
  }
}
