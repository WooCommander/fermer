<script setup lang="ts">
import { computed } from 'vue'
import type { ReportUIModel } from '@/shared/types'
import { AppBadge, AppButton } from '@/shared/ui'
import { downloadCsv, formatStatusName } from '@/shared/lib'

interface Props {
  reports: ReportUIModel[]
  selectedReportId?: string
  filterDistrict: string
  filterStatus: string
  filterSearch: string
}

const props = withDefaults(defineProps<Props>(), {
  reports: () => [],
  selectedReportId: '',
  filterDistrict: 'all',
  filterStatus: 'all',
  filterSearch: '',
})

const emit = defineEmits<{
  (e: 'selectReport', report: ReportUIModel): void
  (e: 'updateDistrict', district: string): void
  (e: 'updateStatus', status: string): void
  (e: 'updateSearch', search: string): void
}>()

const districts = computed(() => {
  const set = new Set(props.reports.map((r) => r.district))
  return ['all', ...Array.from(set)]
})

const filteredReports = computed(() => {
  return props.reports.filter((r) => {
    const matchDistrict = props.filterDistrict === 'all' || r.district === props.filterDistrict
    const matchStatus = props.filterStatus === 'all' || r.status === props.filterStatus
    const matchSearch =
      !props.filterSearch ||
      r.farmName.toLowerCase().includes(props.filterSearch.toLowerCase()) ||
      r.fiscalCode.includes(props.filterSearch) ||
      r.formCode.toLowerCase().includes(props.filterSearch.toLowerCase())
    return matchDistrict && matchStatus && matchSearch
  })
})

const stats = computed(() => {
  const total = props.reports.length
  const submitted = props.reports.filter((r) => r.status === 'submitted').length
  const approved = props.reports.filter((r) => r.status === 'approved').length
  const needsRevision = props.reports.filter((r) => r.status === 'needs_revision').length
  const inProgress = props.reports.filter((r) => r.status === 'in_progress' || r.status === 'draft').length
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
      <div class="stat-card highlight-submitted">
        <span class="stat-num">{{ stats.submitted }}</span>
        <span class="stat-label">Требуют проверки</span>
      </div>
      <div class="stat-card highlight-approved">
        <span class="stat-num">{{ stats.approved }}</span>
        <span class="stat-label">Принято</span>
      </div>
      <div class="stat-card highlight-revision">
        <span class="stat-num">{{ stats.needsRevision }}</span>
        <span class="stat-label">На уточнении</span>
      </div>
    </div>

    <!-- Панель фильтров -->
    <div class="filters-row">
      <div class="filter-group">
        <label>Поиск по хозяйству / фискальному коду:</label>
        <input
          :value="props.filterSearch"
          type="text"
          placeholder="Поиск..."
          class="filter-input"
          @input="emit('updateSearch', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="filter-group">
        <label>Район:</label>
        <select
          :value="props.filterDistrict"
          class="filter-select"
          @change="emit('updateDistrict', ($event.target as HTMLSelectElement).value)"
        >
          <option value="all">Все районы</option>
          <option v-for="d in districts.filter(x => x !== 'all')" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Статус:</label>
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

      <div class="export-group">
        <AppButton size="sm" variant="secondary" :disabled="filteredReports.length === 0" @click="exportFilteredReports">
          Скачать CSV ({{ filteredReports.length }})
        </AppButton>
      </div>
    </div>

    <!-- Список отчетов -->
    <div class="table-card">
      <table class="reports-table">
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
        <tbody>
          <tr
            v-for="rep in filteredReports"
            :key="rep.id"
            :class="{ active: rep.id === props.selectedReportId }"
          >
            <td>
              <div class="farm-cell">
                <b>{{ rep.farmName }}</b>
                <small>ФК: {{ rep.fiscalCode }}</small>
              </div>
            </td>
            <td>{{ rep.district }}</td>
            <td><span class="form-badge">{{ rep.formCode }}</span></td>
            <td>{{ rep.period }}</td>
            <td><AppBadge :status="rep.status" /></td>
            <td>
              <AppButton size="sm" variant="secondary" @click="emit('selectReport', rep)">
                Открыть →
              </AppButton>
            </td>
          </tr>
          <tr v-if="filteredReports.length === 0">
            <td colspan="6" class="empty-cell">По заданным фильтрам отчетов не найдено</td>
          </tr>
        </tbody>
      </table>
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
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  background: #ffffff;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
  min-width: 200px;

  label {
    font-size: 0.78rem;
    font-weight: 600;
    color: #64748b;
  }
}

.export-group {
  display: flex;
  align-items: flex-end;
}

.filter-input,
.filter-select {
  padding: 0.55rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.88rem;
  font-family: inherit;
  outline: none;

  &:focus {
    border-color: #10b981;
  }
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
