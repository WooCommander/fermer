<script setup lang="ts">
import { ref, computed } from 'vue'
import type { UserAccount, UserRole, ActivityType } from '@/shared/types'
import { AppButton, AppInput, AppAlert, AppConfirmDialog } from '@/shared/ui'
import type { CreateUserDto } from '@/api'

interface Props {
  users: UserAccount[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  users: () => [],
  isLoading: false,
})

const emit = defineEmits<{
  (e: 'createUser', payload: CreateUserDto): void
  (e: 'deleteUser', userId: string): void
  (e: 'restoreUser', userId: string): void
}>()

const activeTab = ref<'all' | UserRole | 'deactivated'>('all')
const showCreateModal = ref(false)
const modalRole = ref<'specialist' | 'farmer'>('specialist')
const userToDelete = ref<UserAccount | null>(null)

function requestDeleteUser(user: UserAccount): void {
  userToDelete.value = user
}

function confirmDelete(): void {
  if (userToDelete.value) {
    emit('deleteUser', userToDelete.value.id)
    userToDelete.value = null
  }
}

function onRestoreUser(user: UserAccount): void {
  emit('restoreUser', user.id)
}

// Form fields
const formName = ref('')
const formLogin = ref('')
const formPhone = ref('')
const formEmail = ref('')
const formDistrict = ref('Слободзейский район')
const formFarmName = ref('')
const formFiscalCode = ref('')
const formActivityType = ref<ActivityType>('crops')
const formAssignedForms = ref<string[]>(['1-фермер'])
const formError = ref('')

const districtsList = [
  'Слободзейский район',
  'Григориопольский район',
  'Дубоссарский район',
  'Рыбницкий район',
  'Каменский район',
  'г. Тирасполь',
  'г. Бендеры',
  'Центральный аппарат (Все районы)',
]

const stats = computed(() => {
  const activeUsers = props.users.filter((u) => !u.deletedAt)
  const total = activeUsers.length
  const specialists = activeUsers.filter((u) => u.role === 'specialist').length
  const farmers = activeUsers.filter((u) => u.role === 'farmer').length
  const admins = activeUsers.filter((u) => u.role === 'admin').length
  const deactivated = props.users.filter((u) => !!u.deletedAt).length
  return { total, specialists, farmers, admins, deactivated }
})

const filteredUsers = computed(() => {
  if (activeTab.value === 'deactivated') {
    return props.users.filter((u) => !!u.deletedAt)
  }
  const activeUsers = props.users.filter((u) => !u.deletedAt)
  if (activeTab.value === 'all') return activeUsers
  return activeUsers.filter((u) => u.role === activeTab.value)
})

function openCreateModal(role: 'specialist' | 'farmer'): void {
  modalRole.value = role
  formError.value = ''
  formName.value = ''
  formLogin.value = ''
  formPhone.value = ''
  formEmail.value = ''
  formDistrict.value = 'Слободзейский район'
  formFarmName.value = ''
  formFiscalCode.value = ''
  formActivityType.value = 'crops'
  formAssignedForms.value = ['1-фермер']
  showCreateModal.value = true
}

function handleFormToggle(code: string): void {
  const idx = formAssignedForms.value.indexOf(code)
  if (idx === -1) {
    formAssignedForms.value.push(code)
  } else {
    formAssignedForms.value.splice(idx, 1)
  }
}

function onSubmitCreate(): void {
  formError.value = ''
  if (!formName.value.trim() || !formLogin.value.trim()) {
    formError.value = 'Заполните обязательные поля: ФИО/Название и Логин'
    return
  }

  const payload: CreateUserDto = {
    name: formName.value.trim(),
    login: formLogin.value.trim(),
    role: modalRole.value,
    phone: formPhone.value.trim(),
    email: formEmail.value.trim(),
    district: formDistrict.value,
  }

  if (modalRole.value === 'farmer') {
    payload.farm_name = formFarmName.value.trim() || formName.value.trim()
    payload.fiscal_code = formFiscalCode.value.trim() || formLogin.value.trim()
    payload.activity_type = formActivityType.value
    payload.assigned_forms = [...formAssignedForms.value]
  }

  emit('createUser', payload)
  showCreateModal.value = false
}
</script>

