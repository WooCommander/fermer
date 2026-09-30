<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AuditAction, AuditEntry } from '@/shared/types'
import { AppButton, AppSpinner } from '@/shared/ui'
import { downloadCsv } from '@/shared/lib'
import { AUDIT_ACTION_LABELS, AUDIT_OBJECT_LABELS, AUDIT_ROLE_LABELS, auditActionTone } from '../lib/audit-labels'

const props = defineProps<{ entries: AuditEntry[]; isLoading?: boolean }>()
const emit = defineEmits<{ (e: 'refresh'): void }>()

const PAGE_SIZES = [25, 50, 100]

const dateFrom = ref('')
const dateTo = ref('')
const actorId = ref('all')
const role = ref('all')
const action = ref<'all' | AuditAction>('all')
const search = ref('')
const pageSize = ref(PAGE_SIZES[0])
const page = ref(1)

const actors = computed(() => {
  const byId = new Map<string, string>()
  for (const entry of props.entries) byId.set(entry.actorId, entry.actorName)
  return Array.from(byId, ([id, name]) => ({ id, name })).sort((first, second) => first.name.localeCompare(second.name, 'ru'))
})

const presentActions = computed(() => {
  const present = new Set(props.entries.map((entry) => entry.action))
  return (Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]).filter((key) => present.has(key))
})

const filtered = computed(() => {
  const from = dateFrom.value ? new Date(`${dateFrom.value}T00:00:00`).getTime() : null
  const to = dateTo.value ? new Date(`${dateTo.value}T23:59:59.999`).getTime() : null
  const query = search.value.trim().toLowerCase()

  return props.entries.filter((entry) => {
    const time = new Date(entry.createdAt).getTime()
    if (from !== null && time < from) return false
    if (to !== null && time > to) return false
    if (actorId.value !== 'all' && entry.actorId !== actorId.value) return false
    if (role.value !== 'all' && entry.actorRole !== role.value) return false
    if (action.value !== 'all' && entry.action !== action.value) return false
    if (query) {
      const haystack = [entry.actorName, entry.objectLabel, entry.details, entry.before, entry.after].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })
})

const hasFilters = computed(() =>
  Boolean(dateFrom.value || dateTo.value || search.value.trim()) || actorId.value !== 'all' || role.value !== 'all' || action.value !== 'all',
)

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const currentPage = computed(() => Math.min(page.value, pageCount.value))
const pageEntries = computed(() => filtered.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const pageStart = computed(() => (filtered.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0))
const pageEnd = computed(() => Math.min(currentPage.value * pageSize.value, filtered.value.length))

watch([dateFrom, dateTo, actorId, role, action, search, pageSize], () => { page.value = 1 })

function resetFilters(): void {
  dateFrom.value = ''
  dateTo.value = ''
  actorId.value = 'all'
  role.value = 'all'
  action.value = 'all'
  search.value = ''
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'medium' })
}

function exportCsv(): void {
  const stamp = new Date().toISOString().slice(0, 10)
  downloadCsv(
    `agrostat-audit-${stamp}.csv`,
    ['Время', 'Пользователь', 'Роль', 'Действие', 'Тип объекта', 'Объект', 'Было', 'Стало', 'Подробности'],
    filtered.value.map((entry) => [
      formatTime(entry.createdAt),
      entry.actorName,
      AUDIT_ROLE_LABELS[entry.actorRole] ?? entry.actorRole,
      AUDIT_ACTION_LABELS[entry.action],
      AUDIT_OBJECT_LABELS[entry.objectType],
      entry.objectLabel,
      entry.before,
      entry.after,
      entry.details,
    ]),
  )
}
</script>

