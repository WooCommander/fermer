<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { AppSpinner } from '@/shared/ui'
import { appService, AppHeader } from '@/app'
import { useAuthState, AuthLoginForm } from '@/modules/auth'
import { useReportingState, getFormSchemaByCode, FormWizard, FarmerDashboard, reportingService } from '@/modules/reporting'
import { useReviewState, ReportReviewList, ReportReviewDetail } from '@/modules/review'
import { useAdminState, AdminUserManagement, AdminReportSettings, AdminHelpSettings, AdminAuditLog } from '@/modules/admin'
import { useNotificationState, buildNotifications, NotificationBell, AdminNotificationSettings } from '@/modules/notifications'
import type { AppNotification, HelpSettings, NotificationSettings, ReportFormSettings, ReportUIModel, RevisionRow } from '@/shared/types'
import type { CreateUserDto, UpdateUserDto } from '@/api'

const authState = useAuthState()
const reportingState = useReportingState()
const reviewState = useReviewState()
const adminState = useAdminState()
const notificationState = useNotificationState()
const adminSection = ref<'users' | 'reporting' | 'help' | 'notifications' | 'audit'>('users')

watch(adminSection, (section) => {
  if (section === 'audit') appService.loadAuditLog()
})

// Пока поднимается сессия и грузятся данные, показываем крутилку, а не пустой экран или форму входа
const isBooting = ref(true)

onMounted(async () => {
  try {
    await appService.initializeApp()
  } finally {
    isBooting.value = false
  }
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready()
    window.Telegram.WebApp.expand?.()
  }
})

const currentUser = computed(() => authState.state.value.currentUser)
const currentFarm = computed(() => authState.state.value.currentFarm)
const activeReport = computed(() => reportingState.state.value.activeReport)

const activeSchema = computed(() => {
  return activeReport.value ? getFormSchemaByCode(activeReport.value.formCode) : getFormSchemaByCode('1-фермер')
})

// Лента уведомлений фермера вычисляется из его отчётов, истории и сроков форм
const notifications = computed<AppNotification[]>(() => {
  const farm = currentFarm.value
  const settings = notificationState.state.value.settings
  if (currentUser.value?.role !== 'farmer' || !farm || !settings) return []
  return buildNotifications({
    farm,
    reports: reportingState.state.value.reports,
    formSettings: reportingState.state.value.formSettings,
    settings,
  })
})

function onOpenNotification(notification: AppNotification): void {
  appService.markNotificationsRead([notification.id])
  const report = notification.reportId
    ? reportingState.state.value.reports.find((item) => item.id === notification.reportId)
    : undefined
  if (report) appService.openReport(report)
  else appService.closeReport()
}

function onMarkAllNotificationsRead(): void {
  appService.markNotificationsRead(notifications.value.map((item) => item.id))
}

function onUpdateNotificationSettings(settings: NotificationSettings): void {
  appService.updateNotificationSettings(settings)
}

const completionPercent = computed(() => {
  return activeReport.value ? reportingService.calculateCompletionPercent(activeReport.value) : 0
})

function onLogin(login: string, pin: string): void {
  appService.login(login, pin)
}

function onLogout(): void {
  appService.logout()
}

function onGoToDashboard(): void {
  appService.closeReport()
}

// Reporting (Фермер)
function onOpenReport(report: ReportUIModel): void {
  appService.openReport(report)
}

function onUpdateContacts(phone: string, contactPerson: string): void {
  appService.updateFarmContacts(phone, contactPerson)
}

function onCreateReport(formCode: string, year: number): void {
  appService.createReport(formCode, year)
}

function onUpdateSectionIndex(index: number): void {
  appService.setSectionIndex(index)
}

function onUpdateRowValue(rowCode: string, value: number | null): void {
  appService.updateRowValue(rowCode, value)
}

function onUpdateRowComment(rowCode: string, comment: string): void {
  appService.updateRowComment(rowCode, comment)
}

function onConfirmWarning(ruleId: string, value: boolean): void {
  appService.confirmWarning(ruleId, value)
}

function onFillZeros(sectionId: string): void {
  appService.fillZerosForSection(sectionId)
}

