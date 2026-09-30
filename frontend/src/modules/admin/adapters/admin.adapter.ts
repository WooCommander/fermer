import type { UserDto } from '@/api'
import type { UserAccount } from '@/shared/types'

export function toUserAccount(dto: UserDto): UserAccount {
  return {
    id: dto.id,
    login: dto.login,
    name: dto.name,
    role: dto.role,
    phone: dto.phone,
    email: dto.email,
    district: dto.district,
    farmId: dto.farm_id,
    createdAt: dto.created_at,
    deletedAt: dto.deleted_at ?? null,
  }
}
