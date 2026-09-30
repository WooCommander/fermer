<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { ReportUIModel } from '@/shared/types'
import { AppBadge, AppButton, AppSpinner } from '@/shared/ui'
import { downloadCsv, formatStatusName } from '@/shared/lib'
import { REVIEW_PAGE_SIZES, useReviewState } from '../state/review.state'

interface Props {
  reports: ReportUIModel[]
  selectedReportId?: string
  filterDistrict: string
  filterStatus: string
  filterSearch: string
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  reports: () => [],
  selectedReportId: '',
  filterDistrict: 'all',
  filterStatus: 'all',
  filterSearch: '',
  isLoading: false,
})

const emit = defineEmits<{
  (e: 'selectReport', report: ReportUIModel): void
  (e: 'updateDistrict', district: string): void
  (e: 'updateStatus', status: string): void
  (e: 'updateSearch', search: string): void
}>()

const SEARCH_DEBOUNCE_MS = 300

const currentYear = new Date().getFullYear()
const { state: reviewState, updateListView } = useReviewState()
const listView = computed(() => reviewState.value.listView)

const selectedYear = computed({
  get: () => listView.value.year,
  set: (year: number) => updateListView({ year }),
})
const selectedForm = computed({
  get: () => listView.value.formCode,
  set: (formCode: string) => updateListView({ formCode }),
})
const groupByFarm = computed({
  get: () => listView.value.groupByFarm,
  set: (groupByFarm: boolean) => updateListView({ groupByFarm }),
})
const pageSize = computed({
  get: () => listView.value.pageSize,
  set: (size: number) => updateListView({ pageSize: size }),
})

// Поиск: поле обновляется сразу, в общий фильтр значение уходит после паузы в наборе
const searchInput = ref(props.filterSearch)
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => emit('updateSearch', value), SEARCH_DEBOUNCE_MS)
})
watch(() => props.filterSearch, (value) => {
  if (value !== searchInput.value) searchInput.value = value
})
// Если уходим из списка, не дождавшись паузы, введённый поиск не теряем
onBeforeUnmount(() => {
  if (searchTimer === undefined) return
  clearTimeout(searchTimer)
  if (searchInput.value !== props.filterSearch) emit('updateSearch', searchInput.value)
})

const districts = computed(() => Array.from(new Set(props.reports.map((r) => r.district))).sort())
// Регистратору с одним районом выбирать нечего — фильтр скрываем
const showDistrictFilter = computed(() => districts.value.length > 1)
// Сохранённый район мог перестать быть доступным (другой пользователь, другие данные) — тогда считаем «все»
const activeDistrict = computed(() => districts.value.includes(props.filterDistrict) ? props.filterDistrict : 'all')

const years = computed(() =>
  Array.from(new Set([currentYear, currentYear - 1, ...props.reports.map((r) => r.year)])).sort((a, b) => b - a),
)

const formCodes = computed(() => Array.from(new Set(props.reports.map((r) => r.formCode))).sort())

const yearReports = computed(() =>
  props.reports.filter((r) =>
    r.year === selectedYear.value
    && (selectedForm.value === 'all' || r.formCode === selectedForm.value)
    && (activeDistrict.value === 'all' || r.district === activeDistrict.value)),
)

const statusPriority: Record<string, number> = { submitted: 0, needs_revision: 1, ready_to_submit: 2, in_progress: 2, draft: 2, approved: 3 }

const filteredReports = computed(() => {
  return yearReports.value.filter((r) => {
    const matchStatus = props.filterStatus === 'all'
      || r.status === props.filterStatus
      || (props.filterStatus === 'not_submitted' && (r.status === 'draft' || r.status === 'in_progress' || r.status === 'ready_to_submit'))
    const matchSearch =
      !props.filterSearch ||
      r.farmName.toLowerCase().includes(props.filterSearch.toLowerCase()) ||
      r.fiscalCode.includes(props.filterSearch) ||
      r.formCode.toLowerCase().includes(props.filterSearch.toLowerCase())
    return matchStatus && matchSearch
  }).sort((first, second) => (statusPriority[first.status] ?? 9) - (statusPriority[second.status] ?? 9)
    || new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime())
})

interface ReportGroup {
  key: string
  farmName: string
  fiscalCode: string
  district: string
  reports: ReportUIModel[]
  statusCounts: { status: ReportUIModel['status']; count: number }[]
}

function withStatusCounts(group: Omit<ReportGroup, 'statusCounts'>): ReportGroup {
  const counts = new Map<ReportUIModel['status'], number>()
  for (const report of group.reports) counts.set(report.status, (counts.get(report.status) ?? 0) + 1)
  return { ...group, statusCounts: Array.from(counts, ([status, count]) => ({ status, count })) }
}