function onCopyPrevious(sectionId: string): void {
  appService.copyPreviousForSection(sectionId)
}

function onSaveDraft(): void {
  appService.saveDraft()
}

function onSubmitReport(): void {
  appService.submitReport()
}

// Review (Специалист)
function onSelectReviewReport(report: ReportUIModel): void {
  appService.selectReviewReport(report)
}

function onBackToReviewList(): void {
  appService.selectReviewReport(null)
}

function onApproveReport(reportId: string): void {
  appService.approveReport(reportId)
}

function onReturnRevision(reportId: string, comment: string, rows: RevisionRow[]): void {
  appService.returnForRevision(reportId, comment, rows)
}

// Admin (Администратор)
function onCreateAdminUser(payload: CreateUserDto): void {
  appService.createAdminUser(payload)
}

function onUpdateAdminUser(userId: string, payload: UpdateUserDto): void {
  appService.updateAdminUser(userId, payload)
}

function onDeleteAdminUser(userId: string): void {
  appService.deleteAdminUser(userId)
}

function onRestoreAdminUser(userId: string): void {
  appService.restoreAdminUser(userId)
}

function onUpdateHelpSettings(settings: HelpSettings): void {
  appService.updateHelpSettings(settings)
}

function onUpdateReportFormSettings(settings: ReportFormSettings): void {
  appService.updateReportFormSettings(settings)
}
</script>