<template>
  <div class="admin-management-view">
    <!-- Сводка пользователей -->
    <div class="admin-stats-grid">
      <div class="stat-card">
        <span class="stat-num">{{ stats.total }}</span>
        <span class="stat-label">Активных пользователей</span>
      </div>
      <div class="stat-card highlight-spec">
        <span class="stat-num">{{ stats.specialists }}</span>
        <span class="stat-label">Специалистов статистики</span>
      </div>
      <div class="stat-card highlight-farmer">
        <span class="stat-num">{{ stats.farmers }}</span>
        <span class="stat-label">Фермеров и КФХ</span>
      </div>
      <div class="stat-card highlight-admin">
        <span class="stat-num">{{ stats.admins }}</span>
        <span class="stat-label">Администраторов</span>
      </div>
      <div class="stat-card highlight-archived">
        <span class="stat-num">{{ stats.deactivated }}</span>
        <span class="stat-label">В архиве / Деактивировано</span>
      </div>
    </div>

    <!-- Заголовок и кнопки создания -->
    <div class="admin-actions-bar">
      <div class="tabs-group">
        <button
          type="button"
          :class="['tab-btn', { active: activeTab === 'all' }]"
          @click="activeTab = 'all'"
        >
          Все активные ({{ stats.total }})
        </button>
        <button
          type="button"
          :class="['tab-btn', { active: activeTab === 'specialist' }]"
          @click="activeTab = 'specialist'"
        >
          Специалисты ({{ stats.specialists }})
        </button>
        <button
          type="button"
          :class="['tab-btn', { active: activeTab === 'farmer' }]"
          @click="activeTab = 'farmer'"
        >
          Фермеры ({{ stats.farmers }})
        </button>
        <button
          type="button"
          :class="['tab-btn', { active: activeTab === 'admin' }]"
          @click="activeTab = 'admin'"
        >
          Администраторы ({{ stats.admins }})
        </button>
        <button
          type="button"
          :class="['tab-btn tab-archived', { active: activeTab === 'deactivated' }]"
          @click="activeTab = 'deactivated'"
        >
          🗄 Архив / Деактивированные ({{ stats.deactivated }})
        </button>
      </div>

      <div class="create-buttons">
        <AppButton size="sm" variant="secondary" @click="openCreateModal('specialist')">
          ➕ Добавить специалиста
        </AppButton>
        <AppButton size="sm" variant="primary" @click="openCreateModal('farmer')">
          ➕ Добавить хозяйство / фермера
        </AppButton>
      </div>
    </div>

    <!-- Таблица пользователей -->
    <div class="table-card">
      <table class="users-table">
        <thead>
          <tr>
            <th>ФИО / Наименование</th>
            <th>Логин / Код</th>
            <th>Роль</th>
            <th>Район / Отдел</th>
            <th>Контакты</th>
            <th>Статус / Регистрация</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in filteredUsers"
            :key="user.id"
            :class="{ 'row-deactivated': !!user.deletedAt }"
          >
            <td>
              <div class="user-cell">
                <b>{{ user.name }}</b>
                <small v-if="user.email">{{ user.email }}</small>
              </div>
            </td>
            <td><code>{{ user.login }}</code></td>
            <td>
              <span :class="['role-tag', `role-${user.role}`]">
                {{ user.role === 'admin' ? 'Администратор' : user.role === 'specialist' ? 'Специалист' : 'Фермер' }}
              </span>
            </td>
            <td>{{ user.district || '—' }}</td>
            <td>{{ user.phone || '—' }}</td>
            <td>
              <div class="status-cell">
                <span v-if="user.deletedAt" class="deactivated-badge">
                  🗄 Деактивирован {{ new Date(user.deletedAt).toLocaleDateString('ru-RU') }}
                </span>
                <span v-else class="active-badge">
                  Рег: {{ new Date(user.createdAt).toLocaleDateString('ru-RU') }}
                </span>
              </div>
            </td>
            <td>
              <!-- Если пользователь деактивирован — кнопка восстановления -->
              <button
                v-if="user.deletedAt"
                type="button"
                class="restore-action-btn"
                title="Восстановить учетную запись"
                @click="onRestoreUser(user)"
              >
                🔄 Восстановить
              </button>
              <!-- Если пользователь активен (и не суперадмин) — кнопка деактивации в архив -->
              <button
                v-else-if="user.role !== 'admin'"
                type="button"
                class="del-btn"
                title="Деактивировать и перенести в архив"
                @click="requestDeleteUser(user)"
              >
                🗄 В архив
              </button>
              <span v-else class="admin-shield" title="Системная учетная запись">🔒</span>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="7" class="empty-cell">
              {{ activeTab === 'deactivated' ? 'В архиве нет деактивированных пользователей' : 'Пользователи не найдены' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модальное окно добавления пользователя -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ modalRole === 'specialist' ? 'Регистрация специалиста статистики' : 'Регистрация нового хозяйства (фермера)' }}</h3>
          <button type="button" class="close-btn" @click="showCreateModal = false">✕</button>
        </div>

        <div class="modal-body">
          <AppAlert v-if="formError" variant="error" title="Ошибка">{{ formError }}</AppAlert>

          <AppInput
            v-model="formName"
            :label="modalRole === 'specialist' ? 'ФИО специалиста *' : 'Официальное наименование хозяйства (или ФИО главы КФХ) *'"
            placeholder="Например: Иванов Петр Сергеевич"
          />

          <AppInput
            v-model="formLogin"
            :label="modalRole === 'specialist' ? 'Логин для входа *' : 'Фискальный код (логин) *'"
            placeholder="Например: 0200045123 или stat_rybnitsa"
          />

          <div class="form-row-2">
            <AppInput
              v-model="formPhone"
              label="Номер телефона"
              placeholder="+373 777 00-000"
            />
            <AppInput
              v-model="formEmail"
              label="Email"
              placeholder="user@domain.com"
            />
          </div>

          <div class="form-field-group">
            <label>Район / Подразделение:</label>
            <select v-model="formDistrict" class="custom-select">
              <option v-for="d in districtsList" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>

          <!-- Специфика фермера -->
          <template v-if="modalRole === 'farmer'">
            <div class="form-field-group">
              <label>Направление деятельности:</label>
              <select v-model="formActivityType" class="custom-select">
                <option value="crops">Растениеводство</option>
                <option value="livestock">Животноводство</option>
                <option value="mixed">Растениеводство + Животноводство</option>
              </select>
            </div>

            <div class="form-field-group">
              <label>Назначенные формы отчетности:</label>
              <div class="forms-checkboxes">
                <label class="cb-label">
                  <input
                    type="checkbox"
                    :checked="formAssignedForms.includes('1-фермер')"
                    @change="handleFormToggle('1-фермер')"
                  />
                  <span>Форма № 1-фермер (Итоги сева)</span>
                </label>
                <label class="cb-label">
                  <input
                    type="checkbox"
                    :checked="formAssignedForms.includes('2-фермер')"
                    @change="handleFormToggle('2-фермер')"
                  />
                  <span>Форма № 2-фермер (Сбор урожая)</span>
                </label>
                <label class="cb-label">
                  <input
                    type="checkbox"
                    :checked="formAssignedForms.includes('3-фермер')"
                    @change="handleFormToggle('3-фермер')"
                  />
                  <span>Форма № 3-фермер (Животноводство)</span>
                </label>
              </div>
            </div>
          </template>
        </div>

        <div class="modal-footer">
          <AppButton variant="secondary" @click="showCreateModal = false">Отмена</AppButton>
          <AppButton variant="primary" @click="onSubmitCreate">
            Создать учетную запись
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Диалог подтверждения деактивац�  &.highlight-admin {
    border-left: 4px solid #8b5cf6;
    .stat-num { color: #7c3aed; }
  }

  &.highlight-archived {
    border-left: 4px solid #94a3b8;
    .stat-num { color: #64748b; }
  }
}

.admin-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.tabs-group {
  display: flex;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.25rem;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #0f172a;
  }

  &.active {
    background: #f1f5f9;
    color: #0f172a;
  }

  &.tab-archived.active {
    background: #f8fafc;
    color: #475569;
    border: 1px solid #cbd5e1;
  }
}

