import { httpClient, type CreateUserDto } from '@/api'
import type { UserAccount } from '@/shared/types'
import { toUserAccount } from '../adapters/admin.adapter'

export class AdminService {
  async fetchUsers(): Promise<UserAccount[]> {
    const dtos = await httpClient.getUsers()
    return dtos.map(toUserAccount)
  }

  async createUser(payload: CreateUserDto): Promise<UserAccount> {
    const dto = await httpClient.createUser(payload)
    return toUserAccount(dto)
  }

  async deleteUser(userId: string): Promise<void> {
    await httpClient.deleteUser(userId)
  }

  async restoreUser(userId: string): Promise<void> {
    await httpClient.restoreUser(userId)
  }
}

export const adminService = new AdminService()
