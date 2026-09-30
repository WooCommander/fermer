import { authService, useAuthState } from '@/modules/auth'
import { reportingService, useReportingState, getFormSchemaByCode } from '@/modules/reporting'
import { reviewService, useReviewState, clearPersistedReviewView } from '@/modules/review'
import { adminService, useAdminState } from '@/modules/admin'
import { httpClient, type CreateUserDto, type UpdateUserDto } from '@/api'
import { toUserAccount } from '@/modules/admin/adapters/admin.adapter'
import { toFarmProfile } from '@/modules/auth/adapters/auth.adapter'
import type { ReportUIModel } from '@/shared/types'
import type { ReportFormSettings } from '@/shared/types'

const SESSION_STORAGE_KEY = 'agrostat_auth_user_id'
const AUTOSAVE_DELAY_MS = 2000

export class AppService {
  private authState = useAuthState()
  private reportingState = useReportingState()
  private reviewState = useReviewState()
  private adminState = useAdminState()

  private autosaveTimer: ReturnType<typeof setTimeout> | undefined
  private unloadGuardInstalled = false

  async initializeApp(): Promise<void> {
    this.installUnloadGuard()
    this.authState.setLoading(true)
    try {
      const farms = await authService.fetchFarms()
      this.authState.setFarms(farms)
      this.reportingState.setFormSettings(await reportingService.fetchFormSettings())

      const savedUserId = localStorage.getItem(SESSION_STORAGE_KEY)
      if (savedUserId) {
        const users = await adminService.fetchUsers()
        this.adminState.setUsers(users)
        const found = users.find((u) => u.id === savedUserId)
        if (found) {
          await this.applyUserSession(found)
        }
      }
    } finally {
      this.authState.setLoading(false)
    }
  }

  async login(login: string, password?: string): Promise<boolean> {
    this.authState.setLoading(true)
    this.authState.setError(null)
    try {
      const result = await httpClient.authenticate(login, password)
      if (!result) {
        this.authState.setError('Пользователь с указанным логином/кодом не найден в системе')
        return false
      }

      const user = toUserAccount(result.user)
      localStorage.setItem(SESSION_STORAGE_KEY, user.id)
      await this.applyUserSession(user)
      return true
    } catch {
      this.authState.setError('Ошибка при попытке входа в систему')
      return false
    } finally {
      this.authState.setLoading(false)
    }
  }

  private async applyUserSession(user: import('@/shared/types').UserAccount): Promise<void> {
    this.authState.setCurrentUser(user)

    if (user.role === 'farmer' && user.farmId) {
      const farmDto = await httpClient.getFarmById(user.farmId)
      if (farmDto) {
        const farm = toFarmProfile(farmDto)
        this.authState.setCurrentFarm(farm)
        const reports = await reportingService.fetchReportsByFarm(farm.id)
        this.reportingState.setReports(reports)
      }
      this.reportingState.setActiveReport(null)
    } else if (user.role === 'specialist') {
      this.authState.setCurrentFarm(null)
      await this.loadReviewReports()
      const districts = user.districts ?? (user.district ? [user.district] : [])
      const seesAll = districts.includes('all') || districts.some((district) => district.startsWith('Центральный аппарат'))
      if (!seesAll) {
        this.reviewState.setReports(this.reviewState.state.value.reports.filter((report) => districts.includes(report.district)))
      }
    } else if (user.role === 'admin') {
      this.authState.setCurrentFarm(null)
      await this.loadAdminUsers()
      await this.loadReviewReports()
    }
  }

  async logout(): Promise<void> {
    await this.flushAutosave()
    localStorage.removeItem(SESSION_STORAGE_KEY)
    this.authState.setCurrentUser(null)
    this.authState.setCurrentFarm(null)
    this.reportingState.setReports([])
    this.reportingState.setActiveReport(null)
    this.reviewState.setSelectedReport(null)
    clearPersistedReviewView()
  }

  // --- reporting methods (для фермера) ---
  openReport(report: ReportUIModel): void {
    this.reportingState.setActiveReport(report)
    this.validateCurrentReport()
  }

  async closeReport(): Promise<void> {
    await this.flushAutosave()
    this.reportingState.setActiveReport(null)
  }

