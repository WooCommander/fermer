<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { UserAccount, FarmProfile } from '@/shared/types'
import { AppButton, AppConfirmDialog } from '@/shared/ui'

interface Props {
  currentUser: UserAccount | null
  currentFarm: FarmProfile | null
  isEditingReport?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentUser: null,
  currentFarm: null,
  isEditingReport: false,
})

const emit = defineEmits<{
  (e: 'goToDashboard'): void
  (e: 'logout'): void
}>()

const showLogoutConfirm = ref(false)

// Высота шапки нужна другим липким блокам (например, карточке отчёта), чтобы они прилипали под ней
const headerEl = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | undefined

function publishHeaderHeight(): void {
  if (headerEl.value) {
    document.documentElement.style.setProperty('--app-header-height', `${headerEl.value.offsetHeight}px`)
  }
}

onMounted(() => {
  publishHeaderHeight()
  if (headerEl.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(publishHeaderHeight)
    resizeObserver.observe(headerEl.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  document.documentElement.style.removeProperty('--app-header-height')
})

function onLogoutConfirm(): void {
  showLogoutConfirm.value = false
  emit('logout')
}
</script>

<template>
  <header ref="headerEl" class="app-header">
    <div class="header-container">
      <div class="brand-group" @click="emit('goToDashboard')">
        <div class="brand-logo">🌾</div>
        <div class="brand-text">
          <div class="brand-name">Агро<span>Стат</span></div>
          <div class="brand-sub">Гос. служба статистики Приднестровья</div>
        </div>
      </div>

      <div v-if="props.currentUser" class="header-right">
        <!-- Кнопка возврата в личный кабинет если фермер редактирует отчет -->
        <AppButton
          v-if="props.currentUser.role === 'farmer' && props.isEditingReport"
          size="sm"
          variant="secondary"
          @click="emit('goToDashboard')"
        >
          ← В личный кабинет
        </AppButton>

        <!-- Профиль пользователя -->
        <div class="user-profile-badge">
          <span class="user-avatar">
            {{ props.currentUser.role === 'admin' ? '⚙️' : props.currentUser.role === 'specialist' ? '💼' : '🚜' }}
          </span>
          <div class="user-meta">
            <span class="user-title">{{ props.currentFarm ? props.currentFarm.name : props.currentUser.name }}</span>
            <div class="user-sub">
              <span :class="['role-pill', `role-${props.currentUser.role}`]">
                {{ props.currentUser.role === 'admin' ? 'Администратор' : props.currentUser.role === 'specialist' ? 'Специалист статистики' : 'Респондент (Фермер)' }}
              </span>
              <span v-if="props.currentUser.district" class="district-text">• {{ props.currentUser.district }}</span>
            </div>
          </div>
        </div>

        <AppButton
          size="sm"
          variant="ghost"
          @click="showLogoutConfirm = true"
        >
          Выйти ✕
        </AppButton>
      </div>
    </div>

    <!-- Диалог подтверждения выхода -->
    <AppConfirmDialog
      :open="showLogoutConfirm"
      title="Завершить сеанс работы?"
      message="Вы уверены, что хотите выйти из учетной записи? Убедитесь, что все несохраненные данные отчетов были сохранены в черновик."
      confirm-text="Да, выйти"
      cancel-text="Остаться"
      variant="warning"
      @confirm="onLogoutConfirm"
      @cancel="showLogoutConfirm = false"
    />
  </header>
</template>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.75rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  max-width: 1440px;
  margin: 0 auto;
}

.brand-group {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
}

.brand-logo {
  font-size: 1.8rem;
  line-height: 1;
}

.brand-name {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;

  span {
    color: #10b981;
  }
}

.brand-sub {
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.user-profile-badge {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.35rem 0.75rem;
  border-radius: 10px;
}

.user-avatar {
  font-size: 1.3rem;
  line-height: 1;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.user-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}

.user-sub {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: #64748b;
}

.role-pill {
  font-weight: 700;
  border-radius: 4px;
  padding: 0.05rem 0.35rem;

  &.role-admin {
    background: #f5f3ff;
    color: #6d28d9;
  }

  &.role-specialist {
    background: #eff6ff;
    color: #1d4ed8;
  }

  &.role-farmer {
    background: #ecfdf5;
    color: #047857;
  }
}

.district-text {
  color: #64748b;
}
</style>
