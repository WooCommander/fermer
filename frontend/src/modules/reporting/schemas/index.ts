import type { FormSchema } from '@/shared/types'
import { form1FarmerSchema } from './form-1-farmer.schema'
import { form2FarmerSchema } from './form-2-farmer.schema'
import { form3FarmerSchema } from './form-3-farmer.schema'

export * from './form-1-farmer.schema'
export * from './form-2-farmer.schema'
export * from './form-3-farmer.schema'

export const registeredSchemas: Record<string, FormSchema> = {
  '1-фермер': form1FarmerSchema,
  '2-фермер': form2FarmerSchema,
  '3-фермер': form3FarmerSchema,
}

export function getFormSchemaByCode(formCode: string): FormSchema {
  const schema = registeredSchemas[formCode]
  if (!schema) {
    return form1FarmerSchema
  }
  return schema
}
