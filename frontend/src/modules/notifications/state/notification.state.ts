import { reactive, computed } from 'vue'
import type { NotificationSettings } from '@/shared/types'

const READ_STORAGE_PREFIX = 'agrostat_notifications_read_'

interface NotificationState {
  settings: NotificationSettings | null
  defaults: NotificationSettings | null
  readIds: string[]
  userId: string | null
}

const state = reactive<NotificationState>({
  settings: null,
  defaults: null,
  readIds: [],
  userId: null,
})

function persistRead(): void {
  if (!state.userId) return
  try {
    localStorage.setItem(READ_STORAGE_PREFIX + state.userId, JSON.stringify(state.readIds))
  } catch {
    // localStorage недоступен — отметки о прочтении не переживут перезагрузку
  }
}

export const useNotificationState = () => ({
  state: computed(() => state),
  setSettings(settings: NotificationSettings) {
    state.settings = settings
  },
  setDefaults(settings: NotificationSettings) {
    state.defaults = settings
  },
  // Прочитанное хранится отдельно для каждого пользователя
  loadRead(userId: string) {
    state.userId = userId
    try {
      const parsed = JSON.parse(localStorage.getItem(READ_STORAGE_PREFIX + userId) ?? '[]') as unknown
      state.readIds = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
    } catch {
      state.readIds = []
    }
  },
  clearRead() {
    state.userId = null
    state.readIds = []
  },
  markRead(ids: string[]) {
    const fresh = ids.filter((id) => !state.readIds.includes(id))
    if (fresh.length === 0) return
    state.readIds = [...state.readIds, ...fresh]
    persistRead()
  },
})
