import { reactive, computed } from 'vue'
import type { AuditEntry, UserAccount } from '@/shared/types'

interface AdminState {
  users: UserAccount[]
  auditEntries: AuditEntry[]
  isLoading: boolean
  error: string | null
}

const state = reactive<AdminState>({
  users: [],
  auditEntries: [],
  isLoading: false,
  error: null,
})

export const useAdminState = () => ({
  state: computed(() => state),
  setUsers(users: UserAccount[]) {
    state.users = users
  },
  setAuditEntries(entries: AuditEntry[]) {
    state.auditEntries = entries
  },
  addUser(user: UserAccount) {
    state.users.push(user)
  },
  updateUser(user: UserAccount) {
    const userIndex = state.users.findIndex((item) => item.id === user.id)
    if (userIndex !== -1) {
      state.users[userIndex] = user
    }
  },
  markUserDeleted(userId: string, deletedAt: string | null) {
    const user = state.users.find((u) => u.id === userId)
    if (user) {
      user.deletedAt = deletedAt
    }
  },
  removeUser(userId: string) {
    const user = state.users.find((u) => u.id === userId)
    if (user) {
      user.deletedAt = new Date().toISOString()
    }
  },
  setLoading(loading: boolean) {
    state.isLoading = loading
  },
  setError(err: string | null) {
    state.error = err
  },
})
