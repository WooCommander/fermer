import { httpClient } from '@/api'
import type { FarmProfile } from '@/shared/types'
import { toFarmProfile } from '../adapters/auth.adapter'

export class AuthService {
  async fetchFarms(): Promise<FarmProfile[]> {
    const dtos = await httpClient.getFarms()
    return dtos.map(toFarmProfile)
  }

  async updateFarmContacts(farmId: string, contacts: { phone: string; contactPerson: string }): Promise<FarmProfile> {
    const dto = await httpClient.updateFarmContacts(farmId, { phone: contacts.phone, contact_person: contacts.contactPerson })
    return toFarmProfile(dto)
  }
}

export const authService = new AuthService()
