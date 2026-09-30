import { reactive, computed } from 'vue'

export type AppRole = 'farmer' | 'inspector'

interface AppState {
  currentRole: AppRole
  isOnline: boolean
}

const state = reactive<AppState>({
  currentRole: 'farmer',
  isOnline: true,
})

export const useAppState = () => ({
  state: computed(() => state),
  setRole(role: AppRole) {
    state.currentRole = role
  },
  setOnline(online: boolean) {
    state.isOnline = online
  },
})