  async updateFarmContacts(phone: string, contactPerson: string): Promise<void> {
    const farm = this.authState.state.value.currentFarm
    if (!farm) return
    const updated = await authService.updateFarmContacts(farm.id, { phone, contactPerson })
    this.authState.setCurrentFarm(updated)
    this.authState.setFarms(this.authState.state.value.farms.map((item) => (item.id === updated.id ? updated : item)))
  }

  async createReport(formCode: string, year: number): Promise<void> {
    const farm = this.authState.state.value.currentFarm
    if (!farm) return

    const report = await reportingService.createReport(farm.id, formCode, year)
    this.reportingState.addReport(report)
    this.reportingState.setActiveReport(report)
    this.validateCurrentReport()
  }

  async updateReportFormSettings(settings: ReportFormSettings): Promise<void> {
    const updated = await reportingService.updateFormSettings(settings)
    this.reportingState.updateFormSettings(updated)
  }

  setSectionIndex(index: number): void {
    this.reportingState.setActiveSectionIndex(index)
  }

  updateRowValue(rowCode: string, value: number | null): void {
    this.reportingState.setRowValue(rowCode, value)

    const active = this.reportingState.state.value.activeReport
    if (active) {
      const updatedValues = reportingService.recalculateFormValues(active.formCode, active.values)
      this.reportingState.setAllValues(updatedValues)
      this.validateCurrentReport()
    }
    this.markDirty()
  }

  updateRowComment(rowCode: string, comment: string): void {
    this.reportingState.setRowComment(rowCode, comment)
    this.markDirty()
  }

  confirmWarning(ruleId: string, confirmed: boolean): void {
    this.reportingState.confirmWarning(ruleId, confirmed)
    this.markDirty()
  }

  fillZerosForSection(sectionId: string): void {
    const active = this.reportingState.state.value.activeReport
    if (!active) return

    const schema = getFormSchemaByCode(active.formCode)
    const sec = schema.sections.find((s) => s.id === sectionId)
    if (!sec) return

    const nextValues = { ...active.values }
    for (const row of sec.rows) {
      if (!row.isCalculated && (nextValues[row.code] === null || nextValues[row.code] === undefined)) {
        nextValues[row.code] = 0
      }
    }
    const updatedValues = reportingService.recalculateFormValues(active.formCode, nextValues)
    this.reportingState.setAllValues(updatedValues)
    this.validateCurrentReport()
    this.markDirty()
  }

  copyPreviousForSection(sectionId: string): void {
    const active = this.reportingState.state.value.activeReport
    if (!active) return

    const schema = getFormSchemaByCode(active.formCode)
    const sec = schema.sections.find((s) => s.id === sectionId)
    if (!sec) return

    const nextValues = { ...active.values }
    for (const row of sec.rows) {
      if (!row.isCalculated && active.previousValues[row.code] !== undefined) {
        nextValues[row.code] = active.previousValues[row.code]
      }
    }
    const updatedValues = reportingService.recalculateFormValues(active.formCode, nextValues)
    this.reportingState.setAllValues(updatedValues)
    this.validateCurrentReport()
    this.markDirty()
  }

  private markDirty(): void {
    this.reportingState.setDirty(true)
    clearTimeout(this.autosaveTimer)
    this.autosaveTimer = setTimeout(() => {
      void this.persistActiveReport(true)
    }, AUTOSAVE_DELAY_MS)
  }

  // Сохраняет активный отчёт, если есть несохранённые изменения (при уходе из формы, выходе из системы)
  async flushAutosave(): Promise<void> {
    clearTimeout(this.autosaveTimer)
    if (this.reportingState.state.value.isDirty) {
      await this.persistActiveReport(true)
    }
  }

  private async persistActiveReport(autosave: boolean): Promise<boolean> {
    const active = this.reportingState.state.value.activeReport
    if (!active) return false

    // Снимаем флаг до сохранения: правки, сделанные во время запроса, снова поставят его и запустят новое автосохранение
    this.reportingState.setDirty(false)
    try {
      const saved = await reportingService.saveDraft(active, autosave)
      this.reportingState.mergeSavedMeta(saved)
      this.reviewState.updateReportInList(saved)
      this.reportingState.setLastSavedAt(saved.updatedAt)
      return true
    } catch {
      this.reportingState.setDirty(true)
      return false
    }
  }

  private installUnloadGuard(): void {
    if (this.unloadGuardInstalled) return
    this.unloadGuardInstalled = true
    window.addEventListener('beforeunload', (event) => {
      if (this.reportingState.state.value.isDirty) {
        event.preventDefault()
        event.returnValue = ''
      }
    })
  }

