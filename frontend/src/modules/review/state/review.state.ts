import { reactive, computed, watch } from 'vue'
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

// Фильтры и положение в списке переживают перезагрузку страницы, но не вкладку (sessionStorage)
const VIEW_SESSION_KEY = 'agrostat_review_list_state'

interface PersistedView {
  year: number
  formCode: string
  page: number
  expandedKeys: string[]
  filterDistrict: string
  filterStatus: string
  filterSearch: string
}

function loadPersistedView(): Partial<PersistedView> {
  try {
    return JSON.parse(sessionStorage.getItem(VIEW_SESSION_KEY) ?? '{}') ?? {}
  } catch {
    return {}
  }
}

export function clearPersistedReviewView(): void {
  try {
    sessionStorage.removeItem(VIEW_SESSION_KEY)
  } catch {
    // sessionStorage недоступен — очищать нечего
  }
}

const saved = loadPersistedView()

const state = reactive<ReviewState>({
  listView: {
    year: typeof saved.year === 'number' ? saved.year : new Date().getFullYear(),
    formCode: typeof saved.formCode === 'string' ? saved.formCode : 'all',
    groupByFarm: readStorage(GROUP_STORAGE_KEY) !== '0',
    page: typeof saved.page === 'number' && saved.page >= 1 ? saved.page : 1,
    pageSize: loadPageSize(),
    expandedKeys: Array.isArray(saved.expandedKeys) ? saved.expandedKeys : [],
  },
  reports: [],
  selectedReport: null,
  filterDistrict: typeof saved.filterDistrict === 'string' ? saved.filterDistrict : 'all',
  filterStatus: typeof saved.filterStatus === 'string' ? saved.filterStatus : 'all',
  filterSearch: typeof saved.filterSearch === 'string' ? saved.filterSearch : '',
  isLoading: false,
})

watch(
  () => ({
    year: state.listView.year,
    formCode: state.listView.formCode,
    page: state.listView.page,
    expandedKeys: state.listView.expandedKeys,
    filterDistrict: state.filterDistrict,
    filterStatus: state.filterStatus,
    filterSearch: state.filterSearch,
  } satisfies PersistedView),
  (view) => {
    try {
      sessionStorage.setItem(VIEW_SESSION_KEY, JSON.stringify(view))
    } catch {
      // sessionStorage недоступен — состояние просто не переживёт перезагрузку
    }
  },
  { deep: true },
)

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
