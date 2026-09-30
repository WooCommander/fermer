export type AuditActionDto =
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

export type AuditObjectTypeDto = 'session' | 'user' | 'farm' | 'report' | 'settings'

export interface AuditActorDto {
  id: string
  name: string
  role: 'farmer' | 'specialist' | 'admin'
}

// Запись журнала: в настоящей системе её создаёт сервер, клиент только читает
export interface AuditEntryDto {
  id: string
  created_at: string
  actor_id: string
  actor_name: string
  actor_role: 'farmer' | 'specialist' | 'admin' | 'system'
  action: AuditActionDto
  object_type: AuditObjectTypeDto
  object_id?: string
  object_label: string
  before?: string
  after?: string
  details?: string
}
