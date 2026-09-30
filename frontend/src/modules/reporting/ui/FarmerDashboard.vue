<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FarmProfile, HelpContact, HelpSettings, ReportFormSettings, ReportUIModel } from '@/shared/types'
import { AppBadge, AppButton, AppAlert, AppProgressBar } from '@/shared/ui'
import { formatActivityTypeName } from '@/shared/lib'
import { getFormSchemaByCode } from '../schemas'
import { reportingService } from '../services/reporting.service'

interface Props {
  farm: FarmProfile
  reports: ReportUIModel[]
  formSettings?: ReportFormSettings[]
  helpSettings?: HelpSettings
  helpContacts?: HelpContact[]
  activeReportId?: string
}

const props = withDefaults(defineProps<Props>(), {
  reports: () => [],
  formSettings: () => [],
  helpSettings: () => ({ message: '', fallbackPhone: '', fallbackEmail: '' }),
  helpContacts: () => [],
  activeReportId: '',
})

const emit = defineEmits<{
  (e: 'openReport', report: ReportUIModel): void
  (e: 'createReport', formCode: string, year: number): void
  (e: 'updateContacts', phone: string, contactPerson: string): void
}>()

const activeTab = ref<'active' | 'archive'>('active')
const showCreateDialog = ref(false)
const selectedFormCode = ref('')
const selectedYear = ref(new Date().getFullYear())

// Текущие — всё, что ещё не принято (в том числе неисправленные отчёты прошлых лет)
const currentReports = computed(() => {
  return props.reports
    .filter((r) => r.status !== 'approved')
    .sort((first, second) => second.year - first.year)
})

// Архив — только принятые отчёты
const archivedReports = computed(() => {
  return props.reports
    .filter((r) => r.status === 'approved')
    .sort((first, second) => second.year - first.year)
})

const availableForms = computed(() => {
  return props.farm.assignedForms
    .filter((formCode) => props.formSettings.find((settings) => settings.formCode === formCode)?.isActive !== false)
    .filter((formCode) => !props.reports.some((report) => report.formCode === formCode && report.year === selectedYear.value))
    .map((formCode) => ({
      code: formCode,
      title: getFormSchemaByCode(formCode).title,
    }))
})

const createUrgency = computed(() => {
  const reportYear = new Date().getFullYear()
  const now = new Date()

  const urgentForms = props.farm.assignedForms
    .filter((formCode) => !props.reports.some((report) => report.formCode === formCode && report.year === reportYear))
    .map((formCode) => {
      const settings = props.formSettings.find((item) => item.formCode === formCode)
      if (!settings?.isActive) return null

      const dueDate = new Date(reportYear + settings.deadlineYearOffset, settings.submissionDeadlineMonth - 1, settings.submissionDeadlineDay, 23, 59, 59)
      const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / 86_400_000)
      return { formCode, dueDate, daysLeft }
    })
    .filter((item): item is { formCode: string; dueDate: Date; daysLeft: number } => item !== null)
    .filter((item) => item.daysLeft <= 30)
    .sort((first, second) => first.daysLeft - second.daysLeft)

  const next = urgentForms[0]
  if (!next) return null

  const deadline = next.dueDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  if (next.daysLeft < 0) {
    return { level: 'overdue', text: `Срок подачи формы ${next.formCode} истёк ${deadline}` }
  }
  if (next.daysLeft === 0) {
    return { level: 'soon', text: `Сегодня последний день подачи формы ${next.formCode}` }
  }
  return { level: 'soon', text: `Пора подготовить форму ${next.formCode}: срок ${deadline}` }
})

// Список доступных форм зависит от года: выбранная форма должна оставаться из списка
watch(availableForms, (forms) => {
  if (!forms.some((form) => form.code === selectedFormCode.value)) {
    selectedFormCode.value = forms[0]?.code ?? ''
  }
})

function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

