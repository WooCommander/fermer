import { reactive, computed } from 'vue'
import type { FarmProfile, UserAccount } from '@/shared/types'

interface AuthState {
  currentUser: UserAccount | null
  currentFarm: FarmProfile | null
  farms: FarmProfile[]
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const state = reactive<AuthState>({
  currentUser: null,
  currentFarm: null,
  farms: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,
})

export const useAuthState = () => ({
  state: computed(() => state),
  setCurrentUser(user: UserAccount | null) {
    state.currentUser = user
    state.isAuthenticated = !!user
  },
  setCurrentFarm(farm: FarmProfile | null) {
    state.currentFarm = farm
  },
  setFarms(farms: FarmProfile[]) {
    state.farms = farms
  },
  setLoading(loading: boolean) {
    state.isLoading = loading
  },
  setError(err: string | null) {
    state.error = err
  },
})
