import type { FarmDto } from '@/api'
import type { FarmProfile } from '@/shared/types'

export function toFarmProfile(dto: FarmDto): FarmProfile {
  return {
    id: dto.id,
    name: dto.name,
    shortName: dto.short_name,
    fiscalCode: dto.fiscal_code,
    district: dto.district,
    settlement: dto.settlement,
    phone: dto.phone,
    contactPerson: dto.contact_person,
    activityType: dto.activity_type,
    assignedForms: [...dto.assigned_forms],
  }
}