// Срок сдачи показываем только для отчётов, которые ещё предстоит сдать
function getDeadline(rep: ReportUIModel): { text: string; level: 'ok' | 'soon' | 'overdue' } | null {
  if (rep.status === 'submitted' || rep.status === 'approved') return null
  const settings = props.formSettings.find((item) => item.formCode === rep.formCode)
  if (!settings) return null

  const dueDate = new Date(rep.year + settings.deadlineYearOffset, settings.submissionDeadlineMonth - 1, settings.submissionDeadlineDay, 23, 59, 59)
  const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / 86_400_000)
  const dateText = dueDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  if (daysLeft < 0) return { text: `Просрочено: срок был до ${dateText}`, level: 'overdue' }
  if (daysLeft <= 7) return { text: `Срок: до ${dateText} (осталось дн.: ${daysLeft})`, level: 'soon' }
  return { text: `Срок: до ${dateText}`, level: 'ok' }
}

function getProgress(rep: ReportUIModel) {
  return reportingService.getFillProgress(rep)
}

const showContactsDialog = ref(false)
const contactsPhone = ref('')
const contactsPerson = ref('')
const contactsError = ref('')

function openContactsDialog(): void {
  contactsPhone.value = props.farm.phone
  contactsPerson.value = props.farm.contactPerson
  contactsError.value = ''
  showContactsDialog.value = true
}

function saveContacts(): void {
  const phone = contactsPhone.value.trim()
  const person = contactsPerson.value.trim()
  if (!person) {
    contactsError.value = 'Укажите контактное лицо'
    return
  }
  if (!/^\+?373\d{8}$/.test(phone.replace(/[\s()-]/g, ''))) {
    contactsError.value = 'Укажите номер в формате +373 XX XXX XXX'
    return
  }
  emit('updateContacts', phone, person)
  showContactsDialog.value = false
}

function openCreateDialog(): void {
  selectedFormCode.value = availableForms.value[0]?.code ?? ''
  showCreateDialog.value = true
}

function createReport(): void {
  if (!selectedFormCode.value) return

  emit('createReport', selectedFormCode.value, selectedYear.value)
  showCreateDialog.value = false
}

function getSummaryKeyMetrics(rep: ReportUIModel): string {
  if (rep.formCode === '1-фермер') {
    const s150 = rep.values['150']
    const s001 = rep.values['001']
    const s020 = rep.values['020']
    return `Посев: ${s150 ?? 0} га (Озимые: ${s001 ?? 0} га, Яровые зерновые: ${s020 ?? 0} га)`
  }
  if (rep.formCode === '2-фермер') {
    const s010 = rep.values['010']
    const s011 = rep.values['011']
    return `Убрано зерновых: ${s010 ?? 0} га, Валовой сбор: ${s011 ?? 0} ц`
  }
  if (rep.formCode === '3-фермер') {
    const s010 = rep.values['010']
    const s011 = rep.values['011']
    return `КРС всего: ${s010 ?? 0} гол. (Коровы: ${s011 ?? 0} гол.)`
  }
  return 'Отчет сдан в полном объеме'
}
</script>

