<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import AppButton from './AppButton.vue'

interface Props {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary' | 'success'
  loading?: boolean
  details?: string
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Подтвердить',
  cancelText: 'Отмена',
  variant: 'danger',
  loading: false,
  details: '',
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const confirmBtnVariant = computed<'primary' | 'secondary' | 'success' | 'danger' | 'ghost'>(() => {
  if (props.variant === 'danger') return 'danger'
  if (props.variant === 'success') return 'success'
  return 'primary'
})

function onKeyDown(e: KeyboardEvent): void {
  if (!props.open) return
  if (e.key === 'Escape') {
    emit('cancel')
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.open"
      class="confirm-overlay"
      @click.self="emit('cancel')"
    >
      <div class="confirm-modal" role="dialog" aria-modal="true">
        <!-- Шапка с иконкой типа опасности -->
        <div class="modal-head">
          <div :class="['head-icon', `icon-${props.variant}`]">
            <span v-if="props.variant === 'danger'">⚠️</span>
            <span v-else-if="props.variant === 'warning'">⚡</span>
            <span v-else-if="props.variant === 'success'">✅</span>
            <span v-else>ℹ️</span>
          </div>
          <div class="head-text">
            <h3 class="modal-title">{{ props.title }}</h3>
          </div>
          <button
            type="button"
            class="close-cross-btn"
            title="Закрыть"
            @click="emit('cancel')"
          >
            ✕
          </button>
        </div>

        <!-- Тело сообщения -->
        <div class="modal-body">
          <p class="modal-message">{{ props.message }}</p>

          <div v-if="props.details" class="details-box">
            <span>{{ props.details }}</span>
          </div>

          <slot />
        </div>

        <!-- Кнопки действий -->
        <div class="modal-foot">
          <AppButton
            variant="secondary"
            :disabled="props.loading"
            @click="emit('cancel')"
          >
            {{ props.cancelText }}
          </AppButton>
          <AppButton
            :variant="confirmBtnVariant"
            :loading="props.loading"
            @click="emit('confirm')"
          >
            {{ props.confirmText }}
          </AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  animation: fadeIn 0.15s ease-out;
}

.confirm-modal {
  background: #ffffff;
  border-radius: 16px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid #e2e8f0;
}

.modal-head {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.head-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;

  &.icon-danger {
    background-color: #fee2e2;
  }

  &.icon-warning {
    background-color: #fef3c7;
  }

  &.icon-success {
    background-color: #d1fae5;
  }

  &.icon-primary {
    background-color: #e0e7ff;
  }
}

.head-text {
  flex: 1;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.close-cross-btn {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: #94a3b8;
  padding: 0.25rem;
  border-radius: 6px;
  line-height: 1;
  transition: all 0.15s;

  &:hover {
    background-color: #f1f5f9;
    color: #0f172a;
  }
}

.modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.modal-message {
  font-size: 0.92rem;
  line-height: 1.5;
  color: #334155;
  margin: 0;
}

.details-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.4;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
