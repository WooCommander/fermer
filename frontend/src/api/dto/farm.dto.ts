export interface FarmDto {
  id: string
  name: string
  short_name: string
  fiscal_code: string
  district: string
  settlement: string
  phone: string
  contact_person: string
  activity_type: 'crops' | 'livestock' | 'mixed'
  assigned_forms: string[]
  deleted_at?: string | null
}
