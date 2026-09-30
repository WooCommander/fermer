export interface ReportFormSettingsDto {
  form_code: string
  title: string
  is_active: boolean
  submission_start_month: number
  submission_start_day: number
  submission_deadline_month: number
  submission_deadline_day: number
  deadline_year_offset: number
}

export type UpdateReportFormSettingsDto = Omit<ReportFormSettingsDto, 'form_code' | 'title'>
