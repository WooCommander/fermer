export interface NotificationRuleDto {
  enabled: boolean
  template: string
}

export interface NotificationSettingsDto {
  deadline_days: number
  rules: Record<string, NotificationRuleDto>
}

export type UpdateNotificationSettingsDto = NotificationSettingsDto
