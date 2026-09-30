<script setup lang="ts">
import { computed } from 'vue'
import type { ReportHistoryEvent } from '@/shared/types'

interface Props {
  history: ReportHistoryEvent[]
}

const props = defineProps<Props>()

const events = computed(() => [...props.history].sort((first, second) => {
  return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
}))

function actionLabel(action: ReportHistoryEvent['action']): string {
  const labels: Record<ReportHistoryEvent['action'], string> = {
    created: 'Отчёт создан',
    saved: 'Черновик сохранён',
    submitted: 'Отчёт отправлен',
    returned: 'Возвращён на уточнение',
    approved: 'Отчёт принят',
  }
  return labels[action]
}

function actorLabel(actor: ReportHistoryEvent['actor']): string {
  const labels: Record<ReportHistoryEvent['actor'], string> = {
    farmer: 'Фермер',
    specialist: 'Регистратор',
    system: 'Система',
  }
  return labels[actor]
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <section class="report-history">
    <div class="history-header">
      <h3>История документа</h3>
      <span>{{ events.length }} событий</span>
    </div>

    <ol v-if="events.length" class="history-list">
      <li v-for="event in events" :key="event.id" :class="['history-event', `is-${event.action}`]">
        <span class="history-marker" />
        <div class="history-content">
          <div class="event-main">
            <strong>{{ actionLabel(event.action) }}</strong>
            <span class="actor">{{ actorLabel(event.actor) }}</span>
          </div>
          <time :datetime="event.createdAt">{{ formatDate(event.createdAt) }}</time>
          <p v-if="event.comment" class="event-comment">{{ event.comment }}</p>
        </div>
      </li>
    </ol>
    <p v-else class="history-empty">События по отчёту пока не зафиксированы.</p>
  </section>
</template>

<style scoped lang="scss">
.report-history { padding: 1.15rem 1.25rem; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff; }
.history-header, .event-main { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
.history-header { margin-bottom: 1rem; }
.history-header h3 { margin: 0; color: #0f172a; font-size: 1rem; }
.history-header span, time { color: #64748b; font-size: 0.8rem; }
.history-list { display: flex; flex-direction: column; gap: 0.85rem; margin: 0; padding: 0; list-style: none; }
.history-event { position: relative; display: grid; grid-template-columns: 18px 1fr; gap: 0.7rem; }
.history-event:not(:last-child)::before { position: absolute; top: 16px; bottom: -14px; left: 8px; width: 2px; background: #e2e8f0; content: ''; }
.history-marker { width: 10px; height: 10px; margin-top: 0.3rem; border: 3px solid #94a3b8; border-radius: 50%; background: #ffffff; z-index: 1; }
.is-submitted .history-marker { border-color: #3b82f6; }
.is-returned .history-marker { border-color: #f59e0b; }
.is-approved .history-marker { border-color: #10b981; }
.history-content { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
.event-main strong { color: #1e293b; }
.actor { padding: 0.12rem 0.45rem; border-radius: 999px; color: #475569; background: #f1f5f9; font-size: 0.75rem; white-space: nowrap; }
.event-comment { margin: 0.25rem 0 0; padding: 0.55rem 0.65rem; border-radius: 7px; color: #92400e; background: #fffbeb; font-size: 0.85rem; line-height: 1.45; white-space: pre-wrap; }
.history-empty { margin: 0; color: #64748b; font-size: 0.9rem; }
</style>
