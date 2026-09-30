export interface HelpSettingsDto {
  message: string
  fallback_phone: string
  fallback_email?: string
}

export type UpdateHelpSettingsDto = HelpSettingsDto

export interface HelpContactDto {
  name: string
  phone?: string
  email?: string
}
