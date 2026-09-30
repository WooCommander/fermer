<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FarmProfile, ReportUIModel } from '@/shared/types'
import { AppBadge, AppButton, AppAlert } from '@/shared/ui'
import { formatActivityTypeName } from '@/shared/lib'

interface Props {
  farm: FarmProfile
  reports: ReportUIModel[]
  activeReportId?: string
}

const props = withDefaults(defineProps<Props>(), {
  reports: () => [],
  activeReportId: '',
})

const emit = defineEmits<{
  (e: 'openReport', report: ReportUIModel): void
}>()

const activeTab = ref<'active' | 'archive'>('active')

// Текущие отчеты (2026 год)
const currentReports = computed(() => {
  return props.reports.filter((r) => r.year >= 2026 && r.status !== 'approved')
})

// Архивные и сданные отчеты (прошлые годы или утвержденные)
const archivedReports = computed(() => {
  return props.reports.filter((r) => r.year < 2026 || r.status === 'approved')
})

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
    </div>

    <!-- 1. ВКЛАДКА: ТЕКУЩИЕ ОТЧЕТЫ (2026 год) -->
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
              <h4>{{ rep.formTitle }}</h4>
              <span class="period-info">Отчетный период: <b>{{ rep.period }}</b></span>
            </div>
            <AppBadge :status="rep.status" />
          </div>

          <!-- Предупреждение о замечаниях инспектора -->
          <AppAlert
            v-if="rep.status === 'needs_revision' && rep.revisionComment"
            variant="warning"
            title="Замечание инспектора статистики (требуется уточнение)"
          >
            {{ rep.revisionComment }}
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
          <p>Все назначенные формы на текущий отчетный период сданы и приняты!</p>
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
              <h4>{{ rep.formTitle }}</h4>
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
        <p>При возникновении вопросов по заполнению форм или методологии расчетов обращайтесь в отдел статистики вашего района: <b>+373 (533) 9-22-45</b>.</p>
      </div>
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
}

.tabs-group {
  display: flex;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.3rem;
  gap: 0.35rem;
  width: 100%;
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
  }
}
</style>
