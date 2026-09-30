<script setup lang="ts">
import { reactive } from 'vue'
import type { ReportFormSettings } from '@/shared/types'
import { AppButton } from '@/shared/ui'

const props = defineProps<{ settings: ReportFormSettings[] }>()
const emit = defineEmits<{ (e: 'update', settings: ReportFormSettings): void }>()
const drafts = reactive<Record<string, ReportFormSettings>>({})

function draft(settings: ReportFormSettings): ReportFormSettings {
  if (!drafts[settings.formCode]) drafts[settings.formCode] = { ...settings }
  return drafts[settings.formCode]
}

function save(settings: ReportFormSettings): void {
  emit('update', { ...draft(settings) })
}
</script>

<template>
  <section class="report-settings">
    <div class="settings-heading">
      <div>
        <h2>Настройки отчётности</h2>
        <p>Сроки подачи и доступность форм для фермеров.</p>
      </div>
    </div>
    <div class="settings-list">
      <article v-for="settings in props.settings" :key="settings.formCode" class="settings-card">
        <div class="form-heading">
          <strong>{{ settings.formCode }}</strong>
          <label class="active-toggle"><input v-model="draft(settings).isActive" type="checkbox" /> Форма активна</label>
        </div>
        <div class="date-grid">
          <label>Открыть с<input v-model.number="draft(settings).submissionStartDay" type="number" min="1" max="31" /><select v-model.number="draft(settings).submissionStartMonth"><option v-for="month in 12" :key="month" :value="month">{{ month }}</option></select></label>
          <label>Крайний срок<input v-model.number="draft(settings).submissionDeadlineDay" type="number" min="1" max="31" /><select v-model.number="draft(settings).submissionDeadlineMonth"><option v-for="month in 12" :key="month" :value="month">{{ month }}</option></select></label>
          <label>Год срока<select v-model.number="draft(settings).deadlineYearOffset"><option :value="0">Текущий</option><option :value="1">Следующий</option></select></label>
        </div>
        <AppButton size="sm" variant="primary" @click="save(settings)">Сохранить</AppButton>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
.report-settings { margin-top: 1.5rem; padding: 1.25rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; }
.settings-heading h2 { margin: 0; font-size: 1.1rem; }.settings-heading p { margin: .3rem 0 1rem; color:#64748b; font-size:.88rem; }
.settings-list { display:grid; grid-template-columns:repeat(auto-fit,minmax(290px,1fr)); gap:1rem; }.settings-card { padding:1rem; border:1px solid #e2e8f0; border-radius:10px; }
.form-heading { display:flex; justify-content:space-between; gap:.75rem; margin-bottom:.9rem; color:#0f172a; }.active-toggle { font-size:.8rem; color:#475569; }
.date-grid { display:grid; grid-template-columns:1fr 1fr; gap:.7rem; margin-bottom:1rem; }.date-grid label { display:flex; flex-direction:column; gap:.3rem; color:#475569; font-size:.78rem; font-weight:700; }.date-grid label:last-child { grid-column:span 2; }
.date-grid input,.date-grid select { min-width:0; padding:.45rem; border:1px solid #cbd5e1; border-radius:6px; font:inherit; }.date-grid label:not(:last-child) input { width:100%; box-sizing:border-box; }
</style>
