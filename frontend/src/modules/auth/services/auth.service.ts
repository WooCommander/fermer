import { httpClient } from '@/api'
import type { FarmProfile } from '@/shared/types'
import { toFarmProfile } from '../adapters/auth.adapter'

export class AuthService {
  async fetchFarms(): Promise<FarmProfile[]> {
    const dtos = await httpClient.getFarms()
    return dtos.map(toFarmProfile)
  }
}

export const authService = new AuthService()