// Порядок групп берётся из отсортированного списка: сверху хозяйства с отчётами, требующими внимания.
// Без группировки каждый отчёт — отдельная «группа» из одной строки.
const displayGroups = computed<ReportGroup[]>(() => {
  if (!groupByFarm.value) {
    return filteredReports.value.map((report) => withStatusCounts({
      key: report.id, farmName: report.farmName, fiscalCode: report.fiscalCode, district: report.district, reports: [report],
    }))
  }
  const groups = new Map<string, Omit<ReportGroup, 'statusCounts'>>()
  for (const report of filteredReports.value) {
    let group = groups.get(report.farmId)
    if (!group) {
      group = { key: report.farmId, farmName: report.farmName, fiscalCode: report.fiscalCode, district: report.district, reports: [] }
      groups.set(report.farmId, group)
    }
    group.reports.push(report)
  }
  return Array.from(groups.values(), withStatusCounts)
})

const pageCount = computed(() => Math.max(1, Math.ceil(displayGroups.value.length / pageSize.value)))
const currentPage = computed(() => Math.min(listView.value.page, pageCount.value))
const pagedGroups = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return displayGroups.value.slice(start, start + pageSize.value)
})
const pageStart = computed(() => displayGroups.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0)
const pageEnd = computed(() => Math.min(currentPage.value * pageSize.value, displayGroups.value.length))
const itemsLabel = computed(() => groupByFarm.value ? 'хозяйств' : 'отчётов')

function goToPage(page: number): void {
  updateListView({ page: Math.min(Math.max(1, page), pageCount.value) })
}

// Любое изменение выборки возвращает на первую страницу
watch(
  [selectedYear, selectedForm, groupByFarm, pageSize, () => props.filterDistrict, () => props.filterStatus, () => props.filterSearch],
  () => updateListView({ page: 1 }),
)

function isFarmExpanded(group: ReportGroup): boolean {
  return group.reports.length === 1
    || listView.value.expandedKeys.includes(group.key)
    || group.reports.some((r) => r.id === props.selectedReportId)
}

function formatReportsCount(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} отчёт`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} отчёта`
  return `${count} отчётов`
}

function toggleFarm(key: string): void {
  const keys = listView.value.expandedKeys
  updateListView({ expandedKeys: keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key] })
}

const stats = computed(() => {
  const list = yearReports.value
  const total = list.length
  const submitted = list.filter((r) => r.status === 'submitted').length
  const approved = list.filter((r) => r.status === 'approved').length
  const needsRevision = list.filter((r) => r.status === 'needs_revision').length
  const inProgress = list.filter((r) => r.status === 'in_progress' || r.status === 'draft' || r.status === 'ready_to_submit').length
  return { total, submitted, approved, needsRevision, inProgress }
})

function exportFilteredReports(): void {
  const date = new Date().toISOString().slice(0, 10)
  downloadCsv(`agrostat-reports-${date}.csv`,
    ['Хозяйство', 'Фискальный код', 'Район', 'Форма', 'Период', 'Статус', 'Обновлено'],
    filteredReports.value.map((report) => [
      report.farmName,
      report.fiscalCode,
      report.district,
      report.formCode,
      report.period,
      formatStatusName(report.status),
      new Date(report.updatedAt).toLocaleString('ru-RU'),
    ]))
}
</script>

