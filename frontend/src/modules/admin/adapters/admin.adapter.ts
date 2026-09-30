import type { AuditEntryDto, UserDto } from '@/api'
import type { AuditEntry, UserAccount } from '@/shared/types'

export function toUserAccount(dto: UserDto): UserAccount {
  return {
    id: dto.id,
    login: dto.login,
    name: dto.name,
    role: dto.role,
    phone: dto.phone,
    email: dto.email,
    district: dto.district,
    districts: dto.districts ?? (dto.district ? [dto.district] : []),
    farmId: dto.farm_id,
    createdAt: dto.created_at,
    deletedAt: dto.deleted_at ?? null,
  }
}

export function toAuditEntry(dto: AuditEntryDto): AuditEntry {
  return {
    id: dto.id,
    createdAt: dto.created_at,
    actorId: dto.actor_id,
    actorName: dto.actor_name,
    actorRole: dto.actor_role,
    action: dto.action,
    objectType: dto.object_type,
    objectId: dto.object_id,
    objectLabel: dto.object_label,
    before: dto.before,
    after: dto.after,
    details: dto.details,
  }
}