<template>
  <div class="farmer-dashboard">
    <!-- Карточка профиля хозяйства -->
    <div class="farm-profile-card">
      <div class="profile-main">
        <div class="profile-info">
          <span class="activity-tag">{{ formatActivityTypeName(props.farm.activityType) }}</span>
          <h2>{{ props.farm.name }}</h2>
          <div class="profile-meta">
            <span>📍 {{ props.farm.district }}, {{ props.farm.settlement }}</span>
            <span>📑 Фискальный код: <b>{{ props.farm.fiscalCode }}</b></span>
            <span>👤 Руководитель: <b>{{ props.farm.contactPerson }}</b> • 📞 {{ props.farm.phone }}</span>
          </div>
        </div>
        <AppButton size="sm" variant="secondary" @click="openContactsDialog">✏️ Изменить контакты</AppButton>
      </div>
    </div>

    <!-- Переключатель вкладок: Текущие / Архивные отчеты -->
    <div class="dashboard-tabs-bar">
      <div class="tabs-group">
        <button
          type="button"
          :class="['dash-tab-btn', { active: activeTab === 'active' }]"
          @click="activeTab = 'active'"
        >
          📝 Текущие формы к сдаче ({{ currentReports.length }})
        </button>
        <button
          type="button"
          :class="['dash-tab-btn', { active: activeTab === 'archive' }]"
          @click="activeTab = 'archive'"
        >
          🗄 Архив сданных отчетов ({{ archivedReports.length }})
        </button>
      </div>
      <div class="create-report-action">
        <span v-if="createUrgency" :class="['deadline-hint', `is-${createUrgency.level}`]">{{ createUrgency.text }}</span>
        <AppButton :variant="createUrgency?.level === 'overdue' ? 'danger' : 'primary'" @click="openCreateDialog">
          Создать отчёт
        </AppButton>
      </div>
    </div>

    <!-- 1. ВКЛАДКА: ТЕКУЩИЕ ОТЧЕТЫ -->
    <div v-if="activeTab === 'active'" class="reports-section">
      <div class="section-title-box">
        <h3>Назначенные статистические отчеты (текущий период)</h3>
        <p>Заполните показатели и отправьте отчет в установленный срок</p>
      </div>

      <div class="reports-grid">
        <div
          v-for="rep in currentReports"
          :key="rep.id"
          class="report-card current-report"
        >
          <div class="card-top">
            <div class="form-title-group">
              <span class="form-num-badge">Форма {{ rep.formCode }}</span>
              <h4>{{ getFormSchemaByCode(rep.formCode).title }}</h4>
              <span class="period-info">Отчетный период: <b>{{ rep.period }}</b></span>
              <span v-if="getDeadline(rep)" :class="['deadline-line', `is-${getDeadline(rep)!.level}`]">
                {{ getDeadline(rep)!.text }}
              </span>
            </div>
            <AppBadge :status="rep.status" />
          </div>

          <div v-if="rep.status !== 'submitted'" class="card-progress">
            <AppProgressBar :value="getProgress(rep).percent" />
            <small>Заполнено строк: {{ getProgress(rep).filled }} из {{ getProgress(rep).total }}</small>
          </div>

          <!-- Предупреждение о замечаниях инспектора -->
          <AppAlert
            v-if="rep.status === 'needs_revision' && rep.revisionComment"
            variant="warning"
            title="Замечание инспектора статистики (требуется уточнение)"
          >
            {{ rep.revisionComment }}
            <span v-if="rep.revisionRows?.length" class="revision-rows-hint">Строк к уточнению: {{ rep.revisionRows.length }}</span>
          </AppAlert>

          <div class="card-bottom">
            <div class="updated-time">
              Последнее изменение: {{ new Date(rep.updatedAt).toLocaleString('ru-RU') }}
            </div>
            <AppButton
              :variant="rep.status === 'needs_revision' ? 'danger' : rep.status === 'submitted' ? 'secondary' : 'primary'"
              @click="emit('openReport', rep)"
            >
              <span v-if="rep.status === 'submitted'">👁 Просмотреть сданный отчет</span>
              <span v-else-if="rep.status === 'needs_revision'">✏️ Исправить замечания →</span>
              <span v-else>📝 Продолжить заполнение →</span>
            </AppButton>
          </div>
        </div>

        <div v-if="currentReports.length === 0" class="empty-box">
          <p v-if="props.reports.length === 0">Отчётов пока нет. Нажмите «Создать отчёт», чтобы начать заполнение.</p>
          <p v-else>Все назначенные формы сданы и приняты!</p>
        </div>
      </div>
    </div>

    <!-- 2. ВКЛАДКА: АРХИВ СДАННЫХ И ПРОШЛЫХ ОТЧЕТОВ -->
    <div v-else class="reports-section">
      <div class="section-title-box">
        <h3>Архив ранее сданных статистических отчетов</h3>
        <p>История сданной отчетности с возможностью просмотра и сверки данных прошлых лет</p>
      </div>

      <div class="reports-grid">
        <div
          v-for="rep in archivedReports"
          :key="rep.id"
          class="report-card archive-report"
        >
          <div class="card-top">
            <div class="form-title-group">
              <div class="badge-row">
                <span class="form-num-badge">Форма {{ rep.formCode }}</span>
                <span class="year-pill">{{ rep.year }} г.</span>
              </div>
              <h4>{{ getFormSchemaByCode(rep.formCode).title }}</h4>
              <span class="period-info">Период: <b>{{ rep.period }}</b></span>
            </div>
            <AppBadge :status="rep.status" />
          </div>

          <div class="archive-metrics-box">
            <span class="metrics-label">Сводные показатели отчета:</span>
            <strong class="metrics-val">{{ getSummaryKeyMetrics(rep) }}</strong>
          </div>

          <div class="card-bottom">
            <div class="archive-stamp">
              <span>✅ Принят Госслужбой статистики</span>
              <small v-if="rep.approvedAt">Дата: {{ new Date(rep.approvedAt).toLocaleDateString('ru-RU') }}</small>
            </div>
            <AppButton
              size="sm"
              variant="secondary"
              @click="emit('openReport', rep)"
            >
              📄 Просмотреть отчет (Архив) →
            </AppButton>
          </div>
        </div>

        <div v-if="archivedReports.length === 0" class="empty-box">
          <p>В архиве пока нет ранее сданных отчетов за прошлые периоды.</p>
        </div>
      </div>
    </div>

    <!-- Справочная служба -->
    <div class="help-box">
      <div class="help-icon">💡</div>
      <div class="help-text">
        <strong>Консультации по статистической отчетности:</strong>
        <p v-if="props.helpSettings.message">{{ props.helpSettings.message }}</p>
        <ul v-if="props.helpContacts.length > 0" class="help-contacts">
          <li v-for="contact in props.helpContacts" :key="contact.name + (contact.phone ?? '')">
            <b>{{ contact.name }}</b>
            <a v-if="contact.phone" :href="phoneHref(contact.phone)">📞 {{ contact.phone }}</a>
            <a v-if="contact.email" :href="`mailto:${contact.email}`">✉️ {{ contact.email }}</a>
          </li>
        </ul>
        <p v-else class="help-contacts-fallback">
          <a v-if="props.helpSettings.fallbackPhone" :href="phoneHref(props.helpSettings.fallbackPhone)"><b>{{ props.helpSettings.fallbackPhone }}</b></a>
          <a v-if="props.helpSettings.fallbackEmail" :href="`mailto:${props.helpSettings.fallbackEmail}`">{{ props.helpSettings.fallbackEmail }}</a>
        </p>
      </div>
    </div>

    <div v-if="showContactsDialog" class="dialog-backdrop" @click.self="showContactsDialog = false">
      <section class="create-dialog" role="dialog" aria-modal="true" aria-labelledby="contacts-title">
        <div class="dialog-header">
          <h3 id="contacts-title">Контакты хозяйства</h3>
          <button type="button" class="close-button" aria-label="Закрыть" @click="showContactsDialog = false">×</button>
        </div>
        <p>Эти данные используются для связи специалистов статистики с вашим хозяйством.</p>
        <label>
          Контактное лицо
          <input v-model="contactsPerson" type="text" autocomplete="name" />
        </label>
        <label>
          Телефон
          <input v-model="contactsPhone" type="tel" placeholder="+373 777 00-000" autocomplete="tel" />
        </label>
        <p v-if="contactsError" class="contacts-error">{{ contactsError }}</p>
        <div class="dialog-actions">
          <AppButton variant="secondary" @click="showContactsDialog = false">Отмена</AppButton>
          <AppButton variant="primary" @click="saveContacts">Сохранить</AppButton>
        </div>
      </section>
    </div>

    <div v-if="showCreateDialog" class="dialog-backdrop" @click.self="showCreateDialog = false">
      <section class="create-dialog" role="dialog" aria-modal="true" aria-labelledby="create-report-title">
        <div class="dialog-header">
          <h3 id="create-report-title">Создать отчёт</h3>
          <button type="button" class="close-button" aria-label="Закрыть" @click="showCreateDialog = false">×</button>
        </div>
        <p>Выберите назначенную форму и отчётный год. Создастся пустой черновик.</p>
        <label v-if="availableForms.length > 0">
          Форма
          <select v-model="selectedFormCode">
            <option v-for="form in availableForms" :key="form.code" :value="form.code">
              {{ form.code }} — {{ form.title }}
            </option>
          </select>
        </label>
        <p v-else class="no-forms-notice">
          За {{ selectedYear }} год все назначенные формы уже созданы. Выберите другой год или откройте существующий отчёт.
        </p>
        <label>
          Отчётный год
          <input v-model.number="selectedYear" type="number" min="2020" max="2100" />
        </label>
        <div class="dialog-actions">
          <AppButton variant="secondary" @click="showCreateDialog = false">Отмена</AppButton>
          <AppButton variant="primary" :disabled="!selectedFormCode" @click="createReport">Создать и заполнить</AppButton>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.farmer-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.farm-profile-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.profile-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  h2 {
    font-size: 1.35rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
  }
}

