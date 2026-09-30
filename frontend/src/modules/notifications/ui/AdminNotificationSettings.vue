<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { NotificationKind, NotificationSettings } from '@/shared/types'
import { AppButton } from '@/shared/ui'
import { NOTIFICATION_PLACEHOLDERS, NOTIFICATION_TITLES } from '../lib/notification-builder'

const props = defineProps<{ settings: NotificationSettings; defaults: NotificationSettings }>()
const emit = defineEmits<{ (e: 'update', settings: NotificationSettings): void }>()

const KINDS = Object.keys(NOTIFICATION_TITLES) as NotificationKind[]

const DESCRIPTIONS: Record<NotificationKind, string> = {
  period_open: 'Фермеру, когда открылся приём отчёта, а сам отчёт ещё не создан.',
  deadline_soon: 'За указанное число дней до срока, пока отчёт не сдан.',
  deadline_overdue: 'После срока сдачи, если отчёт не сдан.',
  submitted: 'Сразу после отправки отчёта.',
  approved: 'Когда специалист принял отчёт.',
  returned: 'Когда специалист вернул отчёт на уточнение.',
}

function clone(settings: NotificationSettings): NotificationSettings {
  return {
    deadlineDays: settings.deadlineDays,
    rules: Object.fromEntries(KINDS.map((kind) => [kind, { ...settings.rules[kind] }])) as NotificationSettings['rules'],
  }
}

const draft = reactive<NotificationSettings>(clone(props.settings))
const error = ref('')
const saved = ref(false)

watch(() => props.settings, (value) => Object.assign(draft, clone(value)))

function save(): void {
  const days = Math.floor(Number(draft.deadlineDays))
  if (!Number.isFinite(days) || days < 1 || days > 90) {
    error.value = 'Срок напоминания — от 1 до 90 дней'
    return
  }
  if (KINDS.some((kind) => draft.rules[kind].enabled && !draft.rules[kind].template.trim())) {
    error.value = 'У включённого уведомления должен быть текст'
    return
  }
  error.value = ''
  emit('update', { deadlineDays: days, rules: clone(draft).rules })
  saved.value = true
  setTimeout(() => { saved.value = false }, 2500)
}

// Фигурные скобки нельзя писать прямо в шаблоне: «}}» закроет интерполяцию
function placeholderTag(name: string): string {
  return '{' + name + '}'
}

function resetToDefaults(): void {
  Object.assign(draft, clone(props.defaults))
}
</script>

<template>
  <section class="notification-settings">
    <div class="settings-heading">
      <h2>Уведомления для фермеров</h2>
      <p>
        Тексты и правила показа уведомлений в колокольчике кабинета фермера. В тексте можно использовать подстановки:
        <code v-for="name in NOTIFICATION_PLACEHOLDERS" :key="name">{{ placeholderTag(name) }}</code>.
        Предложение, для которого нет значения (например, номера или комментария), в уведомление не попадает.
      </p>
    </div>

    <label class="days-field">
      Напоминать о сроке за, дней
      <input v-model.number="draft.deadlineDays" type="number" min="1" max="90" />
    </label>

    <div class="rules">
      <article v-for="kind in KINDS" :key="kind" class="rule-card">
        <div class="rule-head">
          <div>
            <strong>{{ NOTIFICATION_TITLES[kind] }}</strong>
            <small>{{ DESCRIPTIONS[kind] }}</small>
          </div>
          <label class="enabled-toggle">
            <input v-model="draft.rules[kind].enabled" type="checkbox" />
            Включено
          </label>
        </div>
        <textarea v-model="draft.rules[kind].template" rows="2" :disabled="!draft.rules[kind].enabled" />
      </article>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>
    <div class="actions">
      <AppButton size="sm" variant="primary" @click="save">Сохранить</AppButton>
      <AppButton size="sm" variant="secondary" @click="resetToDefaults">Вернуть стандартные тексты</AppButton>
      <span v-if="saved" class="saved-note">Сохранено</span>
    </div>
  </section>
</template>

<style scoped lang="scss">
.notification-settings {
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.settings-heading {
  h2 { margin: 0; font-size: 1.1rem; }
  p { margin: 0.3rem 0 1rem; max-width: 760px; color: #64748b; font-size: 0.88rem; line-height: 1.6; }

  code {
    margin-right: 0.3rem;
    padding: 0.1rem 0.35rem;
    background: #f1f5f9;
    border-radius: 4px;
    font-size: 0.8rem;
  }
}

.days-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  max-width: 220px;
  margin-bottom: 1rem;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 700;

  input {
    padding: 0.5rem 0.7rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font: inherit;
  }
}

.rules {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
}

.rule-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;

  textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 0.55rem 0.7rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font: inherit;
    font-size: 0.88rem;
    resize: vertical;

    &:disabled {
      background: #f8fafc;
      color: #94a3b8;
    }
  }
}

.rule-head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;

  strong { display: block; color: #0f172a; font-size: 0.92rem; }
  small { display: block; margin-top: 0.15rem; color: #64748b; font-size: 0.78rem; line-height: 1.35; }
}

.enabled-toggle {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.35rem;
  color: #475569;
  font-size: 0.8rem;
  white-space: nowrap;
}

.form-error {
  margin: 1rem 0 0;
  color: #dc2626;
  font-size: 0.85rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1rem;
}

.saved-note {
  color: #15803d;
  font-size: 0.85rem;
  font-weight: 600;
}
</style>
