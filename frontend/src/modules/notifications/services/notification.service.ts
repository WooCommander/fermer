import { httpClient } from '@/api'
import type { NotificationKind, NotificationSettings } from '@/shared/types'

function toModel(dto: Awaited<ReturnType<typeof httpClient.getNotificationSettings>>): NotificationSettings {
  return {
    deadlineDays: dto.deadline_days,
    rules: Object.fromEntries(
      Object.entries(dto.rules).map(([kind, rule]) => [kind, { enabled: rule.enabled, template: rule.template }]),
    ) as NotificationSettings['rules'],
  }
}

export class NotificationService {
  async fetchSettings(): Promise<NotificationSettings> {
    return toModel(await httpClient.getNotificationSettings())
  }

  async updateSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    const dto = await httpClient.updateNotificationSettings({
      deadline_days: settings.deadlineDays,
      rules: Object.fromEntries(
        (Object.keys(settings.rules) as NotificationKind[]).map((kind) => [kind, { ...settings.rules[kind] }]),
      ),
    })
    return toModel(dto)
  }

  async fetchDefaultSettings(): Promise<NotificationSettings> {
    return toModel(await httpClient.getDefaultNotificationSettings())
  }
}

export const notificationService = new NotificationService()
