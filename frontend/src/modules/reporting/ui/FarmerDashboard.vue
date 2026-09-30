<script setup lang="ts">
import type { FarmProfile, ReportUIModel } from '@/shared/types'
import { AppBadge, AppButton, AppProgressBar, AppAlert } from '@/shared/ui'
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
            <span>👤 Руководитель / Контакт: <b>{{ props.farm.contactPerson }}</b> ({{ props.farm.phone }})</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Заголовок раздела отчетов -->
    <div class="section-header">
      <div>
        <h3>Статистическая отчетность хозяйства</h3>
        <p>Назначенные формы для сдачи в Государственную службу статистики</p>
      </div>
    </div>

    <!-- Список назначенных отчетов -->
    <div class="reports-grid">
      <div
        v-for="rep in props.reports"
        :key="rep.id"
        class="report-card"
      >
        <div class="card-top">
          <div class="form-title-group">
            <span class="form-num-badge">Форма {{ rep.formCode }}</span>
            <h4>{{ rep.formTitle }}</h4>
            <span class="period-info">Период: <b>{{ rep.period }}</b></span>
          </div>
          <AppBadge :status="rep.status" />
        </div>

        <AppAlert
          v-if="rep.status === 'needs_revision' && rep.revisionComment"
          variant="warning"
          title="Замечание инспектора статистики"
        >
          {{ rep.revisionComment }}
        </AppAlert>

        <div class="card-bottom">
          <div class="updated-time">
            Обновлено: {{ new Date(rep.updatedAt).toLocaleString('ru-RU') }}
          </div>
          <AppButton
            :variant="rep.status === 'needs_revision' ? 'danger' : rep.status === 'submitted' || rep.status === 'approved' ? 'secondary' : 'primary'"
            @click="emit('openReport', rep)"
          >
            <span v-if="rep.status === 'submitted' || rep.status === 'approved'">👁 Просмотреть отчет</span>
            <span v-else-if="rep.status === 'needs_revision'">✏️ Исправить замечания →</span>
            <span v-else>📝 Перейти к заполнению →</span>
          </AppButton>
        </div>
      </div>

      <div v-if="props.reports.length === 0" class="no-reports">
        <p>Для вашего хозяйства пока нет активных назначенных форм отчетности.</p>
      </div>
    </div>

    <!-- Справочная плашка -->
    <div class="help-box">
      <div class="help-icon">💡</div>
      <div class="help-text">
        <strong>Нужна помощь в заполнении или консультация?</strong>
        <p>Свяжитесь со специалистом статистики вашего района: <b>+373 (533) 9-22-45</b> (пн-пт с 8:00 до 17:00).</p>
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

.section-header {
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

.form-num-badge {
  align-self: flex-start;
  font-family: monospace;
  font-size: 0.8rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #334155;
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

.no-reports {
  background: #ffffff;
  padding: 2rem;
  text-align: center;
  border-radius: 12px;
  color: #64748b;
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
