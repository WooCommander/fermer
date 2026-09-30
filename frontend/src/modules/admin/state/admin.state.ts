import { reactive, computed } from 'vue'
import type { UserAccount } from '@/shared/types'

interface AdminState {
  users: UserAccount[]
  isLoading: boolean
  error: string | null
}

const state = reactive<AdminState>({
  users: [],
  isLoading: false,
  error: null,
})

export const useAdminState = () => ({
  state: computed(() => state),
  setUsers(users: UserAccount[]) {
    state.users = users
  },
  addUser(user: UserAccount) {
    state.users.push(user)
  },
  removeUser(userId: string) {
    state.users = state.users.filter((u) => u.id !== userId)
  },
  setLoading(loading: boolean) {
    state.isLoading = loading
  },
  setError(err: string | null) {
    state.error = err
  },
})
