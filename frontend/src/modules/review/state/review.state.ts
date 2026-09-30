import { reactive, computed } from 'vue'
import type { ReportUIModel } from '@/shared/types'

const GROUP_STORAGE_KEY = 'agrostat_review_group_by_farm'
const PAGE_SIZE_STORAGE_KEY = 'agrostat_review_page_size'
export const REVIEW_PAGE_SIZES = [25, 50, 100]

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // localStorage недоступен — настройка просто не запомнится
  }
}

function loadPageSize(): number {
  const saved = Number(readStorage(PAGE_SIZE_STORAGE_KEY))
  return REVIEW_PAGE_SIZES.includes(saved) ? saved : REVIEW_PAGE_SIZES[0]
}

// Состояние списка живёт здесь, а не в компоненте: при открытии отчёта список размонтируется,
// а при возврате должен выглядеть так же, как его оставили.
interface ReviewListView {
  year: number
  formCode: string
  groupByFarm: boolean
  page: number
  pageSize: number
  expandedKeys: string[]
}

interface ReviewState {
  listView: ReviewListView
  reports: ReportUIModel[]
  selectedReport: ReportUIModel | null
  filterDistrict: string
  filterStatus: string
  filterSearch: string
  isLoading: boolean
}

const state = reactive<ReviewState>({
  listView: {
    year: new Date().getFullYear(),
    formCode: 'all',
    groupByFarm: readStorage(GROUP_STORAGE_KEY) !== '0',
    page: 1,
    pageSize: loadPageSize(),
    expandedKeys: [],
  },
  reports: [],
  selectedReport: null,
  filterDistrict: 'all',
  filterStatus: 'all',
  filterSearch: '',
  isLoading: false,
})

export const useReviewState = () => ({
  state: computed(() => state),
  setReports(reports: ReportUIModel[]) {
    state.reports = reports
  },
  setSelectedReport(report: ReportUIModel | null) {
    state.selectedReport = report
  },
  updateReportInList(updated: ReportUIModel) {
    const idx = state.reports.findIndex((r) => r.id === updated.id)
    if (idx !== -1) {
      state.reports[idx] = updated
    }
    if (state.selectedReport?.id === updated.id) {
      state.selectedReport = updated
    }
  },
  setFilterDistrict(district: string) {
    state.filterDistrict = district
  },
  setFilterStatus(status: string) {
    state.filterStatus = status
  },
  setFilterSearch(search: string) {
    state.filterSearch = search
  },
  updateListView(patch: Partial<ReviewListView>) {
    Object.assign(state.listView, patch)
    if (patch.groupByFarm !== undefined) writeStorage(GROUP_STORAGE_KEY, patch.groupByFarm ? '1' : '0')
    if (patch.pageSize !== undefined) writeStorage(PAGE_SIZE_STORAGE_KEY, String(patch.pageSize))
  },
  setLoading(loading: boolean) {
    state.isLoading = loading
  },
})
