import { reactive, computed } from 'vue'
import type { ReportUIModel } from '@/shared/types'

interface ReviewState {
  reports: ReportUIModel[]
  selectedReport: ReportUIModel | null
  filterDistrict: string
  filterStatus: string
  filterSearch: string
  isLoading: boolean
}

const state = reactive<ReviewState>({
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
  setLoading(loading: boolean) {
    state.isLoading = loading
  },
})