  private validateCurrentReport(): void {
    const active = this.reportingState.state.value.activeReport
    if (active) {
      const issues = reportingService.validateReport(active)
      this.reportingState.setValidationIssues(issues)
    }
  }

  async saveDraft(): Promise<void> {
    const active = this.reportingState.state.value.activeReport
    if (!active) return

    clearTimeout(this.autosaveTimer)
    this.reportingState.setIsSaving(true)
    try {
      if (await this.persistActiveReport(false)) {
        this.reportingState.setSaveNotice('Черновик сохранён в системе')
        setTimeout(() => {
          this.reportingState.setSaveNotice(null)
        }, 3000)
      }
    } finally {
      this.reportingState.setIsSaving(false)
    }
  }

  async submitReport(): Promise<void> {
    const active = this.reportingState.state.value.activeReport
    if (!active) return

    await this.flushAutosave()
    this.reportingState.setIsSubmitting(true)
    try {
      const submitted = await reportingService.submitReport(active.id)
      this.reportingState.setActiveReport(submitted)
      this.reviewState.updateReportInList(submitted)
      this.reportingState.setSaveNotice('Отчёт успешно передан в Государственную службу статистики')
      setTimeout(() => {
        this.reportingState.setSaveNotice(null)
      }, 4000)
    } finally {
      this.reportingState.setIsSubmitting(false)
    }
  }

  // --- review methods (для специалиста статистики) ---
  async loadReviewReports(): Promise<void> {
    this.reviewState.setLoading(true)
    try {
      const reports = await reviewService.fetchAllReports()
      this.reviewState.setReports(reports)
    } finally {
      this.reviewState.setLoading(false)
    }
  }

  selectReviewReport(report: ReportUIModel | null): void {
    this.reviewState.setSelectedReport(report)
  }

  async approveReport(reportId: string): Promise<void> {
    const approved = await reviewService.approveReport(reportId)
    this.reviewState.updateReportInList(approved)
    const active = this.reportingState.state.value.activeReport
    if (active && active.id === reportId) {
      this.reportingState.setActiveReport(approved)
    }
  }

  async returnForRevision(reportId: string, comment: string): Promise<void> {
    const revised = await reviewService.returnForRevision(reportId, comment)
    this.reviewState.updateReportInList(revised)
    const active = this.reportingState.state.value.activeReport
    if (active && active.id === reportId) {
      this.reportingState.setActiveReport(revised)
    }
  }

  // --- admin methods (для администратора) ---
  async loadAdminUsers(): Promise<void> {
    this.adminState.setLoading(true)
    try {
      const users = await adminService.fetchUsers()
      this.adminState.setUsers(users)
    } finally {
      this.adminState.setLoading(false)
    }
  }

  async createAdminUser(payload: CreateUserDto): Promise<void> {
    this.adminState.setLoading(true)
    try {
      const user = await adminService.createUser(payload)
      this.adminState.addUser(user)
      const farms = await authService.fetchFarms()
      this.authState.setFarms(farms)
      await this.loadReviewReports()
    } finally {
      this.adminState.setLoading(false)
    }
  }

  async updateAdminUser(userId: string, payload: UpdateUserDto): Promise<void> {
    this.adminState.setLoading(true)
    try {
      const user = await adminService.updateUser(userId, payload)
      this.adminState.updateUser(user)
      if (this.authState.state.value.currentUser?.id === user.id) {
        this.authState.setCurrentUser(user)
      }
      const farms = await authService.fetchFarms()
      this.authState.setFarms(farms)
      await this.loadReviewReports()
    } finally {
      this.adminState.setLoading(false)
    }
  }

  async deleteAdminUser(userId: string): Promise<void> {
    this.adminState.setLoading(true)
    try {
      await adminService.deleteUser(userId)
      this.adminState.markUserDeleted(userId, new Date().toISOString())
      const farms = await authService.fetchFarms()
      this.authState.setFarms(farms)
    } finally {
      this.adminState.setLoading(false)
    }
  }

  async restoreAdminUser(userId: string): Promise<void> {
    this.adminState.setLoading(true)
    try {
      await adminService.restoreUser(userId)
      this.adminState.markUserDeleted(userId, null)
      const farms = await authService.fetchFarms()
      this.authState.setFarms(farms)
    } finally {
      this.adminState.setLoading(false)
    }
  }
}

export const appService = new AppService()