<template>
  <div class="review-list-view">
    <!-- Сводные плашки инспектора -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-num">{{ stats.total }}</span>
        <span class="stat-label">Всего отчетов</span>
      </div>
      <div class="stat-card highlight-submitted clickable" @click="emit('updateStatus', 'submitted')">
        <span class="stat-num">{{ stats.submitted }}</span>
        <span class="stat-label">Требуют проверки</span>
      </div>
      <div class="stat-card highlight-approved clickable" @click="emit('updateStatus', 'approved')">
        <span class="stat-num">{{ stats.approved }}</span>
        <span class="stat-label">Принято</span>
      </div>
      <div class="stat-card highlight-revision clickable" @click="emit('updateStatus', 'needs_revision')">
        <span class="stat-num">{{ stats.needsRevision }}</span>
        <span class="stat-label">На уточнении</span>
      </div>
      <div class="stat-card highlight-progress clickable" @click="emit('updateStatus', 'not_submitted')">
        <span class="stat-num">{{ stats.inProgress }}</span>
        <span class="stat-label">Не отправлены</span>
      </div>
    </div>

    <!-- Панель фильтров -->
    <div class="filters-row">
      <div class="filters-fields">
      <div class="filter-group filter-search">
        <label>Поиск</label>
        <input
          v-model="searchInput"
          type="text"
          placeholder="Хозяйство или фискальный код"
          class="filter-input"
        />
      </div>

      <div class="filter-group">
        <label>Год</label>
        <select v-model.number="selectedYear" class="filter-select">
          <option v-for="year in years" :key="year" :value="year">{{ year }}{{ year === currentYear ? ' (текущий)' : '' }}</option>
        </select>
      </div>

      <div v-if="showDistrictFilter" class="filter-group">
        <label>Район</label>
        <select
          :value="activeDistrict"
          class="filter-select"
          @change="emit('updateDistrict', ($event.target as HTMLSelectElement).value)"
        >
          <option value="all">Все районы</option>
          <option v-for="d in districts" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Статус</label>
        <select
          :value="props.filterStatus"
          class="filter-select"
          @change="emit('updateStatus', ($event.target as HTMLSelectElement).value)"
        >
          <option value="all">Все статусы</option>
          <option value="submitted">Отправлены (на проверку)</option>
          <option value="in_progress">В процессе заполнения</option>
          <option value="needs_revision">Требуют уточнения</option>
          <option value="approved">Приняты</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Тип отчёта</label>
        <select v-model="selectedForm" class="filter-select">
          <option value="all">Все формы</option>
          <option v-for="code in formCodes" :key="code" :value="code">Форма № {{ code }}</option>
        </select>
      </div>

      </div>

      <div class="filters-footer">
        <label class="group-toggle">
          <input v-model="groupByFarm" type="checkbox" />
          <span>Группировать по хозяйствам</span>
        </label>

        <AppButton size="sm" variant="secondary" :disabled="filteredReports.length === 0" @click="exportFilteredReports">
          Скачать CSV ({{ filteredReports.length }})
        </AppButton>
      </div>
    </div>

    <!-- Список отчетов -->
    <div class="table-card loader-host">
      <AppSpinner v-if="props.isLoading" overlay label="Загрузка отчётов…" />
      <table class="reports-table">
        <colgroup>
          <col style="width: 28%" />
          <col style="width: 16%" />
          <col style="width: 10%" />
          <col style="width: 12%" />
          <col style="width: 20%" />
          <col style="width: 14%" />
        </colgroup>
        <thead>
          <tr>
            <th>Хозяйство</th>
            <th>Район</th>
            <th>Форма</th>
            <th>Период</th>
            <th>Статус</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody v-for="group in pagedGroups" :key="group.key">
          <!-- Шапка хозяйства: только если отчётов несколько -->
          <tr
            v-if="group.reports.length > 1"
            class="farm-group-row"
            :aria-expanded="isFarmExpanded(group)"
            tabindex="0"
            @click="toggleFarm(group.key)"
            @keydown.enter.prevent="toggleFarm(group.key)"
            @keydown.space.prevent="toggleFarm(group.key)"
          >
            <td>
              <div class="farm-cell">
                <b><span class="chevron" :class="{ open: isFarmExpanded(group) }">▸</span> {{ group.farmName }}</b>
                <small>ФК: {{ group.fiscalCode }}</small>
              </div>
            </td>
            <td>{{ group.district }}</td>
            <td colspan="2">
              <span class="reports-count">{{ formatReportsCount(group.reports.length) }}</span>
            </td>
            <td>
              <div class="status-summary">
                <span v-for="item in group.statusCounts" :key="item.status" class="status-summary-item">
                  <AppBadge :status="item.status" /><span v-if="item.count > 1">×{{ item.count }}</span>
                </span>
              </div>
            </td>
            <td>
              <span class="toggle-hint">{{ isFarmExpanded(group) ? 'Свернуть' : 'Развернуть' }}</span>
            </td>
          </tr>
          <template v-if="isFarmExpanded(group)">
            <tr
              v-for="rep in group.reports"
              :key="rep.id"
              :class="{ active: rep.id === props.selectedReportId, nested: group.reports.length > 1 }"
            >
              <td>
                <div v-if="group.reports.length === 1" class="farm-cell">
                  <b>{{ rep.farmName }}</b>
                  <small>ФК: {{ rep.fiscalCode }}</small>
                </div>
              </td>
              <td>{{ group.reports.length === 1 ? rep.district : '' }}</td>
              <td><span v-if="group.reports.length === 1 || groupByFarm" class="form-badge">{{ rep.formCode }}</span></td>
              <td>{{ rep.period }}</td>
              <td><AppBadge :status="rep.status" /></td>
              <td>
                <AppButton size="sm" variant="secondary" @click="emit('selectReport', rep)">
                  Открыть →
                </AppButton>
              </td>
            </tr>
          </template>
        </tbody>
        <tbody v-if="filteredReports.length === 0">
          <tr>
            <td colspan="6" class="empty-cell">По заданным фильтрам отчетов не найдено</td>
          </tr>
        </tbody>
      </table>

      <div v-if="displayGroups.length > 0" class="pagination-bar">
        <span>Показано {{ pageStart }}–{{ pageEnd }} из {{ displayGroups.length }} {{ itemsLabel }}</span>
        <div class="pagination-actions">
          <label class="page-size">
            На странице
            <select v-model.number="pageSize" class="filter-select page-size-select">
              <option v-for="size in REVIEW_PAGE_SIZES" :key="size" :value="size">{{ size }}</option>
            </select>
          </label>
          <AppButton size="sm" variant="secondary" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">Назад</AppButton>
          <span>Страница {{ currentPage }} из {{ pageCount }}</span>
          <AppButton size="sm" variant="secondary" :disabled="currentPage === pageCount" @click="goToPage(currentPage + 1)">Далее</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.review-list-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

  &.clickable {
    cursor: pointer;
    transition: border-color 0.15s ease, transform 0.15s ease;

    &:hover {
      border-color: #94a3b8;
      transform: translateY(-1px);
    }
  }

  .stat-num {
    font-size: 1.6rem;
    font-weight: 800;
    color: #0f172a;
  }

  .stat-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #64748b;
  }

  &.highlight-submitted {
    border-left: 4px solid #3b82f6;
    .stat-num {
      color: #2563eb;
    }
  }

  &.highlight-approved {
    border-left: 4px solid #10b981;
    .stat-num {
      color: #059669;
    }
  }

  &.highlight-revision {
    border-left: 4px solid #f59e0b;
    .stat-num {
      color: #d97706;
    }
  }

  &.highlight-progress {
    border-left: 4px solid #94a3b8;
    .stat-num { color: #475569; }
  }
}

