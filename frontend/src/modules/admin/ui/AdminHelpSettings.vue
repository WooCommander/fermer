<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { HelpSettings } from '@/shared/types'
import { AppButton } from '@/shared/ui'

const props = defineProps<{ settings: HelpSettings }>()
const emit = defineEmits<{ (e: 'update', settings: HelpSettings): void }>()

const draft = reactive<HelpSettings>({ ...props.settings })
const error = ref('')

watch(() => props.settings, (value) => Object.assign(draft, value))

function save(): void {
  if (!draft.message.trim()) {
    error.value = 'Введите текст подсказки'
    return
  }
  if (!draft.fallbackPhone.trim() && !draft.fallbackEmail?.trim()) {
    error.value = 'Укажите телефон или email общей справочной службы'
    return
  }
  error.value = ''
  emit('update', {
    message: draft.message.trim(),
    fallbackPhone: draft.fallbackPhone.trim(),
    fallbackEmail: draft.fallbackEmail?.trim() ?? '',
  })
}
</script>

<template>
  <section class="help-settings">
    <div class="settings-heading">
      <h2>Справочная служба</h2>
      <p>
        Фермер видит этот текст внизу своего кабинета. Вместе с ним показываются контакты регистраторов,
        которым назначен район хозяйства (ФИО, телефон и email берутся из их учётных записей).
        Если для района регистратора нет, показываются контакты центрального аппарата, а при их отсутствии — общий номер ниже.
      </p>
    </div>

    <div class="settings-form">
      <label>
        Текст подсказки
        <textarea v-model="draft.message" rows="3" />
      </label>
      <div class="form-row">
        <label>
          Общий телефон (запасной)
          <input v-model="draft.fallbackPhone" type="tel" placeholder="+373 (533) 9-22-45" />
        </label>
        <label>
          Общий email (запасной)
          <input v-model="draft.fallbackEmail" type="email" placeholder="agro.stat@stat.gospmr.org" />
        </label>
      </div>
      <p v-if="error" class="form-error">{{ error }}</p>
      <div>
        <AppButton size="sm" variant="primary" @click="save">Сохранить</AppButton>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.help-settings {
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.settings-heading {
  h2 { margin: 0; font-size: 1.1rem; }
  p { margin: 0.3rem 0 1rem; color: #64748b; font-size: 0.88rem; line-height: 1.45; max-width: 720px; }
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-width: 720px;

  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    color: #475569;
    font-size: 0.8rem;
    font-weight: 700;
  }

  input,
  textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 0.55rem 0.7rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 400;
    color: #0f172a;

    &:focus {
      outline: none;
      border-color: #10b981;
    }
  }

  textarea { resize: vertical; }
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.9rem;
}

.form-error {
  margin: 0;
  color: #dc2626;
  font-size: 0.85rem;
}
</style>
