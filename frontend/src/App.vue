<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { appService, AppHeader } from '@/app'
import { useAuthState, AuthLoginForm } from '@/modules/auth'
import { useReportingState, getFormSchemaByCode, FormWizard, FarmerDashboard, reportingService } from '@/modules/reporting'
import { useReviewState, ReportReviewList, ReportReviewDetail } from '@/modules/review'
import { useAdminState, AdminUserManagement } from '@/modules/admin'
import type { ReportUIModel } from '@/shared/types'
import type { CreateUserDto } from '@/api'

const authState = useAuthState()
const reportingState = useReportingState()
const reviewState = useReviewState()
const adminState = useAdminState()

onMounted(async () => {
  await appService.initializeApp()
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

function onReturnRevision(reportId: string, comment: string): void {
  appService.returnForRevision(reportId, comment)
}

// Admin (Администратор)
function onCreateAdminUser(payload: CreateUserDto): void {
  appService.createAdminUser(payload)
}

function onDeleteAdminUser(userId: string): void {
  appService.deleteAdminUser(userId)
}

function onRestoreAdminUser(userId: string): void {
  appService.restoreAdminUser(userId)
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
    />

    <main class="app-main">
      <!-- 0. Экран аутентификации (если пользователь не вошел) -->
      <AuthLoginForm
        v-if="!currentUser"
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
          @open-report="onOpenReport"
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
            @select-report="onSelectReviewReport"
            @update-district="reviewState.setFilterDistrict"
            @update-status="reviewState.setFilterStatus"
            @update-search="reviewState.setFilterSearch"
          />
        </div>
      </template>

      <!-- 3. КАБИНЕТ АДМИНИСТРАТОРА СИСТЕМЫ (Только для роли 'admin') -->
      <template v-else-if="currentUser.role === 'admin'">
        <AdminUserManagement
          :users="adminState.state.value.users"
          :is-loading="adminState.state.value.isLoading"
          @create-user="onCreateAdminUser"
          @delete-user="onDeleteAdminUser"
          @restore-user="onRestoreAdminUser"
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
</style>
