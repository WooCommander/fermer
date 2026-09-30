import type { AuditAction, AuditObjectType } from '@/shared/types'

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  login: 'Вход в систему',
  login_failed: 'Неудачная попытка входа',
  logout: 'Выход из системы',
  user_created: 'Создание пользователя',
  user_updated: 'Изменение пользователя',
  user_deleted: 'Деактивация пользователя',
  user_restored: 'Восстановление пользователя',
  report_created: 'Создание отчёта',
  report_submitted: 'Отправка отчёта',
  report_returned: 'Возврат на уточнение',
  report_approved: 'Принятие отчёта',
  form_settings_updated: 'Изменение сроков формы',
  help_settings_updated: 'Изменение справочной службы',
  notification_settings_updated: 'Изменение уведомлений',
  farm_contacts_updated: 'Изменение контактов хозяйства',
}

export const AUDIT_OBJECT_LABELS: Record<AuditObjectType, string> = {
  session: 'Сессия',
  user: 'Пользователь',
  farm: 'Хозяйство',
  report: 'Отчёт',
  settings: 'Настройки',
}

export const AUDIT_ROLE_LABELS: Record<string, string> = {
  farmer: 'Фермер',
  specialist: 'Специалист',
  admin: 'Администратор',
  system: 'Система',
}

// Тон подсветки действия в таблице: опасные и важные события заметнее обычных
export function auditActionTone(action: AuditAction): 'danger' | 'warning' | 'success' | 'neutral' {
  if (action === 'login_failed' || action === 'user_deleted') return 'danger'
  if (action === 'report_returned') return 'warning'
  if (action === 'report_approved' || action === 'report_submitted') return 'success'
  return 'neutral'
}