<template>
  <div class="app-root">
    <AppHeader
      :current-user="currentUser"
      :current-farm="currentFarm"
      :is-editing-report="!!activeReport"
      @go-to-dashboard="onGoToDashboard"
      @logout="onLogout"
    >
      <template #actions>
        <NotificationBell
          v-if="currentUser?.role === 'farmer'"
          :notifications="notifications"
          :read-ids="notificationState.state.value.readIds"
          @open="onOpenNotification"
          @mark-all-read="onMarkAllNotificationsRead"
        />
      </template>
    </AppHeader>

    <main class="app-main">
      <div v-if="isBooting" class="boot-screen">
        <AppSpinner size="lg" label="Загрузка…" />
      </div>

      <!-- 0. Экран аутентификации (если пользователь не вошел) -->
      <AuthLoginForm
        v-if="!currentUser"
        v-show="!isBooting"
        :is-loading="authState.state.value.isLoading"
        :error="authState.state.value.error"
        @login="onLogin"
      />

      <!-- 1. КАБИНЕТ ФЕРМЕРА (Только для роли 'farmer') -->
      <template v-else-if="currentUser.role === 'farmer'">
        <!-- Режим заполнения конкретного отчета -->
        <template v-if="activeReport">
          <div class="back-bar">
            <button type="button" class="back-link-btn" @click="onGoToDashboard">
              ← Вернуться в личный кабинет
            </button>
          </div>

          <FormWizard
            :report="activeReport"
            :schema="activeSchema"
            :active-section-index="reportingState.state.value.activeSectionIndex"
            :validation-issues="reportingState.state.value.validationIssues"
            :completion-percent="completionPercent"
            :is-saving="reportingState.state.value.isSaving"
            :is-submitting="reportingState.state.value.isSubmitting"
            :save-notice="reportingState.state.value.saveNotice"
            :is-dirty="reportingState.state.value.isDirty"
            :last-saved-at="reportingState.state.value.lastSavedAt"
            @update-section-index="onUpdateSectionIndex"
            @update-row-value="onUpdateRowValue"
            @update-row-comment="onUpdateRowComment"
            @confirm-warning="onConfirmWarning"
            @fill-zeros-for-section="onFillZeros"
            @copy-previous-for-section="onCopyPrevious"
            @save-draft="onSaveDraft"
            @submit-report="onSubmitReport"
          />
        </template>

        <!-- Главный экран личного кабинета хозяйства -->
        <FarmerDashboard
          v-else-if="currentFarm"
          :farm="currentFarm"
          :reports="reportingState.state.value.reports"
          :form-settings="reportingState.state.value.formSettings"
          :help-settings="reportingState.state.value.helpSettings"
          :help-contacts="reportingState.state.value.helpContacts"
          @open-report="onOpenReport"
          @create-report="onCreateReport"
          @update-contacts="onUpdateContacts"
        />
      </template>

      <!-- 2. КАБИНЕТ СПЕЦИАЛИСТА СТАТИСТИКИ (Только для роли 'specialist') -->
      <template v-else-if="currentUser.role === 'specialist'">
        <div class="specialist-container">
          <ReportReviewDetail
            v-if="reviewState.state.value.selectedReport"
            :report="reviewState.state.value.selectedReport"
            @back="onBackToReviewList"
            @approve="onApproveReport"
            @return-revision="onReturnRevision"
          />

          <ReportReviewList
            v-else
            :reports="reviewState.state.value.reports"
            :filter-district="reviewState.state.value.filterDistrict"
            :filter-status="reviewState.state.value.filterStatus"
            :filter-search="reviewState.state.value.filterSearch"
            :is-loading="reviewState.state.value.isLoading"
            @select-report="onSelectReviewReport"
            @update-district="reviewState.setFilterDistrict"
            @update-status="reviewState.setFilterStatus"
            @update-search="reviewState.setFilterSearch"
          />
        </div>
      </template>

      <!-- 3. КАБИНЕТ АДМИНИСТРАТОРА СИСТЕМЫ (Только для роли 'admin') -->
      <template v-else-if="currentUser.role === 'admin'">
        <div class="admin-section-tabs">
          <button type="button" :class="{ active: adminSection === 'users' }" @click="adminSection = 'users'">Пользователи и хозяйства</button>
          <button type="button" :class="{ active: adminSection === 'reporting' }" @click="adminSection = 'reporting'">Настройки отчётности</button>
          <button type="button" :class="{ active: adminSection === 'help' }" @click="adminSection = 'help'">Справочная служба</button>
          <button type="button" :class="{ active: adminSection === 'notifications' }" @click="adminSection = 'notifications'">Уведомления</button>
          <button type="button" :class="{ active: adminSection === 'audit' }" @click="adminSection = 'audit'">Журнал действий</button>
        </div>
        <AdminUserManagement
          v-if="adminSection === 'users'"
          :users="adminState.state.value.users"
          :farms="authState.state.value.farms"
          :is-loading="adminState.state.value.isLoading"
          @create-user="onCreateAdminUser"
          @update-user="onUpdateAdminUser"
          @delete-user="onDeleteAdminUser"
          @restore-user="onRestoreAdminUser"
        />
        <AdminReportSettings
          v-else-if="adminSection === 'reporting'"
          :settings="reportingState.state.value.formSettings"
          @update="onUpdateReportFormSettings"
        />
        <AdminHelpSettings
          v-else-if="adminSection === 'help'"
          :settings="reportingState.state.value.helpSettings"
          @update="onUpdateHelpSettings"
        />
        <AdminAuditLog
          v-else-if="adminSection === 'audit'"
          :entries="adminState.state.value.auditEntries"
          :is-loading="adminState.state.value.isLoading"
          @refresh="appService.loadAuditLog()"
        />
        <AdminNotificationSettings
          v-else-if="notificationState.state.value.settings && notificationState.state.value.defaults"
          :settings="notificationState.state.value.settings"
          :defaults="notificationState.state.value.defaults"
          @update="onUpdateNotificationSettings"
        />
      </template>
    </main>
  </div>
</template>

<style scoped lang="scss">
.app-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #0f172a;
}

.app-main {
  flex: 1;
  padding: 1.5rem 2rem;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 1rem 0.75rem;
  }
}

.boot-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.back-bar {
  margin-bottom: 1rem;
}

.back-link-btn {
  background: transparent;
  border: none;
  color: #2563eb;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0;

  &:hover {
    text-decoration: underline;
  }
}

.specialist-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-section-tabs {
  display: flex;
  gap: 0.35rem;
  width: fit-content;
  margin-bottom: 1rem;
  padding: 0.3rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;

  button {
    padding: 0.55rem 0.85rem;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: #64748b;
    font: inherit;
    font-size: 0.86rem;
    font-weight: 700;
    cursor: pointer;

    &.active {
      color: #ffffff;
      background: #059669;
    }
  }
}
</style>
