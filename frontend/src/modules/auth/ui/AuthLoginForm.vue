<script setup lang="ts">
import { ref } from 'vue'
import { AppButton, AppInput, AppAlert } from '@/shared/ui'

interface Props {
  isLoading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null,
})

const emit = defineEmits<{
  (e: 'login', login: string, pin: string): void
}>()

const login = ref('')
const pinCode = ref('')
const localError = ref('')

function onSubmit(): void {
  localError.value = ''
  if (!login.value.trim()) {
    localError.value = 'Введите логин, email или фискальный код'
    return
  }
  emit('login', login.value.trim(), pinCode.value.trim())
}

function quickSelect(userLogin: string): void {
  login.value = userLogin
  pinCode.value = '123'
  emit('login', userLogin, '123')
}
</script>

<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <div class="auth-header">
        <div class="logo-icon">🌾</div>
        <h1>Агро<span>Стат</span></h1>
        <p class="subtitle">Государственная информационная система сбора статистической отчетности</p>
      </div>

      <AppAlert v-if="props.error || localError" variant="error" title="Ошибка входа">
        {{ props.error || localError }}
      </AppAlert>

      <form class="auth-form" @submit.prevent="onSubmit">
        <AppInput
          v-model="login"
          label="Логин / Фискальный код / Email:"
          placeholder="Например: 0200034125 или specialist_slobodzeya"
          type="text"
        />

        <AppInput
          v-model="pinCode"
          label="Пароль или код доступа:"
          placeholder="••••••••"
          type="password"
        />

        <AppButton
          type="submit"
          variant="primary"
          size="lg"
          :loading="props.isLoading"
          class="submit-btn"
        >
          Войти в систему →
        </AppButton>
      </form>

      <!-- Быстрый вход в 3 разных кабинета для демонстрации и проверки -->
      <div class="demo-roles-section">
        <div class="divider">
          <span>Выберите роль для быстрого входа</span>
        </div>

        <div class="roles-cards-grid">
          <!-- 1. Фермер -->
          <button
            type="button"
            class="role-card-btn role-farmer"
            @click="quickSelect('0200034125')"
          >
            <div class="role-icon">🚜</div>
            <div class="role-desc">
              <strong>Фермер / КФХ</strong>
              <span>ООО «Агро-Нива» (ФК: 0200034125)</span>
              <small>Заполнение и отправка отчетов, архив, замечания</small>
            </div>
          </button>

          <!-- 2. Специалист статистики -->
          <button
            type="button"
            class="role-card-btn role-specialist"
            @click="quickSelect('specialist_slobodzeya')"
          >
            <div class="role-icon">💼</div>
            <div class="role-desc">
              <strong>Специалист статистики</strong>
              <span>Григорьева Е.Н. (Слободзейский р-н)</span>
              <small>Реестр сданных отчетов, проверка, возврат/прием</small>
            </div>
          </button>

          <!-- 3. Администратор -->
          <button
            type="button"
            class="role-card-btn role-admin"
            @click="quickSelect('admin')"
          >
            <div class="role-icon">⚙️</div>
            <div class="role-desc">
              <strong>Администратор системы</strong>
              <span>Управление доступом</span>
              <small>Добавление специалистов, фермеров, назначение форм</small>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 1.5rem 1rem;
}

.auth-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.06);
  max-width: 520px;
  width: 100%;
  padding: 2.25rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.auth-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;

  .logo-icon {
    font-size: 2.5rem;
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  h1 {
    font-size: 1.7rem;
    font-weight: 800;
    margin: 0;
    color: #0f172a;

    span {
      color: #10b981;
    }
  }

  .subtitle {
    font-size: 0.82rem;
    color: #64748b;
    margin: 0;
    line-height: 1.4;
  }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.submit-btn {
  width: 100%;
  margin-top: 0.5rem;
}

.demo-roles-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 600;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e2e8f0;
  }

  span {
    padding: 0 0.5rem;
  }
}

.roles-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.role-card-btn {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  font-family: inherit;

  .role-icon {
    font-size: 1.6rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .role-desc {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;

    strong {
      font-size: 0.92rem;
      color: #0f172a;
    }

    span {
      font-size: 0.82rem;
      color: #475569;
      font-weight: 600;
    }

    small {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.1rem;
    }
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  &.role-farmer:hover {
    border-color: #10b981;
    background: #f0fdf4;
    strong { color: #065f46; }
  }

  &.role-specialist:hover {
    border-color: #3b82f6;
    background: #eff6ff;
    strong { color: #1d4ed8; }
  }

  &.role-admin:hover {
    border-color: #8b5cf6;
    background: #f5f3ff;
    strong { color: #6d28d9; }
  }
}
</style>
