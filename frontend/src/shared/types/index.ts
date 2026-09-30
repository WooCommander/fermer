export type UserRole = 'farmer' | 'specialist' | 'admin'

export interface UserAccount {
  id: string
  login: string
  name: string
  role: UserRole
  phone?: string
  email?: string
  district?: string
  districts?: string[]
  farmId?: string
  createdAt: string
  deletedAt?: string | null
}

export type ReportStatus =
  | 'draft'
  | 'in_progress'
  | 'ready_to_submit'
  | 'submitted'
  | 'needs_revision'
  | 'approved'

export type ReportHistoryAction = 'created' | 'saved' | 'submitted' | 'returned' | 'approved'

export interface ReportHistoryEvent {
  id: string
  action: ReportHistoryAction
  actor: 'farmer' | 'specialist' | 'system'
  createdAt: string
  fromStatus?: ReportStatus
  toStatus: ReportStatus
  comment?: string
}

export type ActivityType = 'crops' | 'livestock' | 'mixed'

export interface KeyValuePair<T = unknown> {
  [key: string]: T
}

export interface FarmProfile {
  id: string
  name: string
  shortName: string
  fiscalCode: string
  district: string
  settlement: string
  phone: string
  contactPerson: string
  activityType: ActivityType
  assignedForms: string[]
  deletedAt?: string | null
}

export type ValueType = 'number' | 'integer' | 'text' | 'boolean'

export interface ValidationRule {
  id: string
  type: 'formula_equals' | 'formula_gte' | 'formula_lte' | 'max_decrease_percent' | 'required_if'
  targetRowCode: string
  expression: string
  message: string
  severity: 'error' | 'warning'
}

export interface FormRowSchema {
  code: string
  title: string
  unit: string
  valueType: ValueType
  precision?: number
  isCalculated?: boolean
  calculationFormula?: string
  hint?: string
  isHeader?: boolean
  indent?: number
}

export interface FormSectionSchema {
  id: string
  code: string
  title: string
  description?: string
  activityGroup?: ActivityType | 'all'
  rows: FormRowSchema[]
}

export interface FormSchema {
  formCode: string
  title: string
  periodType: 'annual' | 'quarterly' | 'monthly'
  frequency: string
  submissionDeadline?: {
    month: number
    day: number
    yearOffset?: number
  }
  sections: FormSectionSchema[]
  validationRules: ValidationRule[]
}

export type AuditAction =
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_restored'
  | 'report_created'
  | 'report_submitted'
  | 'report_returned'
  | 'report_approved'
  | 'form_settings_updated'
  | 'help_settings_updated'
  | 'notification_settings_updated'
  | 'farm_contacts_updated'

export type AuditObjectType = 'session' | 'user' | 'farm' | 'report' | 'settings'

export interface AuditEntry {
  id: string
  createdAt: string
  actorId: string
  actorName: string
  actorRole: UserRole | 'system'
  action: AuditAction
  objectType: AuditObjectType
  objectId?: string
  objectLabel: string
  before?: string
  after?: string
  details?: string
}

export type NotificationKind =
  | 'period_open'
  | 'deadline_soon'
  | 'deadline_overdue'
  | 'submitted'
  | 'approved'
  | 'returned'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  text: string
  createdAt: string
  reportId?: string
  formCode?: string
  year?: number
}

export interface NotificationRuleSettings {
  enabled: boolean
  template: string
}

export interface NotificationSettings {
  deadlineDays: number
  rules: Record<NotificationKind, NotificationRuleSettings>
}

export interface HelpSettings {
  message: string
  fallbackPhone: string
  fallbackEmail?: string
}

export interface HelpContact {
  name: string
  phone?: string
  email?: string
}

export interface ReportFormSettings {
  formCode: string
  title: string
  isActive: boolean
  submissionStartMonth: number
  submissionStartDay: number
  submissionDeadlineMonth: number
  submissionDeadlineDay: number
  deadlineYearOffset: number
}

export interface ReportItemValue {
  rowCode: string
  value: number | null
  previousPeriodValue?: number | null
  farmerComment?: string
  inspectorComment?: string
  hasWarningConfirmed?: boolean
}

export interface ValidationIssue {
  ruleId: string
  rowCode: string
  message: string
  severity: 'error' | 'warning'
  actualValue?: number | null
  expectedValue?: number | null
}

export interface RevisionRow {
  rowCode: string
  comment?: string
}

export interface ReportUIModel {
  id: string
  farmId: string
  farmName: string
  fiscalCode: string
  district: string
  formCode: string
  formTitle: string
  period: string
  year: number
  status: ReportStatus
  values: Record<string, number | null>
  previousValues: Record<string, number | null>
  rowComments: Record<string, string>
  confirmedWarnings: Record<string, boolean>
  history: ReportHistoryEvent[]
  revisionComment?: string
  revisionRows?: RevisionRow[]
  registrationNumber?: string
  updatedAt: string
  submittedAt?: string
  approvedAt?: string
  deletedAt?: string | null
}
