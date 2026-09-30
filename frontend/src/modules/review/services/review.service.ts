import { httpClient } from '@/api'
import type { ReportUIModel, RevisionRow } from '@/shared/types'
import { toReviewReportModel } from '../adapters/review.adapter'

export class ReviewService {
  async fetchAllReports(): Promise<ReportUIModel[]> {
    const dtos = await httpClient.getAllReports()
    return dtos.map(toReviewReportModel)
  }

  async approveReport(reportId: string): Promise<ReportUIModel> {
    const dto = await httpClient.reviewReport({
      report_id: reportId,
      action: 'approve',
    })
    return toReviewReportModel(dto)
  }

  async returnForRevision(reportId: string, comment: string, rows: RevisionRow[] = []): Promise<ReportUIModel> {
    const dto = await httpClient.reviewReport({
      report_id: reportId,
      action: 'reject',
      revision_comment: comment,
      revision_rows: rows.map((row) => ({ row_code: row.rowCode, comment: row.comment })),
    })
    return toReviewReportModel(dto)
  }
}

export const reviewService = new ReviewService()