.create-buttons {
  display: flex;
  gap: 0.75rem;
}

.table-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;

  th {
    background: #f8fafc;
    padding: 0.75rem 1rem;
    font-weight: 700;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
  }

  td {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    vertical-align: middle;
  }

  tr:hover td {
    background: #f8fafc;
  }

  tr.row-deactivated td {
    background: #fafafa;
    opacity: 0.85;
  }
}

.status-cell {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.deactivated-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  display: inline-block;
}

.active-badge {
  font-size: 0.78rem;
  color: #64748b;
}

.restore-action-btn {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #dbeafe;
    color: #1e40af;
  }
}

.admin-shield {
  font-size: 1rem;
  opacity: 0.6;
}

.del-btn {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #e11d48;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #ffe4e6;
    color: #be123c;
  }
}er: none;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #0f172a;
  }

  &.active {
    background: #f1f5f9;
    color: #0f172a;
  }
}

.create-buttons {
  display: flex;
  gap: 0.75rem;
}

.table-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;

  th {
    background: #f8fafc;
    padding: 0.75rem 1rem;
    font-weight: 700;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
  }

  td {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    vertical-align: middle;
  }

  tr:hover td {
    background: #f8fafc;
  }
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  small {
    color: #64748b;
    font-size: 0.78rem;
  }
}

code {
  background: #f1f5f9;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-family: monospace;
  font-weight: 700;
  font-size: 0.82rem;
}

.role-tag {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;

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

.del-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  opacity: 0.6;

  &:hover {
    opacity: 1;
    background: #fee2e2;
  }
}

.empty-cell {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1rem;
}

.modal-content {
  background: #ffffff;
  border-radius: 16px;
  max-width: 560px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;

  h3 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
  }
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #64748b;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 75vh;
  overflow-y: auto;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-field-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #334155;
  }
}

.custom-select {
  padding: 0.65rem 0.85rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.92rem;
  font-family: inherit;
  outline: none;
  background: #ffffff;

  &:focus {
    border-color: #10b981;
  }
}

.forms-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.cb-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;

  input {
    width: 16px;
    height: 16px;
    accent-color: #10b981;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}
</style>
