export interface ReportDto {
  id: string
  farm_id: string
  farm_name: string
  fiscal_code: string
  district: string
  form_code: string
  form_title: string
  period: string
  year: number
  status: string
  values: Record<string, number | null>
  previous_values: Record<string, number | null>
  row_comments: Record<string, string>
  confirmed_warnings: Record<string, boolean>
  revision_comment?: string
  updated_at: string
  submitted_at?: string
  approved_at?: string
  deleted_at?: string | null
}

export interface SaveDraftDto {
  report_id: string
  values: Record<string, number | null>
  row_comments?: Record<string, string>
  confirmed_warnings?: Record<string, boolean>
}

export interface SubmitReportDto {
  report_id: string
}

export interface ReviewReportDto {
  report_id: string
  action: 'approve' | 'reject'
  revision_comment?: string
}
