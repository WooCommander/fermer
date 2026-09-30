<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { AppNotification, NotificationKind } from '@/shared/types'

interface Props {
  notifications: AppNotification[]
  readIds: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'open', notification: AppNotification): void
  (e: 'markAllRead'): void
}>()

const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)

const ICONS: Record<NotificationKind, string> = {
  period_open: '📅',
  deadline_soon: '⏰',
  deadline_overdue: '❗',
  submitted: '✅',
  approved: '🏅',
  returned: '↩️',
}

const unreadCount = computed(() => props.notifications.filter((item) => !props.readIds.includes(item.id)).length)

function isUnread(notification: AppNotification): boolean {
  return !props.readIds.includes(notification.id)
}

function formatWhen(iso: string): string {
  const date = new Date(iso)
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин. назад`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ч. назад`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} дн. назад`
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function onOpenItem(notification: AppNotification): void {
  isOpen.value = false
  emit('open', notification)
}

function onDocumentClick(event: MouseEvent): void {
  if (isOpen.value && root.value && !root.value.contains(event.target as Node)) isOpen.value = false
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') isOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="notification-bell">
    <button
      type="button"
      class="bell-button"
      :aria-label="unreadCount > 0 ? `Уведомления, непрочитанных: ${unreadCount}` : 'Уведомления'"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span aria-hidden="true">🔔</span>
      <span v-if="unreadCount > 0" class="bell-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <div v-if="isOpen" class="bell-panel" role="dialog" aria-label="Лента уведомлений">
      <div class="panel-head">
        <strong>Уведомления</strong>
        <button v-if="unreadCount > 0" type="button" class="mark-all" @click="emit('markAllRead')">
          Отметить все прочитанными
        </button>
      </div>

      <ul v-if="props.notifications.length > 0" class="panel-list">
        <li v-for="item in props.notifications" :key="item.id">
          <button type="button" :class="['notification-item', `kind-${item.kind}`, { unread: isUnread(item) }]" @click="onOpenItem(item)">
            <span class="item-icon" aria-hidden="true">{{ ICONS[item.kind] }}</span>
            <span class="item-body">
              <span class="item-title">{{ item.title }}</span>
              <span class="item-text">{{ item.text }}</span>
              <span class="item-when">{{ formatWhen(item.createdAt) }}</span>
            </span>
            <span v-if="isUnread(item)" class="unread-dot" aria-label="Не прочитано" />
          </button>
        </li>
      </ul>
      <p v-else class="panel-empty">Пока уведомлений нет</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.notification-bell {
  position: relative;
}

.bell-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1.1rem;
  cursor: pointer;

  &:hover {
    border-color: #94a3b8;
  }
}

.bell-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  padding: 0 0.3rem;
  box-sizing: border-box;
  background: #ef4444;
  border: 2px solid #ffffff;
  border-radius: 999px;
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 14px;
  text-align: center;
}

.bell-panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 200;
  width: min(380px, calc(100vw - 1.5rem));
  max-height: min(70vh, 520px);
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.92rem;
}

.mark-all {
  padding: 0;
  background: none;
  border: none;
  color: #2563eb;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.panel-list {
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f8fafc;
  }

  &.unread {
    background: #f0f9ff;
  }

  &.kind-deadline_overdue .item-title,
  &.kind-returned .item-title {
    color: #b91c1c;
  }
}

.item-icon {
  font-size: 1.15rem;
  line-height: 1.3;
}

.item-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.item-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}

.item-text {
  font-size: 0.82rem;
  line-height: 1.35;
  color: #475569;
}

.item-when {
  font-size: 0.72rem;
  color: #94a3b8;
}

.unread-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-top: 0.4rem;
  background: #3b82f6;
  border-radius: 50%;
}

.panel-empty {
  margin: 0;
  padding: 1.5rem 1rem;
  color: #94a3b8;
  font-size: 0.88rem;
  text-align: center;
}
</style>