.activity-tag {
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 700;
  color: #059669;
  background: #d1fae5;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  text-transform: uppercase;
}

.profile-meta {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: #64748b;

  b {
    color: #334155;
  }
}

.dashboard-tabs-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.create-report-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  flex-shrink: 0;
}

.deadline-hint {
  max-width: 250px;
  color: #a16207;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: right;
}

.deadline-hint.is-overdue { color: #dc2626; }

.dialog-backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.45);
  z-index: 100;
}

.create-dialog {
  width: min(100%, 480px);
  padding: 1.5rem;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 16px 45px rgba(15, 23, 42, 0.24);

  p { margin: 0.45rem 0 1rem; color: #64748b; font-size: 0.9rem; }
  label { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.9rem; color: #334155; font-size: 0.85rem; font-weight: 700; }
  select, input { width: 100%; box-sizing: border-box; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; color: #0f172a; font: inherit; }
}

.dialog-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.dialog-header h3 { margin: 0; color: #0f172a; font-size: 1.15rem; }
.close-button { border: 0; background: transparent; color: #64748b; font-size: 1.5rem; cursor: pointer; line-height: 1; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
.create-dialog .contacts-error { margin: 0.8rem 0 0; color: #dc2626; }

.revision-rows-hint {
  display: block;
  margin-top: 0.3rem;
  font-weight: 700;
}

.deadline-line {
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;

  &.is-soon { color: #b45309; }
  &.is-overdue { color: #dc2626; }
}

.card-progress {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  small {
    color: #64748b;
    font-size: 0.78rem;
  }
}

.create-dialog .no-forms-notice {
  margin: 0.9rem 0 0;
  padding: 0.75rem 0.9rem;
  border: 1px solid #fde68a;
  border-radius: 8px;
  background: #fffbeb;
  color: #92400e;
  font-size: 0.88rem;
  line-height: 1.4;
}


.tabs-group {
  flex: 1;
  display: flex;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.3rem;
  gap: 0.35rem;
  min-width: 0;
}

.dash-tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.65rem 1rem;
  border-radius: 9px;
  font-size: 0.92rem;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;

  &:hover {
    color: #0f172a;
    background: #f8fafc;
  }

  &.active {
    background: #10b981;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
  }
}

.reports-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title-box {
  h3 {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0;
    color: #0f172a;
  }

  p {
    font-size: 0.85rem;
    color: #64748b;
    margin: 0.2rem 0 0;
  }
}

.reports-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.report-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1.5px solid #e2e8f0;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  &.archive-report {
    background: #fcfdfc;
    border-left: 4px solid #10b981;
  }
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.form-title-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  h4 {
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }
}

.badge-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-num-badge {
  font-family: monospace;
  font-size: 0.8rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #334155;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.year-pill {
  font-size: 0.75rem;
  font-weight: 700;
  background: #e2e8f0;
  color: #475569;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.period-info {
  font-size: 0.82rem;
  color: #64748b;

  b {
    color: #1e293b;
  }
}

.archive-metrics-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  .metrics-label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 600;
  }

  .metrics-val {
    font-size: 0.88rem;
    color: #0f172a;
  }
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f5f9;
  padding-top: 0.85rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.updated-time {
  font-size: 0.78rem;
  color: #94a3b8;
}

.archive-stamp {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #059669;

  small {
    color: #64748b;
    font-size: 0.72rem;
  }
}

.empty-box {
  background: #ffffff;
  padding: 2.5rem 1.5rem;
  text-align: center;
  border-radius: 12px;
  color: #64748b;
  border: 1px dashed #cbd5e1;
}

.help-box {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 1rem 1.25rem;
  border-radius: 12px;

  .help-icon {
    font-size: 1.4rem;
    line-height: 1;
  }

  .help-text {
    font-size: 0.85rem;
    color: #166534;

    p {
      margin: 0.2rem 0 0;
    }

    a {
      color: inherit;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .help-contacts {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin: 0.4rem 0 0;
      padding: 0;
      list-style: none;

      li {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.25rem 0.9rem;
      }
    }

    .help-contacts-fallback {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 0.9rem;
    }
  }
}
</style>