<template>
  <section class="audit-log">
    <div class="audit-heading">
      <div>
        <h2>Журнал действий</h2>
        <p>Кто, когда и что делал в системе. Записи нельзя изменить или удалить из интерфейса.</p>
      </div>
      <div class="heading-actions">
        <AppButton size="sm" variant="secondary" :disabled="props.isLoading" @click="emit('refresh')">Обновить</AppButton>
        <AppButton size="sm" variant="secondary" :disabled="filtered.length === 0" @click="exportCsv">
          Скачать CSV ({{ filtered.length }})
        </AppButton>
      </div>
    </div>

    <div class="audit-filters">
      <label>Период с<input v-model="dateFrom" type="date" :max="dateTo || undefined" /></label>
      <label>по<input v-model="dateTo" type="date" :min="dateFrom || undefined" /></label>
      <label>
        Пользователь
        <select v-model="actorId">
          <option value="all">Все</option>
          <option v-for="actor in actors" :key="actor.id" :value="actor.id">{{ actor.name }}</option>
        </select>
      </label>
      <label>
        Роль
        <select v-model="role">
          <option value="all">Все</option>
          <option v-for="(label, key) in AUDIT_ROLE_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
      </label>
      <label>
        Действие
        <select v-model="action">
          <option value="all">Все</option>
          <option v-for="key in presentActions" :key="key" :value="key">{{ AUDIT_ACTION_LABELS[key] }}</option>
        </select>
      </label>
      <label class="search-field">
        Поиск
        <input v-model="search" type="text" placeholder="Объект, пользователь, изменение" />
      </label>
      <button v-if="hasFilters" type="button" class="reset-btn" @click="resetFilters">Сбросить фильтры</button>
    </div>

    <div class="table-wrapper">
      <AppSpinner v-if="props.isLoading" overlay label="Загрузка журнала…" />
      <table class="audit-table">
        <thead>
          <tr>
            <th>Время</th>
            <th>Пользователь</th>
            <th>Действие</th>
            <th>Объект</th>
            <th>Изменения</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in pageEntries" :key="entry.id">
            <td class="time-cell">{{ formatTime(entry.createdAt) }}</td>
            <td>
              <div class="actor-cell">
                <b>{{ entry.actorName }}</b>
                <small>{{ AUDIT_ROLE_LABELS[entry.actorRole] ?? entry.actorRole }}</small>
              </div>
            </td>
            <td><span :class="['action-tag', `tone-${auditActionTone(entry.action)}`]">{{ AUDIT_ACTION_LABELS[entry.action] }}</span></td>
            <td>
              <div class="object-cell">
                <small>{{ AUDIT_OBJECT_LABELS[entry.objectType] }}</small>
                <span>{{ entry.objectLabel }}</span>
              </div>
            </td>
            <td class="changes-cell">
              <template v-if="entry.before || entry.after">
                <div v-if="entry.before" class="change-block was"><small>Было</small>{{ entry.before }}</div>
                <div v-if="entry.after" class="change-block became"><small>Стало</small>{{ entry.after }}</div>
              </template>
              <span v-if="entry.details" class="details-text">{{ entry.details }}</span>
              <span v-if="!entry.before && !entry.after && !entry.details" class="no-changes">—</span>
            </td>
          </tr>
          <tr v-if="pageEntries.length === 0">
            <td colspan="5" class="empty-cell">
              {{ props.entries.length === 0 ? 'Журнал пока пуст' : 'По заданным фильтрам записей не найдено' }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filtered.length > 0" class="pagination-bar">
        <span>Показано {{ pageStart }}–{{ pageEnd }} из {{ filtered.length }}</span>
        <div class="pagination-actions">
          <label class="page-size">
            На странице
            <select v-model.number="pageSize">
              <option v-for="size in PAGE_SIZES" :key="size" :value="size">{{ size }}</option>
            </select>
          </label>
          <AppButton size="sm" variant="secondary" :disabled="currentPage === 1" @click="page = currentPage - 1">Назад</AppButton>
          <span>Страница {{ currentPage }} из {{ pageCount }}</span>
          <AppButton size="sm" variant="secondary" :disabled="currentPage === pageCount" @click="page = currentPage + 1">Далее</AppButton>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.audit-log {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.audit-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;

  h2 { margin: 0; font-size: 1.1rem; }
  p { margin: 0.3rem 0 0; color: #64748b; font-size: 0.88rem; }
}

.heading-actions {
  display: flex;
  gap: 0.5rem;
}

.audit-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem 1rem;
  align-items: end;
  padding: 1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;

  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
    color: #64748b;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  input,
  select {
    width: 100%;
    height: 38px;
    box-sizing: border-box;
    padding: 0 0.65rem;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    color: #1e293b;
    font: inherit;
    font-size: 0.86rem;
    font-weight: 400;
    letter-spacing: 0;
    text-transform: none;

    &:focus {
      outline: none;
      border-color: #10b981;
    }
  }

  .search-field {
    grid-column: span 2;
  }
}

.reset-btn {
  height: 38px;
  padding: 0 0.75rem;
  background: none;
  border: none;
  color: #2563eb;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;

  &:hover { text-decoration: underline; }
}

.table-wrapper {
  position: relative;
  min-height: 120px;
  overflow-x: auto;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.audit-table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
  font-size: 0.86rem;
  text-align: left;

  th {
    padding: 0.7rem 1rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    color: #475569;
    font-weight: 700;
    white-space: nowrap;
  }

  td {
    padding: 0.7rem 1rem;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    vertical-align: top;
  }

  tbody tr:hover td { background: #f8fafc; }
}

.time-cell {
  white-space: nowrap;
  color: #475569;
}

.actor-cell,
.object-cell {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;

  small { color: #64748b; font-size: 0.75rem; }
}

.action-tag {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;

  &.tone-neutral { background: #f1f5f9; color: #334155; }
  &.tone-success { background: #dcfce7; color: #15803d; }
  &.tone-warning { background: #fef3c7; color: #b45309; }
  &.tone-danger { background: #fee2e2; color: #b91c1c; }
}

.changes-cell {
  min-width: 260px;
}

.change-block {
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  white-space: pre-line;

  & + .change-block { margin-top: 0.3rem; }

  small {
    display: block;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  &.was { background: #fef2f2; color: #991b1b; }
  &.became { background: #f0fdf4; color: #166534; }
}

.details-text { color: #475569; }
.no-changes { color: #cbd5e1; }

.empty-cell {
  padding: 2rem;
  color: #64748b;
  text-align: center;
}

.pagination-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  padding: 0.75rem 1rem;
  color: #64748b;
  font-size: 0.84rem;
}

.pagination-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
  color: #475569;
}

.page-size {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 0.5rem;

  select {
    height: 32px;
    padding: 0 0.5rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font: inherit;
  }
}
</style>