.filters-row {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  background: #ffffff;
  padding: 1rem 1.1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.filters-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.85rem 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;

  label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #64748b;
  }

  &.filter-search {
    grid-column: span 2;
  }
}

.filters-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.9rem;
  border-top: 1px solid #f1f5f9;
}

.group-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.86rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  user-select: none;

  input {
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: #10b981;
  }
}

.filter-input,
.filter-select {
  width: 100%;
  height: 40px;
  padding: 0 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background-color: #ffffff;
  color: #1e293b;
  font-size: 0.88rem;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: #94a3b8;
  }

  &:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
  }
}

.filter-select {
  appearance: none;
  padding-right: 2rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%2364748b' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  cursor: pointer;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid #f1f5f9;
  color: #64748b;
  font-size: 0.84rem;
}

.pagination-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.65rem;
  color: #475569;
  white-space: nowrap;
}

.page-size {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 0.5rem;
}

.page-size-select {
  width: auto;
  height: 32px;
  min-width: 72px;
}

.loader-host {
  position: relative;
  min-height: 120px;
}

.table-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.reports-table {
  width: 100%;
  min-width: 760px;
  table-layout: fixed;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;

  th {
    background: #f8fafc;
    padding: 0.75rem 1rem;
    font-weight: 700;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
  }

  td {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    vertical-align: middle;
  }

  tr:hover td {
    background: #f8fafc;
  }

  tr.active td {
    background: #f0fdf4;
  }

  tr.farm-group-row {
    cursor: pointer;

    td {
      background: #fbfdff;
    }

    &:focus-visible {
      outline: 2px solid #10b981;
      outline-offset: -2px;
    }
  }

  tr.nested td:first-child {
    border-left: 3px solid #e2e8f0;
  }
}

.chevron {
  display: inline-block;
  color: #64748b;
  transition: transform 0.15s ease;

  &.open {
    transform: rotate(90deg);
  }
}

.reports-count {
  font-weight: 600;
  color: #475569;
}

.status-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.status-summary-item {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.78rem;
  color: #475569;
}

.toggle-hint {
  font-size: 0.8rem;
  font-weight: 600;
  color: #2563eb;
}

.farm-cell {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  small {
    color: #64748b;
    font-size: 0.78rem;
  }
}

.form-badge {
  background: #f1f5f9;
  font-family: monospace;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  color: #334155;
}

.empty-cell {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}
</style>
